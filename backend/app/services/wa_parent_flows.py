"""
Parent WhatsApp Flows — Transactional workflows for parents.

Flows:
  1. Gate Pass Interactive Approval (button messages)
  2. Daily Attendance Digest (Arq cron)
  3. Fee Due / Low Wallet Alerts (with payment links)
  4. Bus Geofence Alerts (IoT-triggered)
"""

import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, date, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, text

from app import models
from app.core.config import settings
from app.services.wa_interactive import (
    send_button_message, send_text_message, send_cta_url_message,
)
from app.services.wa_state_machine import store_pending_action

logger = logging.getLogger("acadmix.wa_parent_flows")


# ─── 1. Gate Pass Interactive Approval ────────────────────────────────────────


async def send_gatepass_approval_request(db: AsyncSession, gatepass_id: str) -> None:
    """
    Called when a student creates a gate pass.
    Sends an interactive Approve/Reject button message to the parent's WhatsApp.
    """
    # Fetch gate pass
    gp = await db.get(models.GatePass, gatepass_id)
    if not gp or gp.approval_status != "pending":
        return

    # Fetch student
    student = await db.get(models.User, gp.student_id)
    if not student:
        return

    # Find parent via ParentStudentLink
    link_r = await db.execute(
        select(models.ParentStudentLink).where(
            models.ParentStudentLink.student_id == gp.student_id,
            models.ParentStudentLink.college_id == gp.college_id,
            models.ParentStudentLink.is_deleted == False,
        ).order_by(models.ParentStudentLink.is_primary.desc())
    )
    link = link_r.scalars().first()
    if not link:
        logger.info("No parent linked for student %s — skipping gate pass WA", gp.student_id)
        return

    # Get parent phone
    parent_profile_r = await db.execute(
        select(models.UserProfile).where(
            models.UserProfile.user_id == link.parent_id,
            models.UserProfile.is_deleted == False,
        )
    )
    parent_profile = parent_profile_r.scalars().first()
    if not parent_profile or not parent_profile.phone:
        logger.info("Parent %s has no phone number — skipping gate pass WA", link.parent_id)
        return

    phone = parent_profile.phone
    exit_str = gp.requested_exit.strftime("%d %b, %I:%M %p") if gp.requested_exit else "N/A"
    return_str = gp.expected_return.strftime("%d %b, %I:%M %p") if gp.expected_return else "N/A"

    body = (
        f"🏠 *Gate Pass Request*\n\n"
        f"👤 *{student.name}* is requesting permission to leave the hostel.\n\n"
        f"📋 *Reason:* {gp.reason}\n"
        f"🚪 *Exit:* {exit_str}\n"
        f"🔙 *Expected Return:* {return_str}\n\n"
        f"Please approve or reject this request."
    )

    buttons = [
        {"id": f"gp_approve_{gatepass_id}", "title": "✅ Approve"},
        {"id": f"gp_reject_{gatepass_id}", "title": "❌ Reject"},
    ]

    msg_id = await send_button_message(
        to_phone=phone,
        body_text=body,
        buttons=buttons,
        footer_text="AcadMix Hostel System",
    )

    if msg_id:
        await store_pending_action(
            action_type="gatepass_approval",
            message_id=msg_id,
            payload={
                "gatepass_id": gatepass_id,
                "student_id": gp.student_id,
                "parent_id": link.parent_id,
                "parent_phone": phone,
            },
        )
        logger.info("Gate pass approval sent to parent (msg_id=%s)", msg_id)


async def handle_gatepass_button(
    db: AsyncSession, button_id: str, action_data: Dict[str, Any], parent_phone: str
) -> str:
    """
    Handle parent's Approve/Reject button click for a gate pass.
    Returns confirmation message text.
    """
    gatepass_id = action_data.get("gatepass_id")
    if not gatepass_id:
        return "❌ Gate pass context expired. Please check the portal."

    gp = await db.get(models.GatePass, gatepass_id)
    if not gp:
        return "❌ Gate pass not found."
    if gp.approval_status != "pending":
        return f"ℹ️ This gate pass was already {gp.approval_status}."

    is_approve = "approve" in button_id
    gp.approval_status = "approved" if is_approve else "rejected"
    gp.approved_by = action_data.get("parent_id")
    gp.approved_at = datetime.utcnow()
    await db.commit()

    # Notify student
    student = await db.get(models.User, gp.student_id)
    student_profile_r = await db.execute(
        select(models.UserProfile).where(models.UserProfile.user_id == gp.student_id)
    )
    student_profile = student_profile_r.scalars().first()
    if student_profile and student_profile.phone:
        status_emoji = "✅" if is_approve else "❌"
        status_text = "approved" if is_approve else "rejected"
        await send_text_message(
            student_profile.phone,
            f"{status_emoji} Your gate pass has been *{status_text}* by your parent.\n"
            f"📋 Reason: {gp.reason}"
        )

    status = "approved ✅" if is_approve else "rejected ❌"
    student_name = student.name if student else "Student"
    return f"Gate pass for *{student_name}* has been *{status}*."


# ─── 2. Daily Attendance Digest ───────────────────────────────────────────────


async def send_daily_attendance_digest(db: AsyncSession) -> int:
    """
    End-of-day attendance digest for parents.
    Queries today's attendance and sends a single summary per student.
    Returns count of messages sent.
    """
    today = date.today()
    sent_count = 0

    # Get all parent-student links with parent phone numbers
    stmt = (
        select(
            models.ParentStudentLink.parent_id,
            models.ParentStudentLink.student_id,
            models.ParentStudentLink.college_id,
            models.UserProfile.phone.label("parent_phone"),
            models.User.name.label("student_name"),
        )
        .join(models.UserProfile, models.UserProfile.user_id == models.ParentStudentLink.parent_id)
        .join(models.User, models.User.id == models.ParentStudentLink.student_id)
        .where(
            models.ParentStudentLink.is_deleted == False,
            models.UserProfile.is_deleted == False,
            models.UserProfile.phone != None,
            models.UserProfile.phone != "",
        )
    )
    result = await db.execute(stmt)
    links = result.all()

    for link in links:
        # Count today's attendance for this student
        total_r = await db.scalar(
            select(func.count(models.AttendanceRecord.id)).where(
                models.AttendanceRecord.student_id == link.student_id,
                models.AttendanceRecord.date == today,
                models.AttendanceRecord.is_deleted == False,
            )
        )
        present_r = await db.scalar(
            select(func.count(models.AttendanceRecord.id)).where(
                models.AttendanceRecord.student_id == link.student_id,
                models.AttendanceRecord.date == today,
                models.AttendanceRecord.status.in_(["present", "od"]),
                models.AttendanceRecord.is_deleted == False,
            )
        )

        total = total_r or 0
        present = present_r or 0

        if total == 0:
            continue  # No classes today, skip

        absent = total - present
        if absent == 0:
            continue  # 100% attendance, don't spam

        pct = round(present * 100 / total)
        icon = "⚠️" if pct < 75 else "📊"

        msg = (
            f"{icon} *Daily Attendance — {today.strftime('%d %b %Y')}*\n\n"
            f"👤 *{link.student_name}*\n"
            f"Your ward was absent for *{absent} out of {total}* classes today.\n"
            f"Attendance: {present}/{total} ({pct}%)\n\n"
        )

        if pct < 75:
            msg += "⚠️ _Attendance is below 75%. Please ensure regular attendance._\n"

        msg += "_Type *attendance* for full subject-wise breakdown._"

        await send_text_message(link.parent_phone, msg)
        sent_count += 1

    logger.info("Sent %d attendance digests for %s", sent_count, today)
    return sent_count


# ─── 3. Fee Alerts for Parents ────────────────────────────────────────────────


async def send_overdue_fee_alerts_parents(db: AsyncSession) -> int:
    """
    Alert parents about overdue fees (> 7 days past due).
    Includes payment link CTA.
    """
    cutoff = datetime.utcnow() - timedelta(days=7)
    sent_count = 0

    # Find overdue invoices
    stmt = (
        select(
            models.StudentFeeInvoice,
            models.User.name.label("student_name"),
        )
        .join(models.User, models.User.id == models.StudentFeeInvoice.student_id)
        .where(
            models.StudentFeeInvoice.is_deleted == False,
            models.StudentFeeInvoice.due_date != None,
            models.StudentFeeInvoice.due_date < cutoff,
        )
    )
    result = await db.execute(stmt)
    invoices = result.all()

    for invoice_row, student_name in invoices:
        # Check if already paid
        paid_r = await db.scalar(
            select(func.count(models.FeePayment.id)).where(
                models.FeePayment.invoice_id == invoice_row.id,
                models.FeePayment.status == "success",
            )
        )
        if paid_r and paid_r > 0:
            continue

        # Get parent phone
        link_r = await db.execute(
            select(models.ParentStudentLink, models.UserProfile.phone).join(
                models.UserProfile, models.UserProfile.user_id == models.ParentStudentLink.parent_id
            ).where(
                models.ParentStudentLink.student_id == invoice_row.student_id,
                models.ParentStudentLink.college_id == invoice_row.college_id,
                models.ParentStudentLink.is_deleted == False,
                models.UserProfile.phone != None,
            ).order_by(models.ParentStudentLink.is_primary.desc())
        )
        parent_link = link_r.first()
        if not parent_link:
            continue

        phone = parent_link[1]
        due_str = invoice_row.due_date.strftime("%d %b %Y") if invoice_row.due_date else "N/A"
        amt = f"₹{invoice_row.total_amount:,.0f}"
        pay_url = f"{settings.FEE_PORTAL_BASE_URL}?invoice={invoice_row.id}"

        body = (
            f"🚨 *Overdue Fee Alert*\n\n"
            f"👤 Student: *{student_name}*\n"
            f"💰 *{invoice_row.fee_type}*: {amt}\n"
            f"📅 Due Date: {due_str} (overdue)\n\n"
            f"Please clear this fee to avoid academic holds."
        )

        await send_cta_url_message(
            to_phone=phone, body_text=body,
            button_text="💳 Pay Now", url=pay_url,
            footer_text="AcadMix Fee System",
        )
        sent_count += 1

    logger.info("Sent %d overdue fee alerts to parents", sent_count)
    return sent_count


# ─── 4. Bus Geofence Alerts ──────────────────────────────────────────────────


async def send_bus_geofence_alert(
    db: AsyncSession, college_id: str, route_id: str, stop_name: str, event: str, eta_minutes: int = 0
) -> int:
    """
    Send bus proximity alerts to parents subscribed to this route.
    Triggered by IoT geofence webhook.
    """
    route = await db.get(models.BusRoute, route_id)
    if not route:
        return 0

    sent_count = 0
    route_num = route.route_number

    if event == "enter":
        body = f"🚌 *Bus Update — {route_num}*\n\n"
        if eta_minutes > 0:
            body += f"Route {route_num} is *{eta_minutes} minutes* away from *{stop_name}*."
        else:
            body += f"Route {route_num} has arrived at *{stop_name}*."
    elif event == "campus_enter":
        body = f"✅ *Bus {route_num}* has safely entered the campus."
    elif event == "campus_exit":
        body = f"🚌 *Bus {route_num}* has departed from campus."
    else:
        body = f"🚌 *Bus {route_num}* — {event} at {stop_name}."

    # Find all parents whose ward is subscribed to this route
    # Students subscribe via UserProfile.extra_data.bus_route = route_number
    parent_phones = await _get_route_subscriber_parent_phones(db, college_id, route_num)

    for phone in parent_phones:
        await send_text_message(phone, body)
        sent_count += 1

    logger.info("Sent %d geofence alerts for route %s (%s at %s)", sent_count, route_num, event, stop_name)
    return sent_count


async def _get_route_subscriber_parent_phones(
    db: AsyncSession, college_id: str, route_number: str
) -> List[str]:
    """Get phone numbers of parents whose wards are subscribed to a bus route."""
    # Find students on this route (extra_data->>'bus_route' = route_number)
    student_stmt = (
        select(models.UserProfile.user_id).where(
            models.UserProfile.college_id == college_id,
            models.UserProfile.is_deleted == False,
            models.UserProfile.extra_data["bus_route"].astext == route_number,
        )
    )
    student_r = await db.execute(student_stmt)
    student_ids = [r[0] for r in student_r.all()]

    if not student_ids:
        return []

    # Get parent phones for these students
    parent_stmt = (
        select(models.UserProfile.phone)
        .join(models.ParentStudentLink, models.ParentStudentLink.parent_id == models.UserProfile.user_id)
        .where(
            models.ParentStudentLink.student_id.in_(student_ids),
            models.ParentStudentLink.is_deleted == False,
            models.UserProfile.phone != None,
            models.UserProfile.phone != "",
        )
    )
    result = await db.execute(parent_stmt)
    return [r[0] for r in result.all()]
