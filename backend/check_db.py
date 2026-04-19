import asyncio
from database import engine
from sqlalchemy import text

async def main():
    async with engine.begin() as conn:
        res = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'student_resumes';"))
        print([row[0] for row in res])
    await engine.dispose()

asyncio.run(main())
