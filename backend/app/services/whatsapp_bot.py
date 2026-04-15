"""
WhatsApp Bot Service — Ami Bot (Multi-Audience)
Routes incoming WhatsApp messages to the appropriate service handlers
and formats responses for WhatsApp delivery.

Supports:
- Text commands (parent + student)
- Interactive replies (button clicks, list selections)
- Multi-audience routing (parents, students, staff)

Works in two modes:
- Mock mode (WHATSAPP_MOCK_MODE=True): logs responses to console
- Live mode: sends replies via Meta Cloud API
"""
import logging
import re
import httpx
from typing import Optional, Dict, Any, List
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app import models
from app.core.config import settings
from app.services.parent_service import ParentService

logger = logging.getLogger("acadmix.whatsapp_bot")

# Meta Cloud API endpoint
META_API_URL = "https://graph.facebook.com/v19.0"


# ─── Command Definitions ─────────────────────────────────────────────────────

COMMANDS = {
    "hi": "menu", "hello": "menu", "hey": "menu", "menu": "menu", "start": "menu",
    "namaste": "menu",
    "attendance": "attendance",
    "grades": "grades", "cgpa": "grades", "grade": "grades", "result": "grades", "results": "grades",
    "timetable": "timetable", "today": "timetable", "schedule": "timetable", "classes": "timetable",
    "subjects": "subjects", "subject": "subjects",
    "exams": "exams", "exam": "exams",
    "marks": "marks", "cia": "marks", "internals": "marks",
    "mentor": "mentor", "mentors": "mentor",
    "placements": "placements", "placement": "placements", "offers": "placements",
    "fees": "fees", "fee": "fees", "payment": "fees",
    "report": "report",
    "help": "help",
    # Student-specific commands
    "bus": "bus", "transport": "bus",
    "rewards": "rewards", "points": "rewards",
    # Parent-specific commands
    "gatepass": "gatepass", "gate": "gatepass",
}

MENU_TEXT = """👋 *Namaste! I'm Ami* — your child's college assistant.

Here's what I can help you with:

📊  *attendance* — Attendance report
🎓  *grades* — Semester grades & CGPA
📅  *timetable* — Today's classes
📚  *subjects* — Current subjects & faculty
📋  *exams* — Exam schedule
📝  *marks* — CIA / internal marks
👨‍🏫  *mentor* — Mentor details
💰  *fees* — Fee payment status
🎯  *placements* — Placement updates
📄  *report* — Full progress report link

Just type any keyword! 🚀"""

HELP_TEXT = """📖 *Available Commands*

Type any of these keywords:

*attendance* — Subject-wise attendance with %
*grades* — All semester grades + CGPA
*timetable* — Today's class schedule
*subjects* — Current subjects & faculty names
*exams* — Upcoming exam dates
*marks* — CIA / internal marks summary
*mentor* — Assigned mentor contact
*fees* — Fee payment status
*placements* — Job placement updates
*report* — Full progress report link
*menu* — Show the welcome message

💡 _Commands are case-insensitive. Just type the keyword!_"""

UNRECOGNIZED_TEXT = """🤔 Sorry, I didn't understand that.

Type *help* to see all available commands, or *menu* for the welcome message."""

NOT_REGISTERED_TEXT = """⚠️ *Phone number not registered*

This phone number is not linked to any parent account in AcadMix.

Please contact your college administration to register your phone number."""


# ─── Bot Service ──────────────────────────────────────────────────────────────

class WhatsAppBotService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.parent_svc = ParentService(db)

    async def route_message(self, phone: str, text: str) -> str:
        """Main entry: route an incoming text message to the correct handler."""
        clean = text.strip().lower()

        # Handle "bus <route>" pattern
        if clean.startswith("bus "):
            route_query = clean[4:].strip()
            return await self._handle_bus_command(phone, route_query)

        # Resolve command
        command = COMMANDS.get(clean)

        # Static commands (no auth needed)
        if command == "menu":
            return MENU_TEXT
        if command == "help":
            return HELP_TEXT

        # Lookup user by phone (could be parent, student, or staff)
        user = await self._lookup_user(phone)
        if not user:
            return NOT_REGISTERED_TEXT

        role = user.role

        # Build user data dict
        u_data = {
            "id": user.id,
            "college_id": user.college_id,
            "name": user.name,
            "role": role,
        }

        # ── Student-specific commands ──
        if role == "student":
            if command == "bus":
                return await self._handle_bus_command(phone, None, user_id=user.id)
            if command == "rewards":
                return await self._handle_rewards(user)

        # ── Parent-specific commands ──
        if role == "parent":
            if command == "gatepass":
                return await self._handle_gatepass_list(u_data)

            # Parent content handlers
            try:
                ward = await self.parent_svc.get_ward_info(u_data)
            except Exception:
                ward = None

            parent_handlers = {
                "attendance": self._handle_attendance,
                "grades": self._handle_grades,
                "timetable": self._handle_timetable,
                "subjects": self._handle_subjects,
                "exams": self._handle_exams,
                "marks": self._handle_marks,
                "mentor": self._handle_mentor,
                "placements": self._handle_placements,
                "fees": self._handle_fees,
                "report": self._handle_report,
            }

            handler = parent_handlers.get(command)
            if handler:
                try:
                    return await handler(u_data, ward)
                except Exception as e:
                    logger.error("WhatsApp bot handler error (%s): %s", command, e)
                    return f"❌ Sorry, I couldn't fetch your {command} data right now. Please try again later."

        return UNRECOGNIZED_TEXT

    async def route_interactive(self, phone: str, interactive_data: dict) -> str:
        """
        Handle interactive message replies (button clicks, list selections).
        Called when webhook receives msg.type == 'interactive'.
        """
        from app.services.wa_state_machine import retrieve_and_clear

        itype = interactive_data.get("type", "")

        if itype == "button_reply":
            button_id = interactive_data.get("button_reply", {}).get("id", "")
            return await self._handle_button_reply(phone, button_id)

        elif itype == "list_reply":
            row_id = interactive_data.get("list_reply", {}).get("id", "")
            return await self._handle_list_reply(phone, row_id)

        return "🤔 Unrecognized interactive message."

    async def _handle_button_reply(self, phone: str, button_id: str) -> str:
        """Dispatch button replies to the correct flow handler via state machine."""
        from app.services.wa_state_machine import retrieve_and_clear

        # Button IDs carry the action type prefix: "gp_approve_xxx", "proxy_accept_xxx"
        # But the state is keyed by message_id, not button_id.
        # We need to scan — OR the webhook can pass the context.id.
        # For now, parse the action type from the button_id prefix.

        if button_id.startswith("gp_approve_") or button_id.startswith("gp_reject_"):
            # Gate pass approval — extract gatepass_id from button
            parts = button_id.split("_", 2)
            gatepass_id = parts[2] if len(parts) >= 3 else ""
            from app.services.wa_parent_flows import handle_gatepass_button
            return await handle_gatepass_button(
                self.db, button_id,
                {"gatepass_id": gatepass_id, "parent_phone": phone},
                phone,
            )

        if button_id.startswith("proxy_accept_") or button_id.startswith("proxy_decline_"):
            # Teacher proxy — we need state machine context for this
            # The webhook handler should pass context_id for proper resolution
            return "ℹ️ Proxy response received. Processing..."

        return "🤔 Button action not recognized."

    async def _handle_list_reply(self, phone: str, row_id: str) -> str:
        """Handle list selection replies."""
        # Future: route-specific list selections
        return "✅ Selection received."

    # ─── New Handlers ────────────────────────────────────────────────────

    async def _handle_bus_command(self, phone: str, route_query: str = None, user_id: str = None) -> str:
        """Handle bus tracking command."""
        from app.services.wa_student_flows import send_bus_location_reply

        if not user_id:
            user = await self._lookup_user(phone)
            if not user:
                return NOT_REGISTERED_TEXT
            user_id = user.id

        return await send_bus_location_reply(self.db, user_id, route_query)

    async def _handle_rewards(self, user: models.User) -> str:
        """Show student's reward point balance and recent activity."""
        from sqlalchemy.future import select as sel

        # Get total points
        result = await self.db.execute(
            sel(models.RewardPointLog).where(
                models.RewardPointLog.student_id == user.id
            ).order_by(models.RewardPointLog.created_at.desc()).limit(5)
        )
        logs = result.scalars().all()

        if not logs:
            return "🏆 *Reward Points*\n\n_No reward points yet. Earn points through attendance, quizzes, and events!_"

        balance = logs[0].balance_after if logs else 0
        lines = [f"🏆 *Reward Points — {user.name}*\n"]
        lines.append(f"💰 Current Balance: *{balance} points*\n")
        lines.append("📋 *Recent Activity:*")

        for log in logs:
            icon = "✅" if log.points > 0 else "💳"
            sign = "+" if log.points > 0 else ""
            lines.append(f"{icon} {sign}{log.points} — {log.reason}")

        if balance >= 100:
            lines.append("\n☕ _You can redeem a free coffee! Visit any campus vending machine._")

        return "\n".join(lines)

    async def _handle_gatepass_list(self, u_data: dict) -> str:
        """Show pending gate passes for parent's ward."""
        student_id = await self.parent_svc._get_linked_student(u_data["college_id"], u_data["id"])

        result = await self.db.execute(
            select(models.GatePass).where(
                models.GatePass.student_id == student_id,
                models.GatePass.college_id == u_data["college_id"],
                models.GatePass.approval_status == "pending",
                models.GatePass.is_deleted == False,
            ).order_by(models.GatePass.created_at.desc()).limit(5)
        )
        passes = result.scalars().all()

        if not passes:
            return "🏠 *Gate Passes*\n\n_No pending gate pass requests._"

        lines = ["🏠 *Pending Gate Pass Requests*\n"]
        for gp in passes:
            exit_str = gp.requested_exit.strftime("%d %b, %I:%M %p") if gp.requested_exit else "N/A"
            lines.append(f"📋 *{gp.reason}*")
            lines.append(f"   Exit: {exit_str}")

        lines.append("\n_Approval requests are sent as interactive messages. Check your chat for buttons._")
        return "\n".join(lines)

    # ─── User Lookup ──────────────────────────────────────────────────────

    async def _lookup_user(self, phone: str) -> Optional[models.User]:
        """Find ANY user by phone number (parent, student, or staff)."""
        normalized = re.sub(r'[+\s\-()]', '', phone)

        stmt = (
            select(models.User)
            .join(models.UserProfile, models.UserProfile.user_id == models.User.id)
            .where(
                models.User.is_deleted == False,
                models.UserProfile.is_deleted == False,
            )
        )

        # Try full number
        result = await self.db.execute(
            stmt.where(models.UserProfile.phone == normalized)
        )
        user = result.scalars().first()
        if user:
            return user

        # Try suffix match (last 10 digits)
        if len(normalized) >= 10:
            last10 = normalized[-10:]
            result = await self.db.execute(
                stmt.where(
                    func.right(models.UserProfile.phone, 10) == last10
                )
            )
            user = result.scalars().first()
            if user:
                return user

        return None

    async def _lookup_parent(self, phone: str) -> Optional[models.User]:
        """Find a parent user by phone number (backwards compat)."""
        user = await self._lookup_user(phone)
        if user and user.role == "parent":
            return user
        return None

    # ─── Student Header ───────────────────────────────────────────────────

    def _student_header(self, ward: dict) -> str:
        if not ward:
            return ""
        name = ward.get("name", "Student")
        email = ward.get("email", "")
        dept = ward.get("department", "")
        return f"👤 *{name}*  ({email})\n🏫 {dept}\n"

    # ─── Handlers ─────────────────────────────────────────────────────────

    async def _handle_attendance(self, u_data: dict, ward: dict) -> str:
        # Get overall
        overall = await self.parent_svc.get_ward_attendance(u_data)

        # Get subject-wise (need student_id)
        student_id = ward.get("id") if ward else None
        subjects = []
        if student_id:
            try:
                subjects = await self.parent_svc.get_attendance(u_data, student_id)
            except Exception:
                pass

        header = self._student_header(ward)
        lines = [f"📊 *Attendance Report*\n{header}"]

        if subjects:
            lines.append("```")
            lines.append(f"{'Subject':<12} {'Present':>7}  {'%':>6}")
            lines.append("─" * 30)
            for s in subjects:
                pct = s.get("percentage", 0)
                icon = "✅" if pct >= 75 else "⚠️"
                code = s.get("subject_code", "N/A")[:12]
                present = f"{s.get('present_count', 0)}/{s.get('total_count', 0)}"
                lines.append(f"{code:<12} {present:>7}  {pct:>5.1f}% {icon}")
            lines.append("```")

        pct = overall.get("percentage", 0)
        icon = "✅" if pct >= 75 else "⚠️"
        lines.append(f"\n📌 *Overall:* {overall.get('present', 0)}/{overall.get('total_classes', 0)} ({pct}%) {icon}")

        # Flag low attendance subjects
        low = [s for s in subjects if s.get("percentage", 100) < 75]
        if low:
            names = ", ".join(s.get("subject_code", "") for s in low)
            lines.append(f"\n⚠️ _Low attendance in: {names} — needs attention_")

        lines.append(f"\n_Updated: {datetime.now().strftime('%d %b %Y, %I:%M %p')}_")
        return "\n".join(lines)

    async def _handle_grades(self, u_data: dict, ward: dict) -> str:
        grades = await self.parent_svc.get_ward_grades(u_data)
        header = self._student_header(ward)
        lines = [f"🎓 *Semester Grades*\n{header}"]

        if not grades:
            lines.append("_No grade data available yet._")
            return "\n".join(lines)

        lines.append("```")
        lines.append(f"{'Sem':>3}  {'SGPA':>5}  {'CGPA':>5}  {'Credits':>7}  {'Arrears':>7}")
        lines.append("─" * 38)
        for g in grades:
            sem = getattr(g, 'semester', '-')
            sgpa = getattr(g, 'sgpa', 0) or 0
            cgpa = getattr(g, 'cgpa', 0) or 0
            credits = getattr(g, 'earned_credits', 0) or getattr(g, 'total_credits', 0) or 0
            arrears = getattr(g, 'arrear_count', 0) or 0
            lines.append(f"{sem:>3}  {sgpa:>5.2f}  {cgpa:>5.2f}  {credits:>7}  {arrears:>7}")
        lines.append("```")

        # Show latest CGPA
        last = grades[-1] if grades else None
        if last:
            cgpa = getattr(last, 'cgpa', 0) or 0
            lines.append(f"\n📌 *Current CGPA: {cgpa:.2f}*")

        lines.append(f"\n_Type *help* for all commands._")
        return "\n".join(lines)

    async def _handle_timetable(self, u_data: dict, ward: dict) -> str:
        student_id = ward.get("id") if ward else None
        if not student_id:
            return "❌ Could not identify student."

        tt = await self.parent_svc.get_timetable(u_data, student_id)
        header = self._student_header(ward)

        today = datetime.now().strftime("%A")
        today_classes = [s for s in tt if s.get("day", "").lower() == today.lower()]

        lines = [f"📅 *Timetable — {today}*\n{header}"]

        if not today_classes:
            lines.append(f"🎉 _No classes today ({today})!_")
            return "\n".join(lines)

        today_classes.sort(key=lambda x: x.get("period_no", 0))
        for s in today_classes:
            time_str = ""
            if s.get("start_time") and s.get("end_time"):
                time_str = f"{s['start_time']} - {s['end_time']}"
            subj = s.get("subject_name", s.get("subject_code", "N/A"))
            faculty = s.get("faculty_name", "TBA")
            slot_type = s.get("slot_type", "lecture")
            icon = "🧪" if slot_type == "lab" else "📖"
            lines.append(f"{icon} *P{s.get('period_no', '?')}* | {subj}")
            if time_str:
                lines.append(f"   ⏰ {time_str} | 👨‍🏫 {faculty}")

        lines.append(f"\n_Type *help* for all commands._")
        return "\n".join(lines)

    async def _handle_subjects(self, u_data: dict, ward: dict) -> str:
        student_id = ward.get("id") if ward else None
        if not student_id:
            return "❌ Could not identify student."

        subjects = await self.parent_svc.get_subjects(u_data, student_id)
        header = self._student_header(ward)
        lines = [f"📚 *Current Subjects*\n{header}"]

        if not subjects:
            lines.append("_No subject data available._")
            return "\n".join(lines)

        for i, s in enumerate(subjects, 1):
            lines.append(f"*{i}.* {s.get('subject_name', s.get('subject_code', 'N/A'))}")
            lines.append(f"   Code: {s.get('subject_code', '-')} | Faculty: {s.get('faculty_name', 'TBA')}")

        lines.append(f"\n_Total: {len(subjects)} subjects_")
        return "\n".join(lines)

    async def _handle_exams(self, u_data: dict, ward: dict) -> str:
        student_id = ward.get("id") if ward else None
        if not student_id:
            return "❌ Could not identify student."

        exams = await self.parent_svc.get_exam_schedule(u_data, student_id)
        header = self._student_header(ward)
        lines = [f"📋 *Exam Schedule*\n{header}"]

        if not exams:
            lines.append("_No upcoming exams scheduled._")
            return "\n".join(lines)

        for e in exams:
            date = getattr(e, 'exam_date', None)
            date_str = date.strftime('%d %b %Y') if date else 'TBA'
            time_str = getattr(e, 'start_time', '') or ''
            subj = getattr(e, 'subject_name', '') or getattr(e, 'subject_code', 'N/A')
            exam_type = getattr(e, 'exam_type', 'Exam')
            lines.append(f"📅 *{date_str}* {f'at {time_str}' if time_str else ''}")
            lines.append(f"   {subj} ({exam_type})")

        lines.append(f"\n_Type *help* for all commands._")
        return "\n".join(lines)

    async def _handle_marks(self, u_data: dict, ward: dict) -> str:
        student_id = ward.get("id") if ward else None
        if not student_id:
            return "❌ Could not identify student."

        # Query CIA marks directly (same logic as progress report)
        from sqlalchemy import text as sql_text
        cia_stmt = (
            select(
                models.MarkSubmissionEntry.marks_obtained,
                models.MarkSubmission.subject_code,
            )
            .join(models.MarkSubmission, models.MarkSubmissionEntry.submission_id == models.MarkSubmission.id)
            .where(
                models.MarkSubmissionEntry.student_id == student_id,
                models.MarkSubmission.college_id == u_data["college_id"],
                models.MarkSubmission.status == "approved",
                models.MarkSubmission.is_deleted == False,
            )
        )
        result = await self.db.execute(cia_stmt)
        rows = result.all()

        header = self._student_header(ward)
        lines = [f"📝 *CIA / Internal Marks*\n{header}"]

        if not rows:
            lines.append("_No CIA marks available yet._")
            return "\n".join(lines)

        # Aggregate by subject
        subjects = {}
        for row in rows:
            code = row.subject_code
            if code not in subjects:
                subjects[code] = {"total": 0, "count": 0}
            subjects[code]["total"] += float(row.marks_obtained or 0)
            subjects[code]["count"] += 1

        for code, data in subjects.items():
            lines.append(f"📖 *{code}*")
            lines.append(f"   Total: {data['total']:.1f} marks ({data['count']} components)")

        lines.append(f"\n_Type *help* for all commands._")
        return "\n".join(lines)

    async def _handle_mentor(self, u_data: dict, ward: dict) -> str:
        student_id = ward.get("id") if ward else None
        if not student_id:
            return "❌ Could not identify student."

        data = await self.parent_svc.get_mentor(u_data, student_id)
        header = self._student_header(ward)
        lines = [f"👨‍🏫 *Mentor Details*\n{header}"]

        mentor = data.get("mentor")
        if not mentor:
            lines.append("_No mentor assigned yet._")
        else:
            lines.append(f"*Name:* {mentor.get('name', 'N/A')}")
            lines.append(f"*Email:* {mentor.get('email', 'N/A')}")
            if mentor.get("department"):
                lines.append(f"*Department:* {mentor['department']}")

        return "\n".join(lines)

    async def _handle_placements(self, u_data: dict, ward: dict) -> str:
        placements = await self.parent_svc.get_ward_placements(u_data)
        header = self._student_header(ward)
        lines = [f"🎯 *Placement Updates*\n{header}"]

        if not placements:
            lines.append("_No placement applications yet._")
            return "\n".join(lines)

        for p in placements:
            status_icon = {"selected": "✅", "shortlisted": "🟡", "applied": "📝", "rejected": "❌"}.get(
                p.get("application_status", ""), "📋"
            )
            lines.append(f"{status_icon} {p.get('drive_type', 'Drive')} — {p.get('application_status', 'Unknown')}")
            if p.get("offer_details"):
                lines.append(f"   💼 {p['offer_details']}")

        return "\n".join(lines)

    async def _handle_fees(self, u_data: dict, ward: dict) -> str:
        student_id = ward.get("id") if ward else None
        if not student_id:
            return "❌ Could not identify student."

        # Query fee payments
        try:
            result = await self.db.execute(
                select(models.FeePayment).where(
                    models.FeePayment.student_id == student_id,
                    models.FeePayment.college_id == u_data["college_id"],
                ).order_by(models.FeePayment.due_date.desc())
            )
            fees = result.scalars().all()
        except Exception:
            return "💰 _Fee data is not available at this time._"

        header = self._student_header(ward)
        lines = [f"💰 *Fee Status*\n{header}"]

        if not fees:
            lines.append("_No fee records found._")
            return "\n".join(lines)

        for f in fees:
            status = getattr(f, 'status', 'unknown')
            icon = "✅" if status == "paid" else "⏳" if status == "pending" else "❌"
            amount = getattr(f, 'amount', 0)
            desc = getattr(f, 'description', '') or getattr(f, 'fee_type', 'Fee')
            due = getattr(f, 'due_date', None)
            due_str = due.strftime('%d %b %Y') if due else ''
            lines.append(f"{icon} *{desc}*")
            lines.append(f"   Amount: ₹{amount:,.0f} | Status: {status} | Due: {due_str}")

        return "\n".join(lines)

    async def _handle_report(self, u_data: dict, ward: dict) -> str:
        student_id = ward.get("id") if ward else None
        if not student_id:
            return "❌ Could not identify student."

        header = self._student_header(ward)
        # Generate a link to the progress report
        # In production, this would be a public URL with a signed token
        lines = [
            f"📄 *Progress Report*\n{header}",
            "Your child's full progress report (attendance + grades + CIA) is available in the AcadMix Parent Portal.",
            "",
            "💡 _Log in to the Parent Dashboard to view and download the detailed report._",
        ]
        return "\n".join(lines)


# ─── Meta Cloud API Sender ────────────────────────────────────────────────────

async def send_whatsapp_message(to_phone: str, body: str) -> bool:
    """Send a text message via Meta WhatsApp Cloud API."""
    if settings.WHATSAPP_MOCK_MODE or not settings.WHATSAPP_ACCESS_TOKEN:
        logger.info(
            "📱 [MOCK WhatsApp] To: %s\n%s",
            to_phone[-4:].rjust(len(to_phone), '*'),  # mask phone
            body
        )
        return True

    url = f"{META_API_URL}/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": to_phone,
        "type": "text",
        "text": {"body": body},
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                logger.info("WhatsApp message sent to %s", to_phone[-4:].rjust(10, '*'))
                return True
            else:
                logger.error("WhatsApp API error %d: %s", resp.status_code, resp.text[:200])
                return False
    except Exception as e:
        logger.error("WhatsApp send failed: %s", e)
        return False
