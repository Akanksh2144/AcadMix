"""add_daily_attendance

Revision ID: 36dfcb9802ad
Revises: perf_indexes_003
Create Date: 2026-06-28 13:10:29.830823

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '36dfcb9802ad'
down_revision: Union[str, Sequence[str], None] = 'perf_indexes_003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('daily_attendance_records',
    sa.Column('id', sa.String(), nullable=False),
    sa.Column('college_id', sa.String(), nullable=False),
    sa.Column('user_id', sa.String(), nullable=False),
    sa.Column('date', sa.Date(), nullable=False),
    sa.Column('check_in', sa.DateTime(timezone=True), nullable=True),
    sa.Column('check_out', sa.DateTime(timezone=True), nullable=True),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('source', sa.String(), server_default='manual', nullable=False),
    sa.Column('remarks', sa.String(), nullable=True),
    sa.Column('raw_logs', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('is_deleted', sa.Boolean(), server_default=sa.text('false'), nullable=False),
    sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['college_id'], ['colleges.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'date', name='uq_daily_attendance_user_date')
    )
    op.create_index('ix_daily_attendance_college_date', 'daily_attendance_records', ['college_id', 'date'], unique=False)
    op.create_index(op.f('ix_daily_attendance_records_id'), 'daily_attendance_records', ['id'], unique=False)
    op.create_index(op.f('ix_daily_attendance_records_is_deleted'), 'daily_attendance_records', ['is_deleted'], unique=False)
    op.create_index('ix_daily_attendance_user_date', 'daily_attendance_records', ['user_id', 'date'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_daily_attendance_user_date', table_name='daily_attendance_records')
    op.drop_index(op.f('ix_daily_attendance_records_is_deleted'), table_name='daily_attendance_records')
    op.drop_index(op.f('ix_daily_attendance_records_id'), table_name='daily_attendance_records')
    op.drop_index('ix_daily_attendance_college_date', table_name='daily_attendance_records')
    op.drop_table('daily_attendance_records')
