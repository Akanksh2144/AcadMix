"""
SuperAdmin Router — Platform-level cross-tenant management.
All endpoints require role = "super_admin". 
Bypasses RLS tenant filtering (college_id = "super_admin" sentinel).
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, Query, Body, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select, func, update, delete
from pydantic import BaseModel

from database import get_db
from app.core.security import require_role
from app.models.core import College, Department, Section, User, UserProfile
from app.models.hostel import Hostel, Room, Bed, RoomTemplate, Allocation
from app.models.iot import BusRoute, TransportEnrollment
from app.models.administration import Scholarship

router = APIRouter(prefix="/superadmin", tags=["superadmin"])


# ═══════════════════════════════════════════════════════════════════════════════
# Schemas
# ═══════════════════════════════════════════════════════════════════════════════

class CollegeCreate(BaseModel):
    id: str
    name: str
    domain: Optional[str] = None
    settings: dict = {}

class CollegeUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    settings: Optional[dict] = None

class HostelCreate(BaseModel):
    college_id: str
    name: str
    gender_type: str = "coed"
    total_floors: int = 1
    total_capacity: int = 0

class RoomCreate(BaseModel):
    college_id: str
    hostel_id: str
    room_number: str
    floor: int = 1
    capacity: int = 0
    template_id: Optional[str] = None

class BedLayout(BaseModel):
    beds: list  # Array of {identifier, grid_row, grid_col, category, is_premium, selection_fee}

class RoomTemplateCreate(BaseModel):
    name: str
    total_capacity: int
    grid_rows: int
    grid_cols: int
    bed_layout: list
    college_id: Optional[str] = None

class ModuleToggle(BaseModel):
    modules: dict  # {module_name: bool}


# ═══════════════════════════════════════════════════════════════════════════════
# Platform Overview
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/platform/overview")
async def platform_overview(
    user: dict = Depends(require_role("super_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Global KPIs for the superadmin dashboard."""
    queries = {
        "total_tenants": "SELECT COUNT(*) FROM colleges WHERE is_deleted = false",
        "total_users": "SELECT COUNT(*) FROM users WHERE is_deleted = false",
        "total_students": "SELECT COUNT(*) FROM users WHERE role = 'student' AND is_deleted = false",
        "total_staff": "SELECT COUNT(*) FROM users WHERE role != 'student' AND is_deleted = false",
        "total_departments": "SELECT COUNT(*) FROM departments WHERE is_deleted = false",
        "total_courses": "SELECT COUNT(*) FROM courses WHERE is_deleted = false",
        "total_attendance": "SELECT COUNT(*) FROM attendance_records",
        "total_fee_invoices": "SELECT COUNT(*) FROM student_fee_invoices WHERE is_deleted = false",
        "total_hostels": "SELECT COUNT(*) FROM hostels WHERE is_deleted = false",
        "total_rooms": "SELECT COUNT(*) FROM rooms WHERE is_deleted = false",
        "total_beds": "SELECT COUNT(*) FROM beds WHERE is_deleted = false",
        "total_allocations": "SELECT COUNT(*) FROM allocations WHERE is_deleted = false",
        "total_bus_routes": "SELECT COUNT(*) FROM bus_routes WHERE is_deleted = false",
        "total_scholarships": "SELECT COUNT(*) FROM scholarships WHERE is_deleted = false",
    }
    
    stats = {}
    for key, query in queries.items():
        result = await db.execute(text(query))
        stats[key] = result.scalar()
    
    return {"data": stats}


# ═══════════════════════════════════════════════════════════════════════════════
# College (Tenant) Management
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/colleges")
async def list_colleges(
    user: dict = Depends(require_role("super_admin")),
    db: AsyncSession = Depends(get_db)
):
    """List all tenant colleges with summary stats."""
    result = await db.execute(text("""
        SELECT c.id, c.name, c.domain, c.settings, c.created_at, c.is_deleted,
            (SELECT COUNT(*) FROM users u WHERE u.college_id = c.id AND u.is_deleted = false) as user_count,
            (SELECT COUNT(*) FROM users u WHERE u.college_id = c.id AND u.role = 'student' AND u.is_deleted = false) as student_count,
            (SELECT COUNT(*) FROM departments d WHERE d.college_id = c.id AND d.is_deleted = false) as dept_count,
            (SELECT COUNT(*) FROM hostels h WHERE h.college_id = c.id AND h.is_deleted = false) as hostel_count
        FROM colleges c
        ORDER BY c.created_at DESC
    """))
    
    colleges = []
    for row in result.fetchall():
        colleges.append({
            "id": row[0], "name": row[1], "domain": row[2],
            "settings": row[3], "created_at": str(row[4]),
            "is_deleted": row[5], "user_count": row[6],
            "student_count": row[7], "dept_count": row[8],
            "hostel_count": row[9],
        })
    
    return {"data": colleges}


@router.post("/colleges")
async def create_college(
    req: CollegeCreate,
    user: dict = Depends(require_role("super_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Onboard a new tenant."""
    await db.execute(text(
        "INSERT INTO colleges (id, name, domain, settings) VALUES (:id, :name, :domain, :settings::jsonb)"
    ), {"id": req.id, "name": req.name, "domain": req.domain, "settings": str(req.settings).replace("'", '"')})
    await db.commit()
    return {"message": f"College '{req.name}' created", "id": req.id}


@router.put("/colleges/{college_id}")
async def update_college(
    college_id: str,
    req: CollegeUpdate,
    user: dict = Depends(require_role("super_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Update a tenant's settings."""
    updates = {}
    if req.name is not None: updates["name"] = req.name
    if req.domain is not None: updates["domain"] = req.domain
    if req.settings is not None: updates["settings"] = str(req.settings).replace("'", '"')
    
    if not updates:
        raise HTTPException(400, "No updates provided")
    
    set_clause = ", ".join(f"{k} = :{k}" for k in updates)
    if "settings" in updates:
        set_clause = set_clause.replace("settings = :settings", "settings = :settings::jsonb")
    
    updates["cid"] = college_id
    await db.execute(text(f"UPDATE colleges SET {set_clause} WHERE id = :cid"), updates)
    await db.commit()
    return {"message": "College updated"}


@router.delete("/colleges/{college_id}")
async def deactivate_college(
    college_id: str,
    user: dict = Depends(require_role("super_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Soft-delete (deactivate) a tenant."""
    await db.execute(text(
        "UPDATE colleges SET is_deleted = true, deleted_at = NOW() WHERE id = :cid"
    ), {"cid": college_id})
    await db.commit()
    return {"message": "College deactivated"}


@router.get("/colleges/{college_id}/stats")
async def college_deep_stats(
    college_id: str,
    user: dict = Depends(require_role("super_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Detailed stats for a single tenant."""
    queries = {
        "users_by_role": """
            SELECT role, COUNT(*) as count 
            FROM users WHERE college_id = :cid AND is_deleted = false 
            GROUP BY role ORDER BY count DESC
        """,
        "departments": """
            SELECT d.name, d.code, 
                (SELECT COUNT(*) FROM users u JOIN user_profiles up ON u.id = up.user_id 
                 WHERE u.college_id = :cid AND up.department = d.code AND u.role = 'student') as students
            FROM departments d WHERE d.college_id = :cid AND d.is_deleted = false
        """,
        "attendance_summary": """
            SELECT COUNT(*) as total,
                COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
                COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent
            FROM attendance_records WHERE college_id = :cid
        """,
        "hostel_occupancy": """
            SELECT h.name, h.total_capacity,
                (SELECT COUNT(*) FROM allocations a WHERE a.hostel_id = h.id AND a.status = 'active') as occupied
            FROM hostels h WHERE h.college_id = :cid AND h.is_deleted = false
        """,
    }
    
    stats = {}
    for key, query in queries.items():
        result = await db.execute(text(query), {"cid": college_id})
        stats[key] = [dict(row._mapping) for row in result.fetchall()]
    
    return {"data": stats}


# ═══════════════════════════════════════════════════════════════════════════════
# Module Management
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/colleges/{college_id}/modules")
async def get_college_modules(
    college_id: str,
    user: dict = Depends(require_role("super_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Get enabled modules for a college."""
    result = await db.execute(text(
        "SELECT module_name, is_enabled FROM college_modules WHERE college_id = :cid"
    ), {"cid": college_id})
    modules = {row[0]: row[1] for row in result.fetchall()}
    return {"data": modules}


@router.put("/colleges/{college_id}/modules")
async def toggle_modules(
    college_id: str,
    req: ModuleToggle,
    user: dict = Depends(require_role("super_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Enable/disable modules for a college."""
    for module_name, is_enabled in req.modules.items():
        await db.execute(text("""
            INSERT INTO college_modules (id, college_id, module_name, is_enabled)
            VALUES (gen_random_uuid()::text, :cid, :mod, :enabled)
            ON CONFLICT (college_id, module_name) DO UPDATE SET is_enabled = :enabled
        """), {"cid": college_id, "mod": module_name, "enabled": is_enabled})
    await db.commit()
    return {"message": "Modules updated"}


# ═══════════════════════════════════════════════════════════════════════════════
# Hostel Management
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/hostels")
async def list_hostels(
    college_id: Optional[str] = None,
    user: dict = Depends(require_role("super_admin")),
    db: AsyncSession = Depends(get_db)
):
    """List hostels, optionally filtered by college."""
    if college_id:
        result = await db.execute(text("""
            SELECT h.*, 
                (SELECT COUNT(*) FROM rooms r WHERE r.hostel_id = h.id) as room_count,
                (SELECT COUNT(*) FROM allocations a WHERE a.hostel_id = h.id AND a.status = 'active') as occupied
            FROM hostels h WHERE h.college_id = :cid AND h.is_deleted = false
            ORDER BY h.name
        """), {"cid": college_id})
    else:
        result = await db.execute(text("""
            SELECT h.*, c.name as college_name,
                (SELECT COUNT(*) FROM rooms r WHERE r.hostel_id = h.id) as room_count,
                (SELECT COUNT(*) FROM allocations a WHERE a.hostel_id = h.id AND a.status = 'active') as occupied
            FROM hostels h JOIN colleges c ON h.college_id = c.id
            WHERE h.is_deleted = false ORDER BY c.name, h.name
        """))
    
    hostels = [dict(row._mapping) for row in result.fetchall()]
    return {"data": hostels}


@router.post("/hostels")
async def create_hostel(
    req: HostelCreate,
    user: dict = Depends(require_role("super_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Create a hostel building."""
    import uuid
    hid = str(uuid.uuid4())
    await db.execute(text("""
        INSERT INTO hostels (id, college_id, name, gender_type, total_floors, total_capacity)
        VALUES (:id, :cid, :name, :gender, :floors, :cap)
    """), {"id": hid, "cid": req.college_id, "name": req.name,
           "gender": req.gender_type, "floors": req.total_floors, "cap": req.total_capacity})
    await db.commit()
    return {"message": "Hostel created", "id": hid}


@router.get("/hostels/{hostel_id}/rooms")
async def list_hostel_rooms(
    hostel_id: str,
    user: dict = Depends(require_role("super_admin")),
    db: AsyncSession = Depends(get_db)
):
    """List all rooms in a hostel with bed counts."""
    result = await db.execute(text("""
        SELECT r.*,
            (SELECT COUNT(*) FROM beds b WHERE b.room_id = r.id) as bed_count,
            (SELECT COUNT(*) FROM beds b WHERE b.room_id = r.id AND b.status = 'BOOKED') as booked_count
        FROM rooms r WHERE r.hostel_id = :hid AND r.is_deleted = false
        ORDER BY r.floor, r.room_number
    """), {"hid": hostel_id})
    rooms = [dict(row._mapping) for row in result.fetchall()]
    return {"data": rooms}


@router.post("/rooms")
async def create_room(
    req: RoomCreate,
    user: dict = Depends(require_role("super_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Create a room in a hostel."""
    import uuid
    rid = str(uuid.uuid4())
    await db.execute(text("""
        INSERT INTO rooms (id, college_id, hostel_id, room_number, floor, capacity, template_id)
        VALUES (:id, :cid, :hid, :rn, :floor, :cap, :tid)
    """), {"id": rid, "cid": req.college_id, "hid": req.hostel_id,
           "rn": req.room_number, "floor": req.floor, "cap": req.capacity,
           "tid": req.template_id})
    await db.commit()
    return {"message": "Room created", "id": rid}


@router.get("/rooms/{room_id}/beds")
async def get_room_beds(
    room_id: str,
    user: dict = Depends(require_role("super_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Get the bed grid for a room."""
    result = await db.execute(text("""
        SELECT * FROM beds WHERE room_id = :rid AND is_deleted = false
        ORDER BY grid_row, grid_col
    """), {"rid": room_id})
    beds = [dict(row._mapping) for row in result.fetchall()]
    
    # Also get room info
    room_result = await db.execute(text("SELECT * FROM rooms WHERE id = :rid"), {"rid": room_id})
    room = dict(room_result.fetchone()._mapping) if room_result else None
    
    return {"data": {"room": room, "beds": beds}}


@router.post("/rooms/{room_id}/beds")
async def save_room_beds(
    room_id: str,
    req: BedLayout,
    user: dict = Depends(require_role("super_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Save/upsert the full bed layout for a room."""
    import uuid
    
    # Get room's college_id
    room_result = await db.execute(text("SELECT college_id FROM rooms WHERE id = :rid"), {"rid": room_id})
    room = room_result.fetchone()
    if not room:
        raise HTTPException(404, "Room not found")
    college_id = room[0]
    
    # Delete existing beds for this room
    await db.execute(text("DELETE FROM beds WHERE room_id = :rid"), {"rid": room_id})
    
    # Insert new beds
    for bed in req.beds:
        bid = str(uuid.uuid4())
        await db.execute(text("""
            INSERT INTO beds (id, college_id, room_id, bed_identifier, grid_row, grid_col, 
                            category, is_premium, selection_fee, status)
            VALUES (:id, :cid, :rid, :ident, :row, :col, :cat, :prem, :fee, 'AVAILABLE')
        """), {
            "id": bid, "cid": college_id, "rid": room_id,
            "ident": bed.get("identifier", f"B{bid[:4]}"),
            "row": bed.get("grid_row", 1), "col": bed.get("grid_col", 1),
            "cat": bed.get("category", "Standard"),
            "prem": bed.get("is_premium", False),
            "fee": bed.get("selection_fee", 0),
        })
    
    # Update room capacity
    await db.execute(text(
        "UPDATE rooms SET capacity = :cap WHERE id = :rid"
    ), {"cap": len(req.beds), "rid": room_id})
    
    await db.commit()
    return {"message": f"Saved {len(req.beds)} beds", "bed_count": len(req.beds)}


# ═══════════════════════════════════════════════════════════════════════════════
# Room Templates
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/room-templates")
async def list_room_templates(
    user: dict = Depends(require_role("super_admin")),
    db: AsyncSession = Depends(get_db)
):
    """List all room templates."""
    result = await db.execute(text("""
        SELECT * FROM room_templates WHERE is_deleted = false ORDER BY name
    """))
    templates = [dict(row._mapping) for row in result.fetchall()]
    return {"data": templates}


@router.post("/room-templates")
async def create_room_template(
    req: RoomTemplateCreate,
    user: dict = Depends(require_role("super_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Create a reusable room template."""
    import uuid, json
    tid = str(uuid.uuid4())
    await db.execute(text("""
        INSERT INTO room_templates (id, college_id, name, total_capacity, grid_rows, grid_cols, bed_layout)
        VALUES (:id, :cid, :name, :cap, :rows, :cols, :layout::jsonb)
    """), {
        "id": tid, "cid": req.college_id, "name": req.name,
        "cap": req.total_capacity, "rows": req.grid_rows, "cols": req.grid_cols,
        "layout": json.dumps(req.bed_layout),
    })
    await db.commit()
    return {"message": "Template created", "id": tid}


@router.post("/rooms/{room_id}/apply-template/{template_id}")
async def apply_template_to_room(
    room_id: str,
    template_id: str,
    user: dict = Depends(require_role("super_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Apply a template's bed layout to a room."""
    # Get template
    result = await db.execute(text("SELECT * FROM room_templates WHERE id = :tid"), {"tid": template_id})
    template = result.fetchone()
    if not template:
        raise HTTPException(404, "Template not found")
    
    tpl = dict(template._mapping)
    
    # Update room with template
    await db.execute(text(
        "UPDATE rooms SET template_id = :tid, capacity = :cap WHERE id = :rid"
    ), {"tid": template_id, "cap": tpl["total_capacity"], "rid": room_id})
    
    # Apply bed layout
    req = BedLayout(beds=tpl["bed_layout"])
    return await save_room_beds(room_id, req, user, db)


# ═══════════════════════════════════════════════════════════════════════════════
# Billing / Subscription (Placeholder structure)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/billing/overview")
async def billing_overview(
    user: dict = Depends(require_role("super_admin")),
    db: AsyncSession = Depends(get_db)
):
    """Billing summary across all tenants."""
    result = await db.execute(text("""
        SELECT c.id, c.name, c.domain,
            (SELECT COUNT(*) FROM users u WHERE u.college_id = c.id AND u.is_deleted = false) as users,
            (SELECT COALESCE(SUM(fi.amount), 0) FROM student_fee_invoices fi WHERE fi.college_id = c.id) as total_fees
        FROM colleges c WHERE c.is_deleted = false ORDER BY c.name
    """))
    
    tenants = []
    for row in result.fetchall():
        tenants.append({
            "college_id": row[0], "name": row[1], "domain": row[2],
            "users": row[3], "total_fees": float(row[4]),
        })
    
    return {"data": tenants}
