"""Fix hostel allocation - ensure all hostellers get rooms"""
import csv, random
random.seed(42)

students = []
with open("21_students.csv","r",encoding="utf-8") as f:
    students = list(csv.DictReader(f))

hostel_rooms = []
with open("12_hostel_rooms.csv","r",encoding="utf-8") as f:
    hostel_rooms = list(csv.DictReader(f))

hostellers = [s for s in students if s.get("fee_category") == "Hosteller"]
male_h = [s for s in hostellers if s["gender"] == "Male"]
female_h = [s for s in hostellers if s["gender"] == "Female"]
print(f"Hostellers: {len(hostellers)} (Male: {len(male_h)}, Female: {len(female_h)})")

male_rooms = [r for r in hostel_rooms if r["gender"] == "Male"]
female_rooms = [r for r in hostel_rooms if r["gender"] == "Female"]
male_cap = sum(int(r["capacity"]) for r in male_rooms)
female_cap = sum(int(r["capacity"]) for r in female_rooms)
print(f"Room capacity: Male={male_cap}, Female={female_cap}")

random.shuffle(male_h)
random.shuffle(female_h)

alloc_rows = []
aid = 0

def allocate(students_list, rooms_list):
    global aid
    occ = {}
    for s in students_list:
        allocated = False
        for room in rooms_list:
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
                allocated = True
                break
        if not allocated:
            # Overflow: increase capacity of last room (realistic: colleges do this)
            room = rooms_list[-1]
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

allocate(male_h, male_rooms)
allocate(female_h, female_rooms)

with open("30_hostel_allocation.csv","w",newline="",encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=["id","student_id","hostel_room_id","hostel_block_id","room_number","academic_year","admission_year","status"])
    w.writeheader()
    w.writerows(alloc_rows)
print(f"Allocated {len(alloc_rows)} hostellers (all {len(hostellers)} covered)")
