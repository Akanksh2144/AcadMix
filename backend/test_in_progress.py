import asyncio
from arq.connections import RedisSettings, create_pool
from app.core.config import settings

async def test():
    redis = await create_pool(RedisSettings.from_dsn(settings.REDIS_URL))
    print(await redis.keys('arq:in-progress:*'))

if __name__ == "__main__":
    asyncio.run(test())
