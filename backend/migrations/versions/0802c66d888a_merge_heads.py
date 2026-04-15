"""merge_heads

Revision ID: 0802c66d888a
Revises: a1b2c3d4e5f6, perf_indexes_001
Create Date: 2026-04-15 23:32:25.686823

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0802c66d888a'
down_revision: Union[str, Sequence[str], None] = ('a1b2c3d4e5f6', 'perf_indexes_001')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
