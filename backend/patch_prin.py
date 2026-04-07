import asyncio, os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv(r'C:\AcadMix\backend\.env')
db_url = os.environ.get('DATABASE_URL')
if not db_url: db_url = 'postgresql+asyncpg://postgres:postgres@localhost:5432/acadmix'
engine = create_async_engine(db_url, connect_args={'statement_cache_size': 0})

async def init_prin():
    async with AsyncSession(engine) as session:
        stmt = text("UPDATE users SET profile_data = '{\"college_id\": \"PRIN001\"}'::jsonb WHERE id = 'PRIN001';")
        await session.execute(stmt)
        await session.commit()
        print('Updated PRIN001 profile_data!')

asyncio.run(init_prin())
