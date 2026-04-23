from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, Integer, text
from pydantic import BaseModel
import logging
import uuid
import asyncio

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


# ══════════════════════════════════════════════════════════════════════════════
# PostgreSQL Sandboxed SQL Executor
# For problems requiring features not in SQLite WASM (e.g. FULL OUTER JOIN)
# ══════════════════════════════════════════════════════════════════════════════

class SQLExecuteRequest(BaseModel):
    schema_sql: str
    user_query: str
    problem_id: str

# Dangerous SQL patterns to block
_BLOCKED_PATTERNS = [
    'DROP DATABASE', 'DROP SCHEMA', 'CREATE DATABASE', 'ALTER SYSTEM',
    'COPY ', 'pg_read_file', 'pg_write_file', 'lo_import', 'lo_export',
    'CREATE EXTENSION', 'CREATE ROLE', 'ALTER ROLE', 'GRANT ', 'REVOKE ',
]

@router.post("/placement-prep/sql/execute")
async def execute_sql_backend(
    req: SQLExecuteRequest,
    user: dict = Depends(require_role("student")),
    session: AsyncSession = Depends(get_db),
):
    """
    Execute user SQL against a temporary PostgreSQL schema.
    Used for problems requiring features not in SQLite WASM (FULL OUTER JOIN, etc.)
    
    Flow:
    1. Create temporary schema with unique name
    2. SET search_path to temp schema
    3. Run problem schema_sql (CREATE TABLE + INSERT)
    4. Run user_query (SELECT only)
    5. Return results in sql.js-compatible format
    6. DROP temp schema (CASCADE)
    """
    # ── Validation ──
    if len(req.user_query) > 5000:
        raise HTTPException(400, "Query too long (max 5000 chars)")
    if len(req.schema_sql) > 20000:
        raise HTTPException(400, "Schema too large")
    
    # Block dangerous patterns
    combined = (req.user_query + req.schema_sql).upper()
    for pattern in _BLOCKED_PATTERNS:
        if pattern in combined:
            raise HTTPException(400, f"Forbidden SQL pattern detected: {pattern}")
    
    # Only allow SELECT in user query (no DML/DDL)
    user_upper = req.user_query.strip().upper()
    if not user_upper.startswith('SELECT') and not user_upper.startswith('WITH'):
        raise HTTPException(400, "Only SELECT queries are allowed")
    
    # ── Create sandboxed schema ──
    schema_name = f"sql_sandbox_{uuid.uuid4().hex[:12]}"
    
    try:
        # Use raw connection for full control
        raw_conn = await session.connection()
        
        # Create temp schema + set search path
        await raw_conn.execute(text(f'CREATE SCHEMA "{schema_name}"'))
        await raw_conn.execute(text(f'SET search_path TO "{schema_name}", public'))
        
        # Run schema setup (CREATE TABLEs + INSERTs)
        for stmt in req.schema_sql.split(';'):
            stmt = stmt.strip()
            if stmt:
                try:
                    await raw_conn.execute(text(stmt))
                except Exception as e:
                    logger.warning(f"Schema setup error: {e}")
        
        # Execute user query with timeout
        try:
            result = await asyncio.wait_for(
                _execute_user_query(raw_conn, req.user_query),
                timeout=5.0
            )
        except asyncio.TimeoutError:
            raise HTTPException(408, "Query timed out (max 5 seconds)")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"SQL execution error: {e}")
        raise HTTPException(500, f"Execution error: {str(e)}")
    finally:
        # Always clean up the temp schema
        try:
            await raw_conn.execute(text(f'DROP SCHEMA IF EXISTS "{schema_name}" CASCADE'))
            await raw_conn.execute(text('SET search_path TO public'))
            await session.rollback()  # rollback any uncommitted changes
        except Exception as cleanup_err:
            logger.error(f"Schema cleanup error: {cleanup_err}")


async def _execute_user_query(conn, query: str):
    """Execute and return results in sql.js-compatible format: [{columns, values}]"""
    result = await conn.execute(text(query))
    columns = list(result.keys())
    rows = result.fetchall()
    
    # Convert to sql.js format for frontend compatibility
    values = []
    for row in rows:
        values.append([
            None if v is None else float(v) if isinstance(v, (int, float)) and not isinstance(v, bool)
            else str(v) if not isinstance(v, (str, int, float, bool, type(None)))
            else v
            for v in row
        ])
    
    return {
        "results": [{"columns": columns, "values": values}],
        "engine": "postgresql"
    }
