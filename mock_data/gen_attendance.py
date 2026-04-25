"""Generate 23_attendance_current_sem.csv and 24_attendance_summary_past.csv"""
import csv, random
from datetime import date, timedelta
random.seed(42)

students = []
with open("21_students.csv","r",encoding="utf-8") as f:
    for r in csv.DictReader(f): students.append(r)

subjects = []
with open("25_subjects.csv","r",encoding="utf-8") as f:
    for r in csv.DictReader(f): subjects.append(r)

subj_by_branch_sem = {}
for s in subjects:
    key = (s["dept_code"], int(s["semester"]))
    subj_by_branch_sem.setdefault(key, []).append(s)

batch_to_current_sem = {"2022":8, "2023":6, "2024":4, "2025":2}
batch_to_max_past_sem = {"2022":7, "2023":5, "2024":3, "2025":1}

# ─── PART 1: Current semester daily attendance (Jan-Apr 2026) ───
print("Generating current semester daily attendance...")

# Working days in Jan-Apr 2026 (Mon-Sat, skip Sundays & holidays)
holidays = {
    date(2026,1,26), date(2026,3,14), date(2026,3,29), date(2026,3,30),
    date(2026,3,31), date(2026,4,14), date(2026,4,2), date(2026,4,10),
}

working_days = []
d = date(2026, 1, 5)  # semester start
end = date(2026, 4, 20)  # up to current date
while d <= end:
    if d.weekday() < 6 and d not in holidays:  # Mon-Sat
        working_days.append(d)
    d += timedelta(days=1)

print(f"  Working days: {len(working_days)}")

# To keep file manageable, sample 6 periods per day
PERIODS = 6
rows = []
rid = 0

for stu in students:
    branch = stu["branch"]
    batch = stu["admission_year"]
    cur_sem = batch_to_current_sem.get(batch)
    if not cur_sem:
        continue

    key = (branch, cur_sem)
    sem_subjects = subj_by_branch_sem.get(key, [])
    if not sem_subjects:
        continue

    # Student attendance profile: 65-95% base
    cgpa = float(stu["cgpa"]) if stu["cgpa"] else 7.0
    att_rate = min(0.95, max(0.55, 0.5 + (cgpa / 10) * 0.4 + random.gauss(0, 0.05)))

    for day in working_days:
        # Pick which subject each period maps to (round-robin)
        for period in range(1, PERIODS + 1):
            subj = sem_subjects[(day.toordinal() + period) % len(sem_subjects)]
            present = random.random() < att_rate
            rid += 1
            rows.append({
                "id": f"att-{rid:08d}",
                "student_id": stu["id"],
                "subject_id": subj["id"],
                "subject_code": subj["subject_code"],
                "date": day.strftime("%Y-%m-%d"),
                "period": period,
                "semester": cur_sem,
                "status": "P" if present else "A",
            })

    if rid % 100000 < 50:
        print(f"  {rid:,} rows...", flush=True)

fields1 = ["id","student_id","subject_id","subject_code","date","period","semester","status"]
with open("23_attendance_current_sem.csv","w",newline="",encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=fields1)
    w.writeheader()
    w.writerows(rows)
print(f"\nGenerated 23_attendance_current_sem.csv with {len(rows):,} rows")

# ─── PART 2: Past semester summary ───
print("\nGenerating past semester attendance summary...")

summary_rows = []
sid2 = 0

for stu in students:
    branch = stu["branch"]
    batch = stu["admission_year"]
    max_past = batch_to_max_past_sem.get(batch, 0)
    if max_past == 0:
        continue

    cgpa = float(stu["cgpa"]) if stu["cgpa"] else 7.0
    base_att = min(0.95, max(0.55, 0.5 + (cgpa / 10) * 0.4))

    for sem in range(1, max_past + 1):
        key = (branch, sem)
        sem_subjects = subj_by_branch_sem.get(key, [])
        for subj in sem_subjects:
            sid2 += 1
            att_rate = max(0.4, min(0.98, base_att + random.gauss(0, 0.06)))
            total_classes = random.randint(45, 65)
            attended = round(total_classes * att_rate)
            pct = round(attended / total_classes * 100, 1)

            ay_start = int(batch) + (sem - 1) // 2
            summary_rows.append({
                "id": f"atts-{sid2:07d}",
                "student_id": stu["id"],
                "subject_id": subj["id"],
                "subject_code": subj["subject_code"],
                "semester": sem,
                "academic_year": f"{ay_start}-{ay_start+1}",
                "total_classes": total_classes,
                "classes_attended": attended,
                "attendance_pct": pct,
                "detained": pct < 65.0,
            })

fields2 = ["id","student_id","subject_id","subject_code","semester","academic_year",
           "total_classes","classes_attended","attendance_pct","detained"]
with open("24_attendance_summary_past.csv","w",newline="",encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=fields2)
    w.writeheader()
    w.writerows(summary_rows)
print(f"Generated 24_attendance_summary_past.csv with {len(summary_rows):,} rows")
