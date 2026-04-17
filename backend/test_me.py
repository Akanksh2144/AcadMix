import httpx
import asyncio

async def test():
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000", timeout=10.0) as client:
        print("Logging in...")
        r = await client.post("/api/auth/login", json={"college_id": "22WJ8A6745", "password": "22WJ8A6745"}, headers={"Origin": "http://localhost:5173", "Content-Type": "application/json"})
        token = r.json()["data"]["access_token"]
        print("Logged in, token:", token[:10], "...")
        
        print("Fetching /api/auth/me...")
        r2 = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        print(f"/me: {r2.status_code} {r2.text}")

        print("Fetching /api/dashboard/student...")
        r3 = await client.get("/api/dashboard/student", headers={"Authorization": f"Bearer {token}"})
        print(f"/dashboard/student: {r3.status_code} {r3.text}")

if __name__ == "__main__":
    asyncio.run(test())
