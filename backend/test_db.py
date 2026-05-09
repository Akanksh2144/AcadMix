import asyncio
from sqlalchemy.future import select
from database import admin_session_ctx
from app.models.core import UserProfile

async def run():
    async with admin_session_ctx() as db:
        res = await db.execute(select(UserProfile.id).limit(1))
        print("Users:", res.scalars().all())

if __name__ == "__main__":
    asyncio.run(run())
