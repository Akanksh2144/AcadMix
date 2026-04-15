import asyncio
from database import AsyncSessionLocal
from sqlalchemy import text

async def main():
    async with AsyncSessionLocal() as s:
        async with s.begin():
            # Update parent phone to real WhatsApp number
            await s.execute(text(
                "UPDATE user_profiles SET phone = '917680979214' "
                "WHERE user_id = 'f42b0873-2cf1-44f5-ab09-5978082fffba'"
            ))
            print("Updated parent phone to 917680979214")

asyncio.run(main())
