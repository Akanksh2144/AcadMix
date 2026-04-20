import asyncio
import sys
import os
import argparse
from pathlib import Path

backend_dir = str(Path(__file__).resolve().parent.parent)
sys.path.insert(0, backend_dir)

from database import admin_session_ctx
from sqlalchemy import select
from app.models.core import Department
from app.models.outcomes import ProgramOutcome

NBA_POS = [
    ("PO1", "Engineering knowledge: Apply the knowledge of mathematics, science, engineering fundamentals, and an engineering specialization to the solution of complex engineering problems."),
    ("PO2", "Problem analysis: Identify, formulate, review research literature, and analyze complex engineering problems reaching substantiated conclusions using first principles of mathematics, natural sciences, and engineering sciences."),
    ("PO3", "Design/development of solutions: Design solutions for complex engineering problems and design system components or processes that meet the specified needs with appropriate consideration for the public health and safety, and the cultural, societal, and environmental considerations."),
    ("PO4", "Conduct investigations of complex problems: Use research-based knowledge and research methods including design of experiments, analysis and interpretation of data, and synthesis of the information to provide valid conclusions."),
    ("PO5", "Modern tool usage: Create, select, and apply appropriate techniques, resources, and modern engineering and IT tools including prediction and modeling to complex engineering activities with an understanding of the limitations."),
    ("PO6", "The engineer and society: Apply reasoning informed by the contextual knowledge to assess societal, health, safety, legal and cultural issues and the consequent responsibilities relevant to the professional engineering practice."),
    ("PO7", "Environment and sustainability: Understand the impact of the professional engineering solutions in societal and environmental contexts, and demonstrate the knowledge of, and need for sustainable development."),
    ("PO8", "Ethics: Apply ethical principles and commit to professional ethics and responsibilities and norms of the engineering practice."),
    ("PO9", "Individual and team work: Function effectively as an individual, and as a member or leader in diverse teams, and in multidisciplinary settings."),
    ("PO10", "Communication: Communicate effectively on complex engineering activities with the engineering community and with society at large, such as, being able to comprehend and write effective reports and design documentation, make effective presentations, and give and receive clear instructions."),
    ("PO11", "Project management and finance: Demonstrate knowledge and understanding of the engineering and management principles and apply these to one's own work, as a member and leader in a team, to manage projects and in multidisciplinary environments."),
    ("PO12", "Life-long learning: Recognize the need for, and have the preparation and ability to engage in independent and life-long learning in the broadest context of technological change.")
]

async def seed_pos(dry_run: bool):
    print(f"--- Starting NBA PO Seeding {'(DRY RUN)' if dry_run else ''} ---")
    
    async with admin_session_ctx() as db:
        # Get all departments
        dept_result = await db.execute(select(Department))
        departments = dept_result.scalars().all()
        
        if not departments:
            print("No departments found in the database. Exiting.")
            return

        total_inserted = 0
        total_skipped = 0

        for dept in departments:
            print(f"\nProcessing Department: {dept.name} ({dept.code}) [ID: {dept.id}]")
            
            # Check existing POs
            po_result = await db.execute(
                select(ProgramOutcome).where(ProgramOutcome.department_id == dept.id)
            )
            existing_pos = {po.code for po in po_result.scalars().all()}
            
            inserts_for_dept = 0
            
            for code, description in NBA_POS:
                if code in existing_pos:
                    print(f"  [SKIPPED] {code} already exists.")
                    total_skipped += 1
                else:
                    if dry_run:
                        print(f"  [DRY RUN INSERT] {code}: {description[:50]}...")
                    else:
                        new_po = ProgramOutcome(
                            department_id=dept.id,
                            code=code,
                            description=description
                        )
                        db.add(new_po)
                        print(f"  [INSERTED] {code}: {description[:50]}...")
                    inserts_for_dept += 1
                    total_inserted += 1
            
            print(f"  -> Added {inserts_for_dept} standard POs for {dept.code}")

        if not dry_run and total_inserted > 0:
            await db.commit()
            print("\n--- Commit Successful ---")
        elif dry_run:
            print("\n--- Dry Run Completed (No changes saved) ---")
        else:
            print("\n--- Completed: All POs were already up to date ---")

        print(f"Total Skipped: {total_skipped}")
        print(f"Total Inserted: {total_inserted}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed standard NBA Program Outcomes (POs) into all active departments.")
    parser.add_argument("--dry-run", action="store_true", help="Print operations without committing to the database")
    args = parser.parse_args()
    
    asyncio.run(seed_pos(dry_run=args.dry_run))
