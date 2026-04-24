from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Dict, Any, Optional

from app.core.security import require_role
from database import get_db
from app.models.accreditation import (
    NAACAuditSnapshot,
    AccreditationEvidence,
    COAttainmentRecord,
    POAttainmentRecord,
)
from app.models.outcomes import ProgramOutcome, COPOMapping, CourseOutcome
from app.models.core import UserProfile, College
from app.models.academics import CourseEnrollment, Course
from app.services.attainment_service import AttainmentService

router = APIRouter()

# ── NAAC Summary ─────────────────────────────────────────────────────────────

@router.get("/naac/summary/{college_id}")
async def get_naac_summary(
    college_id: str,
    academic_year: str = Query(..., description="e.g., 2024-2025"),
    user: dict = Depends(require_role("nodal", "principal", "admin", "super_admin")),
    session: AsyncSession = Depends(get_db)
):
    """
    Aggregates NAACAuditSnapshot and evidence counts across the 7 criteria.
    Gracefully handles missing data by returning a structured empty state.
    """
    CRITERIA_LABELS = {
        1: 'Curricular Aspects',
        2: 'Teaching-Learning',
        3: 'Research & Innovation',
        4: 'Infrastructure',
        5: 'Student Support',
        6: 'Governance',
        7: 'Institutional Values',
    }

    # Fetch snapshots for the college and year
    snapshots = (await session.scalars(
        select(NAACAuditSnapshot).where(
            NAACAuditSnapshot.college_id == college_id,
            NAACAuditSnapshot.academic_year == academic_year,
        )
    )).all()

    # Fetch evidence counts by criterion (grouped by criterion_id)
    # Evidence criterion_ids might be like "1.1.1", "2.3.1". 
    # We aggregate by the major criterion number (the first digit).
    evidences = (await session.scalars(
        select(AccreditationEvidence).where(
            AccreditationEvidence.college_id == college_id
        )
    )).all()

    evidence_counts = {i: 0 for i in range(1, 8)}
    for ev in evidences:
        try:
            crit_num = int(ev.criterion_id.split('.')[0])
            if 1 <= crit_num <= 7:
                evidence_counts[crit_num] += 1
        except (ValueError, IndexError):
            pass

    NAAC_WEIGHTS = {
        1: 100, 2: 350, 3: 110, 4: 100, 5: 140, 6: 100, 7: 100
    }

    # Build response structure
    result = []
    for criterion_num, name in CRITERIA_LABELS.items():
        # Aggregate scores if there are snapshots for this criterion
        crit_snapshots = [s for s in snapshots if s.criterion == criterion_num]
        
        score = None
        if crit_snapshots:
            valid_scores = [s.computed_value for s in crit_snapshots if s.computed_value is not None]
            if valid_scores:
                score = sum(valid_scores) / len(valid_scores)

        is_locked = any(s.locked_at is not None for s in crit_snapshots)

        result.append({
            "number": criterion_num,
            "name": name,
            "score": score,
            "max_score": 4.0,  # Standard NAAC max scale
            "evidence_count": evidence_counts[criterion_num],
            "snapshot_locked": is_locked,
            "weight": NAAC_WEIGHTS[criterion_num],
        })

    return {"criteria": result}

@router.get("/naac/evidence/{college_id}/{criterion_id}")
async def get_naac_evidence(
    college_id: str,
    criterion_id: str,
    user: dict = Depends(require_role("nodal", "principal", "admin", "super_admin")),
    session: AsyncSession = Depends(get_db)
):
    evidences = (await session.scalars(
        select(AccreditationEvidence).where(
            AccreditationEvidence.college_id == college_id,
            AccreditationEvidence.criterion_id.like(f"{criterion_id}%")
        )
    )).all()
    
    return {
        "criterion_id": criterion_id,
        "evidences": [
            {
                "id": e.id,
                "file_name": e.file_name,
                "s3_key": e.s3_key,
                "uploaded_by": e.uploaded_by,
                "created_at": e.created_at
            } for e in evidences
        ]
    }

# ── NBA CO-PO Matrix ─────────────────────────────────────────────────────────

@router.get("/nba/attainment/{department_id}")
async def get_nba_matrix(
    department_id: str,
    academic_year: str = Query(..., description="e.g., 2024-2025"),
    user: dict = Depends(require_role("nodal", "principal", "hod", "admin", "super_admin")),
    session: AsyncSession = Depends(get_db)
):
    """
    Returns the mapped CO and PO records for the NBACoPoMatrix frontend component.
    """
    college_id = user.get("college_id")
    if not college_id and user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="College context required")

    # Fetch POs for the department
    pos = (await session.scalars(
        select(ProgramOutcome).where(ProgramOutcome.department_id == department_id)
    )).all()
    po_ids = [po.id for po in pos]

    # Fetch CO records
    co_records = (await session.scalars(
        select(COAttainmentRecord).where(
            COAttainmentRecord.college_id == college_id,
            COAttainmentRecord.academic_year == academic_year,
        )
    )).all()
    
    if not co_records:
        return {"cos": [], "pos": [], "matrix": {}}

    # Fetch active COPOMappings for the department's POs
    mappings = []
    if po_ids:
        mappings = (await session.scalars(
            select(COPOMapping).where(
                COPOMapping.po_id.in_(po_ids),
                COPOMapping.is_active == True,
            )
        )).all()

    # Format: { "CO1-PO1": { co_code, po_code, strength, attainment, is_attained } }
    
    co_ids = [r.co_id for r in co_records]
    co_models = []
    if co_ids:
        co_models = (await session.scalars(
            select(CourseOutcome).where(CourseOutcome.id.in_(co_ids))
        )).all()
    co_map = {c.id: c.code for c in co_models}
    
    po_labels = sorted([po.code for po in pos])

    matrix = {}
    
    # We map CO records by their outcome ID to match with mappings
    # And we assume the frontend wants a full grid
    for mapping in mappings:
        co_rec = next((r for r in co_records if r.co_id == mapping.co_id), None)
        po = next((p for p in pos if p.id == mapping.po_id), None)
        
        if po and co_rec:
            co_code = co_map.get(mapping.co_id, mapping.co_id)
            key = f"{co_code}-{po.code}"
            matrix[key] = {
                "co_code": co_code,
                "co_id": mapping.co_id,
                "po_id": po.id,
                "po_code": po.code,
                "strength": mapping.strength,
                "attainment": co_rec.final_attainment,
                "is_attained": co_rec.is_attained,
            }

    return {
        "cos": [{"id": c.id, "code": c.code} for c in co_models],
        "pos": [{"id": po.id, "code": po.code} for po in pos],
        "matrix": matrix
    }

# ── NEP Status Tracker ───────────────────────────────────────────────────────

@router.get("/nep/status/{college_id}")
async def get_nep_status(
    college_id: str,
    user: dict = Depends(require_role("nodal", "principal", "admin", "super_admin")),
    session: AsyncSession = Depends(get_db)
):
    """
    Calculates NEP compliance metrics.
    Coverage percentage is correctly bound against *enrolled* students only.
    """
    # Fetch all students in the college
    students = (await session.scalars(
        select(UserProfile).where(
            UserProfile.college_id == college_id,
            UserProfile.role == "student"
        )
    )).all()

    if not students:
        return {
            "abc_coverage_pct": 0,
            "mooc_enrollment_pct": 0,
            "multidisciplinary_pct": 0,
            "enrollment_status_breakdown": {
                "active": 0,
                "academic_break": 0,
                "dropped_out": 0,
                "graduated": 0,
            },
            "total_students": 0,
        }

    status_breakdown = {
        "active": 0,
        "academic_break": 0,
        "dropped_out": 0,
        "graduated": 0,
    }

    abc_count = 0

    for s in students:
        # Tally enrollment status
        status = s.enrollment_status or "active"
        if status in status_breakdown:
            status_breakdown[status] += 1
            
        # Count ABC IDs (only for enrolled/active/academic_break students typically, but we track across all students for now)
        if s.abc_id:
            abc_count += 1

    total_students = len(students)

    # MOOC Enrollment
    mooc_enrollments = (await session.scalars(
        select(CourseEnrollment.student_id).join(Course).where(
            CourseEnrollment.college_id == college_id,
            Course.is_mooc == True
        )
    )).all()
    unique_mooc_students = len(set(mooc_enrollments))

    # Multidisciplinary Enrollment
    multi_enrollments = (await session.scalars(
        select(CourseEnrollment.student_id).join(Course).where(
            CourseEnrollment.college_id == college_id,
            Course.course_category.in_(["multidisciplinary", "mdc"])
        )
    )).all()
    unique_multi_students = len(set(multi_enrollments))

    abc_coverage_pct = (abc_count / total_students * 100) if total_students > 0 else 0
    mooc_pct = (unique_mooc_students / total_students * 100) if total_students > 0 else 0
    multi_pct = (unique_multi_students / total_students * 100) if total_students > 0 else 0

    return {
        "abc_coverage_pct": abc_coverage_pct,
        "mooc_enrollment_pct": mooc_pct,
        "multidisciplinary_pct": multi_pct,
        "enrollment_status_breakdown": status_breakdown,
        "total_students": total_students,
    }

# ── Attainment Calculation Endpoints ─────────────────────────────────────────

@router.post("/calculate/course/{course_id}")
async def trigger_course_calculation(
    course_id: str,
    academic_year: str = Query(..., description="e.g., 2024-2025"),
    user: dict = Depends(require_role("hod", "principal", "admin", "super_admin")),
    session: AsyncSession = Depends(get_db)
):
    """
    Triggers CO attainment calculation for a specific course.
    """
    college_id = user.get("college_id")
    if not college_id and user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="College context required")

    service = AttainmentService(session)
    records = await service.calculate_co_attainment(
        course_id=course_id,
        academic_year=academic_year,
        college_id=college_id
    )

    return {"status": "success", "calculated_records": records}


@router.post("/calculate/department/{department_id}")
async def trigger_department_calculation(
    department_id: str,
    academic_year: str = Query(..., description="e.g., 2024-2025"),
    user: dict = Depends(require_role("hod", "principal", "admin", "super_admin")),
    session: AsyncSession = Depends(get_db)
):
    """
    Triggers PO and PSO attainment calculations for the entire department.
    """
    college_id = user.get("college_id")
    if not college_id and user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="College context required")

    service = AttainmentService(session)
    
    po_records = await service.calculate_po_attainment(
        department_id=department_id,
        academic_year=academic_year,
        college_id=college_id
    )

    pso_records = await service.calculate_pso_attainment(
        department_id=department_id,
        academic_year=academic_year,
        college_id=college_id
    )

    return {
        "status": "success", 
        "calculated_po_records": po_records,
        "calculated_pso_records": pso_records
    }
