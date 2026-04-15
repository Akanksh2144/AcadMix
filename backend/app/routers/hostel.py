"""
Hostel Management API Router
=============================
Public API for the hostel booking funnel (students),
warden administration, and admin template/building management.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from database import get_db
from app.core.security import require_role, get_current_user
from app.services.hostel_service import HostelService
from app.schemas.hostel import (
    RoomTemplateCreate, HostelCreate, RoomCreate, BulkRoomCreate,
    BedLockRequest, BedBookConfirm, GatePassApply, GatePassReview,
    BedTogglePremium, BedSetMaintenance,
)

router = APIRouter()


def get_hostel_service(session: AsyncSession = Depends(get_db)):
    return HostelService(session)


# ═══════════════════════════════════════════════════════════════════════════════
# ADMIN / WARDEN — Templates
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/hostel/templates")
async def list_templates(
    user: dict = Depends(require_role("admin", "warden")),
    svc: HostelService = Depends(get_hostel_service),
):
    return {"data": await svc.list_templates(user["college_id"])}


@router.post("/hostel/templates")
async def create_template(
    payload: RoomTemplateCreate,
    user: dict = Depends(require_role("admin")),
    svc: HostelService = Depends(get_hostel_service),
):
    result = await svc.create_template(user["college_id"], payload.model_dump())
    return {"success": True, "data": result}


# ═══════════════════════════════════════════════════════════════════════════════
# ADMIN / WARDEN — Buildings (Hostels)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/hostel/buildings")
async def list_buildings(
    user: dict = Depends(require_role("admin", "warden")),
    svc: HostelService = Depends(get_hostel_service),
):
    return {"data": await svc.list_hostels(user["college_id"])}


@router.post("/hostel/buildings")
async def create_building(
    payload: HostelCreate,
    user: dict = Depends(require_role("admin")),
    svc: HostelService = Depends(get_hostel_service),
):
    result = await svc.create_hostel(user["college_id"], payload.model_dump())
    return {"success": True, "data": result}


# ═══════════════════════════════════════════════════════════════════════════════
# ADMIN — Rooms (Bulk Provisioning)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/hostel/buildings/{hostel_id}/rooms")
async def list_rooms(
    hostel_id: str,
    floor: Optional[int] = Query(None),
    user: dict = Depends(require_role("admin", "warden", "student")),
    svc: HostelService = Depends(get_hostel_service),
):
    return {"data": await svc.get_rooms_by_floor(hostel_id, user["college_id"], floor)}


@router.post("/hostel/buildings/{hostel_id}/rooms/bulk")
async def bulk_create_rooms(
    hostel_id: str,
    payload: BulkRoomCreate,
    user: dict = Depends(require_role("admin")),
    svc: HostelService = Depends(get_hostel_service),
):
    result = await svc.bulk_create_rooms(hostel_id, user["college_id"], payload.model_dump())
    return {"success": True, "data": result}


# ═══════════════════════════════════════════════════════════════════════════════
# BED GRID & ADMIN OPERATIONS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/hostel/rooms/{room_id}/grid")
async def get_room_grid(
    room_id: str,
    user: dict = Depends(require_role("admin", "warden", "student")),
    svc: HostelService = Depends(get_hostel_service),
):
    return {"data": await svc.get_room_grid(room_id, user["college_id"])}


@router.patch("/hostel/rooms/{room_id}/beds/{bed_id}/toggle-premium")
async def toggle_premium(
    room_id: str,
    bed_id: str,
    payload: BedTogglePremium,
    user: dict = Depends(require_role("admin", "warden")),
    svc: HostelService = Depends(get_hostel_service),
):
    result = await svc.toggle_bed_premium(bed_id, user["college_id"], payload.is_premium, payload.selection_fee)
    return {"success": True, "data": result}


@router.patch("/hostel/rooms/{room_id}/beds/{bed_id}/status")
async def set_bed_status(
    room_id: str,
    bed_id: str,
    payload: BedSetMaintenance,
    user: dict = Depends(require_role("admin", "warden")),
    svc: HostelService = Depends(get_hostel_service),
):
    result = await svc.set_bed_status(bed_id, user["college_id"], payload.status)
    return {"success": True, "data": result}


# ═══════════════════════════════════════════════════════════════════════════════
# STUDENT — Booking Funnel
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/hostel/available")
async def get_available_hostels(
    user: dict = Depends(require_role("student")),
    svc: HostelService = Depends(get_hostel_service),
):
    """Step 1: Available blocks filtered by gender."""
    # Infer gender from profile or pass as param — for now, return all compatible
    return {"data": await svc.get_available_hostels(user["college_id"])}


@router.get("/hostel/buildings/{hostel_id}/floors")
async def get_hostel_floors(
    hostel_id: str,
    user: dict = Depends(require_role("student", "admin", "warden")),
    svc: HostelService = Depends(get_hostel_service),
):
    """Step 2: Floor-by-floor room availability."""
    return {"data": await svc.get_rooms_by_floor(hostel_id, user["college_id"])}


@router.post("/hostel/beds/lock")
async def lock_bed(
    payload: BedLockRequest,
    user: dict = Depends(require_role("student")),
    svc: HostelService = Depends(get_hostel_service),
):
    """Step 3: Lock a bed for 10 minutes (concurrency-safe)."""
    result = await svc.lock_bed(payload.bed_id, user["id"], user["college_id"])
    return {"success": True, "data": result}


@router.post("/hostel/beds/confirm")
async def confirm_booking(
    payload: BedBookConfirm,
    user: dict = Depends(require_role("student")),
    svc: HostelService = Depends(get_hostel_service),
):
    """Step 4: Confirm booking after payment."""
    result = await svc.confirm_booking(
        payload.bed_id, user["id"], user["college_id"], payload.payment_reference
    )
    return {"success": True, "data": result}


@router.get("/hostel/my-allocation")
async def get_my_allocation(
    user: dict = Depends(require_role("student")),
    svc: HostelService = Depends(get_hostel_service),
):
    alloc = await svc.get_my_allocation(user["id"], user["college_id"])
    return {"data": alloc}


# ═══════════════════════════════════════════════════════════════════════════════
# GATE PASSES
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/hostel/gatepasses/apply")
async def apply_gatepass(
    payload: GatePassApply,
    user: dict = Depends(require_role("student")),
    svc: HostelService = Depends(get_hostel_service),
):
    result = await svc.apply_gatepass(user["id"], user["college_id"], payload.model_dump())

    # 🔔 Trigger WhatsApp approval request to parent (async, non-blocking)
    try:
        from arq import create_pool
        from arq.connections import RedisSettings
        from app.core.config import settings as app_settings
        redis = await create_pool(RedisSettings.from_dsn(app_settings.REDIS_URL))
        await redis.enqueue_job("process_gatepass_approval_request", result.get("id", ""))
    except Exception as e:
        import logging
        logging.getLogger("acadmix.hostel").warning("Failed to enqueue gate pass WA alert: %s", e)

    return {"success": True, "data": result}


@router.get("/hostel/gatepasses/my")
async def my_gatepasses(
    user: dict = Depends(require_role("student")),
    svc: HostelService = Depends(get_hostel_service),
):
    return {"data": await svc.get_student_gatepasses(user["id"], user["college_id"])}


@router.get("/hostel/gatepasses/pending")
async def pending_gatepasses(
    hostel_id: str = Query(...),
    user: dict = Depends(require_role("warden")),
    svc: HostelService = Depends(get_hostel_service),
):
    return {"data": await svc.get_pending_gatepasses(hostel_id, user["college_id"])}


@router.put("/hostel/gatepasses/{gatepass_id}/review")
async def review_gatepass(
    gatepass_id: str,
    payload: GatePassReview,
    user: dict = Depends(require_role("warden")),
    svc: HostelService = Depends(get_hostel_service),
):
    result = await svc.review_gatepass(gatepass_id, user["id"], user["college_id"], payload.model_dump())
    return {"success": True, "data": result}


# ═══════════════════════════════════════════════════════════════════════════════
# WARDEN DASHBOARD
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/hostel/warden/dashboard")
async def warden_dashboard(
    user: dict = Depends(require_role("warden")),
    svc: HostelService = Depends(get_hostel_service),
):
    return {"data": await svc.get_warden_dashboard(user["id"], user["college_id"])}
