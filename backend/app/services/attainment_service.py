"""
Attainment Service — NBA-compliant CO/PO/PSO attainment calculation engine.

All weights are read from College.settings JSONB at runtime.
Default fallbacks:
  - direct/indirect split: 80/20
  - internal/external marks split: 30/70 (configurable per college)
  - CO pass threshold: 60%

Immutability: once a record's locked_at is set, no further writes are allowed.
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func as sa_func

from app.models.accreditation import (
    COAttainmentRecord,
    POAttainmentRecord,
    PSOAttainmentRecord,
    COPSOMapping,
    CourseExitSurvey,
)
from app.models.outcomes import ProgramOutcome, CourseOutcome, COPOMapping
from app.models.evaluation import MarkSubmission, MarkSubmissionEntry
from app.models.core import College
from app.core.exceptions import BusinessLogicError


class AttainmentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ── Weight Helpers ───────────────────────────────────────────────────────

    @staticmethod
    def _get_attainment_weights(college_settings: dict) -> Dict[str, float]:
        """
        Reads attainment split weights from College.settings JSONB.
        Supports two configurable weight pairs:
          1. direct_weight / indirect_weight (for CO attainment composition)
          2. internal / external (for marks-based attainment within direct)
        """
        defaults = {
            "direct_weight": 0.80,
            "indirect_weight": 0.20,
            "internal": 0.30,
            "external": 0.70,
            "co_pass_threshold": 60.0,
        }
        overrides = college_settings.get("attainment_weights", {})
        return {**defaults, **overrides}

    # ── CO Attainment ────────────────────────────────────────────────────────

    async def calculate_co_attainment(
        self,
        course_id: str,
        academic_year: str,
        college_id: str,
    ) -> List[COAttainmentRecord]:
        """
        1. Fetch all MarkSubmissions for course_id + academic_year where co_ids is not null.
        2. For each MarkSubmissionEntry, read co_wise_marks JSONB.
        3. For each CO: direct_attainment = (students scoring >= threshold / total) * 100.
        4. Fetch CourseExitSurvey records for same course + year.
        5. indirect_attainment = avg(co_ratings[co_id]) / 5 * 100 across all students.
        6. final_attainment = direct_weight * direct + indirect_weight * indirect.
        7. Upsert COAttainmentRecord (UniqueConstraint prevents duplicates).
        """
        # Load college settings for weight config
        college = await self.db.get(College, college_id)
        settings = college.settings if college else {}
        weights = self._get_attainment_weights(settings)
        threshold = weights["co_pass_threshold"]

        # Fetch all COs for this course
        cos_result = await self.db.scalars(
            select(CourseOutcome).where(CourseOutcome.course_id == course_id)
        )
        cos = cos_result.all()
        if not cos:
            return []

        # Fetch mark submissions with CO mappings
        subs_result = await self.db.scalars(
            select(MarkSubmission).where(
                MarkSubmission.college_id == college_id,
                MarkSubmission.subject_code.isnot(None),
                MarkSubmission.co_ids.isnot(None),
            )
        )
        submissions = subs_result.all()
        sub_ids = [s.id for s in submissions]

        # Fetch all entries with co_wise_marks
        entries = []
        if sub_ids:
            entries_result = await self.db.scalars(
                select(MarkSubmissionEntry).where(
                    MarkSubmissionEntry.submission_id.in_(sub_ids),
                    MarkSubmissionEntry.co_wise_marks.isnot(None),
                )
            )
            entries = entries_result.all()

        # Calculate direct attainment per CO
        co_direct: Dict[str, float] = {}
        for co in cos:
            total_students = 0
            passing_students = 0
            # Find max marks for this CO across all submissions
            for entry in entries:
                co_marks = (entry.co_wise_marks or {}).get(co.id)
                if co_marks is not None:
                    total_students += 1
                    # Determine max for this CO from the parent submission
                    parent_sub = next((s for s in submissions if s.id == entry.submission_id), None)
                    if parent_sub:
                        co_max = parent_sub.max_marks  # simplified; refine with per-CO max if available
                        pct = (co_marks / co_max * 100) if co_max > 0 else 0
                        if pct >= threshold:
                            passing_students += 1

            if total_students > 0:
                co_direct[co.id] = (passing_students / total_students) * 100
            else:
                co_direct[co.id] = None  # No data — don't compute

        # Calculate indirect attainment per CO from exit surveys
        surveys_result = await self.db.scalars(
            select(CourseExitSurvey).where(
                CourseExitSurvey.course_id == course_id,
                CourseExitSurvey.academic_year == academic_year,
            )
        )
        surveys = surveys_result.all()

        co_indirect: Dict[str, float] = {}
        for co in cos:
            ratings = []
            for survey in surveys:
                co_rating = (survey.co_ratings or {}).get(co.id)
                if co_rating is not None:
                    ratings.append(co_rating)
            if ratings:
                co_indirect[co.id] = (sum(ratings) / len(ratings)) / 5.0 * 100
            else:
                co_indirect[co.id] = None

        # Compute final attainment and upsert records
        records = []
        for co in cos:
            direct = co_direct.get(co.id)
            indirect = co_indirect.get(co.id)

            final = None
            if direct is not None:
                if indirect is not None:
                    final = (weights["direct_weight"] * direct) + (weights["indirect_weight"] * indirect)
                else:
                    final = direct  # No indirect data — use direct only

            is_attained = final >= threshold if final is not None else None

            # Check if record already exists and is locked
            existing = await self.db.scalar(
                select(COAttainmentRecord).where(
                    COAttainmentRecord.co_id == co.id,
                    COAttainmentRecord.course_id == course_id,
                    COAttainmentRecord.academic_year == academic_year,
                )
            )
            if existing:
                if existing.locked_at is not None:
                    continue  # Immutable — skip
                existing.direct_attainment = direct
                existing.indirect_attainment = indirect
                existing.final_attainment = final
                existing.is_attained = is_attained
                existing.calculation_snapshot = {
                    "weights": weights,
                    "direct": direct,
                    "indirect": indirect,
                    "final": final,
                    "threshold": threshold,
                }
                records.append(existing)
            else:
                record = COAttainmentRecord(
                    college_id=college_id,
                    co_id=co.id,
                    course_id=course_id,
                    academic_year=academic_year,
                    semester=0,  # TODO: resolve from course
                    direct_attainment=direct,
                    indirect_attainment=indirect,
                    final_attainment=final,
                    threshold=threshold,
                    is_attained=is_attained,
                    calculation_snapshot={
                        "weights": weights,
                        "direct": direct,
                        "indirect": indirect,
                        "final": final,
                        "threshold": threshold,
                    },
                )
                self.db.add(record)
                records.append(record)

        await self.db.commit()
        return records

    # ── PO Attainment ────────────────────────────────────────────────────────

    async def calculate_po_attainment(
        self,
        department_id: str,
        academic_year: str,
        college_id: str,
    ) -> List[POAttainmentRecord]:
        """
        1. Fetch all COAttainmentRecords for all courses in this department + year.
        2. Fetch all COPOMapping records (is_active=True only).
        3. For each PO: attainment = sum(co_attainment * strength) / sum(strength).
        4. Upsert POAttainmentRecord.
        """
        # Fetch all POs for this department
        pos = (await self.db.scalars(
            select(ProgramOutcome).where(ProgramOutcome.department_id == department_id)
        )).all()

        # Fetch all active CO-PO mappings
        mappings = (await self.db.scalars(
            select(COPOMapping).where(COPOMapping.is_active == True)
        )).all()

        # Fetch all CO attainment records for this college + year
        co_records = (await self.db.scalars(
            select(COAttainmentRecord).where(
                COAttainmentRecord.college_id == college_id,
                COAttainmentRecord.academic_year == academic_year,
            )
        )).all()
        co_attainment_map = {r.co_id: r.final_attainment for r in co_records if r.final_attainment is not None}

        records = []
        for po in pos:
            # Find all mappings for this PO
            po_mappings = [m for m in mappings if m.po_id == po.id]
            weighted_sum = 0.0
            strength_sum = 0
            calc_detail = {}

            for mapping in po_mappings:
                co_att = co_attainment_map.get(mapping.co_id)
                if co_att is not None:
                    weighted_sum += co_att * mapping.strength
                    strength_sum += mapping.strength
                    calc_detail[mapping.co_id] = {
                        "strength": mapping.strength,
                        "attainment": co_att,
                    }

            attainment_value = (weighted_sum / strength_sum) if strength_sum > 0 else None

            existing = await self.db.scalar(
                select(POAttainmentRecord).where(
                    POAttainmentRecord.po_id == po.id,
                    POAttainmentRecord.department_id == department_id,
                    POAttainmentRecord.academic_year == academic_year,
                )
            )
            if existing:
                if existing.locked_at is not None:
                    continue
                existing.attainment_value = attainment_value
                existing.calculation_method = calc_detail
                records.append(existing)
            else:
                record = POAttainmentRecord(
                    college_id=college_id,
                    po_id=po.id,
                    department_id=department_id,
                    academic_year=academic_year,
                    attainment_value=attainment_value,
                    calculation_method=calc_detail,
                )
                self.db.add(record)
                records.append(record)

        await self.db.commit()
        return records

    # ── PSO Attainment ───────────────────────────────────────────────────────

    async def calculate_pso_attainment(
        self,
        department_id: str,
        academic_year: str,
        college_id: str,
    ) -> List[PSOAttainmentRecord]:
        """Identical to calculate_po_attainment but uses COPSOMapping instead."""
        from app.models.accreditation import ProgramSpecificOutcome

        psos = (await self.db.scalars(
            select(ProgramSpecificOutcome).where(
                ProgramSpecificOutcome.department_id == department_id,
                ProgramSpecificOutcome.college_id == college_id,
            )
        )).all()

        mappings = (await self.db.scalars(
            select(COPSOMapping).where(COPSOMapping.is_active == True)
        )).all()

        co_records = (await self.db.scalars(
            select(COAttainmentRecord).where(
                COAttainmentRecord.college_id == college_id,
                COAttainmentRecord.academic_year == academic_year,
            )
        )).all()
        co_attainment_map = {r.co_id: r.final_attainment for r in co_records if r.final_attainment is not None}

        records = []
        for pso in psos:
            pso_mappings = [m for m in mappings if m.pso_id == pso.id]
            weighted_sum = 0.0
            strength_sum = 0
            calc_detail = {}

            for mapping in pso_mappings:
                co_att = co_attainment_map.get(mapping.co_id)
                if co_att is not None:
                    weighted_sum += co_att * mapping.strength
                    strength_sum += mapping.strength
                    calc_detail[mapping.co_id] = {
                        "strength": mapping.strength,
                        "attainment": co_att,
                    }

            attainment_value = (weighted_sum / strength_sum) if strength_sum > 0 else None

            existing = await self.db.scalar(
                select(PSOAttainmentRecord).where(
                    PSOAttainmentRecord.pso_id == pso.id,
                    PSOAttainmentRecord.department_id == department_id,
                    PSOAttainmentRecord.academic_year == academic_year,
                )
            )
            if existing:
                if existing.locked_at is not None:
                    continue
                existing.attainment_value = attainment_value
                existing.calculation_method = calc_detail
                records.append(existing)
            else:
                record = PSOAttainmentRecord(
                    college_id=college_id,
                    pso_id=pso.id,
                    department_id=department_id,
                    academic_year=academic_year,
                    attainment_value=attainment_value,
                    calculation_method=calc_detail,
                )
                self.db.add(record)
                records.append(record)

        await self.db.commit()
        return records

    # ── Lock ─────────────────────────────────────────────────────────────────

    async def lock_attainment(
        self,
        record_id: str,
        locked_by: str,
        record_type: str,  # "co" | "po" | "pso"
    ) -> None:
        """
        Sets locked_at = now(), locked_by = user_id.
        Service layer rejects any further writes to this record.
        """
        from datetime import datetime, timezone

        model_map = {
            "co": COAttainmentRecord,
            "po": POAttainmentRecord,
            "pso": PSOAttainmentRecord,
        }
        model = model_map.get(record_type)
        if not model:
            raise BusinessLogicError(f"Invalid record_type: {record_type}")

        record = await self.db.get(model, record_id)
        if not record:
            raise BusinessLogicError(f"Attainment record {record_id} not found")
        if record.locked_at is not None:
            raise BusinessLogicError("Record is already locked and immutable")

        record.locked_at = datetime.now(timezone.utc)
        record.locked_by = locked_by
        await self.db.commit()
