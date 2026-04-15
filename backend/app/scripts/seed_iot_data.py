"""
Seed Script: Populate test bus routes and vending machines
Run with: python -m app.scripts.seed_iot_data
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


async def main():
    from database import AsyncSessionLocal
    from sqlalchemy.future import select
    from sqlalchemy import func
    from app import models

    async with AsyncSessionLocal() as session:
        # Get first college for seeding
        result = await session.execute(select(models.College).limit(1))
        college = result.scalars().first()
        if not college:
            print("❌ No colleges found. Create a college first.")
            return

        college_id = college.id
        print(f"🏫 Seeding IoT data for college: {college.name} ({college_id})")

        # Check if routes already exist
        existing = await session.scalar(
            select(func.count(models.BusRoute.id)).where(
                models.BusRoute.college_id == college_id
            )
        )
        if existing and existing > 0:
            print(f"ℹ️  {existing} bus routes already exist. Skipping seed.")
        else:
            # ─── Bus Routes ──────────────────────────────────────────────
            routes = [
                models.BusRoute(
                    college_id=college_id,
                    route_number="R-1",
                    route_name="Kukatpally – Campus",
                    departure_time="07:15",
                    return_time="17:00",
                    stops=[
                        {"name": "Kukatpally Bus Stop", "order": 1, "lat": 17.4948, "lng": 78.3996, "geofence_radius_m": 200},
                        {"name": "KPHB Colony", "order": 2, "lat": 17.4876, "lng": 78.3953, "geofence_radius_m": 200},
                        {"name": "JNTU Gate", "order": 3, "lat": 17.4935, "lng": 78.3910, "geofence_radius_m": 150},
                        {"name": "Miyapur Cross", "order": 4, "lat": 17.4963, "lng": 78.3578, "geofence_radius_m": 200},
                        {"name": "Campus Main Gate", "order": 5, "lat": 17.5200, "lng": 78.3400, "geofence_radius_m": 300},
                    ],
                ),
                models.BusRoute(
                    college_id=college_id,
                    route_number="R-2",
                    route_name="Dilsukhnagar – Campus",
                    departure_time="06:45",
                    return_time="17:00",
                    stops=[
                        {"name": "Dilsukhnagar Bus Station", "order": 1, "lat": 17.3688, "lng": 78.5247, "geofence_radius_m": 250},
                        {"name": "Kothapet Ring Road", "order": 2, "lat": 17.3653, "lng": 78.5107, "geofence_radius_m": 200},
                        {"name": "LB Nagar Circle", "order": 3, "lat": 17.3501, "lng": 78.5526, "geofence_radius_m": 200},
                        {"name": "Hayathnagar", "order": 4, "lat": 17.3342, "lng": 78.5841, "geofence_radius_m": 200},
                        {"name": "Campus Main Gate", "order": 5, "lat": 17.5200, "lng": 78.3400, "geofence_radius_m": 300},
                    ],
                ),
                models.BusRoute(
                    college_id=college_id,
                    route_number="R-3",
                    route_name="Secunderabad – Campus",
                    departure_time="07:00",
                    return_time="17:00",
                    stops=[
                        {"name": "Secunderabad Station", "order": 1, "lat": 17.4344, "lng": 78.5013, "geofence_radius_m": 300},
                        {"name": "Tarnaka", "order": 2, "lat": 17.4276, "lng": 78.5246, "geofence_radius_m": 200},
                        {"name": "Malkajgiri", "order": 3, "lat": 17.4497, "lng": 78.5190, "geofence_radius_m": 200},
                        {"name": "AS Rao Nagar", "order": 4, "lat": 17.4600, "lng": 78.5500, "geofence_radius_m": 200},
                        {"name": "Campus East Gate", "order": 5, "lat": 17.5180, "lng": 78.3420, "geofence_radius_m": 300},
                    ],
                ),
                models.BusRoute(
                    college_id=college_id,
                    route_number="R-4",
                    route_name="Ameerpet – Campus",
                    departure_time="07:30",
                    return_time="17:15",
                    stops=[
                        {"name": "Ameerpet Metro", "order": 1, "lat": 17.4375, "lng": 78.4483, "geofence_radius_m": 200},
                        {"name": "SR Nagar", "order": 2, "lat": 17.4403, "lng": 78.4376, "geofence_radius_m": 200},
                        {"name": "ESI Hospital", "order": 3, "lat": 17.4481, "lng": 78.4270, "geofence_radius_m": 150},
                        {"name": "Erragadda", "order": 4, "lat": 17.4558, "lng": 78.4221, "geofence_radius_m": 200},
                        {"name": "Bhel X Road", "order": 5, "lat": 17.4700, "lng": 78.3700, "geofence_radius_m": 200},
                        {"name": "Campus Main Gate", "order": 6, "lat": 17.5200, "lng": 78.3400, "geofence_radius_m": 300},
                    ],
                ),
                models.BusRoute(
                    college_id=college_id,
                    route_number="R-5",
                    route_name="Mehdipatnam – Campus (Girls)",
                    departure_time="07:00",
                    return_time="16:45",
                    stops=[
                        {"name": "Mehdipatnam Bus Stop", "order": 1, "lat": 17.3950, "lng": 78.4420, "geofence_radius_m": 250},
                        {"name": "Tolichowki", "order": 2, "lat": 17.4016, "lng": 78.4208, "geofence_radius_m": 200},
                        {"name": "Shaikpet", "order": 3, "lat": 17.4159, "lng": 78.4180, "geofence_radius_m": 200},
                        {"name": "Gachibowli Junction", "order": 4, "lat": 17.4401, "lng": 78.3489, "geofence_radius_m": 200},
                        {"name": "Campus Main Gate", "order": 5, "lat": 17.5200, "lng": 78.3400, "geofence_radius_m": 300},
                    ],
                ),
            ]

            for r in routes:
                session.add(r)

            print(f"🚌 Created {len(routes)} bus routes")

        # ─── Vending Machines ────────────────────────────────────────────
        existing_vm = await session.scalar(
            select(func.count(models.VendingMachine.id)).where(
                models.VendingMachine.college_id == college_id
            )
        )
        if existing_vm and existing_vm > 0:
            print(f"ℹ️  {existing_vm} vending machines already exist. Skipping seed.")
        else:
            machines = [
                models.VendingMachine(
                    college_id=college_id,
                    machine_code="VM-CS-01",
                    location="CS Block Ground Floor",
                    status="online",
                    inventory=[
                        {"item": "Tea", "price": 10, "qty": 45, "max_qty": 50},
                        {"item": "Coffee", "price": 15, "qty": 38, "max_qty": 50},
                        {"item": "Biscuits", "price": 20, "qty": 22, "max_qty": 30},
                        {"item": "Chips", "price": 20, "qty": 15, "max_qty": 30},
                        {"item": "Water Bottle", "price": 20, "qty": 28, "max_qty": 40},
                    ],
                ),
                models.VendingMachine(
                    college_id=college_id,
                    machine_code="VM-ECE-01",
                    location="ECE Block First Floor",
                    status="online",
                    inventory=[
                        {"item": "Tea", "price": 10, "qty": 50, "max_qty": 50},
                        {"item": "Coffee", "price": 15, "qty": 42, "max_qty": 50},
                        {"item": "Juice", "price": 25, "qty": 18, "max_qty": 25},
                        {"item": "Samosa", "price": 15, "qty": 10, "max_qty": 20},
                    ],
                ),
                models.VendingMachine(
                    college_id=college_id,
                    machine_code="VM-LIB-01",
                    location="Central Library Entrance",
                    status="online",
                    inventory=[
                        {"item": "Coffee", "price": 15, "qty": 30, "max_qty": 50},
                        {"item": "Green Tea", "price": 15, "qty": 25, "max_qty": 30},
                        {"item": "Energy Bar", "price": 30, "qty": 12, "max_qty": 20},
                        {"item": "Water Bottle", "price": 20, "qty": 35, "max_qty": 40},
                    ],
                ),
                models.VendingMachine(
                    college_id=college_id,
                    machine_code="VM-MESS-01",
                    location="Central Mess Counter",
                    status="online",
                    inventory=[
                        {"item": "Breakfast Coupon", "price": 30, "qty": 200, "max_qty": 200},
                        {"item": "Lunch Coupon", "price": 50, "qty": 200, "max_qty": 200},
                        {"item": "Dinner Coupon", "price": 45, "qty": 200, "max_qty": 200},
                        {"item": "Snack Coupon", "price": 20, "qty": 100, "max_qty": 100},
                    ],
                ),
                models.VendingMachine(
                    college_id=college_id,
                    machine_code="VM-HOSTEL-01",
                    location="Boys Hostel Common Area",
                    status="online",
                    inventory=[
                        {"item": "Instant Noodles", "price": 25, "qty": 40, "max_qty": 50},
                        {"item": "Cold Coffee", "price": 30, "qty": 20, "max_qty": 30},
                        {"item": "Chips", "price": 20, "qty": 25, "max_qty": 30},
                        {"item": "Chocolate", "price": 20, "qty": 30, "max_qty": 40},
                        {"item": "Water Bottle", "price": 20, "qty": 45, "max_qty": 50},
                    ],
                ),
            ]

            for m in machines:
                session.add(m)

            print(f"🤖 Created {len(machines)} vending machines")

        await session.commit()
        print("✅ IoT seed data committed successfully!")


if __name__ == "__main__":
    asyncio.run(main())
