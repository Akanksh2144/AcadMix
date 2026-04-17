"""
Interview War Room — Resume ATS Scorer Router (thin layer).

All business logic lives in app.services.resume_service.
This router handles: HTTP interface, auth guards, file upload parsing, DB session injection.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from database import get_db
from app.core.security import require_role
from app.services import resume_service

router = APIRouter()


@router.post("/resume/upload")
async def upload_resume(
    file: UploadFile = File(...),
    target_role: Optional[str] = Form(None),
    job_description: Optional[str] = Form(None),
    user: dict = Depends(require_role("student")),
    session: AsyncSession = Depends(get_db),
):
    """Upload a PDF resume. Text is extracted in-memory; file is discarded."""
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    file_bytes = await file.read()
    if len(file_bytes) > 5 * 1024 * 1024:  # 5MB limit
        raise HTTPException(status_code=400, detail="Resume PDF must be under 5MB")

    return await resume_service.upload_resume(
        file_bytes=file_bytes,
        filename=file.filename,
        user=user,
        session=session,
        target_role=target_role,
        job_description=job_description,
    )


@router.post("/resume/{resume_id}/score")
async def score_resume(
    resume_id: str,
    req: dict = None,
    user: dict = Depends(require_role("student")),
    session: AsyncSession = Depends(get_db),
):
    """Run ATS scoring on a previously uploaded resume."""
    return await resume_service.score_resume(resume_id, user, session, req)


@router.get("/resume/history")
async def get_resume_history(
    user: dict = Depends(require_role("student")),
    session: AsyncSession = Depends(get_db),
):
    """List past resume uploads with ATS scores."""
    return await resume_service.get_history(user, session)


@router.get("/resume/latest")
async def get_latest_resume(
    user: dict = Depends(require_role("student")),
    session: AsyncSession = Depends(get_db),
):
    """Get the most recently uploaded resume with full analysis."""
    return await resume_service.get_latest(user, session)
