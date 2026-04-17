import re
import sys

content = open(r'C:\AcadMix\backend\app\services\ai_service.py', encoding='utf-8').read()

new_func = """async def generate_insights_sql(user_query: str, history: List[Dict[str, str]] = None, role: str = "") -> str:
    \"\"\"Uses LLM to convert a natural language query into a PostgreSQL SELECT query.\"\"\"
    model = get_tier1_model()
    fallbacks = get_fallbacks_for(model)
    role_upper = role.upper()
    
    # Base Schema for generic roles
    students_schema = "- v_students(id, name, email, roll_number, department, section, current_semester, cgpa, graduation_year)"
    attendance_schema = "- v_attendance(id, student_id, date, subject_code, status, is_late_entry, department, section)"
    invoices_schema = "- v_invoices(id, student_id, fee_type, total_amount, academic_year, due_date, department, section)"
    payments_schema = "- v_payments(id, student_id, invoice_id, amount_paid, status, transaction_date, department, section)"
    departments_schema = "- v_departments(id, name, code, hod_user_id)"
    
    # Advanced Schemas
    placements_schema = \"\"\"- v_companies(id, name, sector, website)
- v_placement_drives(id, company_id, role_title, drive_type, package_lpa, drive_date, status, min_cgpa)
- v_placement_applications(id, drive_id, student_id, status, registered_at)\"\"\"
    
    exams_schema = \"\"\"- v_quizzes(id, title, subject_code, department, status, total_marks)
- v_quiz_attempts(id, quiz_id, student_id, score, status)\"\"\"

    schemas = [students_schema, departments_schema]
    constraints = []
    
    if role_upper == "TPO":
        schemas.append(placements_schema)
        # Strongly constrain TPO logic
        constraints.append("You are querying only Placement and Student data. DO NOT attempt to query attendance or invoices.")
    else:
        schemas.append(attendance_schema)
        schemas.append(invoices_schema)
        schemas.append(payments_schema)
        
    if role_upper in ["EXAM_CELL", "SUPERADMIN", "PRINCIPAL", "ADMIN", "FACULTY", "HOD", "DHTE_NODAL", "INSTITUTIONAL_NODAL"]:
        schemas.append(exams_schema)
        
    if role_upper in ["SUPERADMIN", "PRINCIPAL", "ADMIN", "DHTE_NODAL", "INSTITUTIONAL_NODAL"]:
        schemas.append(placements_schema)
        
    schema_str = "\\n".join(schemas)
    constraint_str = "\\n".join(constraints)
    
    schema_context = f'''
YOU MUST ONLY QUERY FROM THESE VIEWS. Never query actual tables like 'users' or 'attendance_records'.
{schema_str}

RULES:
1. Return ONLY valid PostgreSQL SELECT query string. NO text, NO markdown formatting, NO explanation.
2. Assume the tables are already filtered to the user's role scope. You do not need to filter by college_id.
3. Only use SELECT. Never use DROP, DELETE, UPDATE, INSERT.
4. Alias columns cleanly for human reading (e.g., "u.name AS Student_Name", "p.roll_number AS Roll_Number").
{constraint_str}
'''

    messages = [{"role": "system", "content": schema_context}]
    if history:
        for msg in history:
            messages.append(msg)
    messages.append({"role": "user", "content": f"Write a query for: {user_query}"})

    try:
        response = await litellm.acompletion(
            model=model,
            fallbacks=fallbacks,
            messages=messages,
            temperature=0.0,
            max_tokens=600,
            timeout=15.0
        )
        content = response.choices[0].message.content.strip()
        if content.startswith("```sql"):
            content = content[6:-3].strip()
        elif content.startswith("```"):
            content = content[3:-3].strip()
        return content
    except Exception as e:
        logger.error("Error generating insights SQL: %s", e)
        raise ValueError("Failed to generate database query. AI service unavailable.")"""


content_new = re.sub(r'async def generate_insights_sql.*?raise ValueError\("Failed to generate database query\. AI service unavailable\."\)', new_func, content, flags=re.DOTALL)

with open(r'C:\AcadMix\backend\app\services\ai_service.py', 'w', encoding='utf-8') as f:
    f.write(content_new)
print('Replaced')
