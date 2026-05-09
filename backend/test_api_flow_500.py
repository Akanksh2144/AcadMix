import asyncio
import httpx
from datetime import datetime

async def test_flow():
    async with httpx.AsyncClient() as client:
        # 1. Login
        login_res = await client.post(
            "http://127.0.0.1:8000/api/v1/auth/login",
            json={"college_id": "STF-0002", "password": "faculty123"},
            headers={"Host": "aits.localhost:8000"}
        )
        print("Login status:", login_res.status_code)
        if login_res.status_code != 200:
            print("Login failed:", login_res.text)
            return
            
        token = login_res.json()["data"]["access_token"]
        headers = {"Authorization": f"Bearer {token}", "Host": "aits.localhost:8000"}
        print("Logged in!")

        # 2. Generate Report
        gen_res = await client.post(
            "http://127.0.0.1:8000/api/v1/accreditation/reports/generate",
            json={"report_type": "NAAC", "academic_year": "2023-2024"},
            headers=headers
        )
        print("Generate status:", gen_res.status_code)
        print("Generate body:", gen_res.text)

if __name__ == "__main__":
    asyncio.run(test_flow())
