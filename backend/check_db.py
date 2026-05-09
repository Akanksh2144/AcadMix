import asyncio
from database import admin_session_ctx
from sqlalchemy import text

async def main():
    async with admin_session_ctx() as session:
        result = await session.execute(text("SELECT id, status, report_url, error_log FROM accreditation_report_jobs ORDER BY created_at DESC LIMIT 1"))
        for row in result:
            print(dict(row._mapping))

if __name__ == "__main__":
    asyncio.run(main())
