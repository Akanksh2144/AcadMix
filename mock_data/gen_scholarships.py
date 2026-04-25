"""Generate 33_scholarship_disbursements.csv"""
import csv, random
from datetime import date, timedelta
random.seed(42)

students = []
with open("21_students.csv","r",encoding="utf-8") as f:
    for r in csv.DictReader(f): students.append(r)

scholarship_students = [s for s in students if s.get("scholarship") and s["scholarship"] != "None"]
print(f"Scholarship students: {len(scholarship_students)}")

rows = []
rid = 0
batch_to_max_sem = {"2022":7, "2023":5, "2024":3, "2025":1}

for stu in scholarship_students:
    batch = stu["admission_year"]
    max_sem = batch_to_max_sem.get(batch, 1)
    sch_type = stu["scholarship"]
    sch_amt = float(stu["scholarship_amount"]) if stu["scholarship_amount"] else 10000

    for sem in range(1, max_sem + 1):
        rid += 1
        ay_start = int(batch) + (sem - 1) // 2
        ay = f"{ay_start}-{ay_start + 1}"

        # Disbursement date: 2-4 months after semester start
        if sem % 2 == 1:  # odd sem starts ~July
            disb_date = date(ay_start, random.randint(9, 11), random.randint(1, 28))
        else:  # even sem starts ~Jan
            disb_date = date(ay_start + 1, random.randint(3, 5), random.randint(1, 28))

        # Status: mostly disbursed, some pending for current sem
        if sem == max_sem and random.random() < 0.3:
            status = "pending"
            disb_date_str = ""
        else:
            status = "disbursed"
            disb_date_str = disb_date.strftime("%Y-%m-%d")

        rows.append({
            "id": f"sch-{rid:06d}",
            "student_id": stu["id"],
            "scholarship_type": sch_type,
            "amount": sch_amt,
            "semester": sem,
            "academic_year": ay,
            "disbursement_date": disb_date_str,
            "status": status,
            "payment_mode": random.choice(["NEFT","RTGS","Direct Benefit Transfer"]),
            "reference_number": f"SCH{random.randint(100000,999999)}" if status == "disbursed" else "",
        })

fields = ["id","student_id","scholarship_type","amount","semester","academic_year",
          "disbursement_date","status","payment_mode","reference_number"]

with open("33_scholarship_disbursements.csv","w",newline="",encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader()
    w.writerows(rows)
print(f"Generated 33_scholarship_disbursements.csv with {len(rows)} records")
