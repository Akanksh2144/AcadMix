"""
Seed 35 additional working days of attendance for all AITS students.
Replicates the same pattern as the existing 30 days:
  - Each student × each period slot on that day = one record
  - Randomly assigns ~80% present, ~10% absent, ~5% late, ~3% od, ~2% medical
  - Uses the same period_slot_id / faculty_id / subject_code combos
  - Inserts in batches of 5000 to stay memory-efficient
"""

import asyncio
import random
from datetime import date, timedelta
from collections import defaultdict

from sqlalchemy.future import select
from sqlalchemy import func, text
from database import AdminSessionLocal
from app.models.administration import AttendanceRecord

COLLEGE_ID = "aits-hyd-001"
NUM_NEW_DAYS = 35

# Weighted status distribution — realistic for Indian engineering colleges
STATUS_WEIGHTS = ["present"] * 80 + ["absent"] * 10 + ["late"] * 5 + ["od"] * 3 + ["medical"] * 2

async def main():
    async with AdminSessionLocal() as db:
        # ── 1. Get all existing dates to avoid duplicates ────────────────
        existing_dates_r = await db.execute(
            select(func.distinct(AttendanceRecord.date))
            .where(AttendanceRecord.college_id == COLLEGE_ID)
        )
        existing_dates = {row[0] for row in existing_dates_r.all()}
        print(f"[INFO] Found {len(existing_dates)} existing attendance dates")

        # ── 2. Compute 35 new weekdays starting from the day after max existing ───
        max_existing = max(existing_dates) if existing_dates else date(2026, 4, 20)
        new_dates = []
        cursor = max_existing + timedelta(days=1)
        while len(new_dates) < NUM_NEW_DAYS:
            if cursor.weekday() < 5:  # Mon-Fri
                if cursor not in existing_dates:
                    new_dates.append(cursor)
            cursor += timedelta(days=1)

        print(f"[INFO] Will seed {len(new_dates)} new dates: {new_dates[0]} to {new_dates[-1]}")

        # ── 3. Get all unique (period_slot_id, faculty_id, student_id, subject_code) combos ──
        # Pull from a single existing date to replicate the pattern
        reference_date = max_existing
        print(f"[INFO] Using reference date: {reference_date}")

        ref_r = await db.execute(
            select(
                AttendanceRecord.period_slot_id,
                AttendanceRecord.faculty_id,
                AttendanceRecord.student_id,
                AttendanceRecord.subject_code,
            )
            .where(
                AttendanceRecord.college_id == COLLEGE_ID,
                AttendanceRecord.date == reference_date,
            )
        )
        ref_rows = ref_r.all()
        print(f"[INFO] Reference date has {len(ref_rows)} records to replicate per day")

        if not ref_rows:
            print("[ERROR] No reference records found. Aborting.")
            return

        # ── 4. Batch insert ──────────────────────────────────────────────
        BATCH_SIZE = 5000
        total_inserted = 0

        for day_idx, new_date in enumerate(new_dates):
            # Map period slot day-suffix to actual weekday
            # Period slots encode day: MON, TUE, WED, THU, FRI
            weekday_map = {0: "MON", 1: "TUE", 2: "WED", 3: "THU", 4: "FRI"}
            target_day_suffix = weekday_map[new_date.weekday()]

            batch = []
            for ps_id, fac_id, stu_id, subj_code in ref_rows:
                # Remap the period slot day suffix to match the new date's weekday
                # e.g. ps-CSE-2022-A-S7-P1-TUE → ps-CSE-2022-A-S7-P1-{target_day}
                parts = ps_id.rsplit("-", 1)
                if len(parts) == 2:
                    remapped_ps_id = f"{parts[0]}-{target_day_suffix}"
                else:
                    remapped_ps_id = ps_id  # fallback

                status = random.choice(STATUS_WEIGHTS)
                batch.append({
                    "college_id": COLLEGE_ID,
                    "period_slot_id": remapped_ps_id,
                    "date": new_date,
                    "faculty_id": fac_id,
                    "student_id": stu_id,
                    "subject_code": subj_code,
                    "status": status,
                    "source": "faculty_manual",
                    "is_late_entry": False,
                    "is_override": False,
                })

                if len(batch) >= BATCH_SIZE:
                    await db.execute(
                        AttendanceRecord.__table__.insert(),
                        batch
                    )
                    await db.commit()
                    total_inserted += len(batch)
                    batch = []

            # Flush remaining
            if batch:
                await db.execute(
                    AttendanceRecord.__table__.insert(),
                    batch
                )
                await db.commit()
                total_inserted += len(batch)

            print(f"  [{day_idx + 1}/{len(new_dates)}] {new_date} ({target_day_suffix}) — {len(ref_rows)} records | cumulative: {total_inserted}")

        print(f"\n[DONE] Seeded {total_inserted} attendance records across {len(new_dates)} days.")

if __name__ == "__main__":
    asyncio.run(main())
