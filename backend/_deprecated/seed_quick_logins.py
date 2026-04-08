import asyncio
from database import AsyncSessionLocal
from sqlalchemy import select
import models
from server import hash_password

async def seed_users():
    async with AsyncSessionLocal() as session:
        # Get first college
        college_res = await session.execute(select(models.College).limit(1))
        college = college_res.scalars().first()
        if not college:
            print("No college found in DB")
            return
        cid = college.id
        
        # N001
        res = await session.execute(select(models.User).where(models.User.email == "N001"))
        nodal = res.scalars().first()
        if not nodal:
            nodal = models.User(
                email="N001",
                password_hash=hash_password("nodal123"),
                role="nodal_officer",
                college_id=cid,
                is_active=True
            )
            session.add(nodal)
        else:
            nodal.password_hash = hash_password("nodal123")

        # TPO001
        res2 = await session.execute(select(models.User).where(models.User.email == "TPO001"))
        tpo = res2.scalars().first()
        if not tpo:
            tpo = models.User(
                email="TPO001",
                password_hash=hash_password("tpo123"),
                role="tp_officer",
                college_id=cid,
                is_active=True
            )
            session.add(tpo)
        else:
            tpo.password_hash = hash_password("tpo123")

        await session.commit()
        print("Done!")

asyncio.run(seed_users())
