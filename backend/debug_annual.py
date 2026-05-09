import asyncio
from database import admin_session_ctx
from app.services.principal_service import PrincipalService

async def debug_annual():
    try:
        async with admin_session_ctx() as db:
            svc = PrincipalService(db)
            res = await svc.get_annual_consolidation(
                {"college_id": "aits-hyd-001", "id": "STF-0002", "role": "principal"}, 
                "2023-2024"
            )
            print("SUCCESS:", list(res.keys()))
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_annual())
