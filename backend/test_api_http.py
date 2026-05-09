import asyncio
import httpx
from database import admin_session_ctx
from app.core.security import create_access_token
from app.models import User

async def run_test():
    async with admin_session_ctx() as db:
        pass
        
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.get("http://localhost:8000/api/health")
        print("HEALTH:", res.status_code)

if __name__ == "__main__":
    asyncio.run(run_test())
