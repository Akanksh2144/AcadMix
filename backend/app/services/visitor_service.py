"""
Visitor Management Service
===========================
Business logic for the two-tier visitor management system.
Handles main-gate (security role) and hostel (warden role) visitors.
"""

import logging
from datetime import datetime, timezone, date, timedelta
from typing import Optional, List

from sqlalchemy import select, func, and_, or_, update, case, text, cast, Date
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.visitors import Visitor, VisitRecord
from app.models.hostel import Hostel
from app.models.core import User

logger = logging.getLogger("acadmix.visitors")


class VisitorService:
    def __init__(self, session: AsyncSession):
        self.session = session

    # ─── Visitor Identity ─────────────────────────────────────────────────────

    async def find_or_create_visitor(
        self, college_id: str, name: str, phone: str,
        visitor_type: str = "other", email: str = None,
        id_proof_type: str = None, id_proof_number: str = None,
    ) -> dict:
        """Find existing visitor by phone or create a new one."""
        result = await self.session.execute(
            select(Visitor).where(
                Visitor.college_id == college_id,
                Visitor.phone == phone,
                Visitor.is_deleted == False,
            )
        )
        visitor = result.scalars().first()

        if visitor:
            # Update name/type if changed
            if name and name != visitor.name:
                visitor.name = name
            if visitor_type and visitor_type != "other":
                visitor.visitor_type = visitor_type
            if email and not visitor.email:
                visitor.email = email
            if id_proof_type and not visitor.id_proof_type:
                visitor.id_proof_type = id_proof_type
                visitor.id_proof_number = id_proof_number
            await self.session.flush()
            return self._visitor_to_dict(visitor)

        new_visitor = Visitor(
            college_id=college_id,
            name=name,
            phone=phone,
            email=email,
            id_proof_type=id_proof_type,
            id_proof_number=id_proof_number,
            visitor_type=visitor_type,
        )
        self.session.add(new_visitor)
        await self.session.flush()
        return self._visitor_to_dict(new_visitor)

    async def search_visitors(self, college_id: str, query: str, limit: int = 20) -> list:
        """Search visitors by name or phone."""
        q = query.strip()
        if not q:
            return []

        result = await self.session.execute(
            select(Visitor).where(
                Visitor.college_id == college_id,
                Visitor.is_deleted == False,
                or_(
                    Visitor.name.ilike(f"%{q}%"),
                    Visitor.phone.ilike(f"%{q}%"),
                ),
            ).order_by(Visitor.total_visits.desc()).limit(limit)
        )
        return [self._visitor_to_dict(v) for v in result.scalars().all()]

    # ─── Check-In (Walk-in) ───────────────────────────────────────────────────

    async def check_in(self, college_id: str, user_id: str, data: dict) -> dict:
        """
        Register + check-in a walk-in visitor.
        If visitor_id is provided, use existing visitor; otherwise, create/upsert.
        """
        visitor_id = data.get("visitor_id")

        if not visitor_id:
            # Create or find visitor
            visitor = await self.find_or_create_visitor(
                college_id=college_id,
                name=data.get("visitor_name", "Unknown"),
                phone=data.get("visitor_phone", ""),
                visitor_type=data.get("visitor_type", "other"),
            )
            visitor_id = visitor["id"]

        # Increment visit count
        await self.session.execute(
            update(Visitor).where(Visitor.id == visitor_id).values(
                total_visits=Visitor.total_visits + 1
            )
        )

        now = datetime.now(timezone.utc)
        record = VisitRecord(
            college_id=college_id,
            visitor_id=visitor_id,
            gate_type=data.get("gate_type", "main_gate"),
            hostel_id=data.get("hostel_id"),
            host_name=data.get("host_name"),
            host_department=data.get("host_department"),
            purpose=data.get("purpose", "General visit"),
            visit_type="walk_in",
            status="checked_in",
            num_accompanying=data.get("num_accompanying", 0),
            vehicle_number=data.get("vehicle_number"),
            badge_number=data.get("badge_number"),
            checked_in_at=now,
            checked_in_by=user_id,
            remarks=data.get("remarks"),
        )
        self.session.add(record)
        await self.session.flush()

        return await self._enrich_visit_record(record)

    # ─── Check-In Pre-Approved ────────────────────────────────────────────────

    async def check_in_pre_approved(
        self, visit_id: str, college_id: str, user_id: str, badge_number: str = None
    ) -> dict:
        """Check in a pre-approved visitor."""
        result = await self.session.execute(
            select(VisitRecord).where(
                VisitRecord.id == visit_id,
                VisitRecord.college_id == college_id,
                VisitRecord.status.in_(["pre_approved", "approved"]),
                VisitRecord.is_deleted == False,
            )
        )
        record = result.scalars().first()
        if not record:
            raise ValueError("Visit record not found or not in approvable state")

        now = datetime.now(timezone.utc)
        record.status = "checked_in"
        record.checked_in_at = now
        record.checked_in_by = user_id
        if badge_number:
            record.badge_number = badge_number

        # Increment visit count
        await self.session.execute(
            update(Visitor).where(Visitor.id == record.visitor_id).values(
                total_visits=Visitor.total_visits + 1
            )
        )

        await self.session.flush()
        return await self._enrich_visit_record(record)

    # ─── Check-Out ────────────────────────────────────────────────────────────

    async def check_out(self, visit_id: str, college_id: str, user_id: str, remarks: str = None) -> dict:
        """Mark a visitor as checked out."""
        result = await self.session.execute(
            select(VisitRecord).where(
                VisitRecord.id == visit_id,
                VisitRecord.college_id == college_id,
                VisitRecord.status == "checked_in",
                VisitRecord.is_deleted == False,
            )
        )
        record = result.scalars().first()
        if not record:
            raise ValueError("Visit record not found or not checked in")

        now = datetime.now(timezone.utc)
        record.status = "checked_out"
        record.checked_out_at = now
        record.checked_out_by = user_id
        if remarks:
            record.remarks = (record.remarks or "") + f"\n[Checkout] {remarks}"

        await self.session.flush()
        return await self._enrich_visit_record(record)

    # ─── Pre-Approve ──────────────────────────────────────────────────────────

    async def pre_approve(self, college_id: str, user_id: str, user_name: str, data: dict) -> dict:
        """Staff pre-approves an expected visitor."""
        visitor = await self.find_or_create_visitor(
            college_id=college_id,
            name=data.get("visitor_name", "Unknown"),
            phone=data.get("visitor_phone", ""),
            visitor_type=data.get("visitor_type", "other"),
        )

        record = VisitRecord(
            college_id=college_id,
            visitor_id=visitor["id"],
            gate_type=data.get("gate_type", "main_gate"),
            hostel_id=data.get("hostel_id"),
            host_id=user_id,
            host_name=user_name,
            purpose=data.get("purpose", "Pre-approved visit"),
            visit_type="pre_approved",
            status="pre_approved",
            num_accompanying=data.get("num_accompanying", 0),
            vehicle_number=data.get("vehicle_number"),
            expected_arrival=data.get("expected_arrival"),
            expected_departure=data.get("expected_departure"),
            approved_by=user_id,
            approved_at=datetime.now(timezone.utc),
            remarks=data.get("remarks"),
        )
        self.session.add(record)
        await self.session.flush()
        return await self._enrich_visit_record(record)

    # ─── Approve / Reject ─────────────────────────────────────────────────────

    async def approve_or_reject(
        self, visit_id: str, college_id: str, user_id: str, action: str, remarks: str = None
    ) -> dict:
        """Approve or reject a pending visit."""
        result = await self.session.execute(
            select(VisitRecord).where(
                VisitRecord.id == visit_id,
                VisitRecord.college_id == college_id,
                VisitRecord.status == "pending",
                VisitRecord.is_deleted == False,
            )
        )
        record = result.scalars().first()
        if not record:
            raise ValueError("Visit record not found or not pending")

        now = datetime.now(timezone.utc)
        if action == "approve":
            record.status = "approved"
        else:
            record.status = "rejected"
        record.approved_by = user_id
        record.approved_at = now
        if remarks:
            record.remarks = remarks

        await self.session.flush()
        return await self._enrich_visit_record(record)

    # ─── Queries ──────────────────────────────────────────────────────────────

    async def get_active_visitors(
        self, college_id: str, gate_type: str = None, hostel_id: str = None
    ) -> list:
        """Get all currently checked-in visitors."""
        q = select(VisitRecord).where(
            VisitRecord.college_id == college_id,
            VisitRecord.status == "checked_in",
            VisitRecord.is_deleted == False,
        ).order_by(VisitRecord.checked_in_at.desc())

        if gate_type:
            q = q.where(VisitRecord.gate_type == gate_type)
        if hostel_id:
            q = q.where(VisitRecord.hostel_id == hostel_id)

        result = await self.session.execute(q)
        records = result.scalars().all()
        return [await self._enrich_visit_record(r) for r in records]

    async def get_pending_visits(
        self, college_id: str, gate_type: str = None, hostel_id: str = None
    ) -> list:
        """Get pending approval visits."""
        q = select(VisitRecord).where(
            VisitRecord.college_id == college_id,
            VisitRecord.status == "pending",
            VisitRecord.is_deleted == False,
        ).order_by(VisitRecord.created_at.desc())

        if gate_type:
            q = q.where(VisitRecord.gate_type == gate_type)
        if hostel_id:
            q = q.where(VisitRecord.hostel_id == hostel_id)

        result = await self.session.execute(q)
        records = result.scalars().all()
        return [await self._enrich_visit_record(r) for r in records]

    async def get_pre_approved_visits(
        self, college_id: str, gate_type: str = None, host_id: str = None
    ) -> list:
        """Get pre-approved visits that haven't been checked in yet."""
        q = select(VisitRecord).where(
            VisitRecord.college_id == college_id,
            VisitRecord.status == "pre_approved",
            VisitRecord.is_deleted == False,
        ).order_by(VisitRecord.expected_arrival.asc())

        if gate_type:
            q = q.where(VisitRecord.gate_type == gate_type)
        if host_id:
            q = q.where(VisitRecord.host_id == host_id)

        result = await self.session.execute(q)
        records = result.scalars().all()
        return [await self._enrich_visit_record(r) for r in records]

    async def get_visit_log(
        self, college_id: str, gate_type: str = None, hostel_id: str = None,
        date_from: str = None, date_to: str = None, search: str = None,
        limit: int = 50, offset: int = 0,
    ) -> list:
        """Historical visit log with filters."""
        q = select(VisitRecord).where(
            VisitRecord.college_id == college_id,
            VisitRecord.is_deleted == False,
        )

        if gate_type:
            q = q.where(VisitRecord.gate_type == gate_type)
        if hostel_id:
            q = q.where(VisitRecord.hostel_id == hostel_id)
        if date_from:
            q = q.where(VisitRecord.created_at >= date_from)
        if date_to:
            q = q.where(VisitRecord.created_at <= date_to)

        q = q.order_by(VisitRecord.created_at.desc()).limit(limit).offset(offset)

        result = await self.session.execute(q)
        records = result.scalars().all()
        enriched = [await self._enrich_visit_record(r) for r in records]

        if search:
            search_lower = search.lower()
            enriched = [
                r for r in enriched
                if search_lower in r.get("visitor_name", "").lower()
                or search_lower in r.get("visitor_phone", "").lower()
                or search_lower in r.get("purpose", "").lower()
            ]

        return enriched

    async def get_my_expected(self, user_id: str, college_id: str) -> list:
        """Get visits pre-approved by the current user."""
        result = await self.session.execute(
            select(VisitRecord).where(
                VisitRecord.college_id == college_id,
                VisitRecord.host_id == user_id,
                VisitRecord.status.in_(["pre_approved", "approved", "checked_in"]),
                VisitRecord.is_deleted == False,
            ).order_by(VisitRecord.created_at.desc())
        )
        records = result.scalars().all()
        return [await self._enrich_visit_record(r) for r in records]

    # ─── Dashboard Stats ─────────────────────────────────────────────────────

    async def get_dashboard_stats(
        self, college_id: str, gate_type: str = None, hostel_id: str = None
    ) -> dict:
        """Dashboard stats for visitor management."""
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

        # Build base filter
        base = [
            VisitRecord.college_id == college_id,
            VisitRecord.is_deleted == False,
        ]
        if gate_type:
            base.append(VisitRecord.gate_type == gate_type)
        if hostel_id:
            base.append(VisitRecord.hostel_id == hostel_id)

        # Currently in campus
        result = await self.session.execute(
            select(func.count()).select_from(VisitRecord).where(
                *base, VisitRecord.status == "checked_in"
            )
        )
        currently_in = result.scalar() or 0

        # Today's totals
        today_base = base + [VisitRecord.created_at >= today_start]

        result = await self.session.execute(
            select(func.count()).select_from(VisitRecord).where(*today_base)
        )
        total_today = result.scalar() or 0

        result = await self.session.execute(
            select(func.count()).select_from(VisitRecord).where(
                *today_base, VisitRecord.status == "checked_out"
            )
        )
        checked_out_today = result.scalar() or 0

        # Pending approval
        result = await self.session.execute(
            select(func.count()).select_from(VisitRecord).where(
                *base, VisitRecord.status == "pending"
            )
        )
        pending = result.scalar() or 0

        # Pre-approved upcoming
        result = await self.session.execute(
            select(func.count()).select_from(VisitRecord).where(
                *base, VisitRecord.status == "pre_approved"
            )
        )
        pre_approved = result.scalar() or 0

        # All time
        result = await self.session.execute(
            select(func.count()).select_from(VisitRecord).where(*base)
        )
        total_all = result.scalar() or 0

        # By visitor type (today)
        result = await self.session.execute(
            select(
                Visitor.visitor_type,
                func.count(VisitRecord.id)
            ).join(Visitor, VisitRecord.visitor_id == Visitor.id).where(
                *today_base
            ).group_by(Visitor.visitor_type)
        )
        by_type = {row[0]: row[1] for row in result.all()}

        # By gate type (today)
        result = await self.session.execute(
            select(
                VisitRecord.gate_type,
                func.count(VisitRecord.id)
            ).where(*today_base).group_by(VisitRecord.gate_type)
        )
        by_gate = {row[0]: row[1] for row in result.all()}

        return {
            "total_today": total_today,
            "currently_in_campus": currently_in,
            "checked_out_today": checked_out_today,
            "pending_approval": pending,
            "pre_approved_upcoming": pre_approved,
            "total_all_time": total_all,
            "by_type": by_type,
            "by_gate": by_gate,
        }

    # ─── Helpers ──────────────────────────────────────────────────────────────

    async def _enrich_visit_record(self, record: VisitRecord) -> dict:
        """Add visitor name/phone and resolve user names."""
        # Get visitor info
        visitor_result = await self.session.execute(
            select(Visitor.name, Visitor.phone, Visitor.visitor_type)
            .where(Visitor.id == record.visitor_id)
        )
        visitor_row = visitor_result.first()
        visitor_name = visitor_row[0] if visitor_row else "Unknown"
        visitor_phone = visitor_row[1] if visitor_row else ""
        visitor_type = visitor_row[2] if visitor_row else "other"

        # Calculate duration
        duration = None
        if record.checked_in_at:
            end = record.checked_out_at or datetime.now(timezone.utc)
            if record.checked_in_at.tzinfo is None:
                from datetime import timezone as tz
                cin = record.checked_in_at.replace(tzinfo=tz.utc)
            else:
                cin = record.checked_in_at
            if hasattr(end, 'tzinfo') and end.tzinfo is None:
                end = end.replace(tzinfo=timezone.utc)
            duration = int((end - cin).total_seconds() / 60)

        # Get hostel name if applicable
        hostel_name = None
        if record.hostel_id:
            h_result = await self.session.execute(
                select(Hostel.name).where(Hostel.id == record.hostel_id)
            )
            hostel_name = h_result.scalar()

        # Resolve check-in/out user names
        checked_in_by_name = None
        if record.checked_in_by:
            u = await self.session.execute(select(User.name).where(User.id == record.checked_in_by))
            checked_in_by_name = u.scalar()

        checked_out_by_name = None
        if record.checked_out_by:
            u = await self.session.execute(select(User.name).where(User.id == record.checked_out_by))
            checked_out_by_name = u.scalar()

        approved_by_name = None
        if record.approved_by:
            u = await self.session.execute(select(User.name).where(User.id == record.approved_by))
            approved_by_name = u.scalar()

        def iso(dt):
            return dt.isoformat() if dt else None

        return {
            "id": record.id,
            "visitor_id": record.visitor_id,
            "visitor_name": visitor_name,
            "visitor_phone": visitor_phone,
            "visitor_type": visitor_type,
            "gate_type": record.gate_type,
            "hostel_name": hostel_name,
            "host_name": record.host_name,
            "host_department": record.host_department,
            "purpose": record.purpose,
            "visit_type": record.visit_type,
            "status": record.status,
            "num_accompanying": record.num_accompanying or 0,
            "vehicle_number": record.vehicle_number,
            "badge_number": record.badge_number,
            "expected_arrival": iso(record.expected_arrival),
            "expected_departure": iso(record.expected_departure),
            "checked_in_at": iso(record.checked_in_at),
            "checked_out_at": iso(record.checked_out_at),
            "checked_in_by_name": checked_in_by_name,
            "checked_out_by_name": checked_out_by_name,
            "approved_by_name": approved_by_name,
            "remarks": record.remarks,
            "duration_minutes": duration,
            "created_at": iso(record.created_at),
        }

    def _visitor_to_dict(self, v: Visitor) -> dict:
        return {
            "id": v.id,
            "name": v.name,
            "phone": v.phone,
            "email": v.email,
            "id_proof_type": v.id_proof_type,
            "id_proof_number": v.id_proof_number,
            "visitor_type": v.visitor_type,
            "total_visits": v.total_visits or 0,
            "created_at": v.created_at.isoformat() if v.created_at else None,
        }
