import asyncio
from database import admin_session_ctx
from sqlalchemy import text

async def test():
    async with admin_session_ctx() as db:
        res = await db.execute(text("SELECT id, college_id, status FROM accreditation_report_jobs"))
        print(res.fetchall())

if __name__ == "__main__":
    asyncio.run(test())
