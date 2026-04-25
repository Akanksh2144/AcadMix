"""Seed remaining tables: Hostels, Rooms, Fees"""
import asyncio, csv, os, sys, json, time
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
    if not path.exists(): return []
    with open(path, "r", encoding="utf-8") as f:
        return list(csv.DictReader(f))

def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)

async def seed_remaining():
    engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool,
        connect_args={"statement_cache_size": 0, "command_timeout": 600})
    SM = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    # ── Hostels ──
    log("[1] HOSTELS...")
    async with SM() as db:
        blocks = load_csv("11_hostel_blocks.csv")
        for b in blocks:
            g = b["gender"].lower()
            if g not in ("male", "female", "coed"): g = "coed"
            await db.execute(text(
                "INSERT INTO hostels (id, college_id, name, total_capacity, gender_type, total_floors) "
                "VALUES (:id, :cid, :name, :cap, :g, :f) ON CONFLICT (id) DO NOTHING"
            ), {"id": b["id"], "cid": COLLEGE_ID, "name": b["name"],
                "cap": int(b.get("total_capacity", 0)), "g": g, "f": int(b.get("floors", 3))})
        await db.commit()
    log(f"  {len(blocks)} hostels")

    # ── Rooms (deduplicate by hostel_id + room_number) ──
    log("[2] ROOMS (deduped)...")
    async with SM() as db:
        hrooms = load_csv("12_hostel_rooms.csv")
        seen = set()
        inserted = 0
        for r in hrooms:
            key = (r["hostel_block_id"], r["room_number"])
            if key in seen:
                continue
            seen.add(key)
            await db.execute(text(
                "INSERT INTO rooms (id, college_id, hostel_id, room_number, floor, capacity) "
                "VALUES (:id, :cid, :hid, :rn, :f, :c) ON CONFLICT DO NOTHING"
            ), {"id": r["id"], "cid": COLLEGE_ID, "hid": r["hostel_block_id"],
                "rn": r["room_number"], "f": int(r.get("floor", 1)), "c": int(r.get("capacity", 3))})
            inserted += 1
        await db.commit()
    log(f"  {inserted} unique rooms (skipped {len(hrooms) - inserted} dupes)")

    # ── Fee Invoices (batched) ──
    log("[3] FEE INVOICES...")
    fees = load_csv("22_fee_records.csv")
    for i in range(0, len(fees), 2000):
        batch = fees[i:i+2000]
        async with SM() as db:
            for f in batch:
                await db.execute(text(
                    "INSERT INTO student_fee_invoices (id, college_id, student_id, fee_type, total_amount, academic_year) "
                    "VALUES (:id, :cid, :sid, :ft, :amt, :ay) ON CONFLICT (id) DO NOTHING"
                ), {"id": f["id"], "cid": COLLEGE_ID, "sid": f["student_id"],
                    "ft": f.get("fee_head", "Tuition"), "amt": float(f.get("amount", 0)),
                    "ay": f.get("academic_year", "2025-26")})
            await db.commit()
        log(f"    Fees: {min(i+2000, len(fees))}/{len(fees)}")
    log(f"  {len(fees)} fees COMMITTED")

    log("\n" + "=" * 60)
    log(" RESIDUAL SEED COMPLETE!")
    log("=" * 60)
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed_remaining())
