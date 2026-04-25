import asyncio, sys, os
sys.path.insert(0, ".")
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from sqlalchemy.pool import NullPool
from app.core.config import settings

async def clean():
    engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool,
        connect_args={"statement_cache_size": 0, "command_timeout": 120})
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        r = await db.execute(text(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
        ))
        tables = [row[0] for row in r.fetchall()]
        print(f"Found {len(tables)} tables", flush=True)
        
        all_tables = ", ".join(tables)
        try:
            await db.execute(text(f"TRUNCATE TABLE {all_tables} CASCADE"))
            await db.commit()
            print("SUCCESS: All tables truncated!", flush=True)
        except Exception as e:
            await db.rollback()
            print(f"TRUNCATE ALL failed: {e}", flush=True)
    
    await engine.dispose()

asyncio.run(clean())
