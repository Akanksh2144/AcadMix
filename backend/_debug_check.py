import asyncio, sys
sys.path.insert(0, '.')

async def main():
    from database import AsyncSessionLocal
    from sqlalchemy.sql import text
    async with AsyncSessionLocal() as session:
        # Check what roles exist and counts
        r = await session.execute(text(
            "SELECT role, college_id, COUNT(*) FROM users WHERE is_deleted = false GROUP BY role, college_id ORDER BY COUNT(*) DESC LIMIT 15"
        ))
        print("Role distribution:")
        for row in r.fetchall():
            print(f"  role='{row[0]}', college_id='{row[1]}', count={row[2]}")

asyncio.run(main())
