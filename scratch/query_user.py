import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

load_dotenv(dotenv_path=".env")
DATABASE_URL = os.getenv("DATABASE_URL")

async def main():
    engine = create_async_engine(DATABASE_URL, connect_args={"statement_cache_size": 0})
    async with engine.connect() as conn:
        q = """
        INSERT INTO faculty_assignments (id, college_id, teacher_id, subject_code, subject_name, department, batch, section, semester, academic_year, credits, hours_per_week, is_lab, is_deleted)
        VALUES
        ('FA-stf0007-1', 'aits-hyd-001', 'STF-0007', '22CS1102', 'Programming for Problem Solving Lab', 'CSE', '2025', 'A', 1, '2025-2026', 2, 3, true, false),
        ('FA-stf0007-2', 'aits-hyd-001', 'STF-0007', '22CS1102', 'Programming for Problem Solving Lab', 'CSE', '2025', 'B', 1, '2025-2026', 2, 3, true, false),
        ('FA-stf0007-3', 'aits-hyd-001', 'STF-0007', '22PH1102', 'Applied Physics Lab', 'CSE', '2025', 'A', 1, '2025-2026', 2, 3, true, false)
        ON CONFLICT (id) DO NOTHING
        """
        await conn.execute(text(q))
        await conn.commit()
        print("INSERTED STF-0007 ASSIGNMENTS!")
        
        # Check what roles exist in the users table
        res = await conn.execute(text("SELECT role, count(*) FROM users GROUP BY role"))
        print("ROLE COUNTS:", res.fetchall())
        
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
