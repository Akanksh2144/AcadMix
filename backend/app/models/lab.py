"""
Lab Exam System — Database models for practical lab exam sessions.

Tables:
  - lab_questions: Two-tier question bank (platform + college registry)
  - lab_sessions: Exam session state machine (draft → active → ended)
  - lab_student_questions: Per-student question assignments
  - lab_submissions: Student code submissions + auto-verification results
"""

from sqlalchemy import Column, String, Integer, Text, ForeignKey, DateTime, Boolean, Index, UniqueConstraint
from sqlalchemy.sql import func, text
from database import Base

from app.models.core import SoftDeleteMixin, generate_uuid


# ═══════════════════════════════════════════════════════════════════════════════
# QUESTION BANK
# ═══════════════════════════════════════════════════════════════════════════════


class LabQuestion(Base, SoftDeleteMixin):
    """Two-tier question bank for lab exams.

    Tier 1 — Platform Library:
      source = "platform", college_id = NULL
      Seeded by AcadMix. Read-only for all faculty.

    Tier 2 — College Registry:
      source = "college", college_id = <college>
      Faculty-contributed. Shared across all faculty at that college.
      Creator can edit/delete their own questions.

    Subjects: C_PROGRAMMING | DATA_STRUCTURES | OOP_JAVA | DBMS_SQL |
              OS_SHELL | WEB_TECH | PYTHON_ML | CN_NETWORKING | COMPILER_DESIGN
    """

    __tablename__ = "lab_questions"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    college_id = Column(String, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=True)  # NULL = platform
    source = Column(String, nullable=False, server_default="platform")  # "platform" | "college"
    subject = Column(String, nullable=False)  # e.g. "C_PROGRAMMING"
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    starter_code = Column(Text, nullable=True)  # Optional boilerplate given to student
    language = Column(String, nullable=False)  # c | cpp | java | python | sql | bash | javascript
    test_input = Column(Text, nullable=True)  # stdin fed to the program
    expected_output = Column(Text, nullable=False)  # stdout to match (after strip)
    difficulty = Column(String, nullable=False, server_default="medium")  # easy | medium | hard
    created_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_lab_q_subject_source", "subject", "source"),
        Index("ix_lab_q_college", "college_id"),
    )


# ═══════════════════════════════════════════════════════════════════════════════
# LAB SESSION (EXAM)
# ═══════════════════════════════════════════════════════════════════════════════


class LabSession(Base, SoftDeleteMixin):
    """A single lab exam session.

    State machine: draft → active → ended
      - draft:  Faculty is assigning questions. Students see nothing.
      - active: Exam is live. Students can join + submit code.
      - ended:  Exam is over. No more submissions accepted.

    Assignment modes:
      - random: Anti-consecutive random distribution
      - cyclic: Round-robin through question list by roll order
      - manual: Faculty explicitly assigns per student
    """

    __tablename__ = "lab_sessions"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    college_id = Column(String, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False)
    faculty_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject = Column(String, nullable=False)
    title = Column(String, nullable=False)
    batch = Column(String, nullable=False)
    section = Column(String, nullable=False)
    semester = Column(Integer, nullable=False)
    session_code = Column(String(6), nullable=False, unique=True, index=True)
    status = Column(String, nullable=False, server_default="draft")  # draft | active | ended
    assignment_mode = Column(String, nullable=False, server_default="cyclic")  # random | cyclic | manual
    questions_per_student = Column(Integer, nullable=False, server_default=text("1"))
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_lab_session_faculty", "faculty_id", "status"),
        Index("ix_lab_session_college", "college_id", "status"),
    )


# ═══════════════════════════════════════════════════════════════════════════════
# PER-STUDENT QUESTION ASSIGNMENT
# ═══════════════════════════════════════════════════════════════════════════════


class LabStudentQuestion(Base):
    """Maps which question(s) are assigned to which student for a given session.

    Created during the assignment phase (before exam starts).
    slot_number orders the questions for the student (1, 2, 3 ...).
    """

    __tablename__ = "lab_student_questions"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    college_id = Column(String, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(String, ForeignKey("lab_sessions.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(String, ForeignKey("lab_questions.id", ondelete="CASCADE"), nullable=False)
    slot_number = Column(Integer, nullable=False, server_default=text("1"))

    __table_args__ = (
        UniqueConstraint("session_id", "student_id", "question_id", name="uq_lab_student_question"),
        Index("ix_lab_sq_session_student", "session_id", "student_id"),
        Index("ix_lab_sq_session", "session_id"),
    )


# ═══════════════════════════════════════════════════════════════════════════════
# SUBMISSIONS (CODE + RESULT)
# ═══════════════════════════════════════════════════════════════════════════════


class LabSubmission(Base):
    """Tracks each student's work per question in a lab session.

    - One record per (session, student, question) combination.
    - attempt_count increments on every Run & Submit.
    - is_locked = True once is_passed = True (no more submissions).
    - code stores the latest submitted code.
    - output stores the latest stdout from code runner.
    """

    __tablename__ = "lab_submissions"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    college_id = Column(String, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(String, ForeignKey("lab_sessions.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(String, ForeignKey("lab_questions.id", ondelete="CASCADE"), nullable=False)
    code = Column(Text, nullable=True)
    language = Column(String, nullable=False)
    output = Column(Text, nullable=True)
    is_passed = Column(Boolean, nullable=False, server_default=text("false"))
    is_locked = Column(Boolean, nullable=False, server_default=text("false"))
    attempt_count = Column(Integer, nullable=False, server_default=text("0"))
    last_attempted = Column(DateTime(timezone=True), nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=True)  # First passing submission time

    __table_args__ = (
        UniqueConstraint("session_id", "student_id", "question_id", name="uq_lab_submission"),
        Index("ix_lab_sub_session_student", "session_id", "student_id"),
        Index("ix_lab_sub_session", "session_id"),
    )
