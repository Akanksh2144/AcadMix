from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.sql import func
from typing import List, Optional
from collections import defaultdict

from database import get_db
from app.core.security import get_current_user
from app.core.security import require_role
from app import models
import app.schemas as server_schemas
from app.schemas import *

router = APIRouter()

@router.get("/analytics/student/{student_id}")
async def student_analytics(student_id: str, user: dict = Depends(get_current_user), session: AsyncSession = Depends(get_db)):
    if user["role"] == "student" and user["id"] != student_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    attempts_r = await session.execute(
        select(models.QuizAttempt)
        .where(models.QuizAttempt.student_id == student_id, models.QuizAttempt.status == "submitted")
        .order_by(models.QuizAttempt.end_time.asc())
    )
    attempts = attempts_r.scalars().all()
    semesters_r = await session.execute(
        select(models.SemesterGrade)
        .where(models.SemesterGrade.student_id == student_id)
        .order_by(models.SemesterGrade.semester.asc())
    )
    sem_rows = semesters_r.scalars().all()
    total_quizzes = len(attempts)
    avg_score = round(sum(a.final_score or 0 for a in attempts) / total_quizzes, 1) if total_quizzes > 0 else 0
    best_score = max((a.final_score or 0 for a in attempts), default=0)
    quiz_trend = [{
        "date": a.end_time.isoformat() if a.end_time else "",
        "score": a.final_score or 0, "quiz": a.quiz_id
    } for a in attempts[-10:]]
    sem_map = defaultdict(list)
    for row in sem_rows:
        sem_map[row.semester].append({"course_id": row.course_id, "grade": row.grade, "credits": row.credits_earned})
    semesters = [{"semester": sem, "subjects": subjs} for sem, subjs in sorted(sem_map.items())]
    return {
        "total_quizzes": total_quizzes, "avg_score": avg_score, "best_score": best_score,
        "latest_cgpa": 0, "quiz_trend": quiz_trend, "subject_averages": {},
        "semesters": semesters
    }


@router.get("/analytics/teacher/class-results")
async def class_results_analytics(
    user: dict = Depends(require_role("teacher", "hod", "exam_cell", "admin")),
    session: AsyncSession = Depends(get_db)
):
    college_id = user["college_id"]

    # ── 1. Assigned classes from FacultyAssignment ────────────────────────
    stmt = select(models.FacultyAssignment).where(
        models.FacultyAssignment.college_id == college_id
    )
    if user["role"] == "teacher":
        stmt = stmt.where(models.FacultyAssignment.teacher_id == user["id"])
    assignments_r = await session.execute(stmt)
    assignments = assignments_r.scalars().all()

    assigned_classes = []
    seen_keys = set()
    for a in assignments:
        class_key = f"{a.subject_code}_{a.batch}_{a.section}"
        if class_key in seen_keys:
            continue
        seen_keys.add(class_key)
        assigned_classes.append({
            "id": a.id,
            "class_key": class_key,
            "section": f"{a.department} {a.batch} {a.section}",
            "department": a.department,
            "subject": a.subject_name,
            "subject_code": a.subject_code,
            "batch": str(a.batch),
            "totalStudents": 0,  # populated in Fix 4
        })

    # ── 2. totalStudents per class_key ────────────────────────────────────
    student_counts_r = await session.execute(
        select(
            models.UserProfile.department,
            models.UserProfile.batch,
            models.UserProfile.section,
            func.count(models.UserProfile.user_id).label("cnt"),
        )
        .join(models.User, models.User.id == models.UserProfile.user_id)
        .where(
            models.UserProfile.college_id == college_id,
            models.User.role == "student",
        )
        .group_by(
            models.UserProfile.department,
            models.UserProfile.batch,
            models.UserProfile.section,
        )
    )
    student_count_map = {
        f"{row.department}_{row.batch}_{row.section}": row.cnt
        for row in student_counts_r.all()
    }
    for cls in assigned_classes:
        cls["totalStudents"] = student_count_map.get(
            f"{cls['department']}_{cls['batch']}_{cls['section']}", 0
        )

    # ── 3. Quiz results keyed by class_key ────────────────────────────────
    quiz_attempts_r = await session.execute(
        select(
            models.QuizAttempt,
            models.Quiz.title,
            models.Quiz.total_marks,
            models.Quiz.created_at.label("quiz_date"),
            models.Course.subject_code,
            models.UserProfile.batch,
            models.UserProfile.section,
        )
        .join(models.Quiz, models.Quiz.id == models.QuizAttempt.quiz_id)
        .outerjoin(models.Course, models.Course.id == models.Quiz.course_id)
        .join(models.UserProfile, models.UserProfile.user_id == models.QuizAttempt.student_id)
        .where(
            models.QuizAttempt.status == "submitted",
            models.Quiz.college_id == college_id,
        )
    )
    quiz_rows = quiz_attempts_r.all()

    # Group: class_key → quiz_id → aggregation
    quiz_agg: dict = defaultdict(lambda: defaultdict(lambda: {
        "completed": 0, "total_score": 0.0, "passed": 0,
        "title": "", "total_marks": 0, "quiz_date": None,
    }))
    for attempt, title, total_marks, quiz_date, subject_code, batch, section in quiz_rows:
        if not subject_code:
            continue
        class_key = f"{subject_code}_{batch}_{section}"
        if class_key not in seen_keys:
            continue  # only include classes this teacher is assigned to
        agg = quiz_agg[class_key][attempt.quiz_id]
        agg["completed"] += 1
        agg["total_score"] += attempt.final_score or 0
        agg["title"] = title or "Untitled Quiz"
        agg["total_marks"] = total_marks or 0
        agg["quiz_date"] = quiz_date.isoformat() if quiz_date else None
        if (attempt.final_score or 0) >= (total_marks or 100) * 0.4:
            agg["passed"] += 1

    quiz_results: dict = {}
    for class_key, quizzes in quiz_agg.items():
        quiz_results[class_key] = []
        for qid, stat in quizzes.items():
            avg = round(stat["total_score"] / stat["completed"], 1) if stat["completed"] > 0 else 0
            quiz_results[class_key].append({
                "id": qid,
                "title": stat["title"],
                "date": stat["quiz_date"],
                "maxScore": stat["total_marks"],
                "completed": stat["completed"],
                "avgScore": avg,
                "passRate": round((stat["passed"] / stat["completed"]) * 100) if stat["completed"] > 0 else 0,
            })

    # ── 4. Mid-marks keyed by class_key ───────────────────────────────────
    mid_stmt = (
        select(models.MarkSubmission, models.FacultyAssignment)
        .join(
            models.FacultyAssignment,
            models.FacultyAssignment.id == models.MarkSubmission.assignment_id,
        )
        .where(
            models.MarkSubmission.college_id == college_id,
            models.MarkSubmission.exam_type.in_(["mid1", "mid2"]),
            models.MarkSubmission.status.in_(["approved", "published"]),
        )
    )
    if user["role"] == "teacher":
        mid_stmt = mid_stmt.where(models.MarkSubmission.faculty_id == user["id"])
    mid_r = await session.execute(mid_stmt)
    mid_submissions = mid_r.all()

    # Collect submission IDs to fetch avg marks
    submission_ids = [sub.id for sub, _ in mid_submissions]
    avg_marks_map: dict = {}
    if submission_ids:
        avg_r = await session.execute(
            select(
                models.MarkSubmissionEntry.submission_id,
                func.avg(models.MarkSubmissionEntry.marks_obtained).label("avg"),
                func.count(models.MarkSubmissionEntry.student_id).label("cnt"),
            )
            .where(models.MarkSubmissionEntry.submission_id.in_(submission_ids))
            .group_by(models.MarkSubmissionEntry.submission_id)
        )
        for row in avg_r.all():
            avg_marks_map[row.submission_id] = {
                "avg": round(row.avg, 1) if row.avg else 0,
                "cnt": row.cnt,
            }

    mid_marks: dict = defaultdict(lambda: {"mid1": None, "mid2": None})
    for sub, fa in mid_submissions:
        class_key = f"{fa.subject_code}_{fa.batch}_{fa.section}"
        if class_key not in seen_keys:
            continue
        stats = avg_marks_map.get(sub.id, {"avg": 0, "cnt": 0})
        mid_marks[class_key][sub.exam_type] = {
            "submission_id": sub.id,
            "max_marks": sub.max_marks,
            "avg_marks": stats["avg"],
            "student_count": stats["cnt"],
            "published_at": sub.published_at.isoformat() if sub.published_at else None,
        }

    return {
        "assignedClasses": assigned_classes,
        "quizResults": quiz_results,
        "midMarks": dict(mid_marks),
    }


@router.get("/analytics/teacher/quiz-results/{quiz_id}")
async def get_quiz_detailed_analytics(quiz_id: str, department: str = "", batch: str = "", section: str = "", user: dict = Depends(require_role("teacher", "hod", "exam_cell", "admin")), session: AsyncSession = Depends(get_db)):
    stmt = select(models.User).where(
        models.User.role == "student",
        models.User.college_id == user["college_id"]
    )
    result = await session.execute(stmt)
    students = result.scalars().all()
    attempts_r = await session.execute(
        select(models.QuizAttempt).where(models.QuizAttempt.quiz_id == quiz_id)
    )
    attempts_map = {a.student_id: a for a in attempts_r.scalars().all()}
    results = []
    for s in students:
        attempt = attempts_map.get(s.id)
        if attempt:
            pct = attempt.final_score or 0
            raw = attempt.status
            time_elapsed = 0
            if attempt.start_time and attempt.end_time:
                time_elapsed = max(0, int((attempt.end_time - attempt.start_time).total_seconds() / 60))
            results.append({
                "id": s.id, "name": s.name,
                "rollNo": (s.profile_data or {}).get("college_id", s.id),
                "scoreValue": pct, "score": f"{pct}%",
                "timeTaken": f"{time_elapsed} mins",
                "status": "In Progress" if raw == "in_progress" else ("Pass" if pct >= 40 else "Fail"),
                "raw_status": raw
            })
        else:
            results.append({
                "id": s.id, "name": s.name,
                "rollNo": (s.profile_data or {}).get("college_id", s.id),
                "scoreValue": -1, "score": "-", "timeTaken": "-",
                "status": "Not Attempted", "raw_status": "none"
            })
    results.sort(key=lambda x: str(x["rollNo"]))
    return results
