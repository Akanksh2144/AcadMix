from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from database import get_db
from app.core.security import require_role
from app.models.admissions import Admission
from app.services.admissions_service import AdmissionsService
from app.core.response import success, error_response

router = APIRouter(prefix="/admissions", tags=["Admissions"])

class RunCounselingPayload(BaseModel):
    branch_capacities: Dict[str, int]

class GenerateMeritListPayload(BaseModel):
    phase_name: str

class VerifyDocsPayload(BaseModel):
    status: str  # verified / rejected

class BulkImportPayload(BaseModel):
    csv_data: str

class UpdateStatusPayload(BaseModel):
    status: str


@router.get("")
async def list_candidates(
    q: Optional[str] = None,
    stage: Optional[str] = None,
    branch: Optional[str] = None,
    user: dict = Depends(require_role("admin", "hod", "principal", "admissions_officer")),
    session: AsyncSession = Depends(get_db)
):
    stmt = select(Admission).where(Admission.college_id == user["college_id"])
    if q:
        stmt = stmt.where(
            Admission.full_name.ilike(f"%{q}%") |
            Admission.mobile_number.ilike(f"%{q}%") |
            Admission.admission_number.ilike(f"%{q}%")
        )
    if stage:
        stmt = stmt.where(Admission.status == stage)
    if branch:
        stmt = stmt.where(Admission.branch == branch)
        
    result = await session.execute(stmt.order_by(Admission.created_at.desc()))
    candidates = result.scalars().all()
    return success([
        {
            "id": c.id,
            "admission_number": c.admission_number,
            "full_name": c.full_name,
            "mobile_number": c.mobile_number,
            "email": c.email,
            "gender": c.gender,
            "branch": c.branch,
            "batch": c.batch,
            "quota": c.quota,
            "category": c.category,
            "status": c.status,
            "exam_type": c.exam_type,
            "exam_roll_number": c.exam_roll_number,
            "exam_score": c.exam_score,
            "exam_percentile": c.exam_percentile,
            "course_preferences": c.course_preferences,
            "allocated_branch": c.allocated_branch,
            "merit_rank": c.merit_rank,
            "documents_verified": c.documents_verified,
            "fee_payment_status": c.fee_payment_status,
            "locked_fee_amount": c.locked_fee_amount,
            "melt_risk_score": c.melt_risk_score,
            "melt_risk_factors": c.melt_risk_factors
        } for c in candidates
    ])

@router.post("/bulk-import")
async def bulk_import_candidates(
    payload: BulkImportPayload,
    user: dict = Depends(require_role("admin", "hod", "admissions_officer")),
    session: AsyncSession = Depends(get_db)
):
    service = AdmissionsService(session)
    res = await service.bulk_import_candidates(user["college_id"], payload.csv_data)
    return success(res)

@router.post("/generate-merit-list")
async def generate_merit_list(
    payload: GenerateMeritListPayload,
    user: dict = Depends(require_role("admin", "hod", "admissions_officer")),
    session: AsyncSession = Depends(get_db)
):
    service = AdmissionsService(session)
    res = await service.generate_merit_list(user["college_id"], payload.phase_name)
    return success(res)

@router.post("/run-counseling")
async def run_counseling(
    payload: RunCounselingPayload,
    user: dict = Depends(require_role("admin", "hod", "admissions_officer")),
    session: AsyncSession = Depends(get_db)
):
    service = AdmissionsService(session)
    res = await service.allocate_seats(user["college_id"], payload.branch_capacities)
    return success(res)

@router.put("/{candidate_id}/verify-documents")
async def verify_documents(
    candidate_id: str,
    payload: VerifyDocsPayload,
    user: dict = Depends(require_role("admin", "hod", "admissions_officer")),
    session: AsyncSession = Depends(get_db)
):
    res = await session.execute(
        select(Admission).where(
            Admission.college_id == user["college_id"],
            Admission.id == candidate_id
        )
    )
    candidate = res.scalars().first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    candidate.documents_verified = payload.status
    if payload.status == "verified":
        candidate.status = "admitted"
    await session.commit()
    return success({"message": f"Document status updated to {payload.status}"})

@router.patch("/{candidate_id}/status")
async def update_candidate_status(
    candidate_id: str,
    payload: UpdateStatusPayload,
    user: dict = Depends(require_role("admin", "hod", "admissions_officer")),
    session: AsyncSession = Depends(get_db)
):
    res = await session.execute(
        select(Admission).where(
            Admission.college_id == user["college_id"],
            Admission.id == candidate_id
        )
    )
    candidate = res.scalars().first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    candidate.status = payload.status
    await session.commit()
    return success({
        "id": candidate.id,
        "status": candidate.status,
        "message": f"Status updated to {candidate.status}"
    })


@router.post("/{candidate_id}/rollover")
async def rollover_candidate(
    candidate_id: str,
    user: dict = Depends(require_role("admin", "hod", "admissions_officer")),
    session: AsyncSession = Depends(get_db)
):
    service = AdmissionsService(session)
    try:
        res = await service.rollover_candidate_to_student(user["college_id"], candidate_id)
        return success(res)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/analytics")
async def get_analytics(
    user: dict = Depends(require_role("admin", "hod", "principal", "admissions_officer")),
    session: AsyncSession = Depends(get_db)
):
    # Total candidates counts by status
    stmt = select(Admission.status, select(Admission).where(Admission.college_id == user["college_id"]))
    # Query statuses count
    res = await session.execute(
        select(Admission.status)
        .where(Admission.college_id == user["college_id"])
    )
    statuses = res.scalars().all()
    
    funnel = {
        "enquiry": statuses.count("enquiry"),
        "submitted": statuses.count("submitted"),
        "merit_listed": statuses.count("merit_listed"),
        "seat_allocated": statuses.count("seat_allocated"),
        "admitted": statuses.count("admitted"),
        "enrolled": statuses.count("enrolled")
    }
    
    return success({
        "funnel": funnel,
        "total_leads": len(statuses)
    })

@router.post("/{candidate_id}/recalculate-risk")
async def recalculate_risk(
    candidate_id: str,
    user: dict = Depends(require_role("admin", "hod", "admissions_officer")),
    session: AsyncSession = Depends(get_db)
):
    service = AdmissionsService(session)
    try:
        res = await service.calculate_candidate_melt_risk(user["college_id"], candidate_id)
        return success(res)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/webhooks/lead-inbound")
async def verify_meta_webhook(
    request: Request
):
    params = request.query_params
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")

    import os
    verify_secret = os.getenv("WEBHOOK_VERIFY_TOKEN", "acadmix_lead_secret_2026")
    if mode == "subscribe" and token == verify_secret:
        from fastapi.responses import PlainTextResponse
        return PlainTextResponse(content=challenge or "OK", status_code=200)
    from fastapi.responses import PlainTextResponse
    return PlainTextResponse(content=challenge or "OK", status_code=200)

@router.post("/webhooks/lead-inbound")
async def ingest_lead_webhook(
    request: Request,
    session: AsyncSession = Depends(get_db)
):
    try:
        body = await request.json()
    except Exception:
        body = dict(await request.form())

    college_id = body.get("college_id") or request.query_params.get("college_id")
    tenant = getattr(request.state, "tenant", None)
    if tenant and tenant.college_id:
        college_id = tenant.college_id

    if not college_id:
        from app.models.core import College
        c_res = await session.execute(select(College).limit(1))
        col = c_res.scalars().first()
        if col:
            college_id = col.id
        else:
            raise HTTPException(status_code=400, detail="Missing tenant/college_id for lead ingestion")

    service = AdmissionsService(session)
    try:
        res = await service.ingest_inbound_lead(college_id, body)
        return success(res)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
