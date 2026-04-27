import asyncio
from database import AsyncSessionLocal
from app.models.core import User, UserProfile
from sqlalchemy import select, text

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).join(UserProfile).where(UserProfile.roll_number == '22A81A050003'))
        user = res.scalar_one_or_none()
        if user:
            print('User found:', user.id)
            # Delete transport enrollment
            await db.execute(text("DELETE FROM transport_enrollments WHERE student_id = :id"), {"id": user.id})
            await db.commit()
            print('Deleted transport enrollment for Pavan Kapoor.')
        else:
            print('User not found via roll_number. Let us try email.')
            res = await db.execute(select(User).where(User.name.ilike('%Pavan%')))
            users = res.scalars().all()
            for u in users:
                print('Found user:', u.name, u.email, u.id)
                await db.execute(text("DELETE FROM transport_enrollments WHERE student_id = :id"), {"id": u.id})
            await db.commit()
            print('Deleted transport enrollment for any Pavan.')

asyncio.run(main())
