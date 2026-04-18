import os
import asyncio
from anthropic import AsyncAnthropic

client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

async def test_model(model_name):
    try:
        response = await client.messages.create(
            model=model_name,
            max_tokens=10,
            messages=[{"role": "user", "content": "hello"}]
        )
        print(f"Success: {model_name}")
        return True
    except Exception as e:
        print(f"Failed {model_name}: {e}")
        return False

async def main():
    models = [
        "claude-3-7-sonnet-20250219",
        "claude-3-5-sonnet-20241022",
        "claude-3-5-sonnet-20240620",
        "claude-3-haiku-20240307",
        "claude-3-opus-20240229",
        "claude-3-6-sonnet-20241220",
        "claude-3-5-sonnet-latest"
    ]
    for m in models:
        await test_model(m)

if __name__ == "__main__":
    asyncio.run(main())
