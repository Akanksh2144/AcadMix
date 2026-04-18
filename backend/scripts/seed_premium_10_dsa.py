import os
import json
import logging
import subprocess
import asyncio
from typing import List

from anthropic import AsyncAnthropic
from dotenv import load_dotenv

# Important: make sure 'app' can be found in Python path!
import sys
from pathlib import Path
backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from database import admin_session_ctx
from app.models.evaluation import PremiumCodingChallenge
from sqlalchemy.dialects.postgresql import insert

load_dotenv()
client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

SCHEMA = """
{
  "type": "object",
  "properties": {
    "title": { "type": "string" },
    "slug": { "type": "string" },
    "difficulty": { "type": "string", "enum": ["Easy", "Medium", "Hard"] },
    "description": { "type": "string" },
    "constraints": { "type": "array", "items": { "type": "string" } },
    "optimal_solution_python": { "type": "string" },
    "test_cases": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "input_data": { "type": "string" },
          "step_by_step_trace": { 
            "type": "string", 
            "description": "CRITICAL: You must explicitly trace your generated Python algorithm step-by-step against the input_data here to calculate the exact answer." 
          },
          "expected_output": { "type": "string" },
          "is_hidden": { "type": "boolean" }
        },
        "required": ["input_data", "step_by_step_trace", "expected_output", "is_hidden"]
      }
    },
    "problem_ai_context": {
      "type": "object",
      "properties": {
        "optimal_time_complexity": { "type": "string" },
        "optimal_space_complexity": { "type": "string" },
        "common_pitfalls": { "type": "string" },
        "real_world_applications": { "type": "string", "description": "Describe 1 or 2 real-world software engineering applications or use cases where the underlying algorithmic concept of this problem is deployed." },
        "coach_instructions": { "type": "string" }
      },
      "required": ["optimal_time_complexity", "optimal_space_complexity", "common_pitfalls", "real_world_applications", "coach_instructions"]
    }
  },
  "required": ["title", "slug", "difficulty", "description", "constraints", "optimal_solution_python", "test_cases", "problem_ai_context"]
}
"""

async def generate_problem(topic: str, difficulty: str) -> dict:
    prompt = f"""
    You are an expert Computer Science professor designing coding problems for an Indian college placement platform. Your task is to generate a distinct Data Structures and Algorithms (DSA) problem about {topic}. Difficulty: {difficulty}.

    CRITICAL INSTRUCTIONS:
    Campus Lore Reskinning: Frame the problem narrative around an Indian college life context (e.g., 'The Hostel Warden checking rooms', 'Mess fee calculation', 'Library fine dispute').
    Strict Formatting: Output the response EXACTLY matching the provided JSON schema. Do not include markdown formatting or conversational text outside the JSON object.
    Code: The optimal_solution_python MUST use a distinct method named 'solve'. It must return the answer.
    Test Cases: Generate at least 15 test cases (max 20). You MUST ensure the first 5 test cases have is_hidden: false. All remaining test cases (at least 10) MUST have is_hidden: true.
    Inputs: 'input_data' should be evaluated dynamically. Use standard python literal evaluation limits or tuple arguments. Make it simple.
    Test Case Accuracy: LLMs often fail at mental math for array indexing. For every single test case, you MUST use the 'step_by_step_trace' field to manually execute your algorithm on the 'input_data' (tracking variables, array bounds, and loop states) to mathematically guarantee the 'expected_output' matches the code's output. CRITICAL: For hidden test cases, keep the step_by_step_trace extremely brief (1 line) to conserve API tokens!
    Self-Correction: Re-verify the full length of the array or string bounds manually against your own problem constraints before finalizing the expected output. Double-check your monotonic stack bounds and prefix sum logic to prevent math bugs.

    The JSON Schema:
    {SCHEMA}
    """
    
    # VERY STRICTLY RESTORED TO ANTHROPIC PER USER SPECIFICATIONS
    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=8192,
        temperature=0.4,
        messages=[{"role": "user", "content": prompt}]
    )
    
    if response.stop_reason == "max_tokens":
        raise ValueError("Generation hit max_tokens limit and was truncated. Retrying...")
    
    import re
    raw_json = response.content[0].text.strip()
    raw_json = re.sub(r'^```json\s*', '', raw_json)
    raw_json = re.sub(r'^```\s*', '', raw_json)
    raw_json = re.sub(r'\s*```$', '', raw_json)
    
    return json.loads(raw_json)


def validate_code(problem_data: dict) -> bool:
    code = problem_data['optimal_solution_python']
    test_cases = problem_data['test_cases']
    
    test_runner = f"""
import sys
import json

{code}

# Safe test evaluation logic
test_cases = json.loads(r'''{json.dumps(test_cases)}''')
pass_count = 0

# JSON eval safety constants for Python
true = True
false = False
null = None

for idx, tc in enumerate(test_cases):
    try:
        raw_inp = tc['input_data']
        args = eval(raw_inp) if raw_inp.strip().startswith('(') else (eval(raw_inp),)
            
        result = solve(*args)
        expected = eval(tc['expected_output'])
        
        if result != expected:
            print(f"Test case {{idx}} failed. Expected {{expected}}, got {{result}}")
            sys.exit(1)
        pass_count += 1
            
    except Exception as e:
        print(f"Execution error on test case {{idx}}: {{e}}")
        sys.exit(1)
        
print("OK")
"""
    
    try:
        with open("temp_sandbox.py", "w", encoding="utf-8") as f:
            f.write(test_runner)
            
        result = subprocess.run(["python", "temp_sandbox.py"], capture_output=True, text=True, timeout=10)
        
        if result.returncode != 0:
            logging.error(f"Sandbox Failed. Stdout: {result.stdout}")
            logging.error(f"Sandbox Failed. Stderr: {result.stderr}")
            # DO NOT remove temp_sandbox.py so user can inspect it
            return False
            
        os.remove("temp_sandbox.py")
        
        return True
    except Exception as e:
        logging.error(f"Sandbox Execution Exception: {e}")
        return False

async def seed_problems():
    taxonomy = [
        ("Binary Trees", "Medium"),
        ("Dynamic Programming (1D)", "Medium"),
        ("Graphs (BFS/DFS)", "Medium"),
        ("Greedy Algorithms", "Easy"),
        ("Backtracking", "Hard"),
        ("Linked Lists", "Easy"),
        ("Heaps & Priority Queues", "Medium"),
        ("Tries", "Hard"),
        ("Dynamic Programming (2D)", "Hard"),
        ("Graphs (Shortest Path)", "Hard")
    ]
    
    
    records = []
    
    for i, (topic, diff) in enumerate(taxonomy):
        success = False
        retries = 1
        
        while not success and retries > 0:
            try:
                logging.info(f"Generating {topic} [{diff}]... (Retries left: {retries})")
                problem = await generate_problem(topic, diff)
                
                if validate_code(problem):
                    logging.info(f"Validation passed for: {problem['title']}")
                    records.append(problem)
                    success = True
                else:
                    logging.warning(f"Validation failed for {problem.get('title', 'Unknown')}. Retrying.")
                    retries -= 1
            except Exception as e:
                logging.error(f"Generation error: {e}")
                retries -= 1
                
        if not success:
            logging.error(f"Failed to securely generate problem for {topic} after multiple retry iterations.")
            
    if records:
        async with admin_session_ctx() as session:
            final_db_records = []
            for r in records:
                # Format to database model
                init_script = "def solve(...):\n    pass"
                try:
                    fn_def = r['optimal_solution_python'].split("def solve")[1].split(":")[0]
                    init_script = f"def solve{fn_def}:\n    # Your optimal approach here\n    pass"
                except:
                    pass
                    
                final_db_records.append({
                    "id": f"anthropic_{r['slug']}",
                    "slug": r['slug'],
                    "title": r['title'],
                    "description": r['description'],
                    "difficulty": r['difficulty'],
                    "constraints": r['constraints'],
                    "topics": [topic for (topic, _) in taxonomy], # Simplified, in real prod use AI mapping
                    "language_support": ["python"],
                    "init_code": {"python": init_script},
                    "optimal_solution_python": r['optimal_solution_python'],
                    "test_cases": r['test_cases'],
                    "problem_ai_context": r['problem_ai_context'],
                    "is_live": True
                })
                
            stmt = insert(PremiumCodingChallenge).values(final_db_records)
            stmt = stmt.on_conflict_do_nothing()
            await session.execute(stmt)
            await session.commit()
            logging.info(f"Successfully inserted {len(final_db_records)} validated premium challenges!")

if __name__ == "__main__":
    asyncio.run(seed_problems())
