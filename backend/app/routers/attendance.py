from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from database import get_db
from app.core.security import get_current_user
from app.core.security import require_role
from app.services.attendance_service import AttendanceService
import app.schemas as server_schemas
from app.schemas import *

router = APIRouter()

def get_attendance_service(session: AsyncSession = Depends(get_db)):
    return AttendanceService(session)

@router.get("/faculty/attendance/today")
async def get_today_attendance_status(
    user: dict = Depends(require_role("teacher", "faculty", "hod")), 
    svc: AttendanceService = Depends(get_attendance_service)
):
    b_acad_year = None
    try:
        from app.core.utils import get_current_academic_year
        b_acad_year = await get_current_academic_year(svc.session, user["college_id"])
    except Exception:
        pass
    return await svc.get_today_faculty_status(user, b_acad_year)

@router.post("/faculty/attendance/mark")
async def mark_attendance_batch(
    req: server_schemas.AttendanceMarkBatch, 
    user: dict = Depends(require_role("teacher", "faculty", "hod")), 
    svc: AttendanceService = Depends(get_attendance_service)
):
    return await svc.mark_batch(req, user)

@router.get("/student/attendance")
async def get_student_consolidated_attendance(
    user: dict = Depends(require_role("student")), 
    svc: AttendanceService = Depends(get_attendance_service)
):
    return await svc.get_student_consolidated(user["id"])

@router.get("/student/attendance/detail")
async def get_student_attendance_detail(
    subject_code: Optional[str] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    user: dict = Depends(require_role("student")),
    svc: AttendanceService = Depends(get_attendance_service)
):
    return await svc.get_student_detail(user["id"], subject_code, month, year)

@router.get("/student/attendance/calendar")
async def get_student_attendance_calendar(
    month: Optional[int] = None,
    year: Optional[int] = None,
    user: dict = Depends(require_role("student")),
    svc: AttendanceService = Depends(get_attendance_service)
):
    return await svc.get_student_calendar(user["id"], month, year)

@router.get("/hod/attendance/defaulters")
async def get_attendance_defaulters(
    threshold: float = 75.0,
    academic_year: Optional[str] = None,
    user: dict = Depends(require_role("hod", "admin")),
    svc: AttendanceService = Depends(get_attendance_service)
):
    dept_id = user.get("profile_data", {}).get("department_id", "")
    return await svc.get_defaulters(user["college_id"], dept_id, threshold)

@router.put("/admin/override-attendance")
async def override_student_attendance(
    subject_code: str,
    student_id: str,
    req: server_schemas.AttendanceOverride,
    user: dict = Depends(require_role("teacher", "hod")),
    svc: AttendanceService = Depends(get_attendance_service)
):
    return await svc.override_attendance(subject_code, student_id, req, user)


@router.post("/attendance/daily/punch")
async def record_daily_punch(
    payload: server_schemas.DailyAttendancePunch,
    user: dict = Depends(require_role("admin", "teacher", "hod")),
    svc: AttendanceService = Depends(get_attendance_service)
):
    return await svc.record_daily_punch(user["college_id"], payload)


@router.get("/attendance/daily/staff-summary")
async def get_daily_staff_summary(
    date: Optional[str] = None,
    department: Optional[str] = None,
    user: dict = Depends(require_role("hod", "admin")),
    svc: AttendanceService = Depends(get_attendance_service)
):
    from datetime import date as date_cls
    from datetime import datetime, timezone
    date_val = date_cls.fromisoformat(date) if date else datetime.now(timezone.utc).date()
    return await svc.get_daily_staff_summary(user["college_id"], department, date_val)


@router.get("/attendance/daily/my-logs")
async def get_my_daily_logs(
    month: int,
    year: int,
    user: dict = Depends(require_role("student", "teacher", "hod", "admin")),
    svc: AttendanceService = Depends(get_attendance_service)
):
    return await svc.get_my_daily_logs(user["id"], month, year)


@router.post("/hod/attendance/send-defaulter-alerts")
async def send_defaulter_alerts(
    req: server_schemas.DefaulterAlertRequest,
    user: dict = Depends(require_role("hod")),
    svc: AttendanceService = Depends(get_attendance_service)
):
    dept_id = user.get("profile_data", {}).get("department_id", "")
    if not dept_id:
        dept_id = user.get("profile_data", {}).get("department", "")
    return await svc.trigger_defaulter_alerts(user["college_id"], dept_id, req.threshold, user["id"])


@router.post("/attendance/daily/upload-logs")
async def upload_daily_attendance_csv(
    file: UploadFile = File(...),
    user: dict = Depends(require_role("hod", "admin")),
    svc: AttendanceService = Depends(get_attendance_service)
):
    content_bytes = await file.read()
    content_str = content_bytes.decode("utf-8")
    return await svc.upload_daily_punch_csv(user["college_id"], content_str)


@router.post("/admin/attendance/upload-rfid-mapping")
async def upload_rfid_mapping_csv(
    file: UploadFile = File(...),
    user: dict = Depends(require_role("hod", "admin")),
    svc: AttendanceService = Depends(get_attendance_service)
):
    content_bytes = await file.read()
    content_str = content_bytes.decode("utf-8")
    return await svc.upload_rfid_mapping_csv(user["college_id"], content_str)



