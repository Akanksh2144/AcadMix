"""
Campus Map & Event Pinning API
──────────────────────────────
GET  /api/campus/buildings           — Building grid for current campus
GET  /api/campus/events              — Visible events (filtered by role)
POST /api/campus/events              — Create event (→ pending_hod)
POST /api/campus/events/{id}/approve — Advance approval state
POST /api/campus/events/{id}/reject  — Reject with comment
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from database import get_db
from app.models.campus import CampusBuilding, CampusEvent, CampusEventApproval, Campus
from app.models.core import College, Department
from app.core.security import get_current_user

router = APIRouter(prefix="/campus", tags=["campus"])


# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class BuildingOut(BaseModel):
    id: str
    campus_id: str
    college_id: Optional[str] = None
    name: str
    short_name: Optional[str] = None
    building_type: str
    floor_count: int
    grid_x: int
    grid_y: int
    grid_w: int
    grid_h: int
    color: Optional[str] = None
    icon: Optional[str] = None
    departments: list = []
    facilities: list = []
    meta_data: dict = {}
    event_count: int = 0


class EventCreate(BaseModel):
    building_id: str
    title: str
    description: Optional[str] = None
    category: str = "other"
    starts_at: datetime
    ends_at: datetime
    contact_info: Optional[str] = None
    max_attendees: Optional[int] = None


class EventOut(BaseModel):
    id: str
    building_id: str
    building_name: Optional[str] = None
    college_id: str
    department_id: Optional[str] = None
    created_by: str
    creator_name: Optional[str] = None
    title: str
    description: Optional[str] = None
    category: str
    starts_at: datetime
    ends_at: datetime
    status: str
    visibility: str
    contact_info: Optional[str] = None
    max_attendees: Optional[int] = None
    created_at: datetime


class ApprovalAction(BaseModel):
    comment: Optional[str] = None


# ── Approval State Machine ────────────────────────────────────────────────────

APPROVAL_TRANSITIONS = {
    # (current_status, approver_role) → (next_status, new_visibility)
    ("pending_hod", "hod"):         ("approved_dept", "department"),
    ("approved_dept", "principal"):  ("approved_college", "college"),
    ("approved_college", "director"):("approved_group", "group"),
}


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/buildings", response_model=List[BuildingOut])
async def get_campus_buildings(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Get all buildings for the user's college campus."""
    college = (await db.execute(
        select(College).where(College.id == user["college_id"])
    )).scalar_one_or_none()

    if not college or not college.campus_id:
        return []

    # Get buildings + count of active events per building
    now = func.now()
    stmt = (
        select(
            CampusBuilding,
            func.coalesce(
                func.count(CampusEvent.id).filter(
                    and_(
                        CampusEvent.building_id == CampusBuilding.id,
                        CampusEvent.is_deleted == False,
                        CampusEvent.ends_at > now,
                        CampusEvent.status.in_(["approved_dept", "approved_college", "approved_group"]),
                    )
                ),
                0
            ).label("event_count")
        )
        .outerjoin(CampusEvent, CampusEvent.building_id == CampusBuilding.id)
        .where(
            CampusBuilding.campus_id == college.campus_id,
            CampusBuilding.is_deleted == False,
        )
        .group_by(CampusBuilding.id)
        .order_by(CampusBuilding.grid_y, CampusBuilding.grid_x)
    )

    rows = (await db.execute(stmt)).all()
    results = []
    for building, event_count in rows:
        results.append(BuildingOut(
            id=building.id,
            campus_id=building.campus_id,
            college_id=building.college_id,
            name=building.name,
            short_name=building.short_name,
            building_type=building.building_type,
            floor_count=building.floor_count,
            grid_x=building.grid_x,
            grid_y=building.grid_y,
            grid_w=building.grid_w,
            grid_h=building.grid_h,
            color=building.color,
            icon=building.icon,
            departments=building.departments or [],
            facilities=building.facilities or [],
            meta_data=building.meta_data or {},
            event_count=event_count,
        ))
    return results


@router.get("/events", response_model=List[EventOut])
async def get_campus_events(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Get visible events based on user's role and department."""
    from app.models.core import User, UserProfile

    college = (await db.execute(
        select(College).where(College.id == user["college_id"])
    )).scalar_one_or_none()

    if not college or not college.campus_id:
        return []

    now = func.now()

    # Base query
    stmt = (
        select(CampusEvent)
        .where(
            CampusEvent.campus_id == college.campus_id,
            CampusEvent.is_deleted == False,
        )
    )

    # Filter by status for approval panels
    if status:
        stmt = stmt.where(CampusEvent.status == status)
    else:
        # For general viewing, only show approved & not-expired events
        stmt = stmt.where(
            CampusEvent.status.in_(["approved_dept", "approved_college", "approved_group"]),
            CampusEvent.ends_at > now,
        )

    user_role = user["role"]

    # Visibility filtering
    if user_role not in ("principal", "director", "admin", "super_admin"):
        # Get user's department
        profile = (await db.execute(
            select(UserProfile).where(UserProfile.user_id == user["id"])
        )).scalar_one_or_none()

        user_dept = profile.department if profile else None

        if user_role == "hod":
            # HOD sees their department events (any status) + college-wide approved
            if user_dept:
                dept = (await db.execute(
                    select(Department).where(
                        Department.college_id == user["college_id"],
                        Department.code == user_dept,
                    )
                )).scalar_one_or_none()
                if dept:
                    stmt = stmt.where(
                        or_(
                            CampusEvent.department_id == dept.id,
                            CampusEvent.visibility.in_(["college", "campus", "group"]),
                        )
                    )
        else:
            # Students/teachers see their department events + college-wide+
            stmt = stmt.where(
                or_(
                    CampusEvent.visibility.in_(["college", "campus", "group"]),
                    and_(
                        CampusEvent.visibility == "department",
                        CampusEvent.college_id == user["college_id"],
                    ),
                )
            )

    stmt = stmt.order_by(CampusEvent.starts_at.desc()).limit(50)

    rows = (await db.execute(stmt)).scalars().all()

    # Enrich with building names and creator names
    building_ids = set(e.building_id for e in rows)
    creator_ids = set(e.created_by for e in rows)

    buildings_map = {}
    if building_ids:
        buildings = (await db.execute(
            select(CampusBuilding).where(CampusBuilding.id.in_(building_ids))
        )).scalars().all()
        buildings_map = {b.id: b.name for b in buildings}

    creators_map = {}
    if creator_ids:
        creators = (await db.execute(
            select(User).where(User.id.in_(creator_ids))
        )).scalars().all()
        creators_map = {c.id: c.name for c in creators}

    return [
        EventOut(
            id=e.id,
            building_id=e.building_id,
            building_name=buildings_map.get(e.building_id),
            college_id=e.college_id,
            department_id=e.department_id,
            created_by=e.created_by,
            creator_name=creators_map.get(e.created_by),
            title=e.title,
            description=e.description,
            category=e.category,
            starts_at=e.starts_at,
            ends_at=e.ends_at,
            status=e.status,
            visibility=e.visibility,
            contact_info=e.contact_info,
            max_attendees=e.max_attendees,
            created_at=e.created_at,
        )
        for e in rows
    ]


@router.post("/events", response_model=EventOut)
async def create_campus_event(
    data: EventCreate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Create a new event pinned to a building."""
    from app.models.core import UserProfile

    college = (await db.execute(
        select(College).where(College.id == user["college_id"])
    )).scalar_one_or_none()

    if not college or not college.campus_id:
        raise HTTPException(400, "College has no campus configured")

    # Verify building exists on this campus
    building = (await db.execute(
        select(CampusBuilding).where(
            CampusBuilding.id == data.building_id,
            CampusBuilding.campus_id == college.campus_id,
            CampusBuilding.is_deleted == False,
        )
    )).scalar_one_or_none()

    if not building:
        raise HTTPException(404, "Building not found on this campus")

    # Get user's department
    profile = (await db.execute(
        select(UserProfile).where(UserProfile.user_id == user["id"])
    )).scalar_one_or_none()

    dept_id = None
    if profile and profile.department:
        dept = (await db.execute(
            select(Department).where(
                Department.college_id == user["college_id"],
                Department.code == profile.department,
            )
        )).scalar_one_or_none()
        if dept:
            dept_id = dept.id

    import uuid
    event = CampusEvent(
        id=str(uuid.uuid4()),
        campus_id=college.campus_id,
        building_id=data.building_id,
        college_id=user["college_id"],
        department_id=dept_id,
        created_by=user["id"],
        title=data.title,
        description=data.description,
        category=data.category,
        starts_at=data.starts_at,
        ends_at=data.ends_at,
        status="pending_hod",
        visibility="department",
        contact_info=data.contact_info,
        max_attendees=data.max_attendees,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)

    return EventOut(
        id=event.id,
        building_id=event.building_id,
        building_name=building.name,
        college_id=event.college_id,
        department_id=event.department_id,
        created_by=event.created_by,
        creator_name=user["name"],
        title=event.title,
        description=event.description,
        category=event.category,
        starts_at=event.starts_at,
        ends_at=event.ends_at,
        status=event.status,
        visibility=event.visibility,
        contact_info=event.contact_info,
        max_attendees=event.max_attendees,
        created_at=event.created_at,
    )


@router.post("/events/{event_id}/approve")
async def approve_event(
    event_id: str,
    body: ApprovalAction,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Approve an event to the next visibility level."""
    event = (await db.execute(
        select(CampusEvent).where(CampusEvent.id == event_id, CampusEvent.is_deleted == False)
    )).scalar_one_or_none()

    if not event:
        raise HTTPException(404, "Event not found")

    key = (event.status, user["role"])
    if key not in APPROVAL_TRANSITIONS:
        raise HTTPException(403, f"Cannot approve: event is '{event.status}' and your role is '{user['role']}'")

    next_status, new_visibility = APPROVAL_TRANSITIONS[key]
    event.status = next_status
    event.visibility = new_visibility

    import uuid
    approval = CampusEventApproval(
        id=str(uuid.uuid4()),
        event_id=event_id,
        approved_by=user["id"],
        role=user["role"],
        action="approved",
        comment=body.comment,
    )
    db.add(approval)
    await db.commit()

    return {"status": next_status, "visibility": new_visibility, "message": f"Event approved → {next_status}"}


@router.post("/events/{event_id}/reject")
async def reject_event(
    event_id: str,
    body: ApprovalAction,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Reject an event."""
    event = (await db.execute(
        select(CampusEvent).where(CampusEvent.id == event_id, CampusEvent.is_deleted == False)
    )).scalar_one_or_none()

    if not event:
        raise HTTPException(404, "Event not found")

    if user["role"] not in ("hod", "principal", "director", "admin", "super_admin"):
        raise HTTPException(403, "Not authorized to reject events")

    event.status = "rejected"

    import uuid
    approval = CampusEventApproval(
        id=str(uuid.uuid4()),
        event_id=event_id,
        approved_by=user["id"],
        role=user["role"],
        action="rejected",
        comment=body.comment,
    )
    db.add(approval)
    await db.commit()

    return {"status": "rejected", "message": "Event rejected"}
