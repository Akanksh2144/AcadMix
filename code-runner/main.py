import os
import subprocess
import ast
import tempfile
import re
import sys

from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel

app = FastAPI(title="AcadeMix Code Runner")

# On Linux (container), apply resource limits; on Windows (local dev), skip.
IS_LINUX = sys.platform == "linux"

if IS_LINUX:
    import resource
    SANDBOX_UID = 1001
    SANDBOX_GID = 1001
    # 768MB is the sweet spot for a 1GB Fly machine (leaves room for kernel/Docker)
    MAX_MEMORY_BYTES = 768 * 1024 * 1024
    MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024  # 30 MB (required for Go/C# static binaries and intermediate objs)
    MAX_PROCESSES = 32
    # Compilation is CPU-heavy — 60s for g++/javac on shared VMs
    CPU_COMPILE = 60
    CPU_EXECUTE = 10


class ExecuteRequest(BaseModel):
    language: str
    code: str
    test_input: str = ""


_BLOCKED_PATTERNS = {
    "python": [
        r"import\s+os\b(?!.*path)", r"from\s+os\s+import\b(?!.*path)",
        r"import\s+sys", r"from\s+sys\s+import",
        r"import\s+subprocess", r"from\s+subprocess\s+import",
        r"import\s+socket", r"from\s+socket\s+import",
        r"import\s+builtins", r"__import__", r"eval\s*\(", r"exec\s*\(",
        r"open\s*\(", r"globals\s*\(", r"locals\s*\(", r"getattr\s*\(", r"setattr\s*\(",
        r"import\s+ctypes", r"from\s+ctypes\s+import",
        r"import\s+signal", r"from\s+signal\s+import",
    ],
    "javascript": [
        r"require\s*\(", r"process\.", r"fs\.", r"child_process",
        r"eval\s*\(",
    ],
    "java": [
        r"Runtime\.getRuntime", r"ProcessBuilder", r"System\.exit",
        r"java\.io\.File", r"java\.net\.", r"java\.nio\.file"
    ],
    "c": [
        r"#include\s*<unistd\.h>", r"#include\s*<sys/", r"\bsystem\s*\(",
        r"\bexecl?[vpe]*\s*\(", r"\bfork\s*\(", r"\bpopen\s*\(",
        r"\bsocket\s*\(", r"\bconnect\s*\("
    ],
    "cpp": [],
    "sql": [r"(?i)\bATTACH\b", r"(?i)\bPRAGMA\b", r"(?i)\bDROP\b", r"(?i)\bDELETE\b", r"(?i)\bUPDATE\b", r"(?i)\bINSERT\b", r"(?i)\bALTER\b"],
    "matlab": [
        r"\bsystem\s*\(", r"\bunix\s*\(", r"\bpopen\s*\(", r"\beval\s*\(", r"\bexe\s*\(", r"\bgetenv\s*\("
    ],
    "bash": [
        r"\brm\s+-r", r"\bmkfs\b", r"\bdd\b", r"\bcurl\b", r"\bwget\b",
        r"\bping\b", r"\bssh\b", r"\bnc\b", r"\bnmap\b", r":\s*\(\s*\)\s*\{"
    ],
    "go": [
        r'"os/exec"', r'"net"', r'"net/http"', r'"syscall"', r'"unsafe"',
        r'"os"', r'"io/ioutil"'
    ],
    "csharp": [
        r"System\.Diagnostics\.Process", r"System\.Net\.", r"System\.IO\.File",
        r"System\.IO\.Directory", r"System\.Reflection", r"Environment\.Exit",
        r"Assembly\.", r"\bPInvoke\b", r"DllImport", r"unsafe\s*\{"
    ]
}
_BLOCKED_PATTERNS["cpp"] = _BLOCKED_PATTERNS["c"]


def _validate_code(code: str, language: str):
    if language == "python":
        try:
            tree = ast.parse(code)
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for name in node.names:
                        if name.name.split('.')[0] in ["os", "sys", "subprocess", "socket", "builtins", "ctypes", "signal"]:
                            raise HTTPException(status_code=400, detail=f"Blocked import: {name.name}")
                elif isinstance(node, ast.ImportFrom):
                    if node.module and node.module.split('.')[0] in ["os", "sys", "subprocess", "socket", "builtins", "ctypes", "signal"]:
                        raise HTTPException(status_code=400, detail=f"Blocked import: {node.module}")
                elif isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
                    if node.func.id in ["eval", "exec", "open", "globals", "locals", "getattr", "setattr", "__import__"]:
                        raise HTTPException(status_code=400, detail=f"Blocked function: {node.func.id}")
                elif isinstance(node, ast.Name) and node.id in ["__builtins__", "__import__"]:
                    raise HTTPException(status_code=400, detail=f"Blocked identifier: {node.id}")
        except SyntaxError:
            pass  # Let the python runner catch syntax errors naturally
    else:
        patterns = _BLOCKED_PATTERNS.get(language, [])
        for pattern in patterns:
            match = re.search(pattern, code)
            if match:
                raise HTTPException(
                    status_code=400,
                    detail=f"Blocked: '{match.group()}' is not allowed for security reasons."
                )


def _make_sandbox_limits(cpu_seconds: int):
    """Return a preexec_fn that sets resource limits and drops to sandbox user."""
    if not IS_LINUX:
        return None

    def _fn():
        try:
            resource.setrlimit(resource.RLIMIT_DATA, (MAX_MEMORY_BYTES, MAX_MEMORY_BYTES))
            resource.setrlimit(resource.RLIMIT_FSIZE, (MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_BYTES))
            resource.setrlimit(resource.RLIMIT_NPROC, (MAX_PROCESSES, MAX_PROCESSES))
            resource.setrlimit(resource.RLIMIT_CPU, (cpu_seconds, cpu_seconds))
            os.setgid(SANDBOX_GID)
            os.setuid(SANDBOX_UID)
        except Exception:
            pass 

    return _fn


def _run_cmd(cmd, test_input="", wall_timeout=10, cpu_seconds=10, cwd=None, env=None):
    try:
        r = subprocess.run(
            cmd,
            input=test_input or None,
            capture_output=True,
            text=True,
            timeout=wall_timeout,
            cwd=cwd,
            env=env,
            preexec_fn=_make_sandbox_limits(cpu_seconds),
        )
        return r.stdout, r.stderr, r.returncode
    except subprocess.TimeoutExpired:
        return "", f"Time limit exceeded ({wall_timeout}s)", -1
    except Exception as e:
        return "", str(e), -1


def _run_compile(cmd, wall_timeout=60, cpu_seconds=60, cwd=None, env=None):
    try:
        r = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=wall_timeout,
            cwd=cwd,
            env=env,
            preexec_fn=_make_sandbox_limits(cpu_seconds),
        )
        return r.stdout, r.stderr, r.returncode
    except subprocess.TimeoutExpired:
        return "", f"Compilation timed out ({wall_timeout}s limit — try simplifying your code)", -1
    except Exception as e:
        return "", str(e), -1


@app.post("/run")
def run_code(req: ExecuteRequest, x_internal_token: str = Header(None)):
    expected_token = os.environ.get("CODE_RUNNER_TOKEN", "acadmix_dev_runner_token_8x19z")
    if not x_internal_token or x_internal_token != expected_token:
        raise HTTPException(status_code=403, detail="Forbidden: Invalid Internal Token")
        
    if len(req.code) > 15000: # Increased from 10k for heavy stress tests
        raise HTTPException(status_code=400, detail="Code too long")
    lang = req.language.lower()
    _validate_code(req.code, lang)

    with tempfile.TemporaryDirectory() as tmpdir:
        os.chmod(tmpdir, 0o777)

        # ── Python ────────────────────────────────────────────────────────────
        if lang == "python":
            py_cmd = "python" if os.name == "nt" else "python3"
            fp = os.path.join(tmpdir, "solution.py")
            with open(fp, "w") as f:
                f.write(req.code)
            os.chmod(fp, 0o644)
            out, err, code = _run_cmd([py_cmd, "-u", fp], req.test_input, wall_timeout=10, cpu_seconds=10, cwd=tmpdir)

        # ── JavaScript ────────────────────────────────────────────────────────
        elif lang == "javascript":
            fp = os.path.join(tmpdir, "solution.js")
            with open(fp, "w") as f:
                f.write(req.code)
            os.chmod(fp, 0o644)
            out, err, code = _run_cmd(["node", "--max-old-space-size=512", fp], req.test_input, wall_timeout=10, cpu_seconds=10, cwd=tmpdir)

        # ── Java ──────────────────────────────────────────────────────────────
        elif lang == "java":
            fp = os.path.join(tmpdir, "Solution.java")
            with open(fp, "w") as f:
                f.write(req.code)
            os.chmod(fp, 0o644)
            cout, cerr, ccode = _run_compile(["javac", fp], wall_timeout=30, cpu_seconds=30, cwd=tmpdir)
            if ccode != 0:
                return {"output": "", "error": cerr[:2000], "exit_code": ccode}
            
            out, err, code = _run_cmd(
                [
                    "java",
                    "-Xmx512m", "-Xms64m", "-Xss512k",
                    "-XX:TieredStopAtLevel=1",
                    "-XX:+UseSerialGC",
                    "-cp", tmpdir,
                    "Solution"
                ],
                req.test_input,
                wall_timeout=15, cpu_seconds=15, cwd=tmpdir
            )

        # ── C ─────────────────────────────────────────────────────────────────
        elif lang == "c":
            src = os.path.join(tmpdir, "solution.c")
            exe = os.path.join(tmpdir, "solution.out")
            with open(src, "w") as f:
                f.write(req.code)
            os.chmod(src, 0o644)
            # Use -O0 for maximum compilation speed
            cout, cerr, ccode = _run_compile(["gcc", "-O0", src, "-o", exe, "-lm"], wall_timeout=60, cpu_seconds=60, cwd=tmpdir)
            if ccode != 0:
                return {"output": "", "error": cerr[:2000], "exit_code": ccode}
            os.chmod(exe, 0o755)
            out, err, code = _run_cmd([exe], req.test_input, wall_timeout=10, cpu_seconds=10, cwd=tmpdir)

        # ── C++ ───────────────────────────────────────────────────────────────
        elif lang == "cpp":
            src = os.path.join(tmpdir, "solution.cpp")
            exe = os.path.join(tmpdir, "solution.out")
            with open(src, "w") as f:
                f.write(req.code)
            os.chmod(src, 0o644)
            # Use -O0 (no optimization) for much faster g++ builds
            cout, cerr, ccode = _run_compile(["g++", "-O0", "-std=c++17", src, "-o", exe, "-lm"], wall_timeout=60, cpu_seconds=60, cwd=tmpdir)
            if ccode != 0:
                return {"output": "", "error": cerr[:2000], "exit_code": ccode}
            os.chmod(exe, 0o755)
            out, err, code = _run_cmd([exe], req.test_input, wall_timeout=10, cpu_seconds=10, cwd=tmpdir)

        # ── SQL ───────────────────────────────────────────────────────────────
        elif lang == "sql":
            init_file = os.path.join(tmpdir, "init.sql")
            with open(init_file, "w") as f:
                f.write(req.test_input)
            
            query_file = os.path.join(tmpdir, "query.sql")
            with open(query_file, "w") as f:
                f.write(req.code)
                
            db_file = os.path.join(tmpdir, "test.db")
            
            # Form schema
            if req.test_input.strip():
                _run_cmd(["sqlite3", db_file, f".read {init_file}"], wall_timeout=5, cpu_seconds=5, cwd=tmpdir)
            
            # Run student query
            out, err, code = _run_cmd([
                "sqlite3", "-header", "-markdown", db_file, f".read {query_file}"
            ], wall_timeout=10, cpu_seconds=10, cwd=tmpdir)

        # ── MATLAB/Octave ──────────────────────────────────────────────────────
        elif lang == "matlab":
            matlab_code = f"""graphics_toolkit("gnuplot");
set(0, 'defaultfigurevisible', 'off');
try
{req.code}
catch e
  disp(e.message);
end
figs = get(0, 'children');
if ~isempty(figs)
    for i = 1:length(figs)
        print(figs(i), sprintf('output_%d.svg', i), '-dsvg', '-S800,600');
    end
end
"""
            fp = os.path.join(tmpdir, "solution.m")
            with open(fp, "w") as f:
                f.write(matlab_code)
            os.chmod(fp, 0o644)
            # Use octave-cli for fast execution without GUI overhead
            # --no-gui, --quiet (no intro text), --eval
            out, err, code = _run_cmd([
                "octave-cli", "--no-gui", "--quiet", "--no-init-file", fp
            ], req.test_input, wall_timeout=15, cpu_seconds=15, cwd=tmpdir)

        # ── BASH ───────────────────────────────────────────────────────────────
        elif lang == "bash":
            fp = os.path.join(tmpdir, "script.sh")
            with open(fp, "w") as f:
                f.write(req.code)
            os.chmod(fp, 0o755)
            out, err, code = _run_cmd([
                "bash", fp
            ], req.test_input, wall_timeout=5, cpu_seconds=5, cwd=tmpdir)

        # ── GO ────────────────────────────────────────────────────────────────
        elif lang == "go":
            src = os.path.join(tmpdir, "solution.go")
            exe = os.path.join(tmpdir, "solution.out")
            with open(src, "w") as f:
                f.write(req.code)
            os.chmod(src, 0o644)
            # Compile Go
            go_env = dict(os.environ, GOCACHE=os.path.join(tmpdir, ".cache"), GOMODCACHE=os.path.join(tmpdir, ".modcache"), HOME=tmpdir)
            cout, cerr, ccode = _run_compile(["go", "build", "-o", exe, src], wall_timeout=30, cpu_seconds=30, cwd=tmpdir, env=go_env)
            if ccode != 0:
                error_msg = (cerr + "\n" + cout).strip()
                return {"output": "", "error": error_msg[:2000], "exit_code": ccode}
            os.chmod(exe, 0o755)
            out, err, code = _run_cmd([exe], req.test_input, wall_timeout=15, cpu_seconds=15, cwd=tmpdir, env=go_env)

        # ── C# ────────────────────────────────────────────────────────────────
        elif lang == "csharp":
            import shutil
            proj_dir = os.path.join(tmpdir, "Solution")
            shutil.copytree("/app/csharp-template", proj_dir)
            fp = os.path.join(proj_dir, "Program.cs")
            with open(fp, "w") as f:
                f.write(req.code)
            os.chmod(fp, 0o644)
            csharp_env = dict(os.environ, DOTNET_CLI_HOME=tmpdir, HOME=tmpdir)
            cout, cerr, ccode = _run_compile(
                ["dotnet", "build", "-c", "Release", "-o", os.path.join(proj_dir, "out")],
                wall_timeout=30, cpu_seconds=30, cwd=proj_dir, env=csharp_env
            )
            if ccode != 0:
                error_msg = (cerr + "\n" + cout).strip()
                return {"output": "", "error": error_msg[:2000], "exit_code": ccode}
            exe = os.path.join(proj_dir, "out", "Solution")
            out, err, code = _run_cmd([exe], req.test_input, wall_timeout=15, cpu_seconds=15, cwd=proj_dir, env=csharp_env)

        else:
            raise HTTPException(status_code=400, detail=f"Unsupported language")

        if code != 0 and not out.strip():
            out = err
            err = ""

        # Scan for output images
        import base64
        images = []
        for file in sorted(os.listdir(tmpdir)):
            if file.endswith('.svg') or file.endswith('.png'):
                try:
                    with open(os.path.join(tmpdir, file), 'rb') as img_f:
                        encoded = base64.b64encode(img_f.read()).decode('utf-8')
                        ext = file.split('.')[-1]
                        mime = 'image/svg+xml' if ext == 'svg' else f'image/{ext}'
                        images.append(f"data:{mime};base64,{encoded}")
                except Exception:
                    pass

        return {"output": out[:5000], "error": err[:2000], "exit_code": code, "images": images}


@app.get("/health")
def health():
    return {"status": "up", "sandbox": "enabled", "platform": sys.platform}
