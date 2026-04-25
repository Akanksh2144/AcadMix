"""Re-insert Mar 3-8 attendance (the 4 deleted weekdays)"""
import asyncio, csv, os, time
from datetime import date as dt_date
from pathlib import Path
from collections import defaultdict
import asyncpg
from dotenv import load_dotenv
load_dotenv()

MOCK_DIR = Path(__file__).parent.parent / "mock_data"
COLLEGE_ID = "aits-hyd-001"
DB = os.getenv("DATABASE_URL", "").replace("postgresql+asyncpg://", "postgresql://")

DAY_NAMES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
STATUS_MAP = {"P": "present", "A": "absent", "L": "late", "OD": "od", "M": "medical"}

def parse_date(s):
    y, m, d = s.split("-")
    return dt_date(int(y), int(m), int(d))

async def patch():
    conn = await asyncpg.connect(DB, statement_cache_size=0, command_timeout=600)

    # Get student info
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

    # Load CSV rows for dates Mar 3-8 only
    print("Loading CSV rows for Mar 3-8...", flush=True)
    tuples = []
    with open(MOCK_DIR / "23_attendance_current_sem.csv", "r", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            if r["date"] < "2026-03-03" or r["date"] >= "2026-03-09":
                continue
            stu = student_info.get(r["student_id"])
            if not stu:
                continue
            period = int(r["period"])
            if period < 1 or period > 6:
                continue
            dept, batch, sec = stu
            att_date = parse_date(r["date"])
            day = DAY_NAMES[att_date.weekday()]
            if day in ("SAT", "SUN"):
                continue
            slot_id = f"ps-{dept}-{batch}-{sec}-S{r['semester']}-P{period}-{day}"
            dept_faculty = faculty_by_dept.get(dept, [])
            fac_id = dept_faculty[0] if dept_faculty else "STF-0001"
            status = STATUS_MAP.get(r["status"], "present")
            tuples.append((r["id"], COLLEGE_ID, slot_id, att_date, fac_id, r["student_id"], r["subject_code"], status))

    print(f"  {len(tuples):,} rows to insert", flush=True)

    if tuples:
        # Ensure period_slots exist
        slot_ids = set(t[2] for t in tuples)
        existing = await conn.fetch("SELECT id FROM period_slots WHERE id = ANY($1)", list(slot_ids))
        existing_ids = {r["id"] for r in existing}
        missing = slot_ids - existing_ids
        print(f"  Missing period_slots: {len(missing)}", flush=True)
        # These should already exist from the full insert — if not, they'll cause FK errors
        # The full seed created slots for ALL combos so they should be there

        # Insert attendance
        t0 = time.time()
        await conn.executemany(
            "INSERT INTO attendance_records (id, college_id, period_slot_id, date, faculty_id, student_id, subject_code, status) "
            "VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING",
            tuples
        )
        print(f"  Inserted in {time.time()-t0:.1f}s", flush=True)

    # Final check
    total = await conn.fetchval("SELECT COUNT(*) FROM attendance_records WHERE college_id = $1", COLLEGE_ID)
    dates = await conn.fetch("SELECT DISTINCT date FROM attendance_records ORDER BY date")
    weekdays = [d["date"] for d in dates if d["date"].weekday() < 5]
    print(f"\nFinal: {total:,} records, {len(weekdays)} weekdays", flush=True)
    print(f"Range: {dates[0]['date']} to {dates[-1]['date']}", flush=True)

    await conn.close()

asyncio.run(patch())
