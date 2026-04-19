"""
Resume Vault Router — Persistent resume storage for students.

Endpoints:
  POST   /resume-vault/upload     — Upload a new resume (PDF/DOCX)
  GET    /resume-vault/            — List all resumes
  GET    /resume-vault/primary     — Get the primary resume
  PATCH  /resume-vault/{id}/primary — Set a resume as primary
  DELETE /resume-vault/{id}        — Delete a resume
  GET    /resume-vault/{id}/download — Download resume file
"""
import logging
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from app.core.security import get_current_user
from app.services.resume_vault_service import ResumeVaultService
from app.core import storage

logger = logging.getLogger("acadmix.resume_vault")
router = APIRouter()


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Upload a new resume (PDF or DOCX). Max 2MB, max 5 resumes per student."""
    content_type = file.content_type or "application/octet-stream"
    file_bytes = await file.read()

    svc = ResumeVaultService(session)
    return await svc.upload(
        file_bytes=file_bytes,
        filename=file.filename or "resume",
        content_type=content_type,
        user=user,
    )


@router.get("/")
async def list_resumes(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """List all resumes for the authenticated student."""
    svc = ResumeVaultService(session)
    return await svc.list_resumes(user)


@router.get("/primary")
async def get_primary_resume(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Get the primary resume (used for one-click apply)."""
    svc = ResumeVaultService(session)
    result = await svc.get_primary(user)
    if not result:
        raise HTTPException(status_code=404, detail="No primary resume found. Upload one first.")
    return result


@router.patch("/{resume_id}/primary")
async def set_primary_resume(
    resume_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Set a resume as the primary (default for one-click apply)."""
    svc = ResumeVaultService(session)
    return await svc.set_primary(resume_id, user)


@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Delete a resume from the vault and R2 storage."""
    svc = ResumeVaultService(session)
    return await svc.delete_resume(resume_id, user)


@router.get("/{resume_id}/download")
async def download_resume(
    resume_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Generate a presigned download URL for a resume."""
    from sqlalchemy.future import select
    from app import models

    stmt = select(models.StudentResume).where(
        models.StudentResume.id == resume_id,
        models.StudentResume.student_id == user["id"],
        models.StudentResume.college_id == user["college_id"],
        models.StudentResume.is_deleted == False,
    )
    result = await session.execute(stmt)
    resume = result.scalars().first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Try presigned URL first, fall back to stored URL
    presigned = storage.generate_presigned_url(resume.storage_key, expires_in=3600)
    target_url = presigned or resume.file_url

    import httpx
    from starlette.responses import StreamingResponse

    async def stream_file():
        async with httpx.AsyncClient() as client:
            async with client.stream("GET", target_url) as response:
                async for chunk in response.aiter_bytes():
                    yield chunk

    return StreamingResponse(
        stream_file(),
        media_type=resume.content_type or "application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{resume.filename}"'}
    )
