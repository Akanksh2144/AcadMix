"""Quick check: dump the Cloud Task Scheduler description to verify self-talk was stripped."""
import os, sys, asyncio
from pathlib import Path
backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
from dotenv import load_dotenv
load_dotenv()
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool
from sqlalchemy import select

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL, echo=False, poolclass=NullPool,
    connect_args={"statement_cache_size": 0, "timeout": 60, "command_timeout": 120, "server_settings": {"jit": "off"}})
Session = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

async def main():
    from app.models.evaluation import PremiumCodingChallenge
    async with Session() as session:
        result = await session.execute(
            select(PremiumCodingChallenge).where(PremiumCodingChallenge.title.ilike('%Cloud Task%'))
        )
        c = result.scalars().first()
        if c:
            with open("debug_cloud_task.txt", "w", encoding="utf-8") as f:
                f.write(c.description)
            print(f"Dumped: {c.title}")
        else:
            # Try the batching one
            result = await session.execute(
                select(PremiumCodingChallenge).where(PremiumCodingChallenge.title.ilike('%Batching%'))
            )
            c = result.scalars().first()
            if c:
                with open("debug_cloud_task.txt", "w", encoding="utf-8") as f:
                    f.write(c.description)
                print(f"Dumped: {c.title}")

if __name__ == "__main__":
    asyncio.run(main())
