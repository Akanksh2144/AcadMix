"""
Notification models — in-app notifications + browser push subscriptions.
"""
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Index, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func, text
import uuid
from database import Base
from app.models.core import SoftDeleteMixin


def generate_uuid():
    return str(uuid.uuid4())


class Notification(Base, SoftDeleteMixin):
    """Persisted in-app notifications for all users."""
    __tablename__ = "notifications"
    id                  = Column(String, primary_key=True, index=True, default=generate_uuid)
    user_id             = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    college_id          = Column(String, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False, index=True)
    title               = Column(String, nullable=False)
    message             = Column(Text, nullable=True)
    type                = Column(String, nullable=False, server_default='general')
    # Types: placement, quiz, assessment, announcement, fee, hostel, transport, general
    related_entity_id   = Column(String, nullable=True)     # e.g. drive_id, quiz_id
    related_entity_type = Column(String, nullable=True)     # e.g. "placement_drive", "quiz"
    is_read             = Column(Boolean, nullable=False, server_default=text('false'))
    created_at          = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_notifications_user_read", "user_id", "is_read"),
        Index("ix_notifications_user_created", "user_id", "created_at"),
    )


class PushSubscription(Base):
    """Web Push API subscription per user per device."""
    __tablename__ = "push_subscriptions"
    id          = Column(String, primary_key=True, index=True, default=generate_uuid)
    user_id     = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    college_id  = Column(String, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False)
    endpoint    = Column(Text, nullable=False)               # Push service URL
    keys        = Column(JSONB, nullable=False)               # { p256dh, auth }
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_push_sub_user", "user_id"),
    )
