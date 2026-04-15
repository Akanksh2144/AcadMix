"""
Push Notification Service (FCM-First)
======================================
Transport alerts via Firebase Cloud Messaging — FREE, unlimited.
WhatsApp is NOT used for transport alerts (costs ₹0.115/msg = ₹50K+/month).

FCM Message Types:
  1. Notification messages — visible on lock screen (trip started, bus arriving, delay)
  2. Data messages — silent, trigger frontend state changes (node_update, go_live)

FCM tokens stored in UserProfile.extra_data["fcm_token"].
When FIREBASE_CREDENTIALS_PATH is empty, falls back to console logging (mock mode).
"""

import logging
import os
from typing import List, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app import models
from app.core.config import settings

logger = logging.getLogger("acadmix.transport_push")

# ─── Firebase Initialization ────────────────────────────────────────────────

_firebase_initialized = False


def _init_firebase():
    """Lazy-init Firebase Admin SDK. Only called once."""
    global _firebase_initialized
    if _firebase_initialized:
        return True

    creds_path = settings.FIREBASE_CREDENTIALS_PATH
    if not creds_path or not os.path.exists(creds_path):
        logger.warning("FCM mock mode: FIREBASE_CREDENTIALS_PATH not set or file missing")
        return False

    try:
        import firebase_admin
        from firebase_admin import credentials
        cred = credentials.Certificate(creds_path)
        firebase_admin.initialize_app(cred)
        _firebase_initialized = True
        logger.info("Firebase Admin SDK initialized successfully")
        return True
    except Exception as e:
        logger.error("Firebase init failed: %s", e)
        return False


# ─── Core FCM Send Functions ────────────────────────────────────────────────


async def send_notification(
    fcm_token: str, title: str, body: str, data: dict = None,
):
    """
    Send a visible notification to a single device.
    Shows on lock screen with title + body.
    """
    if not _init_firebase():
        logger.info("[FCM-MOCK] → %s | %s: %s | data=%s", fcm_token[:20], title, body, data)
        return True

    try:
        from firebase_admin import messaging

        message = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            data={k: str(v) for k, v in (data or {}).items()},
            token=fcm_token,
            android=messaging.AndroidConfig(
                priority="high",
                notification=messaging.AndroidNotification(
                    channel_id="transport_alerts",
                    priority="high",
                ),
            ),
        )
        response = messaging.send(message)
        logger.debug("FCM sent: %s", response)
        return True
    except Exception as e:
        logger.error("FCM send failed for %s: %s", fcm_token[:20], e)
        return False


async def send_data_message(fcm_token: str, data: dict):
    """
    Send a silent data-only message. Does NOT show a notification.
    Used to trigger frontend state changes (node jumps, go-live, trip ended).
    """
    if not _init_firebase():
        logger.info("[FCM-DATA-MOCK] → %s | %s", fcm_token[:20], data)
        return True

    try:
        from firebase_admin import messaging

        message = messaging.Message(
            data={k: str(v) for k, v in data.items()},
            token=fcm_token,
            android=messaging.AndroidConfig(priority="high"),
        )
        response = messaging.send(message)
        logger.debug("FCM data sent: %s", response)
        return True
    except Exception as e:
        logger.error("FCM data send failed for %s: %s", fcm_token[:20], e)
        return False


async def send_batch_notification(
    fcm_tokens: List[str], title: str, body: str, data: dict = None,
):
    """Send notification to multiple devices (up to 500 per batch)."""
    if not _init_firebase():
        logger.info("[FCM-BATCH-MOCK] → %d devices | %s: %s", len(fcm_tokens), title, body)
        return len(fcm_tokens)

    try:
        from firebase_admin import messaging

        message = messaging.MulticastMessage(
            notification=messaging.Notification(title=title, body=body),
            data={k: str(v) for k, v in (data or {}).items()},
            tokens=fcm_tokens,
            android=messaging.AndroidConfig(
                priority="high",
                notification=messaging.AndroidNotification(
                    channel_id="transport_alerts",
                    priority="high",
                ),
            ),
        )
        response = messaging.send_each_for_multicast(message)
        logger.info("FCM batch: %d success, %d fail", response.success_count, response.failure_count)
        return response.success_count
    except Exception as e:
        logger.error("FCM batch failed: %s", e)
        return 0


async def send_batch_data(fcm_tokens: List[str], data: dict):
    """Send silent data message to multiple devices."""
    if not _init_firebase():
        logger.info("[FCM-DATA-BATCH-MOCK] → %d devices | %s", len(fcm_tokens), data)
        return len(fcm_tokens)

    try:
        from firebase_admin import messaging

        message = messaging.MulticastMessage(
            data={k: str(v) for k, v in data.items()},
            tokens=fcm_tokens,
            android=messaging.AndroidConfig(priority="high"),
        )
        response = messaging.send_each_for_multicast(message)
        return response.success_count
    except Exception as e:
        logger.error("FCM data batch failed: %s", e)
        return 0


# ─── Student FCM Token Lookup ───────────────────────────────────────────────


async def _get_enrolled_fcm_tokens_at_stops(
    db: AsyncSession, route_id: str, stop_indices: List[int],
) -> List[Dict]:
    """
    Get FCM tokens for enrolled students at specific stops.
    FCM token stored in UserProfile.extra_data["fcm_token"].
    """
    stmt = (
        select(
            models.TransportEnrollment.student_id,
            models.TransportEnrollment.boarding_stop_index,
            models.TransportEnrollment.boarding_stop_name,
            models.UserProfile.extra_data,
            models.User.name,
        )
        .join(models.User, models.User.id == models.TransportEnrollment.student_id)
        .join(models.UserProfile, models.UserProfile.user_id == models.User.id)
        .where(
            models.TransportEnrollment.route_id == route_id,
            models.TransportEnrollment.boarding_stop_index.in_(stop_indices),
            models.TransportEnrollment.is_active == True,
            models.TransportEnrollment.is_deleted == False,
            models.User.is_deleted == False,
        )
    )
    result = await db.execute(stmt)
    rows = result.all()

    students = []
    for student_id, stop_idx, stop_name, extra_data, name in rows:
        fcm_token = (extra_data or {}).get("fcm_token")
        if fcm_token:
            students.append({
                "student_id": student_id,
                "boarding_stop_index": stop_idx,
                "boarding_stop_name": stop_name,
                "fcm_token": fcm_token,
                "name": name,
            })
        else:
            logger.debug("No FCM token for student %s (%s)", name, student_id)

    return students


async def _get_all_enrolled_fcm_tokens(
    db: AsyncSession, route_id: str,
) -> List[Dict]:
    """Get FCM tokens for ALL enrolled students on a route."""
    stmt = (
        select(
            models.TransportEnrollment.student_id,
            models.TransportEnrollment.boarding_stop_index,
            models.TransportEnrollment.boarding_stop_name,
            models.UserProfile.extra_data,
            models.User.name,
        )
        .join(models.User, models.User.id == models.TransportEnrollment.student_id)
        .join(models.UserProfile, models.UserProfile.user_id == models.User.id)
        .where(
            models.TransportEnrollment.route_id == route_id,
            models.TransportEnrollment.is_active == True,
            models.TransportEnrollment.is_deleted == False,
            models.User.is_deleted == False,
        )
    )
    result = await db.execute(stmt)
    rows = result.all()

    students = []
    for student_id, stop_idx, stop_name, extra_data, name in rows:
        fcm_token = (extra_data or {}).get("fcm_token")
        if fcm_token:
            students.append({
                "student_id": student_id,
                "boarding_stop_index": stop_idx,
                "boarding_stop_name": stop_name,
                "fcm_token": fcm_token,
                "name": name,
            })

    return students


# ─── Transport Alert Functions ───────────────────────────────────────────────


async def notify_trip_started(
    db: AsyncSession, route_id: str, route_name: str,
):
    """
    Trip just started from depot/first stop.
    FCM notification to Stop 1 & 2 students + silent data message to trigger Live Radar.
    """
    students = await _get_enrolled_fcm_tokens_at_stops(db, route_id, [0, 1])
    if not students:
        return 0

    tokens = [s["fcm_token"] for s in students]

    # Visible notification
    await send_batch_notification(
        tokens,
        title=f"🚌 Bus Started — {route_name}",
        body="Your bus has departed. Please head to your boarding point.",
        data={"type": "trip_started", "route_id": route_id},
    )

    # Silent data message to trigger Live Radar on frontend
    await send_batch_data(tokens, {
        "type": "go_live",
        "route_id": route_id,
        "reason": "trip_started_first_stops",
    })

    logger.info("Trip started FCM: %d students notified for %s", len(students), route_id)
    return len(students)


async def notify_stop_approaching(
    db: AsyncSession, route_id: str, route_name: str,
    departed_node_index: int, departed_stop_name: str,
    next_stops_to_notify: List[int], eta_minutes: int = 0,
    stops: List[Dict] = None,
):
    """
    Bus departed from a stop. Fire FCM to next N stops (N-2 rule).
    
    N+1 students: Visible notification "Bus arriving in X min" + go_live data
    N+2 students: Silent node_update data message (map jumps to new node)
    """
    students = await _get_enrolled_fcm_tokens_at_stops(db, route_id, next_stops_to_notify)
    if not students:
        return 0

    for s in students:
        stop_diff = s["boarding_stop_index"] - departed_node_index

        if stop_diff == 1:
            # Next stop — visible "arriving" notification + go_live
            eta_str = f" ETA: ~{eta_minutes} min." if eta_minutes > 0 else ""
            await send_notification(
                s["fcm_token"],
                title=f"🚌 Bus Approaching — {route_name}",
                body=f"Bus departed {departed_stop_name}. Next: {s['boarding_stop_name']}.{eta_str}",
                data={
                    "type": "go_live",
                    "route_id": route_id,
                    "reason": "stop_approaching",
                    "eta_min": str(eta_minutes),
                },
            )
        elif stop_diff == 2:
            # 2 stops away — visible notification + go_live trigger
            await send_notification(
                s["fcm_token"],
                title=f"🚌 Bus Update — {route_name}",
                body=f"Your bus is 2 stops away. Get ready!",
                data={
                    "type": "go_live",
                    "route_id": route_id,
                    "reason": "n_minus_2",
                },
            )
        else:
            # Further away — silent node update (map jumps to new position)
            await send_data_message(s["fcm_token"], {
                "type": "node_update",
                "route_id": route_id,
                "node_index": str(departed_node_index),
                "stop_name": departed_stop_name,
            })

    logger.info(
        "Stop approaching FCM: %d students at stops %s on %s",
        len(students), next_stops_to_notify, route_id,
    )
    return len(students)


async def notify_node_update_all(
    db: AsyncSession, route_id: str,
    node_index: int, stop_name: str,
):
    """
    Silent data push to ALL enrolled students: update the map marker position.
    This powers the "Node-Jumper" phase — map shows bus at latest node, 0 API calls.
    """
    students = await _get_all_enrolled_fcm_tokens(db, route_id)
    if not students:
        return 0

    tokens = [s["fcm_token"] for s in students]
    count = await send_batch_data(tokens, {
        "type": "node_update",
        "route_id": route_id,
        "node_index": str(node_index),
        "stop_name": stop_name,
    })

    logger.info("Node update FCM: %d devices for %s node=%d", count, route_id, node_index)
    return count


async def notify_delay(
    db: AsyncSession, route_id: str, route_name: str,
    delay_minutes: int, affected_stop_indices: List[int] = None,
):
    """
    Exception-only alert (Method 3): Bus is >5 min late.
    Visible notification to all remaining stop students.
    """
    if affected_stop_indices:
        students = await _get_enrolled_fcm_tokens_at_stops(db, route_id, affected_stop_indices)
    else:
        students = await _get_all_enrolled_fcm_tokens(db, route_id)

    if not students:
        return 0

    tokens = [s["fcm_token"] for s in students]
    count = await send_batch_notification(
        tokens,
        title=f"⚠️ Bus Delayed — {route_name}",
        body=f"Your bus is running ~{delay_minutes} minutes late. We'll notify you when it's close.",
        data={
            "type": "delay_alert",
            "route_id": route_id,
            "delay_min": str(delay_minutes),
        },
    )

    logger.info("Delay FCM: %d students notified, delay=%d min", count, delay_minutes)
    return count


async def notify_trip_ended(
    db: AsyncSession, route_id: str, route_name: str,
):
    """Trip completed. FCM notification + data message to kill polling on all devices."""
    students = await _get_all_enrolled_fcm_tokens(db, route_id)
    if not students:
        return 0

    tokens = [s["fcm_token"] for s in students]

    # Visible notification
    await send_batch_notification(
        tokens,
        title=f"✅ Bus Arrived — {route_name}",
        body="Your bus has safely arrived at campus.",
        data={"type": "trip_ended", "route_id": route_id},
    )

    # Silent data to kill frontend polling
    await send_batch_data(tokens, {
        "type": "trip_ended",
        "route_id": route_id,
    })

    return len(students)


# ─── Admin / Safety Alerts (WhatsApp for admins — they don't use the app) ──


async def notify_speed_violation(
    db: AsyncSession, college_id: str, route_name: str,
    speed_kmh: float, limit_kmh: int,
):
    """
    Alert transport manager about speed violation.
    Uses WhatsApp for admin alerts (admins don't watch the student app).
    """
    try:
        from app.services.wa_interactive import send_text_message

        stmt = (
            select(models.UserProfile.phone, models.User.name)
            .join(models.User, models.User.id == models.UserProfile.user_id)
            .where(
                models.User.college_id == college_id,
                models.User.role.in_(["admin"]),
                models.User.is_deleted == False,
                models.UserProfile.phone != None,
            )
            .limit(3)
        )
        result = await db.execute(stmt)
        admins = result.all()

        for phone, name in admins:
            msg = (
                f"🚨 *Speed Violation — {route_name}*\n\n"
                f"Bus clocked *{speed_kmh:.0f} km/h* (limit: {limit_kmh} km/h).\n"
                f"Immediate attention required."
            )
            await send_text_message(phone, msg)
    except Exception as e:
        logger.error("Speed violation alert failed: %s", e)


async def notify_sos(
    db: AsyncSession, college_id: str, route_id: str, route_name: str,
):
    """
    EMERGENCY: SOS button pressed on bus.
    WhatsApp to ALL admins — this is life-safety, not a transport convenience alert.
    """
    try:
        from app.services.wa_interactive import send_text_message

        stmt = (
            select(models.UserProfile.phone, models.User.name)
            .join(models.User, models.User.id == models.UserProfile.user_id)
            .where(
                models.User.college_id == college_id,
                models.User.role.in_(["admin", "principal"]),
                models.User.is_deleted == False,
                models.UserProfile.phone != None,
            )
            .limit(5)
        )
        result = await db.execute(stmt)
        admins = result.all()

        for phone, name in admins:
            msg = (
                f"🆘🆘🆘 *EMERGENCY — {route_name}*\n\n"
                f"*SOS ALERT* triggered on bus.\n"
                f"Route: {route_name}\n\n"
                f"*TAKE IMMEDIATE ACTION.*"
            )
            await send_text_message(phone, msg)

        logger.critical("SOS ALERT sent to %d admins for route %s", len(admins), route_name)
    except Exception as e:
        logger.error("SOS alert failed: %s", e)
