"""Generate 26_course_outcomes.csv, 27_co_po_mapping.csv, 28_co_pso_mapping.csv"""
import csv, random
random.seed(42)

BLOOMS = ["Remember","Understand","Apply","Analyze","Evaluate","Create"]
BLOOMS_VERBS = {
    "Remember": ["Define","List","Recall","Identify","State"],
    "Understand": ["Explain","Describe","Summarize","Interpret","Classify"],
    "Apply": ["Apply","Implement","Solve","Demonstrate","Use"],
    "Analyze": ["Analyze","Compare","Differentiate","Examine","Distinguish"],
    "Evaluate": ["Evaluate","Assess","Justify","Critique","Judge"],
    "Create": ["Design","Develop","Formulate","Construct","Propose"],
}

# Read subjects
subjects = []
with open("25_subjects.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        subjects.append(row)

# Read PSOs to know which depts have how many PSOs
pso_map = {}  # dept_id -> list of pso ids
with open("08_program_specific_outcomes.csv", "r", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        pso_map.setdefault(row["dept_id"], []).append(row["id"])

# ET sub-branches use ET PSOs
for dept in ["dept-it","dept-csm","dept-csd","dept-cso","dept-aiml","dept-iot"]:
    if dept not in pso_map:
        pso_map[dept] = pso_map.get("dept-et", [])

PO_IDS = [f"po-{i:02d}" for i in range(1, 13)]

# Generate COs
co_rows = []
co_po_rows = []
co_pso_rows = []
co_id = 0

for subj in subjects:
    sem = int(subj["semester"])
    stype = subj["type"]

    # 5-6 COs per subject (labs get 4-5)
    num_cos = random.choice([4, 5]) if stype == "Lab" else random.choice([5, 6])

    # Bloom's level distribution: lower sems = more Remember/Understand, higher = more Analyze/Create
    if sem <= 2:
        bloom_weights = [0.25, 0.30, 0.25, 0.10, 0.05, 0.05]
    elif sem <= 4:
        bloom_weights = [0.10, 0.20, 0.30, 0.20, 0.10, 0.10]
    elif sem <= 6:
        bloom_weights = [0.05, 0.10, 0.25, 0.25, 0.20, 0.15]
    else:
        bloom_weights = [0.05, 0.05, 0.15, 0.25, 0.25, 0.25]

    subj_cos = []
    for c in range(1, num_cos + 1):
        co_id += 1
        bloom = random.choices(BLOOMS, weights=bloom_weights, k=1)[0]
        verb = random.choice(BLOOMS_VERBS[bloom])
        desc = f"{verb} {subj['name'].lower()} concepts and techniques"

        co_rec = {
            "id": f"co-{co_id:05d}",
            "subject_id": subj["id"],
            "subject_code": subj["subject_code"],
            "co_number": c,
            "co_code": f"{subj['subject_code']}.CO{c}",
            "description": desc,
            "blooms_level": bloom,
        }
        co_rows.append(co_rec)
        subj_cos.append(co_rec)

    # CO-PO Mapping: each CO maps to 3-6 POs with correlation 1/2/3
    for co in subj_cos:
        num_pos = random.randint(3, 6)
        selected_pos = random.sample(PO_IDS, num_pos)
        for po_id in selected_pos:
            co_po_rows.append({
                "id": f"copo-{len(co_po_rows)+1:06d}",
                "co_id": co["id"],
                "po_id": po_id,
                "co_code": co["co_code"],
                "po_code": f"PO{int(po_id.split('-')[1])}",
                "correlation_level": random.choice([1, 2, 2, 3, 3, 3]),
            })

    # CO-PSO Mapping: each CO maps to 1-2 PSOs
    dept_psos = pso_map.get(subj["dept_id"], [])
    if dept_psos:
        for co in subj_cos:
            num_psos = random.randint(1, min(2, len(dept_psos)))
            selected = random.sample(dept_psos, num_psos)
            for pso_id in selected:
                co_pso_rows.append({
                    "id": f"copso-{len(co_pso_rows)+1:06d}",
                    "co_id": co["id"],
                    "pso_id": pso_id,
                    "co_code": co["co_code"],
                    "pso_code": pso_id.split("-")[-1].upper(),
                    "correlation_level": random.choice([1, 2, 2, 3, 3, 3]),
                })

# Write COs
with open("26_course_outcomes.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=["id","subject_id","subject_code","co_number","co_code","description","blooms_level"])
    w.writeheader()
    w.writerows(co_rows)
print(f"Generated 26_course_outcomes.csv with {len(co_rows)} COs")

# Write CO-PO
with open("27_co_po_mapping.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=["id","co_id","po_id","co_code","po_code","correlation_level"])
    w.writeheader()
    w.writerows(co_po_rows)
print(f"Generated 27_co_po_mapping.csv with {len(co_po_rows)} mappings")

# Write CO-PSO
with open("28_co_pso_mapping.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=["id","co_id","pso_id","co_code","pso_code","correlation_level"])
    w.writeheader()
    w.writerows(co_pso_rows)
print(f"Generated 28_co_pso_mapping.csv with {len(co_pso_rows)} mappings")
