"""
Visitor Management API Router
================================
Public API for the visitor management system.
Two gate types:
  - ``main_gate``: managed by security role
  - ``hostel``: managed by warden role
Admin has access to both.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from database import get_db
from app.core.security import require_role, get_current_user
from app.core.response import mark_enveloped
from app.services.visitor_service import VisitorService
from app.schemas.visitors import (
    VisitorCreate, VisitCheckIn, VisitCheckOut,
    VisitPreApprove, VisitApprovalAction,
)

router = APIRouter(dependencies=[Depends(mark_enveloped)])


def get_visitor_service(session: AsyncSession = Depends(get_db)):
    return VisitorService(session)


# ═══════════════════════════════════════════════════════════════════════════════
# DASHBOARD — Stats overview
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/visitors/dashboard")
async def visitor_dashboard(
    gate_type: Optional[str] = Query(None),
    hostel_id: Optional[str] = Query(None),
    user: dict = Depends(require_role("admin", "security", "warden")),
    svc: VisitorService = Depends(get_visitor_service),
):
    """Dashboard stats for visitor management."""
    # Warden can only see hostel visitors
    effective_gate = gate_type
    if user["role"] == "warden" and not gate_type:
        effective_gate = "hostel"
    # Security can only see main gate visitors
    if user["role"] == "security" and not gate_type:
        effective_gate = "main_gate"

    data = await svc.get_dashboard_stats(
        user["college_id"], gate_type=effective_gate, hostel_id=hostel_id
    )
    return {"data": data}


# ═══════════════════════════════════════════════════════════════════════════════
# SEARCH — Find visitors by name/phone
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/visitors/search")
async def search_visitors(
    q: str = Query("", min_length=0),
    user: dict = Depends(require_role("admin", "security", "warden")),
    svc: VisitorService = Depends(get_visitor_service),
):
    """Search registered visitors by name or phone number."""
    results = await svc.search_visitors(user["college_id"], q)
    return {"data": results}


# ═══════════════════════════════════════════════════════════════════════════════
# CHECK-IN — Walk-in registration + immediate check-in
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/visitors/check-in")
async def check_in_visitor(
    payload: VisitCheckIn,
    user: dict = Depends(require_role("admin", "security", "warden")),
    svc: VisitorService = Depends(get_visitor_service),
):
    """Register and/or check in a walk-in visitor."""
    # Validate gate access
    if user["role"] == "warden" and payload.gate_type != "hostel":
        raise HTTPException(403, "Wardens can only check in hostel visitors")
    if user["role"] == "security" and payload.gate_type != "main_gate":
        raise HTTPException(403, "Security can only check in main gate visitors")

    try:
        result = await svc.check_in(user["college_id"], user["id"], payload.model_dump())
        return {"success": True, "data": result}
    except ValueError as e:
        raise HTTPException(400, str(e))


# ═══════════════════════════════════════════════════════════════════════════════
# CHECK-IN PRE-APPROVED — Quick check-in for expected visitors
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/visitors/{visit_id}/check-in")
async def check_in_pre_approved(
    visit_id: str,
    badge_number: Optional[str] = Query(None),
    user: dict = Depends(require_role("admin", "security", "warden")),
    svc: VisitorService = Depends(get_visitor_service),
):
    """Check in a pre-approved/approved visitor."""
    try:
        result = await svc.check_in_pre_approved(
            visit_id, user["college_id"], user["id"], badge_number
        )
        return {"success": True, "data": result}
    except ValueError as e:
        raise HTTPException(400, str(e))


# ═══════════════════════════════════════════════════════════════════════════════
# CHECK-OUT — Mark visitor departure
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/visitors/check-out")
async def check_out_visitor(
    payload: VisitCheckOut,
    user: dict = Depends(require_role("admin", "security", "warden")),
    svc: VisitorService = Depends(get_visitor_service),
):
    """Mark a visitor as checked out."""
    try:
        result = await svc.check_out(
            payload.visit_id, user["college_id"], user["id"], payload.remarks
        )
        return {"success": True, "data": result}
    except ValueError as e:
        raise HTTPException(400, str(e))


# ═══════════════════════════════════════════════════════════════════════════════
# PRE-APPROVE — Staff pre-approves expected visitor
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/visitors/pre-approve")
async def pre_approve_visitor(
    payload: VisitPreApprove,
    user: dict = Depends(require_role("admin", "security", "warden", "teacher", "hod")),
    svc: VisitorService = Depends(get_visitor_service),
):
    """Pre-approve an expected visitor."""
    try:
        result = await svc.pre_approve(
            user["college_id"], user["id"], user["name"], payload.model_dump()
        )
        return {"success": True, "data": result}
    except ValueError as e:
        raise HTTPException(400, str(e))


# ═══════════════════════════════════════════════════════════════════════════════
# APPROVE / REJECT — For pending walk-in visits
# ═══════════════════════════════════════════════════════════════════════════════

@router.put("/visitors/{visit_id}/review")
async def review_visit(
    visit_id: str,
    payload: VisitApprovalAction,
    user: dict = Depends(require_role("admin", "security", "warden")),
    svc: VisitorService = Depends(get_visitor_service),
):
    """Approve or reject a pending visit."""
    try:
        result = await svc.approve_or_reject(
            visit_id, user["college_id"], user["id"], payload.action, payload.remarks
        )
        return {"success": True, "data": result}
    except ValueError as e:
        raise HTTPException(400, str(e))


# ═══════════════════════════════════════════════════════════════════════════════
# ACTIVE VISITORS — Currently checked-in
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/visitors/active")
async def get_active_visitors(
    gate_type: Optional[str] = Query(None),
    hostel_id: Optional[str] = Query(None),
    user: dict = Depends(require_role("admin", "security", "warden")),
    svc: VisitorService = Depends(get_visitor_service),
):
    """List currently checked-in visitors."""
    effective_gate = gate_type
    if user["role"] == "warden" and not gate_type:
        effective_gate = "hostel"
    if user["role"] == "security" and not gate_type:
        effective_gate = "main_gate"

    data = await svc.get_active_visitors(
        user["college_id"], gate_type=effective_gate, hostel_id=hostel_id
    )
    return {"data": data}


# ═══════════════════════════════════════════════════════════════════════════════
# PENDING — Awaiting approval
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/visitors/pending")
async def get_pending_visits(
    gate_type: Optional[str] = Query(None),
    hostel_id: Optional[str] = Query(None),
    user: dict = Depends(require_role("admin", "security", "warden")),
    svc: VisitorService = Depends(get_visitor_service),
):
    """Get pending approval visits."""
    effective_gate = gate_type
    if user["role"] == "warden" and not gate_type:
        effective_gate = "hostel"
    if user["role"] == "security" and not gate_type:
        effective_gate = "main_gate"

    data = await svc.get_pending_visits(
        user["college_id"], gate_type=effective_gate, hostel_id=hostel_id
    )
    return {"data": data}


# ═══════════════════════════════════════════════════════════════════════════════
# PRE-APPROVED — Upcoming expected visitors
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/visitors/pre-approved")
async def get_pre_approved_visits(
    gate_type: Optional[str] = Query(None),
    user: dict = Depends(require_role("admin", "security", "warden")),
    svc: VisitorService = Depends(get_visitor_service),
):
    """Get pre-approved visits awaiting arrival."""
    data = await svc.get_pre_approved_visits(
        user["college_id"], gate_type=gate_type
    )
    return {"data": data}


# ═══════════════════════════════════════════════════════════════════════════════
# MY EXPECTED — Staff's own pre-approved visitors
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/visitors/my-expected")
async def get_my_expected(
    user: dict = Depends(require_role("admin", "security", "warden", "teacher", "hod")),
    svc: VisitorService = Depends(get_visitor_service),
):
    """Get visits pre-approved by the current user."""
    data = await svc.get_my_expected(user["id"], user["college_id"])
    return {"data": data}


# ═══════════════════════════════════════════════════════════════════════════════
# VISIT LOG — Historical records
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/visitors/log")
async def get_visit_log(
    gate_type: Optional[str] = Query(None),
    hostel_id: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user: dict = Depends(require_role("admin", "security", "warden")),
    svc: VisitorService = Depends(get_visitor_service),
):
    """Historical visit log with filters."""
    effective_gate = gate_type
    if user["role"] == "warden" and not gate_type:
        effective_gate = "hostel"
    if user["role"] == "security" and not gate_type:
        effective_gate = "main_gate"

    data = await svc.get_visit_log(
        user["college_id"], gate_type=effective_gate, hostel_id=hostel_id,
        date_from=date_from, date_to=date_to, search=search,
        limit=limit, offset=offset,
    )
    return {"data": data}
