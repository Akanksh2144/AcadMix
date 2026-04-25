"""Generate 29_section_mentors.csv, 30_hostel_allocation.csv, 31_bus_allocation.csv"""
import csv, random
random.seed(42)

# ── Read data ──
students = []
with open("21_students.csv","r",encoding="utf-8") as f:
    for r in csv.DictReader(f): students.append(r)

staff = []
with open("20_staff.csv","r",encoding="utf-8") as f:
    for r in csv.DictReader(f):
        if r["is_teaching"] == "True": staff.append(r)

sections = []
with open("06_sections.csv","r",encoding="utf-8") as f:
    for r in csv.DictReader(f): sections.append(r)

hostel_rooms = []
with open("12_hostel_rooms.csv","r",encoding="utf-8") as f:
    for r in csv.DictReader(f): hostel_rooms.append(r)

routes = []
with open("15_bus_routes.csv","r",encoding="utf-8") as f:
    for r in csv.DictReader(f): routes.append(r)

# ── 29: Section Mentors ──
# Group faculty by dept
fac_by_dept = {}
for s in staff:
    fac_by_dept.setdefault(s["dept_code"], []).append(s)

# ET sub-branches share ET faculty
et_fac = fac_by_dept.get("ET", [])
for code in ["IT","CSM","CSD","CSO","AIML","IoT"]:
    if code not in fac_by_dept or len(fac_by_dept[code]) < 2:
        fac_by_dept.setdefault(code, []).extend(et_fac)

mentor_rows = []
mid = 0
for sec in sections:
    dept = sec["dept_code"]
    avail = fac_by_dept.get(dept, staff[:5])
    # Assign 2 mentors per section (or 1 if not enough)
    n = min(2, len(avail))
    mentors = random.sample(avail, n)
    for m in mentors:
        mid += 1
        mentor_rows.append({
            "id": f"mnt-{mid:04d}",
            "section_id": sec["id"],
            "dept_code": dept,
            "batch_year": sec["batch_year"],
            "section": sec["section"],
            "faculty_id": m["id"],
            "faculty_name": m["name"],
            "academic_year": f"{int(sec['batch_year'])}-{int(sec['batch_year'])+4}",
            "is_active": True,
        })

with open("29_section_mentors.csv","w",newline="",encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=["id","section_id","dept_code","batch_year","section","faculty_id","faculty_name","academic_year","is_active"])
    w.writeheader()
    w.writerows(mentor_rows)
print(f"29_section_mentors.csv: {len(mentor_rows)} assignments")

# ── 30: Hostel Allocation ──
# Filter hostellers
hostellers = [s for s in students if s.get("fee_category") == "Hosteller"]
male_h = [s for s in hostellers if s["gender"] == "Male"]
female_h = [s for s in hostellers if s["gender"] == "Female"]

male_rooms = [r for r in hostel_rooms if r["gender"] == "Male"]
female_rooms = [r for r in hostel_rooms if r["gender"] == "Female"]

random.shuffle(male_h)
random.shuffle(female_h)

alloc_rows = []
aid = 0

def allocate(students_list, rooms_list):
    global aid
    ri = 0
    occ = {}  # room_id -> current count
    for s in students_list:
        while ri < len(rooms_list):
            room = rooms_list[ri]
            cur = occ.get(room["id"], 0)
            cap = int(room["capacity"])
            if cur < cap:
                aid += 1
                alloc_rows.append({
                    "id": f"halloc-{aid:05d}",
                    "student_id": s["id"],
                    "hostel_room_id": room["id"],
                    "hostel_block_id": room["hostel_block_id"],
                    "room_number": room["room_number"],
                    "academic_year": f"{s['admission_year']}-{int(s['admission_year'])+4}",
                    "admission_year": s["admission_year"],
                    "status": "occupied",
                })
                occ[room["id"]] = cur + 1
                break
            else:
                ri += 1

allocate(male_h, male_rooms)
allocate(female_h, female_rooms)

with open("30_hostel_allocation.csv","w",newline="",encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=["id","student_id","hostel_room_id","hostel_block_id","room_number","academic_year","admission_year","status"])
    w.writeheader()
    w.writerows(alloc_rows)
print(f"30_hostel_allocation.csv: {len(alloc_rows)} allocations")

# ── 31: Bus Allocation ──
bus_students = [s for s in students if s.get("fee_category") == "Day Scholar" and s.get("bus_route","")]
# Actually, bus_route column may be empty. Let's assign ~40% of day scholars to buses
day_scholars = [s for s in students if s.get("fee_category") == "Day Scholar"]
random.shuffle(day_scholars)
bus_count = int(len(day_scholars) * 0.4)
bus_students = day_scholars[:bus_count]

route_ids = [r["id"] for r in routes]
bus_rows = []
for i, s in enumerate(bus_students):
    route = random.choice(route_ids)
    stops = routes[[r["id"] for r in routes].index(route)]["stops"].split(" → ")
    stop = random.choice(stops[:-1])  # exclude AITS (destination)
    bus_rows.append({
        "id": f"bus-alloc-{i+1:05d}",
        "student_id": s["id"],
        "route_id": route,
        "boarding_stop": stop,
        "academic_year": f"{s['admission_year']}-{int(s['admission_year'])+4}",
        "pass_type": random.choice(["annual","semester"]),
        "status": "active",
    })

with open("31_bus_allocation.csv","w",newline="",encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=["id","student_id","route_id","boarding_stop","academic_year","pass_type","status"])
    w.writeheader()
    w.writerows(bus_rows)
print(f"31_bus_allocation.csv: {len(bus_rows)} allocations")
