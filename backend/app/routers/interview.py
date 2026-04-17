"""
Interview War Room — AI Mock Interview Router (thin layer).

All business logic lives in app.services.interview_service.
This router handles: HTTP interface, auth guards, DB session injection.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from app.core.security import require_role
from app.services import interview_service

router = APIRouter()


@router.get("/interview/quota")
async def get_interview_quota(
    user: dict = Depends(require_role("student")),
    session: AsyncSession = Depends(get_db),
):
    """Returns the student's remaining mock interview quota for the current month."""
    return await interview_service.get_quota(user, session)


@router.post("/interview/start")
async def start_interview(
    req: dict,
    user: dict = Depends(require_role("student")),
    session: AsyncSession = Depends(get_db),
):
    """Start a new mock interview session."""
    return await interview_service.start_interview(req, user, session)


@router.post("/interview/{interview_id}/message")
async def send_message(
    interview_id: str,
    req: dict,
    user: dict = Depends(require_role("student")),
    session: AsyncSession = Depends(get_db),
):
    """Send the student's response and get the AI's next question."""
    content = req.get("content", "")
    return await interview_service.send_message(interview_id, content, user, session)


@router.post("/interview/{interview_id}/end")
async def end_interview(
    interview_id: str,
    user: dict = Depends(require_role("student")),
    session: AsyncSession = Depends(get_db),
):
    """End the interview session and queue AI feedback generation."""
    return await interview_service.end_interview(interview_id, user, session)


@router.get("/interview/history")
async def get_interview_history(
    user: dict = Depends(require_role("student")),
    session: AsyncSession = Depends(get_db),
):
    """List past interview sessions with scores."""
    return await interview_service.get_history(user, session)


@router.get("/interview/readiness")
async def get_interview_readiness(
    user: dict = Depends(require_role("student")),
    session: AsyncSession = Depends(get_db),
):
    """Calculate aggregate interview readiness score."""
    return await interview_service.get_readiness(user, session)


@router.get("/interview/{interview_id}")
async def get_interview_detail(
    interview_id: str,
    user: dict = Depends(require_role("student")),
    session: AsyncSession = Depends(get_db),
):
    """Get full transcript + feedback for a specific interview session."""
    return await interview_service.get_detail(interview_id, user, session)
