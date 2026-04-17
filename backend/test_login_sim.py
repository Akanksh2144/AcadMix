import asyncio
import httpx

async def test():
    async with httpx.AsyncClient() as client:
        res = await client.post(
            "http://localhost:8000/api/auth/login",
            json={"college_id": "student@gnitc.ac.in", "password": "password"},
            headers={"x-tenant": "gnitc", "origin": "http://localhost:3000"}
        )
        print("GNITC Tenant Response:", res.status_code, res.text)
        
        res_no_tenant = await client.post(
            "http://localhost:8000/api/auth/login",
            json={"college_id": "student@gnitc.ac.in", "password": "password"},
            headers={"origin": "http://localhost:3000"}
        )
        print("NO TENANT Response:", res_no_tenant.status_code, res_no_tenant.text)

if __name__ == "__main__":
    asyncio.run(test())
