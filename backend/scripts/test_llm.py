import asyncio
import os
from litellm import acompletion
import logging

from dotenv import load_dotenv
load_dotenv()

async def func():
    try:
        response = await acompletion(
            model="gemini/gemini-1.5-flash",
            messages=[{"role": "user", "content": "Hello, generate a JSON object with 'title' and 'description'."}],
            max_tokens=800,
            temperature=0.8,
            num_retries=1
        )
        print("SUCCESS:", response.choices[0].message.content)
    except Exception as e:
        print("ERROR:", str(e))

asyncio.run(func())
