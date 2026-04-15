"""
Visitor Management Module — Pydantic Schemas
==============================================
Request/response models for visitor registration, check-in/out,
pre-approval, and historical log queries.
"""

from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime


# ═══════════════════════════════════════════════════════════════════════════════
# VISITOR — Master identity
# ═══════════════════════════════════════════════════════════════════════════════

class VisitorCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    phone: str = Field(..., min_length=10, max_length=15)
    email: Optional[str] = None
    id_proof_type: Optional[str] = None
    id_proof_number: Optional[str] = None
    visitor_type: str = Field("other", pattern="^(parent|industry|delivery|official|interview_candidate|alumni|other)$")


class VisitorResponse(BaseModel):
    id: str
    name: str
    phone: str
    email: Optional[str] = None
    id_proof_type: Optional[str] = None
    id_proof_number: Optional[str] = None
    visitor_type: str
    total_visits: int = 0
    created_at: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# VISIT RECORD — Walk-in + Check-in
# ═══════════════════════════════════════════════════════════════════════════════

class VisitCheckIn(BaseModel):
    """Used for walk-in registration + immediate check-in."""
    # Visitor identity (can reference existing visitor_id or provide details)
    visitor_id: Optional[str] = None
    visitor_name: Optional[str] = None
    visitor_phone: Optional[str] = None
    visitor_type: str = "other"

    # Gate context
    gate_type: str = Field("main_gate", pattern="^(main_gate|hostel)$")
    hostel_id: Optional[str] = None

    # Visit details
    purpose: str = Field(..., min_length=1, max_length=500)
    host_name: Optional[str] = None
    host_department: Optional[str] = None
    num_accompanying: int = Field(0, ge=0, le=50)
    vehicle_number: Optional[str] = None
    badge_number: Optional[str] = None
    remarks: Optional[str] = None


class VisitCheckOut(BaseModel):
    visit_id: str
    remarks: Optional[str] = None


class VisitPreApprove(BaseModel):
    """Staff pre-approves an expected visitor."""
    visitor_name: str = Field(..., min_length=1, max_length=200)
    visitor_phone: str = Field(..., min_length=10, max_length=15)
    visitor_type: str = "other"

    gate_type: str = Field("main_gate", pattern="^(main_gate|hostel)$")
    hostel_id: Optional[str] = None

    purpose: str = Field(..., min_length=1, max_length=500)
    expected_arrival: str       # ISO datetime
    expected_departure: Optional[str] = None
    num_accompanying: int = Field(0, ge=0, le=50)
    vehicle_number: Optional[str] = None
    remarks: Optional[str] = None


class VisitApprovalAction(BaseModel):
    action: str = Field(..., pattern="^(approve|reject)$")
    remarks: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# RESPONSES
# ═══════════════════════════════════════════════════════════════════════════════

class VisitRecordResponse(BaseModel):
    id: str
    visitor_id: str
    visitor_name: str
    visitor_phone: str
    visitor_type: str = "other"
    gate_type: str = "main_gate"
    hostel_name: Optional[str] = None
    host_name: Optional[str] = None
    host_department: Optional[str] = None
    purpose: str
    visit_type: str
    status: str
    num_accompanying: int = 0
    vehicle_number: Optional[str] = None
    badge_number: Optional[str] = None
    expected_arrival: Optional[str] = None
    expected_departure: Optional[str] = None
    checked_in_at: Optional[str] = None
    checked_out_at: Optional[str] = None
    checked_in_by_name: Optional[str] = None
    checked_out_by_name: Optional[str] = None
    approved_by_name: Optional[str] = None
    remarks: Optional[str] = None
    duration_minutes: Optional[int] = None
    created_at: Optional[str] = None


class VisitorDashboardStats(BaseModel):
    total_today: int = 0
    currently_in_campus: int = 0
    checked_out_today: int = 0
    pending_approval: int = 0
    pre_approved_upcoming: int = 0
    total_all_time: int = 0
    by_type: dict = {}
    by_gate: dict = {}
