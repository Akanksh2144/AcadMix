"""
Direct surgical fix for Cloud Task Scheduler description examples.
The LLM left duplicate traces and misorderd Output/Explanation.
"""
import os, sys, re, asyncio, logging
from pathlib import Path
backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
from dotenv import load_dotenv
load_dotenv()
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool
from sqlalchemy import select, update, text

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL, echo=False, poolclass=NullPool,
    connect_args={"statement_cache_size": 0, "timeout": 60, "command_timeout": 120, "server_settings": {"jit": "off"}})
Session = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

# Clean example blocks for Cloud Task Scheduler
CLEAN_EXAMPLES = """**Examples:**

```text
Input:
5
3 4
2 2
1 3
4 3
2 5
Output:
7
Explanation:
Sort jobs by deadline: (2,2), (1,3), (4,3), (3,4), (2,5)
Step 1: Process (2,2): time=2, heap=[2]. 2<=2, OK.
Step 2: Process (1,3): time=3, heap=[2,1]. 3<=3, OK.
Step 3: Process (4,3): time=7, heap=[4,2,1]. 7>3, drop max=4 (penalty+=4). time=3, heap=[2,1].
Step 4: Process (3,4): time=6, heap=[3,2,1]. 6>4, drop max=3 (penalty+=3). time=3, heap=[2,1].
Step 5: Process (2,5): time=5, heap=[2,2,1]. 5<=5, OK.
Total penalty = 4 + 3 = 7.
```

```text
Input:
3
1 2
2 2
3 1
Output:
3
Explanation:
Sort by deadline: (3,1), (1,2), (2,2).
Step 1: Process (3,1): time=3, heap=[3]. 3>1, drop max=3 (penalty+=3). time=0, heap=[].
Step 2: Process (1,2): time=1, heap=[1]. 1<=2, OK.
Step 3: Process (2,2): time=3, heap=[2,1]. 3>2, drop max=2 (penalty+=2). time=1, heap=[1].
Total penalty = 3 + 2 = 5.
```

**Note:** The examples above demonstrate the greedy max-heap scheduling algorithm."""

async def main():
    from app.models.evaluation import PremiumCodingChallenge
    async with Session() as session:
        await session.execute(text("SELECT 1"))
        result = await session.execute(
            select(PremiumCodingChallenge).where(PremiumCodingChallenge.title.ilike('%Cloud Task%'))
        )
        c = result.scalars().first()
        if not c:
            logging.error("Cloud Task Scheduler not found!")
            return
        
        desc = c.description
        # Replace everything from "**Examples:**" onwards
        marker = "**Examples:**"
        idx = desc.find(marker)
        if idx == -1:
            logging.error("Could not find **Examples:** marker")
            return
        
        new_desc = desc[:idx].rstrip() + "\n\n" + CLEAN_EXAMPLES
        
        await session.execute(
            update(PremiumCodingChallenge)
            .where(PremiumCodingChallenge.id == c.id)
            .values(description=new_desc)
        )
        await session.commit()
        logging.info("✅ Cloud Task Scheduler examples rewritten cleanly!")

if __name__ == "__main__":
    asyncio.run(main())
