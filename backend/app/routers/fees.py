from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Dict, Any, Optional

from database import get_db
from app.core.security import require_role
from app.services.fees_service import FeesService
from app import models
from pydantic import BaseModel

router = APIRouter()

def get_fees_service(session: AsyncSession = Depends(get_db)):
    return FeesService(session)


async def _resolve_student_id(user: dict, student_id: Optional[str], session: AsyncSession) -> str:
    """For students, always use their own ID. For parents, verify the parent-student link."""
    if user["role"] == "parent":
        if not student_id:
            raise HTTPException(status_code=400, detail="student_id query parameter is required for parent role")
        link_r = await session.execute(
            select(models.ParentStudentLink).where(
                models.ParentStudentLink.parent_id == user["id"],
                models.ParentStudentLink.student_id == student_id,
                models.ParentStudentLink.college_id == user["college_id"],
            )
        )
        if not link_r.scalars().first():
            raise HTTPException(status_code=403, detail="Unverified parent-student relationship")
        return student_id
    return user["id"]


# ─── STUDENT ROUTES ──────────────────────────────────────────────────────────

@router.get("/fees/due")
async def get_my_due_fees(
    student_id: Optional[str] = Query(None, description="Required for parent role"),
    user: dict = Depends(require_role("student", "parent")),
    svc: FeesService = Depends(get_fees_service),
    session: AsyncSession = Depends(get_db),
):
    sid = await _resolve_student_id(user, student_id, session)
    return {"data": await svc.get_student_due_fees(sid, user["college_id"])}


@router.get("/fees/history")
async def get_payment_history(
    student_id: Optional[str] = Query(None, description="Required for parent role"),
    user: dict = Depends(require_role("student", "parent")),
    svc: FeesService = Depends(get_fees_service),
    session: AsyncSession = Depends(get_db),
):
    sid = await _resolve_student_id(user, student_id, session)
    return {"data": await svc.get_payment_history(sid, user["college_id"])}


class CreateOrderPayload(BaseModel):
    invoice_id: str
    amount_to_pay: float

@router.post("/fees/create-order")
async def create_fee_order(
    payload: CreateOrderPayload,
    user: dict = Depends(require_role("student", "parent")),
    svc: FeesService = Depends(get_fees_service)
):
    try:
        # Prevent zero or negative payments
        if payload.amount_to_pay <= 0:
            raise ValueError("Amount must be greater than zero")
            
        data = await svc.create_razorpay_order(
            student_id=user["id"], 
            college_id=user["college_id"],
            invoice_id=payload.invoice_id,
            amount_to_pay=payload.amount_to_pay
        )
        return {"success": True, "order": data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


class VerifyPaymentPayload(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

@router.post("/fees/verify-payment")
async def verify_fee_payment(
    payload: VerifyPaymentPayload,
    user: dict = Depends(require_role("student", "parent")),
    svc: FeesService = Depends(get_fees_service)
):
    is_valid = await svc.verify_payment_signature(
        student_id=user["id"],
        college_id=user["college_id"],
        payload=payload.model_dump()
    )
    if is_valid:
        # 🔔 Trigger WhatsApp payment receipt (async, non-blocking)
        try:
            from arq import create_pool
            from arq.connections import RedisSettings
            from app.core.config import settings as app_settings
            redis = await create_pool(RedisSettings.from_dsn(app_settings.REDIS_URL))
            await redis.enqueue_job(
                "send_fee_payment_receipt_task",
                user["id"],       # student_id
                "",               # invoice_id (resolved by task from txn ref)
                0.0,              # amount (resolved by task)
                payload.razorpay_payment_id,
                None,             # receipt_url
            )
        except Exception as e:
            import logging
            logging.getLogger("acadmix.fees").warning("Failed to enqueue WA receipt: %s", e)

        return {"success": True, "message": "Payment verified successfully"}
    else:
        raise HTTPException(status_code=400, detail="Invalid payment signature")

# ─── ADMIN ROUTES ────────────────────────────────────────────────────────────

class BulkInvoicePayload(BaseModel):
    invoices: List[dict] # list of { student_id, fee_type, total_amount, academic_year, due_date (optional), description (optional) }

@router.post("/admin/fees/invoices/bulk")
async def create_bulk_invoices(
    payload: BulkInvoicePayload,
    user: dict = Depends(require_role("admin", "principal")),
    svc: FeesService = Depends(get_fees_service)
):
    created = await svc.create_invoice_bulk(user["college_id"], payload.invoices)
    return {"success": True, "created": created}
