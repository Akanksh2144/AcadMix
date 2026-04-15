"""
Staff WhatsApp Flows — Transactional workflows for staff and drivers.

Flows:
  1. Hardware Maintenance Alerts (IoT-triggered)
  2. Bus Driver / Fleet Comms (transport manager broadcast)
  3. Teacher Proxy/Substitution (interactive first-click-wins)
"""

import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, date

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app import models
from app.core.config import settings
from app.services.wa_interactive import (
    send_text_message, send_button_message,
)
from app.services.wa_state_machine import (
    store_pending_action, try_claim_proxy, get_proxy_claimer,
)

logger = logging.getLogger("acadmix.wa_staff_flows")


# ─── 1. Hardware Maintenance Alerts ──────────────────────────────────────────


async def send_hardware_alert(
    db: AsyncSession,
    college_id: str,
    machine_code: str,
    alert_type: str,
    details: str,
) -> int:
    """
    Alert maintenance staff about hardware issues.
    alert_type: "offline", "low_inventory", "error"
    """
    sent_count = 0

    icons = {
        "offline": "🔴",
        "low_inventory": "📦",
        "error": "⚠️",
    }
    icon = icons.get(alert_type, "🛠️")

    msg = (
        f"{icon} *Hardware Alert — {machine_code}*\n\n"
        f"Type: {alert_type.replace('_', ' ').title()}\n"
        f"{details}\n\n"
        f"_{datetime.now().strftime('%d %b %Y, %I:%M %p')}_"
    )

    # Find maintenance/admin staff phones
    stmt = (
        select(models.UserProfile.phone)
        .join(models.User, models.User.id == models.UserProfile.user_id)
        .where(
            models.User.college_id == college_id,
            models.User.role.in_(["admin", "warden"]),  # Expand as needed
            models.User.is_deleted == False,
            models.UserProfile.is_deleted == False,
            models.UserProfile.phone != None,
            models.UserProfile.phone != "",
        )
    )
    result = await db.execute(stmt)
    phones = [r[0] for r in result.all()]

    for phone in phones:
        await send_text_message(phone, msg)
        sent_count += 1

    logger.info("Sent %d hardware alerts for %s (%s)", sent_count, machine_code, alert_type)
    return sent_count


# ─── 2. Bus Driver / Fleet Comms ─────────────────────────────────────────────


async def broadcast_to_drivers(
    db: AsyncSession,
    college_id: str,
    message: str,
    route_numbers: Optional[List[str]] = None,
) -> int:
    """
    Transport manager broadcasts a message to drivers.
    If route_numbers is specified, only target drivers on those routes.
    Otherwise, broadcast to all drivers.
    """
    sent_count = 0

    if route_numbers:
        # Get driver_ids from BusRoute
        driver_stmt = (
            select(models.BusRoute.driver_id).where(
                models.BusRoute.college_id == college_id,
                models.BusRoute.route_number.in_(route_numbers),
                models.BusRoute.driver_id != None,
                models.BusRoute.is_deleted == False,
            )
        )
        dr = await db.execute(driver_stmt)
        driver_ids = [r[0] for r in dr.all()]

        phone_stmt = (
            select(models.UserProfile.phone).where(
                models.UserProfile.user_id.in_(driver_ids),
                models.UserProfile.phone != None,
            )
        )
    else:
        # All users with driver-like roles
        phone_stmt = (
            select(models.UserProfile.phone)
            .join(models.User, models.User.id == models.UserProfile.user_id)
            .where(
                models.User.college_id == college_id,
                models.User.role == "driver",
                models.User.is_deleted == False,
                models.UserProfile.phone != None,
            )
        )

    result = await db.execute(phone_stmt)
    phones = [r[0] for r in result.all()]

    for phone in phones:
        await send_text_message(phone, f"📢 *Fleet Alert*\n\n{message}")
        sent_count += 1

    logger.info("Broadcast to %d drivers (routes=%s)", sent_count, route_numbers or "all")
    return sent_count


# ─── 3. Teacher Proxy/Substitution ───────────────────────────────────────────


async def send_proxy_requests(
    db: AsyncSession,
    college_id: str,
    absent_teacher_id: str,
    period_slot_id: str,
    subject_name: str,
    period_no: int,
    target_date: date,
) -> int:
    """
    When a teacher is absent, send interactive proxy request buttons
    to all available faculty in the same department.
    First teacher to click [Accept] wins (Redis atomic lock).
    """
    sent_count = 0

    # Get absent teacher's department
    absent_profile_r = await db.execute(
        select(models.UserProfile.department).where(
            models.UserProfile.user_id == absent_teacher_id
        )
    )
    absent_dept = absent_profile_r.scalar()
    if not absent_dept:
        return 0

    # Get absent teacher's name
    absent_teacher_r = await db.execute(
        select(models.User.name).where(models.User.id == absent_teacher_id)
    )
    absent_name = absent_teacher_r.scalar() or "A colleague"

    # Find available faculty in the same department (exclude absent teacher)
    stmt = (
        select(models.UserProfile.user_id, models.UserProfile.phone, models.User.name)
        .join(models.User, models.User.id == models.UserProfile.user_id)
        .where(
            models.User.college_id == college_id,
            models.User.role == "teacher",
            models.User.id != absent_teacher_id,
            models.User.is_deleted == False,
            models.UserProfile.department == absent_dept,
            models.UserProfile.phone != None,
            models.UserProfile.phone != "",
        )
    )
    result = await db.execute(stmt)
    teachers = result.all()

    slot_key = f"{period_slot_id}_{target_date.isoformat()}"
    date_str = target_date.strftime("%d %b %Y")

    for teacher_id, phone, name in teachers:
        body = (
            f"🔔 *Proxy Request*\n\n"
            f"*{absent_name}* is unavailable on {date_str}.\n\n"
            f"📖 Subject: *{subject_name}*\n"
            f"⏰ Period: *{period_no}*\n\n"
            f"Can you cover this class?"
        )

        buttons = [
            {"id": f"proxy_accept_{slot_key}", "title": "✅ Accept"},
            {"id": f"proxy_decline_{slot_key}", "title": "❌ Decline"},
        ]

        msg_id = await send_button_message(
            to_phone=phone,
            body_text=body,
            buttons=buttons,
            footer_text="AcadMix Substitution System",
        )

        if msg_id:
            await store_pending_action(
                action_type="proxy_claim",
                message_id=msg_id,
                payload={
                    "slot_key": slot_key,
                    "period_slot_id": period_slot_id,
                    "teacher_id": teacher_id,
                    "teacher_name": name,
                    "subject_name": subject_name,
                    "period_no": period_no,
                    "absent_teacher_id": absent_teacher_id,
                    "target_date": target_date.isoformat(),
                    "college_id": college_id,
                },
            )
            sent_count += 1

    logger.info("Sent %d proxy requests for %s P%d on %s", sent_count, subject_name, period_no, date_str)
    return sent_count


async def handle_proxy_button(
    db: AsyncSession, button_id: str, action_data: Dict[str, Any]
) -> str:
    """
    Handle teacher's Accept/Decline for a proxy class.
    Uses Redis atomic lock for first-click-wins.
    """
    slot_key = action_data.get("slot_key", "")
    teacher_id = action_data.get("teacher_id", "")
    teacher_name = action_data.get("teacher_name", "Teacher")
    subject_name = action_data.get("subject_name", "")
    period_no = action_data.get("period_no", "")

    if "decline" in button_id:
        return f"Got it! You've declined the proxy for {subject_name} P{period_no}."

    # Try to claim
    claimed = await try_claim_proxy(slot_key, teacher_id)

    if not claimed:
        # Someone else already claimed it
        claimer_id = await get_proxy_claimer(slot_key)
        claimer_r = await db.execute(
            select(models.User.name).where(models.User.id == claimer_id)
        )
        claimer_name = claimer_r.scalar() or "Another teacher"
        return f"ℹ️ This proxy was already claimed by *{claimer_name}*. Thanks for your willingness!"

    # Success — notify all parties
    return (
        f"✅ *Proxy Confirmed!*\n\n"
        f"You've accepted the proxy for:\n"
        f"📖 *{subject_name}* — Period {period_no}\n"
        f"📅 {action_data.get('target_date', '')}\n\n"
        f"Please report to the class. Thank you, *{teacher_name}*! 🙏"
    )
