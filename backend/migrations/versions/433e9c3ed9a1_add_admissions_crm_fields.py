"""add admissions crm fields

Revision ID: 433e9c3ed9a1
Revises: f6dd4afeb2f2
Create Date: 2026-07-03 21:41:12.718587

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '433e9c3ed9a1'
down_revision: Union[str, Sequence[str], None] = 'f6dd4afeb2f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('admissions', sa.Column('dob', sa.String(), nullable=True))
    op.add_column('admissions', sa.Column('address', sa.String(), nullable=True))
    op.add_column('admissions', sa.Column('category', sa.String(), nullable=True))
    op.add_column('admissions', sa.Column('minority_status', sa.String(), nullable=True))
    op.add_column('admissions', sa.Column('course_preferences', sa.String(), nullable=True))
    op.add_column('admissions', sa.Column('exam_type', sa.String(), nullable=True))
    op.add_column('admissions', sa.Column('exam_roll_number', sa.String(), nullable=True))
    op.add_column('admissions', sa.Column('exam_score', sa.Float(), nullable=True))
    op.add_column('admissions', sa.Column('exam_percentile', sa.Float(), nullable=True))
    op.add_column('admissions', sa.Column('category_rank', sa.Integer(), nullable=True))
    op.add_column('admissions', sa.Column('merit_rank', sa.Integer(), nullable=True))
    op.add_column('admissions', sa.Column('allocated_branch', sa.String(), nullable=True))
    op.add_column('admissions', sa.Column('cutoff_phase', sa.String(), nullable=True))
    op.add_column('admissions', sa.Column('locked_fee_amount', sa.Float(), nullable=True))
    op.add_column('admissions', sa.Column('fee_payment_status', sa.String(), nullable=True))
    op.add_column('admissions', sa.Column('documents_verified', sa.String(), nullable=True))
    op.add_column('admissions', sa.Column('melt_risk_score', sa.Float(), nullable=True))
    op.add_column('admissions', sa.Column('melt_risk_factors', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('admissions', 'melt_risk_factors')
    op.drop_column('admissions', 'melt_risk_score')
    op.drop_column('admissions', 'documents_verified')
    op.drop_column('admissions', 'fee_payment_status')
    op.drop_column('admissions', 'locked_fee_amount')
    op.drop_column('admissions', 'cutoff_phase')
    op.drop_column('admissions', 'allocated_branch')
    op.drop_column('admissions', 'merit_rank')
    op.drop_column('admissions', 'category_rank')
    op.drop_column('admissions', 'exam_percentile')
    op.drop_column('admissions', 'exam_score')
    op.drop_column('admissions', 'exam_roll_number')
    op.drop_column('admissions', 'exam_type')
    op.drop_column('admissions', 'course_preferences')
    op.drop_column('admissions', 'minority_status')
    op.drop_column('admissions', 'category')
    op.drop_column('admissions', 'address')
    op.drop_column('admissions', 'dob')
