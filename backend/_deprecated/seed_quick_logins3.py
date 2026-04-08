from dotenv import load_dotenv
load_dotenv()
import asyncio
from database import AsyncSessionLocal
from sqlalchemy import select
import models
from server import hash_password

async def seed_users():
    try:
        async with AsyncSessionLocal() as session:
            # Get first college
            college_res = await session.execute(select(models.College).limit(1))
            college = college_res.scalars().first()
            if not college:
                print("No college found in DB")
                return
            cid = college.id
            print(f"Using College ID: {cid}")
            
            # N001
            res = await session.execute(select(models.User).where(models.User.email == "N001"))
            nodal = res.scalars().first()
            if not nodal:
                nodal = models.User(
                    email="N001",
                    password_hash=hash_password("nodal123"),
                    role="nodal_officer",
                    profile_data={"college_id": "N001"},
                    college_id=cid
                )
                session.add(nodal)
                print("Added nodal")
            else:
                nodal.password_hash = hash_password("nodal123")
                nodal.profile_data = {"college_id": "N001"}
                print("Updated nodal")

            # TPO001
            res2 = await session.execute(select(models.User).where(models.User.email == "TPO001"))
            tpo = res2.scalars().first()
            if not tpo:
                tpo = models.User(
                    email="TPO001",
                    password_hash=hash_password("tpo123"),
                    role="tp_officer",
                    profile_data={"college_id": "TPO001"},
                    college_id=cid
                )
                session.add(tpo)
                print("Added TP")
            else:
                tpo.password_hash = hash_password("tpo123")
                tpo.profile_data = {"college_id": "TPO001"}
                print("Updated TP")

            await session.commit()
            print("Done seeding!")
    except Exception as e:
        print(f"Exception: {e}")

asyncio.run(seed_users())
