import asyncio
from database import admin_session_ctx
from app.workers.pdf_generator import generate_naac_ssr_task
from app.models.accreditation import AccreditationReportJob
from sqlalchemy import select

async def test_worker():
    async with admin_session_ctx() as db:
        res = await db.execute(select(AccreditationReportJob).order_by(AccreditationReportJob.created_at.desc()).limit(1))
        job = res.scalars().first()
        if not job:
            print("No job found!")
            return
            
        print(f"Testing job: {job.id}")
        ctx = {"db_session": db}
        try:
            await generate_naac_ssr_task(ctx, job.id)
            print("Worker finished successfully")
        except Exception as e:
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_worker())
