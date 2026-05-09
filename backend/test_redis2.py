import asyncio
from arq.connections import RedisSettings, create_pool
from app.core.config import settings
import pickle

async def test():
    redis = await create_pool(RedisSettings.from_dsn(settings.REDIS_URL))
    result = await redis.get("arq:result:eb334e0b5078419e8faf15c43d3e6b64")
    if result:
        print("Test job finished!")
        data = pickle.loads(result)
        print(f"Result: {data}")
    else:
        print("Test job still queued or no result?")

if __name__ == "__main__":
    asyncio.run(test())
