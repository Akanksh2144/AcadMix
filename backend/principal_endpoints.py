from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, false, text
from typing import Optional
from datetime import datetime, timezone
import json

# Assuming models, require_role, get_db, get_current_user are already imported in server.py

# ─── Phase 6: Principal Dashboard & Governance ───────────────────────────────────────

@app.get("/api/principal/dashboard")
async def get_principal_dashboard_summary(user: dict = Depends(require_role("principal", "admin")), session: AsyncSession = Depends(get_db)):
    """Aggregates college-wide high-level statistics"""
    college_id = user["college_id"]
    
    # Total students
    students_count = await session.scalar(select(func.count(models.User.id)).where(
        models.User.college_id == college_id,
        models.User.role == "student"
    ))
    
    # Total faculty
    faculty_count = await session.scalar(select(func.count(models.User.id)).where(
        models.User.college_id == college_id,
        models.User.role.in_(["teacher", "faculty"])
    ))
    
    # Total departments
    depts_count = await session.scalar(select(func.count(models.Department.id)).where(
        models.Department.college_id == college_id
    ))
    
    # Leave tracking overview (Principal actionable)
    pending_hod_leaves = await session.scalar(select(func.count(models.LeaveRequest.id)).where(
        models.LeaveRequest.college_id == college_id,
        models.LeaveRequest.applicant_role == "hod",
        models.LeaveRequest.status == "pending"
    ))

    # Activity Permission tracking (Principal actionable)
    pending_activities = await session.scalar(select(func.count(models.ActivityPermission.id)).where(
        models.ActivityPermission.college_id == college_id,
        models.ActivityPermission.hod_permission_decision == "approved",
        models.ActivityPermission.principal_noted_at.is_(None)
    ))

    return {
        "total_students": students_count or 0,
        "total_faculty": faculty_count or 0,
        "total_departments": depts_count or 0,
        "pending_hod_leaves": pending_hod_leaves or 0,
        "pending_activities": pending_activities or 0
    }

@app.post("/api/principal/calendar-events")
async def add_principal_calendar_event(
    req: dict = Body(...),
    user: dict = Depends(require_role("principal", "admin")),
    session: AsyncSession = Depends(get_db)
):
    """Add high-level institutional events to the active academic calendar."""
    college_id = user["college_id"]
    
    # Find active calendar
    cal_r = await session.execute(select(models.AcademicCalendar).where(
        models.AcademicCalendar.college_id == college_id,
        models.AcademicCalendar.is_active == True
    ))
    calendar = cal_r.scalars().first()
    if not calendar:
        raise HTTPException(status_code=404, detail="No active academic calendar found")
    
    new_event = {
        "date": req.get("date"),
        "type": req.get("type", "principal_event"),
        "title": req.get("title", "Institutional Event"),
        "description": req.get("description", "")
    }
    
    current_events = calendar.events or []
    current_events.append(new_event)
    calendar.events = current_events
    await session.commit()
    
    return {"message": "Event added to institutional calendar successfully"}

@app.get("/api/principal/reports/academic-performance")
async def get_academic_performance(
    semester: int,
    academic_year: str,
    user: dict = Depends(require_role("principal", "admin")),
    session: AsyncSession = Depends(get_db)
):
    """Aggregates pass/fail statistics grouped by department and subject."""
    stmt = select(
        models.SemesterGrade.course_id,
        models.User.profile_data['department'].astext.label('department_id'),
        func.count(models.SemesterGrade.id).label("total_students"),
        func.sum(func.cast(models.SemesterGrade.grade_points >= 4, models.Integer)).label("passed_students"), # Assuming >=4 is pass
        func.avg(models.SemesterGrade.grade_points).label("average_grade_point")
    ).join(
        models.User, models.User.id == models.SemesterGrade.student_id
    ).where(
        models.SemesterGrade.college_id == user["college_id"],
        models.SemesterGrade.semester == semester,
        models.SemesterGrade.academic_year == academic_year
    ).group_by(
        models.SemesterGrade.course_id,
        models.User.profile_data['department'].astext
    )
    
    result = await session.execute(stmt)
    rows = result.all()
    
    data = []
    for row in rows:
        total = row.total_students or 0
        passed = row.passed_students or 0
        data.append({
            "course_id": row.course_id,
            "department_id": row.department_id,
            "total_students": total,
            "passed_students": passed,
            "failed_students": total - passed,
            "pass_percentage": round((passed / total * 100) if total > 0 else 0, 2),
            "average_grade_point": round(row.average_grade_point or 0, 2)
        })
    return data

@app.get("/api/principal/reports/attendance-compliance")
async def get_attendance_compliance(
    academic_year: str,
    user: dict = Depends(require_role("principal", "admin")),
    session: AsyncSession = Depends(get_db)
):
    """Department-wise attendance compliance and unmarked slots."""
    college_id = user["college_id"]
    
    # Query 1: Student Defaulters grouped by department
    # Calculate attendance % and count defaulters (<75%)
    # This assumes student profile_data['department'] holds their dept code.
    defaulters_stmt = text('''
        SELECT 
            u.profile_data->>'department' AS department,
            COUNT(u.id) AS total_students,
            SUM(CASE WHEN 
                (CAST(u.profile_data->>'total_classes_attended' AS FLOAT) / 
                 NULLIF(CAST(u.profile_data->>'total_classes_held' AS FLOAT), 0)) < 0.75 
            THEN 1 ELSE 0 END) AS defaulters_count
        FROM users u
        WHERE u.college_id = :college_id AND u.role = 'student'
        GROUP BY u.profile_data->>'department'
    ''')
    
    defaulters_r = await session.execute(defaulters_stmt, {"college_id": college_id})
    dept_defaulters = {}
    for row in defaulters_r:
        dept = row.department or "Unknown"
        dept_defaulters[dept] = {
            "total_students": row.total_students,
            "defaulters_count": row.defaulters_count,
            "compliance_rate": round(100 - ((row.defaulters_count or 0)/(row.total_students or 1)* 100), 2)
        }
        
    # Query 2: Unmarked periods grouped by department
    unmarked_stmt = text('''
        SELECT 
            tt.department_id as department,
            COUNT(ps.id) as unmarked_slots
        FROM period_slots ps
        JOIN timetables tt ON tt.id = ps.timetable_id
        LEFT JOIN attendance_records ar ON ar.timetable_id = tt.id AND ar.date = ps.date AND ar.period_number = ps.period_number AND ar.is_deleted = false
        WHERE ps.college_id = :college_id AND ps.date <= CURRENT_DATE AND ar.id IS NULL AND ps.is_deleted = false
        GROUP BY tt.department_id
    ''')
    unmarked_r = await session.execute(unmarked_stmt, {"college_id": college_id})
    unmarked_slots = {}
    for row in unmarked_r:
        unmarked_slots[row.department] = row.unmarked_slots
        
    # Merge
    all_depts = set(list(dept_defaulters.keys()) + list(unmarked_slots.keys()))
    final_data = []
    for dept in all_depts:
        final_data.append({
            "department_id": dept,
            "student_attendance": dept_defaulters.get(dept, {"total_students": 0, "defaulters_count": 0, "compliance_rate": 0}),
            "unmarked_faculty_slots": unmarked_slots.get(dept, 0)
        })
        
    return final_data

@app.get("/api/principal/reports/cia-status")
async def get_cia_status(
    academic_year: str,
    user: dict = Depends(require_role("principal", "admin")),
    session: AsyncSession = Depends(get_db)
):
    """Tracks submission pipeline (draft, submitted, HOD approved) of CIA marks."""
    # We join FacultyAssignment with MarkEntry to see the status per assignment
    stmt = select(
        models.FacultyAssignment.department_id,
        models.FacultyAssignment.subject_code,
        func.coalesce(models.MarkEntry.extra_data['status'].astext, 'pending').label('cia_status'),
        func.count(models.FacultyAssignment.id).label('count')
    ).outerjoin(
        models.MarkEntry, and_(
            models.MarkEntry.subject_code == models.FacultyAssignment.subject_code,
            models.MarkEntry.college_id == models.FacultyAssignment.college_id
            # Distinct entry linkage assumed here for aggregation sake
        )
    ).where(
        models.FacultyAssignment.college_id == user["college_id"],
        models.FacultyAssignment.academic_year == academic_year
    ).group_by(
        models.FacultyAssignment.department_id,
        models.FacultyAssignment.subject_code,
        func.coalesce(models.MarkEntry.extra_data['status'].astext, 'pending')
    )
    
    rows = (await session.execute(stmt)).all()
    data = []
    for r in rows:
        data.append({
            "department_id": r.department_id,
            "subject_code": r.subject_code,
            "status": r.cia_status,
            "count": r.count
        })
    return data

@app.get("/api/principal/reports/staff-profiles")
async def get_staff_profiles_status(
    user: dict = Depends(require_role("principal", "admin")),
    session: AsyncSession = Depends(get_db)
):
    """Checks completeness of staff profiles."""
    stmt = text('''
        SELECT 
            profile_data->>'department' as department,
            COUNT(*) as total_faculty,
            SUM(CASE WHEN 
                jsonb_typeof(profile_data->'educational') = 'array' AND jsonb_array_length(profile_data->'educational') > 0
                AND profile_data ? 'experience'
            THEN 1 ELSE 0 END) as complete_profiles
        FROM users
        WHERE college_id = :college_id AND role IN ('teacher', 'faculty', 'hod')
        GROUP BY profile_data->>'department'
    ''')
    
    rows = await session.execute(stmt, {"college_id": user["college_id"]})
    return [{
        "department_id": r.department or "Unknown",
        "total_faculty": r.total_faculty,
        "complete_profiles": r.complete_profiles,
        "incomplete_profiles": r.total_faculty - r.complete_profiles,
        "completeness_percentage": round((r.complete_profiles / r.total_faculty * 100) if r.total_faculty > 0 else 0)
    } for r in rows]

@app.put("/api/principal/grievances/{grievance_id}/reassign")
async def reassign_grievance(
    grievance_id: str,
    req: dict = Body(...), # expect {"department_id": "CSE"}
    user: dict = Depends(require_role("principal", "admin")),
    session: AsyncSession = Depends(get_db)
):
    """Principal re-assigns a grievance to a specific department."""
    target_dept = req.get("department_id")
    if not target_dept:
        raise HTTPException(status_code=400, detail="Missing department_id")
        
    gr = await session.execute(select(models.Grievance).where(
        models.Grievance.id == grievance_id,
        models.Grievance.college_id == user["college_id"]
    ))
    grievance = gr.scalars().first()
    if not grievance:
        raise HTTPException(status_code=404, detail="Grievance not found")
        
    grievance.assigned_department = target_dept
    await session.commit()
    return {"message": f"Grievance reassigned to {target_dept}"}

@app.get("/api/principal/infrastructure")
async def get_principal_infrastructure(
    user: dict = Depends(require_role("principal", "admin")), 
    session: AsyncSession = Depends(get_db)
):
    """Read-only view of infrastructure."""
    prof_r = await session.execute(select(models.InstitutionProfile).where(models.InstitutionProfile.college_id == user["college_id"]))
    profile = prof_r.scalars().first()
    
    return profile.infrastructure if profile and profile.infrastructure else {}

@app.get("/api/principal/reports/extension-activities")
async def get_extension_activities(
    user: dict = Depends(require_role("principal", "admin")), 
    session: AsyncSession = Depends(get_db)
):
    """Aggregates NSS and NCC activities from ActivityPermissions."""
    base_activity_route_implemented = False # Placeholder check
    try:
        stmt = select(
            models.ActivityPermission.activity_type,
            func.count(models.ActivityPermission.id).label("total")
        ).where(
            models.ActivityPermission.college_id == user["college_id"],
            models.ActivityPermission.activity_type.in_(["ncc", "nss"]),
            models.ActivityPermission.hod_report_decision == "accepted"
        ).group_by(models.ActivityPermission.activity_type)
        r = await session.execute(stmt)
        return [{"activity_type": row.activity_type, "completed_events": row.total} for row in r.all()]
    except Exception as e:
        # Fallback to institution_profile static data if DB error
        prof_r = await session.execute(select(models.InstitutionProfile).where(models.InstitutionProfile.college_id == user["college_id"]))
        profile = prof_r.scalars().first()
        return profile.extension_activities if profile and profile.extension_activities else []

# ─── Mocked/Stubbed Placeholders (Strict Shapes) ──────────────────────────────────

@app.get("/api/principal/reports/placement")
async def get_principal_placement(user: dict = Depends(require_role("principal", "admin"))):
    return {
        "total_placed": 0, 
        "average_ctc": 0, 
        "department_breakdown": [], 
        "academic_year": None
    }

@app.get("/api/principal/tasks")
async def get_principal_tasks(user: dict = Depends(require_role("principal", "admin"))):
    return {"tasks": [], "total": 0}

@app.post("/api/principal/tasks")
async def create_principal_task(user: dict = Depends(require_role("principal", "admin"))):
    return {"tasks": [], "total": 0}

@app.put("/api/hod/tasks/{task_id}/update-status")
async def update_hod_task_status(task_id: str, user: dict = Depends(require_role("hod", "admin"))):
    return {"message": "Not implemented"}

@app.get("/api/principal/meetings")
async def get_principal_meetings(user: dict = Depends(require_role("principal", "admin"))):
    return {"meetings": [], "total": 0}

@app.post("/api/principal/meetings")
async def schedule_principal_meeting(user: dict = Depends(require_role("principal", "admin"))):
    return {"meetings": [], "total": 0}

@app.put("/api/principal/meetings/{meeting_id}/minutes")
async def update_meeting_minutes(meeting_id: str, user: dict = Depends(require_role("principal", "admin"))):
    return {"message": "Not implemented"}

# ─── Annual Report Consolidator ──────────────────────────────────────────────────

@app.get("/api/principal/reports/annual")
async def get_annual_report_consolidation(
    academic_year: str,
    user: dict = Depends(require_role("principal", "admin")),
    session: AsyncSession = Depends(get_db)
):
    """Builds a holistic JSON document wrapping everything up"""
    # Fetch partials (reusing functions sequentially)
    attendance = await get_attendance_compliance(academic_year, user, session)
    cia = await get_cia_status(academic_year, user, session)
    infra = await get_principal_infrastructure(user, session)
    extension = await get_extension_activities(user, session)
    placement = await get_principal_placement(user)
    
    return {
        "academic_year": academic_year,
        "generated_on": datetime.now(timezone.utc).isoformat(),
        "attendance_compliance": attendance,
        "cia_status": cia,
        "infrastructure": infra,
        "extension_activities": extension,
        "placement_overview": placement
    }
