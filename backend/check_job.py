import asyncio
from database import admin_session_ctx
from app.models.accreditation import AccreditationReportJob
from sqlalchemy import select

async def get_job():
    async with admin_session_ctx() as db:
        res = await db.execute(select(AccreditationReportJob).order_by(AccreditationReportJob.created_at.desc()).limit(1))
        job = res.scalars().first()
        if job:
            print(f"STATUS: {job.status}")
            print(f"URL: {job.presigned_url}")
        else:
            print("NO JOB FOUND")

if __name__ == "__main__":
    asyncio.run(get_job())
