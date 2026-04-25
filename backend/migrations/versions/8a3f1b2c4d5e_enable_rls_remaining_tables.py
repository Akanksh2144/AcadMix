"""Enable RLS on remaining tenant tables that were missed.

These tables have college_id but were not included in the original RLS migration
(a1b2c3d4e5f6) because they were created by later migrations (accreditation, etc.)
or were simply overlooked.

Revision ID: 8a3f1b2c4d5e
Revises: 799ceea65225
Create Date: 2026-04-25
"""

from alembic import op
import sqlalchemy as sa

revision = '8a3f1b2c4d5e'
down_revision = '799ceea65225'
branch_labels = None
depends_on = None


# All tables that have college_id but currently lack RLS policies
MISSING_RLS_TABLES = [
    "accreditation_evidence",
    "admissions",
    "co_attainment_records",
    "college_modules",
    "course_exit_surveys",
    "faculty_achievements",
    "faculty_profiles",
    "grievance_actions",
    "naac_audit_snapshots",
    "notifications",
    "pinned_insights",
    "placement_restrictions",
    "po_attainment_records",
    "premium_challenge_progress",
    "program_outcomes",
    "program_specific_outcomes",
    "pso_attainment_records",
    "push_subscriptions",
    "student_rankings",
    "student_resumes",
]

# audit_logs has college_id but is a security table — exempt from tenant RLS
# It needs to be readable by platform admins across all tenants for
# security forensics. Kept separate intentionally.
EXEMPT_TABLES = [
    "audit_logs",
]


def upgrade() -> None:
    for table in MISSING_RLS_TABLES:
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
    for table in reversed(MISSING_RLS_TABLES):
        op.execute(f"DROP POLICY IF EXISTS superuser_bypass ON {table};")
        op.execute(f"DROP POLICY IF EXISTS tenant_isolation ON {table};")
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;")
        op.execute(f"ALTER TABLE {table} NO FORCE ROW LEVEL SECURITY;")
