"""Add Program model and program_id

Revision ID: 34c25dbeb571
Revises: 868b548e7015
Create Date: 2026-05-13 16:50:11.787599

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '34c25dbeb571'
down_revision: Union[str, Sequence[str], None] = '868b548e7015'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('programs',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('college_id', sa.String(), nullable=False),
        sa.Column('department_id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('duration_years', sa.Integer(), nullable=True),
        sa.Column('head_user_id', sa.String(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['college_id'], ['colleges.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['department_id'], ['departments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['head_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_programs_id'), 'programs', ['id'], unique=False)
    op.create_index(op.f('ix_programs_is_deleted'), 'programs', ['is_deleted'], unique=False)
    
    op.add_column('sections', sa.Column('program_id', sa.String(), nullable=True))
    op.create_foreign_key(None, 'sections', 'programs', ['program_id'], ['id'], ondelete='CASCADE')
    
    op.add_column('user_profiles', sa.Column('program_id', sa.String(), nullable=True))
    op.create_foreign_key(None, 'user_profiles', 'programs', ['program_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    op.drop_constraint(None, 'user_profiles', type_='foreignkey')
    op.drop_column('user_profiles', 'program_id')
    
    op.drop_constraint(None, 'sections', type_='foreignkey')
    op.drop_column('sections', 'program_id')
    
    op.drop_index(op.f('ix_programs_is_deleted'), table_name='programs')
    op.drop_index(op.f('ix_programs_id'), table_name='programs')
    op.drop_table('programs')
