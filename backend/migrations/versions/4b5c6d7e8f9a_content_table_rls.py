"""Add nullable college_id to content tables and enable RLS on all remaining tables.

Content tables (aptitude_questions, coding_challenges, premium_coding_challenges,
sql_problems, company_interview_experiences) use a hybrid RLS policy:
- NULL college_id = platform-curated content visible to ALL tenants
- SET college_id  = college-specific content visible only to that tenant

audit_logs gets standard tenant RLS (already has NOT NULL college_id).

Revision ID: 4b5c6d7e8f9a
Revises: 8a3f1b2c4d5e
Create Date: 2026-04-25
"""

from alembic import op
import sqlalchemy as sa

revision = '4b5c6d7e8f9a'
down_revision = '8a3f1b2c4d5e'
branch_labels = None
depends_on = None


# ── Tables getting new nullable college_id + hybrid RLS ──
HYBRID_TABLES = [
    "aptitude_questions",
    "coding_challenges",
    "premium_coding_challenges",
    "sql_problems",
    "company_interview_experiences",
]

# ── Tables with college_id that just need standard RLS turned on ──
STANDARD_RLS_TABLES = [
    "audit_logs",
]


def upgrade() -> None:
    # ══════════════════════════════════════════════════════════════════
    # PHASE 1: Add nullable college_id to content tables
    # ══════════════════════════════════════════════════════════════════
    for table in HYBRID_TABLES:
        op.add_column(table, sa.Column(
            'college_id', sa.String(),
            sa.ForeignKey('colleges.id', ondelete='CASCADE'),
            nullable=True
        ))
        op.create_index(f'ix_{table}_college_id', table, ['college_id'])

    # ══════════════════════════════════════════════════════════════════
    # PHASE 2: Enable HYBRID RLS on content tables
    # Policy: row is visible if college_id IS NULL (platform content)
    #         OR college_id matches the current tenant
    # ══════════════════════════════════════════════════════════════════
    for table in HYBRID_TABLES:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")
        op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY;")

        # Hybrid policy: platform content (NULL) visible to everyone,
        # tenant content visible only to the owning tenant
        op.execute(f"""
            CREATE POLICY tenant_or_platform ON {table}
                USING (
                    college_id IS NULL
                    OR college_id = current_setting('app.college_id', true)
                )
                WITH CHECK (
                    college_id IS NULL
                    OR college_id = current_setting('app.college_id', true)
                );
        """)
        op.execute(f"""
            CREATE POLICY superuser_bypass ON {table}
                USING (current_setting('app.rls_bypass', true) = 'true')
                WITH CHECK (current_setting('app.rls_bypass', true) = 'true');
        """)

    # ══════════════════════════════════════════════════════════════════
    # PHASE 3: Enable standard RLS on audit_logs
    # ══════════════════════════════════════════════════════════════════
    for table in STANDARD_RLS_TABLES:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")
        op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY;")

        op.execute(f"""
            CREATE POLICY tenant_isolation ON {table}
                USING (college_id = current_setting('app.college_id', true))
                WITH CHECK (college_id = current_setting('app.college_id', true));
        """)
        op.execute(f"""
            CREATE POLICY superuser_bypass ON {table}
                USING (current_setting('app.rls_bypass', true) = 'true')
                WITH CHECK (current_setting('app.rls_bypass', true) = 'true');
        """)


def downgrade() -> None:
    # Reverse standard RLS
    for table in reversed(STANDARD_RLS_TABLES):
        op.execute(f"DROP POLICY IF EXISTS superuser_bypass ON {table};")
        op.execute(f"DROP POLICY IF EXISTS tenant_isolation ON {table};")
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;")
        op.execute(f"ALTER TABLE {table} NO FORCE ROW LEVEL SECURITY;")

    # Reverse hybrid RLS + columns
    for table in reversed(HYBRID_TABLES):
        op.execute(f"DROP POLICY IF EXISTS superuser_bypass ON {table};")
        op.execute(f"DROP POLICY IF EXISTS tenant_or_platform ON {table};")
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;")
        op.execute(f"ALTER TABLE {table} NO FORCE ROW LEVEL SECURITY;")
        op.drop_index(f'ix_{table}_college_id', table_name=table)
        op.drop_column(table, 'college_id')
