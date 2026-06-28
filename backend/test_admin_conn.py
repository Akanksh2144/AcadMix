import os
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from sqlalchemy.pool import NullPool
from dotenv import load_dotenv

load_dotenv()
d = os.getenv('DATABASE_URL')
e = create_async_engine(
    d,
    poolclass=NullPool,
    connect_args={
        "statement_cache_size": 0,
        "timeout": 30,
        "command_timeout": 60,
    }
)

async def test():
    print("Testing connection with NullPool...")
    try:
        async with e.connect() as conn:
            res = await conn.execute(text("SELECT 1"))
            print("NullPool Connection SUCCESSFUL! Response:", res.scalar())
    except Exception as err:
        print("NullPool Connection failed:", err)

asyncio.run(test())
