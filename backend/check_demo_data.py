import asyncio
from database import admin_session_ctx
from sqlalchemy import text

async def check_data():
    async with admin_session_ctx() as db:
        res = await db.execute(text("SELECT id FROM colleges;"))
        print("College IDs:", res.fetchall())

if __name__ == "__main__":
    asyncio.run(check_data())
