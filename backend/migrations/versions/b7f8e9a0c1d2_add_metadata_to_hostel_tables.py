"""add_metadata_to_hostel_tables

Revision ID: b7f8e9a0c1d2
Revises: a57dc0ec4125
Create Date: 2026-04-17 17:18:00.000000

Adds a JSONB `metadata` column with DEFAULT '{}' to:
  - room_templates (stores room decorators: window/door/bathroom positions)
  - hostels (stores floor_layout per floor: corridor orientation, wing assignments)
  - rooms (stores room-level: ac, attached_bathroom, amenities, wing)

Non-destructive: existing rows get '{}' as default, no data overwrite.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'b7f8e9a0c1d2'
down_revision: Union[str, Sequence[str], None] = 'a57dc0ec4125'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add metadata JSONB column to hostel tables."""
    op.add_column('room_templates', sa.Column(
        'metadata',
        postgresql.JSONB(astext_type=sa.Text()),
        server_default='{}',
        nullable=True,
    ))
    op.add_column('hostels', sa.Column(
        'metadata',
        postgresql.JSONB(astext_type=sa.Text()),
        server_default='{}',
        nullable=True,
    ))
    op.add_column('rooms', sa.Column(
        'metadata',
        postgresql.JSONB(astext_type=sa.Text()),
        server_default='{}',
        nullable=True,
    ))


def downgrade() -> None:
    """Remove metadata columns."""
    op.drop_column('rooms', 'metadata')
    op.drop_column('hostels', 'metadata')
    op.drop_column('room_templates', 'metadata')
