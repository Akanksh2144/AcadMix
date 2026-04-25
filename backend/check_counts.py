import asyncio, sys, os
sys.path.insert(0, ".")
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from sqlalchemy.pool import NullPool
from app.core.config import settings

async def check():
    engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool,
        connect_args={"statement_cache_size": 0, "command_timeout": 30})
    SM = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    tables = [
        "colleges", "departments", "sections", "users", "user_profiles",
        "courses", "program_outcomes", "program_specific_outcomes",
        "course_outcomes", "co_po_mappings", "co_pso_mappings",
        "semester_grades", "hostels", "rooms", "student_fee_invoices",
        "bus_routes", "transport_enrollments", "beds", "allocations",
        "scholarships", "scholarship_applications", "mentor_assignments",
    ]

    async with SM() as db:
        total = 0
        print("TABLE ROW COUNTS:", flush=True)
        for t in tables:
            try:
                r = await db.execute(text(f"SELECT COUNT(*) FROM {t}"))
                count = r.scalar()
                print(f"  {t}: {count}", flush=True)
                total += count
            except Exception as e:
                print(f"  {t}: ERROR - {e}", flush=True)
        print(f"\n  TOTAL: {total}", flush=True)

    await engine.dispose()

asyncio.run(check())
