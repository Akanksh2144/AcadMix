import asyncio
from database import admin_session_ctx
from app.models.core import User
from sqlalchemy import select

async def get_nodals():
    async with admin_session_ctx() as db:
        res = await db.execute(select(User).where(User.role == 'nodal_officer'))
        users = res.scalars().all()
        for u in users:
            print(f"ID: {u.id}, Name: {u.name}, Email: {u.email}")

if __name__ == "__main__":
    asyncio.run(get_nodals())
