import asyncio
from arq.connections import RedisSettings, create_pool
from app.core.config import settings

async def test():
    redis = await create_pool(RedisSettings.from_dsn(settings.REDIS_URL))
    arq_job = await redis.enqueue_job("generate_naac_ssr_task", "my-test-id")
    print(f"arq_job type: {type(arq_job)}")
    print(f"arq_job: {arq_job}")
    if arq_job:
        print(f"arq_job.job_id: {arq_job.job_id}")

if __name__ == "__main__":
    asyncio.run(test())
