"""
Hostel Management Module — Database Models
===========================================
Implements the sleeper-bus-style bed selection system with:
  - Parametric room templates (admin-defined grid layouts)
  - Bed-level granularity for premium monetization
  - Concurrency-safe locking via SELECT FOR UPDATE NOWAIT
  - Gate pass tracking with warden approval workflow
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
# ROOM TEMPLATES — Parametric layout blueprints (system-level, not per-college)
# ═══════════════════════════════════════════════════════════════════════════════

class RoomTemplate(Base, SoftDeleteMixin):
    """
    A reusable layout blueprint for rooms. Contains a JSON array describing
    the physical grid of beds so the frontend can render a CSS grid.

    bed_layout JSONB shape:
    [
        {"identifier": "A1", "row": 1, "col": 1, "category": "Window (Premium)", "is_premium": true, "base_fee": 500.00},
        {"identifier": "A2", "row": 1, "col": 2, "category": "Aisle (Standard)", "is_premium": false, "base_fee": 0.00},
        ...
    ]
    """
    __tablename__ = "room_templates"
    id             = Column(String, primary_key=True, index=True, default=generate_uuid)
    college_id     = Column(String, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=True)  # NULL = global/system template
    name           = Column(String, nullable=False)
    total_capacity = Column(Integer, nullable=False)
    grid_rows      = Column(Integer, nullable=False)
    grid_cols      = Column(Integer, nullable=False)
    bed_layout     = Column(JSONB, nullable=False)  # Array of bed definitions
    meta_data      = Column(JSONB, nullable=True, server_default=text("'{}'"))  # room_decorators, etc.
    created_at     = Column(DateTime(timezone=True), server_default=func.now())


# ═══════════════════════════════════════════════════════════════════════════════
# HOSTELS — Building-level data
# ═══════════════════════════════════════════════════════════════════════════════

class Hostel(Base, SoftDeleteMixin):
    __tablename__ = "hostels"
    id             = Column(String, primary_key=True, index=True, default=generate_uuid)
    college_id     = Column(String, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False)
    name           = Column(String, nullable=False)
    warden_id      = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    total_capacity = Column(Integer, nullable=False, server_default=text('0'))
    gender_type    = Column(String, nullable=False, server_default="coed")  # male, female, coed
    total_floors   = Column(Integer, nullable=False, server_default=text('1'))
    meta_data      = Column(JSONB, nullable=True, server_default=text("'{}'"))  # floor_layout per floor
    created_at     = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_hostel_college_gender", "college_id", "gender_type"),
        CheckConstraint("gender_type IN ('male', 'female', 'coed')", name="ck_hostel_gender"),
    )


# ═══════════════════════════════════════════════════════════════════════════════
# ROOMS — Individual room units within a hostel
# ═══════════════════════════════════════════════════════════════════════════════

class Room(Base, SoftDeleteMixin):
    __tablename__ = "rooms"
    id             = Column(String, primary_key=True, index=True, default=generate_uuid)
    college_id     = Column(String, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False)
    hostel_id      = Column(String, ForeignKey("hostels.id", ondelete="CASCADE"), nullable=False)
    template_id    = Column(String, ForeignKey("room_templates.id", ondelete="SET NULL"), nullable=True)
    room_number    = Column(String, nullable=False)
    floor          = Column(Integer, nullable=False, server_default=text('1'))
    capacity       = Column(Integer, nullable=False, server_default=text('0'))
    meta_data      = Column(JSONB, nullable=True, server_default=text("'{}'"))  # ac, attached_bathroom, amenities, wing

    __table_args__ = (
        UniqueConstraint("hostel_id", "room_number", name="uq_hostel_room_number"),
        Index("ix_room_hostel_floor", "hostel_id", "floor"),
    )


# ═══════════════════════════════════════════════════════════════════════════════
# BEDS — Granular bed-level state for sleeper-bus booking
# ═══════════════════════════════════════════════════════════════════════════════

class Bed(Base, SoftDeleteMixin):
    """
    Each bed is an individually bookable unit within a room.
    status flow: AVAILABLE → LOCKED (10min hold) → BOOKED
                 LOCKED → AVAILABLE (expired by ARQ sweep)
    """
    __tablename__ = "beds"
    id              = Column(String, primary_key=True, index=True, default=generate_uuid)
    college_id      = Column(String, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False)
    room_id         = Column(String, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    bed_identifier  = Column(String, nullable=False)  # e.g. "A1", "B2", "Window-Lower"
    grid_row        = Column(Integer, nullable=False)
    grid_col        = Column(Integer, nullable=False)
    category        = Column(String, nullable=True)     # "Window (Premium)", "Aisle (Standard)"
    is_premium      = Column(Boolean, nullable=False, server_default=text('false'))
    selection_fee   = Column(Float, nullable=False, server_default=text('0.0'))
    status          = Column(String, nullable=False, server_default="AVAILABLE")  # AVAILABLE, LOCKED, BOOKED, MAINTENANCE
    locked_at       = Column(DateTime(timezone=True), nullable=True)
    locked_by       = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    __table_args__ = (
        UniqueConstraint("room_id", "bed_identifier", name="uq_room_bed"),
        Index("ix_beds_room_status", "room_id", "status"),
        Index("ix_beds_locked_sweep", "locked_at", postgresql_where=text("status = 'LOCKED'")),
        CheckConstraint("status IN ('AVAILABLE', 'LOCKED', 'BOOKED', 'MAINTENANCE')", name="ck_bed_status"),
    )


# ═══════════════════════════════════════════════════════════════════════════════
# ALLOCATIONS — Final student ↔ bed mapping
# ═══════════════════════════════════════════════════════════════════════════════

class Allocation(Base, SoftDeleteMixin):
    __tablename__ = "allocations"
    id                = Column(String, primary_key=True, index=True, default=generate_uuid)
    college_id        = Column(String, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False)
    student_id        = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    bed_id            = Column(String, ForeignKey("beds.id", ondelete="RESTRICT"), nullable=False)
    room_id           = Column(String, ForeignKey("rooms.id", ondelete="RESTRICT"), nullable=False)
    hostel_id         = Column(String, ForeignKey("hostels.id", ondelete="RESTRICT"), nullable=False)
    academic_year     = Column(String, nullable=False)
    status            = Column(String, nullable=False, server_default="active")  # active, vacated, transferred
    selection_fee_paid = Column(Float, nullable=False, server_default=text('0.0'))
    payment_reference = Column(String, nullable=True)  # Razorpay order_id::payment_id
    allocated_at      = Column(DateTime(timezone=True), server_default=func.now())
    vacated_at        = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("ix_alloc_student_year", "student_id", "academic_year"),
        Index("ix_alloc_hostel_status", "hostel_id", "status"),
    )


# ═══════════════════════════════════════════════════════════════════════════════
# GATE PASSES — Leave & entry tracking
# ═══════════════════════════════════════════════════════════════════════════════

class GatePass(Base, SoftDeleteMixin):
    __tablename__ = "gatepasses"
    id                  = Column(String, primary_key=True, index=True, default=generate_uuid)
    college_id          = Column(String, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False)
    student_id          = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    hostel_id           = Column(String, ForeignKey("hostels.id", ondelete="CASCADE"), nullable=False)
    reason              = Column(String, nullable=False)
    requested_exit      = Column(DateTime(timezone=True), nullable=False)
    expected_return     = Column(DateTime(timezone=True), nullable=False)
    actual_return       = Column(DateTime(timezone=True), nullable=True)
    approval_status     = Column(String, nullable=False, server_default="pending")  # pending, approved, rejected, expired
    approved_by         = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at         = Column(DateTime(timezone=True), nullable=True)
    remarks             = Column(String, nullable=True)
    created_at          = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_gatepass_student_status", "student_id", "approval_status"),
        Index("ix_gatepass_hostel_pending", "hostel_id", "approval_status"),
        CheckConstraint(
            "approval_status IN ('pending', 'approved', 'rejected', 'expired')",
            name="ck_gatepass_status"
        ),
    )
