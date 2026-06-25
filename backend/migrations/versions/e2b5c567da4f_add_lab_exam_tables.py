"""add lab exam tables

Revision ID: e2b5c567da4f
Revises: d0c54c7051a1
Create Date: 2026-06-25 12:22:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text

# revision identifiers, used by Alembic.
revision: str = 'e2b5c567da4f'
down_revision: Union[str, Sequence[str], None] = 'd0c54c7051a1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create lab_questions table
    op.create_table(
        'lab_questions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('college_id', sa.String(), nullable=True),
        sa.Column('source', sa.String(), server_default='platform', nullable=False),
        sa.Column('subject', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('starter_code', sa.Text(), nullable=True),
        sa.Column('language', sa.String(), nullable=False),
        sa.Column('test_input', sa.Text(), nullable=True),
        sa.Column('expected_output', sa.Text(), nullable=False),
        sa.Column('difficulty', sa.String(), server_default='medium', nullable=False),
        sa.Column('created_by', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['college_id'], ['colleges.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_lab_questions_id'), 'lab_questions', ['id'], unique=False)
    op.create_index('ix_lab_q_subject_source', 'lab_questions', ['subject', 'source'], unique=False)
    op.create_index('ix_lab_q_college', 'lab_questions', ['college_id'], unique=False)

    # 2. Create lab_sessions table
    op.create_table(
        'lab_sessions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('college_id', sa.String(), nullable=False),
        sa.Column('faculty_id', sa.String(), nullable=False),
        sa.Column('subject', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('batch', sa.String(), nullable=False),
        sa.Column('section', sa.String(), nullable=False),
        sa.Column('semester', sa.Integer(), nullable=False),
        sa.Column('session_code', sa.String(length=6), nullable=False),
        sa.Column('status', sa.String(), server_default='draft', nullable=False),
        sa.Column('assignment_mode', sa.String(), server_default='cyclic', nullable=False),
        sa.Column('questions_per_student', sa.Integer(), server_default=text('1'), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['college_id'], ['colleges.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['faculty_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_lab_sessions_id'), 'lab_sessions', ['id'], unique=False)
    op.create_index(op.f('ix_lab_sessions_session_code'), 'lab_sessions', ['session_code'], unique=True)
    op.create_index('ix_lab_session_faculty', 'lab_sessions', ['faculty_id', 'status'], unique=False)
    op.create_index('ix_lab_session_college', 'lab_sessions', ['college_id', 'status'], unique=False)

    # 3. Create lab_student_questions table
    op.create_table(
        'lab_student_questions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('college_id', sa.String(), nullable=False),
        sa.Column('session_id', sa.String(), nullable=False),
        sa.Column('student_id', sa.String(), nullable=False),
        sa.Column('question_id', sa.String(), nullable=False),
        sa.Column('slot_number', sa.Integer(), server_default=text('1'), nullable=False),
        sa.ForeignKeyConstraint(['college_id'], ['colleges.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['session_id'], ['lab_sessions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['question_id'], ['lab_questions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('session_id', 'student_id', 'question_id', name='uq_lab_student_question')
    )
    op.create_index(op.f('ix_lab_student_questions_id'), 'lab_student_questions', ['id'], unique=False)
    op.create_index('ix_lab_sq_session_student', 'lab_student_questions', ['session_id', 'student_id'], unique=False)
    op.create_index('ix_lab_sq_session', 'lab_student_questions', ['session_id'], unique=False)

    # 4. Create lab_submissions table
    op.create_table(
        'lab_submissions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('college_id', sa.String(), nullable=False),
        sa.Column('session_id', sa.String(), nullable=False),
        sa.Column('student_id', sa.String(), nullable=False),
        sa.Column('question_id', sa.String(), nullable=False),
        sa.Column('code', sa.Text(), nullable=True),
        sa.Column('language', sa.String(), nullable=False),
        sa.Column('output', sa.Text(), nullable=True),
        sa.Column('is_passed', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('is_locked', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('attempt_count', sa.Integer(), server_default=sa.text('0'), nullable=False),
        sa.Column('last_attempted', sa.DateTime(timezone=True), nullable=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['college_id'], ['colleges.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['session_id'], ['lab_sessions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['question_id'], ['lab_questions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('session_id', 'student_id', 'question_id', name='uq_lab_submission')
    )
    op.create_index(op.f('ix_lab_submissions_id'), 'lab_submissions', ['id'], unique=False)
    op.create_index('ix_lab_sub_session_student', 'lab_submissions', ['session_id', 'student_id'], unique=False)
    op.create_index('ix_lab_sub_session', 'lab_submissions', ['session_id'], unique=False)


def downgrade() -> None:
    op.drop_table('lab_submissions')
    op.drop_table('lab_student_questions')
    op.drop_table('lab_sessions')
    op.drop_table('lab_questions')
