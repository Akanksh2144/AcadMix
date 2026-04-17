"""
Student Transport API
======================
Student-facing endpoints for route browsing, enrollment,
live tracking (Adaptive Radar), digital bus pass, and trip history.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from app.core.security import require_role, get_current_user
from app.core.response import mark_enveloped
from app.services.transport_service import TransportService
from app.schemas.transport import TransportEnrollRequest

router = APIRouter(dependencies=[Depends(mark_enveloped)])


def get_svc(db: AsyncSession = Depends(get_db)):
    return TransportService(db)


# ─── Route Browsing ──────────────────────────────────────────────────────────


@router.get("/transport/routes")
async def list_routes(
    user: dict = Depends(require_role("student", "admin", "parent")),
    svc: TransportService = Depends(get_svc),
):
    """List all available bus routes with stops, capacity, and fees."""
    routes = await svc.get_available_routes(user["college_id"])
    return {"data": routes}


# ─── Enrollment ──────────────────────────────────────────────────────────────


@router.post("/transport/enroll")
async def enroll_in_route(
    payload: TransportEnrollRequest,
    user: dict = Depends(require_role("student")),
    svc: TransportService = Depends(get_svc),
):
    """Enroll in a bus route and select boarding stop."""
    try:
        result = await svc.enroll_student(
            student_id=user["id"],
            college_id=user["college_id"],
            route_id=payload.route_id,
            boarding_stop_index=payload.boarding_stop_index,
            academic_year=payload.academic_year,
        )
        return {"success": True, "data": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/transport/my-enrollment")
async def my_enrollment(
    user: dict = Depends(require_role("student")),
    svc: TransportService = Depends(get_svc),
):
    """Get current transport enrollment details."""
    enrollment = await svc.get_my_enrollment(user["id"], user["college_id"])
    return {"data": enrollment}


# ─── Live Tracking (The Adaptive Radar) ──────────────────────────────────────


@router.get("/transport/live/{route_id}")
async def get_live_position(
    route_id: str,
    user: dict = Depends(get_current_user),
    svc: TransportService = Depends(get_svc),
):
    """
    Live bus position — reads from Redis only. Sub-1ms response.
    
    Frontend behavior:
      - Node-Jumper phase: DON'T call this. Use FCM/WA data pushes only.
      - Live Radar phase (bus is ≤2 stops away): Poll this every 10 seconds.
    """
    status = await svc.get_live_status(route_id)
    return {"data": status}


@router.get("/transport/status/{route_id}")
async def get_bus_status(
    route_id: str,
    user: dict = Depends(get_current_user),
    svc: TransportService = Depends(get_svc),
):
    """
    Full bus status: position + current node + ETA + trip state.
    Lighter than /live for the Node-Jumper phase.
    """
    status = await svc.get_live_status(route_id)
    return {"data": status}


# ─── Digital Bus Pass ────────────────────────────────────────────────────────


@router.get("/transport/pass")
async def get_bus_pass(
    user: dict = Depends(require_role("student")),
    svc: TransportService = Depends(get_svc),
):
    """Generate digital bus pass QR data."""
    pass_data = await svc.generate_bus_pass_data(user["id"], user["college_id"])
    if not pass_data:
        raise HTTPException(status_code=404, detail="No active transport enrollment found")
    return {"data": pass_data}


# ─── Trip History ────────────────────────────────────────────────────────────


@router.get("/transport/history")
async def trip_history(
    user: dict = Depends(require_role("student")),
    svc: TransportService = Depends(get_svc),
):
    """Get student's transport trip history."""
    enrollment = await svc.get_my_enrollment(user["id"], user["college_id"])
    if not enrollment:
        return {"data": []}

    history = await svc.get_trip_history(
        user["college_id"],
        route_id=enrollment["route_id"],
        days=30,
    )
    return {"data": history}
