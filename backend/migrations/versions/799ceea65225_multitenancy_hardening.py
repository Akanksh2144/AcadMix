"""Multi-tenancy hardening: add missing college_id columns, backfill, set NOT NULL.

Addresses the full audit of tenant isolation gaps:
- Adds college_id to: course_outcomes, co_po_mappings, co_pso_mappings,
  ai_generated_assessments, assessment_questions, cia_template_components,
  placement_attempt_trackers
- Backfills from parent entities via JOINs
- Changes nullable college_id to NOT NULL on 13+ tables
- Enables RLS on newly scoped tables

Revision ID: 799ceea65225
Revises: a1b2c3d4e5f6
Create Date: 2026-04-25
"""

from alembic import op
import sqlalchemy as sa

revision = '799ceea65225'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


# ═══════════════════════════════════════════════════════════════════════════════
# Tables that get NEW college_id columns (currently missing)
# ═══════════════════════════════════════════════════════════════════════════════

NEW_COLLEGE_ID_TABLES = {
    # table_name: (backfill SQL using JOINs to derive college_id)
    "course_outcomes": """
        UPDATE course_outcomes co
        SET college_id = c.college_id
        FROM courses c
        WHERE co.course_id = c.id AND co.college_id IS NULL;
    """,
    "co_po_mappings": """
        UPDATE co_po_mappings m
        SET college_id = c.college_id
        FROM course_outcomes co
        JOIN courses c ON co.course_id = c.id
        WHERE m.co_id = co.id AND m.college_id IS NULL;
    """,
    "co_pso_mappings": """
        UPDATE co_pso_mappings m
        SET college_id = c.college_id
        FROM course_outcomes co
        JOIN courses c ON co.course_id = c.id
        WHERE m.co_id = co.id AND m.college_id IS NULL;
    """,
    "ai_generated_assessments": """
        UPDATE ai_generated_assessments a
        SET college_id = c.college_id
        FROM courses c
        WHERE a.course_id = c.id AND a.college_id IS NULL;
    """,
    "assessment_questions": """
        UPDATE assessment_questions aq
        SET college_id = a.college_id
        FROM ai_generated_assessments a
        WHERE aq.assessment_id = a.id AND aq.college_id IS NULL;
    """,
    "cia_template_components": """
        UPDATE cia_template_components c
        SET college_id = t.college_id
        FROM cia_templates t
        WHERE c.template_id = t.id AND c.college_id IS NULL;
    """,
    "placement_attempt_trackers": """
        UPDATE placement_attempt_trackers p
        SET college_id = u.college_id
        FROM users u
        WHERE p.student_id = u.id AND p.college_id IS NULL;
    """,
}


# ═══════════════════════════════════════════════════════════════════════════════
# Tables that already HAVE college_id but it's nullable — make NOT NULL
# ═══════════════════════════════════════════════════════════════════════════════

NULLABLE_TO_NOT_NULL = {
    # table_name: backfill SQL (fill any NULLs before flipping to NOT NULL)
    "program_outcomes": """
        UPDATE program_outcomes po
        SET college_id = d.college_id
        FROM departments d
        WHERE po.department_id = d.id AND po.college_id IS NULL;
    """,
    "course_enrollments": """
        UPDATE course_enrollments ce
        SET college_id = c.college_id
        FROM courses c
        WHERE ce.course_id = c.id AND ce.college_id IS NULL;
    """,
    "questions": """
        UPDATE questions q
        SET college_id = qz.college_id
        FROM quizzes qz
        WHERE q.quiz_id = qz.id AND q.college_id IS NULL;
    """,
    "options": """
        UPDATE options o
        SET college_id = q.college_id
        FROM questions q
        WHERE o.question_id = q.id AND o.college_id IS NULL;
    """,
    "quiz_attempts": """
        UPDATE quiz_attempts qa
        SET college_id = q.college_id
        FROM quizzes q
        WHERE qa.quiz_id = q.id AND qa.college_id IS NULL;
    """,
    "quiz_answers": """
        UPDATE quiz_answers qa
        SET college_id = qat.college_id
        FROM quiz_attempts qat
        WHERE qa.attempt_id = qat.id AND qa.college_id IS NULL;
    """,
    "proctoring_events": """
        UPDATE proctoring_events pe
        SET college_id = qa.college_id
        FROM quiz_attempts qa
        WHERE pe.attempt_id = qa.id AND pe.college_id IS NULL;
    """,
    "proctoring_violations": """
        UPDATE proctoring_violations pv
        SET college_id = qa.college_id
        FROM quiz_attempts qa
        WHERE pv.attempt_id = qa.id AND pv.college_id IS NULL;
    """,
    "appeals": """
        UPDATE appeals a
        SET college_id = pv.college_id
        FROM proctoring_violations pv
        WHERE a.violation_id = pv.id AND a.college_id IS NULL;
    """,
    "mark_submission_entries": """
        UPDATE mark_submission_entries mse
        SET college_id = ms.college_id
        FROM mark_submissions ms
        WHERE mse.submission_id = ms.id AND mse.college_id IS NULL;
    """,
    "semester_grades": """
        UPDATE semester_grades sg
        SET college_id = u.college_id
        FROM users u
        WHERE sg.student_id = u.id AND sg.college_id IS NULL;
    """,
    "challenge_progress": """
        UPDATE challenge_progress cp
        SET college_id = u.college_id
        FROM users u
        WHERE cp.student_id = u.id AND cp.college_id IS NULL;
    """,
    "premium_challenge_progress": """
        UPDATE premium_challenge_progress pcp
        SET college_id = u.college_id
        FROM users u
        WHERE pcp.student_id = u.id AND pcp.college_id IS NULL;
    """,
    "alumni_event_registrations": """
        UPDATE alumni_event_registrations aer
        SET college_id = ae.college_id
        FROM alumni_events ae
        WHERE aer.event_id = ae.id AND aer.college_id IS NULL;
    """,
}


# Tables that now have college_id and need RLS policies
NEWLY_RLS_TABLES = [
    "course_outcomes",
    "co_po_mappings",
    "co_pso_mappings",
    "ai_generated_assessments",
    "assessment_questions",
    "cia_template_components",
    "placement_attempt_trackers",
]


def upgrade() -> None:
    # ── PHASE 1: Add new college_id columns (nullable initially for backfill) ──
    for table in NEW_COLLEGE_ID_TABLES:
        op.add_column(table, sa.Column('college_id', sa.String(), nullable=True))
        op.create_index(f'ix_{table}_college_id', table, ['college_id'])
        op.create_foreign_key(
            f'fk_{table}_college_id',
            table, 'colleges',
            ['college_id'], ['id'],
            ondelete='CASCADE'
        )

    # ── PHASE 2: Backfill new columns from parent entities ─────────────────
    # Order matters: course_outcomes before co_po_mappings and co_pso_mappings
    # ai_generated_assessments before assessment_questions
    for table, backfill_sql in NEW_COLLEGE_ID_TABLES.items():
        op.execute(backfill_sql)

    # ── PHASE 3: Set new columns to NOT NULL ───────────────────────────────
    # Delete orphans (rows that couldn't be backfilled — no valid parent)
    for table in NEW_COLLEGE_ID_TABLES:
        op.execute(f"DELETE FROM {table} WHERE college_id IS NULL;")
        op.alter_column(table, 'college_id', nullable=False)

    # ── PHASE 4: Backfill existing nullable college_id columns ─────────────
    # Must run in dependency order: questions before options, quiz_attempts before quiz_answers etc.
    ordered_tables = [
        "program_outcomes",
        "course_enrollments",
        "questions",
        "quiz_attempts",
        "options",          # depends on questions
        "quiz_answers",     # depends on quiz_attempts
        "proctoring_events",     # depends on quiz_attempts
        "proctoring_violations", # depends on quiz_attempts
        "appeals",               # depends on proctoring_violations
        "mark_submission_entries",
        "semester_grades",
        "challenge_progress",
        "premium_challenge_progress",
        "alumni_event_registrations",
    ]

    for table in ordered_tables:
        backfill_sql = NULLABLE_TO_NOT_NULL[table]
        op.execute(backfill_sql)

    # Delete orphans and set NOT NULL
    for table in ordered_tables:
        op.execute(f"DELETE FROM {table} WHERE college_id IS NULL;")
        op.alter_column(table, 'college_id', nullable=False)

    # ── PHASE 5: Enable RLS on newly scoped tables ─────────────────────────
    for table in NEWLY_RLS_TABLES:
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

    # Remove cia_template_components from RLS exempt list comment
    # (already handled above — it now has college_id and RLS)


def downgrade() -> None:
    # ── Reverse RLS policies ───────────────────────────────────────────────
    for table in reversed(NEWLY_RLS_TABLES):
        op.execute(f"DROP POLICY IF EXISTS superuser_bypass ON {table};")
        op.execute(f"DROP POLICY IF EXISTS tenant_isolation ON {table};")
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;")
        op.execute(f"ALTER TABLE {table} NO FORCE ROW LEVEL SECURITY;")

    # ── Revert nullable columns back to nullable ───────────────────────────
    ordered_tables = list(NULLABLE_TO_NOT_NULL.keys())
    for table in ordered_tables:
        op.alter_column(table, 'college_id', nullable=True)

    # ── Drop new college_id columns ────────────────────────────────────────
    for table in reversed(list(NEW_COLLEGE_ID_TABLES.keys())):
        op.drop_constraint(f'fk_{table}_college_id', table, type_='foreignkey')
        op.drop_index(f'ix_{table}_college_id', table)
        op.drop_column(table, 'college_id')
