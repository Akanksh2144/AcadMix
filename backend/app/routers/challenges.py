from app.core.limiter import limiter
from app.core.config import settings
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
import httpx
import tenacity
import json

from database import get_db
from app.core.security import get_current_user
from app.core.security import require_role
from app import models
import app.schemas as server_schemas
from app.schemas import *

# Global Connection Pool HTTP Client for extreme latency reduction
_http_client = httpx.AsyncClient(
    limits=httpx.Limits(max_keepalive_connections=100, max_connections=200),
    timeout=httpx.Timeout(65.0, connect=5.0)
)

TIMEOUT_CONFIG = {
    "python": 15.0,
    "javascript": 15.0,
    "c": 65.0,
    "cpp": 65.0,
    "java": 50.0,
    "sql": 15.0,
}

def _build_python_sandbox(user_code: str, test_cases_list: list) -> str:
    escaped_tc = json.dumps(test_cases_list or [])
    return f"""
import json
from collections import deque

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next
        
    def __eq__(self, other):
        if not isinstance(other, ListNode):
            return False
        return self.val == other.val and self.next == other.next

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
        
    def __eq__(self, other):
        if not isinstance(other, TreeNode):
            return False
        return self.val == other.val and self.left == other.left and self.right == other.right

def build_linked_list(arr):
    if not arr: return None
    head = ListNode(arr[0])
    curr = head
    for val in arr[1:]:
        curr.next = ListNode(val)
        curr = curr.next
    return head

def build_tree(arr):
    if not arr: return None
    root = TreeNode(arr[0])
    queue = deque([root])
    i = 1
    while queue and i < len(arr):
        node = queue.popleft()
        if i < len(arr) and arr[i] is not None:
            node.left = TreeNode(arr[i])
            queue.append(node.left)
        i += 1
        if i < len(arr) and arr[i] is not None:
            node.right = TreeNode(arr[i])
            queue.append(node.right)
        i += 1
    return root

{user_code}

test_cases = json.loads(r'''{escaped_tc}''')
true = True
false = False
null = None

from ast import literal_eval as lx_parse
def safe_parse(raw_s):
    s = raw_s.strip()
    if s.startswith("build_tree("):
        inner = s[s.find("(")+1:s.rfind(")")]
        return build_tree(lx_parse(inner))
    if s.startswith("build_linked_list("):
        inner = s[s.find("(")+1:s.rfind(")")]
        return build_linked_list(lx_parse(inner))
    try:
        return lx_parse(s)
    except (ValueError, SyntaxError):
        return raw_s

all_passed = True
try:
    if test_cases:
        try:
            _ = solve
        except NameError:
            print("Error: The platform requires a function named 'solve' to evaluate your code. Please wrap your logic in 'def solve(...):'")
            all_passed = False
            raise SystemExit()
            
        for idx, tc in enumerate(test_cases):
            try:
                raw_inp = tc['input_data']
                parsed = safe_parse(raw_inp)
                args = parsed if isinstance(parsed, tuple) and not raw_inp.strip().startswith("build_") else (parsed,)
                
                result = solve(*args)
                
                expected = tc.get('expected_output')
                if expected is not None:
                    passed = str(result).strip().lower() == str(expected).strip().lower()
                    if not passed:
                        all_passed = False
                    status_str = 'PASS' if passed else 'FAIL'
                    print(f"___ACADMIX_STATUS_{{status_str}}___")
                
                print(result) # Exactly what the user wants to see
            except SystemExit:
                pass # allow clean exit
            except Exception as e:
                print(f"Execution Error: {{e}}")
                all_passed = False
            finally:
                print("___ACADMIX_SEP___")
except Exception as e:
    all_passed = False

if all_passed and test_cases:
    print("___ACADMIX_OK___")
print("___ACADMIX_END___")
"""

router = APIRouter()

@router.get("/challenges")
async def get_challenges(page: int = 1, limit: int = 20, difficulty: str = "", topic: str = "", session: AsyncSession = Depends(get_db)):
    from sqlalchemy import func as sa_func

    # Build base filter
    base_filter = select(models.PremiumCodingChallenge).where(models.PremiumCodingChallenge.is_live == True)
    if difficulty:
        base_filter = base_filter.where(sa_func.lower(models.PremiumCodingChallenge.difficulty) == difficulty.lower())
    if topic:
        # JSONB containment: topics column contains the given topic string
        base_filter = base_filter.where(
            models.PremiumCodingChallenge.topics.contains([topic])
        )

    # Count query (uses same filters, no LIMIT)
    count_stmt = select(sa_func.count()).select_from(base_filter.subquery())
    total = (await session.execute(count_stmt)).scalar() or 0

    # Paginated data query — push LIMIT/OFFSET to SQL
    offset = (page - 1) * limit
    data_stmt = base_filter.order_by(models.PremiumCodingChallenge.created_at.desc()).offset(offset).limit(limit)
    result = await session.execute(data_stmt)
    page_data = result.scalars().all()

    # Expose only unhidden test cases securely to the frontend
    def _map_challenge(c):
        safe_tc = [tc for tc in (c.test_cases or []) if not tc.get("is_hidden", False)]
        return {
            "id": str(c.id), "title": c.title, "description": c.description,
            "difficulty": c.difficulty, "topics": c.topics,
            "language_support": c.language_support, "constraints": c.constraints,
            "problem_ai_context": c.problem_ai_context,
            "test_cases": safe_tc,
            "init_code": c.init_code or {},
            "template_code": c.init_code.get("python", "") if c.init_code else None
        }


    return {
        "data": [_map_challenge(c) for c in page_data],
        "total": total,
        "page": page,
        "limit": limit
    }


@router.get("/challenges/stats")
async def get_challenge_stats(user: dict = Depends(get_current_user), session: AsyncSession = Depends(get_db)):
    stmt = select(models.PremiumCodingChallenge).join(
        models.PremiumChallengeProgress,
        models.PremiumCodingChallenge.id == models.PremiumChallengeProgress.challenge_id
    ).where(
        models.PremiumChallengeProgress.student_id == user["id"],
        models.PremiumChallengeProgress.status == "completed"
    )
    cr = await session.execute(stmt)
    solved_challenges = cr.scalars().all()
    
    easy = medium = hard = 0
    topics_count = {}
    
    for c in solved_challenges:
        d = getattr(c, "difficulty", "easy").lower()
        if d == "easy": easy += 1
        elif d == "medium": medium += 1
        elif d == "hard": hard += 1
        for t in (c.topics or []):
            topics_count[t] = topics_count.get(t, 0) + 1
            
    return {"total_solved": len(solved_challenges), "difficulty": {"Easy": easy, "Medium": medium, "Hard": hard}, "topics": topics_count}


@router.post("/challenges/run")
@limiter.limit("30/minute")
async def run_challenge(request: Request, req: ChallengeRunTest, user: dict = Depends(get_current_user), session: AsyncSession = Depends(get_db)):
    lang_timeout = TIMEOUT_CONFIG.get(req.language.lower(), 15.0)
    
    # Standardize the dict list
    tc_list = [tc.dict() for tc in req.test_cases]
    if req.language.lower() == "python":
        sandbox_code = _build_python_sandbox(req.code, tc_list)
    else:
        sandbox_code = req.code # Fallback to raw for untracked languages
        
    @tenacity.retry(
        stop=tenacity.stop_after_attempt(3),
        wait=tenacity.wait_exponential(multiplier=1, min=1, max=10),
        retry=tenacity.retry_if_exception_type((httpx.RequestError, httpx.TimeoutException)),
        reraise=True
    )
    async def _do_request():
        return await _http_client.post(
            f"{settings.CODE_RUNNER_URL}/run",
            json={"language": req.language, "code": sandbox_code, "test_input": ""},
            timeout=lang_timeout,
            headers={"X-Internal-Token": settings.CODE_RUNNER_TOKEN}
        )

    try:
        resp = await _do_request()
        if resp.status_code == 200:
            result = resp.json()
            return {"output": result.get("output") or "", "error": result.get("error", ""), "exit_code": result.get("exit_code", -1), "success": result.get("exit_code", -1) == 0}
        
        # Pass through the actual runner error correctly
        try:
            err_json = resp.json()
            err_msg = err_json.get("detail", err_json.get("error", "Code runner service error"))
        except:
            err_msg = resp.text or "Code runner service error"
        return {"error": err_msg, "exit_code": -1, "success": False}
    except Exception as e:
        return {"error": str(e), "exit_code": -1, "success": False}

@router.post("/challenges/submit")
@limiter.limit("30/minute")
async def submit_challenge(request: Request, req: ChallengeSubmit, user: dict = Depends(get_current_user), session: AsyncSession = Depends(get_db)):
    cr = await session.execute(select(models.PremiumCodingChallenge).where(models.PremiumCodingChallenge.id == req.challenge_id))
    challenge = cr.scalars().first()
    
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
        
    lang_timeout = TIMEOUT_CONFIG.get(req.language.lower(), 60.0)
    
    if req.language.lower() == "python":
        sandbox_code = _build_python_sandbox(req.code, challenge.test_cases or [])
    else:
        sandbox_code = req.code # Raw passthrough for SQL or unsupported architectures

    @tenacity.retry(
        stop=tenacity.stop_after_attempt(3),
        wait=tenacity.wait_exponential(multiplier=1, min=1, max=10),
        retry=tenacity.retry_if_exception_type((httpx.RequestError, httpx.TimeoutException)),
        reraise=True
    )
    async def _do_request():
        return await _http_client.post(
            f"{settings.CODE_RUNNER_URL}/run",
            json={"language": req.language, "code": sandbox_code, "test_input": ""},
            timeout=lang_timeout,
            headers={"X-Internal-Token": settings.CODE_RUNNER_TOKEN}
        )

    try:
        resp = await _do_request()
        
        if resp.status_code == 200:
            result = resp.json()
            exit_code = result.get("exit_code", -1)
            output = result.get("output") or ""
            
            # Is success requires exit_code 0 AND the AcadMix OK marker (unless fallback language)
            is_success = exit_code == 0
            if req.language.lower() == "python":
                is_success = is_success and "___ACADMIX_OK___" in output
                
            if is_success:
                pr = await session.execute(select(models.PremiumChallengeProgress).where(models.PremiumChallengeProgress.student_id == user["id"], models.PremiumChallengeProgress.challenge_id == req.challenge_id))
                prog = pr.scalars().first()
                if not prog:
                    prog = models.PremiumChallengeProgress(
                        college_id=user.get("college_id"),
                        student_id=user["id"], 
                        challenge_id=req.challenge_id, 
                        status="completed", 
                        language_used=req.language
                    )
                    session.add(prog)
                else:
                    prog.status = "completed"
                await session.commit()
                
            return {"output": output, "error": result.get("error", ""),
                    "exit_code": exit_code, "success": is_success}
                    
        # Pass through the actual runner error correctly
        try:
            err_json = resp.json()
            err_msg = err_json.get("detail", err_json.get("error", "Code runner service error"))
        except:
            err_msg = resp.text or "Code runner service error"
        return {"error": err_msg, "exit_code": -1, "success": False}
    except Exception as e:
        return {"error": str(e), "exit_code": -1, "success": False}
