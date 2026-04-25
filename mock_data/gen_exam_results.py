"""Generate 32_exam_results.csv"""
import csv, random
random.seed(42)

def get_grade(total):
    pct = total / 130 * 100
    if pct >= 90: return "O"
    if pct >= 80: return "A+"
    if pct >= 70: return "A"
    if pct >= 60: return "B+"
    if pct >= 50: return "B"
    if pct >= 40: return "C"
    return "F"

def get_grade_lab(total):
    pct = total / 60 * 100
    if pct >= 90: return "O"
    if pct >= 80: return "A+"
    if pct >= 70: return "A"
    if pct >= 60: return "B+"
    if pct >= 50: return "B"
    if pct >= 40: return "C"
    return "F"

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

batch_to_max_sem = {"2022":7, "2023":5, "2024":3, "2025":1}

rows = []
rid = 0
for stu in students:
    branch = stu["branch"]
    batch = stu["admission_year"]
    cgpa = float(stu["cgpa"]) if stu["cgpa"] else 7.0
    backlogs = int(stu["active_backlogs"]) if stu["active_backlogs"] else 0
    max_sem = batch_to_max_sem.get(batch, 1)
    perf = max(0.1, min(0.95, (cgpa - 4.0) / 6.0))

    for sem in range(1, max_sem + 1):
        key = (branch, sem)
        sem_subjects = subj_by_branch_sem.get(key, [])
        for subj in sem_subjects:
            rid += 1
            stype = subj["type"]
            noise = random.gauss(0, 0.1)
            p = max(0.15, min(0.98, perf + noise))

            if stype == "Theory":
                mid1 = max(0, min(30, round(p * 30 + random.gauss(0, 3))))
                mid2 = max(0, min(30, round(p * 30 + random.gauss(0, 3))))
                assign = max(0, min(10, round(p * 10 + random.gauss(0, 1))))
                ext = max(0, min(60, round(p * 60 + random.gauss(0, 5))))
                if backlogs > 0 and random.random() < 0.08:
                    ext = random.randint(10, 23)
                internal = mid1 + mid2 + assign
                total = internal + ext
                grade = get_grade(total)
            else:
                mid1 = max(0, min(20, round(p * 20 + random.gauss(0, 2))))
                mid2 = 0
                assign = 0
                ext = max(0, min(40, round(p * 40 + random.gauss(0, 3))))
                internal = mid1
                total = internal + ext
                grade = get_grade_lab(total)

            rows.append({
                "id": f"res-{rid:07d}",
                "student_id": stu["id"],
                "subject_id": subj["id"],
                "subject_code": subj["subject_code"],
                "semester": sem,
                "academic_year": f"{int(batch)+((sem-1)//2)}-{int(batch)+((sem-1)//2)+1}",
                "mid1_marks": mid1,
                "mid2_marks": mid2,
                "assignment_marks": assign,
                "internal_marks": internal,
                "external_marks": ext,
                "total_marks": total,
                "grade": grade,
                "result": "PASS" if grade != "F" else "FAIL",
                "attempt": 1,
            })

    if len(rows) % 10000 < 10:
        print(f"  {len(rows)} results...", flush=True)

fields = ["id","student_id","subject_id","subject_code","semester","academic_year",
          "mid1_marks","mid2_marks","assignment_marks","internal_marks","external_marks",
          "total_marks","grade","result","attempt"]

with open("32_exam_results.csv","w",newline="",encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader()
    w.writerows(rows)
print(f"\nGenerated 32_exam_results.csv with {len(rows)} results")
