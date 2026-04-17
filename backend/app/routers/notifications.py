"""
Notification endpoints — in-app notification feed + browser push subscription.
"""
from fastapi import APIRouter, Depends, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from typing import Optional

from database import get_db
from app.core.security import get_current_user
from app.core.response import mark_enveloped
from app.models.notifications import Notification, PushSubscription

router = APIRouter()

# NOTE: mark_enveloped is applied per-endpoint (not router-level) because
# GET /notifications returns {"data": [...], "unread_count": N} — an already-
# enveloped shape that lacks "error", so the heuristic won't catch it.
# Other endpoints (POST mark-read, push-subscribe) return flat {"success": true}
# and ARE intentionally Bucket B (wrapped by middleware).
# If you add a new GET endpoint that returns {"data": ...}, add
# dependencies=[Depends(mark_enveloped)] to its decorator.


@router.get("/notifications", dependencies=[Depends(mark_enveloped)])
async def get_notifications(
    limit: int = 30,
    unread_only: bool = False,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Get recent notifications for the current user."""
    stmt = (
        select(Notification)
        .where(
            Notification.user_id == user["id"],
            Notification.is_deleted == False,
        )
        .order_by(Notification.created_at.desc())
        .limit(limit)
    )
    if unread_only:
        stmt = stmt.where(Notification.is_read == False)

    result = await session.execute(stmt)
    notifs = result.scalars().all()

    # Unread count
    unread_count = (await session.execute(
        select(func.count(Notification.id)).where(
            Notification.user_id == user["id"],
            Notification.is_read == False,
            Notification.is_deleted == False,
        )
    )).scalar() or 0

    return {
        "data": [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "type": n.type,
                "related_entity_id": n.related_entity_id,
                "related_entity_type": n.related_entity_type,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            }
            for n in notifs
        ],
        "unread_count": unread_count,
    }


@router.put("/notifications/{notification_id}/read")
async def mark_read(
    notification_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Mark a single notification as read."""
    stmt = (
        update(Notification)
        .where(Notification.id == notification_id, Notification.user_id == user["id"])
        .values(is_read=True)
    )
    await session.execute(stmt)
    await session.commit()
    return {"success": True}


@router.put("/notifications/read-all")
async def mark_all_read(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Mark all notifications as read for the current user."""
    stmt = (
        update(Notification)
        .where(
            Notification.user_id == user["id"],
            Notification.is_read == False,
            Notification.is_deleted == False,
        )
        .values(is_read=True)
    )
    await session.execute(stmt)
    await session.commit()
    return {"success": True}


# ════════════════════════════════════════════════════════════════════════════════
# Browser Push Subscriptions
# ════════════════════════════════════════════════════════════════════════════════

@router.post("/notifications/subscribe")
async def subscribe_push(
    subscription: dict = Body(...),
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Store a Web Push subscription for browser notifications."""
    endpoint = subscription.get("endpoint")
    keys = subscription.get("keys", {})

    if not endpoint:
        return {"success": False, "error": "Missing endpoint"}

    # Upsert — avoid duplicate subscriptions for same endpoint
    existing = await session.execute(
        select(PushSubscription).where(
            PushSubscription.user_id == user["id"],
            PushSubscription.endpoint == endpoint,
        )
    )
    if existing.scalar_one_or_none():
        return {"success": True, "message": "Already subscribed"}

    sub = PushSubscription(
        user_id=user["id"],
        college_id=user["college_id"],
        endpoint=endpoint,
        keys=keys,
    )
    session.add(sub)
    await session.commit()
    return {"success": True}


@router.post("/notifications/unsubscribe")
async def unsubscribe_push(
    endpoint: str = Body(..., embed=True),
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Remove a Web Push subscription."""
    stmt = select(PushSubscription).where(
        PushSubscription.user_id == user["id"],
        PushSubscription.endpoint == endpoint,
    )
    result = await session.execute(stmt)
    sub = result.scalar_one_or_none()
    if sub:
        await session.delete(sub)
        await session.commit()
    return {"success": True}
