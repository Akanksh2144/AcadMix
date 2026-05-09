import asyncio
from app.routers.accreditation import generate_accreditation_report
from app.models.accreditation import AccreditationReportJob
from database import admin_session_ctx
from sqlalchemy import text
from fastapi import Request
from unittest.mock import MagicMock

class MockApp:
    def __init__(self):
        self.state = MagicMock()
        self.state.arq_redis = None

class MockRequest:
    def __init__(self):
        self.app = MockApp()

class MockReqBody:
    report_type = "NAAC"
    academic_year = "2023-2024"

async def test_endpoint():
    req = MockRequest()
    body = MockReqBody()
    user = {"id": "STF-0002"}
    
    async with admin_session_ctx() as db:
        res = await generate_accreditation_report(
            req=body,
            college_id="AITS",
            user=user,
            session=db,
            request=req
        )
        print("Endpoint Response:", res)
        job_id = res["job_id"]
        
        # Check DB
        res = await db.execute(text(f"SELECT id, status, arq_job_id FROM accreditation_report_jobs WHERE id = '{job_id}'"))
        row = res.fetchone()
        print("DB Job:", row)

if __name__ == "__main__":
    asyncio.run(test_endpoint())
