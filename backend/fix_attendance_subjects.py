"""
Fix sem-7 attendance: split 3 subjects into 6 by reassigning half the records.
For each existing subject *7101/*7102/*7103, take half the records and remap to *7104/*7105/*7106.
Uses ROW_NUMBER to select every other record deterministically.
"""

import asyncio
from sqlalchemy import text
from database import AdminSessionLocal

COLLEGE_ID = "aits-hyd-001"

DEPT_PREFIX = {
    "CSE": "22CS", "CSD": "22DS", "CSM": "22AI", "CSO": "22CY",
    "AIML": "22AM", "ECE": "22EC", "EEE": "22EE", "MECH": "22ME",
    "CIVIL": "22CE", "IT": "22IT", "IoT": "22IO",
}

async def main():
    async with AdminSessionLocal() as db:
        for dept, prefix in DEPT_PREFIX.items():
            for i in range(3):
                old_code = f"{prefix}710{i+1}"
                new_code = f"{prefix}710{i+4}"
                
                # Reassign every other record (odd row numbers) to the new subject code
                result = await db.execute(text("""
                    UPDATE attendance_records SET subject_code = :new_code
                    WHERE id IN (
                        SELECT id FROM (
                            SELECT id, ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY date, period_slot_id) AS rn
                            FROM attendance_records
                            WHERE subject_code = :old_code
                              AND college_id = :college_id
                              AND is_deleted = false
                              AND student_id IN (
                                  SELECT user_id FROM user_profiles 
                                  WHERE department = :dept AND current_semester = 7
                              )
                        ) numbered
                        WHERE rn % 2 = 0
                    )
                """), {"old_code": old_code, "new_code": new_code, "college_id": COLLEGE_ID, "dept": dept})
                print(f"  {dept}: {old_code} -> {new_code}: {result.rowcount} rows reassigned")
            
        await db.commit()
        
        # Verify for CSE student STU-00011
        r = await db.execute(text("""
            SELECT subject_code, COUNT(*) as cnt
            FROM attendance_records
            WHERE college_id = :cid AND is_deleted = false AND student_id = 'STU-00011'
            GROUP BY subject_code ORDER BY subject_code
        """), {"cid": COLLEGE_ID})
        print("\nSTU-00011 (CSE sem-7) verification:")
        for row in r.all():
            print(f"  {row[0]}: {row[1]} records")

if __name__ == "__main__":
    asyncio.run(main())
