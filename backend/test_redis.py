import asyncio
from arq.connections import RedisSettings, create_pool
from app.core.config import settings
from database import admin_session_ctx
from sqlalchemy import text
import pickle

async def check_redis():
    redis = await create_pool(RedisSettings.from_dsn(settings.REDIS_URL))
    
    async with admin_session_ctx() as db:
        res = await db.execute(text("SELECT id, arq_job_id FROM accreditation_report_jobs ORDER BY created_at DESC LIMIT 2"))
        rows = res.fetchall()
        
    for row in rows:
        db_id, arq_job_id = row
        print(f"DB Job: {db_id}, ARQ Job ID: {arq_job_id}")
        
        if arq_job_id:
            result = await redis.get(f"arq:result:{arq_job_id}")
            if result:
                import msgpack
                # ARQ uses msgpack or pickle? ARQ uses pickle natively!
                try:
                    data = pickle.loads(result)
                    print(f"ARQ Result (pickle): {data}")
                except Exception:
                    pass
            else:
                print("No ARQ result found.")

if __name__ == "__main__":
    asyncio.run(check_redis())
