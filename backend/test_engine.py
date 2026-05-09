import asyncio
from sqlalchemy.future import select
from sqlalchemy.sql import text
from database import admin_session_ctx
from app.workers.pdf_generator import generate_naac_ssr_task
from app.models.accreditation import AccreditationReportJob

async def run_test():
    async with admin_session_ctx() as db:
        res = await db.execute(text("SELECT id FROM users LIMIT 1"))
        user_id = res.scalar()
        print(f"Found User ID: {user_id}")
        
        job = AccreditationReportJob(
            college_id="aits-hyd-001",
            report_type="NAAC",
            academic_year="2024-2025",
            version=4,
            status="PENDING",
            created_by=user_id
        )
        db.add(job)
        await db.commit()
        await db.refresh(job)
        job_id = job.id
        print(f"Created Job: {job_id}")

    print("Running Task...")
    res = await generate_naac_ssr_task({}, job_id)
    print("Result:", res)

if __name__ == "__main__":
    asyncio.run(run_test())
