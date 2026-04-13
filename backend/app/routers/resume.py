"""
Interview War Room — Resume ATS Scorer Router
Handles resume upload (in-memory PDF parsing), ATS scoring via AI,
and score history retrieval. No file storage — only parsed text is persisted.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Optional
import json
import logging
import io

from database import get_db
from app.core.security import require_role
from app.core.config import settings
from app import models

logger = logging.getLogger("acadmix.resume")

router = APIRouter()

# ─── ATS Scoring Prompt ──────────────────────────────────────────────────────

ATS_SCORING_PROMPT = """You are an expert ATS (Applicant Tracking System) resume analyzer. Analyze the following resume text and score it for ATS compatibility.

{jd_section}

TARGET ROLE: {target_role}

RESUME TEXT:
{resume_text}

Provide your analysis in the following strict JSON format:
{{
  "ats_score": <number 0-100>,
  "section_scores": {{
    "contact_info": <number 0-100>,
    "professional_summary": <number 0-100>,
    "work_experience": <number 0-100>,
    "education": <number 0-100>,
    "skills": <number 0-100>,
    "projects": <number 0-100>,
    "certifications": <number 0-100>,
    "formatting": <number 0-100>
  }},
  "keywords_found": ["<keyword1>", "<keyword2>", ...],
  "keywords_missing": ["<keyword1>", "<keyword2>", ...],
  "improvement_tips": [
    "<specific actionable tip 1>",
    "<specific actionable tip 2>",
    "<specific actionable tip 3>",
    "<specific actionable tip 4>",
    "<specific actionable tip 5>"
  ],
  "summary": "<2-3 sentence overall assessment>"
}}

SCORING GUIDELINES:
- Contact Info: Does it have name, phone, email, LinkedIn, location?
- Professional Summary: Is there a clear objective/summary tailored to the role?
- Work Experience: Are achievements quantified? Action verbs used? Relevant to role?
- Education: Is it clearly listed with GPA/CGPA, institution, dates?
- Skills: Are they relevant to the target role? Are they specific (not generic)?
- Projects: Are they described with tech stack, impact, and outcomes?
- Certifications: Are there relevant certifications for the target role?
- Formatting: Is the resume well-structured, consistent, and ATS-parseable (no tables/images)?

For keywords: Compare against standard keywords expected for the target role in job descriptions.
Return ONLY valid JSON, no markdown, no explanation outside the JSON."""


# ─── Helper: Extract text from PDF ───────────────────────────────────────────

async def _extract_pdf_text(file_bytes: bytes) -> str:
    """Extract text from PDF bytes using PyPDF2. Falls back to basic extraction."""
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        pages = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages.append(text)
        full_text = "\n".join(pages).strip()
        if full_text:
            return full_text
    except Exception as e:
        logger.warning("PyPDF2 extraction failed: %s", e)

    # Fallback: try pdfplumber
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            pages = []
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    pages.append(text)
            return "\n".join(pages).strip()
    except Exception as e:
        logger.warning("pdfplumber extraction also failed: %s", e)

    raise HTTPException(status_code=422, detail="Could not extract text from the PDF. Please ensure it's a valid, text-based PDF (not a scanned image).")


# ─── Helper: Call LLM ─────────────────────────────────────────────────────────

async def _call_llm(messages: list, json_mode: bool = False) -> str:
    import litellm
    litellm.api_key = settings.GEMINI_API_KEY

    kwargs = {
        "model": settings.INTERVIEW_LLM_MODEL,
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": 4096,
    }
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    try:
        response = await litellm.acompletion(**kwargs)
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error("LLM call failed: %s", e)
        raise HTTPException(status_code=502, detail="AI service temporarily unavailable")


# ─── POST /resume/upload ─────────────────────────────────────────────────────

@router.post("/resume/upload")
async def upload_resume(
    file: UploadFile = File(...),
    target_role: Optional[str] = Form(None),
    job_description: Optional[str] = Form(None),
    user: dict = Depends(require_role("student")),
    session: AsyncSession = Depends(get_db)
):
    """
    Upload a PDF resume. Text is extracted in-memory and stored.
    The PDF file itself is discarded immediately (no file storage).
    Optionally triggers ATS scoring if target_role is provided.
    """
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    # Read and extract
    file_bytes = await file.read()
    if len(file_bytes) > 5 * 1024 * 1024:  # 5MB limit
        raise HTTPException(status_code=400, detail="Resume PDF must be under 5MB")

    parsed_text = await _extract_pdf_text(file_bytes)
    if not parsed_text or len(parsed_text) < 50:
        raise HTTPException(status_code=422, detail="Could not extract meaningful text from the PDF. Ensure it's not a scanned image.")

    # Create resume record
    resume = models.ResumeScore(
        college_id=user["college_id"],
        student_id=user["id"],
        filename=file.filename,
        parsed_text=parsed_text,
        target_role=target_role,
        job_description=job_description,
    )
    session.add(resume)
    await session.flush()  # get generated ID

    result = {
        "id": resume.id,
        "filename": file.filename,
        "parsed_text_length": len(parsed_text),
        "parsed_text_preview": parsed_text[:500] + "..." if len(parsed_text) > 500 else parsed_text,
    }

    # Auto-score if target_role provided
    if target_role:
        score_result = await _run_ats_scoring(resume, session)
        result.update(score_result)

    return result


# ─── POST /resume/{id}/score ─────────────────────────────────────────────────

@router.post("/resume/{resume_id}/score")
async def score_resume(
    resume_id: str,
    req: dict = None,
    user: dict = Depends(require_role("student")),
    session: AsyncSession = Depends(get_db)
):
    """
    Run ATS scoring on a previously uploaded resume.
    Body (optional): { target_role, job_description }
    """
    stmt = select(models.ResumeScore).where(
        models.ResumeScore.id == resume_id,
        models.ResumeScore.student_id == user["id"],
        models.ResumeScore.college_id == user["college_id"],
    )
    result = await session.execute(stmt)
    resume = result.scalars().first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if req:
        if req.get("target_role"):
            resume.target_role = req["target_role"]
        if req.get("job_description"):
            resume.job_description = req["job_description"]

    score_result = await _run_ats_scoring(resume, session)
    return score_result


async def _run_ats_scoring(resume: models.ResumeScore, session: AsyncSession) -> dict:
    """Internal: run ATS scoring via LLM and update the resume record."""
    jd_section = ""
    if resume.job_description:
        jd_section = f"JOB DESCRIPTION TO MATCH AGAINST:\n{resume.job_description}"

    prompt = ATS_SCORING_PROMPT.format(
        target_role=resume.target_role or "Software Developer",
        resume_text=resume.parsed_text,
        jd_section=jd_section,
    )

    messages = [
        {"role": "system", "content": "You are an expert ATS analyzer. Return only valid JSON."},
        {"role": "user", "content": prompt},
    ]

    raw = await _call_llm(messages, json_mode=True)

    # Robust JSON parsing — LLMs sometimes return markdown-wrapped or malformed JSON
    import re
    analysis = None

    # Strip markdown code fences if present
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r'^```(?:json)?\s*', '', cleaned)
        cleaned = re.sub(r'\s*```$', '', cleaned)

    # Fix trailing commas before closing brackets/braces (common LLM error)
    cleaned = re.sub(r',\s*([}\]])', r'\1', cleaned)

    # Attempt 1: Direct parse
    try:
        analysis = json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Attempt 2: Extract JSON object via regex
    if analysis is None:
        try:
            json_match = re.search(r'\{.*\}', raw, re.DOTALL)
            if json_match:
                extracted = re.sub(r',\s*([}\]])', r'\1', json_match.group())
                analysis = json.loads(extracted)
        except json.JSONDecodeError:
            pass

    # Fallback
    if analysis is None:
        logger.warning("LLM returned unparseable JSON for ATS scoring. Raw (first 500): %s", raw[:500])
        analysis = {"ats_score": 50, "section_scores": {}, "keywords_found": [], "keywords_missing": [], "improvement_tips": ["Could not parse AI response. Please try again."], "summary": "Analysis could not be completed. Please retry."}

    resume.ats_score = analysis.get("ats_score", 50)
    resume.section_scores = analysis.get("section_scores", {})
    resume.keywords_found = analysis.get("keywords_found", [])
    resume.keywords_missing = analysis.get("keywords_missing", [])
    resume.improvement_tips = analysis.get("improvement_tips", [])

    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(resume, "section_scores")
    flag_modified(resume, "keywords_found")
    flag_modified(resume, "keywords_missing")
    flag_modified(resume, "improvement_tips")

    return {
        "id": resume.id,
        "ats_score": resume.ats_score,
        "section_scores": resume.section_scores,
        "keywords_found": resume.keywords_found,
        "keywords_missing": resume.keywords_missing,
        "improvement_tips": resume.improvement_tips,
        "summary": analysis.get("summary", ""),
    }


# ─── GET /resume/history ─────────────────────────────────────────────────────

@router.get("/resume/history")
async def get_resume_history(
    user: dict = Depends(require_role("student")),
    session: AsyncSession = Depends(get_db)
):
    """List past resume uploads with ATS scores."""
    stmt = (
        select(models.ResumeScore)
        .where(
            models.ResumeScore.student_id == user["id"],
            models.ResumeScore.college_id == user["college_id"],
            models.ResumeScore.is_deleted == False,
        )
        .order_by(models.ResumeScore.created_at.desc())
        .limit(20)
    )
    result = await session.execute(stmt)
    resumes = result.scalars().all()

    return [
        {
            "id": r.id,
            "filename": r.filename,
            "ats_score": r.ats_score,
            "target_role": r.target_role,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in resumes
    ]


# ─── GET /resume/latest ──────────────────────────────────────────────────────

@router.get("/resume/latest")
async def get_latest_resume(
    user: dict = Depends(require_role("student")),
    session: AsyncSession = Depends(get_db)
):
    """Get the most recently uploaded resume with full analysis."""
    stmt = (
        select(models.ResumeScore)
        .where(
            models.ResumeScore.student_id == user["id"],
            models.ResumeScore.college_id == user["college_id"],
            models.ResumeScore.is_deleted == False,
        )
        .order_by(models.ResumeScore.created_at.desc())
        .limit(1)
    )
    result = await session.execute(stmt)
    resume = result.scalars().first()
    if not resume:
        return None

    return {
        "id": resume.id,
        "filename": resume.filename,
        "parsed_text": resume.parsed_text,
        "ats_score": resume.ats_score,
        "section_scores": resume.section_scores,
        "keywords_found": resume.keywords_found,
        "keywords_missing": resume.keywords_missing,
        "improvement_tips": resume.improvement_tips,
        "target_role": resume.target_role,
        "created_at": resume.created_at.isoformat() if resume.created_at else None,
    }
