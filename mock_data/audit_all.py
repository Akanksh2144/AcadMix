"""
Comprehensive Mock Data Audit for AcadMix Demo
Checks: referential integrity, null/corrupt values, distribution sanity, ID uniqueness
"""
import csv, sys, os
from collections import Counter, defaultdict

ERRORS = []
WARNINGS = []

def err(msg): ERRORS.append(f"❌ {msg}")
def warn(msg): WARNINGS.append(f"⚠️  {msg}")
def ok(msg): print(f"  ✅ {msg}")

def load(filename):
    path = filename
    if not os.path.exists(path):
        err(f"File missing: {filename}")
        return []
    with open(path, "r", encoding="utf-8") as f:
        return list(csv.DictReader(f))

def check_unique_ids(rows, filename, col="id"):
    ids = [r[col] for r in rows]
    dupes = [k for k,v in Counter(ids).items() if v > 1]
    if dupes:
        err(f"{filename}: {len(dupes)} duplicate IDs in '{col}': {dupes[:5]}")
    else:
        ok(f"{filename}: All {len(ids)} IDs unique")
    return set(ids)

def check_no_empty(rows, filename, cols):
    for col in cols:
        empties = sum(1 for r in rows if not r.get(col,"").strip())
        if empties:
            err(f"{filename}: {empties} empty values in required column '{col}'")

def check_fk(rows, filename, col, valid_set, ref_name):
    invalid = [r[col] for r in rows if r.get(col,"").strip() and r[col] not in valid_set]
    if invalid:
        err(f"{filename}.{col}: {len(invalid)} orphan FKs not in {ref_name}: {list(set(invalid))[:5]}")
    else:
        ok(f"{filename}.{col} → {ref_name}: All FKs valid")

def check_encoding(rows, filename):
    """Check for common encoding issues: em-dashes, BOM, etc."""
    issues = 0
    for i, row in enumerate(rows):
        for k, v in row.items():
            if v and ('\u2014' in v or '\u2013' in v or '\ufffd' in v or '\x00' in v):
                issues += 1
                if issues <= 3:
                    err(f"{filename} row {i+2}: encoding issue in '{k}': {repr(v[:50])}")
    if issues == 0:
        ok(f"{filename}: No encoding issues")

# ═══════════════════════════════════════════════════════════════
print("=" * 70)
print("  AcadMix Mock Data Comprehensive Audit")
print("=" * 70)

# ── 1. Load all datasets ──
print("\n📂 Loading all CSVs...")
college = load("01_college.csv")
depts = load("02_departments.csv")
acad_years = load("03_academic_years.csv")
batches = load("04_batches.csv")
semesters = load("05_semesters.csv")
sections = load("06_sections.csv")
pos = load("07_program_outcomes.csv")
psos = load("08_program_specific_outcomes.csv")
rooms = load("10_rooms.csv")
hostel_blocks = load("11_hostel_blocks.csv")
hostel_rooms = load("12_hostel_rooms.csv")
bus_routes = load("15_bus_routes.csv")
staff = load("20_staff.csv")
students = load("21_students.csv")
fees = load("22_fee_records.csv")
att_current = load("23_attendance_current_sem.csv")
att_summary = load("24_attendance_summary_past.csv")
subjects = load("25_subjects.csv")
cos = load("26_course_outcomes.csv")
co_po = load("27_co_po_mapping.csv")
co_pso = load("28_co_pso_mapping.csv")
mentors = load("29_section_mentors.csv")
hostel_alloc = load("30_hostel_allocation.csv")
bus_alloc = load("31_bus_allocation.csv")
exam_results = load("32_exam_results.csv")
scholarships = load("33_scholarship_disbursements.csv")

# ── 2. Build ID sets ──
print("\n🔑 Checking ID Uniqueness...")
dept_ids = check_unique_ids(depts, "02_departments")
section_ids = check_unique_ids(sections, "06_sections")
po_ids = check_unique_ids(pos, "07_program_outcomes")
pso_ids = check_unique_ids(psos, "08_program_specific_outcomes")
hblock_ids = check_unique_ids(hostel_blocks, "11_hostel_blocks")
hroom_ids = check_unique_ids(hostel_rooms, "12_hostel_rooms")
route_ids = check_unique_ids(bus_routes, "15_bus_routes")
staff_ids = check_unique_ids(staff, "20_staff")
student_ids = check_unique_ids(students, "21_students")
subject_ids = check_unique_ids(subjects, "25_subjects")
co_ids = check_unique_ids(cos, "26_course_outcomes")

# ── 3. Referential Integrity ──
print("\n🔗 Checking Referential Integrity...")

# Sections → Departments
dept_codes = {d["code"] for d in depts}
check_fk(sections, "06_sections", "dept_code", dept_codes, "departments.code")
check_fk(sections, "06_sections", "dept_id", dept_ids, "departments.id")

# Staff → Departments
check_fk(staff, "20_staff", "dept_id", dept_ids, "departments.id")
check_fk(staff, "20_staff", "dept_code", dept_codes, "departments.code")

# Students → Departments & Branches
student_branches = {s["branch"] for s in students}
check_fk(students, "21_students", "dept_id", dept_ids, "departments.id")
print(f"  📊 Student branches: {student_branches}")

# Fee records → Students
fee_student_ids = {f["student_id"] for f in fees}
orphan_fee = fee_student_ids - student_ids
if orphan_fee:
    err(f"22_fee_records: {len(orphan_fee)} orphan student_ids")
else:
    ok("22_fee_records → students: All FKs valid")

# Subjects → Departments
check_fk(subjects, "25_subjects", "dept_id", dept_ids, "departments.id")

# Course Outcomes → Subjects
check_fk(cos, "26_course_outcomes", "subject_id", subject_ids, "subjects.id")

# CO-PO → COs and POs
check_fk(co_po, "27_co_po_mapping", "co_id", co_ids, "course_outcomes.id")
check_fk(co_po, "27_co_po_mapping", "po_id", po_ids, "program_outcomes.id")

# CO-PSO → COs and PSOs
check_fk(co_pso, "28_co_pso_mapping", "co_id", co_ids, "course_outcomes.id")
check_fk(co_pso, "28_co_pso_mapping", "pso_id", pso_ids, "program_specific_outcomes.id")

# Mentors → Sections & Staff
check_fk(mentors, "29_section_mentors", "section_id", section_ids, "sections.id")
check_fk(mentors, "29_section_mentors", "faculty_id", staff_ids, "staff.id")

# Hostel allocation → Students & Rooms
check_fk(hostel_alloc, "30_hostel_allocation", "student_id", student_ids, "students.id")
check_fk(hostel_alloc, "30_hostel_allocation", "hostel_room_id", hroom_ids, "hostel_rooms.id")
check_fk(hostel_alloc, "30_hostel_allocation", "hostel_block_id", hblock_ids, "hostel_blocks.id")

# Bus allocation → Students & Routes
check_fk(bus_alloc, "31_bus_allocation", "student_id", student_ids, "students.id")
check_fk(bus_alloc, "31_bus_allocation", "route_id", route_ids, "bus_routes.id")

# Exam results → Students & Subjects
check_fk(exam_results, "32_exam_results", "student_id", student_ids, "students.id")
check_fk(exam_results, "32_exam_results", "subject_id", subject_ids, "subjects.id")

# Scholarships → Students
check_fk(scholarships, "33_scholarship_disbursements", "student_id", student_ids, "students.id")

# Attendance → Students & Subjects
# Sample check (full check too slow for 1.7M rows)
att_sample = att_current[:10000]
check_fk(att_sample, "23_attendance(sample)", "student_id", student_ids, "students.id")
check_fk(att_sample, "23_attendance(sample)", "subject_id", subject_ids, "subjects.id")
check_fk(att_summary, "24_attendance_summary", "student_id", student_ids, "students.id")
check_fk(att_summary, "24_attendance_summary", "subject_id", subject_ids, "subjects.id")

# ── 4. Encoding check ──
print("\n🔤 Checking Encoding Quality...")
check_encoding(students[:500], "21_students(sample)")
check_encoding(staff, "20_staff")
check_encoding(subjects, "25_subjects")
check_encoding(cos[:500], "26_course_outcomes(sample)")

# ── 5. Data Distribution Sanity ──
print("\n📊 Data Distribution Checks...")

# Student gender distribution
gender_dist = Counter(s["gender"] for s in students)
male_pct = gender_dist["Male"] / len(students) * 100
print(f"  Gender: Male={gender_dist['Male']}({male_pct:.0f}%) Female={gender_dist['Female']}({100-male_pct:.0f}%)")
if male_pct < 45 or male_pct > 80:
    warn(f"Gender ratio looks unusual: {male_pct:.0f}% male")

# Student branch distribution
branch_dist = Counter(s["branch"] for s in students)
print(f"  Branches: {dict(branch_dist)}")

# Batch distribution
batch_dist = Counter(s["admission_year"] for s in students)
print(f"  Batches: {dict(batch_dist)}")
for batch, count in batch_dist.items():
    if count < 600 or count > 1200:
        warn(f"Batch {batch} has {count} students (expected ~840)")

# CGPA distribution
cgpas = [float(s["cgpa"]) for s in students if s["cgpa"]]
avg_cgpa = sum(cgpas) / len(cgpas)
min_cgpa = min(cgpas)
max_cgpa = max(cgpas)
print(f"  CGPA: min={min_cgpa:.2f} avg={avg_cgpa:.2f} max={max_cgpa:.2f}")
if avg_cgpa < 6.0 or avg_cgpa > 8.5:
    warn(f"Average CGPA {avg_cgpa:.2f} seems off")
if min_cgpa < 3.0:
    err(f"Min CGPA {min_cgpa} unrealistic (should be >=4.0)")

# Exam result grade distribution
grade_dist = Counter(r["grade"] for r in exam_results)
total_res = len(exam_results)
print(f"  Exam Grades: { {k:f'{v/total_res*100:.1f}%' for k,v in sorted(grade_dist.items())} }")
fail_pct = grade_dist.get("F", 0) / total_res * 100
if fail_pct > 15:
    warn(f"Fail rate {fail_pct:.1f}% seems high")
print(f"  Pass rate: {100-fail_pct:.1f}%")

# Attendance distribution (summary)
att_pcts = [float(a["attendance_pct"]) for a in att_summary]
avg_att = sum(att_pcts) / len(att_pcts)
detained = sum(1 for a in att_summary if a["detained"] == "True")
print(f"  Attendance: avg={avg_att:.1f}% detained={detained} ({detained/len(att_pcts)*100:.1f}%)")

# Fee status distribution
fee_status = Counter(f["status"] for f in fees if "status" in f)
print(f"  Fee Status: {dict(fee_status)}")

# Scholarship types
sch_types = Counter(s["scholarship"] for s in students if s["scholarship"] and s["scholarship"] != "None")
print(f"  Scholarships: {dict(sch_types)}")

# ── 6. Cross-consistency checks ──
print("\n🔄 Cross-Consistency Checks...")

# Every student should have fee records
students_with_fees = {f["student_id"] for f in fees}
no_fees = student_ids - students_with_fees
if no_fees:
    warn(f"{len(no_fees)} students have NO fee records: {list(no_fees)[:5]}")
else:
    ok("All students have fee records")

# Hostellers should have hostel allocation
hostellers = {s["id"] for s in students if s.get("fee_category") == "Hosteller"}
allocated_hostel = {h["student_id"] for h in hostel_alloc}
unallocated = hostellers - allocated_hostel
if unallocated:
    warn(f"{len(unallocated)} hostellers have NO hostel allocation")
else:
    ok(f"All {len(hostellers)} hostellers have room allocations")

# Scholarship students should have disbursement records
sch_students = {s["id"] for s in students if s.get("scholarship") and s["scholarship"] != "None"}
sch_with_disb = {d["student_id"] for d in scholarships}
no_disb = sch_students - sch_with_disb
if no_disb:
    warn(f"{len(no_disb)} scholarship students have NO disbursement records")
else:
    ok(f"All {len(sch_students)} scholarship students have disbursements")

# Every student should have exam results for completed semesters
students_with_results = {r["student_id"] for r in exam_results}
no_results = student_ids - students_with_results
if no_results:
    warn(f"{len(no_results)} students have NO exam results")
else:
    ok("All students have exam results")

# Check subjects per branch coverage
branches_in_subjects = {s["dept_code"] for s in subjects}
branches_in_students = {s["branch"] for s in students}
missing = branches_in_students - branches_in_subjects
if missing:
    err(f"Branches in students but NOT in subjects: {missing}")
else:
    ok(f"All student branches have subject definitions")

# ── 7. Check for NULL/empty critical fields ──
print("\n🕳️  Checking Critical Fields for Empties...")
check_no_empty(students, "students", ["id","full_name","gender","roll_no","branch","dept_id","admission_year","current_semester"])
check_no_empty(staff, "staff", ["id","name","designation","dept_id","dept_code"])
check_no_empty(subjects, "subjects", ["id","subject_code","name","dept_id","semester","type"])
check_no_empty(exam_results[:1000], "exam_results(sample)", ["id","student_id","subject_id","grade","result"])

# ── 8. Hostel gender consistency ──
print("\n🏠 Hostel Gender Consistency...")
for alloc in hostel_alloc:
    stu = next((s for s in students if s["id"] == alloc["student_id"]), None)
    room = next((r for r in hostel_rooms if r["id"] == alloc["hostel_room_id"]), None)
    if stu and room and stu["gender"] != room["gender"]:
        err(f"Gender mismatch: {stu['id']}({stu['gender']}) in room {room['id']}({room['gender']})")
        break
else:
    ok("All hostel allocations respect gender segregation")

# ═══════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print(f"  AUDIT COMPLETE")
print(f"  Errors:   {len(ERRORS)}")
print(f"  Warnings: {len(WARNINGS)}")
print("=" * 70)

if ERRORS:
    print("\n🚨 ERRORS (must fix):")
    for e in ERRORS: print(f"  {e}")

if WARNINGS:
    print("\n⚠️  WARNINGS (review):")
    for w in WARNINGS: print(f"  {w}")

if not ERRORS and not WARNINGS:
    print("\n🎉 ALL CLEAR — Data is production-ready for demo.acadmix.org!")

sys.exit(1 if ERRORS else 0)
