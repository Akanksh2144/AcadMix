from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, or_
from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel

from database import get_db
from app.core.security import get_current_user
from app.core.security import require_role
from app.core.utils import get_current_academic_year
from app import models
import app.schemas as server_schemas
from app.schemas import *

router = APIRouter()


@router.put("/hod/timetable/slots")
async def upsert_timetable_slots(req: BulkSlotsUpsert, user: dict = Depends(require_role("hod", "admin")), session: AsyncSession = Depends(get_db)):
    """Bulk upsert period slots (usually representing a weekly template)."""
    if not req.slots:
        return {"message": "No slots provided"}

    updated_count = 0
    created_count = 0

    coords = set((s.department_id, s.batch, s.section, s.academic_year) for s in req.slots)
    conditions = [
        and_(
            models.PeriodSlot.department_id == c[0],
            models.PeriodSlot.batch == c[1],
            models.PeriodSlot.section == c[2],
            models.PeriodSlot.academic_year == c[3]
        ) for c in coords
    ]
    
    existing_map = {}
    if conditions:
        exist_r = await session.execute(
            select(models.PeriodSlot).where(
                models.PeriodSlot.college_id == user["college_id"],
                or_(*conditions)
            )
        )
        for s in exist_r.scalars().all():
            key = (s.department_id, s.batch, s.section, s.academic_year, s.day, s.period_no)
            existing_map[key] = s

    for slot_data in req.slots:
        key = (slot_data.department_id, slot_data.batch, slot_data.section, slot_data.academic_year, slot_data.day, slot_data.period_no)
        existing = existing_map.get(key)

        if existing:
            existing.semester = slot_data.semester
            existing.start_time = slot_data.start_time
            existing.end_time = slot_data.end_time
            existing.subject_code = slot_data.subject_code
            existing.subject_name = slot_data.subject_name
            existing.faculty_id = slot_data.faculty_id
            existing.slot_type = slot_data.slot_type
            updated_count += 1
        else:
            new_slot = models.PeriodSlot(
                college_id=user["college_id"],
                department_id=slot_data.department_id,
                batch=slot_data.batch,
                section=slot_data.section,
                semester=slot_data.semester,
                academic_year=slot_data.academic_year,
                day=slot_data.day,
                period_no=slot_data.period_no,
                start_time=slot_data.start_time,
                end_time=slot_data.end_time,
                subject_code=slot_data.subject_code,
                subject_name=slot_data.subject_name,
                faculty_id=slot_data.faculty_id,
                slot_type=slot_data.slot_type
            )
            session.add(new_slot)
            created_count += 1

    await session.commit()
    return {"message": f"Slots saved: {created_count} created, {updated_count} updated."}


@router.get("/hod/timetable")
async def get_department_timetable(
    department_id: str,
    batch: str,
    section: str,
    academic_year: str,
    user: dict = Depends(require_role("hod", "admin")),
    session: AsyncSession = Depends(get_db)
):
    """Get the weekly timetable grid for a specific batch/section."""
    result = await session.execute(
        select(models.PeriodSlot).where(
            models.PeriodSlot.college_id == user["college_id"],
            models.PeriodSlot.department_id == department_id,
            models.PeriodSlot.batch == batch,
            models.PeriodSlot.section == section,
            models.PeriodSlot.academic_year == academic_year
        )
    )
    slots = result.scalars().all()
    return [{
        "id": s.id, "day": s.day, "period_no": s.period_no, "start_time": s.start_time, "end_time": s.end_time,
        "subject_code": s.subject_code, "subject_name": s.subject_name,
        "faculty_id": s.faculty_id, "slot_type": s.slot_type
    } for s in slots]


class SubjectAllocation(BaseModel):
    subject_code: str
    subject_name: str
    faculty_id: str
    hours_per_week: int
    is_lab: bool

class GenerateTimetableRequest(BaseModel):
    department_id: str
    batch: str
    section: str
    academic_year: str
    semester: int
    allocations: List[SubjectAllocation]


@router.post("/hod/timetable/generate")
async def generate_timetable(
    req: GenerateTimetableRequest,
    user: dict = Depends(require_role("hod", "admin")),
    session: AsyncSession = Depends(get_db)
):
    from app.models.core import College
    # 1. Fetch config
    res = await session.execute(select(College).where(College.id == user["college_id"]))
    college = res.scalars().first()
    settings = college.settings or {}
    config = settings.get("timetable_config", {
        "periods_per_day": 8,
        "working_days": ["MON", "TUE", "WED", "THU", "FRI"],
        "lab_consecutive_periods": 3,
        "breaks": [{"type": "lunch", "after_period": 4, "duration_mins": 60}]
    })

    periods_per_day = config["periods_per_day"]
    working_days = config["working_days"]
    lab_len = config["lab_consecutive_periods"]
    breaks = [b["after_period"] for b in config["breaks"]]

    # 2. Fetch global faculty usage for this academic year
    exist_res = await session.execute(
        select(models.PeriodSlot).where(
            models.PeriodSlot.college_id == user["college_id"],
            models.PeriodSlot.academic_year == req.academic_year
        )
    )
    existing_slots = exist_res.scalars().all()

    faculty_map = {}
    for s in existing_slots:
        if not s.faculty_id: continue
        if s.faculty_id not in faculty_map:
            faculty_map[s.faculty_id] = {}
        if s.day not in faculty_map[s.faculty_id]:
            faculty_map[s.faculty_id][s.day] = set()
        faculty_map[s.faculty_id][s.day].add(s.period_no)

    section_map = {day: set() for day in working_days}

    # Validate break crossing
    def crosses_break(start_p, length):
        for b in breaks:
            if start_p <= b < start_p + length - 1:
                return True
        return False

    generated = []
    
    # helper to check faculty free
    def is_faculty_free(fac_id, day, period):
        return period not in faculty_map.get(fac_id, {}).get(day, set())

    # 3. Schedule Labs
    labs = [a for a in req.allocations if a.is_lab]
    for lab in labs:
        blocks_needed = max(1, lab.hours_per_week // lab_len)
        placed_blocks = 0
        for day in working_days:
            if placed_blocks >= blocks_needed: break
            
            for start_p in range(1, periods_per_day - lab_len + 2):
                if crosses_break(start_p, lab_len): continue
                
                # check section & faculty free
                free = True
                for p in range(start_p, start_p + lab_len):
                    if p in section_map[day] or not is_faculty_free(lab.faculty_id, day, p):
                        free = False
                        break
                
                if free:
                    for p in range(start_p, start_p + lab_len):
                        section_map[day].add(p)
                        if lab.faculty_id not in faculty_map: faculty_map[lab.faculty_id] = {}
                        if day not in faculty_map[lab.faculty_id]: faculty_map[lab.faculty_id][day] = set()
                        faculty_map[lab.faculty_id][day].add(p)
                        
                        generated.append({
                            "department_id": req.department_id,
                            "batch": req.batch, "section": req.section,
                            "semester": req.semester, "academic_year": req.academic_year,
                            "day": day, "period_no": p,
                            "start_time": "", "end_time": "", # Handled by UI template mapping
                            "subject_code": lab.subject_code, "subject_name": lab.subject_name,
                            "faculty_id": lab.faculty_id, "slot_type": "lab"
                        })
                    placed_blocks += 1
                    break
        
        if placed_blocks < blocks_needed:
            raise HTTPException(400, f"Unresolvable Conflict: Cannot find free contiguous slots for Lab: {lab.subject_name} ({lab.faculty_id}). Adjust allocations or college config.")

    # 4. Schedule Theory
    theory = [a for a in req.allocations if not a.is_lab]
    for th in theory:
        placed_hours = 0
        
        # Max 2 periods per day for same subject
        daily_counts = {day: 0 for day in working_days}
        
        for _ in range(th.hours_per_week):
            placed = False
            for day in working_days:
                if daily_counts[day] >= 2: continue
                if placed: break
                
                for p in range(1, periods_per_day + 1):
                    if p not in section_map[day] and is_faculty_free(th.faculty_id, day, p):
                        # Place!
                        section_map[day].add(p)
                        if th.faculty_id not in faculty_map: faculty_map[th.faculty_id] = {}
                        if day not in faculty_map[th.faculty_id]: faculty_map[th.faculty_id][day] = set()
                        faculty_map[th.faculty_id][day].add(p)
                        
                        generated.append({
                            "department_id": req.department_id,
                            "batch": req.batch, "section": req.section,
                            "semester": req.semester, "academic_year": req.academic_year,
                            "day": day, "period_no": p,
                            "start_time": "", "end_time": "", 
                            "subject_code": th.subject_code, "subject_name": th.subject_name,
                            "faculty_id": th.faculty_id, "slot_type": "regular"
                        })
                        daily_counts[day] += 1
                        placed = True
                        break
            if not placed:
                raise HTTPException(400, f"Unresolvable Conflict: Cannot schedule {th.subject_name} for faculty {th.faculty_id}. The faculty is completely booked across the college.")
                
    return {"slots": generated}


@router.get("/faculty/timetable/today")
async def get_faculty_today_timetable(
    week: bool = False,
    user: dict = Depends(require_role("teacher", "faculty", "hod")),
    session: AsyncSession = Depends(get_db)
):
    """Get today's periods (default) or full weekly grid (?week=true) for the logged-in faculty."""
    today = datetime.now(timezone.utc)
    days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
    current_day = days[today.weekday()]

    current_academic_year = await get_current_academic_year(session, user.get("college_id", ""))

    stmt = select(models.PeriodSlot).where(
        models.PeriodSlot.faculty_id == user["id"],
        models.PeriodSlot.academic_year == current_academic_year
    )
    if not week:
        stmt = stmt.where(models.PeriodSlot.day == current_day)
    stmt = stmt.order_by(models.PeriodSlot.day, models.PeriodSlot.period_no)

    result = await session.execute(stmt)
    slots = result.scalars().all()
    return [{
        "id": s.id, "day": s.day, "period_no": s.period_no, "start_time": s.start_time, "end_time": s.end_time,
        "batch": s.batch, "section": s.section, "department_id": s.department_id,
        "subject_code": s.subject_code, "subject_name": s.subject_name, "slot_type": s.slot_type
    } for s in slots]


@router.get("/student/timetable")
async def get_student_timetable(user: dict = Depends(require_role("student")), session: AsyncSession = Depends(get_db)):
    """Get the weekly timetable for the logged-in student."""
    # Since courses aren't fully seeded, we use profile_data for batch/section
    department = user.get("department")
    batch = user.get("batch")
    section = user.get("section")
    
    if not all([department, batch, section]):
        return []

    # Requires looking up the department_id by code/name
    dept_r = await session.execute(
        select(models.Department).where(
            models.Department.college_id == user["college_id"],
            (models.Department.code == department) | (models.Department.name == department)
        )
    )
    dept = dept_r.scalars().first()
    if not dept:
        return []

    current_academic_year = await get_current_academic_year(session, user.get("college_id", ""))

    result = await session.execute(
        select(models.PeriodSlot).where(
            models.PeriodSlot.department_id == dept.id,
            models.PeriodSlot.batch == batch,
            models.PeriodSlot.section == section,
            models.PeriodSlot.academic_year == current_academic_year
        )
    )
    slots = result.scalars().all()
    
    # Needs faculty names. Could join, but fetching in Python is okay for small sets.
    faculty_ids = list(set([s.faculty_id for s in slots if s.faculty_id]))
    faculty_map = {}
    if faculty_ids:
        fac_r = await session.execute(select(models.User.id, models.User.name).where(models.User.id.in_(faculty_ids)))
        faculty_map = {f.id: f.name for f in fac_r.all()}

    return [{
        "id": s.id, "day": s.day, "period_no": s.period_no, "start_time": s.start_time, "end_time": s.end_time,
        "subject_code": s.subject_code, "subject_name": s.subject_name,
        "faculty_id": s.faculty_id, "faculty_name": faculty_map.get(s.faculty_id, "Unknown"), "slot_type": s.slot_type
    } for s in slots]

@router.get("/admin/timetable/conflicts")
async def get_timetable_conflicts(academic_year: str, session: AsyncSession = Depends(get_db)):
    # Simple conflict check returning duplicates based on day/period/faculty across all depts
    stmt = select(models.Timetable).where(models.Timetable.academic_year == academic_year)
    res = await session.execute(stmt)
    slots = res.scalars().all()
    
    seen = {}
    conflicts = []
    for s in slots:
        key = (s.faculty_id, s.day, s.time_slot)
        if key in seen:
            conflicts.append({
                "faculty_id": s.faculty_id,
                "day": s.day,
                "period": s.time_slot,
                "dept_1": seen[key],
                "dept_2": s.department_id
            })
        else:
            seen[key] = s.department_id
    return conflicts


@router.put("/admin/timetable/{department_id}/approve")
async def approve_timetable(department_id: str, academic_year: str, semester: int, admin: dict = Depends(require_role("admin", "super_admin")), session: AsyncSession = Depends(get_db)):
    stmt = select(models.TimetableApproval).where(
        models.TimetableApproval.department_id == department_id,
        models.TimetableApproval.academic_year == academic_year,
        models.TimetableApproval.semester == semester
    )
    res = await session.execute(stmt)
    approval = res.scalars().first()
    
    if approval:
        approval.is_approved = True
        approval.approved_by = admin["id"]
        approval.approved_at = datetime.utcnow()
    else:
        approval = models.TimetableApproval(
            college_id=admin["college_id"],
            department_id=department_id,
            academic_year=academic_year,
            semester=semester,
            is_approved=True,
            approved_by=admin["id"],
            approved_at=datetime.utcnow()
        )
        session.add(approval)
        
    await session.commit()
    return {"message": "Timetable approved"}
