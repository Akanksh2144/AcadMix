from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.security import require_role
from database import get_db
from app.models.accreditation import (
    NAACAuditSnapshot,
    NAACQualitativeNarrative,
    AttainmentConfig,
    AccreditationEvidence
)
from app.schemas.accreditation import (
    QlMUpdateRequest,
    QlMCopyRequest,
    ThresholdUpdateRequest
)

router = APIRouter()

@router.get("/health-check")
async def validation_health_check(
    academic_year: str = Query(..., description="e.g., 2024-2025"),
    user: dict = Depends(require_role("nodal", "principal", "admin", "super_admin")),
    session: AsyncSession = Depends(get_db)
):
    college_id = user.get("college_id")
    if not college_id and user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="College context required")
        
    narratives = (await session.scalars(
        select(NAACQualitativeNarrative).where(
            NAACQualitativeNarrative.college_id == college_id,
            NAACQualitativeNarrative.academic_year == academic_year
        )
    )).all()
    
    total_completed = sum(1 for n in narratives if n.is_complete)
    total_narratives = len(narratives)
    
    evidence = (await session.scalars(
        select(AccreditationEvidence).where(
            AccreditationEvidence.college_id == college_id
        )
    )).all()
    
    # Calculate Faculty Retention Warning
    from app.models.accreditation import FacultyProfile
    faculty = (await session.scalars(
        select(FacultyProfile).where(FacultyProfile.college_id == college_id)
    )).all()
    
    total_faculty = len(faculty)
    active_faculty = sum(1 for f in faculty if not getattr(f, 'is_deleted', False))
    retention_pct = (active_faculty / total_faculty) * 100 if total_faculty > 0 else 100.0
    
    warnings = []
    if retention_pct < 60.0:
        warnings.append(f"Faculty retention is below 60% ({retention_pct:.1f}%). This will impact NBA Criterion 4 heavily.")
        
    warnings.append("NBA Success Rate metrics are based on incomplete historical backlog data. Manual verification required.")
    
    required_part_c = {"NBA_PART_C_FIRST_YEAR", "NBA_PART_C_STUDENT_SUPPORT", "NBA_PART_C_FINANCE"}
    completed_narratives = {n.criterion_code for n in narratives if n.is_complete}
    
    missing_part_c = required_part_c - completed_narratives
    if missing_part_c:
        warnings.append(f"Missing or incomplete manual narratives for NBA Part C: {', '.join(missing_part_c)}")
    
    status = "healthy" if (total_completed > 0 or total_narratives == 0) and not warnings else "needs_attention"
    return {
        "status": status,
        "narratives_total": total_narratives,
        "narratives_completed": total_completed,
        "evidence_count": len(evidence),
        "academic_year": academic_year,
        "retention_pct": round(retention_pct, 1),
        "warnings": warnings
    }

@router.put("/qlm")
async def update_qlm(
    request: QlMUpdateRequest,
    academic_year: str = Query(..., description="e.g., 2024-2025"),
    user: dict = Depends(require_role("nodal", "admin", "super_admin")),
    session: AsyncSession = Depends(get_db)
):
    college_id = user.get("college_id")
    if not college_id and user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="College context required")
        
    record = (await session.scalars(
        select(NAACQualitativeNarrative).where(
            NAACQualitativeNarrative.college_id == college_id,
            NAACQualitativeNarrative.academic_year == academic_year,
            NAACQualitativeNarrative.criterion_code == request.criterion_code
        )
    )).first()
    
    if record:
        record.narrative_text = request.narrative_text
        record.is_complete = request.is_complete
        record.last_edited_by = user["id"]
    else:
        record = NAACQualitativeNarrative(
            college_id=college_id,
            academic_year=academic_year,
            criterion_code=request.criterion_code,
            criterion_name=request.criterion_name,
            narrative_text=request.narrative_text,
            is_complete=request.is_complete,
            last_edited_by=user["id"]
        )
        session.add(record)
        
    await session.commit()
    await session.refresh(record)
    return {"status": "success", "record": record}

@router.post("/qlm/copy-from-year")
async def copy_qlm(
    request: QlMCopyRequest,
    academic_year: str = Query(..., description="Target academic year, e.g., 2024-2025"),
    user: dict = Depends(require_role("nodal", "admin", "super_admin")),
    session: AsyncSession = Depends(get_db)
):
    college_id = user.get("college_id")
    if not college_id and user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="College context required")
        
    query = select(NAACQualitativeNarrative).where(
        NAACQualitativeNarrative.college_id == college_id,
        NAACQualitativeNarrative.academic_year == request.from_academic_year
    )
    if request.criterion_code:
        query = query.where(NAACQualitativeNarrative.criterion_code == request.criterion_code)
        
    source_records = (await session.scalars(query)).all()
    copied = 0
    
    for src in source_records:
        target = (await session.scalars(
            select(NAACQualitativeNarrative).where(
                NAACQualitativeNarrative.college_id == college_id,
                NAACQualitativeNarrative.academic_year == academic_year,
                NAACQualitativeNarrative.criterion_code == src.criterion_code
            )
        )).first()
        
        if not target:
            new_record = NAACQualitativeNarrative(
                college_id=college_id,
                academic_year=academic_year,
                criterion_code=src.criterion_code,
                criterion_name=src.criterion_name,
                narrative_text=src.narrative_text,
                is_complete=False,
                last_edited_by=user["id"]
            )
            session.add(new_record)
            copied += 1
            
    await session.commit()
    return {"status": "success", "copied_count": copied}

@router.put("/threshold")
async def update_threshold(
    request: ThresholdUpdateRequest,
    user: dict = Depends(require_role("nodal", "admin", "super_admin")),
    session: AsyncSession = Depends(get_db)
):
    college_id = user.get("college_id")
    if not college_id and user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="College context required")
        
    query = select(AttainmentConfig).where(
        AttainmentConfig.college_id == college_id,
        AttainmentConfig.batch_year == request.batch_year
    )
    if request.department_id:
        query = query.where(AttainmentConfig.department_id == request.department_id)
    else:
        query = query.where(AttainmentConfig.department_id == None)
        
    config = (await session.scalars(query)).first()
    
    if config:
        config.direct_threshold_pct = request.direct_threshold_pct
        config.direct_weight = request.direct_weight
        config.indirect_weight = request.indirect_weight
        config.po_target_level = request.po_target_level
    else:
        config = AttainmentConfig(
            college_id=college_id,
            department_id=request.department_id,
            batch_year=request.batch_year,
            direct_threshold_pct=request.direct_threshold_pct,
            direct_weight=request.direct_weight,
            indirect_weight=request.indirect_weight,
            po_target_level=request.po_target_level
        )
        session.add(config)
        
    await session.commit()
    await session.refresh(config)
    return {"status": "success", "config": config}
