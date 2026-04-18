import os
import json
import subprocess
from anthropic import Anthropic
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# The exact JSON schema we designed
SCHEMA = """
{
  "title": "String", "slug": "String", "difficulty": "Easy/Medium/Hard",
  "description": "String (Campus lore included)", "constraints": ["String"],
  "optimal_solution_python": "String (Raw Python code. The main function MUST be named 'solve')",
  "test_cases": [{"input_data": "String", "expected_output": "String", "is_hidden": true/false}],
  "problem_ai_context": {
    "optimal_time_complexity": "String", "optimal_space_complexity": "String",
    "common_pitfalls": "String", "coach_instructions": "String"
  }
}
"""

def generate_problem(topic: str, difficulty: str) -> dict:
    prompt = f"""
    Generate a DSA problem about {topic}. Difficulty: {difficulty}.
    The problem must be wrapped in Indian college campus lore.
    The main solution function MUST be named 'solve' and take 1 or more arguments.
    Output strictly as a JSON object matching this schema, with no additional markdown or text:
    {SCHEMA}
    """
    
    print(f"Generating {difficulty} problem for {topic}...")
    response = client.messages.create(
        model="claude-3-5-sonnet-latest", # Uses the latest routing for Sonnet
        max_tokens=2500,
        temperature=0.4, # Low temperature for logical consistency
        messages=[{"role": "user", "content": prompt}]
    )
    
    # Parse the raw text into a Python dictionary
    raw_json = response.content[0].text.strip()
    return json.loads(raw_json)

def validate_code(problem_data: dict) -> bool:
    code = problem_data['optimal_solution_python']
    test_cases = problem_data['test_cases']
    
    # We build a temporary Python script to run the AI's code against its own test cases
    # We use eval() dynamically here just for the local testing sandbox
    test_runner = f"""
import sys

# AI Generated Code
{code}

# Test Cases Execution
test_cases = {test_cases}
for idx, tc in enumerate(test_cases):
    try:
        # Assuming input_data is formatted as a tuple of arguments, e.g., "( [1,2,3], 5 )"
        # For simplicity in this sandbox, we evaluate the string input into actual Python objects
        args = eval(tc['input_data'])
        if not isinstance(args, tuple):
            args = (args,)
            
        result = solve(*args)
        expected = eval(tc['expected_output'])
        
        if result != expected:
            print(f"Test case {{idx}} failed. Expected {{expected}}, got {{result}}")
            sys.exit(1)
            
    except Exception as e:
        print(f"Execution error on test case {{idx}}: {{e}}")
        sys.exit(1)
        
print("ALL TESTS PASSED")
"""
    
    # Write to a temp file and execute it in an isolated subprocess
    with open("temp_sandbox.py", "w") as f:
        f.write(test_runner)
        
    print("Running automated sandbox validation...")
    result = subprocess.run(["python", "temp_sandbox.py"], capture_output=True, text=True)
    
    # Clean up temp file
    os.remove("temp_sandbox.py")
    
    if result.returncode == 0:
        print("✅ Validation Successful: AI code passes all generated test cases.")
        return True
    else:
        print(f"❌ Validation Failed:\n{result.stdout}\n{result.stderr}")
        return False

# --- Run the Pipeline ---
if __name__ == "__main__":
    try:
        # Generate 1 test problem
        new_problem = generate_problem(topic="Sliding Window", difficulty="Medium")
        
        # Validate it
        is_valid = validate_code(new_problem)
        
        if is_valid:
            # Here is where you would eventually write to PostgreSQL
            with open(f"{new_problem['slug']}.json", "w") as f:
                json.dump(new_problem, f, indent=4)
            print(f"Problem saved to {new_problem['slug']}.json")
            
    except json.JSONDecodeError:
        print("Failed to parse JSON. The model hallucinated markdown.")
