import sys
import subprocess
import uvicorn
from fastapi import FastAPI, Request
from pydantic import BaseModel

app = FastAPI()

class RunRequest(BaseModel):
    language: str
    code: str
    test_input: str = ""

@app.post("/run")
async def run_code(req: RunRequest, request: Request):
    # Only actually execute Python for safety/simplicity in this mock
    if req.language.lower() != "python":
        return {
            "output": f"[Mock Engine] Simulated execution for {req.language} complete.\nCode length: {len(req.code)}",
            "error": "Local mock runner currently only executes Python. Other languages are mocked.",
            "exit_code": 0
        }
        
    try:
        # Run python code via subprocess
        process = subprocess.run(
            [sys.executable, "-c", req.code],
            input=req.test_input,
            text=True,
            capture_output=True,
            timeout=5
        )
        return {
            "output": process.stdout,
            "error": process.stderr,
            "exit_code": process.returncode
        }
    except subprocess.TimeoutExpired:
        return {
            "output": "",
            "error": "Execution timed out (5s limit)",
            "exit_code": 124
        }
    except Exception as e:
        return {
            "output": "",
            "error": str(e),
            "exit_code": -1
        }

if __name__ == "__main__":
    print("Starting Mock Code Runner on port 8002...")
    uvicorn.run(app, host="0.0.0.0", port=8002)
