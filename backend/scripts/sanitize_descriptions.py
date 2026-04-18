"""
One-time bulk migration: Sanitize ALL PremiumCodingChallenge descriptions in the database.
Fixes formatting issues regardless of how the LLM originally generated the text.

Run: python backend/scripts/sanitize_descriptions.py
"""
import os, sys, re, asyncio, logging
from pathlib import Path

backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool
from sqlalchemy import select, update, text

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

DATABASE_URL = os.getenv("DATABASE_URL")

# Dedicated engine with generous 60s timeout for this one-shot script
script_engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    poolclass=NullPool,
    connect_args={
        "statement_cache_size": 0,
        "timeout": 60,          # 60s to establish TCP connection
        "command_timeout": 120,  # 120s per SQL command
        "server_settings": {"jit": "off"},
    },
)

ScriptSession = async_sessionmaker(
    bind=script_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


def sanitize_description(desc: str) -> str:
    """
    Master sanitizer that takes a raw LLM-generated description string and 
    enforces clean, consistent Markdown formatting. Idempotent — safe to run multiple times.
    """
    if not desc:
        return desc

    # ── Step 1: Normalize line endings ────────────────────────────────────
    desc = desc.replace('\r\n', '\n').replace('\r', '\n')

    # ── Step 2: Force section headings to ### (bold + spaced) ─────────────
    section_headings = [
        "Input Format",
        "Output Format",
        "Constraints",
        "Example 1",
        "Example 2", 
        "Example 3",
        "Example",
        "Real-World Use Cases",
        "Note",
    ]
    for heading in section_headings:
        pattern = re.compile(
            r'(^|\n)\s*\**\s*' + re.escape(heading) + r'\s*:?\s*\**\s*(?=\n|$)',
            re.IGNORECASE
        )
        desc = pattern.sub(rf'\n\n### {heading}\n\n', desc)

    # ── Step 3: Fix code blocks where Input:/Output:/Explanation: are smashed ─
    def fix_code_block(match):
        block = match.group(0)
        block = re.sub(r'(?<!\n)(Output\s*:)', r'\n\1', block)
        block = re.sub(r'(?<!\n)(Explanation\s*:)', r'\n\1', block)
        block = re.sub(r'(?<!\n)(Input\s*:)', r'\n\1', block)
        block = re.sub(r'\n{3,}', '\n\n', block)
        return block

    desc = re.sub(r'```[\s\S]*?```', fix_code_block, desc)

    # ── Step 4: Bold sub-headings inside Input Format sections ────────────
    sub_heading_pattern = re.compile(
        r'(^|\n)\s*((?:First|Second|Third|Next \w+|Last|Each|Single|One) (?:line|integer|lines?|value|number|string)[^:\n]*:)',
        re.IGNORECASE
    )
    desc = sub_heading_pattern.sub(r'\1**\2**', desc)
    desc = re.sub(r'\*{4,}', '**', desc)

    # ── Step 5: Clean up excessive blank lines ────────────────────────────
    desc = re.sub(r'\n{4,}', '\n\n\n', desc)
    desc = desc.strip()

    return desc


def sanitize_ai_context(ctx: dict) -> dict:
    """Clean up problem_ai_context fields."""
    if not ctx:
        return ctx
    
    if 'real_world_applications' in ctx:
        rwa = ctx['real_world_applications']
        if rwa:
            rwa = re.sub(r'(?<!\n)(\d+\.\s+)', r'\n\n\1', rwa)
            rwa = re.sub(r'(\d+\.\s+)([^:\n]+:)', r'**\1\2**', rwa)
            rwa = re.sub(r'\*{4,}', '**', rwa)
            rwa = rwa.strip()
            ctx['real_world_applications'] = rwa
    
    return ctx


async def main():
    logging.info("Connecting to Supabase (timeout=60s)...")
    
    # Import the model AFTER path setup
    from app.models.evaluation import PremiumCodingChallenge

    for attempt in range(3):
        try:
            async with ScriptSession() as session:
                # Quick connectivity test
                await session.execute(text("SELECT 1"))
                logging.info("✅ Database connected!")

                result = await session.execute(select(PremiumCodingChallenge))
                challenges = result.scalars().all()

                logging.info(f"Found {len(challenges)} premium challenges to sanitize.")

                updated = 0
                for challenge in challenges:
                    old_desc = challenge.description or ''
                    new_desc = sanitize_description(old_desc)

                    old_ctx = challenge.problem_ai_context or {}
                    new_ctx = sanitize_ai_context(dict(old_ctx)) if old_ctx else old_ctx

                    changed = (new_desc != old_desc) or (new_ctx != old_ctx)

                    if changed:
                        await session.execute(
                            update(PremiumCodingChallenge)
                            .where(PremiumCodingChallenge.id == challenge.id)
                            .values(
                                description=new_desc,
                                problem_ai_context=new_ctx
                            )
                        )
                        updated += 1
                        logging.info(f"  ✅ Sanitized: {challenge.title}")
                    else:
                        logging.info(f"  ⏭️  Already clean: {challenge.title}")

                await session.commit()
                logging.info(f"\n🎉 Done! Sanitized {updated}/{len(challenges)} challenges.")
                return  # success — exit retry loop

        except Exception as e:
            logging.error(f"Attempt {attempt + 1}/3 failed: {e}")
            if attempt < 2:
                logging.info("Retrying in 5 seconds...")
                await asyncio.sleep(5)
            else:
                logging.error("All 3 attempts failed. Check your internet/Supabase status.")
                raise


if __name__ == "__main__":
    asyncio.run(main())
