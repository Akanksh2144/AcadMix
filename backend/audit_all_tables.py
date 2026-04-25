"""List ALL tables with row counts — the full 142"""
import asyncio, sys, os
sys.path.insert(0, ".")
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from sqlalchemy.pool import NullPool
from app.core.config import settings

async def check():
    engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool,
        connect_args={"statement_cache_size": 0, "command_timeout": 60})
    SM = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with SM() as db:
        r = await db.execute(text(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
        ))
        tables = [row[0] for row in r.fetchall()]
        
        print(f"TOTAL TABLES: {len(tables)}\n", flush=True)
        
        populated = []
        empty = []
        total_rows = 0
        
        for t in tables:
            try:
                r = await db.execute(text(f"SELECT COUNT(*) FROM \"{t}\""))
                count = r.scalar()
                total_rows += count
                if count > 0:
                    populated.append((t, count))
                else:
                    empty.append(t)
            except Exception as e:
                empty.append(f"{t} (ERROR)")
        
        print(f"=== POPULATED ({len(populated)} tables, {total_rows:,} total rows) ===", flush=True)
        for t, c in sorted(populated, key=lambda x: -x[1]):
            print(f"  {t}: {c:,}", flush=True)
        
        print(f"\n=== EMPTY ({len(empty)} tables) ===", flush=True)
        for t in sorted(empty):
            print(f"  {t}", flush=True)
    
    await engine.dispose()

asyncio.run(check())
