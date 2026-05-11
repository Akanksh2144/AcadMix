from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func
from typing import List, Optional

import json
from database import get_db
from app.core.security import require_role
from app.models.outcomes import ProgramOutcome, CourseOutcome, COPOMapping
from app.models.assessments import AssessmentQuestion
from app.models.academics import Course, SyllabusUnit, SyllabusTopic
from app.schemas.outcomes import MatrixUpsertRequest, OutcomeMatrixResponse, CourseOutcomeCreate
from app.services.llm_gateway import gateway

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

@router.post("/courses/{course_id}/ai-generate-outcomes")
async def ai_generate_outcomes(
    course_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_role(["faculty", "hod", "admin"])),
):
    """
    Leverages Gemini LLM to auto-generate Course Outcomes (COs) and CO-PO mappings based on Syllabus.
    """
    # 1. Fetch Course
    course = await db.scalar(select(Course).where(Course.id == course_id, Course.college_id == user["college_id"]))
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    department_id = course.department_id

    # 2. Fetch POs
    pos = await db.scalars(select(ProgramOutcome).where(ProgramOutcome.department_id == department_id))
    po_list = pos.all()
    if not po_list:
        raise HTTPException(status_code=400, detail="No Program Outcomes defined for this department. Please configure them first.")

    # 3. Fetch Syllabus to build context
    units = await db.scalars(select(SyllabusUnit).where(SyllabusUnit.course_id == course_id).order_by(SyllabusUnit.unit_no))
    unit_list = units.all()
    
    syllabus_context = f"Course: {course.name} ({course.subject_code})\nSemester: {course.semester}\n"
    if unit_list:
        syllabus_context += "Syllabus:\n"
        for unit in unit_list:
            syllabus_context += f"Unit {unit.unit_no}: {unit.title}\n"
            topics = await db.scalars(select(SyllabusTopic).where(SyllabusTopic.unit_id == unit.id).order_by(SyllabusTopic.topic_no))
            for t in topics.all():
                syllabus_context += f"  - {t.title}\n"
    else:
        syllabus_context += "(Syllabus not configured in DB. Please generate outcomes based on the standard engineering curriculum for this course.)\n"

    po_context = "Available Program Outcomes (POs):\n"
    for po in po_list:
        po_context += f"- {po.code}: {po.description}\n"

    # 4. Construct Prompt
    prompt = f"""
    You are an AI assistant specialized in Outcome-Based Education (OBE) and NBA accreditation for an engineering college.
    Your task is to generate 5-6 valid Course Outcomes (COs) for the following course, and map them to the Program Outcomes (POs).

    {syllabus_context}

    {po_context}

    REQUIREMENTS:
    1. Generate 5-6 Course Outcomes (CO1, CO2, etc.). Keep the descriptions concise, action-oriented, and academic.
    2. Assign a 'bloom_level' to each CO. Must be one of: "Remember", "Understand", "Apply", "Analyse", "Evaluate", "Create".
    3. Map each CO to the relevant POs. Determine a 'strength' of correlation: 1 (Low), 2 (Medium), or 3 (High). Do not map a CO to a PO if there is no correlation (leave it out).
    4. Provide the result strictly in valid JSON format. Do not include markdown formatting like ```json ... ```. Only the raw JSON object.

    OUTPUT JSON FORMAT:
    {{
        "course_outcomes": [
            {{ "code": "CO1", "description": "...", "bloom_level": "Understand" }}
        ],
        "mappings": [
            {{ "co_code": "CO1", "po_code": "PO1", "strength": 3 }}
        ]
    }}
    """

    try:
        response_text = await gateway.complete("ami_coach", messages=[{"role": "user", "content": prompt}])
        
        # Clean up markdown formatting if LLM still returned it
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        response_data = json.loads(response_text.strip())
        
        # We must return the proper po_id for the mappings
        po_map = {po.code: po.id for po in po_list}
        
        valid_mappings = []
        for m in response_data.get("mappings", []):
            if m.get("po_code") in po_map:
                valid_mappings.append({
                    "co_code": m["co_code"],
                    "po_id": po_map[m["po_code"]],
                    "strength": m["strength"]
                })
        
        return {
            "course_outcomes": response_data.get("course_outcomes", []),
            "mappings": valid_mappings
        }
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail="Failed to parse AI output. Please try again.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

