from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime, UniqueConstraint, Index
from sqlalchemy.sql import func, text
import uuid
from database import Base
from app.models.core import SoftDeleteMixin

def generate_uuid():
    return str(uuid.uuid4())

class ProgramOutcome(Base, SoftDeleteMixin):
    """
    NBA standard Program Outcomes (PO1-PO12).
    Bound directly to the Department.
    """
    __tablename__ = "program_outcomes"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    department_id = Column(String, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    # college_id enables efficient multi-college queries without joining through departments.
    # Nullable so existing records don't break — backfill via Alembic data migration.
    college_id = Column(String, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=True, index=True)
    code = Column(String, nullable=False)  # Example: "PO1"
    description = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("department_id", "code", name="uq_department_po_code"),
        Index("ix_po_college_dept", "college_id", "department_id"),
    )

class CourseOutcome(Base, SoftDeleteMixin):
    """
    Syllabus-specific outcomes (CO1-CO6) for a specific Course.
    """
    __tablename__ = "course_outcomes"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    course_id = Column(String, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    code = Column(String, nullable=False)  # Example: "CO1"
    description = Column(String, nullable=False)
    bloom_level = Column(String, nullable=True)  # Remember, Understand, Apply, Analyse, Evaluate, Create
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("course_id", "code", name="uq_course_co_code"),
    )

class COPOMapping(Base, SoftDeleteMixin):
    """
    Matrix relationship establishing strength of correlation between CO and PO.
    Strength: 1 (Low), 2 (Medium), 3 (High).
    """
    __tablename__ = "co_po_mappings"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    co_id = Column(String, ForeignKey("course_outcomes.id", ondelete="CASCADE"), nullable=False)
    po_id = Column(String, ForeignKey("program_outcomes.id", ondelete="CASCADE"), nullable=False)
    strength = Column(Integer, nullable=False)  # 1, 2, or 3
    # Why this CO maps to this PO at this strength. NBA auditors ask this.
    rationale = Column(String, nullable=True)
    # When course syllabus is revised, set False — preserves historical attainment data.
    is_active = Column(Boolean, nullable=False, server_default=text('true'))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("co_id", "po_id", name="uq_co_po_mapping"),
    )
