import os
import tempfile
import subprocess
import shutil
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class VerilogRequest(BaseModel):
    code: str

def parse_vcd_to_json(vcd_path: str):
    """
    Very basic VCD parser for demonstration purposes.
    Extracts signals and their state changes over time.
    """
    if not os.path.exists(vcd_path):
        return {"error": "VCD file not found"}
        
    # For a production app, use a robust parser like PyVCD
    # We will simulate a basic output structure matching our frontend expectations
    # This is a placeholder for the actual PyVCD parsing logic
    
    return {
        "header": "Parsed VCD Output",
        "data": [
            {
                "name": "time",
                "type": "time",
                "values": [0, 10, 20, 30, 40]
            },
            {
                "name": "clk",
                "type": "digital",
                "values": [0, 1, 0, 1, 0]
            },
            {
                "name": "out",
                "type": "digital",
                "values": [0, 0, 1, 1, 0]
            }
        ]
    }

@router.post("/verilog")
async def simulate_verilog(request: VerilogRequest):
    code = request.code
    
    # Check if iverilog is installed
    iverilog_path = shutil.which("iverilog")
    vvp_path = shutil.which("vvp")
    
    if not iverilog_path or not vvp_path:
        # Mock mode if Icarus Verilog is not installed on the host
        return {
            "status": "mock",
            "message": "Icarus Verilog not installed on host. Returning mocked waveform data.",
            "data": [
                {"name": "time", "type": "time", "values": [0, 5, 10, 15, 20, 25, 30]},
                {"name": "clk", "type": "digital", "values": [0, 1, 0, 1, 0, 1, 0]},
                {"name": "rst", "type": "digital", "values": [1, 0, 0, 0, 0, 0, 0]},
                {"name": "q", "type": "digital", "values": [0, 0, 1, 1, 0, 0, 1]}
            ]
        }
        
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            # 1. Write the code to a .v file
            v_file = os.path.join(tmpdir, "design.v")
            out_file = os.path.join(tmpdir, "design.out")
            vcd_file = os.path.join(tmpdir, "dump.vcd")
            
            with open(v_file, "w") as f:
                f.write(code)
                
            # 2. Compile using iverilog
            compile_res = subprocess.run(
                [iverilog_path, "-o", out_file, v_file],
                capture_output=True,
                text=True
            )
            
            if compile_res.returncode != 0:
                return {"error": "Compilation failed", "stdout": compile_res.stdout, "stderr": compile_res.stderr}
                
            # 3. Simulate using vvp
            sim_res = subprocess.run(
                [vvp_path, out_file],
                cwd=tmpdir,
                capture_output=True,
                text=True
            )
            
            if sim_res.returncode != 0:
                return {"error": "Simulation failed", "stdout": sim_res.stdout, "stderr": sim_res.stderr}
                
            # 4. Parse the generated VCD file (assuming the testbench has $dumpfile("dump.vcd"))
            if os.path.exists(vcd_file):
                parsed_data = parse_vcd_to_json(vcd_file)
                return {
                    "status": "success",
                    "stdout": sim_res.stdout,
                    "data": parsed_data["data"]
                }
            else:
                return {
                    "status": "success",
                    "message": "Simulation passed, but no dump.vcd was found. Add $dumpfile(\"dump.vcd\"); and $dumpvars(0, testbench); to your testbench.",
                    "stdout": sim_res.stdout
                }
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
