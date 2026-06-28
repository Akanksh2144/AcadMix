from datetime import datetime, timezone, date as date_type
from app.core.exceptions import ResourceNotFoundError, InputValidationError, AuthorizationError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, func, text, delete, or_, and_, extract
from typing import List, Optional, Dict, Any

from app import models
from app.core.audit import log_audit

class AttendanceService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_today_faculty_status(self, user: dict, current_academic_year: str) -> List[Dict[str, Any]]:
        today = datetime.now(timezone.utc)
        days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
        current_day = days[today.weekday()]
        current_date = today.date()

        slots_r = await self.session.execute(
            select(models.PeriodSlot).where(
                models.PeriodSlot.faculty_id == user["id"],
                models.PeriodSlot.day == current_day,
                models.PeriodSlot.academic_year == current_academic_year
            ).order_by(models.PeriodSlot.period_no)
        )
        slots = slots_r.scalars().all()

        if not slots:
            return []

        slot_ids = [s.id for s in slots]
        
        att_r = await self.session.execute(
            select(models.AttendanceRecord.period_slot_id, func.count(models.AttendanceRecord.id))
            .where(
                models.AttendanceRecord.period_slot_id.in_(slot_ids),
                models.AttendanceRecord.date == current_date
            )
            .group_by(models.AttendanceRecord.period_slot_id)
        )
        marked_counts = {row.period_slot_id: row.count for row in att_r.all()}

        return [{
            "slot": {
                "id": s.id, "period_no": s.period_no, "start_time": s.start_time, "end_time": s.end_time,
                "batch": s.batch, "section": s.section, "subject_code": s.subject_code, "subject_name": s.subject_name
            },
            "is_marked": s.id in marked_counts,
            "recorded_count": marked_counts.get(s.id, 0)
        } for s in slots]

    async def mark_batch(self, req, user: dict) -> Dict[str, Any]:
        try:
            mark_date = datetime.strptime(req.date, "%Y-%m-%d").date()
        except ValueError:
            raise InputValidationError("Invalid date format")

        slot_r = await self.session.execute(
            select(models.PeriodSlot).where(
                models.PeriodSlot.id == req.period_slot_id,
                models.PeriodSlot.college_id == user["college_id"]
            )
        )
        slot = slot_r.scalars().first()
        if not slot:
            raise ResourceNotFoundError("PeriodSlot", req.period_slot_id)

        if slot.faculty_id != user["id"]:
            raise AuthorizationError("You are not assigned to this period slot")

        now = datetime.now()
        try:
            period_end_time = datetime.strptime(slot.end_time, "%H:%M").time()
            period_end_dt = datetime.combine(mark_date, period_end_time)
            delta_hours = (now - period_end_dt).total_seconds() / 3600
            is_late_entry = delta_hours > 3
        except ValueError:
            is_late_entry = False

        await self.session.execute(
            update(models.AttendanceRecord).where(
                models.AttendanceRecord.period_slot_id == slot.id,
                models.AttendanceRecord.date == mark_date
            ).values(is_deleted=True, deleted_at=func.now())
        )

        records = [
            models.AttendanceRecord(
                college_id=user["college_id"],
                period_slot_id=slot.id,
                date=mark_date,
                faculty_id=user["id"],
                student_id=entry.student_id,
                subject_code=slot.subject_code,
                status=entry.status,
                is_late_entry=is_late_entry,
                remarks=entry.remarks
            )
            for entry in req.entries
        ]
        self.session.add_all(records)
        await log_audit(self.session, user["id"], "attendance", "mark_batch", 
                        {"slot_id": slot.id, "date": req.date, "is_late": is_late_entry, "count": len(records)})

        # ── Record topic coverage if topics were selected ──────────────────
        topics_covered = 0
        if hasattr(req, 'covered_topic_ids') and req.covered_topic_ids:
            from app.services.syllabus_service import SyllabusService
            syl_svc = SyllabusService(self.session)
            topics_covered = await syl_svc.record_coverage(
                topic_ids=req.covered_topic_ids,
                faculty_id=user["id"],
                period_slot_id=slot.id,
                date_str=req.date,
                college_id=user["college_id"],
            )

        await self.session.commit()
        
        return {"message": f"Successfully marked attendance for {len(records)} students", "is_late_entry": is_late_entry, "topics_covered": topics_covered}

    async def get_student_consolidated(self, student_id: str) -> List[Dict[str, Any]]:
        stmt = text("""
            SELECT 
                ar.subject_code,
                COALESCE(c.name, ar.subject_code) AS subject_name,
                COUNT(*) FILTER (WHERE ar.status = 'present' OR ar.status = 'od') AS present_count,
                COUNT(*) AS total_count,
                MAX(ar.date) AS latest_date
            FROM attendance_records ar
            LEFT JOIN courses c ON ar.subject_code = c.subject_code AND c.college_id = ar.college_id
            WHERE ar.student_id = :student_id AND ar.is_deleted = false
            GROUP BY ar.subject_code, c.name
            ORDER BY ar.subject_code
        """)
        result = await self.session.execute(stmt, {"student_id": student_id})
        
        response = []
        for row in result.all():
            pct = round(row.present_count * 100.0 / row.total_count, 1) if row.total_count > 0 else 0
            
            latest_date_str = None
            if row.latest_date:
                try:
                    latest_date_str = str(row.latest_date)
                except Exception:
                    pass

            response.append({
                "subject_code": row.subject_code,
                "subject_name": row.subject_name,
                "present_count": row.present_count,
                "total_count": row.total_count,
                "percentage": pct,
                "latest_date": latest_date_str
            })
        return response

    async def get_student_detail(self, student_id: str, subject_code: Optional[str] = None, month: Optional[int] = None, year: Optional[int] = None) -> List[Dict[str, Any]]:
        params = {"student_id": student_id}
        where_clauses = ["ar.student_id = :student_id", "ar.is_deleted = false"]
        
        if subject_code:
            where_clauses.append("ar.subject_code = :subject_code")
            params["subject_code"] = subject_code
        if month and year:
            where_clauses.append("EXTRACT(MONTH FROM ar.date) = :month")
            where_clauses.append("EXTRACT(YEAR FROM ar.date) = :year")
            params["month"] = month
            params["year"] = year

        where_sql = " AND ".join(where_clauses)
        stmt = text(f"""
            SELECT 
                ar.date, ar.subject_code, ar.status, ar.remarks,
                ps.period_no, ps.start_time, ps.end_time, ps.subject_name
            FROM attendance_records ar
            JOIN period_slots ps ON ar.period_slot_id = ps.id
            WHERE {where_sql}
            ORDER BY ar.date DESC, ps.period_no ASC
        """)
        result = await self.session.execute(stmt, params)

        return [{
            "date": str(r.date),
            "subject_code": r.subject_code,
            "subject_name": r.subject_name,
            "period_no": r.period_no,
            "start_time": r.start_time,
            "end_time": r.end_time,
            "status": r.status,
            "remarks": r.remarks
        } for r in result.all()]

    async def get_defaulters(self, college_id: str, department_id: str, threshold: float = 75.0) -> List[Dict[str, Any]]:
        stmt = text("""
            SELECT 
                student_id,
                u.name as student_name,
                u.profile_data->>'batch' as batch,
                subject_code,
                ROUND((COUNT(*) FILTER (WHERE status = 'present' OR status = 'od') * 100.0 / COUNT(*))::numeric, 1) as percentage
            FROM attendance_records ar
            JOIN users u ON ar.student_id = u.id
            WHERE ar.college_id = :college_id 
              AND ar.is_deleted = false 
              AND u.profile_data->>'department_id' = :department_id
            GROUP BY student_id, u.name, u.profile_data->>'batch', subject_code
            HAVING COUNT(*) > 0 AND (COUNT(*) FILTER (WHERE status = 'present' OR status = 'od') * 100.0 / COUNT(*)) < :threshold
            ORDER BY batch, student_name, subject_code
        """)
        
        result = await self.session.execute(stmt, {
            "college_id": college_id, 
            "department_id": department_id,
            "threshold": threshold
        })
        
        return [{
            "student_id": r.student_id,
            "name": r.student_name,
            "batch": r.batch,
            "subject_code": r.subject_code,
            "percentage": float(r.percentage) if r.percentage is not None else 0.0
        } for r in result.all()]

    async def override_attendance(self, subject_code: str, student_id: str, req, user: dict) -> Dict[str, str]:
        from sqlalchemy import cast, Date
        stmt = select(models.AttendanceRecord).where(
            models.AttendanceRecord.student_id == student_id,
            models.AttendanceRecord.subject_code == subject_code,
            models.AttendanceRecord.date == cast(req.date, Date),
            models.AttendanceRecord.period_slot_id == req.period_slot_id,
            models.AttendanceRecord.is_deleted == False
        )
        result = await self.session.execute(stmt)
        record = result.scalars().first()
        
        if not record:
            raise ResourceNotFoundError("AttendanceRecord", f"{student_id}/{subject_code}/{req.date}")
            
        record.status = req.status
        record.is_override = True
        record.source = "override"
        record.remarks = req.reason or record.remarks
        await self.session.commit()
        return {"message": "Override applied successfully."}

    async def get_student_calendar(self, student_id: str, month: Optional[int] = None, year: Optional[int] = None) -> Dict[str, Any]:
        from sqlalchemy import extract
        stmt = select(models.AttendanceRecord).where(
            models.AttendanceRecord.student_id == student_id,
            models.AttendanceRecord.is_deleted == False
        )
        if month and year:
            stmt = stmt.where(extract("month", models.AttendanceRecord.date) == month)
            stmt = stmt.where(extract("year", models.AttendanceRecord.date) == year)
            
        result = await self.session.execute(stmt)
        
        calendar = {}
        for r in result.scalars().all():
            d = str(r.date)
            if d not in calendar:
                calendar[d] = {"present": 0, "absent": 0, "od": 0, "details": []}
            
            status = r.status.lower() if r.status else ""
            if status in calendar[d]:
                calendar[d][status] += 1
                
            calendar[d]["details"].append({
                "subject_code": r.subject_code,
                "period_no": r.period_no,
                "status": status,
                "is_late": r.is_late_entry
            })
        return calendar

    async def _resolve_user_id(self, college_id: str, identifier: str) -> Optional[str]:
        # 1. Try directly matching user_id
        u_stmt = select(models.User.id).where(
            models.User.college_id == college_id,
            models.User.id == identifier,
            models.User.is_deleted == False
        )
        res = await self.session.execute(u_stmt)
        uid = res.scalar()
        if uid:
            return uid

        # 2. Try matching staff employee code
        staff_stmt = select(models.StaffProfile.user_id).where(
            models.StaffProfile.college_id == college_id,
            models.StaffProfile.employee_code == identifier,
            models.StaffProfile.is_deleted == False
        )
        res = await self.session.execute(staff_stmt)
        uid = res.scalar()
        if uid:
            return uid

        # 3. Try matching user profile extra_data rfid_uid or phone or rollNo
        profile_stmt = select(models.UserProfile.user_id).where(
            models.UserProfile.college_id == college_id,
            or_(
                models.UserProfile.phone == identifier,
                models.UserProfile.extra_data["rfid_uid"].astext == identifier,
                models.UserProfile.extra_data["rollNo"].astext == identifier
            ),
            models.UserProfile.is_deleted == False
        )
        res = await self.session.execute(profile_stmt)
        uid = res.scalar()
        return uid

    async def record_daily_punch(self, college_id: str, payload) -> Dict[str, Any]:
        user_id = await self._resolve_user_id(college_id, payload.identifier)
        if not user_id:
            raise ResourceNotFoundError("User", payload.identifier)

        try:
            punch_dt = datetime.fromisoformat(payload.timestamp.replace("Z", "+00:00"))
        except ValueError:
            try:
                punch_dt = datetime.strptime(payload.timestamp, "%Y-%m-%d %H:%M:%S")
            except ValueError:
                raise InputValidationError("Invalid timestamp format. Use ISO-8601 or YYYY-MM-DD HH:MM:SS")

        punch_date = punch_dt.date()

        # Check if record exists for this user on this date
        stmt = select(models.DailyAttendanceRecord).where(
            models.DailyAttendanceRecord.college_id == college_id,
            models.DailyAttendanceRecord.user_id == user_id,
            models.DailyAttendanceRecord.date == punch_date,
            models.DailyAttendanceRecord.is_deleted == False
        )
        res = await self.session.execute(stmt)
        record = res.scalars().first()

        new_log = {"time": punch_dt.isoformat(), "device": payload.device_id, "source": payload.source}

        if not record:
            # First punch of the day is Check-in
            record = models.DailyAttendanceRecord(
                college_id=college_id,
                user_id=user_id,
                date=punch_date,
                check_in=punch_dt,
                status="present",
                source=payload.source,
                remarks=payload.remarks,
                raw_logs=[new_log]
            )
            self.session.add(record)
            msg = "Checked in successfully"
        else:
            # Subsequent punches update check_out
            record.check_out = punch_dt
            logs = list(record.raw_logs or [])
            logs.append(new_log)
            record.raw_logs = logs
            record.source = payload.source
            record.remarks = payload.remarks or record.remarks
            msg = "Checked out successfully"

        await log_audit(self.session, user_id, "daily_attendance", "record_punch", 
                        {"date": str(punch_date), "time": punch_dt.isoformat(), "source": payload.source})

        await self.session.commit()
        return {
            "message": msg,
            "user_id": user_id,
            "check_in": record.check_in.isoformat() if record.check_in else None,
            "check_out": record.check_out.isoformat() if record.check_out else None
        }

    async def get_daily_staff_summary(self, college_id: str, department: Optional[str], date_val: date_type) -> List[Dict[str, Any]]:
        from app.services.hr_payroll_service import STAFF_ROLES

        # Let's filter users who have a staff profile or belong to STAFF_ROLES
        q = select(models.User, models.StaffProfile).join(
            models.StaffProfile, 
            and_(models.StaffProfile.user_id == models.User.id, models.StaffProfile.college_id == college_id),
            isouter=True
        ).where(
            models.User.college_id == college_id,
            models.User.role.in_(STAFF_ROLES),
            models.User.is_deleted == False
        )

        res = await self.session.execute(q)
        rows = res.all()

        staff_list = []
        for user, profile in rows:
            dept = (profile.department if profile else None) or (user.profile_data.get("department") if user.profile_data else None) or "Unknown"
            if department and dept.lower() != department.lower():
                continue

            att_stmt = select(models.DailyAttendanceRecord).where(
                models.DailyAttendanceRecord.college_id == college_id,
                models.DailyAttendanceRecord.user_id == user.id,
                models.DailyAttendanceRecord.date == date_val,
                models.DailyAttendanceRecord.is_deleted == False
            )
            att_res = await self.session.execute(att_stmt)
            att = att_res.scalars().first()

            staff_list.append({
                "user_id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "employee_code": profile.employee_code if profile else "",
                "department": dept,
                "designation": profile.designation if profile else "",
                "check_in": att.check_in.isoformat() if (att and att.check_in) else None,
                "check_out": att.check_out.isoformat() if (att and att.check_out) else None,
                "status": att.status if att else "absent",
                "source": att.source if att else None,
                "remarks": att.remarks if att else None,
                "raw_logs": att.raw_logs if att else []
            })
        return staff_list

    async def get_my_daily_logs(self, user_id: str, month: int, year: int) -> List[Dict[str, Any]]:
        stmt = select(models.DailyAttendanceRecord).where(
            models.DailyAttendanceRecord.user_id == user_id,
            extract("month", models.DailyAttendanceRecord.date) == month,
            extract("year", models.DailyAttendanceRecord.date) == year,
            models.DailyAttendanceRecord.is_deleted == False
        ).order_by(models.DailyAttendanceRecord.date.asc())

        res = await self.session.execute(stmt)
        records = res.scalars().all()

        return [{
            "id": r.id,
            "date": str(r.date),
            "check_in": r.check_in.isoformat() if r.check_in else None,
            "check_out": r.check_out.isoformat() if r.check_out else None,
            "status": r.status,
            "source": r.source,
            "remarks": r.remarks,
            "raw_logs": r.raw_logs
        } for r in records]

    async def trigger_defaulter_alerts(self, college_id: str, department_id: str, threshold: float, sender_id: str) -> Dict[str, Any]:
        defaulters = await self.get_defaulters(college_id, department_id, threshold)
        if not defaulters:
            return {"message": "No defaulters found below the threshold.", "count": 0}

        sent_count = 0
        from app.services.omnichannel_workers import dispatch_whatsapp_message

        for d in defaulters:
            student_id = d["student_id"]
            subject_code = d["subject_code"]
            pct = d["percentage"]

            # Fetch course name
            course_stmt = select(models.Course.name).where(
                models.Course.college_id == college_id,
                models.Course.subject_code == subject_code,
                models.Course.is_deleted == False
            )
            c_res = await self.session.execute(course_stmt)
            subject_name = c_res.scalar() or subject_code

            # Fetch parent_id via ParentStudentLink
            link_stmt = select(models.ParentStudentLink.parent_id).where(
                models.ParentStudentLink.student_id == student_id,
                models.ParentStudentLink.college_id == college_id,
                models.ParentStudentLink.is_deleted == False
            ).order_by(models.ParentStudentLink.is_primary.desc())
            link_res = await self.session.execute(link_stmt)
            parent_id = link_res.scalar()

            if not parent_id:
                continue

            parent_profile_stmt = select(models.UserProfile.phone).where(
                models.UserProfile.user_id == parent_id,
                models.UserProfile.is_deleted == False
            )
            profile_res = await self.session.execute(parent_profile_stmt)
            phone = profile_res.scalar()

            if not phone:
                continue

            # Get counts
            counts_stmt = text("""
                SELECT 
                    COUNT(*) FILTER (WHERE status = 'present' OR status = 'od') AS present_count,
                    COUNT(*) AS total_count
                FROM attendance_records
                WHERE student_id = :student_id AND subject_code = :subject_code AND is_deleted = false
            """)
            counts_res = await self.session.execute(counts_stmt, {"student_id": student_id, "subject_code": subject_code})
            row = counts_res.first()
            present = row.present_count if row else 0
            total = row.total_count if row else 0

            factor = threshold / 100.0
            if factor >= 1.0:
                needed = total - present
            else:
                numerator = (factor * total) - present
                denominator = 1.0 - factor
                needed = max(0, int(sum([numerator / denominator, 0.9999])))

            body = (
                f"🚨 *Low Attendance Alert*\n\n"
                f"Dear Parent,\n"
                f"Your ward *{d['name']}*'s attendance in *{subject_name}* ({subject_code}) is currently *{pct}%*.\n"
                f"This is below the required minimum of *{threshold}%*.\n\n"
                f"📊 Classes: {present} present out of {total} total.\n"
                f"📅 Ward needs to attend the next *{needed}* consecutive classes of this subject to restore eligibility.\n\n"
                f"Please ensure regular attendance."
            )

            await dispatch_whatsapp_message(phone, body)
            sent_count += 1

        await log_audit(self.session, sender_id, "attendance_alerts", "send_warnings", 
                        {"department_id": department_id, "threshold": threshold, "count": sent_count})
        
        await self.session.commit()
        return {"message": f"Successfully sent warning alerts to {sent_count} parents.", "count": sent_count}

