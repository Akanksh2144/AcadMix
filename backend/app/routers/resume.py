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

# Fixed weights for computing the overall ATS score server-side.
# This prevents the LLM from inventing a different aggregation each time.
SECTION_WEIGHTS = {
    "contact_info": 0.08,
    "professional_summary": 0.12,
    "work_experience": 0.25,
    "education": 0.10,
    "skills": 0.18,
    "projects": 0.12,
    "certifications": 0.05,
    "formatting": 0.10,
}

ATS_SCORING_PROMPT = """You are a STRICT ATS (Applicant Tracking System) resume analyzer. You must evaluate this resume SPECIFICALLY for the TARGET ROLE below. Every section score must reflect how well that section serves a candidate applying for THIS EXACT ROLE — not how good the section is in general.

CRITICAL RULE: The same resume MUST score DIFFERENTLY for different target roles. A machine learning resume should score HIGH for "ML Engineer" but LOW for "Data Analyst" if it lacks core data analyst skills (Excel, SQL reporting, Tableau, etc.). Do NOT give high scores just because content exists — it must be RELEVANT to the target role.

{jd_section}

TARGET ROLE: {target_role}

RESUME TEXT:
{resume_text}

Return your analysis in the following strict JSON format:
{{
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
    "<specific actionable tip mentioning the target role>",
    "<specific actionable tip mentioning the target role>",
    "<specific actionable tip mentioning the target role>",
    "<specific actionable tip mentioning the target role>",
    "<specific actionable tip mentioning the target role>"
  ],
  "summary": "<2-3 sentence assessment that explicitly references the target role>"
}}

IMPORTANT: Do NOT include an "ats_score" field. The overall score will be computed separately.

SCORING RULES — you MUST follow these strictly. Be HARSH, not generous. Real ATS systems reject 75%% of resumes.

1. contact_info (0-100) — role-independent:
   - 100: Full name + phone + email + LinkedIn URL + city/location
   - 80: Name + phone + email + one of (LinkedIn or location)
   - 60: Name + phone + email only
   - 40: Missing phone or email
   - 0: No contact information found

2. professional_summary (0-100) — MUST reference the target role:
   - 100: 2-4 sentence summary that explicitly names "{target_role}", mentions relevant experience duration, and lists 3+ role-specific skills
   - 70: Summary mentions the target role or closely related role, with some relevant skills
   - 50: Generic summary present but does NOT mention "{target_role}" or related role at all
   - 25: Only has an objective statement or one-liner
   - 0: No summary or objective section found

3. work_experience (0-100) — MUST be relevant to "{target_role}":
   - 100: 2+ roles directly relevant to "{target_role}" with quantified achievements, action verbs, and dates
   - 75: 1-2 roles relevant to "{target_role}" with some quantified achievements
   - 50: Has work experience but in unrelated fields (transferable skills only)
   - 25: Has work experience completely irrelevant to "{target_role}"
   - 0: No work experience section found at all

4. education (0-100) — role-independent:
   - 100: Relevant degree + institution + graduation date + GPA/CGPA all clearly listed
   - 80: Degree + institution + graduation date (missing GPA)
   - 60: Only degree and institution listed
   - 30: Incomplete education info
   - 0: No education section found

5. skills (0-100) — THIS IS THE MOST ROLE-SENSITIVE SECTION:
   First, identify the top 15 keywords/skills that a real recruiter would expect for "{target_role}".
   Then count how many of those 15 the resume actually contains.
   - Score = (matched_count / 15) * 100, rounded to nearest 10
   - Example: If resume has 6 out of 15 expected "{target_role}" skills → score = 40
   - Having many skills that are IRRELEVANT to "{target_role}" does NOT increase this score
   - Generic skills like "problem-solving" or "teamwork" do NOT count toward the match

6. projects (0-100) — MUST be relevant to "{target_role}":
   - 100: 3+ projects directly demonstrating "{target_role}" competencies, with tech stack and outcomes
   - 75: 2-3 projects, at least 2 are relevant to "{target_role}"
   - 50: Projects exist but only 1 is somewhat relevant to "{target_role}"
   - 25: Projects exist but are in a completely different domain than "{target_role}"
   - 0: No projects section found

7. certifications (0-100) — MUST be relevant to "{target_role}":
   - 100: 2+ certifications directly relevant to "{target_role}" with issuing authority
   - 75: 1 certification relevant to "{target_role}"
   - 50: Certifications exist but not directly for "{target_role}"
   - 25: Only general coursework or unrelated certifications
   - 0: No certifications section found

8. formatting (0-100) — role-independent:
   - 100: Clean single-column layout, consistent fonts, clear section headings, proper date formatting, 1-2 pages, uses standard ATS-friendly section names
   - 80: Good structure with minor inconsistencies
   - 60: Acceptable but has issues (inconsistent spacing, non-standard section names)
   - 30: Poor structure, hard to parse
   - 0: Uses tables/images/graphics that break ATS parsing

KEYWORD RULES:
- keywords_found: ONLY list skills/keywords from the resume that are genuinely relevant to "{target_role}"
- keywords_missing: List the most important keywords for "{target_role}" that are NOT in the resume. These should be skills a recruiter would search for.
- A skill can appear in the resume but still be in keywords_missing if it's not relevant to "{target_role}"

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
        "temperature": 0,          # deterministic — same input always yields same output
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
        analysis = {"section_scores": {}, "keywords_found": [], "keywords_missing": [], "improvement_tips": ["Ami could not fully analyze this resume. Please try re-scoring."], "summary": "Analysis could not be completed. Please retry scoring."}

    section_scores = analysis.get("section_scores", {})

    # ── Compute overall ATS score server-side using fixed weights ──
    # This is the key fix: the LLM only scores individual sections,
    # the overall score is always a deterministic weighted average.
    weighted_sum = 0.0
    weight_total = 0.0
    for section, weight in SECTION_WEIGHTS.items():
        score = section_scores.get(section)
        if score is not None:
            weighted_sum += score * weight
            weight_total += weight

    if weight_total > 0:
        computed_ats_score = round(weighted_sum / weight_total)
    else:
        computed_ats_score = 50  # fallback

    resume.ats_score = computed_ats_score
    resume.section_scores = section_scores
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
