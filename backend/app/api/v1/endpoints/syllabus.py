from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from app.core.security import require_role
from app.services.syllabus_service import SyllabusService
import app.schemas as schemas

router = APIRouter()


def get_svc(session: AsyncSession = Depends(get_db)):
    return SyllabusService(session)


# ── Faculty: Get syllabus for a course ───────────────────────────────────────
@router.get("/syllabus/{course_id}")
async def get_syllabus(
    course_id: str,
    user: dict = Depends(require_role("teacher", "faculty", "hod", "admin", "principal")),
    svc: SyllabusService = Depends(get_svc)
):
    return await svc.get_syllabus(course_id, user["college_id"], faculty_id=user["id"])


# ── Faculty: Upsert full syllabus ────────────────────────────────────────────
@router.post("/syllabus/{course_id}")
async def upsert_syllabus(
    course_id: str,
    data: schemas.SyllabusBulkCreate,
    user: dict = Depends(require_role("teacher", "faculty", "hod")),
    svc: SyllabusService = Depends(get_svc)
):
    return await svc.upsert_syllabus(course_id, user["college_id"], user["id"], data)


# ── AttendanceMarker: Get topics by subject_code ─────────────────────────────
@router.get("/syllabus/topics-by-subject/{subject_code}")
async def get_topics_by_subject(
    subject_code: str,
    user: dict = Depends(require_role("teacher", "faculty", "hod")),
    svc: SyllabusService = Depends(get_svc)
):
    return await svc.get_topics_by_subject_code(subject_code, user["college_id"])


# ── HOD: Department coverage ─────────────────────────────────────────────────
@router.get("/hod/syllabus/coverage")
async def get_hod_coverage(
    user: dict = Depends(require_role("hod")),
    svc: SyllabusService = Depends(get_svc)
):
    dept_id = user.get("profile_data", {}).get("department_id", "")
    return await svc.get_department_coverage(user["college_id"], dept_id)


# ── Principal: Institution coverage ──────────────────────────────────────────
@router.get("/principal/syllabus/coverage")
async def get_principal_coverage(
    user: dict = Depends(require_role("principal", "admin")),
    svc: SyllabusService = Depends(get_svc)
):
    return await svc.get_institution_coverage(user["college_id"])
