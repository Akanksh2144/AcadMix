import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_
from typing import List, Optional
from collections import defaultdict

from database import get_db
from app.core.security import get_current_user, require_role, redis_client, safe_redis_call
from app import models
import app.schemas as server_schemas
from app.schemas import *

router = APIRouter()

# Roles allowed to read student results
_RESULTS_READ_ROLES = frozenset({
    "student", "teacher", "hod", "exam_cell",
    "admin", "super_admin", "principal", "parent",
    "nodal_officer",
})

# Grade → grade-point mapping (mirrors DEFAULT_GRADE_SCALE in main.py)
_GRADE_POINTS = {
    "O": 10, "A+": 9, "A": 8, "B+": 7, "B": 6,
    "C": 5, "D": 4, "F": 0, "AB": 0,
}


def _compute_gpa(subjects: list) -> float:
    """Weighted GPA = Σ(grade_point × credits) / Σ(credits)."""
    total_credits = sum(s["credits"] for s in subjects)
    if total_credits == 0:
        return 0.0
    weighted = sum(_GRADE_POINTS.get(s["grade"], 0) * s["credits"] for s in subjects)
    return round(weighted / total_credits, 2)


@router.get("/results/semester/{student_id}")
async def get_semester_results(student_id: str, user: dict = Depends(get_current_user), session: AsyncSession = Depends(get_db)):
    # ── Role guard: only privileged roles may read results ────────────────
    if user["role"] not in _RESULTS_READ_ROLES:
        raise HTTPException(status_code=403, detail="Your role is not authorized to view results")

    # Students can only view their own results
    if user["role"] == "student" and user["id"] != student_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Parents can only view results of their linked children
    if user["role"] == "parent":
        link = await session.execute(
            select(models.ParentStudentLink).where(
                models.ParentStudentLink.parent_id == user["id"],
                models.ParentStudentLink.student_id == student_id,
            )
        )
        if not link.scalars().first():
            raise HTTPException(status_code=403, detail="Not authorized to view this student's results")

    # ── Resolve the student's actual college_id for cache consistency ─────
    student_row = await session.execute(
        select(models.User.college_id).where(models.User.id == student_id)
    )
    student_college_id = student_row.scalar_one_or_none()
    if not student_college_id:
        raise HTTPException(status_code=404, detail="Student not found")

    cache_key = f"result:{student_college_id}:{student_id}:v2"
    if redis_client:
        try:
            cached = await safe_redis_call(redis_client.get(cache_key))
            if cached:
                return json.loads(cached)
        except Exception:
            pass

    # ── 1. Fetch semester grades with subject name via LEFT JOIN courses ──
    grade_rows = await session.execute(
        select(
            models.SemesterGrade,
            models.Course.name.label("course_name"),
            models.Course.subject_code.label("course_subject_code"),
        )
        .outerjoin(
            models.Course,
            and_(
                models.Course.subject_code == models.SemesterGrade.course_id,
                models.Course.college_id == student_college_id,
            )
        )
        .where(models.SemesterGrade.student_id == student_id)
        .order_by(models.SemesterGrade.semester.asc())
    )
    all_rows = grade_rows.all()

    # ── 2. Fetch mid-term marks from mark_submissions ────────────────────
    mid_rows = await session.execute(
        select(models.MarkSubmissionEntry, models.MarkSubmission)
        .join(models.MarkSubmission, models.MarkSubmission.id == models.MarkSubmissionEntry.submission_id)
        .where(
            models.MarkSubmissionEntry.student_id == student_id,
            models.MarkSubmission.exam_type.in_(["mid1", "mid2"]),
            models.MarkSubmission.status.in_(["approved", "published"]),
        )
    )
    # Build a lookup: subject_code → {"mid1": marks, "mid2": marks, "mid1_max": max, "mid2_max": max}
    mid_lookup: dict = defaultdict(dict)
    for entry, submission in mid_rows.all():
        key = submission.subject_code
        exam = submission.exam_type  # "mid1" or "mid2"
        mid_lookup[key][f"{exam}_marks"] = entry.marks_obtained
        mid_lookup[key][f"{exam}_max"] = submission.max_marks

    # ── 3. Group by semester, compute SGPA/CGPA ──────────────────────────
    sem_map: dict = defaultdict(list)
    for grade_row, course_name, course_subject_code in all_rows:
        subj_code = grade_row.course_id
        mid_data = mid_lookup.get(subj_code, {})
        sem_map[grade_row.semester].append({
            "name": course_name or subj_code,
            "code": course_subject_code or subj_code,
            "credits": grade_row.credits_earned,
            "grade": grade_row.grade,
            "status": "PASS" if grade_row.grade not in ("F", "AB") else "FAIL",
            "mid1_marks": mid_data.get("mid1_marks"),
            "mid2_marks": mid_data.get("mid2_marks"),
            "mid1_max": mid_data.get("mid1_max"),
            "mid2_max": mid_data.get("mid2_max"),
        })

    # Compute SGPA per semester and cumulative CGPA
    all_subjects_cumulative = []
    response_data = []
    for sem, subjects in sorted(sem_map.items()):
        sgpa = _compute_gpa(subjects)
        all_subjects_cumulative.extend(subjects)
        cgpa = _compute_gpa(all_subjects_cumulative)
        response_data.append({
            "semester": sem,
            "sgpa": sgpa,
            "cgpa": cgpa,
            "subjects": subjects,
        })

    if redis_client:
        try:
            await safe_redis_call(redis_client.setex(cache_key, 86400, json.dumps(response_data)))
        except Exception:
            pass

    return response_data


@router.post("/results/semester")
async def create_semester_result(req: SemesterResultCreate, user: dict = Depends(require_role("teacher", "admin")), session: AsyncSession = Depends(get_db)):
    # Resolve the target student's college_id for correct cache invalidation
    student_row = await session.execute(
        select(models.User.college_id).where(models.User.id == req.student_id)
    )
    student_college_id = student_row.scalar_one_or_none() or user["college_id"]

    for subj in req.subjects:
        row = models.SemesterGrade(
            student_id=req.student_id,
            semester=req.semester,
            course_id=subj.get("code", subj.get("name", "UNKNOWN")),
            grade=subj.get("grade", "O"),
            credits_earned=int(subj.get("credits", 3)),
        )
        session.add(row)
    await session.commit()
    
    from app.core.security import redis_client, safe_redis_call
    if redis_client:
        try:
            await safe_redis_call(redis_client.delete(f"result:{student_college_id}:{req.student_id}:v2"))
        except Exception:
            pass
        
    return {"message": "Semester result saved", "semester": req.semester, "student_id": req.student_id}
