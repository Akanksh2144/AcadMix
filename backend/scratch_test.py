import asyncio
import os
import json
from dotenv import load_dotenv

# Load env before importing app
load_dotenv()

import logging

logging.basicConfig(level=logging.INFO)

from app.services.llm_gateway import gateway

async def main():
    print("Testing 2.0 flash lite (purpose: career_tools)")
    res1 = await gateway.complete("career_tools", [{"role": "user", "content": "Hi, respond with exactly: I am 2.0 flash lite"}])
    print("Response:", res1)
    print("-" * 40)

    print("Testing 2.5 flash (purpose: interview)")
    res2 = await gateway.complete("interview", [{"role": "user", "content": "Hi, respond with exactly: I am 2.5 flash"}])
    print("Response:", res2)
    print("-" * 40)

    print("Testing 2.5 pro (purpose: erp_complex)")
    res3 = await gateway.complete("erp_complex", [{"role": "user", "content": "Hi, respond with exactly: I am 2.5 pro"}])
    print("Response:", res3)
    print("-" * 40)

    print("Testing sonnet 4.6 (purpose: erp_last_resort)")
    res4 = await gateway.complete("erp_last_resort", [{"role": "user", "content": "Hi, respond with exactly: I am Claude"}])
    print("Response:", res4)
    print("-" * 40)

if __name__ == "__main__":
    asyncio.run(main())
