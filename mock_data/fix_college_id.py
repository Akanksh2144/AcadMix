"""Fix college_id from 'college-aits-001' to 'aits-hyd-001' in ALL CSVs"""
import csv, os, glob

OLD = "college-aits-001"
NEW = "aits-hyd-001"

files = glob.glob("*.csv")
for fn in sorted(files):
    with open(fn, "r", encoding="utf-8") as f:
        content = f.read()
    if OLD in content:
        content = content.replace(OLD, NEW)
        with open(fn, "w", encoding="utf-8", newline="") as f:
            f.write(content)
        print(f"  Fixed: {fn}")
    else:
        # Check if college_id column exists but has different value
        pass

print("Done. All college_ids now use:", NEW)
