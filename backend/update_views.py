import re
import sys

content = open(r'C:\AcadMix\backend\app\services\insights_executor.py', encoding='utf-8').read()

new_func = """async def _setup_temporary_views(session: AsyncSession, college_id: str, role: str, user_id: str):
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
        CREATE TEMPORARY VIEW v_students AS 
            SELECT u.id, u.name, u.email, p.roll_number, p.department, p.section, p.current_semester, p.cgpa, p.graduation_year
            FROM users u 
            JOIN user_profiles p ON u.id = p.user_id 
            WHERE u.{col_filter} {dept_filter} AND u.is_deleted = false AND u.role = 'STUDENT';
        ''')
    else:
        views_sql.append(f'''
        CREATE TEMPORARY VIEW v_students AS 
            SELECT u.id, u.name, u.email, p.roll_number, p.department, p.section, p.current_semester, p.cgpa, p.graduation_year
            FROM users u 
            JOIN user_profiles p ON u.id = p.user_id 
            WHERE u.{col_filter} {dept_filter} AND u.is_deleted = false AND u.role = 'STUDENT';
        ''')

    # Financial & Attendance
    if role_upper != "TPO":
        views_sql.append(f'''
        CREATE TEMPORARY VIEW v_attendance AS 
            SELECT a.id, a.student_id, a.date, a.subject_code, a.status, a.is_late_entry, p.department, p.section
            FROM attendance_records a
            JOIN user_profiles p ON a.student_id = p.user_id
            WHERE a.{col_filter} {dept_filter} AND a.is_deleted = false;

        CREATE TEMPORARY VIEW v_invoices AS
            SELECT i.id, i.student_id, i.fee_type, i.total_amount, i.academic_year, i.due_date, p.department, p.section
            FROM student_fee_invoices i
            JOIN user_profiles p ON i.student_id = p.user_id
            WHERE i.{col_filter} {dept_filter} AND i.is_deleted = false;

        CREATE TEMPORARY VIEW v_payments AS
            SELECT fp.id, fp.student_id, fp.invoice_id, fp.amount_paid, fp.status, fp.transaction_date, p.department, p.section
            FROM fee_payments fp
            JOIN user_profiles p ON fp.student_id = p.user_id
            WHERE fp.{col_filter} {dept_filter} AND fp.is_deleted = false;
        ''')
        
    views_sql.append(f'''
    CREATE TEMPORARY VIEW v_departments AS
        SELECT id, name, code, hod_user_id
        FROM departments
        WHERE {col_filter} AND is_deleted = false;
    ''')

    if role_upper in ["TPO", "SUPERADMIN", "PRINCIPAL", "ADMIN", "DHTE_NODAL", "INSTITUTIONAL_NODAL"]:
        views_sql.append(f'''
        CREATE TEMPORARY VIEW v_companies AS
            SELECT id, name, sector, website
            FROM companies
            WHERE {col_filter} AND is_deleted = false;
            
        CREATE TEMPORARY VIEW v_placement_drives AS
            SELECT id, company_id, role_title, drive_type, package_lpa, drive_date, status, min_cgpa
            FROM placement_drives
            WHERE {col_filter} AND is_deleted = false;
            
        CREATE TEMPORARY VIEW v_placement_applications AS
            SELECT a.id, a.drive_id, a.student_id, a.status, a.registered_at
            FROM placement_applications a
            WHERE a.{col_filter} AND a.is_deleted = false;
        ''')

    if role_upper in ["EXAM_CELL", "SUPERADMIN", "PRINCIPAL", "ADMIN", "FACULTY", "HOD", "DHTE_NODAL", "INSTITUTIONAL_NODAL"]:
        views_sql.append(f'''
        CREATE TEMPORARY VIEW v_quizzes AS
            SELECT q.id, q.title, q.subject_code, q.department, q.status, q.total_marks
            FROM quizzes q
            WHERE q.{col_filter} AND q.is_deleted = false;
            
        CREATE TEMPORARY VIEW v_quiz_attempts AS
            SELECT qa.id, qa.quiz_id, qa.student_id, qa.score, qa.status
            FROM quiz_attempts qa
            WHERE qa.{col_filter} AND qa.is_deleted = false;
        ''')

    await session.execute(text("\\n".join(views_sql)))"""

content_new = re.sub(r'async def _setup_temporary_views.*?await session\.execute\(text\(views_sql\)\)', new_func, content, flags=re.DOTALL)

with open(r'C:\AcadMix\backend\app\services\insights_executor.py', 'w', encoding='utf-8') as f:
    f.write(content_new)
print('Replaced')
