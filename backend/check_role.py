import asyncio
from sqlalchemy.future import select
from sqlalchemy import text

from database import AdminSessionLocal

async def check():
    async with AdminSessionLocal() as session:
        # Check if role exists
        res = await session.execute(text("SELECT rolname FROM pg_roles WHERE rolname='authenticated'"))
        role = res.scalar()
        print(f"Role 'authenticated' exists: {bool(role)}")
        
        if role:
            # Check grants
            res2 = await session.execute(text("SELECT table_schema, table_name, privilege_type FROM information_schema.role_table_grants WHERE grantee='authenticated'"))
            grants = res2.fetchall()
            print(f"Grants count for 'authenticated': {len(grants)}")
            for g in grants[:5]:
                print(f" - {g[0]}.{g[1]}: {g[2]}")

if __name__ == "__main__":
    asyncio.run(check())
