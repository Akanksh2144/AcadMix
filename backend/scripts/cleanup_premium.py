import asyncio
import sys
from pathlib import Path
backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from database import admin_session_ctx
from app.models.evaluation import PremiumCodingChallenge
from sqlalchemy import delete

async def main():
    async with admin_session_ctx() as session:
        await session.execute(delete(PremiumCodingChallenge))
        await session.commit()
        print("Truncated all premium problems.")

if __name__ == "__main__":
    asyncio.run(main())
