from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime, timezone
import hashlib
import json
import logging

from app.schemas.insights import InsightsQueryRequest, InsightsQueryResponse, PinnedInsightCreate, PinnedInsightResponse
from app.services.ai_service import generate_insights_sql, format_insights_summary, validate_insights_semantics
from app.services.insights_executor import execute_insights_query
from app.core.security import get_current_user
from database import get_db
from app.models.core import User, PinnedInsight
from sqlalchemy import select, text
from typing import List

logger = logging.getLogger("acadmix.insights")

router = APIRouter()

# ── Insights Cache Helpers ────────────────────────────────────────────────────
INSIGHTS_CACHE_TTL = 300  # 5 minutes

async def _get_redis():
    """Lazy-import the shared Redis pool."""
    try:
        from app.services.wa_state_machine import get_redis
        return await get_redis()
    except Exception:
        return None

def _insights_cache_key(sql: str, role: str) -> str:
    """SHA-256 hash of (generated SQL + role) for semantic cache deduplication.
    
    Keying on SQL instead of NL text means semantically identical questions
    ('students below 50%' vs 'students with <50% attendance') that produce
    the same SQL will share the same cache entry.
    """
    digest = hashlib.sha256(f"{role}:{sql.strip()}".encode()).hexdigest()
    return f"insights_cache:v3:{digest}"


@router.post("/query", response_model=InsightsQueryResponse)
async def query_insights(
    request: InsightsQueryRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # RBAC: Allow all relevant dash roles
    allowed_roles = ["PRINCIPAL", "HOD", "SUPERADMIN", "ADMIN", "FACULTY", "TPO", "DHTE_NODAL", "INSTITUTIONAL_NODAL", "EXAM_CELL"]
    role = current_user.get("role", "").upper()
    if role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access the Insights module."
        )

    # 1. Generate SQL from Natural Language OR use cached_sql
    # Fetch department for HOD/FACULTY prompt constraint
    user_department = ""
    if role in ["HOD", "FACULTY"]:
        try:
            dept_result = await db.execute(
                text("SELECT department FROM user_profiles WHERE user_id = :uid"),
                {"uid": current_user.get("id")}
            )
            dept_row = dept_result.fetchone()
            if dept_row:
                user_department = dept_row[0]
        except Exception:
            pass  # Graceful degradation — prompt constraint won't apply

    if request.cached_sql:
        generated_sql = request.cached_sql
    else:
        history_dicts = [{"role": msg.role, "content": msg.content} for msg in request.session_history]
        try:
            generated_sql = await generate_insights_sql(
                request.message, history_dicts, role, db=db, department=user_department
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    # ── Semantic Validation (2-pass agentic evaluator) ────────────────────
    # Runs for ALL queries — validates the SQL semantically matches the question
    if not request.cached_sql:
        try:
            is_valid = await validate_insights_semantics(request.message, generated_sql)
            if not is_valid:
                logger.info("Semantic validator rejected SQL — regenerating with stricter constraints")
                history_dicts = [{"role": msg.role, "content": msg.content} for msg in request.session_history]
                history_dicts.append({"role": "assistant", "content": generated_sql})
                history_dicts.append({
                    "role": "user",
                    "content": (
                        "The previous SQL was flagged as not matching the user's intent. "
                        "Re-read the question carefully and regenerate. "
                        "Make sure to include all relevant GROUP BY dimensions (batch, department, gender, etc). "
                        "Return ONLY the corrected SQL."
                    )
                })
                generated_sql = await generate_insights_sql(
                    request.message, history_dicts, role, db=db, department=user_department
                )
        except Exception as e:
            logger.warning("Semantic validation step failed (non-blocking): %s", e)

    # ── Cache Lookup (keyed on generated SQL for semantic dedup) ──────────
    r = await _get_redis()
    cache_key = _insights_cache_key(generated_sql, role)
    if r and not request.cached_sql:
        try:
            cached = await r.get(cache_key)
            if cached:
                logger.info("Insights cache HIT (SQL-keyed): %s", cache_key[:40])
                cached_data = json.loads(cached)
                return InsightsQueryResponse(**cached_data)
        except Exception:
            pass  # Redis down — proceed without cache

    # 2. Execute SQL Securely with Scope Validator + Self-Healing Retry
    # For DHTE/Superadmin, use active_college_id if provided.
    target_college = request.active_college_id if request.active_college_id and role in ["DHTE_NODAL", "SUPERADMIN"] else current_user.get("college_id")
    
    max_attempts = 2  # Original + 1 retry
    last_error = None
    
    for attempt in range(max_attempts):
        try:
            result = await execute_insights_query(
                session=db,
                sql_query=generated_sql,
                college_id=target_college,
                role=role,
                user_id=current_user.get("id")
            )
            break  # Success — exit retry loop
        except ValueError as e:
            last_error = e
            err_str = str(e)
            
            # Don't retry on security blocks — these are intentional
            if "Blocked keyword" in err_str or "department filtering" in err_str or "outside your access scope" in err_str:
                if role == "TPO" and "relation" in err_str and "does not exist" in err_str:
                    raise HTTPException(status_code=400, detail="This query is outside your access scope.")
                raise HTTPException(status_code=400, detail=err_str)
            
            # Self-healing retry: feed the Postgres error back to the LLM
            if attempt < max_attempts - 1 and not request.cached_sql:
                logger.info("Self-healing retry (attempt %d): feeding error back to LLM", attempt + 1)
                try:
                    # Build a repair prompt with the error context
                    repair_history = history_dicts.copy() if not request.cached_sql else []
                    repair_history.append({"role": "assistant", "content": generated_sql})
                    repair_history.append({
                        "role": "user", 
                        "content": (
                            f"The previous SQL query failed with this PostgreSQL error:\n{err_str}\n\n"
                            f"Fix the SQL query. Return ONLY the corrected SQL, no explanation."
                        )
                    })
                    generated_sql = await generate_insights_sql(
                        request.message, repair_history, role, db=db, department=user_department
                    )
                    logger.info("Self-healing: LLM generated corrected SQL")
                    continue  # Retry with the corrected SQL
                except Exception as retry_err:
                    logger.warning("Self-healing retry failed: %s", retry_err)
                    raise HTTPException(status_code=400, detail=str(last_error))
            
            raise HTTPException(status_code=400, detail=err_str)
        except Exception as e:
            last_error = e
            if role == "TPO" and getattr(e, 'orig', None) and 'does not exist' in str(e.orig):
                raise HTTPException(status_code=400, detail="This query is outside your access scope.")
            
            # Self-healing retry for execution errors too
            if attempt < max_attempts - 1 and not request.cached_sql:
                logger.info("Self-healing retry on execution error (attempt %d)", attempt + 1)
                try:
                    repair_history = history_dicts.copy() if not request.cached_sql else []
                    repair_history.append({"role": "assistant", "content": generated_sql})
                    repair_history.append({
                        "role": "user",
                        "content": (
                            f"The previous SQL query failed with this PostgreSQL error:\n"
                            f"{type(e).__name__}: {str(e)}\n\n"
                            f"Fix the SQL query. Return ONLY the corrected SQL, no explanation."
                        )
                    })
                    generated_sql = await generate_insights_sql(
                        request.message, repair_history, role, db=db, department=user_department
                    )
                    continue
                except Exception:
                    pass
            raise HTTPException(status_code=500, detail=f"Database execution failed: {type(last_error).__name__}: {str(last_error)[:300]}")

    # 3. Format Response with AI Summary
    try:
        summary_info = await format_insights_summary(request.message, result["data"])
    except Exception:
        # Graceful degradation if summary fails
        len_data = len(result.get("data", []))
        summary_info = {
            "summary": f"Query returned {len_data} rows.",
            "chart_suggestion": None
        }
    
    response_data = {
        "summary": summary_info.get("summary", ""),
        "data": result["data"],
        "columns": result["columns"],
        "chart_suggestion": summary_info.get("chart_suggestion"),
        "x_column": summary_info.get("x_column"),
        "y_column": summary_info.get("y_column"),
        "group_column": summary_info.get("group_column"),
        "all_metrics": summary_info.get("all_metrics", []),
        "metric_chart_map": summary_info.get("metric_chart_map", {}),
        "exportable": True,
        "generated_sql": generated_sql
    }

    # ── Cache Write ───────────────────────────────────────────────────────
    if r and not request.cached_sql:
        try:
            await r.set(cache_key, json.dumps(response_data, default=str), ex=INSIGHTS_CACHE_TTL)
            logger.info("Insights cache SET: %s (TTL %ds)", cache_key[:40], INSIGHTS_CACHE_TTL)
        except Exception:
            pass  # Redis down — skip cache write

    return InsightsQueryResponse(**response_data)

@router.post("/pins", response_model=PinnedInsightResponse)
async def create_pin(
    pin_in: PinnedInsightCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    allowed_roles = ["PRINCIPAL", "HOD", "SUPERADMIN", "ADMIN", "FACULTY", "TPO", "DHTE_NODAL", "INSTITUTIONAL_NODAL", "EXAM_CELL"]
    role = current_user.get("role", "").upper()
    if role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission."
        )
    
    target_college = pin_in.active_college_id if pin_in.active_college_id and role in ["DHTE_NODAL", "SUPERADMIN"] else current_user.get("college_id")
    
    new_pin = PinnedInsight(
        college_id=target_college,
        user_id=current_user.get("id"),
        role=role,
        title=pin_in.title,
        nl_query=pin_in.nl_query,
        cached_sql=pin_in.cached_sql,
        chart_suggestion=pin_in.chart_suggestion
    )
    db.add(new_pin)
    # Skip db.commit() — get_db() uses managed transaction (session.begin) which auto-commits.
    # Skip db.refresh() — avoids an extra SELECT round-trip; return from input data directly.
    await db.flush()  # ensures ID is generated without a full commit+refresh cycle
    return PinnedInsightResponse(
        id=new_pin.id,
        title=pin_in.title,
        nl_query=pin_in.nl_query,
        cached_sql=pin_in.cached_sql,
        chart_suggestion=pin_in.chart_suggestion,
        role=role,
        created_at=new_pin.created_at or datetime.now(timezone.utc)
    )

@router.get("/pins", response_model=List[PinnedInsightResponse])
async def get_pins(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    allowed_roles = ["PRINCIPAL", "HOD", "SUPERADMIN", "ADMIN", "FACULTY", "TPO", "DHTE_NODAL", "INSTITUTIONAL_NODAL", "EXAM_CELL"]
    role = current_user.get("role", "").upper()
    if role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission."
        )

    stmt = select(PinnedInsight).where(
        PinnedInsight.user_id == current_user.get("id"),
        PinnedInsight.role == role,
        PinnedInsight.is_deleted == False
    ).order_by(PinnedInsight.created_at.desc())
    
    result = await db.execute(stmt)
    pins = result.scalars().all()
    return pins

@router.delete("/pins/{pin_id}")
async def delete_pin(
    pin_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    role = current_user.get("role", "").upper()
    user_id = current_user.get("id")
    logger.info("delete_pin called: pin_id=%s, user_id=%s, role=%s", pin_id, user_id, role)
    
    stmt = select(PinnedInsight).where(
        PinnedInsight.id == pin_id,
        PinnedInsight.user_id == user_id,
        PinnedInsight.role == role,
        PinnedInsight.is_deleted == False
    )
    result = await db.execute(stmt)
    pin = result.scalar_one_or_none()
    
    if not pin:
        logger.warning("delete_pin: pin not found — pin_id=%s, user_id=%s, role=%s", pin_id, user_id, role)
        raise HTTPException(status_code=404, detail="Pin not found")
        
    pin.is_deleted = True
    await db.flush()  # ensure dirty flag is written within the managed transaction
    logger.info("delete_pin: success — pin_id=%s soft-deleted", pin_id)
    return {"message": "Success"}
