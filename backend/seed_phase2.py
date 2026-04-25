"""
AcadMix Residual Seeder — Phase 2
Seeds: bus_routes, transport_enrollments, beds, allocations,
       scholarships, scholarship_applications, mentor_assignments
"""
import asyncio, csv, os, sys, json, time, uuid
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
    path = MOCK_DIR / filename
    if not path.exists():
        print(f"  SKIP: {filename} not found", flush=True)
        return []
    with open(path, "r", encoding="utf-8") as f:
        return list(csv.DictReader(f))

def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)

async def seed():
    engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool,
        connect_args={"statement_cache_size": 0, "command_timeout": 600})
    SM = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    log("=" * 60)
    log(" AcadMix Residual Seeder — Phase 2")
    log("=" * 60)

    # ── 1. Bus Routes ──
    log("[1] BUS ROUTES...")
    async with SM() as db:
        routes = load_csv("15_bus_routes.csv")
        for r in routes:
            # Parse stops string into JSONB
            stops_raw = r.get("stops", "")
            stops_json = "[]"
            if stops_raw:
                try:
                    # The stops field is like "Stop1 → Stop2 → Stop3"
                    stop_names = [s.strip() for s in stops_raw.replace("→", ",").replace("->", ",").split(",")]
                    stops_list = [{"name": s, "order": i+1} for i, s in enumerate(stop_names) if s]
                    stops_json = json.dumps(stops_list)
                except:
                    stops_json = "[]"
            await db.execute(text(
                "INSERT INTO bus_routes (id, college_id, route_number, route_name, departure_time, return_time, stops, fee_amount) "
                "VALUES (:id, :cid, :rn, :name, :dep, :ret, CAST(:stops AS jsonb), :fee) ON CONFLICT (id) DO NOTHING"
            ), {"id": r["id"], "cid": COLLEGE_ID, "rn": r["route_number"],
                "name": r["route_name"], "dep": r.get("morning_departure", "07:30"),
                "ret": r.get("evening_departure", "17:00"), "stops": stops_json,
                "fee": 25000.0})  # Default annual fee
        await db.commit()
    log(f"  {len(routes)} bus routes")

    # ── 2. Transport Enrollments (bus allocations) ──
    log("[2] TRANSPORT ENROLLMENTS...")
    async with SM() as db:
        allocs = load_csv("31_bus_allocation.csv")
        for a in allocs:
            # Find stop index from route
            boarding_stop = a.get("boarding_stop", "")
            await db.execute(text(
                "INSERT INTO transport_enrollments (id, college_id, student_id, route_id, boarding_stop_index, boarding_stop_name, academic_year) "
                "VALUES (:id, :cid, :sid, :rid, :idx, :name, :ay) ON CONFLICT (id) DO NOTHING"
            ), {"id": a["id"], "cid": COLLEGE_ID, "sid": a["student_id"],
                "rid": a["route_id"], "idx": 0, "name": boarding_stop,
                "ay": a.get("academic_year", "2025-26")})
        await db.commit()
    log(f"  {len(allocs)} transport enrollments")

    # ── 3. Beds (auto-generate from existing rooms) ──
    log("[3] GENERATING BEDS from rooms...")
    async with SM() as db:
        # Get all rooms
        result = await db.execute(text("SELECT id, room_number, capacity FROM rooms WHERE college_id = :cid"),
                                  {"cid": COLLEGE_ID})
        rooms = result.fetchall()
        bed_count = 0
        for room_id, room_num, capacity in rooms:
            for i in range(capacity):
                bed_id = f"bed-{room_num}-{chr(65+i)}"  # bed-BA-F1R01-A, bed-BA-F1R01-B, etc.
                row_num = (i // 2) + 1
                col_num = (i % 2) + 1
                is_premium = (col_num == 1)  # window side
                category = "Window (Premium)" if is_premium else "Aisle (Standard)"
                await db.execute(text(
                    "INSERT INTO beds (id, college_id, room_id, bed_identifier, grid_row, grid_col, category, is_premium, status) "
                    "VALUES (:id, :cid, :rid, :ident, :row, :col, :cat, :prem, 'AVAILABLE') ON CONFLICT (id) DO NOTHING"
                ), {"id": bed_id, "cid": COLLEGE_ID, "rid": room_id,
                    "ident": chr(65+i), "row": row_num, "col": col_num,
                    "cat": category, "prem": is_premium})
                bed_count += 1
        await db.commit()
    log(f"  {bed_count} beds generated from {len(rooms)} rooms")

    # ── 4. Hostel Allocations ──
    log("[4] HOSTEL ALLOCATIONS...")
    allocs = load_csv("30_hostel_allocation.csv")
    # Need to map room_id → first available bed
    async with SM() as db:
        # Get bed mapping: room_id → list of bed_ids
        result = await db.execute(text("SELECT id, room_id FROM beds WHERE college_id = :cid ORDER BY room_id, bed_identifier"),
                                  {"cid": COLLEGE_ID})
        bed_rows = result.fetchall()
        room_beds = {}
        for bid, rid in bed_rows:
            room_beds.setdefault(rid, []).append(bid)

    used_beds = set()
    for i in range(0, len(allocs), 500):
        batch = allocs[i:i+500]
        async with SM() as db:
            for a in batch:
                room_id = a["room_id"]
                # Get next available bed for this room
                available = [b for b in room_beds.get(room_id, []) if b not in used_beds]
                if not available:
                    continue  # Skip if no beds available
                bed_id = available[0]
                used_beds.add(bed_id)
                status = a.get("status", "active")
                if status not in ("active", "vacated", "transferred"):
                    status = "active"
                await db.execute(text(
                    "INSERT INTO allocations (id, college_id, student_id, bed_id, room_id, hostel_id, academic_year, status) "
                    "VALUES (:id, :cid, :sid, :bid, :rid, :hid, :ay, :st) ON CONFLICT (id) DO NOTHING"
                ), {"id": a["id"], "cid": COLLEGE_ID, "sid": a["student_id"],
                    "bid": bed_id, "rid": room_id, "hid": a["hostel_id"],
                    "ay": a.get("academic_year", "2025-26"), "st": status})
                # Mark bed as BOOKED
                await db.execute(text("UPDATE beds SET status = 'BOOKED' WHERE id = :id"), {"id": bed_id})
            await db.commit()
        log(f"    Allocations: {min(i+500, len(allocs))}/{len(allocs)}")
    log(f"  {len(allocs)} hostel allocations (using {len(used_beds)} beds)")

    # ── 5. Scholarships (parent records) + Applications ──
    log("[5] SCHOLARSHIPS...")
    async with SM() as db:
        # Create scholarship parent records from the unique types in disbursements
        disb = load_csv("33_scholarship_disbursements.csv")
        # Get unique (type, academic_year) combos
        seen_types = set()
        scholarship_map = {}  # (type, year) → scholarship_id
        for d in disb:
            key = (d["scholarship_type"], d.get("academic_year", "2025-26"))
            if key not in seen_types:
                seen_types.add(key)
                sid = f"schol-{d['scholarship_type'].lower().replace(' ', '-')}-{key[1]}"
                scholarship_map[key] = sid
                await db.execute(text(
                    "INSERT INTO scholarships (id, college_id, academic_year, name, type) "
                    "VALUES (:id, :cid, :ay, :name, :type) ON CONFLICT (id) DO NOTHING"
                ), {"id": sid, "cid": COLLEGE_ID, "ay": key[1],
                    "name": f"{d['scholarship_type']} Scholarship", "type": d["scholarship_type"]})
        await db.commit()
    log(f"  {len(seen_types)} scholarship types")

    log("[6] SCHOLARSHIP APPLICATIONS...")
    for i in range(0, len(disb), 2000):
        batch = disb[i:i+2000]
        async with SM() as db:
            for d in batch:
                key = (d["scholarship_type"], d.get("academic_year", "2025-26"))
                schol_id = scholarship_map.get(key)
                if not schol_id:
                    continue
                status_val = d.get("status", "submitted")
                if status_val not in ("submitted", "approved", "rejected"):
                    status_val = "approved"  # disbursed = approved
                await db.execute(text(
                    "INSERT INTO scholarship_applications (id, college_id, student_id, scholarship_id, status) "
                    "VALUES (:id, :cid, :sid, :schid, :st) ON CONFLICT (id) DO NOTHING"
                ), {"id": d["id"], "cid": COLLEGE_ID, "sid": d["student_id"],
                    "schid": schol_id, "st": status_val})
            await db.commit()
        log(f"    Scholarship apps: {min(i+2000, len(disb))}/{len(disb)}")
    log(f"  {len(disb)} scholarship applications")

    # ── 7. Mentor Assignments ──
    log("[7] MENTOR ASSIGNMENTS...")
    async with SM() as db:
        mentors = load_csv("29_section_mentors.csv")
        # Each row maps a faculty to a section. We need to create individual faculty→student assignments.
        # For now, create section-level mentor records using the MentorAssignment model
        # But MentorAssignment is faculty→student, so we need to map section students
        # Get students per section
        result = await db.execute(text(
            "SELECT u.id, up.section, up.department, up.batch FROM users u "
            "JOIN user_profiles up ON u.id = up.user_id "
            "WHERE u.college_id = :cid AND u.role = 'student'"
        ), {"cid": COLLEGE_ID})
        students = result.fetchall()

        # Build section → student list
        section_students = {}
        for sid, sec, dept, batch in students:
            key = f"{dept}-{batch}-{sec}"
            section_students.setdefault(key, []).append(sid)

        assign_count = 0
        for m in mentors:
            key = f"{m['dept_code']}-{m['batch_year']}-{m['section']}"
            stus = section_students.get(key, [])
            for stu_id in stus:
                aid = f"mnt-{m['faculty_id']}-{stu_id}"
                await db.execute(text(
                    "INSERT INTO mentor_assignments (id, college_id, faculty_id, student_id, academic_year) "
                    "VALUES (:id, :cid, :fid, :sid, :ay) ON CONFLICT (id) DO NOTHING"
                ), {"id": aid, "cid": COLLEGE_ID, "fid": m["faculty_id"],
                    "sid": stu_id, "ay": m.get("academic_year", "2025-26")})
                assign_count += 1
        await db.commit()
    log(f"  {assign_count} mentor assignments from {len(mentors)} section mentors")

    log("\n" + "=" * 60)
    log(" PHASE 2 SEED COMPLETE!")
    log("=" * 60)
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed())
