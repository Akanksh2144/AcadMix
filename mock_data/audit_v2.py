"""
DEEP AUDIT v2 — Validates CSVs against ACTUAL backend SQLAlchemy models
Catches: schema mismatches, missing college_id, wrong column names, 
cross-record logic errors, subject-student branch alignment
"""
import csv, sys, os, random
from collections import Counter, defaultdict

ERRORS = []
WARNINGS = []
def err(msg): ERRORS.append(msg)
def warn(msg): WARNINGS.append(msg)
def ok(msg): print(f"  [OK] {msg}")

def load(fn):
    if not os.path.exists(fn): 
        err(f"MISSING FILE: {fn}")
        return [], []
    with open(fn,"r",encoding="utf-8") as f:
        r = csv.DictReader(f)
        cols = r.fieldnames
        return list(r), cols

print("="*70)
print(" DEEP AUDIT v2: CSV vs Backend Model Alignment")
print("="*70)

# Load everything
students, s_cols = load("21_students.csv")
staff, st_cols = load("20_staff.csv")
subjects, sub_cols = load("25_subjects.csv")
cos, co_cols = load("26_course_outcomes.csv")
copo, copo_cols = load("27_co_po_mapping.csv")
copso, copso_cols = load("28_co_pso_mapping.csv")
results, res_cols = load("32_exam_results.csv")
att_cur, att_cols = load("23_attendance_current_sem.csv")
att_sum, atts_cols = load("24_attendance_summary_past.csv")
mentors, men_cols = load("29_section_mentors.csv")
hostel_a, ha_cols = load("30_hostel_allocation.csv")
bus_a, ba_cols = load("31_bus_allocation.csv")
sch, sch_cols = load("33_scholarship_disbursements.csv")

# ============================================================
# CHECK 1: CSV columns vs DB model columns
# ============================================================
print("\n[1] SCHEMA ALIGNMENT: CSV columns vs DB models")

# Course (subjects.csv) vs Course model
db_course_cols = {"id","college_id","department_id","semester","name","credits",
                  "type","subject_code","regulation_year","hours_per_week",
                  "course_category","lecture_hrs","tutorial_hrs","practical_hrs",
                  "is_mooc","mooc_platform","mooc_credit_equiv"}
csv_sub_cols = set(sub_cols)
missing_in_csv = db_course_cols - csv_sub_cols
extra_in_csv = csv_sub_cols - db_course_cols
if missing_in_csv:
    err(f"25_subjects.csv MISSING columns needed by Course model: {missing_in_csv}")
if extra_in_csv:
    warn(f"25_subjects.csv has EXTRA columns not in Course model: {extra_in_csv}")

# CourseOutcome vs co CSV
db_co_cols = {"id","course_id","code","description","bloom_level"}
csv_co_cols_set = set(co_cols)
missing_co = db_co_cols - csv_co_cols_set
if missing_co:
    err(f"26_course_outcomes.csv MISSING columns: {missing_co}")

# COPOMapping vs co_po CSV  
db_copo_cols = {"id","co_id","po_id","strength","rationale","is_active"}
csv_copo_set = set(copo_cols)
missing_copo = db_copo_cols - csv_copo_set
if missing_copo:
    err(f"27_co_po_mapping.csv MISSING columns: {missing_copo}")

# ProgramOutcome model needs department_id, college_id
# Check 07_program_outcomes.csv
pos_data, po_cols = load("07_program_outcomes.csv")
db_po_cols = {"id","department_id","college_id","code","description"}
missing_po = db_po_cols - set(po_cols)
if missing_po:
    err(f"07_program_outcomes.csv MISSING columns for ProgramOutcome model: {missing_po}")

# AttendanceRecord model
db_att_cols = {"id","college_id","period_slot_id","date","faculty_id","student_id",
               "subject_code","status","is_late_entry","is_override","source"}
csv_att_set = set(att_cols) if att_cols else set()
missing_att = db_att_cols - csv_att_set
if missing_att:
    err(f"23_attendance.csv MISSING columns for AttendanceRecord model: {missing_att}")

# Hostel Allocation model (Allocation in hostel.py)
db_alloc_cols = {"id","college_id","student_id","bed_id","room_id","hostel_id",
                 "academic_year","status","selection_fee_paid","admission_id"}
csv_ha_set = set(ha_cols) if ha_cols else set()
missing_ha = db_alloc_cols - csv_ha_set
if missing_ha:
    err(f"30_hostel_allocation.csv MISSING columns for Allocation model: {missing_ha}")

# SemesterGrade model (closest to exam_results)
db_grade_cols = {"id","college_id","student_id","semester","course_id","grade","credits_earned"}
csv_res_set = set(res_cols) if res_cols else set()
missing_grade = db_grade_cols - csv_res_set
if missing_grade:
    err(f"32_exam_results.csv MISSING columns for SemesterGrade model: {missing_grade}")

# Scholarship model
db_sch_cols = {"id","college_id","academic_year","name","type","eligibility_criteria"}
csv_sch_set = set(sch_cols) if sch_cols else set()
missing_sch = db_sch_cols - csv_sch_set
if missing_sch:
    warn(f"33_scholarship CSV schema differs from Scholarship model: {missing_sch}")

# ============================================================
# CHECK 2: college_id is MISSING EVERYWHERE
# ============================================================
print("\n[2] COLLEGE_ID CHECK: Every DB table requires college_id")
COLLEGE_ID = "college-aits-001"  # from 01_college.csv

files_needing_college_id = {
    "25_subjects.csv": sub_cols,
    "26_course_outcomes.csv": co_cols,
    "27_co_po_mapping.csv": copo_cols,
    "28_co_pso_mapping.csv": copso_cols,
    "29_section_mentors.csv": men_cols,
    "30_hostel_allocation.csv": ha_cols,
    "31_bus_allocation.csv": ba_cols,
    "32_exam_results.csv": res_cols,
    "33_scholarship_disbursements.csv": sch_cols,
    "07_program_outcomes.csv": po_cols,
}

for fn, cols in files_needing_college_id.items():
    if cols and "college_id" not in cols:
        err(f"{fn}: MISSING college_id column (required by DB)")

# ============================================================
# CHECK 3: Subject-Student branch alignment deep trace
# ============================================================
print("\n[3] CROSS-RECORD: Student exam results match their branch subjects")

subj_map = {s["id"]: s for s in subjects}
stu_map = {s["id"]: s for s in students}

# Sample 500 random exam results and verify
random.seed(42)
sample = random.sample(results, min(500, len(results)))
branch_mismatches = 0
for r in sample:
    subj = subj_map.get(r["subject_id"])
    stu = stu_map.get(r["student_id"])
    if subj and stu:
        # Subject's dept_code should match student's branch
        # UNLESS it's a common subject (sem 1-2)
        if int(subj["semester"]) > 2:
            if subj["dept_code"] != stu["branch"]:
                branch_mismatches += 1
                if branch_mismatches <= 3:
                    err(f"Result {r['id']}: Student {stu['id']}(branch={stu['branch']}) "
                        f"has result for subject {subj['subject_code']}(dept={subj['dept_code']})")

if branch_mismatches > 0:
    err(f"TOTAL: {branch_mismatches}/500 sampled results have branch-subject mismatch")
else:
    ok("All sampled exam results match student branches")

# ============================================================
# CHECK 4: Semester consistency
# ============================================================
print("\n[4] SEMESTER LOGIC: Results only for semesters student has completed")
batch_max_sem = {"2022":7, "2023":5, "2024":3, "2025":1}
future_results = 0
for r in sample:
    stu = stu_map.get(r["student_id"])
    if stu:
        max_sem = batch_max_sem.get(stu["admission_year"], 1)
        if int(r["semester"]) > max_sem:
            future_results += 1
            if future_results <= 3:
                err(f"Result {r['id']}: Student batch {stu['admission_year']} "
                    f"has result for sem {r['semester']} (max should be {max_sem})")

if future_results:
    err(f"TOTAL: {future_results} results for future semesters")
else:
    ok("No future-semester results found")

# ============================================================
# CHECK 5: Date format consistency
# ============================================================
print("\n[5] DATE FORMATS")
import re
date_ymd = re.compile(r"^\d{4}-\d{2}-\d{2}$")
date_dmy = re.compile(r"^\d{2}-\d{2}-\d{4}$")

# Students DOB format
dob_formats = Counter()
for s in students[:100]:
    dob = s.get("date_of_birth","")
    if date_ymd.match(dob): dob_formats["YYYY-MM-DD"] += 1
    elif date_dmy.match(dob): dob_formats["DD-MM-YYYY"] += 1
    else: dob_formats["OTHER:"+dob] += 1
print(f"  Student DOB format: {dict(dob_formats)}")

# Staff DOB
staff_dob = Counter()
for s in staff[:50]:
    dob = s.get("date_of_birth","")
    if date_ymd.match(dob): staff_dob["YYYY-MM-DD"] += 1
    elif date_dmy.match(dob): staff_dob["DD-MM-YYYY"] += 1
    else: staff_dob["OTHER"] += 1
print(f"  Staff DOB format: {dict(staff_dob)}")
if "YYYY-MM-DD" in staff_dob and "DD-MM-YYYY" in dob_formats:
    warn("DATE FORMAT MISMATCH: Staff uses YYYY-MM-DD but Students use DD-MM-YYYY")

# Attendance dates
att_dates = Counter()
for a in att_cur[:100] if att_cur else []:
    d = a.get("date","")
    if date_ymd.match(d): att_dates["YYYY-MM-DD"] += 1
    else: att_dates["OTHER:"+d[:15]] += 1
print(f"  Attendance date format: {dict(att_dates)}")

# ============================================================
# CHECK 6: Roll number format consistency
# ============================================================
print("\n[6] ROLL NUMBER FORMAT")
roll_pattern = re.compile(r"^\d{2}A81A\d{2}\d{4}$")
bad_rolls = 0
for s in students:
    if not roll_pattern.match(s.get("roll_no","")):
        bad_rolls += 1
        if bad_rolls <= 3:
            warn(f"Non-standard roll: {s['id']} -> {s['roll_no']}")
if bad_rolls:
    warn(f"TOTAL: {bad_rolls} non-standard roll numbers")
else:
    ok("All roll numbers follow JNTUH format")

# ============================================================
# CHECK 7: Missing IT/AIML in subjects
# ============================================================
print("\n[7] IT/AIML SUBJECT COVERAGE")
subj_branches = set(s["dept_code"] for s in subjects)
stu_branches = set(s["branch"] for s in students)
print(f"  Subject branches: {sorted(subj_branches)}")
print(f"  Student branches: {sorted(stu_branches)}")
missing = stu_branches - subj_branches
if missing:
    err(f"Students have branches with NO subjects: {missing}")

# Check IT has its own subjects (not just CSE copies)
it_subjects = [s for s in subjects if s["dept_code"] == "IT"]
cse_subjects = [s for s in subjects if s["dept_code"] == "CSE"]
it_codes = set(s["subject_code"] for s in it_subjects)
cse_codes = set(s["subject_code"] for s in cse_subjects)
overlap = it_codes & cse_codes
if overlap:
    warn(f"IT and CSE share {len(overlap)} identical subject codes: {list(overlap)[:5]}")

# ============================================================
# CHECK 8: Email uniqueness
# ============================================================
print("\n[8] EMAIL UNIQUENESS")
stu_emails = [s["email"] for s in students]
stu_email_dupes = [k for k,v in Counter(stu_emails).items() if v > 1]
if stu_email_dupes:
    err(f"Student email duplicates: {len(stu_email_dupes)} dupes")
else:
    ok(f"All {len(stu_emails)} student emails unique")

staff_emails = [s["email"] for s in staff]
staff_email_dupes = [k for k,v in Counter(staff_emails).items() if v > 1]
if staff_email_dupes:
    err(f"Staff email duplicates: {len(staff_email_dupes)} dupes")
else:
    ok(f"All {len(staff_emails)} staff emails unique")

# Cross check: student emails vs staff emails
cross_dupes = set(stu_emails) & set(staff_emails)
if cross_dupes:
    err(f"CRITICAL: {len(cross_dupes)} emails shared between students and staff!")

# ============================================================
# CHECK 9: Sections vs actual student counts
# ============================================================
print("\n[9] SECTION CAPACITY vs ACTUAL STUDENTS")
sections, sec_cols = load("06_sections.csv")
for sec in sections:
    dept = sec["dept_code"]
    batch = sec["batch_year"]
    section = sec["section"]
    intake = int(sec["intake"])
    
    actual = sum(1 for s in students 
                 if s["branch"] == dept and s["admission_year"] == batch and s["section"] == section)
    
    if actual == 0:
        warn(f"Section {sec['id']} ({dept} {batch} {section}): 0 students (intake={intake})")
    elif actual > intake:
        warn(f"Section {sec['id']}: {actual} students exceeds intake {intake}")

# ============================================================
# SUMMARY
# ============================================================
print("\n" + "="*70)
print(f" AUDIT v2 COMPLETE")
print(f" ERRORS:   {len(ERRORS)}")
print(f" WARNINGS: {len(WARNINGS)}")
print("="*70)

if ERRORS:
    print("\n[ERRORS - MUST FIX]")
    for e in ERRORS: print(f"  X {e}")

if WARNINGS:
    print("\n[WARNINGS - REVIEW]")
    for w in WARNINGS: print(f"  ! {w}")

sys.exit(1 if ERRORS else 0)
