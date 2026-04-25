"""
AcadMix Tenant Seeder v3 — AITS Hyderabad
Key fix: COMMIT after each phase to prevent rollback cascade.
Grades inserted in separate mini-transactions of 5000 each.
"""
import asyncio, csv, os, sys, json, time
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from sqlalchemy.pool import NullPool

sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault("PYTHONUNBUFFERED", "1")
from app.core.config import settings
from app.core.security import hash_password

MOCK_DIR = Path(__file__).parent.parent / "mock_data"
COLLEGE_ID = "aits-hyd-001"

def load_csv(filename):
    path = MOCK_DIR / filename
    if not path.exists():
        print(f"  SKIP: {filename} not found", flush=True)
        return []
    with open(path, "r", encoding="utf-8") as f:
        return list(csv.DictReader(f))

def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)

async def get_engine():
    return create_async_engine(
        settings.DATABASE_URL, echo=False, poolclass=NullPool,
        connect_args={
            "statement_cache_size": 0,
            "command_timeout": 600,
        },
    )

async def run_phase(engine, label, fn):
    """Run a phase in its own session+transaction. Commits on success."""
    SM = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with SM() as db:
        try:
            await fn(db)
            await db.commit()
            log(f"  {label} — COMMITTED")
        except Exception as e:
            await db.rollback()
            log(f"  {label} — FAILED: {e}")
            raise

async def seed():
    log("Pre-hashing passwords...")
    STUDENT_PW = hash_password("student123")
    STAFF_PW = hash_password("faculty123")
    log("Passwords ready.")

    engine = await get_engine()
    log("=" * 60)
    log(" AcadMix Tenant Seeder v3 — AITS Hyderabad")
    log("=" * 60)

    # ── Phase 1: College + Departments + Sections ──
    async def phase1(db):
        log("[1] COLLEGE + DEPARTMENTS + SECTIONS...")
        c = load_csv("01_college.csv")[0]
        gs = json.dumps({"grade_scale": [
            {"min_pct": 90, "grade": "O", "points": 10},
            {"min_pct": 80, "grade": "A+", "points": 9},
            {"min_pct": 70, "grade": "A", "points": 8},
            {"min_pct": 60, "grade": "B+", "points": 7},
            {"min_pct": 50, "grade": "B", "points": 6},
            {"min_pct": 40, "grade": "C", "points": 5},
            {"min_pct": 0, "grade": "F", "points": 0},
        ]})
        await db.execute(text(
            "INSERT INTO colleges (id, name, domain, settings) VALUES (:id, :name, :domain, CAST(:s AS jsonb))"
        ), {"id": c["id"], "name": c["name"], "domain": "aits.acadmix.org", "s": gs})
        
        depts = load_csv("02_departments.csv")
        for d in depts:
            await db.execute(text(
                "INSERT INTO departments (id, college_id, name, code) VALUES (:id, :cid, :name, :code)"
            ), {"id": d["id"], "cid": COLLEGE_ID, "name": d["name"], "code": d["code"]})
        
        sections = load_csv("06_sections.csv")
        for s in sections:
            await db.execute(text(
                "INSERT INTO sections (id, college_id, department_id, name, intake) VALUES (:id, :cid, :did, :name, :intake)"
            ), {"id": s["id"], "cid": COLLEGE_ID, "did": s["dept_id"],
                "name": f"{s['dept_code']}-{s['batch_year']}-{s['section']}", "intake": int(s["intake"])})
        log(f"  1 college, {len(depts)} depts, {len(sections)} sections")

    await run_phase(engine, "Phase 1", phase1)

    # ── Phase 2: Staff ──
    async def phase2(db):
        log("[2] STAFF...")
        staff = load_csv("20_staff.csv")
        role_map = {"Professor & HOD": "hod", "Associate Professor": "teacher",
                    "Assistant Professor": "teacher", "Lab Instructor": "teacher",
                    "Professor": "teacher", "Administrative Officer": "admin",
                    "Principal": "principal", "Chairman": "admin"}
        for s in staff:
            role = role_map.get(s["designation"], "teacher")
            await db.execute(text(
                "INSERT INTO users (id, college_id, role, email, password_hash, name) VALUES (:id, :cid, :role, :email, :pw, :name)"
            ), {"id": s["id"], "cid": COLLEGE_ID, "role": role, "email": s["email"], "pw": STAFF_PW, "name": s["name"]})
            await db.execute(text(
                "INSERT INTO user_profiles (id, user_id, college_id, roll_number, department, phone) VALUES (:id, :uid, :cid, :roll, :dept, :phone)"
            ), {"id": f"prof-{s['id']}", "uid": s["id"], "cid": COLLEGE_ID,
                "roll": s.get("employee_id", ""), "dept": s["dept_code"], "phone": s.get("phone", "")})
        log(f"  {len(staff)} staff")

    await run_phase(engine, "Phase 2", phase2)

    # ── Phase 3: Students (batch of 500, each committed) ──
    log("[3] STUDENTS...")
    students = load_csv("21_students.csv")
    SM = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    for i in range(0, len(students), 500):
        batch = students[i:i+500]
        async with SM() as db:
            for stu in batch:
                await db.execute(text(
                    "INSERT INTO users (id, college_id, role, email, password_hash, name) VALUES (:id, :cid, 'student', :email, :pw, :name)"
                ), {"id": stu["id"], "cid": COLLEGE_ID, "email": stu["email"], "pw": STUDENT_PW, "name": stu["full_name"]})
                sem = int(stu["current_semester"]) if stu.get("current_semester") else 1
                await db.execute(text(
                    "INSERT INTO user_profiles (id, user_id, college_id, roll_number, department, section, batch, current_semester, phone, blood_group) "
                    "VALUES (:id, :uid, :cid, :roll, :dept, :sec, :batch, :sem, :phone, :blood)"
                ), {"id": f"prof-{stu['id']}", "uid": stu["id"], "cid": COLLEGE_ID,
                    "roll": stu["roll_no"], "dept": stu["branch"], "sec": stu.get("section", "A"),
                    "batch": stu["admission_year"], "sem": sem,
                    "phone": stu.get("phone", ""), "blood": stu.get("blood_group", "")})
            await db.commit()
        log(f"    Students: {min(i+500, len(students))}/{len(students)}")
    log(f"  {len(students)} students COMMITTED")

    # ── Phase 4: Courses ──
    async def phase4(db):
        log("[4] COURSES...")
        subjects = load_csv("25_subjects.csv")
        for s in subjects:
            cat = s.get("course_category", "core")
            valid = ("core","elective","multidisciplinary","open_elective","vsc","sec","aec","mdc")
            if cat not in valid: cat = "core"
            await db.execute(text(
                "INSERT INTO courses (id, college_id, department_id, semester, name, credits, type, subject_code, regulation_year, hours_per_week, course_category, lecture_hrs, tutorial_hrs, practical_hrs, is_mooc) "
                "VALUES (:id, :cid, :did, :sem, :name, :cr, :type, :code, :reg, :hpw, :cat, :lh, :th, :ph, :mooc)"
            ), {"id": s["id"], "cid": COLLEGE_ID, "did": s["department_id"],
                "sem": int(s["semester"]), "name": s["name"],
                "cr": int(s["credits"]) if s["credits"] else 3,
                "type": s["type"], "code": s["subject_code"],
                "reg": s.get("regulation_year", "R22"),
                "hpw": int(s["hours_per_week"]) if s.get("hours_per_week") else 4,
                "cat": cat,
                "lh": int(s["lecture_hrs"]) if s.get("lecture_hrs") else None,
                "th": int(s["tutorial_hrs"]) if s.get("tutorial_hrs") else None,
                "ph": int(s["practical_hrs"]) if s.get("practical_hrs") else None,
                "mooc": s.get("is_mooc", "False") == "True"})
        log(f"  {len(subjects)} courses")

    await run_phase(engine, "Phase 4", phase4)

    # ── Phase 5: POs + PSOs ──
    async def phase5(db):
        log("[5] POs + PSOs...")
        pos = load_csv("07_program_outcomes.csv")
        for p in pos:
            await db.execute(text(
                "INSERT INTO program_outcomes (id, department_id, college_id, code, description) VALUES (:id, :did, :cid, :code, :desc)"
            ), {"id": p["id"], "did": p["department_id"], "cid": COLLEGE_ID, "code": p["code"], "desc": p["description"]})
        psos = load_csv("08_program_specific_outcomes.csv")
        for p in psos:
            await db.execute(text(
                "INSERT INTO program_specific_outcomes (id, college_id, department_id, code, description) VALUES (:id, :cid, :did, :code, :desc)"
            ), {"id": p["id"], "cid": COLLEGE_ID, "did": p.get("dept_id", "dept-cse"), "code": p["code"], "desc": p["description"]})
        log(f"  {len(pos)} POs, {len(psos)} PSOs")

    await run_phase(engine, "Phase 5", phase5)

    # ── Phase 6: COs (batched) ──
    log("[6] COURSE OUTCOMES...")
    cos = load_csv("26_course_outcomes.csv")
    for i in range(0, len(cos), 1000):
        batch = cos[i:i+1000]
        async with SM() as db:
            for c in batch:
                await db.execute(text(
                    "INSERT INTO course_outcomes (id, course_id, code, description, bloom_level) VALUES (:id, :cid, :code, :desc, :bloom)"
                ), {"id": c["id"], "cid": c["course_id"], "code": c["code"], "desc": c["description"], "bloom": c.get("bloom_level", "")})
            await db.commit()
    log(f"  {len(cos)} COs COMMITTED")

    # ── Phase 7: CO-PO mappings (batched 2000) ──
    log("[7] CO-PO MAPPINGS...")
    copos = load_csv("27_co_po_mapping.csv")
    for i in range(0, len(copos), 2000):
        batch = copos[i:i+2000]
        async with SM() as db:
            for m in batch:
                await db.execute(text(
                    "INSERT INTO co_po_mappings (id, co_id, po_id, strength, is_active) VALUES (:id, :co, :po, :s, true)"
                ), {"id": m["id"], "co": m["co_id"], "po": m["po_id"], "s": int(m["strength"])})
            await db.commit()
        log(f"    CO-PO: {min(i+2000, len(copos))}/{len(copos)}")
    log(f"  {len(copos)} CO-PO COMMITTED")

    # ── Phase 8: CO-PSO mappings (batched) ──
    log("[8] CO-PSO MAPPINGS...")
    copsos = load_csv("28_co_pso_mapping.csv")
    for i in range(0, len(copsos), 2000):
        batch = copsos[i:i+2000]
        async with SM() as db:
            for m in batch:
                await db.execute(text(
                    "INSERT INTO co_pso_mappings (id, co_id, pso_id, strength, is_active) VALUES (:id, :co, :pso, :s, true)"
                ), {"id": m["id"], "co": m["co_id"], "pso": m["pso_id"], "s": int(m["strength"])})
            await db.commit()
        log(f"    CO-PSO: {min(i+2000, len(copsos))}/{len(copsos)}")
    log(f"  {len(copsos)} CO-PSO COMMITTED")

    # ── Phase 9: Semester Grades (batched 2000) ──
    log("[9] SEMESTER GRADES (95K rows, batched 2000)...")
    results = load_csv("32_exam_results.csv")
    for i in range(0, len(results), 2000):
        batch = results[i:i+2000]
        async with SM() as db:
            for r in batch:
                await db.execute(text(
                    "INSERT INTO semester_grades (id, college_id, student_id, semester, course_id, grade, credits_earned) "
                    "VALUES (:id, :cid, :sid, :sem, :course, :grade, :cr)"
                ), {"id": r["id"], "cid": COLLEGE_ID, "sid": r["student_id"],
                    "sem": int(r["semester"]), "course": r["course_id"],
                    "grade": r["grade"], "cr": int(r["credits_earned"]) if r.get("credits_earned") else 0})
            await db.commit()
        log(f"    Grades: {min(i+2000, len(results))}/{len(results)}")
    log(f"  {len(results)} grades COMMITTED")

    # ── Phase 10: Hostels + Rooms ──
    async def phase10(db):
        log("[10] HOSTELS + ROOMS...")
        blocks = load_csv("11_hostel_blocks.csv")
        for b in blocks:
            g = b["gender"].lower()
            if g not in ("male", "female", "coed"): g = "coed"
            await db.execute(text(
                "INSERT INTO hostels (id, college_id, name, total_capacity, gender_type, total_floors) VALUES (:id, :cid, :name, :cap, :g, :f)"
            ), {"id": b["id"], "cid": COLLEGE_ID, "name": b["name"],
                "cap": int(b.get("total_capacity", 0)), "g": g, "f": int(b.get("floors", 3))})
        hrooms = load_csv("12_hostel_rooms.csv")
        for r in hrooms:
            await db.execute(text(
                "INSERT INTO rooms (id, college_id, hostel_id, room_number, floor, capacity) VALUES (:id, :cid, :hid, :rn, :f, :c)"
            ), {"id": r["id"], "cid": COLLEGE_ID, "hid": r["hostel_block_id"],
                "rn": r["room_number"], "f": int(r.get("floor", 1)), "c": int(r.get("capacity", 3))})
        log(f"  {len(blocks)} blocks, {len(hrooms)} rooms")

    await run_phase(engine, "Phase 10", phase10)

    # ── Phase 11: Fee invoices (batched) ──
    log("[11] FEE INVOICES...")
    fees = load_csv("22_fee_records.csv")
    for i in range(0, len(fees), 2000):
        batch = fees[i:i+2000]
        async with SM() as db:
            for f in batch:
                await db.execute(text(
                    "INSERT INTO student_fee_invoices (id, college_id, student_id, fee_type, total_amount, academic_year) "
                    "VALUES (:id, :cid, :sid, :ft, :amt, :ay)"
                ), {"id": f["id"], "cid": COLLEGE_ID, "sid": f["student_id"],
                    "ft": f.get("fee_head", "Tuition"), "amt": float(f.get("amount", 0)),
                    "ay": f.get("academic_year", "2025-26")})
            await db.commit()
        log(f"    Fees: {min(i+2000, len(fees))}/{len(fees)}")
    log(f"  {len(fees)} fees COMMITTED")

    log("\n" + "=" * 60)
    log(" SEED COMPLETE!")
    log("=" * 60)
    log(f" Students: roll_number / student123")
    log(f" Staff: email / faculty123")
    log(f" Domain: aits.acadmix.org")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed())
