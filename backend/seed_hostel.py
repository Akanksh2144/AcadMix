import asyncio
import os
import sys
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession

# Ensure app path traverses from backend root
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from database import AsyncSessionLocal
from app.models.core import College
from app.services.hostel_service import HostelService

async def seed_hostel_layout():
    async with AsyncSessionLocal() as db:
        try:
            # Get the first college
            result = await db.execute(select(College))
            college = result.scalars().first()
            college_id = str(college.id) if college else None
            
            if not college_id:
                print("No college found in the database. Creating a default college for testing.")
                import uuid
                college_id = str(uuid.uuid4())

            service = HostelService(db)

            # 1. Create a Premium 2-Seater Template
            print("Creating Premium Template...")
            premium_template = await service.create_template(college_id, {
                "name": "Premium 2-Seater AC",
                "total_capacity": 2,
                "grid_rows": 2,
                "grid_cols": 2,
                "beds": [
                    {"identifier": "A", "row": 0, "col": 0, "category": "Window", "is_premium": True, "base_fee": 1500},
                    {"identifier": "B", "row": 0, "col": 1, "category": "Window", "is_premium": True, "base_fee": 1500}
                ],
                "meta_data": {
                    "room_decorators": {
                        "window_wall": "top",
                        "door_position": "bottom",
                        "bathroom_position": "left"
                    }
                }
            })
            
            # 2. Create a Standard 4-Seater Template
            print("Creating Standard Template...")
            standard_template = await service.create_template(college_id, {
                "name": "Standard 4-Seater Non-AC",
                "total_capacity": 4,
                "grid_rows": 3,
                "grid_cols": 3,
                "beds": [
                    {"identifier": "1", "row": 0, "col": 0, "category": "Standard", "is_premium": False, "base_fee": 0},
                    {"identifier": "2", "row": 0, "col": 2, "category": "Standard", "is_premium": False, "base_fee": 0},
                    {"identifier": "3", "row": 2, "col": 0, "category": "Standard", "is_premium": False, "base_fee": 0},
                    {"identifier": "4", "row": 2, "col": 2, "category": "Standard", "is_premium": False, "base_fee": 0}
                ],
                "meta_data": {
                    "room_decorators": {
                        "window_wall": "top",
                        "door_position": "right"
                    }
                }
            })
            
            # 3. Create a Hostel Block
            print("Creating Alpha Block...")
            hostel = await service.create_hostel(college_id, {
                "name": "Alpha Block (Demo)",
                "gender_type": "coed",
                "total_floors": 2,
                "warden_id": None,
                "meta_data": {
                    "floor_layout": {
                        "1": {
                            "north": ["101", "102"],
                            "south": ["103", "104"]
                        },
                        "2": {
                            "north": ["201", "202"],
                            "south": ["203", "204"]
                        }
                    }
                }
            })
            
            # 4. Add Rooms to Floor 1
            print("Adding rooms to Floor 1...")
            # 2 premium rooms: 101, 102
            await service.bulk_create_rooms(hostel["id"], college_id, {
                "template_id": premium_template["id"],
                "room_number_prefix": "",
                "floor_start": 1,
                "floor_end": 1,
                "rooms_per_floor": 2
            })
            # 2 standard rooms: 103, 104. Wait, bulk create uses 1..rooms_per_floor. 
            # So creating another batch with prefix="" floor 1 rooms 1-2 creates 101, 102.
            # I will just write a custom insert since bulk_create_rooms is too rigid for different templates on the same floor.
            
            from app.models.hostel import Room, Bed
            standard_beds = [
                {"identifier": "1", "row": 0, "col": 0, "category": "Standard", "is_premium": False, "base_fee": 0},
                {"identifier": "2", "row": 0, "col": 2, "category": "Standard", "is_premium": False, "base_fee": 0},
                {"identifier": "3", "row": 2, "col": 0, "category": "Standard", "is_premium": False, "base_fee": 0},
                {"identifier": "4", "row": 2, "col": 2, "category": "Standard", "is_premium": False, "base_fee": 0}
            ]
            for r_num in ["103", "104"]:
                room = Room(college_id=college_id, hostel_id=hostel["id"], template_id=standard_template["id"], room_number=r_num, floor=1, capacity=4, meta_data={"ac": False})
                db.add(room)
                await db.flush()
                for bed_def in standard_beds:
                    bed = Bed(college_id=college_id, room_id=room.id, bed_identifier=bed_def["identifier"], grid_row=bed_def["row"], grid_col=bed_def["col"], category=bed_def["category"], is_premium=bed_def["is_premium"], selection_fee=bed_def["base_fee"], status="AVAILABLE")
                    db.add(bed)
            
            # 5. Add Rooms to Floor 2
            print("Adding rooms to Floor 2...")
            await service.bulk_create_rooms(hostel["id"], college_id, {
                "template_id": standard_template["id"],
                "room_number_prefix": "",
                "floor_start": 2,
                "floor_end": 2,
                "rooms_per_floor": 4
            })

            
            await db.commit()
            print("✅ Sample Hostel layouts perfectly seeded!")

        except Exception as e:
            await db.rollback()
            print(f"Error seeding data: {e}")

if __name__ == "__main__":
    asyncio.run(seed_hostel_layout())
