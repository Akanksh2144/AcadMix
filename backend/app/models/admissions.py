from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint, Index, Float, Integer
from sqlalchemy.sql import func
import uuid

from database import Base
from app.models.core import SoftDeleteMixin

def generate_uuid():
    return str(uuid.uuid4())

class Admission(Base, SoftDeleteMixin):
    __tablename__ = "admissions"
    id                = Column(String, primary_key=True, default=generate_uuid)
    college_id        = Column(String, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False)
    admission_number  = Column(String, nullable=False)
    full_name         = Column(String, nullable=False)
    mobile_number     = Column(String, nullable=False)
    email             = Column(String, nullable=True)
    gender            = Column(String, nullable=False)   # hostel wing allocation
    branch            = Column(String, nullable=False)   # CSE, ECE, MECH etc.
    batch             = Column(String, nullable=False)   # "2026-2030"
    quota             = Column(String, nullable=True)    # management/govt/NRI
    status            = Column(String, default="enquiry")  # enquiry/submitted/eligible/merit_listed/seat_allocated/seat_accepted/documents_verified/admitted/enrolled
    user_id           = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)  # null until onboarded
    otp_hash          = Column(String, nullable=True)    # bcrypt hash of last OTP
    otp_expires_at    = Column(DateTime(timezone=True), nullable=True)
    
    # New Admissions CRM fields
    dob               = Column(String, nullable=True)
    address           = Column(String, nullable=True)
    category          = Column(String, default="General")  # General, OBC, SC, ST, EWS
    minority_status   = Column(String, default="No")
    course_preferences = Column(String, nullable=True)  # comma-separated string e.g. "CSE,ECE"
    exam_type         = Column(String, nullable=True)  # JEE, EAMCET, etc.
    exam_roll_number  = Column(String, nullable=True)
    exam_score        = Column(Float, nullable=True)
    exam_percentile   = Column(Float, nullable=True)
    category_rank     = Column(Integer, nullable=True)
    merit_rank        = Column(Integer, nullable=True)
    allocated_branch  = Column(String, nullable=True)
    cutoff_phase      = Column(String, nullable=True)
    locked_fee_amount = Column(Float, default=0.0)
    fee_payment_status = Column(String, default="pending")  # pending, partial, paid
    documents_verified = Column(String, default="pending")  # pending, verified, rejected
    lead_source        = Column(String, default="Website Form")  # Meta Ads, Google Ads, Website Form, Shiksha, CSV Import
    utm_source         = Column(String, nullable=True)
    melt_risk_score    = Column(Float, default=0.0)
    melt_risk_factors  = Column(String, nullable=True)  # comma-separated reasons
    
    created_at        = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("college_id", "admission_number", name="uq_admission_college"),
        Index("ix_admission_mobile", "mobile_number", "college_id"),
    )
