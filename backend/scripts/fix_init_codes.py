"""
One-time migration: Generate init_code for all 5 languages for existing premium challenges.
Parses the function signature from optimal_solution_python and generates starter templates.

Run: python backend/scripts/fix_init_codes.py
"""
import os, sys, re, asyncio, json, logging
from pathlib import Path

backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool
from sqlalchemy import select, update

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

DATABASE_URL = os.getenv("DATABASE_URL")

script_engine = create_async_engine(
    DATABASE_URL, echo=False, poolclass=NullPool,
    connect_args={"statement_cache_size": 0, "timeout": 60, "command_timeout": 120, "server_settings": {"jit": "off"}},
)
ScriptSession = async_sessionmaker(bind=script_engine, class_=AsyncSession, expire_on_commit=False)


def generate_all_init_codes(optimal_solution_python: str) -> dict:
    """Parse the function signature from Python solution and generate starter templates for all 5 languages."""
    init_code = {}

    fn_match = re.search(r'def solve\(([^)]*)\)', optimal_solution_python)
    if not fn_match:
        init_code['python'] = "def solve():\n    # Your optimal approach here\n    pass"
        return init_code

    py_params = fn_match.group(1).strip()
    param_names = [p.strip().split(':')[0].split('=')[0].strip() for p in py_params.split(',') if p.strip()]

    # Python
    init_code['python'] = f"def solve({py_params}):\n    # Your optimal approach here\n    pass"

    # JavaScript
    js_params = ', '.join(param_names)
    init_code['javascript'] = (
        f"function solve({js_params}) {{\n"
        f"    // Your optimal approach here\n"
        f"    return null;\n"
        f"}}"
    )

    # Java
    java_params = ', '.join([f'Object {p}' for p in param_names])
    init_code['java'] = (
        f"import java.util.*;\n\n"
        f"class Solution {{\n"
        f"    public static Object solve({java_params}) {{\n"
        f"        // Your optimal approach here\n"
        f"        return null;\n"
        f"    }}\n\n"
        f"    public static void main(String[] args) {{\n"
        f"        // Test your solution here\n"
        f"    }}\n"
        f"}}"
    )

    # C
    c_params = ', '.join([f'int {p}' for p in param_names])
    init_code['c'] = (
        f"#include <stdio.h>\n"
        f"#include <stdlib.h>\n"
        f"#include <string.h>\n\n"
        f"int solve({c_params}) {{\n"
        f"    // Your optimal approach here\n"
        f"    return 0;\n"
        f"}}\n\n"
        f"int main() {{\n"
        f"    // Test your solution here\n"
        f"    return 0;\n"
        f"}}"
    )

    # C++
    cpp_params = ', '.join([f'int {p}' for p in param_names])
    init_code['cpp'] = (
        f"#include <bits/stdc++.h>\n"
        f"using namespace std;\n\n"
        f"int solve({cpp_params}) {{\n"
        f"    // Your optimal approach here\n"
        f"    return 0;\n"
        f"}}\n\n"
        f"int main() {{\n"
        f"    // Test your solution here\n"
        f"    return 0;\n"
        f"}}"
    )

    return init_code


async def main():
    from app.models.evaluation import PremiumCodingChallenge

    logging.info("Connecting to Supabase...")
    async with ScriptSession() as session:
        result = await session.execute(select(PremiumCodingChallenge))
        challenges = result.scalars().all()

        logging.info(f"Found {len(challenges)} challenges to update init_code for.")

        updated = 0
        for c in challenges:
            sol = c.optimal_solution_python or ''
            new_init = generate_all_init_codes(sol)

            await session.execute(
                update(PremiumCodingChallenge)
                .where(PremiumCodingChallenge.id == c.id)
                .values(
                    init_code=new_init,
                    language_support=["python", "javascript", "java", "c", "cpp"]
                )
            )
            updated += 1
            logging.info(f"  ✅ {c.title}")
            for lang, code in new_init.items():
                first_line = code.split('\n')[0]
                logging.info(f"      {lang}: {first_line}")

        await session.commit()
        logging.info(f"\n🎉 Done! Updated {updated} challenges with 5-language init_code.")


if __name__ == "__main__":
    asyncio.run(main())
