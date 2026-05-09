import asyncio
from arq import create_pool
from arq.connections import RedisSettings
from app.core.config import settings

async def test():
    print("Connecting...")
    p = await create_pool(RedisSettings.from_dsn(settings.REDIS_URL))
    print("Connected!")
    try:
        j = await p.enqueue_job("generate_naac_ssr_task", "test")
        print("Enqueued:", j)
    except Exception as e:
        print("Enqueue Failed:", e)
    
if __name__ == "__main__":
    asyncio.run(test())
