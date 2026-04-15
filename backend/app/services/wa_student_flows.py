"""
Student WhatsApp Flows — Transactional workflows for students.

Flows:
  1. Vending/Mess Transaction Receipts (IoT-triggered)
  2. Ami Weekly Performance Digest (Arq cron)
  3. Reward Point Nudges (event-triggered)
  4. Transportation Alerts (bus tracking, route changes, departure)
  5. Fee Alerts with Payment Links (due reminders, confirmation, overdue)
  6. College-Wide Alerts (holiday, half-day, emergency)
"""

import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, date, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app import models
from app.core.config import settings
from app.services.wa_interactive import (
    send_text_message, send_cta_url_message, send_button_message,
)

logger = logging.getLogger("acadmix.wa_student_flows")


# ─── Helper: Get student phone ───────────────────────────────────────────────


async def _get_student_phone(db: AsyncSession, student_id: str) -> Optional[str]:
    """Get phone number for a student."""
    profile_r = await db.execute(
        select(models.UserProfile.phone).where(
            models.UserProfile.user_id == student_id,
            models.UserProfile.is_deleted == False,
        )
    )
    row = profile_r.first()
    return row[0] if row and row[0] else None


# ─── 1. Vending/Mess Transaction Receipts ────────────────────────────────────


async def send_vending_receipt(
    db: AsyncSession,
    student_id: str,
    item_name: str,
    amount: float,
    balance_after: float,
    transaction_type: str = "purchase",
) -> None:
    """
    Send a WhatsApp receipt after a vending/mess tap.
    Fired by IoT webhook.
    """
    phone = await _get_student_phone(db, student_id)
    if not phone:
        return

    type_labels = {
        "purchase": "Vending Purchase",
        "mess_breakfast": "Mess Breakfast",
        "mess_lunch": "Mess Lunch",
        "mess_dinner": "Mess Dinner",
        "mess_snack": "Mess Snack",
    }
    label = type_labels.get(transaction_type, "Campus Transaction")
    item_str = f" — {item_name}" if item_name else ""

    msg = (
        f"💳 *{label}{item_str}*\n\n"
        f"₹{amount:.0f} deducted\n"
        f"💰 Current Wallet Balance: *₹{balance_after:.0f}*\n\n"
        f"_{datetime.now().strftime('%d %b %Y, %I:%M %p')}_"
    )

    # Low balance warning
    if balance_after < settings.WALLET_LOW_BALANCE_THRESHOLD:
        msg += f"\n\n⚠️ _Low balance! Top up to avoid interruptions._"
        await send_cta_url_message(
            to_phone=phone, body_text=msg,
            button_text="💳 Top Up",
            url=f"{settings.FEE_PORTAL_BASE_URL}?action=topup",
            footer_text="AcadMix Wallet",
        )
    else:
        await send_text_message(phone, msg)


# ─── 2. Ami Weekly Performance Digest ────────────────────────────────────────


async def send_weekly_ami_digest(db: AsyncSession) -> int:
    """
    Sunday 7 PM — Weekly interview prep performance summary for students.
    Aggregates MockInterview sessions from the past week.
    """
    sent_count = 0
    week_ago = datetime.utcnow() - timedelta(days=7)

    # Get students who had mock interviews this week
    stmt = (
        select(
            models.MockInterview.student_id,
            func.count(models.MockInterview.id).label("session_count"),
            func.avg(models.MockInterview.overall_score).label("avg_score"),
        )
        .where(
            models.MockInterview.created_at >= week_ago,
            models.MockInterview.status == "completed",
        )
        .group_by(models.MockInterview.student_id)
    )
    result = await db.execute(stmt)
    students = result.all()

    for row in students:
        phone = await _get_student_phone(db, row.student_id)
        if not phone:
            continue

        student_r = await db.execute(
            select(models.User.name).where(models.User.id == row.student_id)
        )
        student_name = student_r.scalar() or "Student"

        avg = row.avg_score or 0
        performance = "🔥 Outstanding" if avg >= 8 else "💪 Good" if avg >= 6 else "📈 Needs Work"

        msg = (
            f"📊 *Ami Weekly War Room Report*\n\n"
            f"Hey *{student_name}* 👋\n\n"
            f"This week:\n"
            f"🎯 Sessions completed: *{row.session_count}*\n"
            f"📈 Average score: *{avg:.1f}/10* — {performance}\n\n"
        )

        if avg < 6:
            msg += "💡 _Focus on your weak areas. Check your dashboard for the full breakdown and re-attempt drills._\n"
        else:
            msg += "🚀 _Great progress! Keep the momentum going. New challenges await on your dashboard._\n"

        msg += "\n_Type *help* for all commands._"
        await send_text_message(phone, msg)
        sent_count += 1

    logger.info("Sent %d weekly Ami digests", sent_count)
    return sent_count


# ─── 3. Reward Point Nudges ──────────────────────────────────────────────────


async def send_reward_point_nudge(
    db: AsyncSession,
    student_id: str,
    points_earned: int,
    reason: str,
    new_balance: int,
) -> None:
    """Send a gamification nudge when student earns or redeems points."""
    phone = await _get_student_phone(db, student_id)
    if not phone:
        return

    if points_earned > 0:
        msg = (
            f"🎉 *+{points_earned} Reward Points!*\n\n"
            f"Reason: {reason}\n"
            f"🏆 Total balance: *{new_balance} points*\n\n"
        )
        # Add a teaser about redemption
        if new_balance >= 100:
            msg += "☕ _You have enough for a free coffee at the vending machine! Type *rewards* to redeem._"
        elif new_balance >= 50:
            msg += f"☕ _You're {100 - new_balance} points away from a free coffee!_"
    else:
        msg = (
            f"💳 *{abs(points_earned)} points redeemed*\n\n"
            f"Item: {reason}\n"
            f"🏆 Remaining balance: *{new_balance} points*"
        )

    await send_text_message(phone, msg)


# ─── 4. Transportation Alerts ────────────────────────────────────────────────


async def send_bus_location_reply(
    db: AsyncSession, student_id: str, route_query: Optional[str] = None
) -> str:
    """
    Reply to a student's 'bus' or 'bus 4' command.
    Returns formatted text with latest bus location.
    """
    # Determine which route the student is on
    profile_r = await db.execute(
        select(models.UserProfile).where(
            models.UserProfile.user_id == student_id,
            models.UserProfile.is_deleted == False,
        )
    )
    profile = profile_r.scalars().first()
    college_id = profile.college_id if profile else None

    if not college_id:
        return "❌ Could not determine your college."

    route_number = route_query
    if not route_number and profile and profile.extra_data:
        route_number = (profile.extra_data or {}).get("bus_route")

    if not route_number:
        # List available routes
        routes_r = await db.execute(
            select(models.BusRoute).where(
                models.BusRoute.college_id == college_id,
                models.BusRoute.is_active == True,
                models.BusRoute.is_deleted == False,
            )
        )
        routes = routes_r.scalars().all()
        if not routes:
            return "🚌 _No bus routes configured for your campus._"

        lines = ["🚌 *Available Bus Routes*\n"]
        for r in routes:
            lines.append(f"• *{r.route_number}* — {r.route_name or 'No name'}")
        lines.append("\n💡 _Type *bus <route number>* to track a specific bus._")
        return "\n".join(lines)

    # Get route
    route_r = await db.execute(
        select(models.BusRoute).where(
            models.BusRoute.college_id == college_id,
            models.BusRoute.route_number == route_number,
            models.BusRoute.is_deleted == False,
        )
    )
    route = route_r.scalars().first()
    if not route:
        return f"❌ Route *{route_number}* not found. Type *bus* to see available routes."

    # Get latest location
    loc_r = await db.execute(
        select(models.BusLocation).where(
            models.BusLocation.route_id == route.id,
        ).order_by(models.BusLocation.recorded_at.desc()).limit(1)
    )
    loc = loc_r.scalars().first()

    if not loc:
        return (
            f"🚌 *{route.route_number}* — {route.route_name or ''}\n\n"
            f"📡 _No live location data available. Bus may not be running._\n"
            f"🕐 Departure: {route.departure_time or 'N/A'} | Return: {route.return_time or 'N/A'}"
        )

    age_seconds = (datetime.utcnow() - loc.recorded_at).total_seconds() if loc.recorded_at else 9999
    freshness = "🟢 Live" if age_seconds < 120 else "🟡 Last known" if age_seconds < 600 else "🔴 Stale"

    # Check if there's a geofence event
    location_hint = ""
    if loc.geofence_event:
        parts = loc.geofence_event.split(":")
        if len(parts) == 2:
            event, place = parts
            if event == "enter":
                location_hint = f"📍 Near *{place}*"
            elif event == "exit":
                location_hint = f"📍 Left *{place}*"

    speed_str = f"{loc.speed_kmh:.0f} km/h" if loc.speed_kmh else "—"

    msg = (
        f"🚌 *{route.route_number}* — {route.route_name or ''}\n\n"
        f"{freshness} ({loc.recorded_at.strftime('%I:%M %p') if loc.recorded_at else '—'})\n"
    )
    if location_hint:
        msg += f"{location_hint}\n"
    msg += (
        f"🏎️ Speed: {speed_str}\n"
        f"🗺️ GPS: {loc.latitude:.4f}, {loc.longitude:.4f}\n\n"
        f"🕐 Schedule — Depart: {route.departure_time or 'N/A'} | Return: {route.return_time or 'N/A'}"
    )

    return msg


async def send_bus_route_change_alert(
    db: AsyncSession, college_id: str, route_number: str, change_message: str
) -> int:
    """Alert students subscribed to a route about route changes."""
    sent_count = 0

    # Find students on this route
    student_stmt = (
        select(models.UserProfile).where(
            models.UserProfile.college_id == college_id,
            models.UserProfile.is_deleted == False,
            models.UserProfile.extra_data["bus_route"].astext == route_number,
            models.UserProfile.phone != None,
        )
    )
    result = await db.execute(student_stmt)
    profiles = result.scalars().all()

    for profile in profiles:
        if not profile.phone:
            continue
        msg = f"⚠️ *Bus Route Update — {route_number}*\n\n{change_message}"
        await send_text_message(profile.phone, msg)
        sent_count += 1

    logger.info("Sent %d route change alerts for %s", sent_count, route_number)
    return sent_count


async def send_bus_departure_alerts(db: AsyncSession) -> int:
    """
    Arq cron — Send departure reminders 15 min before buses leave campus.
    """
    sent_count = 0

    routes_r = await db.execute(
        select(models.BusRoute).where(
            models.BusRoute.is_active == True,
            models.BusRoute.is_deleted == False,
            models.BusRoute.return_time != None,
        )
    )
    routes = routes_r.scalars().all()

    for route in routes:
        # Find subscribed students
        student_stmt = (
            select(models.UserProfile).where(
                models.UserProfile.college_id == route.college_id,
                models.UserProfile.is_deleted == False,
                models.UserProfile.extra_data["bus_route"].astext == route.route_number,
                models.UserProfile.phone != None,
            )
        )
        result = await db.execute(student_stmt)
        profiles = result.scalars().all()

        if not profiles:
            continue

        msg = (
            f"🚌 *Departure Reminder*\n\n"
            f"*{route.route_number}* ({route.route_name or ''}) departs from campus in *15 minutes* "
            f"at *{route.return_time}*.\n\n"
            f"Don't miss your bus! 🏃"
        )

        for profile in profiles:
            if profile.phone:
                await send_text_message(profile.phone, msg)
                sent_count += 1

    logger.info("Sent %d bus departure alerts", sent_count)
    return sent_count


# ─── 5. Fee Alerts with Payment Links ────────────────────────────────────────


async def send_fee_due_reminders(db: AsyncSession) -> int:
    """
    Arq cron — Scan for invoices due within 3 days and push reminders with pay links.
    """
    now = datetime.utcnow()
    due_window = now + timedelta(days=3)
    sent_count = 0

    stmt = (
        select(models.StudentFeeInvoice)
        .where(
            models.StudentFeeInvoice.is_deleted == False,
            models.StudentFeeInvoice.due_date != None,
            models.StudentFeeInvoice.due_date <= due_window,
            models.StudentFeeInvoice.due_date >= now,
        )
    )
    result = await db.execute(stmt)
    invoices = result.scalars().all()

    for inv in invoices:
        # Check if already paid
        paid_r = await db.scalar(
            select(func.count(models.FeePayment.id)).where(
                models.FeePayment.invoice_id == inv.id,
                models.FeePayment.status == "success",
            )
        )
        if paid_r and paid_r > 0:
            continue

        phone = await _get_student_phone(db, inv.student_id)
        if not phone:
            continue

        due_str = inv.due_date.strftime("%d %b %Y") if inv.due_date else "Soon"
        amt = f"₹{inv.total_amount:,.0f}"
        pay_url = f"{settings.FEE_PORTAL_BASE_URL}?invoice={inv.id}"

        body = (
            f"⏳ *Fee Reminder*\n\n"
            f"💰 *{inv.fee_type}*: {amt}\n"
            f"📅 Due: *{due_str}*\n\n"
            f"Pay now to avoid late fees and academic holds."
        )

        await send_cta_url_message(
            to_phone=phone, body_text=body,
            button_text="💳 Pay Now", url=pay_url,
            footer_text="AcadMix Fee System",
        )
        sent_count += 1

    logger.info("Sent %d fee due reminders", sent_count)
    return sent_count


async def send_fee_payment_receipt(
    db: AsyncSession,
    student_id: str,
    invoice_id: str,
    amount_paid: float,
    transaction_ref: str,
    receipt_url: Optional[str] = None,
) -> None:
    """Send payment confirmation receipt with receipt link."""
    phone = await _get_student_phone(db, student_id)
    if not phone:
        return

    # Get invoice details
    inv = await db.get(models.StudentFeeInvoice, invoice_id)
    fee_type = inv.fee_type if inv else "Fee"

    body = (
        f"✅ *Payment Confirmed*\n\n"
        f"💰 *{fee_type}*: ₹{amount_paid:,.0f}\n"
        f"🔖 Txn Ref: {transaction_ref}\n"
        f"📅 {datetime.now().strftime('%d %b %Y, %I:%M %p')}\n\n"
        f"Thank you for your payment!"
    )

    if receipt_url:
        await send_cta_url_message(
            to_phone=phone, body_text=body,
            button_text="📄 View Receipt", url=receipt_url,
            footer_text="AcadMix Fee System",
        )
    else:
        portal_url = f"{settings.FEE_PORTAL_BASE_URL}?receipt={transaction_ref}"
        await send_cta_url_message(
            to_phone=phone, body_text=body,
            button_text="📄 View Receipt", url=portal_url,
            footer_text="AcadMix Fee System",
        )


async def send_overdue_fee_alert_student(db: AsyncSession) -> int:
    """
    Arq cron — Alert students about overdue fees (> 7 days past due) with pay link.
    """
    cutoff = datetime.utcnow() - timedelta(days=7)
    sent_count = 0

    stmt = (
        select(models.StudentFeeInvoice)
        .where(
            models.StudentFeeInvoice.is_deleted == False,
            models.StudentFeeInvoice.due_date != None,
            models.StudentFeeInvoice.due_date < cutoff,
        )
    )
    result = await db.execute(stmt)
    invoices = result.scalars().all()

    for inv in invoices:
        paid_r = await db.scalar(
            select(func.count(models.FeePayment.id)).where(
                models.FeePayment.invoice_id == inv.id,
                models.FeePayment.status == "success",
            )
        )
        if paid_r and paid_r > 0:
            continue

        phone = await _get_student_phone(db, inv.student_id)
        if not phone:
            continue

        due_str = inv.due_date.strftime("%d %b %Y") if inv.due_date else "N/A"
        amt = f"₹{inv.total_amount:,.0f}"
        pay_url = f"{settings.FEE_PORTAL_BASE_URL}?invoice={inv.id}"

        body = (
            f"🚨 *Overdue Fee*\n\n"
            f"💰 *{inv.fee_type}*: {amt}\n"
            f"📅 Was due: {due_str}\n\n"
            f"⚠️ Your fee is overdue. Pay immediately to avoid registration holds."
        )

        await send_cta_url_message(
            to_phone=phone, body_text=body,
            button_text="💳 Pay Now", url=pay_url,
            footer_text="AcadMix Fee System",
        )
        sent_count += 1

    logger.info("Sent %d overdue fee alerts to students", sent_count)
    return sent_count


# ─── 6. College-Wide Alerts ──────────────────────────────────────────────────


async def broadcast_college_alert(
    db: AsyncSession,
    college_id: str,
    announcement_id: str,
) -> int:
    """
    Broadcast a high-priority announcement via WhatsApp.
    Triggered when admin creates an urgent/critical announcement.
    """
    ann = await db.get(models.Announcement, announcement_id)
    if not ann:
        return 0

    details = ann.details or {}
    category = details.get("category", "")
    visibility = details.get("visibility", "all")
    priority = ann.priority

    # Build the message based on category
    if category == "holiday":
        emoji = "🎉"
        prefix = "Holiday Declaration"
    elif category == "half_day":
        emoji = "📢"
        prefix = "Half-Day Notice"
    elif priority == "critical" or category == "emergency":
        emoji = "🚨"
        prefix = "Emergency Alert"
    else:
        emoji = "📣"
        prefix = "Important Notice"

    msg = f"{emoji} *{prefix}*\n\n{ann.title}\n\n{ann.message}"

    # Determine target audience
    target_roles = []
    if visibility == "all" or priority == "critical":
        target_roles = ["student", "teacher", "parent"]
    elif visibility == "students":
        target_roles = ["student"]
    elif visibility == "faculty":
        target_roles = ["teacher"]

    # Get all phones for target audience
    stmt = (
        select(models.UserProfile.phone)
        .join(models.User, models.User.id == models.UserProfile.user_id)
        .where(
            models.User.college_id == college_id,
            models.User.role.in_(target_roles),
            models.User.is_deleted == False,
            models.UserProfile.is_deleted == False,
            models.UserProfile.phone != None,
            models.UserProfile.phone != "",
        )
    )
    result = await db.execute(stmt)
    phones = [r[0] for r in result.all()]

    sent_count = 0
    for phone in phones:
        await send_text_message(phone, msg)
        sent_count += 1

    logger.info(
        "Broadcast college alert '%s' to %d recipients (visibility=%s, priority=%s)",
        ann.title, sent_count, visibility, priority,
    )
    return sent_count
