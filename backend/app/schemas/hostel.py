"""
Hostel Management Module — Pydantic Schemas
============================================
Request/response models for the hostel booking funnel,
warden admin operations, and gate pass workflows.
"""

from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime


# ═══════════════════════════════════════════════════════════════════════════════
# ROOM TEMPLATES
# ═══════════════════════════════════════════════════════════════════════════════

class BedLayoutItem(BaseModel):
    identifier: str          # "A1", "B2", "Window-Lower"
    row: int
    col: int
    category: str = "Standard"  # "Window (Premium)", "Aisle (Standard)"
    is_premium: bool = False
    base_fee: float = 0.0


class RoomTemplateCreate(BaseModel):
    name: str
    total_capacity: int
    grid_rows: int
    grid_cols: int
    beds: List[BedLayoutItem]
    meta_data: Optional[dict] = None  # room_decorators, etc.


class RoomTemplateResponse(BaseModel):
    id: str
    name: str
    total_capacity: int
    grid_rows: int
    grid_cols: int
    bed_layout: list
    meta_data: Optional[dict] = None


# ═══════════════════════════════════════════════════════════════════════════════
# HOSTELS
# ═══════════════════════════════════════════════════════════════════════════════

class HostelCreate(BaseModel):
    name: str
    gender_type: str = Field("coed", pattern="^(male|female|coed)$")
    total_floors: int = 1
    warden_id: Optional[str] = None
    meta_data: Optional[dict] = None  # floor_layout per floor


class HostelResponse(BaseModel):
    id: str
    name: str
    gender_type: str
    total_floors: int
    total_capacity: int
    warden_id: Optional[str] = None
    available_beds: int = 0  # populated from Redis cache


# ═══════════════════════════════════════════════════════════════════════════════
# ROOMS
# ═══════════════════════════════════════════════════════════════════════════════

class RoomCreate(BaseModel):
    hostel_id: str
    room_number: str
    floor: int
    template_id: str


class BulkRoomCreate(BaseModel):
    """Generate rooms for a range of floors from a template."""
    template_id: str
    floor_start: int = 1
    floor_end: int = 1
    rooms_per_floor: int = 10
    room_number_prefix: str = "R"  # e.g. "R" → R101, R102...


class RoomSummary(BaseModel):
    id: str
    room_number: str
    floor: int
    capacity: int
    available_count: int = 0
    premium_count: int = 0
    template_name: Optional[str] = None
    meta_data: Optional[dict] = None  # ac, bathroom, amenities, wing


# ═══════════════════════════════════════════════════════════════════════════════
# BEDS — Booking funnel
# ═══════════════════════════════════════════════════════════════════════════════

class BedGridItem(BaseModel):
    id: str
    bed_identifier: str
    grid_row: int
    grid_col: int
    category: Optional[str] = None
    is_premium: bool = False
    selection_fee: float = 0.0
    status: str = "AVAILABLE"   # AVAILABLE, LOCKED, BOOKED, MAINTENANCE


class RoomGridResponse(BaseModel):
    room_id: str
    room_number: str
    hostel_name: str
    grid_rows: int
    grid_cols: int
    beds: List[BedGridItem]
    meta_data: Optional[dict] = None  # room_decorators from template


class BedLockRequest(BaseModel):
    bed_id: str


class BedLockResponse(BaseModel):
    bed_id: str
    selection_fee: float
    is_premium: bool
    lock_expires_at: str  # ISO datetime


class BedBookConfirm(BaseModel):
    bed_id: str
    payment_reference: str = ""  # empty for free beds


# ═══════════════════════════════════════════════════════════════════════════════
# GATE PASSES
# ═══════════════════════════════════════════════════════════════════════════════

class GatePassApply(BaseModel):
    reason: str = Field(..., max_length=500)
    requested_exit: str    # ISO datetime
    expected_return: str   # ISO datetime


class GatePassReview(BaseModel):
    action: str = Field(..., pattern="^(approve|reject)$")
    remarks: Optional[str] = None


class GatePassResponse(BaseModel):
    id: str
    student_id: str
    student_name: Optional[str] = None
    reason: str
    requested_exit: str
    expected_return: str
    actual_return: Optional[str] = None
    approval_status: str
    remarks: Optional[str] = None
    created_at: str


# ═══════════════════════════════════════════════════════════════════════════════
# BED TOGGLE (Admin/Warden)
# ═══════════════════════════════════════════════════════════════════════════════

class BedTogglePremium(BaseModel):
    is_premium: bool
    selection_fee: float = 0.0


class BedSetMaintenance(BaseModel):
    status: str = Field(..., pattern="^(AVAILABLE|MAINTENANCE)$")
