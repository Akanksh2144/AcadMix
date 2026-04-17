"""merge heads

Revision ID: a57dc0ec4125
Revises: 4098389564ad, perf_indexes_002
Create Date: 2026-04-17 03:14:09.497978

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a57dc0ec4125'
down_revision: Union[str, Sequence[str], None] = ('4098389564ad', 'perf_indexes_002')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
