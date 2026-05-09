import asyncio
import uuid
from datetime import datetime
from database import admin_session_ctx
from app.models.accreditation import NAACAuditSnapshot, NAACQualitativeNarrative, AccreditationEvidence
from sqlalchemy.future import select

async def seed_accreditation_data():
    college_id = "aits-hyd-001"
    academic_years = ["2020-2021", "2021-2022", "2022-2023", "2023-2024", "2024-2025"]
    
    async with admin_session_ctx() as db:
        print("Seeding Accreditation Data for AITS...")
        
        # 1. Seed Evidence
        print("Seeding Evidence...")
        evidence_ids = []
        for i in range(1, 21):
            ev_id = f"ev_demo_{i}"
            evidence_ids.append(ev_id)
            ev = AccreditationEvidence(
                id=ev_id,
                college_id=college_id,
                criterion_id="GENERIC",
                file_name=f"Demo_Evidence_Document_{i}.pdf",
                s3_key=f"https://acadmix-assets.s3.amazonaws.com/demo/dummy_evidence_{i}.pdf",
                hash_checksum="dummy_checksum_12345",
                uploaded_by=None
            )
            db.add(ev)
            
        # 2. Seed Qualitative Narratives (SWOC etc)
        print("Seeding Narratives...")
        swoc_criteria = [
            ("swoc_strength", "Institutional Strength"),
            ("swoc_weakness", "Institutional Weakness"),
            ("swoc_opportunity", "Institutional Opportunity"),
            ("swoc_challenge", "Institutional Challenge")
        ]
        
        for ay in academic_years:
            for code, name in swoc_criteria:
                narrative = NAACQualitativeNarrative(
                    id=f"narrative_{code}_{ay}",
                    college_id=college_id,
                    academic_year=ay,
                    criterion_code=code,
                    criterion_name=name,
                    narrative_text=f"[{name}] This is an automated deep institutional narrative for the academic year {ay}. " * 15,
                    is_complete=True
                )
                db.add(narrative)

        # 3. Seed Quantitative Snapshots
        print("Seeding Snapshots...")
        metrics = [
            ("1.1.1", "Curricula developed and implemented have relevance"),
            ("1.2.1", "Percentage of new courses introduced"),
            ("2.1.1", "Enrolment Percentage"),
            ("2.2.1", "Student - Full time teacher ratio"),
            ("3.1.1", "Grants received from Government and non-governmental agencies"),
            ("4.1.1", "The Institution has adequate infrastructure"),
            ("5.1.1", "Average percentage of students benefited by scholarships"),
            ("6.1.1", "The governance of the institution is reflective of an effective leadership"),
            ("7.1.1", "Measures initiated by the Institution for the promotion of gender equity")
        ]
        
        for ay in academic_years:
            for i, (code, name) in enumerate(metrics):
                # Pick 2 random evidence ids
                ev_subset = [evidence_ids[(i*2) % 20], evidence_ids[(i*2 + 1) % 20]]
                snap = NAACAuditSnapshot(
                    id=f"snap_{code}_{ay}",
                    college_id=college_id,
                    academic_year=ay,
                    criterion=int(code[0]),
                    metric_code=code,
                    computed_value=100 + (i * 10) + int(ay[:4][-2:]), # Fake value
                    evidence_ids=ev_subset,
                    locked_at=datetime.utcnow()
                )
                db.add(snap)

        await db.commit()
        print("Seeding Complete!")

if __name__ == "__main__":
    asyncio.run(seed_accreditation_data())
