"""Quick debug: dump raw description text from DB to see what we're actually working with."""
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

script_engine = create_async_engine(
    DATABASE_URL, echo=False, poolclass=NullPool,
    connect_args={"statement_cache_size": 0, "timeout": 60, "command_timeout": 120, "server_settings": {"jit": "off"}},
)
ScriptSession = async_sessionmaker(bind=script_engine, class_=AsyncSession, expire_on_commit=False)

async def main():
    from app.models.evaluation import PremiumCodingChallenge
    async with ScriptSession() as session:
        result = await session.execute(select(PremiumCodingChallenge).limit(2))
        challenges = result.scalars().all()
        for c in challenges:
            with open(f"debug_{c.slug[:30]}.txt", "w", encoding="utf-8") as f:
                f.write(c.description)
            print(f"Dumped: {c.title} -> debug_{c.slug[:30]}.txt")

if __name__ == "__main__":
    asyncio.run(main())
