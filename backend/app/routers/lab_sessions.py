"""
Lab Exam Session Router
========================
Faculty endpoints for managing lab sessions, question banks, and assignments.
Student endpoints for joining sessions, fetching state, and submitting code.

Channels:
  - lab_monitor:{session_id} — faculty live board updates (WebSocket)
"""

import logging
import random
import string
from datetime import datetime, timezone
from typing import List, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app import models
from app.core.config import settings
from app.core.security import get_current_user, require_role
from app.models.lab import LabQuestion, LabSession, LabStudentQuestion, LabSubmission
from app.routers.websocket import manager
from database import get_db

router = APIRouter()
logger = logging.getLogger("acadmix.lab")

# Reuse the global connection-pooled HTTP client from code_execution
_http_client = httpx.AsyncClient(
    limits=httpx.Limits(max_keepalive_connections=50, max_connections=100),
    timeout=httpx.Timeout(65.0, connect=5.0),
)


# ═══════════════════════════════════════════════════════════════════════════════
# PYDANTIC SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════


class SessionCreate(BaseModel):
    subject: str = Field(..., max_length=100)
    title: str = Field(..., max_length=200)
    batch: str = Field(..., max_length=50)
    section: str = Field(..., max_length=50)
    semester: int = Field(..., ge=1, le=12)
    assignment_mode: str = Field("cyclic", pattern=r"^(random|cyclic|manual)$")
    questions_per_student: int = Field(1, ge=1, le=10)


class QuestionCreate(BaseModel):
    subject: str = Field(..., max_length=100)
    title: str = Field(..., max_length=300)
    description: str
    starter_code: Optional[str] = None
    language: str = Field(..., max_length=30)
    test_input: Optional[str] = None
    expected_output: str
    difficulty: str = Field("medium", pattern=r"^(easy|medium|hard)$")


class QuestionUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=300)
    description: Optional[str] = None
    starter_code: Optional[str] = None
    language: Optional[str] = Field(None, max_length=30)
    test_input: Optional[str] = None
    expected_output: Optional[str] = None
    difficulty: Optional[str] = Field(None, pattern=r"^(easy|medium|hard)$")


class ManualAssignment(BaseModel):
    """One entry in the manual assignment list."""

    student_id: str
    question_id: str
    slot_number: int = 1


class ManualAssignRequest(BaseModel):
    assignments: List[ManualAssignment]


class JoinRequest(BaseModel):
    session_code: str = Field(..., min_length=6, max_length=6)


class SubmitRequest(BaseModel):
    question_id: str
    code: str = Field(..., max_length=50000)
    language: str = Field(..., max_length=30)


# ═══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════════════════


async def _generate_session_code(session: AsyncSession, max_retries: int = 10) -> str:
    """Generate a unique 6-char alphanumeric session code with collision retry."""
    for _ in range(max_retries):
        code = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
        existing = await session.execute(select(LabSession.id).where(LabSession.session_code == code))
        if not existing.scalars().first():
            return code
    raise HTTPException(status_code=500, detail="Failed to generate unique session code after retries")


async def _get_session_or_404(session_id: str, college_id: str, db: AsyncSession) -> LabSession:
    result = await db.execute(
        select(LabSession).where(
            LabSession.id == session_id,
            LabSession.college_id == college_id,
            LabSession.is_deleted == False,
        )
    )
    lab_session = result.scalars().first()
    if not lab_session:
        raise HTTPException(status_code=404, detail="Lab session not found")
    return lab_session


async def _get_students_by_batch_section(college_id: str, batch: str, section: str, db: AsyncSession) -> list:
    """Fetch students sorted by roll_number for the given batch + section."""
    result = await db.execute(
        select(models.User.id, models.UserProfile.roll_number, models.User.name)
        .join(models.UserProfile, models.UserProfile.user_id == models.User.id)
        .where(
            models.User.college_id == college_id,
            models.User.role == "student",
            models.User.is_deleted == False,
            models.UserProfile.batch == batch,
            models.UserProfile.section == section,
        )
        .order_by(models.UserProfile.roll_number.asc())
    )
    return result.all()


async def _clear_assignments(session_id: str, db: AsyncSession):
    """Delete all existing assignments for a session."""
    existing = await db.execute(select(LabStudentQuestion).where(LabStudentQuestion.session_id == session_id))
    for row in existing.scalars().all():
        await db.delete(row)


async def _broadcast_lab_event(session_id: str, event: dict):
    """Broadcast event to lab monitor WebSocket channel."""
    try:
        await manager.broadcast(f"lab_monitor:{session_id}", event)
    except Exception as e:
        logger.warning("Lab WS broadcast failed for session %s: %s", session_id, e)


# ═══════════════════════════════════════════════════════════════════════════════
# FACULTY — SESSION CRUD
# ═══════════════════════════════════════════════════════════════════════════════


@router.post("/lab/sessions")
async def create_session(
    req: SessionCreate,
    user: dict = Depends(require_role("teacher", "admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    if user["role"] == "teacher":
        stmt = select(models.FacultyAssignment).where(
            models.FacultyAssignment.teacher_id == user["id"],
            models.FacultyAssignment.college_id == user["college_id"],
            models.FacultyAssignment.subject_name == req.subject,
            models.FacultyAssignment.batch == req.batch,
            models.FacultyAssignment.section == req.section,
            models.FacultyAssignment.is_deleted == False,
        )
        res = await db.execute(stmt)
        assignment = res.scalars().first()
        if not assignment:
            raise HTTPException(
                status_code=400,
                detail="You are not assigned to teach this subject to this batch/section."
            )

    code = await _generate_session_code(db)
    lab_session = LabSession(
        college_id=user["college_id"],
        faculty_id=user["id"],
        subject=req.subject,
        title=req.title,
        batch=req.batch,
        section=req.section,
        semester=req.semester,
        session_code=code,
        status="draft",
        assignment_mode=req.assignment_mode,
        questions_per_student=req.questions_per_student,
    )
    db.add(lab_session)
    await db.flush()
    session_id = lab_session.id
    await db.commit()
    return {
        "id": session_id,
        "session_code": code,
        "status": "draft",
        "title": req.title,
    }


@router.get("/lab/sessions")
async def list_sessions(
    status: Optional[str] = None,
    user: dict = Depends(require_role("teacher", "admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(LabSession).where(
        LabSession.college_id == user["college_id"],
        LabSession.is_deleted == False,
    )
    if user["role"] == "teacher":
        stmt = stmt.where(LabSession.faculty_id == user["id"])
    if status:
        stmt = stmt.where(LabSession.status == status)
    result = await db.execute(stmt.order_by(LabSession.created_at.desc()))
    sessions = result.scalars().all()

    out = []
    for s in sessions:
        # Count assignments for each session
        cnt_r = await db.execute(select(func.count(LabStudentQuestion.id)).where(LabStudentQuestion.session_id == s.id))
        assignment_count = cnt_r.scalar() or 0
        out.append(
            {
                "id": s.id,
                "subject": s.subject,
                "title": s.title,
                "batch": s.batch,
                "section": s.section,
                "semester": s.semester,
                "session_code": s.session_code,
                "status": s.status,
                "assignment_mode": s.assignment_mode,
                "questions_per_student": s.questions_per_student,
                "assignment_count": assignment_count,
                "started_at": s.started_at.isoformat() if s.started_at else None,
                "ended_at": s.ended_at.isoformat() if s.ended_at else None,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
        )
    return out


@router.get("/lab/sessions/{session_id}")
async def get_session(
    session_id: str,
    user: dict = Depends(require_role("teacher", "admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    s = await _get_session_or_404(session_id, user["college_id"], db)

    # Get assignment count
    cnt_r = await db.execute(select(func.count(LabStudentQuestion.id)).where(LabStudentQuestion.session_id == s.id))
    assignment_count = cnt_r.scalar() or 0

    # Get question IDs linked to this session
    q_r = await db.execute(
        select(LabStudentQuestion.question_id).where(LabStudentQuestion.session_id == s.id).distinct()
    )
    question_ids = [r[0] for r in q_r.all()]

    questions = []
    if question_ids:
        qr = await db.execute(select(LabQuestion).where(LabQuestion.id.in_(question_ids)))
        for q in qr.scalars().all():
            questions.append(
                {
                    "id": q.id,
                    "title": q.title,
                    "subject": q.subject,
                    "language": q.language,
                    "difficulty": q.difficulty,
                }
            )

    return {
        "id": s.id,
        "college_id": s.college_id,
        "faculty_id": s.faculty_id,
        "subject": s.subject,
        "title": s.title,
        "batch": s.batch,
        "section": s.section,
        "semester": s.semester,
        "session_code": s.session_code,
        "status": s.status,
        "assignment_mode": s.assignment_mode,
        "questions_per_student": s.questions_per_student,
        "assignment_count": assignment_count,
        "questions": questions,
        "started_at": s.started_at.isoformat() if s.started_at else None,
        "ended_at": s.ended_at.isoformat() if s.ended_at else None,
        "created_at": s.created_at.isoformat() if s.created_at else None,
    }


@router.delete("/lab/sessions/{session_id}")
async def delete_session(
    session_id: str,
    user: dict = Depends(require_role("teacher", "admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    s = await _get_session_or_404(session_id, user["college_id"], db)
    if s.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft sessions can be deleted")
    if s.faculty_id != user["id"] and user["role"] not in ("admin", "hod"):
        raise HTTPException(status_code=403, detail="Not authorized to delete this session")
    s.is_deleted = True
    s.deleted_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "Session deleted"}


# ═══════════════════════════════════════════════════════════════════════════════
# FACULTY — QUESTION BANK
# ═══════════════════════════════════════════════════════════════════════════════


@router.get("/lab/questions")
async def list_questions(
    subject: Optional[str] = None,
    source: Optional[str] = None,
    difficulty: Optional[str] = None,
    user: dict = Depends(require_role("teacher", "admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    """Browse question bank — shows platform questions + own college questions."""
    from sqlalchemy import or_

    stmt = select(LabQuestion).where(
        LabQuestion.is_deleted == False,
        or_(
            LabQuestion.college_id == user["college_id"],  # College registry
            LabQuestion.college_id.is_(None),  # Platform library
        ),
    )
    if subject:
        stmt = stmt.where(LabQuestion.subject == subject)
    if source:
        stmt = stmt.where(LabQuestion.source == source)
    if difficulty:
        stmt = stmt.where(LabQuestion.difficulty == difficulty)

    result = await db.execute(stmt.order_by(LabQuestion.created_at.desc()))
    questions = result.scalars().all()

    return [
        {
            "id": q.id,
            "source": q.source,
            "subject": q.subject,
            "title": q.title,
            "description": q.description,
            "starter_code": q.starter_code,
            "language": q.language,
            "test_input": q.test_input,
            "expected_output": q.expected_output,
            "difficulty": q.difficulty,
            "created_by": q.created_by,
            "created_at": q.created_at.isoformat() if q.created_at else None,
            "is_own": q.created_by == user["id"],
        }
        for q in questions
    ]


@router.post("/lab/questions")
async def create_question(
    req: QuestionCreate,
    user: dict = Depends(require_role("teacher", "admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    question = LabQuestion(
        college_id=user["college_id"],
        source="college",
        subject=req.subject,
        title=req.title,
        description=req.description,
        starter_code=req.starter_code,
        language=req.language,
        test_input=req.test_input,
        expected_output=req.expected_output,
        difficulty=req.difficulty,
        created_by=user["id"],
    )
    db.add(question)
    await db.flush()
    q_id = question.id
    await db.commit()
    return {"id": q_id, "title": req.title, "message": "Question created"}


@router.put("/lab/questions/{question_id}")
async def update_question(
    question_id: str,
    req: QuestionUpdate,
    user: dict = Depends(require_role("teacher", "admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LabQuestion).where(
            LabQuestion.id == question_id,
            LabQuestion.college_id == user["college_id"],
            LabQuestion.source == "college",
            LabQuestion.is_deleted == False,
        )
    )
    q = result.scalars().first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found or not editable")
    if q.created_by != user["id"] and user["role"] not in ("admin", "hod"):
        raise HTTPException(status_code=403, detail="Can only edit your own questions")

    if req.title is not None:
        q.title = req.title
    if req.description is not None:
        q.description = req.description
    if req.starter_code is not None:
        q.starter_code = req.starter_code
    if req.language is not None:
        q.language = req.language
    if req.test_input is not None:
        q.test_input = req.test_input
    if req.expected_output is not None:
        q.expected_output = req.expected_output
    if req.difficulty is not None:
        q.difficulty = req.difficulty

    await db.commit()
    return {"id": q.id, "title": q.title, "message": "Question updated"}


@router.delete("/lab/questions/{question_id}")
async def delete_question(
    question_id: str,
    user: dict = Depends(require_role("teacher", "admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LabQuestion).where(
            LabQuestion.id == question_id,
            LabQuestion.college_id == user["college_id"],
            LabQuestion.source == "college",
            LabQuestion.is_deleted == False,
        )
    )
    q = result.scalars().first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found or not deletable")
    if q.created_by != user["id"] and user["role"] not in ("admin", "hod"):
        raise HTTPException(status_code=403, detail="Can only delete your own questions")

    q.is_deleted = True
    q.deleted_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "Question deleted"}


# ═══════════════════════════════════════════════════════════════════════════════
# FACULTY — ASSIGNMENT ALGORITHMS
# ═══════════════════════════════════════════════════════════════════════════════


@router.post("/lab/sessions/{session_id}/assign/random")
async def assign_random(
    session_id: str,
    body: dict,
    user: dict = Depends(require_role("teacher", "admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    """Random anti-consecutive assignment.

    Body: { "question_ids": ["q1", "q2", ...] }

    Algorithm: sort students by roll, shuffle questions, assign ensuring
    student[i] doesn't get the same question as student[i-1].
    For multiple questions per student, also ensure no question appears
    twice for the same student.
    """
    s = await _get_session_or_404(session_id, user["college_id"], db)
    if s.status != "draft":
        raise HTTPException(status_code=400, detail="Can only assign questions to draft sessions")

    question_ids = body.get("question_ids", [])
    if not question_ids:
        raise HTTPException(status_code=400, detail="question_ids required")

    # Validate questions exist
    q_r = await db.execute(select(LabQuestion.id).where(LabQuestion.id.in_(question_ids)))
    valid_ids = {r[0] for r in q_r.all()}
    if len(valid_ids) != len(question_ids):
        raise HTTPException(status_code=400, detail="Some question IDs are invalid")

    students = await _get_students_by_batch_section(user["college_id"], s.batch, s.section, db)
    if not students:
        raise HTTPException(status_code=400, detail="No students found for this batch/section")

    qps = s.questions_per_student
    if len(question_ids) < 2 and len(students) > 1 and qps == 1:
        raise HTTPException(
            status_code=400,
            detail="Need at least 2 questions for anti-consecutive random with 1 question/student",
        )
    if qps > len(question_ids):
        raise HTTPException(
            status_code=400,
            detail=f"Need at least {qps} questions for {qps} questions/student",
        )

    await _clear_assignments(session_id, db)

    # Build assignments with anti-consecutive constraint
    assignments = []
    for student_idx, (student_id, roll, name) in enumerate(students):
        student_qs = []
        for slot in range(1, qps + 1):
            available = [qid for qid in question_ids if qid not in student_qs]

            # Anti-consecutive: exclude previous student's question at same slot
            if student_idx > 0 and len(available) > 1:
                prev_student_qs = [
                    a["question_id"]
                    for a in assignments
                    if a["student_id"] == students[student_idx - 1][0] and a["slot_number"] == slot
                ]
                filtered = [qid for qid in available if qid not in prev_student_qs]
                if filtered:
                    available = filtered

            chosen = random.choice(available)
            student_qs.append(chosen)
            assignments.append(
                {
                    "student_id": student_id,
                    "question_id": chosen,
                    "slot_number": slot,
                }
            )

    for a in assignments:
        db.add(
            LabStudentQuestion(
                college_id=user["college_id"],
                session_id=session_id,
                student_id=a["student_id"],
                question_id=a["question_id"],
                slot_number=a["slot_number"],
            )
        )

    s.assignment_mode = "random"
    await db.commit()
    return {
        "message": f"Assigned {len(assignments)} question slots to {len(students)} students",
        "count": len(assignments),
    }


@router.post("/lab/sessions/{session_id}/assign/cyclic")
async def assign_cyclic(
    session_id: str,
    body: dict,
    user: dict = Depends(require_role("teacher", "admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    """Cyclic round-robin: R1→Q1, R2→Q2, R3→Q3, R4→Q1, etc.

    Body: { "question_ids": ["q1", "q2", "q3"] }
    """
    s = await _get_session_or_404(session_id, user["college_id"], db)
    if s.status != "draft":
        raise HTTPException(status_code=400, detail="Can only assign questions to draft sessions")

    question_ids = body.get("question_ids", [])
    if not question_ids:
        raise HTTPException(status_code=400, detail="question_ids required")

    q_r = await db.execute(select(LabQuestion.id).where(LabQuestion.id.in_(question_ids)))
    valid_ids = {r[0] for r in q_r.all()}
    if len(valid_ids) != len(question_ids):
        raise HTTPException(status_code=400, detail="Some question IDs are invalid")

    students = await _get_students_by_batch_section(user["college_id"], s.batch, s.section, db)
    if not students:
        raise HTTPException(status_code=400, detail="No students found for this batch/section")

    qps = s.questions_per_student
    if qps > len(question_ids):
        raise HTTPException(
            status_code=400,
            detail=f"Need at least {qps} questions for {qps} questions/student",
        )

    await _clear_assignments(session_id, db)

    count = 0
    for student_idx, (student_id, roll, name) in enumerate(students):
        for slot in range(qps):
            q_index = (student_idx * qps + slot) % len(question_ids)
            db.add(
                LabStudentQuestion(
                    college_id=user["college_id"],
                    session_id=session_id,
                    student_id=student_id,
                    question_id=question_ids[q_index],
                    slot_number=slot + 1,
                )
            )
            count += 1

    s.assignment_mode = "cyclic"
    await db.commit()
    return {"message": f"Assigned {count} question slots to {len(students)} students", "count": count}


@router.post("/lab/sessions/{session_id}/assign/manual")
async def assign_manual(
    session_id: str,
    req: ManualAssignRequest,
    user: dict = Depends(require_role("teacher", "admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    """Manual per-student assignment.

    Body: { "assignments": [{ "student_id": "...", "question_id": "...", "slot_number": 1 }, ...] }
    """
    s = await _get_session_or_404(session_id, user["college_id"], db)
    if s.status != "draft":
        raise HTTPException(status_code=400, detail="Can only assign questions to draft sessions")

    if not req.assignments:
        raise HTTPException(status_code=400, detail="assignments list required")

    await _clear_assignments(session_id, db)

    for a in req.assignments:
        db.add(
            LabStudentQuestion(
                college_id=user["college_id"],
                session_id=session_id,
                student_id=a.student_id,
                question_id=a.question_id,
                slot_number=a.slot_number,
            )
        )

    s.assignment_mode = "manual"
    await db.commit()
    return {"message": f"Assigned {len(req.assignments)} question slots", "count": len(req.assignments)}


@router.get("/lab/sessions/{session_id}/assignments")
async def preview_assignments(
    session_id: str,
    user: dict = Depends(require_role("teacher", "admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    """Preview the assignment table: which student gets which question(s)."""
    s = await _get_session_or_404(session_id, user["college_id"], db)

    # Fetch all assignments with student + question info
    result = await db.execute(
        select(
            LabStudentQuestion.student_id,
            LabStudentQuestion.question_id,
            LabStudentQuestion.slot_number,
            models.User.name,
            models.UserProfile.roll_number,
            LabQuestion.title.label("question_title"),
        )
        .join(models.User, models.User.id == LabStudentQuestion.student_id)
        .join(models.UserProfile, models.UserProfile.user_id == models.User.id)
        .join(LabQuestion, LabQuestion.id == LabStudentQuestion.question_id)
        .where(LabStudentQuestion.session_id == session_id)
        .order_by(models.UserProfile.roll_number.asc(), LabStudentQuestion.slot_number.asc())
    )
    rows = result.all()

    # Group by student
    students_map = {}
    for student_id, question_id, slot, name, roll, q_title in rows:
        if student_id not in students_map:
            students_map[student_id] = {
                "student_id": student_id,
                "name": name,
                "roll_number": roll,
                "questions": [],
            }
        students_map[student_id]["questions"].append(
            {
                "question_id": question_id,
                "question_title": q_title,
                "slot_number": slot,
            }
        )

    return {
        "session_id": session_id,
        "assignment_mode": s.assignment_mode,
        "total_students": len(students_map),
        "assignments": list(students_map.values()),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# FACULTY — START / END / BOARD / REPORT
# ═══════════════════════════════════════════════════════════════════════════════


@router.patch("/lab/sessions/{session_id}/start")
async def start_session(
    session_id: str,
    user: dict = Depends(require_role("teacher", "admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    """Start the lab exam: status=active, push notifications to assigned students."""
    s = await _get_session_or_404(session_id, user["college_id"], db)
    if s.status != "draft":
        raise HTTPException(status_code=400, detail="Session is not in draft status")

    # Check that assignments exist
    cnt_r = await db.execute(
        select(func.count(LabStudentQuestion.id)).where(LabStudentQuestion.session_id == session_id)
    )
    if (cnt_r.scalar() or 0) == 0:
        raise HTTPException(status_code=400, detail="No questions assigned to students yet")

    s.status = "active"
    s.started_at = datetime.now(timezone.utc)
    await db.commit()

    # Push FCM notifications to assigned students
    try:
        student_ids_r = await db.execute(
            select(LabStudentQuestion.student_id).where(LabStudentQuestion.session_id == session_id).distinct()
        )
        student_ids = [r[0] for r in student_ids_r.all()]

        if student_ids:
            # Fetch FCM tokens
            profiles_r = await db.execute(
                select(models.UserProfile.extra_data).where(
                    models.UserProfile.user_id.in_(student_ids),
                    models.UserProfile.college_id == user["college_id"],
                )
            )
            fcm_tokens = []
            for (extra_data,) in profiles_r.all():
                token = (extra_data or {}).get("fcm_token")
                if token:
                    fcm_tokens.append(token)

            if fcm_tokens:
                from app.services.push_notifications import send_batch_notification

                await send_batch_notification(
                    fcm_tokens,
                    title=f"🧪 Lab Exam Started — {s.title}",
                    body=f"Your lab exam for {s.subject} is now live. Join with code: {s.session_code}",
                    data={
                        "type": "lab_exam_started",
                        "session_id": session_id,
                        "session_code": s.session_code,
                    },
                )
                logger.info("Lab start FCM: %d tokens for session %s", len(fcm_tokens), session_id)
            else:
                logger.info("Lab start: no FCM tokens found for session %s", session_id)
    except Exception as e:
        # Don't fail the start operation if push fails
        logger.warning("Push notification on lab start failed: %s", e)

    return {"message": "Lab session started", "session_code": s.session_code, "status": "active"}


@router.patch("/lab/sessions/{session_id}/end")
async def end_session(
    session_id: str,
    user: dict = Depends(require_role("teacher", "admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    """End the lab exam: status=ended, broadcast to students."""
    s = await _get_session_or_404(session_id, user["college_id"], db)
    if s.status != "active":
        raise HTTPException(status_code=400, detail="Session is not active")

    s.status = "ended"
    s.ended_at = datetime.now(timezone.utc)
    await db.commit()

    await _broadcast_lab_event(
        session_id,
        {
            "type": "exam_ended",
            "session_id": session_id,
            "ended_at": s.ended_at.isoformat(),
        },
    )

    return {"message": "Lab session ended", "status": "ended"}


@router.get("/lab/sessions/{session_id}/board")
async def live_board(
    session_id: str,
    user: dict = Depends(require_role("teacher", "admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    """Live status board: all students with question pass/fail status, attempts, last activity."""
    s = await _get_session_or_404(session_id, user["college_id"], db)

    # Get all assigned students
    assignments_r = await db.execute(
        select(
            LabStudentQuestion.student_id,
            LabStudentQuestion.question_id,
            LabStudentQuestion.slot_number,
            models.User.name,
            models.UserProfile.roll_number,
            LabQuestion.title.label("question_title"),
        )
        .join(models.User, models.User.id == LabStudentQuestion.student_id)
        .join(models.UserProfile, models.UserProfile.user_id == models.User.id)
        .join(LabQuestion, LabQuestion.id == LabStudentQuestion.question_id)
        .where(LabStudentQuestion.session_id == session_id)
        .order_by(models.UserProfile.roll_number.asc(), LabStudentQuestion.slot_number.asc())
    )
    assignment_rows = assignments_r.all()

    # Get all submissions for this session
    subs_r = await db.execute(select(LabSubmission).where(LabSubmission.session_id == session_id))
    submissions = subs_r.scalars().all()
    sub_map = {(sub.student_id, sub.question_id): sub for sub in submissions}

    # Build board data
    students_map = {}
    for student_id, question_id, slot, name, roll, q_title in assignment_rows:
        if student_id not in students_map:
            students_map[student_id] = {
                "student_id": student_id,
                "name": name,
                "roll_number": roll,
                "questions": [],
                "all_passed": True,
                "last_activity": None,
            }

        sub = sub_map.get((student_id, question_id))
        q_status = {
            "question_id": question_id,
            "question_title": q_title,
            "slot_number": slot,
            "is_passed": sub.is_passed if sub else False,
            "is_locked": sub.is_locked if sub else False,
            "attempt_count": sub.attempt_count if sub else 0,
            "last_attempted": sub.last_attempted.isoformat() if sub and sub.last_attempted else None,
        }
        students_map[student_id]["questions"].append(q_status)

        if not (sub and sub.is_passed):
            students_map[student_id]["all_passed"] = False

        if sub and sub.last_attempted:
            current_last = students_map[student_id]["last_activity"]
            if current_last is None or sub.last_attempted.isoformat() > current_last:
                students_map[student_id]["last_activity"] = sub.last_attempted.isoformat()

    return {
        "session_id": session_id,
        "status": s.status,
        "total_students": len(students_map),
        "board": list(students_map.values()),
    }


@router.get("/lab/sessions/{session_id}/report")
async def session_report(
    session_id: str,
    user: dict = Depends(require_role("teacher", "admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    """Full report data for PDF generation."""
    s = await _get_session_or_404(session_id, user["college_id"], db)

    # Faculty info
    faculty_r = await db.execute(select(models.User.name).where(models.User.id == s.faculty_id))
    faculty_name = faculty_r.scalar() or "Unknown"

    # Assignments + submissions
    assignments_r = await db.execute(
        select(
            LabStudentQuestion.student_id,
            LabStudentQuestion.question_id,
            LabStudentQuestion.slot_number,
            models.User.name,
            models.UserProfile.roll_number,
            LabQuestion.title.label("question_title"),
            LabQuestion.difficulty,
        )
        .join(models.User, models.User.id == LabStudentQuestion.student_id)
        .join(models.UserProfile, models.UserProfile.user_id == models.User.id)
        .join(LabQuestion, LabQuestion.id == LabStudentQuestion.question_id)
        .where(LabStudentQuestion.session_id == session_id)
        .order_by(models.UserProfile.roll_number.asc(), LabStudentQuestion.slot_number.asc())
    )
    assignment_rows = assignments_r.all()

    subs_r = await db.execute(select(LabSubmission).where(LabSubmission.session_id == session_id))
    submissions = subs_r.scalars().all()
    sub_map = {(sub.student_id, sub.question_id): sub for sub in submissions}

    students_data = {}
    total_passed = 0
    total_assigned = 0
    for student_id, question_id, slot, name, roll, q_title, difficulty in assignment_rows:
        if student_id not in students_data:
            students_data[student_id] = {
                "student_id": student_id,
                "name": name,
                "roll_number": roll,
                "questions": [],
            }

        sub = sub_map.get((student_id, question_id))
        total_assigned += 1
        if sub and sub.is_passed:
            total_passed += 1

        students_data[student_id]["questions"].append(
            {
                "question_id": question_id,
                "question_title": q_title,
                "difficulty": difficulty,
                "slot_number": slot,
                "is_passed": sub.is_passed if sub else False,
                "attempt_count": sub.attempt_count if sub else 0,
                "submitted_at": sub.submitted_at.isoformat() if sub and sub.submitted_at else None,
                "code": sub.code if sub else None,
            }
        )

    return {
        "session": {
            "id": s.id,
            "title": s.title,
            "subject": s.subject,
            "batch": s.batch,
            "section": s.section,
            "semester": s.semester,
            "session_code": s.session_code,
            "status": s.status,
            "assignment_mode": s.assignment_mode,
            "faculty_name": faculty_name,
            "started_at": s.started_at.isoformat() if s.started_at else None,
            "ended_at": s.ended_at.isoformat() if s.ended_at else None,
        },
        "summary": {
            "total_students": len(students_data),
            "total_assigned": total_assigned,
            "total_passed": total_passed,
            "pass_rate": round(total_passed / total_assigned * 100, 1) if total_assigned else 0,
        },
        "students": list(students_data.values()),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# STUDENT — JOIN / STATE / SUBMIT
# ═══════════════════════════════════════════════════════════════════════════════


@router.post("/lab/join")
async def join_session(
    req: JoinRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Join a lab session via session_code. Student must be assigned."""
    if user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can join lab sessions")

    result = await db.execute(
        select(LabSession).where(
            LabSession.session_code == req.session_code.upper(),
            LabSession.college_id == user["college_id"],
            LabSession.is_deleted == False,
        )
    )
    lab_session = result.scalars().first()
    if not lab_session:
        raise HTTPException(status_code=404, detail="Invalid session code")

    if lab_session.status != "active":
        raise HTTPException(status_code=400, detail=f"Session is {lab_session.status}, not accepting joins")

    # Check student is assigned to this session
    assigned_r = await db.execute(
        select(LabStudentQuestion).where(
            LabStudentQuestion.session_id == lab_session.id,
            LabStudentQuestion.student_id == user["id"],
        )
    )
    if not assigned_r.scalars().first():
        raise HTTPException(status_code=403, detail="You are not assigned to this lab session")

    # Broadcast join event
    await _broadcast_lab_event(
        lab_session.id,
        {
            "type": "student_joined",
            "student_id": user["id"],
            "name": user.get("name", ""),
        },
    )

    return {
        "session_id": lab_session.id,
        "title": lab_session.title,
        "subject": lab_session.subject,
        "status": lab_session.status,
    }


@router.get("/lab/sessions/{session_id}/my-state")
async def my_state(
    session_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Full state for reconnect: assigned questions + submission status."""
    if user["role"] != "student":
        raise HTTPException(status_code=403, detail="Student only endpoint")

    s = await _get_session_or_404(session_id, user["college_id"], db)

    # Get assigned questions with full details
    assignments_r = await db.execute(
        select(
            LabStudentQuestion.question_id,
            LabStudentQuestion.slot_number,
            LabQuestion.title,
            LabQuestion.description,
            LabQuestion.starter_code,
            LabQuestion.language,
            LabQuestion.test_input,
        )
        .join(LabQuestion, LabQuestion.id == LabStudentQuestion.question_id)
        .where(
            LabStudentQuestion.session_id == session_id,
            LabStudentQuestion.student_id == user["id"],
        )
        .order_by(LabStudentQuestion.slot_number.asc())
    )
    assigned = assignments_r.all()

    if not assigned:
        raise HTTPException(status_code=403, detail="You are not assigned to this session")

    # Get submissions
    subs_r = await db.execute(
        select(LabSubmission).where(
            LabSubmission.session_id == session_id,
            LabSubmission.student_id == user["id"],
        )
    )
    subs = subs_r.scalars().all()
    sub_map = {sub.question_id: sub for sub in subs}

    questions = []
    for q_id, slot, title, description, starter_code, language, test_input in assigned:
        sub = sub_map.get(q_id)
        questions.append(
            {
                "question_id": q_id,
                "slot_number": slot,
                "title": title,
                "description": description,
                "starter_code": starter_code,
                "language": language,
                "test_input": test_input,
                # Submission state
                "is_passed": sub.is_passed if sub else False,
                "is_locked": sub.is_locked if sub else False,
                "attempt_count": sub.attempt_count if sub else 0,
                "last_code": sub.code if sub else None,
                "last_output": sub.output if sub else None,
            }
        )

    return {
        "session_id": session_id,
        "title": s.title,
        "subject": s.subject,
        "status": s.status,
        "questions": questions,
    }


@router.post("/lab/sessions/{session_id}/submit")
async def submit_code(
    session_id: str,
    req: SubmitRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit code: run against test case, auto-verify, upsert submission, broadcast.

    Flow:
    1. Validate session is active
    2. Validate question is assigned to this student
    3. Validate not already locked (passed)
    4. Call code runner /run
    5. Compare output.strip() == expected_output.strip()
    6. Upsert lab_submissions
    7. Broadcast via WebSocket
    8. Return result
    """
    if user["role"] != "student":
        raise HTTPException(status_code=403, detail="Student only endpoint")

    # 1. Validate session is active
    s = await _get_session_or_404(session_id, user["college_id"], db)
    if s.status != "active":
        raise HTTPException(status_code=400, detail="Session is not active")

    # 2. Validate question is assigned to this student
    assign_r = await db.execute(
        select(LabStudentQuestion).where(
            LabStudentQuestion.session_id == session_id,
            LabStudentQuestion.student_id == user["id"],
            LabStudentQuestion.question_id == req.question_id,
        )
    )
    if not assign_r.scalars().first():
        raise HTTPException(status_code=403, detail="Question not assigned to you")

    # 3. Check if already locked
    existing_sub_r = await db.execute(
        select(LabSubmission).where(
            LabSubmission.session_id == session_id,
            LabSubmission.student_id == user["id"],
            LabSubmission.question_id == req.question_id,
        )
    )
    existing_sub = existing_sub_r.scalars().first()
    if existing_sub and existing_sub.is_locked:
        raise HTTPException(status_code=400, detail="Question already passed and locked")

    # Get expected output from question
    q_r = await db.execute(select(LabQuestion).where(LabQuestion.id == req.question_id))
    question = q_r.scalars().first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # 4. Call code runner
    runner_output = ""
    runner_error = ""
    try:
        resp = await _http_client.post(
            f"{settings.CODE_RUNNER_URL}/run",
            json={
                "language": req.language,
                "code": req.code,
                "test_input": question.test_input or "",
            },
            headers={"X-Internal-Token": settings.CODE_RUNNER_TOKEN},
            timeout=65.0,
        )
        if resp.status_code == 200:
            result_data = resp.json()
            runner_output = result_data.get("output", "")
            runner_error = result_data.get("error", "")
        else:
            runner_error = f"Code runner returned status {resp.status_code}"
    except httpx.TimeoutException:
        runner_error = "Code execution timed out"
    except Exception as e:
        runner_error = f"Code runner error: {str(e)[:200]}"

    # 5. Compare output
    is_passed = False
    if not runner_error and runner_output is not None:
        is_passed = runner_output.strip() == question.expected_output.strip()

    now = datetime.now(timezone.utc)

    # 6. Upsert submission
    if existing_sub:
        existing_sub.code = req.code
        existing_sub.language = req.language
        existing_sub.output = runner_output
        existing_sub.is_passed = is_passed
        existing_sub.is_locked = is_passed  # Lock on pass
        existing_sub.attempt_count = (existing_sub.attempt_count or 0) + 1
        existing_sub.last_attempted = now
        if is_passed and not existing_sub.submitted_at:
            existing_sub.submitted_at = now
    else:
        new_sub = LabSubmission(
            college_id=user["college_id"],
            session_id=session_id,
            student_id=user["id"],
            question_id=req.question_id,
            code=req.code,
            language=req.language,
            output=runner_output,
            is_passed=is_passed,
            is_locked=is_passed,
            attempt_count=1,
            last_attempted=now,
            submitted_at=now if is_passed else None,
        )
        db.add(new_sub)

    await db.commit()

    # 7. Broadcast
    await _broadcast_lab_event(
        session_id,
        {
            "type": "submission",
            "student_id": user["id"],
            "name": user.get("name", ""),
            "question_id": req.question_id,
            "is_passed": is_passed,
            "attempt_count": (existing_sub.attempt_count if existing_sub else 1),
            "timestamp": now.isoformat(),
        },
    )

    # 8. Return result
    return {
        "is_passed": is_passed,
        "output": runner_output,
        "error": runner_error,
        "attempt_count": (existing_sub.attempt_count if existing_sub else 1),
        "is_locked": is_passed,
    }
