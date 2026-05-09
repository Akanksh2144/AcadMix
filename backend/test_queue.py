import asyncio
from arq.connections import RedisSettings, create_pool
from app.core.config import settings

async def test():
    redis = await create_pool(RedisSettings.from_dsn(settings.REDIS_URL))
    print("Keys:", await redis.keys('arq:*'))
    # Print queue content
    jobs = await redis.zrange('arq:queue', 0, -1, withscores=True)
    print("Jobs in queue:", jobs)
    
if __name__ == "__main__":
    asyncio.run(test())
