"""Add functional indexes on colleges domain and name

Revision ID: perf_indexes_003
Revises: e2b5c567da4f
Create Date: 2026-06-26 13:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'perf_indexes_003'
down_revision: Union[str, Sequence[str], None] = 'e2b5c567da4f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create functional lower indexes to speed up case-insensitive tenant lookups
    op.create_index('ix_colleges_lower_domain', 'colleges', [sa.text('lower(domain)')], unique=False)
    op.create_index('ix_colleges_lower_name', 'colleges', [sa.text('lower(name)')], unique=False)


def downgrade() -> None:
    op.drop_index('ix_colleges_lower_domain')
    op.drop_index('ix_colleges_lower_name')
