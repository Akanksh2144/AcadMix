import asyncio
from database import admin_session_ctx
from sqlalchemy import text

async def clear_pending():
    async with admin_session_ctx() as db:
        await db.execute(text("DELETE FROM accreditation_report_jobs WHERE status='PENDING'"))
        await db.commit()
        print("Deleted PENDING jobs")

if __name__ == "__main__":
    asyncio.run(clear_pending())
