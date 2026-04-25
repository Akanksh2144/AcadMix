"""Trim attendance to 35 weekdays (>= 2026-03-09)"""
import asyncio, asyncpg, os
from dotenv import load_dotenv
load_dotenv()
DB = os.getenv("DATABASE_URL", "").replace("postgresql+asyncpg://", "postgresql://")

async def trim():
    conn = await asyncpg.connect(DB, statement_cache_size=0, command_timeout=600)

    total = await conn.fetchval("SELECT COUNT(*) FROM attendance_records")
    keep = await conn.fetchval("SELECT COUNT(*) FROM attendance_records WHERE date >= '2026-03-09'")
    print(f"Total: {total:,}  Keep (>=Mar 9): {keep:,}  Delete: {total - keep:,}", flush=True)

    result = await conn.execute("DELETE FROM attendance_records WHERE date < '2026-03-09'")
    print(f"Deleted: {result}", flush=True)

    remaining = await conn.fetchval("SELECT COUNT(*) FROM attendance_records")
    dates = await conn.fetch("SELECT DISTINCT date FROM attendance_records ORDER BY date")
    print(f"Remaining: {remaining:,}", flush=True)
    print(f"Unique dates: {len(dates)}", flush=True)
    print(f"Range: {dates[0]['date']} to {dates[-1]['date']}", flush=True)

    await conn.close()

asyncio.run(trim())
