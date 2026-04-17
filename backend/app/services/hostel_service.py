"""
Hostel Management Service
=========================
Core business logic for the hostel booking system:
  - Template management & bulk room provisioning
  - Concurrency-safe bed locking (SELECT FOR UPDATE NOWAIT)
  - Redis-cached availability counters
  - Gate pass approval workflow
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text, update
from sqlalchemy.exc import OperationalError

from app.models.hostel import (
    RoomTemplate, Hostel, Room, Bed, Allocation, GatePass,
)
from app.models.core import User
from app.core.exceptions import DomainException

logger = logging.getLogger("acadmix.hostel")

# Try to import Redis (optional — gracefully degrades)
try:
    import redis as pyredis
    from app.core.config import settings
    _redis = pyredis.from_url(settings.REDIS_URL) if settings.REDIS_URL else None
except Exception:
    _redis = None


class HostelService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ═══════════════════════════════════════════════════════════════════════════
    # TEMPLATES
    # ═══════════════════════════════════════════════════════════════════════════

    async def list_templates(self, college_id: str) -> List[dict]:
        """List all templates accessible to this college (global + college-specific)."""
        result = await self.db.execute(
            select(RoomTemplate).where(
                RoomTemplate.is_deleted == False,
                (RoomTemplate.college_id == college_id) | (RoomTemplate.college_id == None),
            )
        )
        templates = result.scalars().all()
        return [
            {
                "id": t.id,
                "name": t.name,
                "total_capacity": t.total_capacity,
                "grid_rows": t.grid_rows,
                "grid_cols": t.grid_cols,
                "bed_layout": t.bed_layout,
                "meta_data": t.meta_data or {},
                "is_global": t.college_id is None,
            }
            for t in templates
        ]

    async def create_template(self, college_id: Optional[str], data: dict) -> dict:
        beds_data = data.get("beds", [])
        tpl = RoomTemplate(
            college_id=college_id,
            name=data["name"],
            total_capacity=data["total_capacity"],
            grid_rows=data["grid_rows"],
            grid_cols=data["grid_cols"],
            bed_layout=[b if isinstance(b, dict) else b.model_dump() for b in beds_data],
            meta_data=data.get("meta_data") or {},
        )
        self.db.add(tpl)
        await self.db.flush()
        return {"id": tpl.id, "name": tpl.name}

    # ═══════════════════════════════════════════════════════════════════════════
    # HOSTELS (BUILDINGS)
    # ═══════════════════════════════════════════════════════════════════════════

    async def list_hostels(self, college_id: str) -> List[dict]:
        result = await self.db.execute(
            select(Hostel).where(
                Hostel.college_id == college_id,
                Hostel.is_deleted == False,
            )
        )
        hostels = result.scalars().all()
        out = []
        for h in hostels:
            avail = self._get_cached_hostel_availability(h.id)
            out.append({
                "id": h.id,
                "name": h.name,
                "gender_type": h.gender_type,
                "total_floors": h.total_floors,
                "total_capacity": h.total_capacity,
                "warden_id": h.warden_id,
                "available_beds": avail,
            })
        return out

    async def get_available_hostels(self, college_id: str, student_gender: Optional[str] = None) -> List[dict]:
        """Student-facing: returns hostels filtered by gender compatibility."""
        query = select(Hostel).where(
            Hostel.college_id == college_id,
            Hostel.is_deleted == False,
        )
        if student_gender:
            # Students can see their own gender hostels + coed
            query = query.where(
                (Hostel.gender_type == student_gender) | (Hostel.gender_type == "coed")
            )
        result = await self.db.execute(query)
        hostels = result.scalars().all()

        out = []
        for h in hostels:
            avail = await self._compute_hostel_availability(h.id)
            out.append({
                "id": h.id,
                "name": h.name,
                "gender_type": h.gender_type,
                "total_floors": h.total_floors,
                "total_capacity": h.total_capacity,
                "available_beds": avail["available"],
                "premium_beds": avail["premium_available"],
                "total_beds": avail["total"],
            })
        return out

    async def create_hostel(self, college_id: str, data: dict) -> dict:
        hostel = Hostel(
            college_id=college_id,
            name=data["name"],
            gender_type=data.get("gender_type", "coed"),
            total_floors=data.get("total_floors", 1),
            warden_id=data.get("warden_id"),
            meta_data=data.get("meta_data") or {},
        )
        self.db.add(hostel)
        await self.db.flush()
        return {"id": hostel.id, "name": hostel.name}

    # ═══════════════════════════════════════════════════════════════════════════
    # ROOMS & BULK PROVISIONING
    # ═══════════════════════════════════════════════════════════════════════════

    async def get_rooms_by_floor(self, hostel_id: str, college_id: str, floor: Optional[int] = None) -> List[dict]:
        """Returns rooms grouped by floor with availability counts."""
        query = select(Room).where(
            Room.hostel_id == hostel_id,
            Room.college_id == college_id,
            Room.is_deleted == False,
        )
        if floor is not None:
            query = query.where(Room.floor == floor)
        query = query.order_by(Room.floor, Room.room_number)

        result = await self.db.execute(query)
        rooms = result.scalars().all()

        out = []
        for r in rooms:
            # Get per-room availability
            counts = await self._get_room_bed_counts(r.id)
            tpl_name = None
            if r.template_id:
                tpl_q = await self.db.execute(
                    select(RoomTemplate.name).where(RoomTemplate.id == r.template_id)
                )
                tpl_row = tpl_q.first()
                tpl_name = tpl_row[0] if tpl_row else None

            out.append({
                "id": r.id,
                "room_number": r.room_number,
                "floor": r.floor,
                "capacity": r.capacity,
                "available_count": counts["available"],
                "premium_count": counts["premium_available"],
                "template_name": tpl_name,
                "meta_data": r.meta_data or {},
            })
        return out

    async def bulk_create_rooms(self, hostel_id: str, college_id: str, data: dict) -> dict:
        """
        Generate rooms + beds from a template across a range of floors.
        e.g. floor_start=1, floor_end=5, rooms_per_floor=10, prefix="R"
        → R101..R110, R201..R210, ... R501..R510
        """
        tpl_q = await self.db.execute(
            select(RoomTemplate).where(RoomTemplate.id == data["template_id"])
        )
        tpl = tpl_q.scalars().first()
        if not tpl:
            raise DomainException("Room template not found", status_code=404)

        prefix = data.get("room_number_prefix", "R")
        rooms_per_floor = data.get("rooms_per_floor", 10)
        floor_start = data.get("floor_start", 1)
        floor_end = data.get("floor_end", 1)

        created_rooms = 0
        created_beds = 0

        for floor_num in range(floor_start, floor_end + 1):
            for room_idx in range(1, rooms_per_floor + 1):
                room_number = f"{prefix}{floor_num}{room_idx:02d}"

                room = Room(
                    college_id=college_id,
                    hostel_id=hostel_id,
                    template_id=tpl.id,
                    room_number=room_number,
                    floor=floor_num,
                    capacity=tpl.total_capacity,
                )
                self.db.add(room)
                await self.db.flush()
                created_rooms += 1

                # Clone beds from template
                for bed_def in tpl.bed_layout:
                    bed = Bed(
                        college_id=college_id,
                        room_id=room.id,
                        bed_identifier=bed_def["identifier"],
                        grid_row=bed_def["row"],
                        grid_col=bed_def["col"],
                        category=bed_def.get("category", "Standard"),
                        is_premium=bed_def.get("is_premium", False),
                        selection_fee=bed_def.get("base_fee", 0.0),
                        status="AVAILABLE",
                    )
                    self.db.add(bed)
                    created_beds += 1

        # Update hostel total capacity
        hostel_q = await self.db.execute(select(Hostel).where(Hostel.id == hostel_id))
        hostel = hostel_q.scalars().first()
        if hostel:
            hostel.total_capacity = (hostel.total_capacity or 0) + created_beds

        return {"rooms_created": created_rooms, "beds_created": created_beds}

    # ═══════════════════════════════════════════════════════════════════════════
    # BED GRID — The "Sleeper Bus" View
    # ═══════════════════════════════════════════════════════════════════════════

    async def get_room_grid(self, room_id: str, college_id: str) -> dict:
        """Returns the full CSS-grid layout for a room with live bed statuses."""
        room_q = await self.db.execute(
            select(Room).where(Room.id == room_id, Room.college_id == college_id)
        )
        room = room_q.scalars().first()
        if not room:
            raise DomainException("Room not found", status_code=404)

        # Get template grid dimensions
        grid_rows, grid_cols = 2, 2  # defaults
        if room.template_id:
            tpl_q = await self.db.execute(
                select(RoomTemplate).where(RoomTemplate.id == room.template_id)
            )
            tpl = tpl_q.scalars().first()
            if tpl:
                grid_rows = tpl.grid_rows
                grid_cols = tpl.grid_cols

        # Get hostel name
        hostel_q = await self.db.execute(select(Hostel.name).where(Hostel.id == room.hostel_id))
        hostel_name = hostel_q.scalar() or "Unknown"

        # Fetch all beds
        beds_q = await self.db.execute(
            select(Bed).where(
                Bed.room_id == room_id,
                Bed.college_id == college_id,
                Bed.is_deleted == False,
            ).order_by(Bed.grid_row, Bed.grid_col)
        )
        beds = beds_q.scalars().all()

        # Get template metadata for room decorators
        tpl_metadata = {}
        if tpl:
            tpl_metadata = tpl.meta_data or {}

        return {
            "room_id": room.id,
            "room_number": room.room_number,
            "hostel_name": hostel_name,
            "grid_rows": grid_rows,
            "grid_cols": grid_cols,
            "meta_data": {**(room.meta_data or {}), **tpl_metadata},
            "beds": [
                {
                    "id": b.id,
                    "bed_identifier": b.bed_identifier,
                    "grid_row": b.grid_row,
                    "grid_col": b.grid_col,
                    "category": b.category,
                    "is_premium": b.is_premium,
                    "selection_fee": b.selection_fee,
                    "status": b.status,
                }
                for b in beds
            ],
        }

    # ═══════════════════════════════════════════════════════════════════════════
    # BED LOCKING — Concurrency-safe via FOR UPDATE NOWAIT
    # ═══════════════════════════════════════════════════════════════════════════

    async def lock_bed(self, bed_id: str, student_id: str, college_id: str) -> dict:
        """
        Atomically lock a bed for 10 minutes. Uses SELECT FOR UPDATE NOWAIT
        to fail immediately if another transaction holds the row.
        """
        try:
            row = await self.db.execute(
                text("""
                    SELECT id, room_id, selection_fee, is_premium, bed_identifier
                    FROM beds
                    WHERE id = :bid AND status = 'AVAILABLE' AND college_id = :cid
                      AND is_deleted = false
                    FOR UPDATE NOWAIT
                """),
                {"bid": bed_id, "cid": college_id},
            )
            bed = row.first()
        except OperationalError:
            # Another transaction holds the lock — bed is being booked
            raise DomainException("This bed is currently being booked by another student. Please try a different bed.", status_code=409)

        if not bed:
            raise DomainException("Bed is no longer available", status_code=409)

        # Check if student already has an active allocation this year
        current_year = str(datetime.now(timezone.utc).year)
        existing = await self.db.execute(
            select(Allocation).where(
                Allocation.student_id == student_id,
                Allocation.academic_year == current_year,
                Allocation.status == "active",
                Allocation.college_id == college_id,
                Allocation.is_deleted == False,
            )
        )
        if existing.scalars().first():
            raise DomainException("You already have an active hostel allocation for this academic year", status_code=409)

        # Perform the lock
        await self.db.execute(
            text("""
                UPDATE beds SET status = 'LOCKED', locked_at = NOW(), locked_by = :sid
                WHERE id = :bid
            """),
            {"sid": student_id, "bid": bed_id},
        )

        expires = datetime.now(timezone.utc) + timedelta(minutes=10)

        # Decrement Redis counter (best-effort)
        self._decr_room_availability(bed.room_id)

        return {
            "bed_id": bed_id,
            "bed_identifier": bed.bed_identifier,
            "selection_fee": float(bed.selection_fee),
            "is_premium": bed.is_premium,
            "lock_expires_at": expires.isoformat(),
        }

    async def confirm_booking(self, bed_id: str, student_id: str, college_id: str, payment_reference: str = "") -> dict:
        """Finalize the booking after payment is confirmed."""
        bed_q = await self.db.execute(
            select(Bed).where(
                Bed.id == bed_id,
                Bed.status == "LOCKED",
                Bed.locked_by == student_id,
                Bed.college_id == college_id,
                Bed.is_deleted == False,
            )
        )
        bed = bed_q.scalars().first()
        if not bed:
            raise DomainException("No valid lock found. The lock may have expired.", status_code=409)

        # Update bed status
        bed.status = "BOOKED"
        bed.locked_at = None
        bed.locked_by = None

        # Create allocation
        current_year = str(datetime.now(timezone.utc).year)
        allocation = Allocation(
            college_id=college_id,
            student_id=student_id,
            bed_id=bed.id,
            room_id=bed.room_id,
            hostel_id=(await self._get_hostel_id_for_room(bed.room_id)),
            academic_year=current_year,
            status="active",
            selection_fee_paid=bed.selection_fee if bed.is_premium else 0.0,
            payment_reference=payment_reference,
        )
        self.db.add(allocation)
        await self.db.flush()

        return {
            "allocation_id": allocation.id,
            "bed_identifier": bed.bed_identifier,
            "room_id": bed.room_id,
            "message": "Booking confirmed successfully!",
        }

    async def get_my_allocation(self, student_id: str, college_id: str) -> Optional[dict]:
        """Get the current active allocation for a student."""
        result = await self.db.execute(
            select(Allocation).where(
                Allocation.student_id == student_id,
                Allocation.college_id == college_id,
                Allocation.status == "active",
                Allocation.is_deleted == False,
            ).order_by(Allocation.allocated_at.desc())
        )
        alloc = result.scalars().first()
        if not alloc:
            return None

        # Fetch related info
        bed_q = await self.db.execute(select(Bed).where(Bed.id == alloc.bed_id))
        bed = bed_q.scalars().first()
        room_q = await self.db.execute(select(Room).where(Room.id == alloc.room_id))
        room = room_q.scalars().first()
        hostel_q = await self.db.execute(select(Hostel).where(Hostel.id == alloc.hostel_id))
        hostel = hostel_q.scalars().first()

        return {
            "allocation_id": alloc.id,
            "academic_year": alloc.academic_year,
            "hostel_name": hostel.name if hostel else "Unknown",
            "room_number": room.room_number if room else "Unknown",
            "bed_identifier": bed.bed_identifier if bed else "Unknown",
            "is_premium": bed.is_premium if bed else False,
            "selection_fee_paid": alloc.selection_fee_paid,
            "allocated_at": alloc.allocated_at.isoformat() if alloc.allocated_at else None,
        }

    # ═══════════════════════════════════════════════════════════════════════════
    # GATE PASSES
    # ═══════════════════════════════════════════════════════════════════════════

    async def apply_gatepass(self, student_id: str, college_id: str, data: dict) -> dict:
        # Find student's current hostel
        alloc_q = await self.db.execute(
            select(Allocation).where(
                Allocation.student_id == student_id,
                Allocation.college_id == college_id,
                Allocation.status == "active",
                Allocation.is_deleted == False,
            )
        )
        alloc = alloc_q.scalars().first()
        if not alloc:
            raise DomainException("No active hostel allocation found", status_code=400)

        gp = GatePass(
            college_id=college_id,
            student_id=student_id,
            hostel_id=alloc.hostel_id,
            reason=data["reason"],
            requested_exit=data["requested_exit"],
            expected_return=data["expected_return"],
        )
        self.db.add(gp)
        await self.db.flush()
        return {"id": gp.id, "status": "pending"}

    async def get_student_gatepasses(self, student_id: str, college_id: str) -> List[dict]:
        result = await self.db.execute(
            select(GatePass).where(
                GatePass.student_id == student_id,
                GatePass.college_id == college_id,
                GatePass.is_deleted == False,
            ).order_by(GatePass.created_at.desc())
        )
        passes = result.scalars().all()
        return [
            {
                "id": gp.id,
                "reason": gp.reason,
                "requested_exit": gp.requested_exit.isoformat() if gp.requested_exit else None,
                "expected_return": gp.expected_return.isoformat() if gp.expected_return else None,
                "actual_return": gp.actual_return.isoformat() if gp.actual_return else None,
                "approval_status": gp.approval_status,
                "remarks": gp.remarks,
                "created_at": gp.created_at.isoformat() if gp.created_at else None,
            }
            for gp in passes
        ]

    async def get_pending_gatepasses(self, hostel_id: str, college_id: str) -> List[dict]:
        """Warden view: pending gatepasses for their hostel."""
        result = await self.db.execute(
            select(GatePass, User.name).join(
                User, User.id == GatePass.student_id
            ).where(
                GatePass.hostel_id == hostel_id,
                GatePass.college_id == college_id,
                GatePass.approval_status == "pending",
                GatePass.is_deleted == False,
            ).order_by(GatePass.created_at.asc())
        )
        rows = result.all()
        return [
            {
                "id": gp.id,
                "student_id": gp.student_id,
                "student_name": name,
                "reason": gp.reason,
                "requested_exit": gp.requested_exit.isoformat() if gp.requested_exit else None,
                "expected_return": gp.expected_return.isoformat() if gp.expected_return else None,
                "approval_status": gp.approval_status,
                "created_at": gp.created_at.isoformat() if gp.created_at else None,
            }
            for gp, name in rows
        ]

    async def review_gatepass(self, gatepass_id: str, warden_id: str, college_id: str, data: dict) -> dict:
        gp_q = await self.db.execute(
            select(GatePass).where(
                GatePass.id == gatepass_id,
                GatePass.college_id == college_id,
                GatePass.approval_status == "pending",
                GatePass.is_deleted == False,
            )
        )
        gp = gp_q.scalars().first()
        if not gp:
            raise DomainException("Gate pass not found or already reviewed", status_code=404)

        action = data["action"]
        gp.approval_status = "approved" if action == "approve" else "rejected"
        gp.approved_by = warden_id
        gp.approved_at = datetime.now(timezone.utc)
        gp.remarks = data.get("remarks")

        return {"id": gp.id, "status": gp.approval_status}

    # ═══════════════════════════════════════════════════════════════════════════
    # WARDEN DASHBOARD
    # ═══════════════════════════════════════════════════════════════════════════

    async def get_warden_dashboard(self, warden_id: str, college_id: str) -> dict:
        """Aggregated dashboard for a warden's assigned hostel(s)."""
        hostels_q = await self.db.execute(
            select(Hostel).where(
                Hostel.warden_id == warden_id,
                Hostel.college_id == college_id,
                Hostel.is_deleted == False,
            )
        )
        hostels = hostels_q.scalars().all()

        if not hostels:
            return {"hostels": [], "total_beds": 0, "occupied": 0, "available": 0, "pending_gatepasses": 0}

        hostel_data = []
        total_beds = 0
        total_occupied = 0
        total_pending = 0

        for h in hostels:
            avail = await self._compute_hostel_availability(h.id)
            pending_q = await self.db.execute(
                select(func.count()).select_from(GatePass).where(
                    GatePass.hostel_id == h.id,
                    GatePass.approval_status == "pending",
                    GatePass.is_deleted == False,
                )
            )
            pending = pending_q.scalar() or 0

            hostel_data.append({
                "id": h.id,
                "name": h.name,
                "gender_type": h.gender_type,
                "total_beds": avail["total"],
                "occupied": avail["booked"],
                "available": avail["available"],
                "pending_gatepasses": pending,
            })
            total_beds += avail["total"]
            total_occupied += avail["booked"]
            total_pending += pending

        return {
            "hostels": hostel_data,
            "total_beds": total_beds,
            "occupied": total_occupied,
            "available": total_beds - total_occupied,
            "pending_gatepasses": total_pending,
        }

    # ═══════════════════════════════════════════════════════════════════════════
    # BED ADMIN OPERATIONS (Toggle premium / maintenance)
    # ═══════════════════════════════════════════════════════════════════════════

    async def toggle_bed_premium(self, bed_id: str, college_id: str, is_premium: bool, fee: float) -> dict:
        bed_q = await self.db.execute(
            select(Bed).where(Bed.id == bed_id, Bed.college_id == college_id, Bed.is_deleted == False)
        )
        bed = bed_q.scalars().first()
        if not bed:
            raise DomainException("Bed not found", status_code=404)
        bed.is_premium = is_premium
        bed.selection_fee = fee if is_premium else 0.0
        return {"id": bed.id, "is_premium": bed.is_premium, "selection_fee": bed.selection_fee}

    async def set_bed_status(self, bed_id: str, college_id: str, status: str) -> dict:
        bed_q = await self.db.execute(
            select(Bed).where(Bed.id == bed_id, Bed.college_id == college_id, Bed.is_deleted == False)
        )
        bed = bed_q.scalars().first()
        if not bed:
            raise DomainException("Bed not found", status_code=404)
        if bed.status == "BOOKED":
            raise DomainException("Cannot change status of a booked bed", status_code=409)
        bed.status = status
        return {"id": bed.id, "status": bed.status}

    # ═══════════════════════════════════════════════════════════════════════════
    # INTERNAL HELPERS
    # ═══════════════════════════════════════════════════════════════════════════

    async def _compute_hostel_availability(self, hostel_id: str) -> dict:
        """Compute live bed counts from the database."""
        result = await self.db.execute(
            select(
                func.count().label("total"),
                func.count().filter(Bed.status == "AVAILABLE").label("available"),
                func.count().filter(Bed.status == "BOOKED").label("booked"),
                func.count().filter(Bed.status == "LOCKED").label("locked"),
                func.count().filter(
                    (Bed.status == "AVAILABLE") & (Bed.is_premium == True)
                ).label("premium_available"),
            ).select_from(Bed).join(Room, Room.id == Bed.room_id).where(
                Room.hostel_id == hostel_id,
                Bed.is_deleted == False,
                Room.is_deleted == False,
            )
        )
        row = result.first()
        return {
            "total": row.total or 0,
            "available": row.available or 0,
            "booked": row.booked or 0,
            "locked": row.locked or 0,
            "premium_available": row.premium_available or 0,
        }

    async def _get_room_bed_counts(self, room_id: str) -> dict:
        result = await self.db.execute(
            select(
                func.count().label("total"),
                func.count().filter(Bed.status == "AVAILABLE").label("available"),
                func.count().filter(
                    (Bed.status == "AVAILABLE") & (Bed.is_premium == True)
                ).label("premium_available"),
            ).select_from(Bed).where(
                Bed.room_id == room_id,
                Bed.is_deleted == False,
            )
        )
        row = result.first()
        return {
            "total": row.total or 0,
            "available": row.available or 0,
            "premium_available": row.premium_available or 0,
        }

    async def _get_hostel_id_for_room(self, room_id: str) -> str:
        result = await self.db.execute(select(Room.hostel_id).where(Room.id == room_id))
        return result.scalar()

    def _get_cached_hostel_availability(self, hostel_id: str) -> int:
        """Best-effort Redis read. Falls back to -1 if unavailable."""
        if _redis:
            try:
                val = _redis.get(f"hostel:{hostel_id}:available")
                if val is not None:
                    return int(val)
            except Exception:
                pass
        return -1  # Signal to frontend: "count not cached, query DB"

    def _decr_room_availability(self, room_id: str):
        """Best-effort Redis decrement when a bed is locked."""
        if _redis:
            try:
                _redis.decr(f"room:{room_id}:available")
            except Exception:
                pass
