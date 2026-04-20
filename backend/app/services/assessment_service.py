import json
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any

from app.models.academics import Course
from app.models.outcomes import CourseOutcome, ProgramOutcome, COPOMapping
from app.services.llm_gateway import LLMGateway
from app.schemas.assessments import AIGenerationRequest, AIGenerationResultWrapper

logger = logging.getLogger("acadmix.assessment_service")

# Initialize the gateway singleton
gateway = LLMGateway()

async def generate_assessment_preview(db: AsyncSession, course_id: str, request: AIGenerationRequest) -> AIGenerationResultWrapper:
    """
    Orchestrates the generation of an Assessment using Vertex AI.
    Fetches the CO/PO mapping to append to the system prompt, enforcing rigorous outcomes linkage.
    Returns the mapped JSON result to the frontend for manual verification before any database insertion.
    """
    
    # 1. Fetch Course and verify it exists
    course = await db.scalar(select(Course).where(Course.id == course_id))
    if not course:
        raise ValueError("Course not found")
        
    # 2. Fetch Course Outcomes for the target course
    cos = await db.scalars(select(CourseOutcome).where(CourseOutcome.course_id == course_id))
    active_cos = cos.all()
    
    if not active_cos:
        raise ValueError("Cannot generate assessment: No Course Outcomes are defined for this subject.")
        
    co_map = {co.id: co for co in active_cos}
    co_ids = list(co_map.keys())

    # 3. Fetch specific active CO-PO mappings
    mappings = await db.scalars(select(COPOMapping).where(COPOMapping.co_id.in_(co_ids)))
    active_mappings = mappings.all()
    
    # 4. Fetch the underlying Program Outcomes mapped to
    mapped_po_ids = list(set([m.po_id for m in active_mappings]))
    pos = await db.scalars(select(ProgramOutcome).where(ProgramOutcome.id.in_(mapped_po_ids)))
    po_map = {po.id: po for po in pos.all()}

    # 5. Construct the dynamic structural context block
    co_context = "AVAILABLE COURSE OUTCOMES:\n"
    for co in active_cos:
        co_context += f"- [UUID: {co.id}] ({co.code}): {co.description} | Bloom Level: {co.bloom_level}\n"
        
    mapping_context = "\nHOW COURSE OUTCOMES MAP TO PROGRAM OUTCOMES (Use these explicit PO UUIDs):\n"
    for m in active_mappings:
        if m.po_id in po_map:
            po = po_map[m.po_id]
            mapping_context += f"  - CO [{m.co_id}] maps to PO [{m.po_id}] ({po.code}) with strength {m.strength}\n"

    # 6. Build the System Prompt
    system_prompt = f"""
You are an expert academic evaluator designing an assessment for the course: {course.subject} ({course.subject_code}).
Your task is to generate {request.num_questions} questions perfectly mapped against the active NBA/NAAC Course Outcomes (CO) and Program Outcomes (PO) mapping provided below.

{co_context}
{mapping_context}

FACULTY PROMPT: "{request.prompt}"
REQUIREMENTS:
- Generate exactly {request.num_questions} questions.
- If include_mcq is true, generate Multiple Choice Questions with 4 options and mark the answer_key as the option id.
- The 'co_id' MUST exactly match one of the UUIDs provided above.
- The 'po_id' MUST map to a mathematically valid mapped UUID provided in the mapping constraint context string.
- You MUST output ONLY raw, strictly formatted JSON conforming strictly to this format:
{{
  "title": "<title>",
  "questions": [
    {{
      "question_text": "...",
      "question_type": "mcq", // or "short_answer"
      "co_id": "<exact matching UUID>",
      "po_id": "<exact matching UUID or null>",
      "bloom_level": "Apply",
      "marks": 1.0,
      "options": [{{"id": "A", "text": "..."}}, {{"id": "B", "text": "..."}}],
      "answer_key": "B"
    }}
  ]
}}
"""
    
    # 7. Execute Native Vertex Gateway Pipeline
    messages = [
        {"role": "user", "content": system_prompt}
    ]
    
    try:
        response_text = await gateway.complete(
            purpose="assessment_gen",
            messages=messages,
            json_mode=True
        )
        
        # Clean JSON boundary artifacts if Vertex returned markdown block wrapper
        if response_text.startswith("```json"):
            response_text = response_text[7:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]

        parsed_json = json.loads(response_text.strip())
        
        # 8. Uncovered CO Analytics (Warning Generator)
        mapped_cos = {q.get("co_id") for q in parsed_json.get("questions", [])}
        defined_cos = {co.id for co in active_cos}
        unsecured_cos = defined_cos - mapped_cos
        
        warnings = []
        if unsecured_cos:
            uncovered_codes = [co_map[cid].code for cid in unsecured_cos if cid in co_map]
            warnings.append(f"Incomplete Assessment Coverage: The generated assessment completely bypasses active syllabus outcomes: {', '.join(uncovered_codes)}. Consider regenerating or manually inserting questions covering these topics before publishing.")
        
        # 9. Return Preview Shape
        return AIGenerationResultWrapper(
            assessment=parsed_json,
            warnings=warnings
        )
        
    except Exception as e:
        logger.error(f"[AssessmentGen] Pipeline Failed: {e}")
        raise ValueError("AI structured generation failed. The model may have crashed while structuring outputs.")
