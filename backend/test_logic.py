import asyncio
from database import admin_session_ctx
from app.models.accreditation import AccreditationReportJob
from arq.connections import RedisSettings, create_pool
from app.core.config import settings
from sqlalchemy import update

async def test():
    async with admin_session_ctx() as session:
        # Create a new job
        new_job = AccreditationReportJob(
            college_id="AITS",
            report_type="NAAC",
            academic_year="2023-2024",
            created_by="STF-0002"
        )
        session.add(new_job)
        await session.commit()
        await session.refresh(new_job)
        
        job_id_str = str(new_job.id)
        print("Created DB job:", job_id_str)
        
        # Enqueue
        arq_redis = await create_pool(RedisSettings.from_dsn(settings.REDIS_URL))
        arq_job = await arq_redis.enqueue_job("generate_naac_ssr_task", job_id_str, _job_id=job_id_str)
        print("Arq Job:", arq_job)
        
        if arq_job:
            await session.execute(
                update(AccreditationReportJob)
                .where(AccreditationReportJob.id == job_id_str)
                .values(arq_job_id=arq_job.job_id)
            )
            await session.commit()
            print("Committed update!")
        else:
            print("ARQ ENQUEUE RETURNED NONE")

if __name__ == "__main__":
    asyncio.run(test())
