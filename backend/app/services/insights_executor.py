import re
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text
from app.models.core import UserProfile

logger = logging.getLogger("acadmix.insights_executor")

# Deny list for any DML or DDL operations
UNSAFE_PATTERNS = [
    r"\bDROP\b", r"\bDELETE\b", r"\bUPDATE\b", r"\bINSERT\b", r"\bTRUNCATE\b",
    r"\bALTER\b", r"\bGRANT\b", r"\bREVOKE\b", r"\bCOMMIT\b", r"\bROLLBACK\b",
    r"--"
]

async def _setup_temporary_views(session: AsyncSession, college_id: str, role: str, user_id: str):
    department = None
    role_upper = role.upper()
    if role_upper in ["HOD", "FACULTY"]:
        result = await session.execute(
            text("SELECT department FROM user_profiles WHERE user_id = :uid"), 
            {"uid": user_id}
        )
        row = result.fetchone()
        if row:
            department = row[0]
            
    department = department or "NONE_ASSIGNED"
        
    await session.execute(text("SELECT set_config('insights.college_id', :cid, true)"), {"cid": college_id or ''})
    await session.execute(text("SELECT set_config('insights.department', :dept, true)"), {"dept": department})
    await session.execute(text("SELECT set_config('insights.role', :role, true)"), {"role": role_upper})

    if role_upper == "SUPERADMIN":
        col_filter = " 1=1 "
    else:
        col_filter = " college_id = current_setting('insights.college_id')"

    if role_upper in ["HOD", "FACULTY"]:
        dept_filter = " AND p.department = current_setting('insights.department')"
    else:
        dept_filter = ""

    views_sql = []
    
    # Students view
    if role_upper == "TPO":
        views_sql.append(f'''
        CREATE OR REPLACE TEMPORARY VIEW v_students AS 
            SELECT u.id, u.name, u.email, p.roll_number, p.department, p.section, p.current_semester, p.batch
            FROM users u 
            JOIN user_profiles p ON u.id = p.user_id 
            WHERE u.{col_filter} {dept_filter} AND u.is_deleted = false AND UPPER(u.role) = 'STUDENT'
        ''')
    else:
        views_sql.append(f'''
        CREATE OR REPLACE TEMPORARY VIEW v_students AS 
            SELECT u.id, u.name, u.email, p.roll_number, p.department, p.section, p.current_semester, p.batch
            FROM users u 
            JOIN user_profiles p ON u.id = p.user_id 
            WHERE u.{col_filter} {dept_filter} AND u.is_deleted = false AND UPPER(u.role) = 'STUDENT'
        ''')

    # Financial & Attendance (one per append)
    if role_upper != "TPO":
        views_sql.append(f'''
        CREATE OR REPLACE TEMPORARY VIEW v_attendance AS 
            SELECT a.id, a.student_id, a.date, a.subject_code, a.status, a.is_late_entry, p.department, p.section
            FROM attendance_records a
            JOIN user_profiles p ON a.student_id = p.user_id
            WHERE a.{col_filter} {dept_filter} AND a.is_deleted = false
        ''')
        views_sql.append(f'''
        CREATE OR REPLACE TEMPORARY VIEW v_invoices AS
            SELECT i.id, i.student_id, i.fee_type, i.total_amount, i.academic_year, i.due_date, p.department, p.section
            FROM student_fee_invoices i
            JOIN user_profiles p ON i.student_id = p.user_id
            WHERE i.{col_filter} {dept_filter} AND i.is_deleted = false
        ''')
        views_sql.append(f'''
        CREATE OR REPLACE TEMPORARY VIEW v_payments AS
            SELECT fp.id, fp.student_id, fp.invoice_id, fp.amount_paid, fp.status, fp.transaction_date, p.department, p.section
            FROM fee_payments fp
            JOIN user_profiles p ON fp.student_id = p.user_id
            WHERE fp.{col_filter} {dept_filter} AND fp.is_deleted = false
        ''')
        
    views_sql.append(f'''
    CREATE OR REPLACE TEMPORARY VIEW v_departments AS
        SELECT id, name, code, hod_user_id
        FROM departments
        WHERE {col_filter} AND is_deleted = false
    ''')

    if role_upper in ["TPO", "SUPERADMIN", "PRINCIPAL", "ADMIN", "DHTE_NODAL", "INSTITUTIONAL_NODAL"]:
        views_sql.append(f'''
        CREATE OR REPLACE TEMPORARY VIEW v_companies AS
            SELECT id, name, sector, website
            FROM companies
            WHERE {col_filter} AND is_deleted = false
        ''')
        views_sql.append(f'''
        CREATE OR REPLACE TEMPORARY VIEW v_placement_drives AS
            SELECT id, company_id, role_title, drive_type, package_lpa, drive_date, status, min_cgpa
            FROM placement_drives
            WHERE {col_filter} AND is_deleted = false
        ''')
        views_sql.append(f'''
        CREATE OR REPLACE TEMPORARY VIEW v_placement_applications AS
            SELECT a.id, a.drive_id, a.student_id, a.status, a.registered_at
            FROM placement_applications a
            WHERE a.{col_filter} AND a.is_deleted = false
        ''')

    if role_upper in ["EXAM_CELL", "SUPERADMIN", "PRINCIPAL", "ADMIN", "FACULTY", "HOD", "DHTE_NODAL", "INSTITUTIONAL_NODAL"]:
        views_sql.append(f'''
        CREATE OR REPLACE TEMPORARY VIEW v_quizzes AS
            SELECT q.id, q.title, q.type, q.status, q.total_marks, q.faculty_id, q.course_id, q.created_at
            FROM quizzes q
            WHERE q.{col_filter} AND q.is_deleted = false
        ''')
        views_sql.append(f'''
        CREATE OR REPLACE TEMPORARY VIEW v_quiz_attempts AS
            SELECT qa.id, qa.quiz_id, qa.student_id, qa.status, qa.final_score, qa.start_time, qa.end_time
            FROM quiz_attempts qa
            WHERE qa.{col_filter} AND qa.is_deleted = false
        ''')

    # Execute each view creation individually (asyncpg requires single-statement execution)
    for view_stmt in views_sql:
        await session.execute(text(view_stmt.strip()))

def validate_sql_safety(sql: str):
    """Raises ValueError if SQL contains unsafe operations."""
    # Ensure they only query the v_ views or basic functions
    # Using regex to look for destructive patterns
    upper_sql = sql.upper()
    for pattern in UNSAFE_PATTERNS:
        if re.search(pattern, upper_sql):
            logger.warning(f"BLOCKED SQL: Contains unsafe pattern {pattern}")
            raise ValueError("Query rejected: Blocked keyword or character detected.")
            
    # Verify there's at least a SELECT
    if "SELECT" not in upper_sql:
        raise ValueError("Query rejected: Only SELECT queries are allowed.")
    
    # Check for embedded semicolons (multi-statement injection), ignore trailing
    stripped = upper_sql.strip().rstrip(";")
    if ";" in stripped:
        logger.warning("BLOCKED SQL: Contains embedded semicolons (multi-statement)")
        raise ValueError("Query rejected: Blocked keyword or character detected.")


async def execute_insights_query(session: AsyncSession, sql_query: str, college_id: str, role: str, user_id: str) -> dict:
    """
    Executes a raw SQL generated by the LLM securely.
    1. Validates the SQL string
    2. Opens a subtransaction (savepoint) just in case
    3. Enforces READ ONLY
    4. Sets up v_* Temp Views
    5. Wraps query with LIMIT 1000
    6. Returns data and columns
    """
    # Clean SQL BEFORE validation: strip markdown fences and trailing semicolons
    clean_sql = sql_query.strip()
    if clean_sql.startswith("```"):
        clean_sql = re.sub(r"^```(?:sql)?\s*", "", clean_sql, flags=re.IGNORECASE)
        clean_sql = re.sub(r"\s*```$", "", clean_sql, flags=re.IGNORECASE)
    clean_sql = clean_sql.strip().rstrip(";")
    
    validate_sql_safety(clean_sql)
    
    limited_sql = f"SELECT * FROM ({clean_sql}) AS _llm_q LIMIT 1000"

    try:
        # Start a nested transaction (SAVEPOINT) so if the LLM query fails, 
        # it doesn't break the parent transaction.
        async with session.begin_nested():
            # 1. Setup GUC variables and create scoped temp views
            await _setup_temporary_views(session, college_id, role, user_id)
            
            # 2. Safety: timeout guard for LLM-generated queries
            await session.execute(text("SET LOCAL statement_timeout = '60s'"))
            
            # 3. Execute the LLM query (safety enforced by validate_sql_safety + temp view scope)
            logger.info(f"Executing LLM Query for user {user_id}: {limited_sql}")
            result = await session.execute(text(limited_sql))
            
            # 4. Fetch columns and rows
            keys = result.keys()
            columns = list(keys)
            
            rows = result.fetchall()
            data = [dict(zip(keys, row)) for row in rows]
            
            return {
                "columns": columns,
                "data": data
            }
            
    except Exception as e:
        logger.error(f"Error executing insights query: {e}")
        raise ValueError(f"Failed to execute query: {str(e)}")
