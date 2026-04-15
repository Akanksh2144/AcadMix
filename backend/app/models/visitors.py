"""
Visitor Management Module — Database Models
=============================================
Two-tier visitor tracking for AcadMix:
  - ``Visitor``: master identity record (phone-based upsert)
  - ``VisitRecord``: each visit event with check-in → check-out lifecycle

Supports both main-gate campus visitors (security role) and hostel-specific
visitors (warden role) via the ``gate_type`` discriminator.
"""

from sqlalchemy import (
    Column, String, Integer, Float, ForeignKey, DateTime, Boolean,
    Index, UniqueConstraint, Date, CheckConstraint, Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func, text
import uuid
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

from app.models.core import SoftDeleteMixin


# ═══════════════════════════════════════════════════════════════════════════════
# VISITOR — Master identity record (phone-based deduplication)
# ═══════════════════════════════════════════════════════════════════════════════

class Visitor(Base, SoftDeleteMixin):
    """
    Represents a unique visitor identity. Phone number is the dedup key
    within a college. Repeat visitors are looked up and linked automatically.
    """
    __tablename__ = "visitors"
    id              = Column(String, primary_key=True, index=True, default=generate_uuid)
    college_id      = Column(String, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False)
    name            = Column(String, nullable=False)
    phone           = Column(String, nullable=False)
    email           = Column(String, nullable=True)
    id_proof_type   = Column(String, nullable=True)   # Aadhaar, PAN, Driving License, Passport, etc.
    id_proof_number = Column(String, nullable=True)
    photo_url       = Column(String, nullable=True)
    visitor_type    = Column(String, nullable=False, server_default="other")
    total_visits    = Column(Integer, nullable=False, server_default=text('0'))
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_visitor_college_phone", "college_id", "phone"),
        Index("ix_visitor_college_name", "college_id", "name"),
        CheckConstraint(
            "visitor_type IN ('parent', 'industry', 'delivery', 'official', "
            "'interview_candidate', 'alumni', 'other')",
            name="ck_visitor_type"
        ),
    )


# ═══════════════════════════════════════════════════════════════════════════════
# VISIT RECORD — Individual visit event with lifecycle tracking
# ═══════════════════════════════════════════════════════════════════════════════

class VisitRecord(Base, SoftDeleteMixin):
    """
    Each row tracks a single visit from entry to exit.
    Status flow:
        pre_approved → checked_in → checked_out
        pending → approved → checked_in → checked_out
        pending → rejected
        pre_approved → expired (auto via sweep)
    """
    __tablename__ = "visit_records"
    id                  = Column(String, primary_key=True, index=True, default=generate_uuid)
    college_id          = Column(String, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False)
    visitor_id          = Column(String, ForeignKey("visitors.id", ondelete="CASCADE"), nullable=False)

    # Gate context — discriminator for main gate vs hostel
    gate_type           = Column(String, nullable=False, server_default="main_gate")  # main_gate, hostel
    hostel_id           = Column(String, ForeignKey("hostels.id", ondelete="SET NULL"), nullable=True)  # NULL for main_gate

    # Host info (who the visitor is meeting)
    host_id             = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    host_name           = Column(String, nullable=True)
    host_department     = Column(String, nullable=True)

    # Visit details
    purpose             = Column(String, nullable=False)
    visit_type          = Column(String, nullable=False, server_default="walk_in")  # walk_in, pre_approved
    status              = Column(String, nullable=False, server_default="pending")
    num_accompanying    = Column(Integer, nullable=False, server_default=text('0'))
    vehicle_number      = Column(String, nullable=True)
    badge_number        = Column(String, nullable=True)

    # Scheduling (for pre-approved visits)
    expected_arrival    = Column(DateTime(timezone=True), nullable=True)
    expected_departure  = Column(DateTime(timezone=True), nullable=True)

    # Actual timestamps
    checked_in_at       = Column(DateTime(timezone=True), nullable=True)
    checked_out_at      = Column(DateTime(timezone=True), nullable=True)
    checked_in_by       = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    checked_out_by      = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Approval
    approved_by         = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at         = Column(DateTime(timezone=True), nullable=True)
    remarks             = Column(Text, nullable=True)

    created_at          = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_visit_college_status", "college_id", "status"),
        Index("ix_visit_visitor_date", "visitor_id", "created_at"),
        Index("ix_visit_gate_type", "college_id", "gate_type", "status"),
        Index("ix_visit_hostel", "hostel_id", "status", postgresql_where=text("hostel_id IS NOT NULL")),
        Index("ix_visit_host", "host_id", "status"),
        CheckConstraint(
            "gate_type IN ('main_gate', 'hostel')",
            name="ck_visit_gate_type"
        ),
        CheckConstraint(
            "visit_type IN ('walk_in', 'pre_approved')",
            name="ck_visit_type"
        ),
        CheckConstraint(
            "status IN ('pending', 'pre_approved', 'approved', 'checked_in', "
            "'checked_out', 'rejected', 'expired')",
            name="ck_visit_status"
        ),
    )
