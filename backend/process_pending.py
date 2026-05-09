import asyncio
from database import admin_session_ctx
from app.workers.pdf_generator import generate_naac_ssr_task
from app.models.accreditation import AccreditationReportJob
from sqlalchemy import select

async def process_pending():
    async with admin_session_ctx() as db:
        res = await db.execute(select(AccreditationReportJob).where(AccreditationReportJob.status == 'PENDING'))
        jobs = res.scalars().all()
        for job in jobs:
            print(f"Processing job: {job.id}")
            ctx = {"db_session": db}
            try:
                await generate_naac_ssr_task(ctx, job.id)
                print(f"Job {job.id} completed.")
            except Exception as e:
                print(f"Job {job.id} failed: {e}")

if __name__ == "__main__":
    asyncio.run(process_pending())
