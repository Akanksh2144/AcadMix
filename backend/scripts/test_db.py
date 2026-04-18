import asyncio
import sys
import os
from pathlib import Path

backend_dir = str(Path(__file__).resolve().parent.parent)
sys.path.insert(0, backend_dir)

from database import admin_session_ctx
from sqlalchemy import text

async def func():
    async with admin_session_ctx() as s:
        res = await s.execute(text('SELECT COUNT(*) FROM coding_challenges'))
        print("Total challenges in DB:", res.scalar())

asyncio.run(func())

