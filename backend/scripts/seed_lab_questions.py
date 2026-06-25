import os
import json
import asyncio
import logging
from sqlalchemy.future import select

from database import admin_session_ctx
from app.models.lab import LabQuestion

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed_lab_questions")

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "lab_questions"))

async def seed_questions():
    if not os.path.exists(DATA_DIR):
        logger.error(f"Data directory {DATA_DIR} does not exist.")
        return

    json_files = [f for f in os.listdir(DATA_DIR) if f.endswith(".json")]
    if not json_files:
        logger.warning(f"No JSON files found in {DATA_DIR}.")
        return

    logger.info(f"Found {len(json_files)} JSON files to seed.")

    async with admin_session_ctx() as session:
        for file_name in json_files:
            file_path = os.path.join(DATA_DIR, file_name)
            logger.info(f"Processing {file_name}...")
            
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    questions = json.load(f)
            except Exception as e:
                logger.error(f"Failed to read/parse {file_name}: {e}")
                continue

            added_count = 0
            skipped_count = 0

            for q_data in questions:
                subject = q_data["subject"].upper()
                title = q_data["title"]
                
                # Check if question with same title and subject already exists
                stmt = select(LabQuestion).where(
                    LabQuestion.subject == subject,
                    LabQuestion.title == title,
                    LabQuestion.college_id.is_(None),  # Platform question
                    LabQuestion.is_deleted == False
                )
                res = await session.execute(stmt)
                existing = res.scalars().first()

                if existing:
                    skipped_count += 1
                    continue

                question = LabQuestion(
                    college_id=None,
                    source="platform",
                    subject=subject,
                    title=title,
                    description=q_data["description"],
                    starter_code=q_data.get("starter_code"),
                    language=q_data["language"].lower(),
                    test_input=q_data.get("test_input"),
                    expected_output=q_data["expected_output"],
                    difficulty=q_data.get("difficulty", "medium").lower(),
                    created_by=None
                )
                session.add(question)
                added_count += 1

            logger.info(f"Finished {file_name}: Added {added_count}, Skipped {skipped_count}")
        
        await session.commit()
        logger.info("Database commit successful.")

if __name__ == "__main__":
    asyncio.run(seed_questions())
