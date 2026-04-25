from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func
from typing import List, Optional

from database import get_db
from app.core.security import require_role
from app.models.outcomes import ProgramOutcome, CourseOutcome, COPOMapping
from app.models.assessments import AssessmentQuestion
from app.models.academics import Course
from app.schemas.outcomes import MatrixUpsertRequest, OutcomeMatrixResponse, CourseOutcomeCreate

router = APIRouter()

@router.get("/courses/{course_id}/outcomes", response_model=OutcomeMatrixResponse)
async def get_outcomes_matrix(
    course_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_role(["faculty", "hod", "admin"])),
):
    """
    Fetch the complete outcomes matrix for a given course.
    Includes all Course Outcomes, the standard Program Outcomes for the parent Department, and the existing mappings.
    """
    # 1. Fetch the course to determine the department
    course = await db.scalar(select(Course).where(Course.id == course_id, Course.college_id == user["college_id"]))
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    department_id = course.department_id

    # 2. Fetch Program Outcomes (POs) for this department
    pos = await db.scalars(
        select(ProgramOutcome).where(ProgramOutcome.department_id == department_id)
    )
    po_list = pos.all()

    # 3. Fetch Course Outcomes (COs) mapped to this course
    cos = await db.scalars(
        select(CourseOutcome).where(CourseOutcome.course_id == course_id)
    )
    co_list = cos.all()

    # 4. Fetch the existing CO-PO mappings
    # We load mappings where the CO belongs to this course
    co_ids = [c.id for c in co_list]
    mappings_list = []
    if co_ids:
        mappings = await db.scalars(
            select(COPOMapping).where(COPOMapping.co_id.in_(co_ids))
        )
        mappings_list = mappings.all()

    return OutcomeMatrixResponse(
        program_outcomes=[
            {"id": p.id, "code": p.code, "description": p.description} for p in po_list
        ],
        course_outcomes=[
            {"id": c.id, "course_id": c.course_id, "code": c.code, "description": c.description, "bloom_level": c.bloom_level} 
            for c in co_list
        ],
        mappings=[
            {"id": m.id, "co_id": m.co_id, "po_id": m.po_id, "strength": m.strength} 
            for m in mappings_list
        ]
    )

@router.post("/courses/{course_id}/co-po-mapping")
async def batch_upsert_matrix(
    course_id: str,
    payload: MatrixUpsertRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_role(["faculty", "hod"])),
):
    """
    Batch Upsert API for Course Outcomes and CO-PO relationships.
    Strictly synchronizes the actual DB state to exactly mirror the frontend payload array.
    """
    # 1. Validate course exists
    course = await db.scalar(select(Course).where(Course.id == course_id, Course.college_id == user["college_id"]))
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    college_id = course.college_id

    # 2. Sync Course Outcomes (COs)
    # Fetch existing
    existing_cos = await db.scalars(select(CourseOutcome).where(CourseOutcome.course_id == course_id))
    existing_co_map = {co.id: co for co in existing_cos.all()}

    # Upsert provided COs
    processed_co_ids = set()
    for co_data in payload.course_outcomes:
        co_id = co_data.id
        if co_id and co_id in existing_co_map:
            # Update
            db_co = existing_co_map[co_id]
            db_co.code = co_data.code
            db_co.description = co_data.description
            db_co.bloom_level = co_data.bloom_level
            processed_co_ids.add(co_id)
        else:
            # Insert
            new_co = CourseOutcome(
                college_id=college_id,
                course_id=course_id,
                code=co_data.code,
                description=co_data.description,
                bloom_level=co_data.bloom_level
            )
            db.add(new_co)
            # Cannot link new CO logic accurately until commit if using uuids via sequence, 
            # but we use uuid default. So we flush to get the id explicitly.
            await db.flush()
            
            # Re-map the IDs in the incoming mapping array replacing "new-xx" UUIDs if provided from FE
            for mapping in payload.mappings:
                if mapping.co_id == co_data.id:
                    mapping.co_id = new_co.id
                    
            processed_co_ids.add(new_co.id)

    # Delete missing COs (and cascade handles their mapped correlations)
    co_ids_to_delete = set(existing_co_map.keys()) - processed_co_ids
    if co_ids_to_delete:
        # Pre-flight Check: Guard against corrupting live assessment questions
        dependent_questions = await db.scalar(
            select(func.count(AssessmentQuestion.id)).where(AssessmentQuestion.co_id.in_(co_ids_to_delete))
        )
        if dependent_questions > 0:
            raise HTTPException(
                status_code=409,
                detail="Cannot delete CO — it is referenced by existing AI assessment questions."
            )
            
        await db.execute(delete(CourseOutcome).where(CourseOutcome.id.in_(co_ids_to_delete)))

    # Fetch fresh active co_ids list mapped to this course (in case some were stripped)
    active_cos = await db.scalars(select(CourseOutcome).where(CourseOutcome.course_id == course_id))
    active_co_ids = [c.id for c in active_cos.all()]

    # 3. Synchronize CO-PO Mappings
    if active_co_ids:
        # Erase ALL existing mappings for this course
        await db.execute(delete(COPOMapping).where(COPOMapping.co_id.in_(active_co_ids)))
        
        # Insert all fresh valid mapping relationships from the payload
        for mapping in payload.mappings:
            if mapping.co_id in active_co_ids:  # Final guard
                new_mapping = COPOMapping(
                    college_id=college_id,
                    co_id=mapping.co_id,
                    po_id=mapping.po_id,
                    strength=mapping.strength
                )
                db.add(new_mapping)

    return {"status": "success", "message": "Matrix successfully synchronized"}
