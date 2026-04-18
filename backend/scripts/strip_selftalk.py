"""
Targeted fix: Strip ALL self-talk and duplicate outputs from code blocks.
Instead of line-start matching, this strips ANY line containing self-talk patterns.

Run: python backend/scripts/strip_selftalk.py
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
engine = create_async_engine(DATABASE_URL, echo=False, poolclass=NullPool,
    connect_args={"statement_cache_size": 0, "timeout": 60, "command_timeout": 120, "server_settings": {"jit": "off"}})
Session = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

# Patterns that indicate LLM self-talk (match ANYWHERE in the line)
SELFTALK = [
    r'Wait\s*[—–-]',
    r'←\s*Wait',
    r'Let me recheck',
    r'Let me try',
    r'Let me re',
    r'let\'s recheck',
    r'Correct trace:',
    r'Actually\s+Option',
    r'Actually\s+re-trace',
    r'Actual:',
    r'Actually:',
    r'Hmm[,.]',
    r'Wait that gives',
    r're-trace',
    r'Re-verify',
    r'\? Let me',
    r'penalty=\d+ means only',
    r'Output=\d+\.',   # inline "Output=5." is self-talk, not the real Output: line
]

SELFTALK_RE = re.compile('|'.join(SELFTALK), re.IGNORECASE)


def clean_code_block(match):
    """Strip self-talk lines and deduplicate Output: from a single code block."""
    block = match.group(0)
    opener = block.split('\n')[0]   # ```text or ```
    closer = '```'
    
    # Get inner content
    inner = block[len(opener)+1:]  # skip opener + newline
    if inner.endswith('```'):
        inner = inner[:-3]
    
    lines = inner.split('\n')
    cleaned = []
    output_indices = []  # track where Output: lines are
    
    for line in lines:
        # Skip lines matching any self-talk pattern
        if SELFTALK_RE.search(line):
            logging.info(f"    🗑️  Stripped: {line.strip()[:80]}")
            continue
        
        # Track Output: lines
        if re.match(r'^\s*Output:\s*', line):
            output_indices.append(len(cleaned))
        
        cleaned.append(line)
    
    # If multiple Output: lines remain, keep only the LAST one and remove earlier ones + their value lines
    if len(output_indices) > 1:
        to_remove = set()
        for idx in output_indices[:-1]:
            to_remove.add(idx)
            # Also remove the value line right after Output: if it exists and isn't another keyword
            if idx + 1 < len(cleaned) and not re.match(r'^\s*(Input|Output|Explanation)\s*:', cleaned[idx + 1]):
                to_remove.add(idx + 1)
        cleaned = [l for i, l in enumerate(cleaned) if i not in to_remove]
        logging.info(f"    🔀 Deduplicated {len(output_indices)} Output: lines → kept last one")
    
    # Collapse excessive blank lines
    result = '\n'.join(cleaned)
    result = re.sub(r'\n{3,}', '\n\n', result)
    
    return f"{opener}\n{result}```"


async def main():
    from app.models.evaluation import PremiumCodingChallenge
    
    logging.info("Connecting...")
    async with Session() as session:
        await session.execute(text("SELECT 1"))
        logging.info("✅ Connected!")
        
        result = await session.execute(select(PremiumCodingChallenge))
        challenges = result.scalars().all()
        
        updated = 0
        for c in challenges:
            desc = c.description or ''
            new_desc = re.sub(r'```[\s\S]*?```', clean_code_block, desc)
            
            if new_desc != desc:
                await session.execute(
                    update(PremiumCodingChallenge)
                    .where(PremiumCodingChallenge.id == c.id)
                    .values(description=new_desc)
                )
                updated += 1
                logging.info(f"  ✅ Cleaned: {c.title}")
            else:
                logging.info(f"  ⏭️  No self-talk found: {c.title}")
        
        await session.commit()
        logging.info(f"\n🎉 Stripped self-talk from {updated}/{len(challenges)} challenges.")


if __name__ == "__main__":
    asyncio.run(main())
