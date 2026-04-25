import asyncio, sys
sys.path.insert(0, '.')

# Simulate the full FastAPI login route path
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path('.') / '.env')

import traceback

async def test():
    from database import AdminSessionLocal, get_db
    from app.services.auth_service import AuthService
    from app.core.security import redis_client
    
    print(f"redis_client is: {redis_client}")
    
    async with AdminSessionLocal() as s:
        svc = AuthService(s)
        try:
            result = await svc.login("admin@acadmix.org", "AcadMix@Admin2026", None)
            print(f"LOGIN OK: role={result['role']}, token_len={len(result.get('access_token',''))}")
            
            # Now test the cookie-set part (which happens in the route)
            print("SUCCESS — issue is probably in the HTTP layer middleware or cookie setting")
            
            # Test profile access (which the login route does)
            print(f"profile_data keys: {[k for k in result.keys() if k not in ('access_token', '_refresh_token')]}")
            
        except Exception as e:
            print(f"FAILED: {type(e).__name__}: {e}")
            traceback.print_exc()

asyncio.run(test())
