from datetime import datetime, timezone
from fastapi import UploadFile
from app.core.exceptions import ResourceNotFoundError, InputValidationError, AuthorizationError, PayloadTooLargeError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List, Optional, Dict, Any
import csv
import io

from app import models
from app.models.core import UserProfile
from app.core.audit import log_audit


class MarksService:
    """Rewritten to use ONLY the normalized MarkSubmission + MarkSubmissionEntry schema.
    All references to phantom 'extra_data' and 'course_id' columns have been replaced
    with the real columns: status, assignment_id, component_id, subject_code,
    reviewed_by, reviewed_at, review_remarks."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_students_for_assignment(self, department: str, batch: str, section: str, college_id: str) -> List[Dict[str, Any]]:
        result = await self.session.execute(
            select(models.User).outerjoin(UserProfile, models.User.id == UserProfile.user_id).where(
                models.User.college_id == college_id,
                models.User.role == "student",
                UserProfile.department == department,
                UserProfile.batch == batch,
                UserProfile.section == section,
            )
        )
        students = result.scalars().all()
        return [{"id": s.id, "name": s.name, "email": s.email, **(s.profile_data or {})} for s in students]

    async def get_entry(self, assignment_id: str, exam_type: str, component_id: Optional[str], user: dict) -> Optional[Dict[str, Any]]:
        """Fetch a mark submission by assignment_id + exam_type, optionally filtered by component_id."""
        stmt = select(models.MarkSubmission).where(
            models.MarkSubmission.assignment_id == assignment_id,
            models.MarkSubmission.exam_type == exam_type,
            models.MarkSubmission.faculty_id == user["id"],
        )
        if component_id:
            stmt = stmt.where(models.MarkSubmission.component_id == component_id)

        result = await self.session.execute(stmt)
        entry = result.scalars().first()

        if not entry:
            return None

        # Fetch individual student entries from MarkSubmissionEntry
        entries_r = await self.session.execute(
            select(models.MarkSubmissionEntry).where(
                models.MarkSubmissionEntry.submission_id == entry.id
            )
        )
        student_entries = [
            {"student_id": e.student_id, "marks_obtained": e.marks_obtained, "status": e.status}
            for e in entries_r.scalars().all()
        ]

        return {
            "id": entry.id,
            "subject_code": entry.subject_code,
            "exam_type": entry.exam_type,
            "max_marks": entry.max_marks,
            "status": entry.status or "draft",
            "entries": student_entries,
        }

    async def save_entry(self, req, user: dict) -> Dict[str, Any]:
        """Save or update a mark submission. Single-write to normalized schema only."""
        entries_data = [e.dict() for e in req.entries]

        # Verify the faculty assignment exists and belongs to this user/college
        assign_r = await self.session.execute(
            select(models.FacultyAssignment).where(
                models.FacultyAssignment.id == req.assignment_id,
                models.FacultyAssignment.college_id == user["college_id"],
                models.FacultyAssignment.teacher_id == user["id"],
            )
        )
        assignment = assign_r.scalars().first()
        if not assignment:
            raise ResourceNotFoundError("FacultyAssignment", req.assignment_id)

        # Find existing submission for this assignment + exam_type + component
        existing_r = await self.session.execute(
            select(models.MarkSubmission).where(
                models.MarkSubmission.assignment_id == req.assignment_id,
                models.MarkSubmission.exam_type == req.exam_type,
                models.MarkSubmission.component_id == req.component_id,
            )
        )
        submission = existing_r.scalars().first()

        if submission:
            # Check status guards
            if submission.status == "approved":
                if not req.revision_reason or not req.revision_reason.strip():
                    raise InputValidationError("Revision reason is required to edit approved marks")
            if submission.status == "submitted":
                raise InputValidationError("Cannot edit submitted marks. Wait for approval or rejection.")

            submission.max_marks = req.max_marks
            submission.status = "draft"
        else:
            submission = models.MarkSubmission(
                college_id=user["college_id"],
                faculty_id=user["id"],
                assignment_id=req.assignment_id,
                subject_code=assignment.subject_code,
                exam_type=req.exam_type,
                component_id=req.component_id,
                max_marks=req.max_marks,
                semester=assignment.semester,
                status="draft",
            )
            self.session.add(submission)
            await self.session.flush()

        # Upsert MarkSubmissionEntries
        existing_entries_r = await self.session.execute(
            select(models.MarkSubmissionEntry).where(
                models.MarkSubmissionEntry.submission_id == submission.id
            )
        )
        existing_entries = {e.student_id: e for e in existing_entries_r.scalars().all()}

        for e in entries_data:
            student_id = e.get("student_id")
            if not student_id:
                continue
            status = e.get("status", "present")
            marks_obtained = float(e.get("marks_obtained", 0))
            if student_id in existing_entries:
                existing_entries[student_id].marks_obtained = marks_obtained
                existing_entries[student_id].status = status
            else:
                mse = models.MarkSubmissionEntry(
                    submission_id=submission.id,
                    student_id=student_id,
                    marks_obtained=marks_obtained,
                    status=status,
                )
                self.session.add(mse)

        from app.services.audit_service import AuditService
        
        await self.session.commit()
        return {"id": submission.id, "status": "draft", "entries": entries_data}

    async def submit_entry(self, entry_id: str, user: dict) -> Dict[str, str]:
        """Faculty submits marks for HOD review."""
        entry_r = await self.session.execute(
            select(models.MarkSubmission).where(
                models.MarkSubmission.id == entry_id,
                models.MarkSubmission.college_id == user["college_id"],
            )
        )
        entry = entry_r.scalars().first()
        if not entry:
            raise ResourceNotFoundError("MarkSubmission", entry_id)
        if entry.faculty_id != user["id"]:
            raise AuthorizationError("Unauthorized mark entry")

        if entry.status == "approved":
            raise InputValidationError("Already approved")

        entry.status = "submitted"
        entry.submitted_at = datetime.now(timezone.utc)

        from app.services.audit_service import AuditService
        await AuditService.log_audit(
            db=self.session, college_id=user["college_id"], user_id=user["id"],
            action="GRADE_UPDATE", resource_type="marks", resource_id=entry_id,
            new_value={"status": "submitted"}, status="success"
        )
        await self.session.commit()
        return {"message": "Marks submitted for review"}

    async def review_entry(self, entry_id: str, req, user: dict) -> Dict[str, str]:
        """HOD reviews (approves/rejects) submitted marks."""
        entry_r = await self.session.execute(
            select(models.MarkSubmission).where(
                models.MarkSubmission.id == entry_id,
                models.MarkSubmission.college_id == user["college_id"],
            )
        )
        entry = entry_r.scalars().first()
        if not entry:
            raise ResourceNotFoundError("MarkSubmission", entry_id)

        if entry.status != "submitted":
            raise InputValidationError("Marks not submitted for review")

        entry.status = req.action
        entry.reviewed_by = user["id"]
        entry.reviewed_at = datetime.now(timezone.utc)
        entry.review_remarks = req.remarks

        from app.services.audit_service import AuditService
        await AuditService.log_audit(
            db=self.session, college_id=user["college_id"], user_id=user["id"],
            action="GRADE_UPDATE" if req.action != "approved" else "RESULT_PUBLISHED",
            resource_type="marks", resource_id=entry_id,
            new_value={"status": req.action, "remarks": req.remarks}, status="success"
        )
        await self.session.commit()
        return {"message": f"Marks {req.action}"}

    async def get_approved_marks(self, college_id: str) -> List[Dict[str, Any]]:
        """Exam cell: list all approved mark submissions for this college."""
        result = await self.session.execute(
            select(models.MarkSubmission).where(
                models.MarkSubmission.college_id == college_id,
                models.MarkSubmission.status == "approved",
            ).order_by(models.MarkSubmission.reviewed_at.desc())
        )
        approved = result.scalars().all()

        # Batch-fetch faculty assignments and faculty users
        assign_ids = list(set(e.assignment_id for e in approved if e.assignment_id))
        assign_map = {}
        if assign_ids:
            assign_r = await self.session.execute(
                select(models.FacultyAssignment).where(models.FacultyAssignment.id.in_(assign_ids))
            )
            assign_map = {a.id: a for a in assign_r.scalars().all()}

        fac_ids = list(set(e.faculty_id for e in approved))
        fac_map = {}
        if fac_ids:
            fac_r = await self.session.execute(
                select(models.User).where(models.User.id.in_(fac_ids))
            )
            fac_map = {u.id: u for u in fac_r.scalars().all()}

        return [{
            "id": e.id,
            "subject_code": e.subject_code,
            "exam_type": e.exam_type,
            "component_id": e.component_id,
            "faculty_name": fac_map[e.faculty_id].name if e.faculty_id in fac_map else "Unknown",
            "batch": assign_map[e.assignment_id].batch if e.assignment_id in assign_map else "",
            "section": assign_map[e.assignment_id].section if e.assignment_id in assign_map else "",
            "semester": assign_map[e.assignment_id].semester if e.assignment_id in assign_map else "",
            "max_marks": e.max_marks,
            "reviewed_at": e.reviewed_at.isoformat() if e.reviewed_at else None,
        } for e in approved]

    async def upload_marks(self, file: UploadFile, semester: int, subject_code: str, exam_type: str, user: dict, max_marks: float) -> Dict[str, Any]:
        """CSV upload path for marks. Writes directly to normalized schema."""
        MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB threshold
        if file.size and file.size > MAX_FILE_SIZE:
            raise PayloadTooLargeError("File too large. Maximum allowed size is 5MB for CSV marks ingress.")

        content = await file.read(MAX_FILE_SIZE + 1)
        if len(content) > MAX_FILE_SIZE:
            raise PayloadTooLargeError("File too large. Maximum allowed size is 5MB for CSV marks ingress.")

        try:
            decoded = content.decode("utf-8")
        except UnicodeDecodeError:
            raise InputValidationError("Invalid file encoding")

        reader = csv.DictReader(io.StringIO(decoded))
        if not set(["roll_number", "marks_obtained", "status"]).issubset(set(reader.fieldnames or [])):
            raise InputValidationError("Missing required columns: roll_number, marks_obtained, status")

        parsed_entries = []
        for row in reader:
            try:
                marks = float(row["marks_obtained"]) if row["marks_obtained"] else 0.0
                parsed_entries.append({
                    "roll_number": row["roll_number"].strip(),
                    "marks_obtained": marks,
                    "status": row.get("status", "present").lower(),
                })
            except Exception as e:
                raise InputValidationError(f"Invalid data in row for student {row.get('roll_number')}: {str(e)}")

        if not parsed_entries:
            raise InputValidationError("No valid data found in CSV")

        # Find matching faculty assignment
        assignment_r = await self.session.execute(
            select(models.FacultyAssignment).where(
                models.FacultyAssignment.teacher_id == user["id"],
                models.FacultyAssignment.subject_code == subject_code,
                models.FacultyAssignment.college_id == user["college_id"],
            )
        )
        assignment = assignment_r.scalars().first()
        if not assignment:
            raise ResourceNotFoundError("FacultyAssignment", f"{subject_code} for current user")

        # Find or create MarkSubmission
        sub_r = await self.session.execute(
            select(models.MarkSubmission).where(
                models.MarkSubmission.assignment_id == assignment.id,
                models.MarkSubmission.exam_type == exam_type,
                models.MarkSubmission.college_id == user["college_id"],
            )
        )
        submission = sub_r.scalars().first()

        if submission:
            if submission.status in ["approved", "submitted"]:
                raise InputValidationError(f"Cannot overwrite marks in {submission.status} status")
            submission.max_marks = max_marks
            submission.status = "draft"
        else:
            submission = models.MarkSubmission(
                college_id=user["college_id"],
                faculty_id=user["id"],
                assignment_id=assignment.id,
                subject_code=subject_code,
                exam_type=exam_type,
                max_marks=max_marks,
                semester=assignment.semester,
                status="draft",
            )
            self.session.add(submission)
            await self.session.flush()

        # Resolve roll numbers to student IDs
        roll_nos = [p["roll_number"] for p in parsed_entries if p.get("roll_number")]
        users_r = await self.session.execute(
            select(models.User.id, UserProfile.roll_number)
            .join(UserProfile, models.User.id == UserProfile.user_id)
            .where(
                models.User.college_id == user["college_id"],
                UserProfile.roll_number.in_(roll_nos),
            )
        )
        users_map = {row.roll_number: row.id for row in users_r.all()}

        # Load existing entries for upsert
        ex_mse_r = await self.session.execute(
            select(models.MarkSubmissionEntry).where(
                models.MarkSubmissionEntry.submission_id == submission.id
            )
        )
        ex_mse = {e.student_id: e for e in ex_mse_r.scalars().all()}

        for p in parsed_entries:
            stud_id = users_map.get(p["roll_number"])
            if not stud_id:
                continue
            if stud_id in ex_mse:
                ex_mse[stud_id].marks_obtained = p["marks_obtained"]
                ex_mse[stud_id].status = p["status"]
            else:
                self.session.add(models.MarkSubmissionEntry(
                    submission_id=submission.id,
                    student_id=stud_id,
                    marks_obtained=p["marks_obtained"],
                    status=p["status"],
                ))

        await self.session.commit()
        return {"message": f"Uploaded {len(parsed_entries)} entries successfully."}

    async def get_student_cia(self, student_id: str, college_id: str, semester: Optional[int] = None, academic_year: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetch approved CIA marks for a student via normalized MarkSubmissionEntry."""
        stmt = select(
            models.MarkSubmissionEntry, models.MarkSubmission
        ).join(
            models.MarkSubmission, models.MarkSubmissionEntry.submission_id == models.MarkSubmission.id
        ).where(
            models.MarkSubmissionEntry.student_id == student_id,
            models.MarkSubmission.college_id == college_id,
            models.MarkSubmission.status == "approved",
            models.MarkSubmission.is_deleted == False,
        )
        if semester:
            stmt = stmt.where(models.MarkSubmission.semester == semester)

        result = await self.session.execute(stmt)
        rows = result.all()

        return [{
            "subject_code": sub.subject_code,
            "exam_type": sub.exam_type,
            "component_id": sub.component_id,
            "marks_obtained": mse.marks_obtained,
            "max_marks": sub.max_marks,
            "status": mse.status,
            "date_recorded": str(sub.published_at or sub.reviewed_at or sub.created_at),
        } for mse, sub in rows]

    async def get_status_report(self, user: dict, department: Optional[str] = None, academic_year: Optional[str] = None) -> List[Dict[str, Any]]:
        """HOD/Admin: CIA submission status report, optionally filtered by department."""
        stmt = select(models.MarkSubmission, models.User).join(
            models.User, models.MarkSubmission.faculty_id == models.User.id
        ).where(
            models.MarkSubmission.college_id == user["college_id"],
        )
        if department:
            # Must JOIN UserProfile to filter by department
            stmt = stmt.outerjoin(UserProfile, models.User.id == UserProfile.user_id).where(
                UserProfile.department == department
            )

        result = await self.session.execute(stmt.order_by(models.MarkSubmission.created_at.desc()))
        entries = result.all()

        return [{
            "id": e.id,
            "subject_code": e.subject_code,
            "exam_type": e.exam_type,
            "faculty_name": u.name,
            "status": e.status or "draft",
            "max_marks": e.max_marks,
            "created_at": str(e.created_at),
        } for e, u in entries]
