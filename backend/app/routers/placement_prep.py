from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, Integer
import logging

from database import get_db
from app.core.security import require_role
from app.models.interview_prep import CompanyQuestionBank, AptitudeQuestion, CompanyInterviewExperience, SQLProblem, PlacementAttemptTracker

logger = logging.getLogger("acadmix.routers.placement_prep")
router = APIRouter()


@router.get("/placement-prep/aptitude")
async def get_aptitude_questions(
    category: str = Query(..., description="Quantitative, Logical, or Verbal"),
    difficulty: str = Query("medium"),
    limit: int = 20,
    user: dict = Depends(require_role("student")),
    session: AsyncSession = Depends(get_db),
):
    """Fetch aptitude questions by category"""
    q = select(AptitudeQuestion).where(
        AptitudeQuestion.category == category,
        AptitudeQuestion.difficulty == difficulty,
        AptitudeQuestion.is_deleted == False
    ).limit(limit)
    res = await session.execute(q)
    questions = res.scalars().all()
    # We strip out the explanation and correct_option from the payload if we want true strictness?
    # Or send them if client side validation is done. We send them here for seamless client-side Quiz evaluation.
    return questions


@router.get("/placement-prep/company")
async def get_company_prep(
    company_name: str,
    user: dict = Depends(require_role("student")),
    session: AsyncSession = Depends(get_db),
):
    """Fetch company-specific mass-recruiter test patterns (e.g. TCS NQT)"""
    q = select(CompanyQuestionBank).where(
        CompanyQuestionBank.company_name == company_name,
        CompanyQuestionBank.is_deleted == False
    )
    res = await session.execute(q)
    bank = res.scalars().first()
    if not bank:
        raise HTTPException(status_code=404, detail="Company prep module not found")
    return bank


@router.get("/placement-prep/experiences")
async def get_company_experiences(
    company_name: str,
    user: dict = Depends(require_role("student")),
    session: AsyncSession = Depends(get_db),
):
    """Fetch read-only interview experiences by company"""
    q = select(CompanyInterviewExperience).where(
        CompanyInterviewExperience.company_name == company_name,
        CompanyInterviewExperience.is_deleted == False
    ).order_by(CompanyInterviewExperience.year.desc())
    res = await session.execute(q)
    return res.scalars().all()


@router.get("/placement-prep/sql-problems")
async def get_sql_problems(
    difficulty: str = Query(None),
    company_tag: str = Query(None),
    user: dict = Depends(require_role("student")),
    session: AsyncSession = Depends(get_db),
):
    """Fetch DataLemur-style SQL practice problems"""
    q = select(SQLProblem).where(SQLProblem.is_deleted == False)
    if difficulty:
        q = q.where(SQLProblem.difficulty == difficulty)
    if company_tag:
        q = q.where(SQLProblem.company_tag == company_tag)
    
    res = await session.execute(q)
    problems = res.scalars().all()
    
    # Do NOT send `expected_query` to client.
    sanitized = []
    for p in problems:
        sanitized.append({
            "id": p.id,
            "title": p.title,
            "dataset_theme": p.dataset_theme,
            "company_tag": p.company_tag,
            "difficulty": p.difficulty,
            "problem_statement": p.problem_statement,
            "schema_sql": p.schema_sql,
            "hint": p.hint,
            "expected_output": p.expected_output,
            "tables_meta": p.tables_meta,
            "example_output": p.example_output,
            "explanation": p.explanation,
            "created_at": p.created_at
        })
    return sanitized


@router.get("/placement-prep/sql-problems/{problem_id}")
async def get_sql_problem(
    problem_id: str,
    user: dict = Depends(require_role("student")),
    session: AsyncSession = Depends(get_db),
):
    q = select(SQLProblem).where(SQLProblem.id == problem_id, SQLProblem.is_deleted == False)
    res = await session.execute(q)
    p = res.scalars().first()
    if not p:
        raise HTTPException(status_code=404, detail="Problem not found")
        
    return {
        "id": p.id,
        "title": p.title,
        "dataset_theme": p.dataset_theme,
        "company_tag": p.company_tag,
        "difficulty": p.difficulty,
        "problem_statement": p.problem_statement,
        "schema_sql": p.schema_sql,
        "hint": p.hint,
        "expected_output": p.expected_output,
        "tables_meta": p.tables_meta,
        "example_output": p.example_output,
        "explanation": p.explanation,
        "solution_sql": p.solution_sql,
        "created_at": p.created_at
    }


@router.post("/placement-prep/aptitude/attempt")
async def log_aptitude_attempt(
    req: dict,
    user: dict = Depends(require_role("student")),
    session: AsyncSession = Depends(get_db),
):
    """Log an aptitude question attempt"""
    attempt = PlacementAttemptTracker(
        student_id=user["sub"],
        module_type='aptitude',
        reference_id=req["question_id"],
        is_correct=req["is_correct"],
        time_taken_sec=req.get("time_taken_sec", 0)
    )
    session.add(attempt)
    await session.commit()
    return {"status": "success"}


@router.post("/placement-prep/sql/attempt")
async def log_sql_attempt(
    req: dict,
    user: dict = Depends(require_role("student")),
    session: AsyncSession = Depends(get_db),
):
    """Log an SQL Sandbox attempt"""
    attempt = PlacementAttemptTracker(
        student_id=user["sub"],
        module_type='sql',
        reference_id=req["problem_id"],
        is_correct=req["is_correct"],
        time_taken_sec=req.get("time_taken_sec", 0)
    )
    session.add(attempt)
    await session.commit()
    return {"status": "success"}


@router.get("/placement-prep/progress/{student_id}")
async def get_student_progress(
    student_id: str,
    # Can be viewed by TPO, or the student themselves
    user: dict = Depends(require_role(["student", "tpo", "admin", "hod"])),
    session: AsyncSession = Depends(get_db),
):
    """Fetch aggregated placement practice stats for Accreditation/Overview"""
    if user["role"] == "student" and user["sub"] != student_id:
        raise HTTPException(status_code=403, detail="Not authorized to view other students' progress")

    # Aggregate aptitude
    apt_q = select(
        func.count(PlacementAttemptTracker.id).label("total"),
        func.sum(func.cast(PlacementAttemptTracker.is_correct, Integer)).label("correct")
    ).where(
        PlacementAttemptTracker.student_id == student_id,
        PlacementAttemptTracker.module_type == 'aptitude'
    )
    res_apt = await session.execute(apt_q)
    apt_stats = res_apt.first()

    # Aggregate SQL
    sql_q = select(
        func.count(PlacementAttemptTracker.id).label("total"),
        func.sum(func.cast(PlacementAttemptTracker.is_correct, Integer)).label("correct")
    ).where(
        PlacementAttemptTracker.student_id == student_id,
        PlacementAttemptTracker.module_type == 'sql'
    )
    res_sql = await session.execute(sql_q)
    sql_stats = res_sql.first()

    # Unique SQL problems solved correctly
    sql_unique_q = select(func.count(func.distinct(PlacementAttemptTracker.reference_id))).where(
        PlacementAttemptTracker.student_id == student_id,
        PlacementAttemptTracker.module_type == 'sql',
        PlacementAttemptTracker.is_correct == True
    )
    res_unique_sql = await session.execute(sql_unique_q)
    unique_sql_solved = res_unique_sql.scalar() or 0

    return {
        "aptitude": {
            "total_attempts": apt_stats.total or 0,
            "correct": apt_stats.correct or 0,
            "accuracy": round((apt_stats.correct / apt_stats.total * 100) if apt_stats.total else 0, 1)
        },
        "sql": {
            "total_attempts": sql_stats.total or 0,
            "correct": sql_stats.correct or 0,
            "unique_solved": unique_sql_solved,
            "accuracy": round((sql_stats.correct / sql_stats.total * 100) if sql_stats.total else 0, 1)
        }
    }
