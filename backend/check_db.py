import asyncio
from database import AsyncSessionLocal
from app.models.core import User
from sqlalchemy import select
from sqlalchemy import text

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).where(User.enrollment_no == '22A81A050003'))
        user = res.scalar_one_or_none()
        if user:
            print('User found:', user.id)
            res2 = await db.execute(text("SELECT * FROM transport_enrollments WHERE student_id = :id"), {"id": user.id})
            rows = res2.fetchall()
            print('Enrollments:', rows)
            
            res3 = await db.execute(text("SELECT * FROM fee_payments WHERE student_id = :id"), {"id": user.id})
            rows3 = res3.fetchall()
            print('Fees:', rows3)

asyncio.run(main())
