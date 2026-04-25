import asyncio, sys, os
sys.path.insert(0, ".")
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from sqlalchemy.pool import NullPool
from app.core.config import settings

async def check():
    engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool,
        connect_args={"statement_cache_size": 0, "command_timeout": 30})
    SM = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with SM() as db:
        r = await db.execute(text(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
        ))
        all_tables = [row[0] for row in r.fetchall()]
        keywords = ["transport", "bus", "hostel", "alloc", "bed", "scholar",
                     "mentor", "faculty_assign", "building", "room"]
        print("Relevant tables in DB:")
        for t in all_tables:
            if any(k in t for k in keywords):
                print(f"  {t}")
    await engine.dispose()

asyncio.run(check())
