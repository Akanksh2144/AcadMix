from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint, Index
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
    status            = Column(String, default="confirmed")  # confirmed/enrolled/cancelled
    user_id           = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)  # null until onboarded
    otp_hash          = Column(String, nullable=True)    # bcrypt hash of last OTP
    otp_expires_at    = Column(DateTime(timezone=True), nullable=True)
    created_at        = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("college_id", "admission_number", name="uq_admission_college"),
        Index("ix_admission_mobile", "mobile_number", "college_id"),
    )
