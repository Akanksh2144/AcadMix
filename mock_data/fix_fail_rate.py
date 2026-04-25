"""Fix fail rate to realistic 5-8% by boosting minimum marks"""
import csv, random
random.seed(123)

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

results = []
with open("32_exam_results.csv","r",encoding="utf-8") as f:
    reader = csv.DictReader(f)
    fields = reader.fieldnames
    results = list(reader)

fixed = 0
for r in results:
    if r["grade"] == "F":
        # Keep only ~30% of fails (gives ~6-7% overall fail rate)
        if random.random() < 0.70:
            is_theory = r["mid2_marks"] != "0"
            if is_theory:
                ext = int(r["external_marks"])
                new_ext = min(60, ext + random.randint(10, 25))
                mid1 = max(int(r["mid1_marks"]), random.randint(12, 18))
                mid2 = max(int(r["mid2_marks"]), random.randint(12, 18))
                assign = max(int(r["assignment_marks"]), random.randint(4, 7))
                r["mid1_marks"] = str(mid1)
                r["mid2_marks"] = str(mid2)
                r["assignment_marks"] = str(assign)
                r["external_marks"] = str(new_ext)
                internal = mid1 + mid2 + assign
                total = internal + new_ext
                r["internal_marks"] = str(internal)
                r["total_marks"] = str(total)
                r["grade"] = get_grade(total)
            else:
                ext = int(r["external_marks"])
                new_ext = min(40, ext + random.randint(8, 15))
                mid1 = max(int(r["mid1_marks"]), random.randint(8, 14))
                r["mid1_marks"] = str(mid1)
                r["external_marks"] = str(new_ext)
                internal = mid1
                total = internal + new_ext
                r["internal_marks"] = str(internal)
                r["total_marks"] = str(total)
                r["grade"] = get_grade_lab(total)
            r["result"] = "PASS" if r["grade"] != "F" else "FAIL"
            fixed += 1

with open("32_exam_results.csv","w",newline="",encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader()
    w.writerows(results)

new_fail = sum(1 for r in results if r["result"] == "FAIL")
from collections import Counter
grade_dist = Counter(r["grade"] for r in results)
print(f"Fixed {fixed} grades. Fail rate: {new_fail/len(results)*100:.1f}%")
print(f"Grade distribution: { {k:f'{v/len(results)*100:.1f}%' for k,v in sorted(grade_dist.items())} }")
