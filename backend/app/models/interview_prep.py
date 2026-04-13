"""
Interview War Room — Database Models
AI Mock Interviews & ATS Resume Scoring for placement preparation.
"""
from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
import uuid
from database import Base
from app.models.core import SoftDeleteMixin


def generate_uuid():
    return str(uuid.uuid4())


class MockInterview(Base, SoftDeleteMixin):
    """Tracks each AI mock interview session with full conversation history and scoring."""
    __tablename__ = "mock_interviews"

    id               = Column(String, primary_key=True, index=True, default=generate_uuid)
    college_id       = Column(String, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id       = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    interview_type   = Column(String, nullable=False)                                    # technical/hr/behavioral/mixed/company_specific
    target_role      = Column(String, nullable=True)                                     # SDE, Data Analyst, etc.
    target_company   = Column(String, nullable=True)                                     # TCS, Infosys, Google (nullable)
    difficulty       = Column(String, nullable=False, server_default='intermediate')      # beginner/intermediate/advanced
    resume_context   = Column(Text, nullable=True)                                       # Parsed resume text used as context
    conversation     = Column(JSONB, nullable=False, server_default='[]')                 # [{role, content, timestamp, score}]
    ai_feedback      = Column(JSONB, nullable=True)                                      # Comprehensive post-interview feedback
    scores           = Column(JSONB, nullable=True)                                      # {overall, technical, communication, ...}
    overall_score    = Column(Float, nullable=True)                                      # 0-100 composite
    question_count   = Column(Integer, nullable=False, default=0)
    duration_seconds = Column(Integer, nullable=True)
    status           = Column(String, nullable=False, server_default='in_progress')       # in_progress/completed/abandoned
    created_at       = Column(DateTime(timezone=True), server_default=func.now())
    completed_at     = Column(DateTime(timezone=True), nullable=True)


class ResumeScore(Base, SoftDeleteMixin):
    """ATS resume analysis results — PDF is parsed in-memory and discarded, only text is stored."""
    __tablename__ = "resume_scores"

    id               = Column(String, primary_key=True, index=True, default=generate_uuid)
    college_id       = Column(String, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id       = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    filename         = Column(String, nullable=False)                                    # Original upload filename
    parsed_text      = Column(Text, nullable=True)                                       # Extracted text from PDF
    ats_score        = Column(Float, nullable=True)                                      # 0-100 ATS compatibility score
    section_scores   = Column(JSONB, nullable=True)                                      # {contact: 90, experience: 70, ...}
    keywords_found   = Column(JSONB, nullable=True)                                      # Matched industry keywords
    keywords_missing = Column(JSONB, nullable=True)                                      # Suggested missing keywords
    improvement_tips = Column(JSONB, nullable=True)                                      # AI-generated suggestions
    target_role      = Column(String, nullable=True)                                     # Role the resume was scored against
    job_description  = Column(Text, nullable=True)                                       # Optional JD for precise matching
    created_at       = Column(DateTime(timezone=True), server_default=func.now())
