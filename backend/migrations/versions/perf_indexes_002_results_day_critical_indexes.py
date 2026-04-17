"""Add results-day critical indexes (defensive — IF NOT EXISTS)

Revision ID: perf_indexes_002
Revises: perf_indexes_001
Create Date: 2026-04-16

CTO-mandated indexes for results publication (3,000–4,000 concurrent students).
Uses IF NOT EXISTS so this migration is safe to run even if model-level
`index=True` annotations were already applied by a previous autogenerate.

Target tables:
  - questions.quiz_id         (quiz loading: JOIN questions WHERE quiz_id = ?)
  - quiz_answers.attempt_id   (grading: JOIN answers WHERE attempt_id = ?)
  - mark_submission_entries.student_id  (CIA marks lookup per student)
  - semester_grades.student_id  (results publication — the #1 hot path)
"""
from alembic import op

revision = 'perf_indexes_002'
down_revision = 'perf_indexes_001'
branch_labels = None
depends_on = None


def upgrade():
    # All use IF NOT EXISTS via raw SQL to be idempotent.
    # SQLAlchemy model has index=True but we can't guarantee it was applied.

    # questions.quiz_id — every quiz load fetches all questions for a quiz_id
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_questions_quiz_id
        ON questions (quiz_id)
    """)

    # quiz_answers.attempt_id — grading + results calculation
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_quiz_answers_attempt_id
        ON quiz_answers (attempt_id)
    """)

    # mark_submission_entries.student_id — CIA marks per student
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_mark_entries_student_id
        ON mark_submission_entries (student_id)
    """)

    # mark_submission_entries.(submission_id, student_id) — bulk score lookup
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_mark_entries_sub_student
        ON mark_submission_entries (submission_id, student_id)
    """)

    # semester_grades.student_id — THE results-day hot path
    # Composite index already exists in model (ix_sem_grades_s_s),
    # but ensure a simple student_id index exists for non-semester-filtered queries
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_semester_grades_student
        ON semester_grades (student_id)
    """)

    # semester_grades.(college_id, student_id) — tenant-scoped results
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_semester_grades_college_student
        ON semester_grades (college_id, student_id, semester)
    """)

    # notifications — student notification feed (polled every 30s)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_notifications_user_read
        ON notifications (user_id, is_read, created_at DESC)
    """)


def downgrade():
    op.execute("DROP INDEX IF EXISTS ix_questions_quiz_id")
    op.execute("DROP INDEX IF EXISTS ix_quiz_answers_attempt_id")
    op.execute("DROP INDEX IF EXISTS ix_mark_entries_student_id")
    op.execute("DROP INDEX IF EXISTS ix_mark_entries_sub_student")
    op.execute("DROP INDEX IF EXISTS ix_semester_grades_student")
    op.execute("DROP INDEX IF EXISTS ix_semester_grades_college_student")
    op.execute("DROP INDEX IF EXISTS ix_notifications_user_read")
