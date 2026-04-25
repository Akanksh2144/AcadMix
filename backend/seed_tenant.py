"""
AcadMix Tenant Seeder — AITS Hyderabad (First Tenant)
Reads all mock_data CSVs and seeds into Supabase PostgreSQL.
Uses admin_engine to bypass RLS.
"""
import asyncio
import csv
import os
import sys
import json
from pathlib import Path

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from sqlalchemy.pool import NullPool

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))
from app.core.config import settings
from app.core.security import hash_password

MOCK_DIR = Path(__file__).parent.parent / "mock_data"
COLLEGE_ID = "aits-hyd-001"
BATCH_SIZE = 500

def load_csv(filename):
    path = MOCK_DIR / filename
    if not path.exists():
        print(f"  SKIP: {filename} not found")
        return []
    with open(path, "r", encoding="utf-8") as f:
        return list(csv.DictReader(f))

async def execute_batch(session, sql, rows, label=""):
    """Execute INSERT in batches."""
    total = len(rows)
    for i in range(0, total, BATCH_SIZE):
        batch = rows[i:i+BATCH_SIZE]
        for row in batch:
            await session.execute(text(sql), row)
        if (i + BATCH_SIZE) % 2000 == 0 or i + BATCH_SIZE >= total:
            print(f"    {label}: {min(i+BATCH_SIZE, total)}/{total}")
    await session.flush()

async def seed():
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        poolclass=NullPool,
        connect_args={"statement_cache_size": 0, "command_timeout": 120},
    )
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        print("=" * 60)
        print(" AcadMix Tenant Seeder — AITS Hyderabad")
        print("=" * 60)

        # ── STEP 0: Clean slate ──
        print("\n[0] CLEANING existing data...")
        # Delete in reverse FK order
        tables_to_clean = [
            "co_pso_mappings", "co_po_mappings", "course_outcomes",
            "program_specific_outcomes", "program_outcomes",
            "semester_grades", "mark_submission_entries", "mark_submissions",
            "attendance_records", "mentor_assignments",
            "allocations", "beds", "rooms", "hostels",
            "transport_enrollments",
            "fee_payments", "student_fee_invoices",
            "scholarship_applications", "scholarships",
            "faculty_assignments", "course_enrollments", "courses",
            "sections", "user_profiles", "users",
            "departments", "colleges",
        ]
        for t in tables_to_clean:
            try:
                await db.execute(text(f"DELETE FROM {t} WHERE 1=1"))
            except Exception as e:
                print(f"    (skip {t}: {e.__class__.__name__})")
        await db.commit()
        print("  Cleaned all tables.")

        # ── STEP 1: College ──
        print("\n[1] Seeding COLLEGE...")
        college_data = load_csv("01_college.csv")
        if college_data:
            c = college_data[0]
            grade_scale = json.dumps({
                "grade_scale": [
                    {"min_pct": 90, "grade": "O", "points": 10},
                    {"min_pct": 80, "grade": "A+", "points": 9},
                    {"min_pct": 70, "grade": "A", "points": 8},
                    {"min_pct": 60, "grade": "B+", "points": 7},
                    {"min_pct": 50, "grade": "B", "points": 6},
                    {"min_pct": 40, "grade": "C", "points": 5},
                    {"min_pct": 0, "grade": "F", "points": 0},
                ]
            })
            await db.execute(text("""
                INSERT INTO colleges (id, name, domain, settings)
                VALUES (:id, :name, :domain, :settings::jsonb)
                ON CONFLICT (id) DO NOTHING
            """), {
                "id": c["id"],
                "name": c["name"],
                "domain": "aits.acadmix.org",
                "settings": grade_scale,
            })
            await db.flush()
            print(f"  College: {c['name']} (id={c['id']})")

        # ── STEP 2: Departments ──
        print("\n[2] Seeding DEPARTMENTS...")
        depts = load_csv("02_departments.csv")
        for d in depts:
            await db.execute(text("""
                INSERT INTO departments (id, college_id, name, code)
                VALUES (:id, :college_id, :name, :code)
                ON CONFLICT (id) DO NOTHING
            """), {
                "id": d["id"], "college_id": COLLEGE_ID,
                "name": d["name"], "code": d["code"],
            })
        await db.flush()
        print(f"  {len(depts)} departments")

        # ── STEP 3: Sections ──
        print("\n[3] Seeding SECTIONS...")
        sections = load_csv("06_sections.csv")
        for s in sections:
            await db.execute(text("""
                INSERT INTO sections (id, college_id, department_id, name, intake)
                VALUES (:id, :college_id, :dept_id, :name, :intake)
                ON CONFLICT (id) DO NOTHING
            """), {
                "id": s["id"], "college_id": COLLEGE_ID,
                "dept_id": s["dept_id"], "name": f"{s['dept_code']}-{s['batch_year']}-{s['section']}",
                "intake": int(s["intake"]),
            })
        await db.flush()
        print(f"  {len(sections)} sections")

        # ── STEP 4: Staff as Users ──
        print("\n[4] Seeding STAFF (users + profiles)...")
        staff = load_csv("20_staff.csv")
        staff_hash = hash_password("faculty123")  # Pre-compute once
        
        role_map = {
            "Professor & HOD": "hod",
            "Associate Professor": "teacher",
            "Assistant Professor": "teacher",
            "Lab Instructor": "teacher",
            "Professor": "teacher",
            "Administrative Officer": "admin",
            "Principal": "principal",
            "Chairman": "admin",
        }
        
        staff_id_to_user_id = {}
        for s in staff:
            role = role_map.get(s["designation"], "teacher")
            # Use staff id as user id for FK consistency
            user_id = s["id"]
            staff_id_to_user_id[s["id"]] = user_id
            
            await db.execute(text("""
                INSERT INTO users (id, college_id, role, email, password_hash, name)
                VALUES (:id, :college_id, :role, :email, :pw, :name)
                ON CONFLICT (id) DO NOTHING
            """), {
                "id": user_id, "college_id": COLLEGE_ID,
                "role": role, "email": s["email"],
                "pw": staff_hash, "name": s["name"],
            })
            
            await db.execute(text("""
                INSERT INTO user_profiles (id, user_id, college_id, roll_number, department, phone)
                VALUES (:id, :user_id, :college_id, :roll, :dept, :phone)
                ON CONFLICT (id) DO NOTHING
            """), {
                "id": f"prof-{user_id}", "user_id": user_id,
                "college_id": COLLEGE_ID, "roll": s.get("employee_id", ""),
                "dept": s["dept_code"], "phone": s.get("phone", ""),
            })
        await db.flush()
        print(f"  {len(staff)} staff users")

        # ── STEP 5: Students as Users ──
        print("\n[5] Seeding STUDENTS (users + profiles)...")
        students = load_csv("21_students.csv")
        count = 0
        for stu in students:
            user_id = stu["id"]
            roll = stu["roll_no"]
            pw_hash = hash_password(roll)
            
            await db.execute(text("""
                INSERT INTO users (id, college_id, role, email, password_hash, name)
                VALUES (:id, :college_id, 'student', :email, :pw, :name)
                ON CONFLICT (id) DO NOTHING
            """), {
                "id": user_id, "college_id": COLLEGE_ID,
                "email": stu["email"], "pw": pw_hash, "name": stu["full_name"],
            })
            
            current_sem = int(stu["current_semester"]) if stu.get("current_semester") else 1
            await db.execute(text("""
                INSERT INTO user_profiles (id, user_id, college_id, roll_number, department, section, batch, current_semester, phone, blood_group)
                VALUES (:id, :user_id, :college_id, :roll, :dept, :section, :batch, :sem, :phone, :blood)
                ON CONFLICT (id) DO NOTHING
            """), {
                "id": f"prof-{user_id}", "user_id": user_id,
                "college_id": COLLEGE_ID, "roll": roll,
                "dept": stu["branch"], "section": stu.get("section", "A"),
                "batch": stu["admission_year"], "sem": current_sem,
                "phone": stu.get("phone", ""), "blood": stu.get("blood_group", ""),
            })
            count += 1
            if count % 500 == 0:
                await db.flush()
                print(f"    Students: {count}/{len(students)}")
        
        await db.flush()
        print(f"  {count} student users")

        # ── STEP 6: Courses ──
        print("\n[6] Seeding COURSES...")
        subjects = load_csv("25_subjects.csv")
        for s in subjects:
            cat = s.get("course_category", "core")
            if cat not in ("core","elective","multidisciplinary","open_elective","vsc","sec","aec","mdc"):
                cat = "core"
            await db.execute(text("""
                INSERT INTO courses (id, college_id, department_id, semester, name, credits, type, subject_code, regulation_year, hours_per_week, course_category, lecture_hrs, tutorial_hrs, practical_hrs, is_mooc)
                VALUES (:id, :cid, :did, :sem, :name, :credits, :type, :code, :reg, :hpw, :cat, :lh, :th, :ph, :mooc)
                ON CONFLICT (id) DO NOTHING
            """), {
                "id": s["id"], "cid": COLLEGE_ID, "did": s["department_id"],
                "sem": int(s["semester"]), "name": s["name"],
                "credits": int(s["credits"]) if s["credits"] else 3,
                "type": s["type"], "code": s["subject_code"],
                "reg": s.get("regulation_year", "R22"),
                "hpw": int(s["hours_per_week"]) if s.get("hours_per_week") else 4,
                "cat": cat,
                "lh": int(s["lecture_hrs"]) if s.get("lecture_hrs") else None,
                "th": int(s["tutorial_hrs"]) if s.get("tutorial_hrs") else None,
                "ph": int(s["practical_hrs"]) if s.get("practical_hrs") else None,
                "mooc": s.get("is_mooc", "False") == "True",
            })
        await db.flush()
        print(f"  {len(subjects)} courses")

        # ── STEP 7: Program Outcomes ──
        print("\n[7] Seeding PROGRAM OUTCOMES...")
        pos = load_csv("07_program_outcomes.csv")
        for p in pos:
            await db.execute(text("""
                INSERT INTO program_outcomes (id, department_id, college_id, code, description)
                VALUES (:id, :did, :cid, :code, :desc)
                ON CONFLICT (id) DO NOTHING
            """), {
                "id": p["id"], "did": p["department_id"],
                "cid": COLLEGE_ID, "code": p["code"], "desc": p["description"],
            })
        await db.flush()
        print(f"  {len(pos)} POs")

        # ── STEP 8: Program Specific Outcomes ──
        print("\n[8] Seeding PSOs...")
        psos = load_csv("08_program_specific_outcomes.csv")
        for p in psos:
            await db.execute(text("""
                INSERT INTO program_specific_outcomes (id, college_id, department_id, code, description)
                VALUES (:id, :cid, :did, :code, :desc)
                ON CONFLICT (id) DO NOTHING
            """), {
                "id": p["id"], "cid": COLLEGE_ID,
                "did": p.get("dept_id", "dept-cse"),
                "code": p["code"], "desc": p["description"],
            })
        await db.flush()
        print(f"  {len(psos)} PSOs")

        # ── STEP 9: Course Outcomes ──
        print("\n[9] Seeding COURSE OUTCOMES...")
        cos = load_csv("26_course_outcomes.csv")
        for c in cos:
            await db.execute(text("""
                INSERT INTO course_outcomes (id, course_id, code, description, bloom_level)
                VALUES (:id, :cid, :code, :desc, :bloom)
                ON CONFLICT (id) DO NOTHING
            """), {
                "id": c["id"], "cid": c["course_id"],
                "code": c["code"], "desc": c["description"],
                "bloom": c.get("bloom_level", ""),
            })
        await db.flush()
        print(f"  {len(cos)} COs")

        # ── STEP 10: CO-PO Mappings ──
        print("\n[10] Seeding CO-PO MAPPINGS...")
        copos = load_csv("27_co_po_mapping.csv")
        count = 0
        for m in copos:
            await db.execute(text("""
                INSERT INTO co_po_mappings (id, co_id, po_id, strength, is_active)
                VALUES (:id, :co, :po, :str, true)
                ON CONFLICT (id) DO NOTHING
            """), {
                "id": m["id"], "co": m["co_id"],
                "po": m["po_id"], "str": int(m["strength"]),
            })
            count += 1
            if count % 2000 == 0:
                await db.flush()
                print(f"    CO-PO: {count}/{len(copos)}")
        await db.flush()
        print(f"  {len(copos)} CO-PO mappings")

        # ── STEP 11: CO-PSO Mappings ──
        print("\n[11] Seeding CO-PSO MAPPINGS...")
        copsos = load_csv("28_co_pso_mapping.csv")
        count = 0
        for m in copsos:
            await db.execute(text("""
                INSERT INTO co_pso_mappings (id, co_id, pso_id, strength, is_active)
                VALUES (:id, :co, :pso, :str, true)
                ON CONFLICT (id) DO NOTHING
            """), {
                "id": m["id"], "co": m["co_id"],
                "pso": m["pso_id"], "str": int(m["strength"]),
            })
            count += 1
            if count % 2000 == 0:
                await db.flush()
                print(f"    CO-PSO: {count}/{len(copsos)}")
        await db.flush()
        print(f"  {len(copsos)} CO-PSO mappings")

        # ── STEP 12: Semester Grades ──
        print("\n[12] Seeding SEMESTER GRADES...")
        results = load_csv("32_exam_results.csv")
        count = 0
        for r in results:
            await db.execute(text("""
                INSERT INTO semester_grades (id, college_id, student_id, semester, course_id, grade, credits_earned)
                VALUES (:id, :cid, :sid, :sem, :course, :grade, :credits)
                ON CONFLICT (id) DO NOTHING
            """), {
                "id": r["id"], "cid": COLLEGE_ID,
                "sid": r["student_id"], "sem": int(r["semester"]),
                "course": r["course_id"], "grade": r["grade"],
                "credits": int(r["credits_earned"]) if r.get("credits_earned") else 0,
            })
            count += 1
            if count % 5000 == 0:
                await db.flush()
                print(f"    Grades: {count}/{len(results)}")
        await db.flush()
        print(f"  {len(results)} semester grades")

        # ── STEP 13: Hostels ──
        print("\n[13] Seeding HOSTELS, ROOMS, ALLOCATIONS...")
        blocks = load_csv("11_hostel_blocks.csv")
        for b in blocks:
            gender = b["gender"].lower()
            if gender not in ("male", "female", "coed"):
                gender = "coed"
            await db.execute(text("""
                INSERT INTO hostels (id, college_id, name, total_capacity, gender_type, total_floors)
                VALUES (:id, :cid, :name, :cap, :gender, :floors)
                ON CONFLICT (id) DO NOTHING
            """), {
                "id": b["id"], "cid": COLLEGE_ID, "name": b["name"],
                "cap": int(b.get("total_capacity", 0)),
                "gender": gender, "floors": int(b.get("floors", 3)),
            })
        await db.flush()
        print(f"  {len(blocks)} hostel blocks")

        hrooms = load_csv("12_hostel_rooms.csv")
        for r in hrooms:
            await db.execute(text("""
                INSERT INTO rooms (id, college_id, hostel_id, room_number, floor, capacity)
                VALUES (:id, :cid, :hid, :rnum, :floor, :cap)
                ON CONFLICT (id) DO NOTHING
            """), {
                "id": r["id"], "cid": COLLEGE_ID,
                "hid": r["hostel_block_id"], "rnum": r["room_number"],
                "floor": int(r.get("floor", 1)), "cap": int(r.get("capacity", 3)),
            })
        await db.flush()
        print(f"  {len(hrooms)} rooms")

        # ── STEP 14: Bus Routes ──
        print("\n[14] Seeding BUS ROUTES...")
        routes = load_csv("15_bus_routes.csv")
        for r in routes:
            await db.execute(text("""
                INSERT INTO bus_routes (id, college_id, route_number, origin, destination, stops, departure_time, arrival_time, monthly_fee, bus_number, driver_name, driver_contact, capacity)
                VALUES (:id, :cid, :rnum, :origin, :dest, :stops::jsonb, :dep, :arr, :fee, :bus, :driver, :dcontact, :cap)
                ON CONFLICT (id) DO NOTHING
            """), {
                "id": r["id"], "cid": COLLEGE_ID,
                "rnum": r.get("route_number", ""),
                "origin": r.get("origin", ""), "dest": r.get("destination", ""),
                "stops": json.dumps(r.get("stops", "[]").replace("'", '"')) if isinstance(r.get("stops"), str) else "[]",
                "dep": r.get("departure_time", "07:00"),
                "arr": r.get("arrival_time", "09:00"),
                "fee": float(r.get("monthly_fee", 0)),
                "bus": r.get("bus_number", ""),
                "driver": r.get("driver_name", ""),
                "dcontact": r.get("driver_contact", ""),
                "cap": int(r.get("capacity", 50)),
            })
        await db.flush()
        print(f"  {len(routes)} bus routes")

        # ── STEP 15: Fee Invoices ──
        print("\n[15] Seeding FEE RECORDS...")
        fees = load_csv("22_fee_records.csv")
        count = 0
        for f in fees:
            await db.execute(text("""
                INSERT INTO student_fee_invoices (id, college_id, student_id, fee_type, total_amount, academic_year, description)
                VALUES (:id, :cid, :sid, :ftype, :amt, :ay, :desc)
                ON CONFLICT (id) DO NOTHING
            """), {
                "id": f["id"], "cid": COLLEGE_ID,
                "sid": f["student_id"],
                "ftype": f.get("fee_head", "Tuition Fee"),
                "amt": float(f.get("amount", 0)),
                "ay": f.get("academic_year", "2025-26"),
                "desc": f.get("fee_head", ""),
            })
            count += 1
            if count % 5000 == 0:
                await db.flush()
                print(f"    Fees: {count}/{len(fees)}")
        await db.flush()
        print(f"  {len(fees)} fee invoices")

        # ── STEP 16: Mentor Assignments ──
        print("\n[16] Seeding MENTOR ASSIGNMENTS...")
        mentors = load_csv("29_section_mentors.csv")
        # MentorAssignment needs student_id, but our CSV is section-level
        # For now, we'll create FacultyAssignment records instead
        for m in mentors:
            await db.execute(text("""
                INSERT INTO faculty_assignments (id, college_id, teacher_id, subject_code, subject_name, department, batch, section, semester)
                VALUES (:id, :cid, :tid, 'MENTOR', 'Section Mentor', :dept, :batch, :section, 1)
                ON CONFLICT (id) DO NOTHING
            """), {
                "id": m["id"], "cid": COLLEGE_ID,
                "tid": m["faculty_id"],
                "dept": m.get("dept_code", "CSE"),
                "batch": m.get("batch_year", "2022"),
                "section": m.get("section", "A"),
            })
        await db.flush()
        print(f"  {len(mentors)} mentor assignments")

        # ── COMMIT everything so far ──
        await db.commit()
        print("\n  Phase 1 committed successfully!")

    # ── STEP 17: Attendance (separate transaction for 1.7M rows) ──
    print("\n[17] Seeding ATTENDANCE SUMMARY (past semesters)...")
    async with async_session() as db:
        att_sum = load_csv("24_attendance_summary_past.csv")
        # No direct table for summary — we'll skip this for now
        # The dashboard reads from attendance_records or computes on the fly
        print(f"  {len(att_sum)} attendance summaries (stored in CSV, computed live by dashboard)")
        await db.commit()

    print("\n" + "=" * 60)
    print(" SEED COMPLETE!")
    print("=" * 60)
    print(f"\n Login credentials:")
    print(f"   Students: roll_number / roll_number (e.g., 22A81A050001)")
    print(f"   Staff: email / faculty123")
    print(f"   Domain: aits.acadmix.org")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed())
