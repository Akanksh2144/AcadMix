"""add_room_to_period_slots

Revision ID: f6dd4afeb2f2
Revises: 36dfcb9802ad
Create Date: 2026-06-28 20:19:43.855865

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'f6dd4afeb2f2'
down_revision: Union[str, Sequence[str], None] = '36dfcb9802ad'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add room column to period_slots for venue tracking."""
    op.add_column('period_slots', sa.Column('room', sa.String(), nullable=True))


def downgrade() -> None:
    """Remove room column from period_slots."""
    op.drop_column('period_slots', 'room')
