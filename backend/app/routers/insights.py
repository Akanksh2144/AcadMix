from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime, timezone
import hashlib
import json
import logging

from app.schemas.insights import InsightsQueryRequest, InsightsQueryResponse, PinnedInsightCreate, PinnedInsightResponse
from app.services.ai_service import generate_insights_sql, format_insights_summary
from app.services.insights_executor import execute_insights_query
from app.core.security import get_current_user
from database import get_db
from app.models.core import User, PinnedInsight
from sqlalchemy import select
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
    return f"insights_cache:{digest}"


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
    if request.cached_sql:
        generated_sql = request.cached_sql
    else:
        history_dicts = [{"role": msg.role, "content": msg.content} for msg in request.session_history]
        try:
            generated_sql = await generate_insights_sql(request.message, history_dicts, role)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

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

    # 2. Execute SQL Securely with Scope Validator
    # For DHTE/Superadmin, use active_college_id if provided.
    target_college = request.active_college_id if request.active_college_id and role in ["DHTE_NODAL", "SUPERADMIN"] else current_user.get("college_id")
    
    try:
        result = await execute_insights_query(
            session=db,
            sql_query=generated_sql,
            college_id=target_college,
            role=role,
            user_id=current_user.get("id")
        )
    except ValueError as e:
        # Invalid or unsafe SQL
        err_str = str(e)
        if role == "TPO" and "relation" in err_str and "does not exist" in err_str:
             raise HTTPException(status_code=400, detail="This query is outside your access scope.")
        raise HTTPException(status_code=400, detail=err_str)
    except Exception as e:
        if role == "TPO" and getattr(e, 'orig', None) and 'does not exist' in str(e.orig):
             raise HTTPException(status_code=400, detail="This query is outside your access scope.")
        raise HTTPException(status_code=500, detail="Database execution failed.")

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
