"""
Resume Vault Service — Persistent resume storage with R2 backend.

Handles:
- Upload resume (PDF/DOCX) → extract text → store in R2 → save metadata
- List / delete / set-primary operations
- DOCX text extraction
"""
import io
import os
import logging
from typing import Optional, List

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app import models
from app.core.config import settings
from app.core import storage
from app.services.resume_service import extract_pdf_text

logger = logging.getLogger("acadmix.resume_vault")

# Allowed MIME types
ALLOWED_TYPES = {
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
}


async def extract_docx_text(file_bytes: bytes) -> str:
    """Extract text from a DOCX file."""
    try:
        from docx import Document
        doc = Document(io.BytesIO(file_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        full_text = "\n".join(paragraphs).strip()
        if full_text:
            return full_text
    except Exception as e:
        logger.warning("DOCX extraction failed: %s", e)

    raise HTTPException(
        status_code=422,
        detail="Could not extract text from the DOCX file. Ensure it's a valid Word document."
    )


async def extract_text(file_bytes: bytes, content_type: str) -> str:
    """Extract text from PDF or DOCX."""
    if content_type == "application/pdf":
        return await extract_pdf_text(file_bytes)
    elif "wordprocessingml" in content_type:
        return await extract_docx_text(file_bytes)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {content_type}")


class ResumeVaultService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def upload(
        self,
        file_bytes: bytes,
        filename: str,
        content_type: str,
        user: dict,
    ) -> dict:
        """Upload a resume to R2 and create a database record."""
        college_id = user["college_id"]
        student_id = user["id"]

        # Validate file type
        if content_type not in ALLOWED_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Only PDF and DOCX files are allowed. Got: {content_type}"
            )

        # Validate file size
        max_bytes = settings.STORAGE_MAX_FILE_SIZE_MB * 1024 * 1024
        if len(file_bytes) > max_bytes:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size is {settings.STORAGE_MAX_FILE_SIZE_MB}MB."
            )

        # Check resume count limit
        count_stmt = select(func.count(models.StudentResume.id)).where(
            models.StudentResume.student_id == student_id,
            models.StudentResume.college_id == college_id,
            models.StudentResume.is_deleted == False,
        )
        current_count = (await self.db.execute(count_stmt)).scalar() or 0
        if current_count >= settings.STORAGE_MAX_RESUMES_PER_STUDENT:
            raise HTTPException(
                status_code=400,
                detail=f"Maximum {settings.STORAGE_MAX_RESUMES_PER_STUDENT} resumes allowed. Delete an old one first."
            )

        # Extract text for ATS/job matching
        parsed_text = await extract_text(file_bytes, content_type)

        # Compute version number
        version_stmt = select(func.coalesce(func.max(models.StudentResume.version), 0)).where(
            models.StudentResume.student_id == student_id,
            models.StudentResume.college_id == college_id,
        )
        max_version = (await self.db.execute(version_stmt)).scalar() or 0
        new_version = max_version + 1

        # Upload to R2
        storage_key = storage.generate_storage_key(
            college_id=college_id,
            bucket_prefix=f"resumes/{student_id}",
            filename=filename,
        )
        file_url = storage.upload_file(file_bytes, storage_key, content_type)

        # Set as primary if this is the first resume
        is_first = current_count == 0

        resume = models.StudentResume(
            college_id=college_id,
            student_id=student_id,
            filename=filename,
            storage_key=storage_key,
            file_url=file_url,
            content_type=content_type,
            file_size=len(file_bytes),
            parsed_text=parsed_text,
            is_primary=is_first,
            version=new_version,
        )
        self.db.add(resume)
        await self.db.commit()

        logger.info(
            "Resume uploaded: student=%s file=%s version=%d size=%d",
            student_id, filename, new_version, len(file_bytes)
        )

        return {
            "id": resume.id,
            "filename": resume.filename,
            "file_url": resume.file_url,
            "version": resume.version,
            "is_primary": resume.is_primary,
            "file_size": resume.file_size,
            "parsed_text_length": len(parsed_text) if parsed_text else 0,
        }

    async def list_resumes(self, user: dict) -> List[dict]:
        """List all resumes for a student."""
        stmt = (
            select(models.StudentResume)
            .where(
                models.StudentResume.student_id == user["id"],
                models.StudentResume.college_id == user["college_id"],
                models.StudentResume.is_deleted == False,
            )
            .order_by(models.StudentResume.created_at.desc())
        )
        result = await self.db.execute(stmt)
        resumes = result.scalars().all()

        return [
            {
                "id": r.id,
                "filename": r.filename,
                "file_url": r.file_url,
                "content_type": r.content_type,
                "file_size": r.file_size,
                "version": r.version,
                "is_primary": r.is_primary,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in resumes
        ]

    async def get_primary(self, user: dict) -> Optional[dict]:
        """Get the primary resume for one-click apply."""
        stmt = select(models.StudentResume).where(
            models.StudentResume.student_id == user["id"],
            models.StudentResume.college_id == user["college_id"],
            models.StudentResume.is_primary == True,
            models.StudentResume.is_deleted == False,
        )
        result = await self.db.execute(stmt)
        resume = result.scalars().first()
        if not resume:
            return None

        return {
            "id": resume.id,
            "filename": resume.filename,
            "file_url": resume.file_url,
            "parsed_text": resume.parsed_text,
            "version": resume.version,
        }

    async def set_primary(self, resume_id: str, user: dict) -> dict:
        """Set a resume as the primary (default for one-click apply)."""
        student_id = user["id"]
        college_id = user["college_id"]

        # Verify resume belongs to this student
        stmt = select(models.StudentResume).where(
            models.StudentResume.id == resume_id,
            models.StudentResume.student_id == student_id,
            models.StudentResume.college_id == college_id,
            models.StudentResume.is_deleted == False,
        )
        result = await self.db.execute(stmt)
        target = result.scalars().first()
        if not target:
            raise HTTPException(status_code=404, detail="Resume not found")

        # Unset all other primaries for this student
        all_stmt = select(models.StudentResume).where(
            models.StudentResume.student_id == student_id,
            models.StudentResume.college_id == college_id,
            models.StudentResume.is_deleted == False,
            models.StudentResume.is_primary == True,
        )
        all_result = await self.db.execute(all_stmt)
        for r in all_result.scalars().all():
            r.is_primary = False

        target.is_primary = True
        await self.db.commit()

        return {"id": target.id, "filename": target.filename, "is_primary": True}

    async def delete_resume(self, resume_id: str, user: dict) -> dict:
        """Soft-delete a resume and remove from R2."""
        stmt = select(models.StudentResume).where(
            models.StudentResume.id == resume_id,
            models.StudentResume.student_id == user["id"],
            models.StudentResume.college_id == user["college_id"],
            models.StudentResume.is_deleted == False,
        )
        result = await self.db.execute(stmt)
        resume = result.scalars().first()
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")

        was_primary = resume.is_primary

        # Soft delete in DB
        resume.is_deleted = True
        resume.is_primary = False

        # Delete from R2
        storage.delete_file(resume.storage_key)

        # If it was primary, promote the most recent remaining resume
        if was_primary:
            next_stmt = (
                select(models.StudentResume)
                .where(
                    models.StudentResume.student_id == user["id"],
                    models.StudentResume.college_id == user["college_id"],
                    models.StudentResume.is_deleted == False,
                )
                .order_by(models.StudentResume.created_at.desc())
                .limit(1)
            )
            next_result = await self.db.execute(next_stmt)
            next_resume = next_result.scalars().first()
            if next_resume:
                next_resume.is_primary = True

        await self.db.commit()
        return {"deleted": True, "id": resume_id}
