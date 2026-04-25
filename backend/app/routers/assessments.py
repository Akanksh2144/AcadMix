from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from database import get_db
from app.core.security import require_role
from app.schemas.assessments import AIGenerationRequest, AIGenerationResultWrapper, AssessmentCommitRequest
from app.services.assessment_service import generate_assessment_preview
from app.models.assessments import AIGeneratedAssessment, AssessmentQuestion

router = APIRouter()

@router.post("/courses/{course_id}/generate-assessment", response_model=AIGenerationResultWrapper)
async def api_generate_assessment(
    course_id: str,
    payload: AIGenerationRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_role(["faculty", "hod"])),
):
    """
    Generates a structured assessment utilizing Vertex AI mapping against active CO/PO schema.
    Returns JSON payload back for manual faculty verification (no db writes).
    """
    try:
        result = await generate_assessment_preview(db, course_id, payload)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to trigger AI generation loop securely.")


@router.post("/courses/{course_id}/commit-assessment")
async def api_commit_assessment(
    course_id: str,
    payload: AssessmentCommitRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_role(["faculty", "hod"])),
):
    """
    Commits an officially verified generated assessment into the live database state as a 'draft'.
    """
    # 1. Insert parent assessment
    assessment = AIGeneratedAssessment(
        college_id=user["college_id"],
        faculty_id=user["id"],
        course_id=course_id,
        type=payload.type,
        title=payload.title,
        prompt_used=payload.prompt_used,
        status="draft"
    )
    db.add(assessment)
    await db.flush()  # obtain assessment.id

    # 2. Extract and flush questions mapped dynamically
    q_objects = []
    for q in payload.questions:
        aq = AssessmentQuestion(
            college_id=user["college_id"],
            assessment_id=assessment.id,
            question_text=q.question_text,
            question_type=q.question_type,
            co_id=q.co_id,
            po_id=q.po_id,
            bloom_level=q.bloom_level,
            marks=q.marks,
            options=[{"id": o.id, "text": o.text} for o in (q.options or [])],
            answer_key=q.answer_key
        )
        q_objects.append(aq)
    
    db.add_all(q_objects)

    return {"status": "success", "message": "Assessment successfully secured dynamically.", "assessment_id": assessment.id}
