import asyncio
from database import admin_session_ctx
from sqlalchemy import text

async def test():
    async with admin_session_ctx() as db:
        res = await db.execute(text("SELECT is_nullable FROM information_schema.columns WHERE table_name = 'accreditation_report_jobs' AND column_name = 'created_by'"))
        print(res.scalar())

if __name__ == "__main__":
    asyncio.run(test())
