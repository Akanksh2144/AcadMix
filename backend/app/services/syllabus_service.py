from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, text, delete
from typing import List, Optional, Dict, Any

from app import models
from app.core.audit import log_audit


class SyllabusService:
    def __init__(self, session: AsyncSession):
        self.session = session

    # ── Get syllabus for a course ────────────────────────────────────────────
    async def get_syllabus(self, course_id: str, college_id: str, faculty_id: Optional[str] = None) -> Dict[str, Any]:
        """Get full syllabus (units + topics) for a course, with coverage status."""
        # Get the course
        course_r = await self.session.execute(
            select(models.Course).where(
                models.Course.id == course_id,
                models.Course.college_id == college_id,
                models.Course.is_deleted == False
            )
        )
        course = course_r.scalars().first()
        if not course:
            return {"units": [], "course_id": course_id}

        # Get units
        units_r = await self.session.execute(
            select(models.SyllabusUnit).where(
                models.SyllabusUnit.course_id == course_id,
                models.SyllabusUnit.college_id == college_id,
                models.SyllabusUnit.is_deleted == False
            ).order_by(models.SyllabusUnit.unit_no)
        )
        units = units_r.scalars().all()
        if not units:
            return {"units": [], "course_id": course_id, "subject_code": course.subject_code, "subject_name": course.name}

        unit_ids = [u.id for u in units]

        # Get all topics for these units
        topics_r = await self.session.execute(
            select(models.SyllabusTopic).where(
                models.SyllabusTopic.unit_id.in_(unit_ids),
                models.SyllabusTopic.is_deleted == False
            ).order_by(models.SyllabusTopic.topic_no)
        )
        topics = topics_r.scalars().all()

        # Get coverage data (optionally filtered by faculty)
        topic_ids = [t.id for t in topics]
        coverage_query = select(
            models.TopicCoverage.topic_id,
            func.min(models.TopicCoverage.date).label("first_covered")
        ).where(
            models.TopicCoverage.topic_id.in_(topic_ids),
            models.TopicCoverage.is_deleted == False
        ).group_by(models.TopicCoverage.topic_id)

        if faculty_id:
            coverage_query = coverage_query.where(models.TopicCoverage.faculty_id == faculty_id)

        coverage_r = await self.session.execute(coverage_query)
        covered_map = {row.topic_id: str(row.first_covered) for row in coverage_r.all()}

        # Build response
        topics_by_unit = {}
        for t in topics:
            topics_by_unit.setdefault(t.unit_id, []).append(t)

        result_units = []
        total_topics = 0
        total_covered = 0
        for u in units:
            unit_topics = topics_by_unit.get(u.id, [])
            covered_count = sum(1 for t in unit_topics if t.id in covered_map)
            total_topics += len(unit_topics)
            total_covered += covered_count

            result_units.append({
                "id": u.id,
                "unit_no": u.unit_no,
                "title": u.title,
                "total_hours": u.total_hours,
                "coverage_pct": round(100.0 * covered_count / len(unit_topics), 1) if unit_topics else 0.0,
                "topics": [{
                    "id": t.id,
                    "topic_no": t.topic_no,
                    "title": t.title,
                    "hours": t.hours,
                    "co_id": t.co_id,
                    "is_covered": t.id in covered_map,
                    "covered_on": covered_map.get(t.id),
                } for t in unit_topics]
            })

        return {
            "course_id": course_id,
            "subject_code": course.subject_code,
            "subject_name": course.name,
            "total_topics": total_topics,
            "covered_topics": total_covered,
            "coverage_pct": round(100.0 * total_covered / total_topics, 1) if total_topics else 0.0,
            "units": result_units,
        }

    # ── Create/update syllabus (bulk upsert) ─────────────────────────────────
    async def upsert_syllabus(self, course_id: str, college_id: str, user_id: str, data) -> Dict[str, Any]:
        """Create or replace full syllabus for a course."""
        # Soft-delete existing units + topics for this course
        existing_units_r = await self.session.execute(
            select(models.SyllabusUnit).where(
                models.SyllabusUnit.course_id == course_id,
                models.SyllabusUnit.college_id == college_id,
                models.SyllabusUnit.is_deleted == False
            )
        )
        existing_units = existing_units_r.scalars().all()
        for eu in existing_units:
            eu.is_deleted = True
            eu.deleted_at = func.now()
        # Soft-delete topics under those units
        if existing_units:
            existing_unit_ids = [eu.id for eu in existing_units]
            existing_topics_r = await self.session.execute(
                select(models.SyllabusTopic).where(
                    models.SyllabusTopic.unit_id.in_(existing_unit_ids),
                    models.SyllabusTopic.is_deleted == False
                )
            )
            for et in existing_topics_r.scalars().all():
                et.is_deleted = True
                et.deleted_at = func.now()

        # Create new units and topics
        created_units = 0
        created_topics = 0
        for unit_data in data.units:
            unit = models.SyllabusUnit(
                college_id=college_id,
                course_id=course_id,
                unit_no=unit_data.unit_no,
                title=unit_data.title,
                total_hours=unit_data.total_hours,
                created_by=user_id,
            )
            self.session.add(unit)
            await self.session.flush()  # get unit.id
            created_units += 1

            for topic_data in unit_data.topics:
                topic = models.SyllabusTopic(
                    college_id=college_id,
                    unit_id=unit.id,
                    topic_no=topic_data.topic_no,
                    title=topic_data.title,
                    hours=topic_data.hours,
                    co_id=topic_data.co_id,
                )
                self.session.add(topic)
                created_topics += 1

        await log_audit(self.session, user_id, "syllabus", "upsert",
                        {"course_id": course_id, "units": created_units, "topics": created_topics})
        await self.session.commit()
        return {"message": f"Syllabus saved: {created_units} units, {created_topics} topics"}

    # ── Get syllabus topics for a subject code (used by AttendanceMarker) ────
    async def get_topics_by_subject_code(self, subject_code: str, college_id: str) -> List[Dict[str, Any]]:
        """Get all syllabus topics grouped by unit for a subject_code.
        Used in the attendance marker to populate the topic selector dropdown.
        """
        stmt = text("""
            SELECT su.id as unit_id, su.unit_no, su.title as unit_title,
                   st.id as topic_id, st.topic_no, st.title as topic_title, st.hours
            FROM syllabus_units su
            JOIN courses c ON su.course_id = c.id AND su.college_id = c.college_id
            JOIN syllabus_topics st ON st.unit_id = su.id AND st.is_deleted = false
            WHERE c.subject_code = :subject_code
              AND c.college_id = :college_id
              AND su.is_deleted = false
              AND c.is_deleted = false
            ORDER BY su.unit_no, st.topic_no
        """)
        result = await self.session.execute(stmt, {"subject_code": subject_code, "college_id": college_id})

        units_map = {}
        for row in result.all():
            uid = row.unit_id
            if uid not in units_map:
                units_map[uid] = {
                    "unit_id": uid,
                    "unit_no": row.unit_no,
                    "unit_title": row.unit_title,
                    "topics": []
                }
            units_map[uid]["topics"].append({
                "id": row.topic_id,
                "topic_no": row.topic_no,
                "title": row.topic_title,
                "hours": row.hours,
            })
        return list(units_map.values())

    # ── Record topic coverage (called from attendance service) ───────────────
    async def record_coverage(self, topic_ids: List[str], faculty_id: str, period_slot_id: str,
                               date_str: str, college_id: str) -> int:
        """Record that topics were covered during a period. Called from mark_batch."""
        from datetime import datetime
        mark_date = datetime.strptime(date_str, "%Y-%m-%d").date()

        count = 0
        for tid in topic_ids:
            # Check if already covered (idempotent)
            existing_r = await self.session.execute(
                select(models.TopicCoverage).where(
                    models.TopicCoverage.topic_id == tid,
                    models.TopicCoverage.faculty_id == faculty_id,
                    models.TopicCoverage.date == mark_date,
                    models.TopicCoverage.is_deleted == False
                )
            )
            if existing_r.scalars().first():
                continue

            coverage = models.TopicCoverage(
                college_id=college_id,
                topic_id=tid,
                faculty_id=faculty_id,
                period_slot_id=period_slot_id,
                date=mark_date,
            )
            self.session.add(coverage)
            count += 1
        return count

    # ── HOD: Department-wide coverage summary ────────────────────────────────
    async def get_department_coverage(self, college_id: str, department_id: str) -> List[Dict[str, Any]]:
        """Get coverage % for all courses in a department."""
        stmt = text("""
            SELECT c.id as course_id, c.subject_code, c.name as subject_name, c.semester,
                   COUNT(DISTINCT st.id) as total_topics,
                   COUNT(DISTINCT tc.topic_id) as covered_topics,
                   COALESCE(fa.teacher_name, '') as faculty_name
            FROM courses c
            JOIN syllabus_units su ON su.course_id = c.id AND su.is_deleted = false
            JOIN syllabus_topics st ON st.unit_id = su.id AND st.is_deleted = false
            LEFT JOIN topic_coverage tc ON tc.topic_id = st.id AND tc.is_deleted = false
            LEFT JOIN (
                SELECT fa.subject_code, fa.college_id, u.name as teacher_name
                FROM faculty_assignments fa
                JOIN users u ON fa.teacher_id = u.id
                WHERE fa.is_deleted = false
            ) fa ON fa.subject_code = c.subject_code AND fa.college_id = c.college_id
            WHERE c.college_id = :college_id
              AND c.department_id = :department_id
              AND c.is_deleted = false
              AND su.college_id = :college_id
            GROUP BY c.id, c.subject_code, c.name, c.semester, fa.teacher_name
            ORDER BY c.semester, c.subject_code
        """)
        result = await self.session.execute(stmt, {"college_id": college_id, "department_id": department_id})

        return [{
            "course_id": r.course_id,
            "subject_code": r.subject_code,
            "subject_name": r.subject_name,
            "semester": r.semester,
            "total_topics": r.total_topics,
            "covered_topics": r.covered_topics,
            "coverage_pct": round(100.0 * r.covered_topics / r.total_topics, 1) if r.total_topics > 0 else 0.0,
            "faculty_name": r.faculty_name,
        } for r in result.all()]

    # ── Principal: Institution-wide coverage summary ─────────────────────────
    async def get_institution_coverage(self, college_id: str) -> List[Dict[str, Any]]:
        """Get coverage % aggregated by department."""
        stmt = text("""
            SELECT d.id as department_id, d.name as department_name,
                   COUNT(DISTINCT st.id) as total_topics,
                   COUNT(DISTINCT tc.topic_id) as covered_topics
            FROM departments d
            JOIN courses c ON c.department_id = d.id AND c.is_deleted = false
            JOIN syllabus_units su ON su.course_id = c.id AND su.is_deleted = false
            JOIN syllabus_topics st ON st.unit_id = su.id AND st.is_deleted = false
            LEFT JOIN topic_coverage tc ON tc.topic_id = st.id AND tc.is_deleted = false
            WHERE d.college_id = :college_id AND d.is_deleted = false
            GROUP BY d.id, d.name
            ORDER BY d.name
        """)
        result = await self.session.execute(stmt, {"college_id": college_id})

        return [{
            "department_id": r.department_id,
            "department_name": r.department_name,
            "total_topics": r.total_topics,
            "covered_topics": r.covered_topics,
            "coverage_pct": round(100.0 * r.covered_topics / r.total_topics, 1) if r.total_topics > 0 else 0.0,
        } for r in result.all()]
