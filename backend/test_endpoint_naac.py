import asyncio
from database import admin_session_ctx
from app.routers.accreditation import generate_accreditation_report, ReportGenerateReq

class MockRequest:
    def __init__(self):
        class AppState:
            pass
        self.app = type('MockApp', (), {'state': AppState()})()
        
async def test_endpoint():
    async with admin_session_ctx() as db:
        req = ReportGenerateReq(report_type="NAAC", academic_year="2023-2024")
        user = {"college_id": "AITS", "user_id": "PRN-0012", "role": "principal"}
        request = MockRequest()
        
        try:
            res = await generate_accreditation_report(req, request, user, db)
            print("RESULT:", res)
        except Exception as e:
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_endpoint())
