from sqlalchemy import select
import asyncio
from database import AsyncSessionLocal
import models

async def main():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(models.Placement))
        placements = result.scalars().all()
        print(f"Total placements: {len(placements)}")
        if len(placements) > 0:
            for p in placements:
                print(f"ID: {p.id}, Company: {p.company}")

asyncio.run(main())
