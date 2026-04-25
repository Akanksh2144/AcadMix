"""
AcadMix Attendance Seeder v4 — Direct asyncpg executemany
==========================================================
Uses asyncpg's native executemany() which batches 5000 rows
into a single protocol message. Expected: ~30-45min total.
"""
import asyncio, csv, os, sys, time
from datetime import date as dt_date
from pathlib import Path
from collections import defaultdict
import asyncpg

sys.path.insert(0, os.path.dirname(__file__))

MOCK_DIR = Path(__file__).parent.parent / "mock_data"
COLLEGE_ID = "aits-hyd-001"

# Direct connection string (bypass SQLAlchemy overhead)
# Read from .env
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "").replace("postgresql+asyncpg://", "postgresql://")

PERIOD_TIMES = {
    1: ("09:00", "09:50"), 2: ("09:50", "10:40"),
    3: ("11:00", "11:50"), 4: ("11:50", "12:40"),
    5: ("14:00", "14:50"), 6: ("14:50", "15:40"),
}
DAY_NAMES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]

def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)

def parse_date(s):
    y, m, d = s.split("-")
    return dt_date(int(y), int(m), int(d))

async def seed():
    log("=" * 60)
    log(" Attendance Seeder v4 — asyncpg executemany")
    log("=" * 60)

    # Connect directly with asyncpg
    conn = await asyncpg.connect(DATABASE_URL, statement_cache_size=0, command_timeout=600)
    log("Connected to database")

    # ── Load CSV ──
    log("[1] Loading CSV...")
    raw_rows = []
    with open(MOCK_DIR / "23_attendance_current_sem.csv", "r", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            raw_rows.append(r)
    log(f"  {len(raw_rows):,} rows")

    # ── Get student info ──
    log("[2] Loading references...")
    student_rows = await conn.fetch(
        "SELECT u.id, up.department, up.batch, up.section "
        "FROM users u JOIN user_profiles up ON u.id = up.user_id "
        "WHERE u.college_id = $1 AND u.role = 'student'", COLLEGE_ID
    )
    student_info = {r["id"]: (r["department"], r["batch"], r["section"]) for r in student_rows}

    faculty_rows = await conn.fetch(
        "SELECT u.id, up.department FROM users u "
        "JOIN user_profiles up ON u.id = up.user_id "
        "WHERE u.college_id = $1 AND u.role IN ('teacher', 'hod')", COLLEGE_ID
    )
    faculty_by_dept = defaultdict(list)
    for r in faculty_rows:
        faculty_by_dept[r["department"]].append(r["id"])

    dept_rows = await conn.fetch("SELECT id, code FROM departments WHERE college_id = $1", COLLEGE_ID)
    dept_map = {r["code"]: r["id"] for r in dept_rows}

    log(f"  {len(student_info):,} students, {len(dept_map)} depts")

    # ── Check existing data ──
    existing = await conn.fetchval("SELECT COUNT(*) FROM attendance_records WHERE college_id = $1", COLLEGE_ID)
    existing_slots = await conn.fetchval("SELECT COUNT(*) FROM period_slots WHERE college_id = $1", COLLEGE_ID)
    log(f"  Existing: {existing:,} attendance, {existing_slots:,} period_slots")

    if existing > 0:
        log("  Clearing existing attendance records...")
        await conn.execute("DELETE FROM attendance_records WHERE college_id = $1", COLLEGE_ID)
        log("  Cleared")

    if existing_slots > 0:
        log("  Clearing existing period_slots...")
        await conn.execute("DELETE FROM period_slots WHERE college_id = $1", COLLEGE_ID)
        log("  Cleared")

    # ── Pre-compute everything in memory ──
    log("[3] Pre-computing all data in memory...")
    status_map = {"P": "present", "A": "absent", "L": "late", "OD": "od", "M": "medical"}

    slot_set = set()
    attendance_tuples = []

    for r in raw_rows:
        stu = student_info.get(r["student_id"])
        if not stu:
            continue
        period = int(r["period"])
        if period not in PERIOD_TIMES:
            continue

        dept, batch, sec = stu
        att_date = parse_date(r["date"])
        day = DAY_NAMES[att_date.weekday()]
        if day in ("SAT", "SUN"):
            continue

        slot_id = f"ps-{dept}-{batch}-{sec}-S{r['semester']}-P{period}-{day}"
        slot_set.add((slot_id, dept, batch, sec, int(r["semester"]), period, day))

        dept_faculty = faculty_by_dept.get(dept, [])
        fac_id = dept_faculty[0] if dept_faculty else "STF-0001"
        status = status_map.get(r["status"], "present")

        attendance_tuples.append((
            r["id"], COLLEGE_ID, slot_id, att_date, fac_id,
            r["student_id"], r["subject_code"], status
        ))

    log(f"  {len(slot_set):,} slots, {len(attendance_tuples):,} attendance rows prepared")

    # ── Insert period_slots ──
    log("[4] Inserting period_slots...")
    slot_tuples = []
    for slot_id, dept, batch, sec, sem, period_no, day in slot_set:
        dept_id = dept_map.get(dept, list(dept_map.values())[0])
        st, et = PERIOD_TIMES[period_no]
        slot_tuples.append((slot_id, COLLEGE_ID, dept_id, batch, sec, sem, "2025-26", day, period_no, st, et, "regular"))

    SLOT_BATCH = 500
    for i in range(0, len(slot_tuples), SLOT_BATCH):
        chunk = slot_tuples[i:i+SLOT_BATCH]
        await conn.executemany(
            "INSERT INTO period_slots (id, college_id, department_id, batch, section, semester, "
            "academic_year, day, period_no, start_time, end_time, slot_type) "
            "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) "
            "ON CONFLICT (id) DO NOTHING",
            chunk
        )
    log(f"  {len(slot_tuples):,} period slots inserted")

    # ── Bulk insert attendance using executemany ──
    log("[5] BULK INSERTING attendance records...")
    log(f"    Total: {len(attendance_tuples):,} rows")

    BATCH = 5000
    total = len(attendance_tuples)
    t0 = time.time()

    for i in range(0, total, BATCH):
        chunk = attendance_tuples[i:i+BATCH]
        try:
            await conn.executemany(
                "INSERT INTO attendance_records (id, college_id, period_slot_id, date, faculty_id, student_id, subject_code, status) "
                "VALUES ($1, $2, $3, $4, $5, $6, $7, $8) "
                "ON CONFLICT (id) DO NOTHING",
                chunk
            )
        except Exception as e:
            log(f"    BATCH ERROR at {i}: {str(e)[:100]}")
            # Try smaller batches on error
            for j in range(0, len(chunk), 100):
                mini = chunk[j:j+100]
                try:
                    await conn.executemany(
                        "INSERT INTO attendance_records (id, college_id, period_slot_id, date, faculty_id, student_id, subject_code, status) "
                        "VALUES ($1, $2, $3, $4, $5, $6, $7, $8) "
                        "ON CONFLICT (id) DO NOTHING",
                        mini
                    )
                except Exception as e2:
                    log(f"      Mini-batch error at {i+j}: {str(e2)[:80]}")

        done = min(i + BATCH, total)
        if done % 50000 == 0 or done >= total:
            elapsed = time.time() - t0
            rate = done / elapsed if elapsed > 0 else 0
            eta = (total - done) / rate if rate > 0 else 0
            log(f"    {done:,}/{total:,} ({100*done/total:.0f}%) — {rate:.0f} rows/sec — ETA: {eta/60:.0f}min")

    elapsed = time.time() - t0
    final_count = await conn.fetchval("SELECT COUNT(*) FROM attendance_records WHERE college_id = $1", COLLEGE_ID)
    log(f"\n  DONE in {elapsed/60:.1f}min: {final_count:,} attendance records")
    log("=" * 60)
    log(" ATTENDANCE SEED COMPLETE!")
    log("=" * 60)
    await conn.close()

if __name__ == "__main__":
    asyncio.run(seed())
