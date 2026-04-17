import asyncio
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.core.security import create_access_token

async def test():
    # Provide a placeholder realistic user ID
    token = create_access_token("6081d780-cc0e-4786-bf30-8db65c7d801f", "student", "497d3986-11b7-4fb7-a084-fae130580dbf")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/results/semester/6081d780-cc0e-4786-bf30-8db65c7d801f", headers={"Authorization": f"Bearer {token}"})
        print(f"Status: {res.status_code}")
        print(f"Response: {res.text[:300]}")

if __name__ == "__main__":
    asyncio.run(test())
