"""
IoT Webhook Endpoints — Hardware-to-Backend Communication

Receives data from AIS 140 GPS devices, ESP32 bus trackers, vending machines,
and other IoT hardware. Authenticates via X-IoT-Secret header or IMEI lookup.

Endpoints:
  POST /api/iot/bus/telemetry     — AIS 140 GPS packet (→ Redis + auto-geofence)
  POST /api/iot/bus/sos           — Emergency SOS from AIS 140 panic button
  POST /api/iot/bus/location      — Legacy GPS ping from ESP32
  POST /api/iot/bus/geofence      — Geofence entry/exit events
  POST /api/iot/vending/transaction — Card-tap transaction
  POST /api/iot/vending/health    — ESP32 heartbeat / inventory
"""

import logging
import hmac
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from typing import Optional

from database import get_db
from app import models
from app.core.config import settings

logger = logging.getLogger("acadmix.iot_webhooks")

router = APIRouter()


# ─── Auth ─────────────────────────────────────────────────────────────────────


def verify_iot_secret(x_iot_secret: str = Header(default="")):
    """Validate IoT device shared secret."""
    if not settings.IOT_WEBHOOK_SECRET:
        # No secret configured — allow in dev mode
        return True
    if not hmac.compare_digest(x_iot_secret, settings.IOT_WEBHOOK_SECRET):
        raise HTTPException(status_code=401, detail="Invalid IoT secret")
    return True


# ─── Schemas ─────────────────────────────────────────────────────────────────


class BusLocationPayload(BaseModel):
    college_id: str
    route_id: str
    latitude: float
    longitude: float
    speed_kmh: Optional[float] = None
    heading: Optional[float] = None


class BusGeofencePayload(BaseModel):
    college_id: str
    route_id: str
    stop_name: str
    event: str  # "enter", "exit", "campus_enter", "campus_exit"
    eta_minutes: Optional[int] = 0


class VendingTransactionPayload(BaseModel):
    college_id: str
    machine_id: str
    student_id: str
    transaction_type: str  # "purchase", "mess_breakfast", etc.
    item_name: Optional[str] = None
    amount: float = Field(..., gt=0, le=100_000, description="Transaction amount (must be positive, max 1 lakh)")


class VendingHealthPayload(BaseModel):
    college_id: str
    machine_id: str
    inventory_pct: float  # 0-100
    status: str  # "online", "offline", "error"
    error_message: Optional[str] = None


# ─── Bus Location ────────────────────────────────────────────────────────────


@router.post("/iot/bus/location")
async def bus_location_ping(
    payload: BusLocationPayload,
    db: AsyncSession = Depends(get_db),
    _auth: bool = Depends(verify_iot_secret),
):
    """Receive GPS ping from bus tracker."""
    loc = models.BusLocation(
        college_id=payload.college_id,
        route_id=payload.route_id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        speed_kmh=payload.speed_kmh,
        heading=payload.heading,
    )
    db.add(loc)
    await db.commit()

    return {"status": "ok", "id": loc.id}


# ─── AIS 140 Telemetry (Future-Ready) ───────────────────────────────────


@router.post("/iot/bus/telemetry")
async def ais140_telemetry(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    _auth: bool = Depends(verify_iot_secret),
):
    """
    AIS 140 GPS device telemetry packet.
    Full pipeline: IMEI auth → Redis update → auto-geofence → auto-alerts.
    No direct DB write — all state lives in Redis.
    """
    from app.services.transport_service import TransportService

    imei = payload.get("imei", "")
    lat = payload.get("latitude", 0)
    lng = payload.get("longitude", 0)
    speed = payload.get("speed_kmh", 0)
    heading = payload.get("heading", 0)
    sos = payload.get("sos", False)

    if not imei:
        raise HTTPException(status_code=400, detail="Missing IMEI")

    svc = TransportService(db)
    try:
        result = await svc.process_telemetry(imei, lat, lng, speed, heading, sos)
        return {"status": "ok", **result}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/iot/bus/sos")
async def ais140_sos(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    _auth: bool = Depends(verify_iot_secret),
):
    """
    Emergency SOS from AIS 140 panic button.
    Bypasses normal processing — immediate alert dispatch.
    """
    from app.services.transport_service import TransportService

    imei = payload.get("imei", "")
    if not imei:
        raise HTTPException(status_code=400, detail="Missing IMEI")

    svc = TransportService(db)
    try:
        result = await svc.process_telemetry(imei, 0, 0, 0, 0, sos=True)
        return {"status": "sos_dispatched", **result}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ─── Bus Geofence Events ────────────────────────────────────────────────────


@router.post("/iot/bus/geofence")
async def bus_geofence_event(
    payload: BusGeofencePayload,
    db: AsyncSession = Depends(get_db),
    _auth: bool = Depends(verify_iot_secret),
):
    """
    Receive geofence entry/exit events.
    Triggers WhatsApp alerts to subscribed parents & students.
    """
    # Store as a location record with geofence annotation
    loc = models.BusLocation(
        college_id=payload.college_id,
        route_id=payload.route_id,
        latitude=0, longitude=0,  # Geofence events may not carry exact coords
        geofence_event=f"{payload.event}:{payload.stop_name}",
    )
    db.add(loc)
    await db.commit()

    # Fire WhatsApp alerts (inline, since geofence events are infrequent)
    from app.services.wa_parent_flows import send_bus_geofence_alert
    await send_bus_geofence_alert(
        db, payload.college_id, payload.route_id,
        payload.stop_name, payload.event, payload.eta_minutes or 0,
    )

    return {"status": "ok", "event": payload.event, "stop": payload.stop_name}


# ─── Vending Transaction ────────────────────────────────────────────────────


@router.post("/iot/vending/transaction")
async def vending_transaction(
    payload: VendingTransactionPayload,
    db: AsyncSession = Depends(get_db),
    _auth: bool = Depends(verify_iot_secret),
):
    """
    Card-tap / wallet transaction at vending machine or mess counter.
    Deducts from student wallet and sends WhatsApp receipt.
    """
    from sqlalchemy.future import select

    # Get student profile to deduct wallet.
    # with_for_update() acquires a row-level lock to prevent double-spend
    # race conditions from concurrent card-tap requests.
    profile_r = await db.execute(
        select(models.UserProfile).where(
            models.UserProfile.user_id == payload.student_id,
            models.UserProfile.is_deleted == False,
        ).with_for_update()
    )
    profile = profile_r.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")

    current_balance = profile.acad_tokens or 0
    if current_balance < payload.amount:
        raise HTTPException(status_code=402, detail="Insufficient wallet balance")

    # Deduct
    new_balance = current_balance - payload.amount
    profile.acad_tokens = new_balance
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(profile, "acad_tokens")

    # Record transaction
    txn = models.VendingTransaction(
        college_id=payload.college_id,
        student_id=payload.student_id,
        machine_id=payload.machine_id,
        transaction_type=payload.transaction_type,
        item_name=payload.item_name,
        amount=payload.amount,
        balance_after=new_balance,
    )
    db.add(txn)
    await db.commit()

    # Send WhatsApp receipt (inline — these are real-time)
    from app.services.wa_student_flows import send_vending_receipt
    await send_vending_receipt(
        db, payload.student_id, payload.item_name,
        payload.amount, new_balance, payload.transaction_type,
    )

    return {
        "status": "ok",
        "transaction_id": txn.id,
        "balance": new_balance,
    }


# ─── Vending Health ──────────────────────────────────────────────────────────


@router.post("/iot/vending/health")
async def vending_health_ping(
    payload: VendingHealthPayload,
    db: AsyncSession = Depends(get_db),
    _auth: bool = Depends(verify_iot_secret),
):
    """
    ESP32 heartbeat with inventory level and status.
    Triggers maintenance alert if offline or inventory < 10%.
    """
    from sqlalchemy.future import select

    # Update machine status
    machine_r = await db.execute(
        select(models.VendingMachine).where(
            models.VendingMachine.id == payload.machine_id
        )
    )
    machine = machine_r.scalars().first()

    alert_needed = False
    alert_type = ""
    alert_details = ""

    if machine:
        old_status = machine.status
        machine.status = payload.status
        machine.last_heartbeat = datetime.utcnow()
        await db.commit()

        # Alert conditions
        if payload.status in ("offline", "error") and old_status == "online":
            alert_needed = True
            alert_type = "offline"
            alert_details = (
                f"Machine *{machine.machine_code}* at {machine.location} went *{payload.status}*."
            )
            if payload.error_message:
                alert_details += f"\nError: {payload.error_message}"

        if payload.inventory_pct < 10:
            alert_needed = True
            alert_type = "low_inventory"
            alert_details = (
                f"Machine *{machine.machine_code}* at {machine.location} — "
                f"inventory at *{payload.inventory_pct:.0f}%*. Restock needed."
            )

    if alert_needed and machine:
        from app.services.wa_staff_flows import send_hardware_alert
        await send_hardware_alert(
            db, payload.college_id, machine.machine_code, alert_type, alert_details,
        )

    return {"status": "ok", "alert_triggered": alert_needed}
