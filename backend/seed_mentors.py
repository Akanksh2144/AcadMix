"""Fix mentor assignments — skip duplicates per student_id+academic_year"""
import asyncio, csv, os, sys, time
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from sqlalchemy.pool import NullPool

sys.path.insert(0, os.path.dirname(__file__))
from app.core.config import settings

MOCK_DIR = Path(__file__).parent.parent / "mock_data"
COLLEGE_ID = "aits-hyd-001"

def load_csv(filename):
    with open(MOCK_DIR / filename, "r", encoding="utf-8") as f:
        return list(csv.DictReader(f))

async def seed_mentors():
    engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool,
        connect_args={"statement_cache_size": 0, "command_timeout": 600})
    SM = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    print("[MENTORS] Loading data...", flush=True)
    mentors = load_csv("29_section_mentors.csv")

    async with SM() as db:
        # Get students per section
        result = await db.execute(text(
            "SELECT u.id, up.section, up.department, up.batch FROM users u "
            "JOIN user_profiles up ON u.id = up.user_id "
            "WHERE u.college_id = :cid AND u.role = 'student'"
        ), {"cid": COLLEGE_ID})
        students = result.fetchall()

    section_students = {}
    for sid, sec, dept, batch in students:
        key = f"{dept}-{batch}-{sec}"
        section_students.setdefault(key, []).append(sid)

    # Track which students already have mentors per year
    seen = set()
    to_insert = []
    for m in mentors:
        key = f"{m['dept_code']}-{m['batch_year']}-{m['section']}"
        ay = m.get("academic_year", "2025-26")
        stus = section_students.get(key, [])
        for stu_id in stus:
            dup_key = (stu_id, ay)
            if dup_key in seen:
                continue
            seen.add(dup_key)
            to_insert.append({
                "id": f"mnt-{m['faculty_id']}-{stu_id}",
                "fid": m["faculty_id"],
                "sid": stu_id,
                "ay": ay,
            })

    print(f"[MENTORS] {len(to_insert)} unique assignments (deduped from {sum(len(v) for v in section_students.values())} possible)", flush=True)

    # Batch insert
    for i in range(0, len(to_insert), 500):
        batch = to_insert[i:i+500]
        async with SM() as db:
            for a in batch:
                await db.execute(text(
                    "INSERT INTO mentor_assignments (id, college_id, faculty_id, student_id, academic_year) "
                    "VALUES (:id, :cid, :fid, :sid, :ay) ON CONFLICT (id) DO NOTHING"
                ), {"id": a["id"], "cid": COLLEGE_ID, "fid": a["fid"], "sid": a["sid"], "ay": a["ay"]})
            await db.commit()
        print(f"  {min(i+500, len(to_insert))}/{len(to_insert)}", flush=True)

    print("[MENTORS] DONE!", flush=True)
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed_mentors())
