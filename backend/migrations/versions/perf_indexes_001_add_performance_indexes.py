"""Add performance indexes for hot query paths

Revision ID: perf_indexes_001
Revises: 047ebaf36580
Create Date: 2026-04-15

These indexes target the 7 most frequently executed query patterns
identified during the production readiness audit. All use partial
indexes (WHERE is_deleted = false) to keep index size minimal.
"""
from alembic import op

# revision identifiers, used by Alembic.
revision = 'perf_indexes_001'
down_revision = '047ebaf36580'
branch_labels = None
depends_on = None


def upgrade():
    # Users — login + tenant-scoped role lookups (every auth request)
    op.create_index(
        'ix_users_college_role_active',
        'users',
        ['college_id', 'role'],
        postgresql_where="is_deleted = false",
    )

    # Attendance — daily student attendance queries
    op.create_index(
        'ix_attendance_student_date',
        'attendance_records',
        ['student_id', 'date', 'college_id'],
        postgresql_where="is_deleted = false",
    )

    # Mark submissions — HOD review queue + exam cell publish
    op.create_index(
        'ix_marks_assignment_exam',
        'mark_submissions',
        ['assignment_id', 'exam_type', 'college_id'],
        postgresql_where="is_deleted = false",
    )

    # Fee payments — student payment history + status lookups
    op.create_index(
        'ix_fees_student_status',
        'fee_payments',
        ['student_id', 'status', 'college_id'],
        postgresql_where="is_deleted = false",
    )

    # Quiz attempts — student quiz history (code playground + quizzes)
    op.create_index(
        'ix_attempts_student_quiz',
        'quiz_attempts',
        ['student_id', 'quiz_id'],
        postgresql_where="is_deleted = false",
    )

    # Timetable — daily schedule lookup (every dashboard load)
    op.create_index(
        'ix_timetable_dept_batch_day',
        'timetables',
        ['college_id', 'department_id', 'semester', 'day'],
        postgresql_where="is_deleted = false",
    )

    # Faculty assignments — teaching scope lookup
    op.create_index(
        'ix_faculty_assign_teacher',
        'faculty_assignments',
        ['teacher_id', 'college_id'],
        postgresql_where="is_deleted = false",
    )

    # Audit logs — security team query pattern
    op.create_index(
        'ix_audit_user_resource',
        'audit_logs',
        ['user_id', 'resource', 'created_at'],
    )


def downgrade():
    op.drop_index('ix_users_college_role_active')
    op.drop_index('ix_attendance_student_date')
    op.drop_index('ix_marks_assignment_exam')
    op.drop_index('ix_fees_student_status')
    op.drop_index('ix_attempts_student_quiz')
    op.drop_index('ix_timetable_dept_batch_day')
    op.drop_index('ix_faculty_assign_teacher')
    op.drop_index('ix_audit_user_resource')
