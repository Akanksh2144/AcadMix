import asyncio
import uuid
from arq.connections import RedisSettings, create_pool
from app.core.config import settings

async def test():
    redis = await create_pool(RedisSettings.from_dsn(settings.REDIS_URL))
    
    # Generate random UUID
    job_id_str = str(uuid.uuid4())
    print("Enqueuing with _job_id:", job_id_str)
    
    arq_job = await redis.enqueue_job("generate_naac_ssr_task", job_id_str, _job_id=job_id_str)
    print("Arq Job:", arq_job)
    
    if arq_job:
        print("Job ID:", arq_job.job_id)
        # Check status
        print("Status:", await arq_job.status())

if __name__ == "__main__":
    asyncio.run(test())
