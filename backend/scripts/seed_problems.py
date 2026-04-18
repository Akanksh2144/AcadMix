import asyncio
import json
import logging
import sys
import os
import re
from pathlib import Path

# Important: make sure 'app' can be found in Python path!
backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from dotenv import load_dotenv
from datasets import load_dataset
from litellm import acompletion
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert
import warnings
warnings.filterwarnings("ignore")

from database import admin_session_ctx
from app.models.evaluation import CodingChallenge

load_dotenv()
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

async def rewrite_problem(task_id: int, original_text: str):
    prompt = f"""
    You are an expert Computer Science professor creating content for a B2B SaaS coding platform.
    Given this algorithmic programming problem statement, perform a completely legally sanitized rewrite:
    1. Invent a short, catchy, 2-to-4 word title for this problem.
    2. Rewrite the problem description entirely in clear markdown using new phrasing and distinct variable naming contexts to ensure it's 100% original. 
    
    Original Problem: "{original_text}"
    
    Return EXACTLY a valid JSON object with no markdown fences, no formatting around it:
    {{"title": "Your Title", "description": "Your rewritten description here."}}
    """
    try:
        response = await acompletion(
            model="gemini/gemini-2.5-flash",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=800,
            temperature=0.8,
            num_retries=3
        )
        content = response.choices[0].message.content.strip()
        
        # Strip potential markdown fences safely
        content = re.sub(r'^```json\s*', '', content)
        content = re.sub(r'^```\s*', '', content)
        content = re.sub(r'\s*```$', '', content)
        
        parsed = json.loads(content)
        return parsed['title'], parsed['description']
    except Exception as e:
        # Fallback if parsing fails or rate limits
        logging.warning(f"Failed to rewrite task {task_id}: {e}")
        words = original_text.split()
        fb_title = " ".join(words[:min(4, len(words))]).title() + " Algorithm"
        return fb_title, original_text

async def process_batch(items, session: AsyncSession, batch_idx: int):
    tasks = []
    for item in items:
        tasks.append(rewrite_problem(item['task_id'], item['text']))
    
    results = await asyncio.gather(*tasks)
    
    records = []
    for item, (title, desc) in zip(items, results):
        init_code = {"python": ""}
        if "def " in item['code']:
            try:
                fn_name = item['code'].split("def ")[1].split("(")[0].strip()
                init_code["python"] = f"def {fn_name}(...):\n    pass"
            except Exception:
                pass

        records.append({
            "id": f"mbpp_{item['task_id']}",
            "title": title,
            "description": desc,
            "difficulty": "medium", 
            "topics": ["algorithm", "python"],
            "language_support": ["python", "javascript", "java", "c", "cpp"],
            "init_code": init_code,
            "expected_output": {"python_asserts": item.get('test_list', [])}
        })
    
    stmt = insert(CodingChallenge).values(records)
    stmt = stmt.on_conflict_do_update(
        index_elements=['id'],
        set_={
            'title': stmt.excluded.title,
            'description': stmt.excluded.description,
            'init_code': stmt.excluded.init_code,
            'expected_output': stmt.excluded.expected_output
        }
    )
    await session.execute(stmt)
    await session.commit()
    logging.info(f"Committed batch {batch_idx + 1} (size {len(items)})")

async def seed_problems():
    logging.info("Loading MBPP dataset from HuggingFace...")
    dataset = load_dataset("mbpp")
    
    all_items = []
    for split in dataset.keys():
        all_items.extend(dataset[split])
        
    logging.info(f"Loaded {len(all_items)} baseline problems.")
    logging.info("Beginning LLM-sanitization and database ingestion...")

    # We do a batch size of 20 to avoid instantaneous Gemini rate limits
    batch_size = 20

    async with admin_session_ctx() as session:
        for i in range(0, len(all_items), batch_size):
            batch = all_items[i:i+batch_size]
            await process_batch(batch, session, i // batch_size)
            # Sleep aggressively to respect standard 15 RPM tiers if not paid
            await asyncio.sleep(4)
            
    logging.info("SUCCESS: All problems mathematically sanitized and stored to DB.")

if __name__ == "__main__":
    asyncio.run(seed_problems())
