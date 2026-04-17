"""
Transport Admin & Simulator API
=================================
Admin fleet management, AIS 140 device registration,
route CRUD, driver roster assignment, and trip simulator.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Optional

from database import get_db
from app.core.security import require_role
from app.core.response import mark_enveloped
from app.services.transport_service import TransportService
from app.services import transport_state
from app import models
from app.schemas.transport import (
    AIS140DeviceRegister, RouteCreateRequest, RouteUpdateRequest,
    AssignDriverRequest, TripStartRequest, TripEndRequest,
    ClearStopRequest, BoardingScanRequest, SimulateAdvanceRequest,
)

router = APIRouter()


def get_svc(db: AsyncSession = Depends(get_db)):
    return TransportService(db)


# ═══════════════════════════════════════════════════════════════════════════════
# AIS 140 DEVICE MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════


@router.post("/admin/transport/devices", dependencies=[Depends(mark_enveloped)])
async def register_device(
    payload: AIS140DeviceRegister,
    user: dict = Depends(require_role("admin", "transport_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Register a new AIS 140 GPS device (hardwired into a bus)."""
    device = models.AIS140Device(
        college_id=user["college_id"],
        imei=payload.imei,
        vehicle_number=payload.vehicle_number,
        sim_iccid=payload.sim_iccid,
        route_id=payload.route_id,
    )
    db.add(device)
    await db.commit()
    await db.refresh(device)
    return {"success": True, "data": {"id": device.id, "imei": device.imei}}


@router.get("/admin/transport/devices", dependencies=[Depends(mark_enveloped)])
async def list_devices(
    user: dict = Depends(require_role("admin", "transport_admin")),
    db: AsyncSession = Depends(get_db),
):
    """List all registered AIS 140 devices."""
    result = await db.execute(
        select(models.AIS140Device).where(
            models.AIS140Device.college_id == user["college_id"],
            models.AIS140Device.is_deleted == False,
        )
    )
    devices = result.scalars().all()
    return {
        "data": [
            {
                "id": d.id,
                "imei": d.imei,
                "vehicle_number": d.vehicle_number,
                "route_id": d.route_id,
                "status": d.status,
                "last_ping_at": d.last_ping_at.isoformat() if d.last_ping_at else None,
            }
            for d in devices
        ]
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ROUTE MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════


@router.post("/admin/transport/routes", dependencies=[Depends(mark_enveloped)])
async def create_route(
    payload: RouteCreateRequest,
    user: dict = Depends(require_role("admin", "transport_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Create a new bus route with stops."""
    route = models.BusRoute(
        college_id=user["college_id"],
        route_number=payload.route_number,
        route_name=payload.route_name,
        vehicle_number=payload.vehicle_number,
        capacity=payload.capacity,
        stops=payload.stops,
        departure_time=payload.departure_time,
        return_time=payload.return_time,
        fee_amount=payload.fee_amount,
        avg_stop_times=payload.avg_stop_times,
    )
    db.add(route)
    await db.commit()
    await db.refresh(route)
    return {"success": True, "data": {"id": route.id, "route_number": route.route_number}}


@router.put("/admin/transport/routes/{route_id}", dependencies=[Depends(mark_enveloped)])
async def update_route(
    route_id: str,
    payload: RouteUpdateRequest,
    user: dict = Depends(require_role("admin", "transport_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing route."""
    result = await db.execute(
        select(models.BusRoute).where(
            models.BusRoute.id == route_id,
            models.BusRoute.college_id == user["college_id"],
        )
    )
    route = result.scalars().first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(route, key, value)

    await db.commit()
    return {"success": True, "data": {"id": route.id}}


@router.get("/admin/transport/routes", dependencies=[Depends(mark_enveloped)])
async def list_admin_routes(
    user: dict = Depends(require_role("admin", "transport_admin")),
    svc: TransportService = Depends(get_svc),
):
    """List all routes with enrollment counts."""
    return {"data": await svc.get_available_routes(user["college_id"])}


@router.post("/admin/transport/assign-driver")
async def assign_driver(
    payload: AssignDriverRequest,
    user: dict = Depends(require_role("admin", "transport_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Assign a driver to a route (roster rotation)."""
    result = await db.execute(
        select(models.BusRoute).where(
            models.BusRoute.id == payload.route_id,
            models.BusRoute.college_id == user["college_id"],
        )
    )
    route = result.scalars().first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")

    route.driver_id = payload.driver_id
    await db.commit()
    return {"success": True, "message": f"Driver assigned to route {route.route_number}"}


# ═══════════════════════════════════════════════════════════════════════════════
# FLEET DASHBOARD & HISTORY
# ═══════════════════════════════════════════════════════════════════════════════


@router.get("/admin/transport/dashboard", dependencies=[Depends(mark_enveloped)])
async def fleet_dashboard(
    user: dict = Depends(require_role("admin", "transport_admin")),
    svc: TransportService = Depends(get_svc),
):
    """Admin fleet overview: active trips, enrollment, device count."""
    return {"data": await svc.get_fleet_dashboard(user["college_id"])}


@router.get("/admin/transport/trips", dependencies=[Depends(mark_enveloped)])
async def trip_history(
    route_id: Optional[str] = Query(None),
    days: int = Query(7, ge=1, le=90),
    user: dict = Depends(require_role("admin", "transport_admin")),
    svc: TransportService = Depends(get_svc),
):
    """Trip history with analytics."""
    return {"data": await svc.get_trip_history(user["college_id"], route_id, days)}


# ═══════════════════════════════════════════════════════════════════════════════
# TRIP CONTROL (Admin / authorized trigger)
# ═══════════════════════════════════════════════════════════════════════════════


@router.post("/admin/transport/start-trip", dependencies=[Depends(mark_enveloped)])
async def start_trip(
    payload: TripStartRequest,
    user: dict = Depends(require_role("admin", "transport_admin")),
    svc: TransportService = Depends(get_svc),
):
    """Start a morning or evening trip."""
    try:
        result = await svc.start_trip(payload.route_id, user["college_id"], payload.direction)
        return {"success": True, "data": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/admin/transport/end-trip", dependencies=[Depends(mark_enveloped)])
async def end_trip(
    payload: TripEndRequest,
    user: dict = Depends(require_role("admin", "transport_admin")),
    svc: TransportService = Depends(get_svc),
):
    """End an active trip. Persists TripSummary."""
    try:
        result = await svc.end_trip(payload.route_id, user["college_id"])
        return {"success": True, "data": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/admin/transport/clear-stop", dependencies=[Depends(mark_enveloped)])
async def clear_stop(
    payload: ClearStopRequest,
    user: dict = Depends(require_role("admin", "transport_admin")),
    svc: TransportService = Depends(get_svc),
):
    """Manual node clear — bus departed from this stop."""
    try:
        result = await svc.process_node_arrival(payload.route_id, payload.stop_index, user["college_id"])
        return {"success": True, "data": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/admin/transport/scan-boarding", dependencies=[Depends(mark_enveloped)])
async def scan_boarding(
    payload: BoardingScanRequest,
    user: dict = Depends(require_role("admin", "transport_admin")),
    svc: TransportService = Depends(get_svc),
):
    """Record student boarding (QR / RFID scan)."""
    try:
        result = await svc.record_boarding(payload.student_id, payload.route_id, user["college_id"])
        return {"success": True, "data": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ═══════════════════════════════════════════════════════════════════════════════
# SIMULATOR — For demo and testing (no hardware needed)
# ═══════════════════════════════════════════════════════════════════════════════


@router.post("/transport/simulate/start", dependencies=[Depends(mark_enveloped)])
async def simulate_start(
    payload: TripStartRequest,
    user: dict = Depends(require_role("admin", "transport_admin")),
    svc: TransportService = Depends(get_svc),
):
    """[SIMULATOR] Start a simulated trip."""
    try:
        result = await svc.start_trip(payload.route_id, user["college_id"], payload.direction)
        return {"success": True, "data": result, "_simulator": True}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/transport/simulate/advance", dependencies=[Depends(mark_enveloped)])
async def simulate_advance(
    payload: SimulateAdvanceRequest,
    user: dict = Depends(require_role("admin", "transport_admin")),
    svc: TransportService = Depends(get_svc),
):
    """
    [SIMULATOR] Advance the bus to the next stop.
    Automatically determines the next stop from Redis state.
    """
    current_node = await transport_state.get_current_node(payload.route_id)
    if current_node is None:
        raise HTTPException(status_code=400, detail="No active trip. Start one first.")

    next_node = current_node + 1

    try:
        result = await svc.process_node_arrival(payload.route_id, next_node, user["college_id"])
        return {"success": True, "data": result, "_simulator": True}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/transport/simulate/end", dependencies=[Depends(mark_enveloped)])
async def simulate_end(
    payload: TripEndRequest,
    user: dict = Depends(require_role("admin", "transport_admin")),
    svc: TransportService = Depends(get_svc),
):
    """[SIMULATOR] End a simulated trip."""
    try:
        result = await svc.end_trip(payload.route_id, user["college_id"])
        return {"success": True, "data": result, "_simulator": True}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
