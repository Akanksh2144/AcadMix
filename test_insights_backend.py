import asyncio
import httpx
import json

async def main():
    async with httpx.AsyncClient() as client:
        # First login
        res = await client.post("http://127.0.0.1:8000/api/auth/login", json={
            "college_id": "STF-0002",
            "password": "faculty123"
        })
        print("Login:", res.status_code)
        token = res.json()["data"]["access_token"]
        
        # Now query insights python backend directly
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "message": "Show me all 3rd year CSE students with less than 75% attendance who also have an active supplementary exam.",
            "session_history": [],
            "active_college_id": None
        }
        
        res2 = await client.post("http://127.0.0.1:8000/api/insights/query", json=payload, headers=headers, timeout=300)
        print("Query:", res2.status_code)
        try:
            print(json.dumps(res2.json(), indent=2))
        except Exception:
            print(res2.text)

if __name__ == "__main__":
    asyncio.run(main())
