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
        await s.execute(text("DELETE FROM coding_challenges WHERE id LIKE 'mbpp_%'"))
        await s.commit()
        print("Deleted bad challenges.")

asyncio.run(func())
