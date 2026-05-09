import asyncio
from database import admin_session_ctx
from app.services.report_engine import ReportEngineService

async def test_generate():
    async with admin_session_ctx() as db:
        svc = ReportEngineService(db)
        # Attempt to generate NAAC report directly to catch exceptions
        res = await svc.generate_naac_ssr("aits-hyd-001", "2023-2024")
        print("RESULT:", res)

if __name__ == "__main__":
    asyncio.run(test_generate())
