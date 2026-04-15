"""Enable Row-Level Security on all multi-tenant tables.

Creates policies that enforce tenant isolation at the PostgreSQL kernel level,
using GUC variable `app.college_id` set per-transaction by the application.

RLS Policy:
  - SELECT/INSERT/UPDATE/DELETE restricted to rows matching app.college_id
  - Superuser/admin connections bypass RLS via BYPASSRLS privilege
  - Global lookup tables (colleges, coding_challenges) are exempt
  - Audit tables (rls_shadow_logs, audit_logs) are exempt
  - room_templates allows global rows (college_id IS NULL)

Revision ID: a1b2c3d4e5f6
Revises: 047ebaf36580
Create Date: 2026-04-15
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '047ebaf36580'
branch_labels = None
depends_on = None


# ═══════════════════════════════════════════════════════════════════════════════
# Tables that have a college_id column and need RLS tenant isolation policies.
# ═══════════════════════════════════════════════════════════════════════════════

TENANT_TABLES = [
    "academic_calendars",
    "activity_permissions",
    "ais140_devices",
    "allocations",
    "alumni_achievements",
    "alumni_contributions",
    "alumni_event_registrations",
    "alumni_events",
    "alumni_feedback",
    "alumni_guest_lectures",
    "alumni_job_postings",
    "alumni_mentorships",
    "announcements",
    "appeals",
    "attendance_records",
    "beds",
    "book_copies",
    "books",
    "bus_locations",
    "bus_routes",
    "challenge_progress",
    "cia_templates",
    "circular_acknowledgments",
    "class_in_charges",
    "companies",
    "consultancy_engagements",
    "course_enrollments",
    "course_feedback",
    "course_registrations",
    "courses",
    "curriculum_feedback",
    "department_meetings",
    "departments",
    "dh_submission_records",
    "employer_feedback",
    "exam_schedules",
    "expert_assignments",
    "faculty_assignments",
    "fee_payments",
    "free_period_requests",
    "gatepasses",
    "grievances",
    "hostels",
    "industry_project_applications",
    "industry_projects",
    "inspection_records",
    "inspection_responses",
    "institution_profiles",
    "leave_requests",
    "library_fines",
    "library_reservations",
    "library_transactions",
    "mark_submission_entries",
    "mark_submissions",
    "mentor_assignments",
    "mock_interviews",
    "mous",
    "nodal_officer_jurisdictions",
    "options",
    "out_of_campus_permissions",
    "parent_student_links",
    "period_slots",
    "placement_applications",
    "placement_drives",
    "proctoring_events",
    "proctoring_violations",
    "question_paper_submissions",
    "questions",
    "quiz_answers",
    "quiz_attempts",
    "quizzes",
    "registration_windows",
    "resume_scores",
    "retired_faculty_advisory",
    "retired_faculty_research",
    "reward_point_logs",
    "roles",
    "rooms",
    "scholarship_applications",
    "scholarships",
    "sections",
    "semester_grades",
    "student_fee_invoices",
    "student_progressions",
    "study_materials",
    "subject_cia_configs",
    "task_assignments",
    "teaching_evaluations",
    "teaching_records",
    "timetable_approvals",
    "timetables",
    "transport_attendance",
    "transport_enrollments",
    "trip_summaries",
    "trips",
    "user_permissions",
    "user_profiles",
    "users",
    "vending_machines",
    "vending_transactions",
    "visit_records",
    "visitors",
]

# Tables with college_id that need a special policy (allows NULL college_id)
NULLABLE_TENANT_TABLES = [
    "room_templates",  # Global templates have college_id IS NULL
]

# Tables explicitly exempt from RLS:
# - colleges: tenant lookup table, no isolation needed
# - coding_challenges: global content shared across tenants
# - audit_logs: security records (no college_id column)
# - rls_shadow_logs: written by admin engine, must bypass RLS
# - cia_template_components: child of cia_templates (no own college_id)
# - dh_circulars: no college_id column
# - dh_submission_requirements: no college_id column
EXEMPT_TABLES = [
    "colleges",
    "coding_challenges",
    "audit_logs",
    "rls_shadow_logs",
    "cia_template_components",
    "dh_circulars",
    "dh_submission_requirements",
]


def upgrade() -> None:
    # ── 1. Create the 'authenticated' role if it doesn't exist ────────────
    # This role will be used by tenant sessions (SET LOCAL ROLE authenticated).
    # It has no superuser/bypassrls — so RLS policies are enforced.
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
                CREATE ROLE authenticated NOLOGIN;
            END IF;
        END
        $$;
    """)

    # ── 2. Grant usage on schema and tables to authenticated role ──────────
    op.execute("GRANT USAGE ON SCHEMA public TO authenticated;")
    op.execute("GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;")
    op.execute("GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;")

    # Make sure future tables also get granted
    op.execute("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;")
    op.execute("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;")

    # ── 3. Enable RLS + create policies on all tenant tables ──────────────
    for table in TENANT_TABLES:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")

        # Force RLS even for the table owner (important: prevents bypass)
        op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY;")

        # Policy: rows visible/writable only when college_id matches the GUC
        op.execute(f"""
            CREATE POLICY tenant_isolation ON {table}
                USING (college_id = current_setting('app.college_id', true))
                WITH CHECK (college_id = current_setting('app.college_id', true));
        """)

    # ── 4. Special policy for nullable tenant tables ──────────────────────
    for table in NULLABLE_TENANT_TABLES:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")
        op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY;")

        # Allow access to global rows (NULL college_id) OR tenant-matching rows
        op.execute(f"""
            CREATE POLICY tenant_isolation ON {table}
                USING (
                    college_id IS NULL
                    OR college_id = current_setting('app.college_id', true)
                )
                WITH CHECK (
                    college_id IS NULL
                    OR college_id = current_setting('app.college_id', true)
                );
        """)

    # ── 5. Superuser bypass policy ────────────────────────────────────────
    # The postgres superuser already has BYPASSRLS, but if we FORCE RLS,
    # we need an explicit bypass policy for the table owner.
    # Since we use FORCE, we add a superuser_bypass policy keyed on GUC.
    all_rls_tables = TENANT_TABLES + NULLABLE_TENANT_TABLES
    for table in all_rls_tables:
        op.execute(f"""
            CREATE POLICY superuser_bypass ON {table}
                USING (current_setting('app.rls_bypass', true) = 'true')
                WITH CHECK (current_setting('app.rls_bypass', true) = 'true');
        """)


def downgrade() -> None:
    all_rls_tables = TENANT_TABLES + NULLABLE_TENANT_TABLES

    for table in reversed(all_rls_tables):
        op.execute(f"DROP POLICY IF EXISTS superuser_bypass ON {table};")
        op.execute(f"DROP POLICY IF EXISTS tenant_isolation ON {table};")
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;")
        op.execute(f"ALTER TABLE {table} NO FORCE ROW LEVEL SECURITY;")

    op.execute("ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM authenticated;")
    op.execute("ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE USAGE, SELECT ON SEQUENCES FROM authenticated;")
    op.execute("REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;")
    op.execute("REVOKE USAGE ON SCHEMA public FROM authenticated;")
    op.execute("DROP ROLE IF EXISTS authenticated;")
