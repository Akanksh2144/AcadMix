import asyncio
import httpx
from app.core.config import settings

async def test_api():
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        # Login
        data = {"college_id": "STF-0002", "password": "faculty123"}
        res = await client.post("/api/v1/auth/login", json=data, headers={"Host": "aits.localhost:8000"})
        print("Login status:", res.status_code)
        
        token = res.json().get("data", {}).get("access_token") if res.status_code == 200 else None
        if not token:
            print("Login failed:", res.text)
            return
            
        print("Logged in!")
        # Generate
        headers = {"Authorization": f"Bearer {token}", "Host": "aits.localhost:8000"}
        req_data = {"report_type": "NAAC", "academic_year": "2023-2024"}
        res = await client.post("/api/v1/accreditation/reports/generate", json=req_data, headers=headers)
        print("Generate response:", res.status_code, res.text)

if __name__ == "__main__":
    asyncio.run(test_api())
