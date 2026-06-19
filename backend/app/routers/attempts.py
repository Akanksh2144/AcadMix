from app.core.limiter import limiter
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from datetime import datetime, timezone

from database import get_db
from app.core.security import get_current_user
from app.core.security import require_role
from app.core.audit import log_audit
from app import models
import app.schemas as server_schemas
from app.schemas import *
import os
import uuid
import base64
import json
from app.routers import websocket as ws_router
from app.services.llm_gateway import gateway
from app.core.config import settings
import httpx

_http_client = httpx.AsyncClient(
    limits=httpx.Limits(max_keepalive_connections=50, max_connections=100),
    timeout=httpx.Timeout(30.0, connect=5.0)
)

def _build_python_sandbox(user_code: str, test_cases_list: list) -> str:
    # Standardize the keys: make sure all test cases have input_data and expected_output
    standardized = []
    for tc in test_cases_list:
        inp = tc.get("input_data") or tc.get("input") or ""
        out = tc.get("expected_output") or tc.get("output") or ""
        standardized.append({"input_data": str(inp), "expected_output": str(out)})
        
    escaped_tc = json.dumps(standardized)
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
        has_solve = False
        try:
            _ = solve
            has_solve = True
        except NameError:
            pass

        import io
        import contextlib
        print("___ACADMIX_START_TESTS___")
        for idx, tc in enumerate(test_cases):
            f = io.StringIO()
            with contextlib.redirect_stdout(f):
                try:
                    result = None
                    if has_solve:
                        raw_inp = tc['input_data']
                        parsed = safe_parse(raw_inp)
                        args = parsed if isinstance(parsed, tuple) and not raw_inp.strip().startswith("build_") else (parsed,)
                        result = solve(*args)
                except SystemExit:
                    pass
                except Exception as e:
                    print(f"Execution Error: {{e}}")
                    all_passed = False

            output_str = f.getvalue()
            actual_res = str(result) if result is not None else output_str.strip()
            
            expected = tc.get('expected_output')
            if expected is not None:
                passed = actual_res.strip().lower() == str(expected).strip().lower()
                if not passed:
                    all_passed = False
                status_str = 'PASS' if passed else 'FAIL'
                print(f"___ACADMIX_STATUS_{{status_str}}___")
            
            print(actual_res)
            print("___ACADMIX_SEP___")
except Exception as e:
    all_passed = False

if all_passed and test_cases:
    print("___ACADMIX_OK___")
print("___ACADMIX_END___")
"""

async def evaluate_coding_answer(user_code: str, question_content: dict, max_marks: float) -> tuple[bool, float]:
    """Evaluates student's code using the code-runner sandbox.
    Returns (is_correct, marks_awarded).
    """
    if not user_code or not user_code.strip():
        return False, 0.0

    language = question_content.get("language", "python").lower()
    test_cases = question_content.get("test_cases") or question_content.get("testCases") or []

    # If no code runner URL is set, fall back to simple 50% credit for non-empty code
    if not settings.CODE_RUNNER_URL:
        return False, round(max_marks * 0.5, 2)

    if language == "python":
        sandbox_code = _build_python_sandbox(user_code, test_cases)
    else:
        sandbox_code = user_code

    try:
        resp = await _http_client.post(
            f"{settings.CODE_RUNNER_URL}/run",
            json={"language": language, "code": sandbox_code, "test_input": ""},
            timeout=30.0,
            headers={"X-Internal-Token": settings.CODE_RUNNER_TOKEN}
        )
        if resp.status_code == 200:
            res = resp.json()
            exit_code = res.get("exit_code", -1)
            output = res.get("output") or ""
            
            if exit_code == 0:
                if language == "python" and test_cases:
                    total_cases = len(test_cases)
                    passed_cases = output.count("___ACADMIX_STATUS_PASS___")
                    if total_cases > 0:
                        marks_awarded = round(max_marks * (passed_cases / total_cases), 2)
                        is_correct = passed_cases == total_cases
                        return is_correct, marks_awarded
                
                # Default success fallback (all pass or non-python success)
                return True, max_marks
            else:
                return False, 0.0
    except Exception as e:
        import logging
        logging.getLogger("acadmix.evaluation").warning(f"Error executing code runner: {e}")
        return False, round(max_marks * 0.5, 2)
        
    return False, 0.0

router = APIRouter()


@router.post("/attempts/{attempt_id}/answer")
@limiter.limit("60/minute")
async def submit_answer(attempt_id: str, req: AnswerSubmit, request: Request, user: dict = Depends(get_current_user), session: AsyncSession = Depends(get_db)):
    result = await session.execute(
        select(models.QuizAttempt).where(
            models.QuizAttempt.id == attempt_id,
            models.QuizAttempt.student_id == user["id"]
        )
    )
    attempt = result.scalars().first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    if attempt.status != "in_progress":
        raise HTTPException(status_code=400, detail="Attempt already submitted")

    # Map index to actual Question UUID
    qr = await session.execute(
        select(models.Question.id)
        .where(models.Question.quiz_id == attempt.quiz_id)
        .order_by(models.Question.id)
    )
    q_ids = qr.scalars().all()
    if req.question_index < 0 or req.question_index >= len(q_ids):
        raise HTTPException(status_code=400, detail="Invalid question index")
    actual_question_id = q_ids[req.question_index]

    # Save answer as a QuizAnswer row
    existing_ans = await session.execute(
        select(models.QuizAnswer).where(
            models.QuizAnswer.attempt_id == attempt_id,
            models.QuizAnswer.question_id == actual_question_id
        )
    )
    ans_row = existing_ans.scalars().first()
    if ans_row:
        ans_row.code_submitted = str(req.answer) if req.answer is not None else None
    else:
        ans_row = models.QuizAnswer(
            college_id=user["college_id"],
            attempt_id=attempt_id,
            question_id=actual_question_id,
            code_submitted=str(req.answer) if req.answer is not None else None,
        )
        session.add(ans_row)
    # Track first interaction time
    if not attempt.start_time:
        attempt.start_time = datetime.now(timezone.utc)
    await session.commit()
    return {"message": "Answer saved", "question_index": req.question_index}


@router.post("/attempts/{attempt_id}/violation")
async def log_violation(attempt_id: str, req: ViolationReport = ViolationReport(), user: dict = Depends(get_current_user), session: AsyncSession = Depends(get_db)):
    result = await session.execute(
        select(models.QuizAttempt).join(models.Quiz, models.Quiz.id == models.QuizAttempt.quiz_id)
        .where(models.QuizAttempt.id == attempt_id, models.Quiz.college_id == user["college_id"])
    )
    attempt = result.scalars().first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
        
    evidence_url = None
    suspicion_score = 1.0
    violation_type = req.violation_type

    if req.evidence and req.evidence.startswith("data:image/"):
        try:
            header, encoded = req.evidence.split(",", 1)
            ext = header.split(";")[0].split("/")[1]
            file_id = str(uuid.uuid4())
            filename = f"{file_id}.{ext}"
            
            upload_dir = os.path.join(os.getcwd(), "uploads", "proctoring")
            os.makedirs(upload_dir, exist_ok=True)
            filepath = os.path.join(upload_dir, filename)
            
            with open(filepath, "wb") as f:
                f.write(base64.b64decode(encoded))
            
            evidence_url = f"/api/uploads/proctoring/{filename}"
            
            # Hybrid Object Detection via Gemini
            try:
                with open(filepath, "rb") as f:
                    img_bytes = f.read()
                
                vision_prompt = [{"role": "user", "content": "Analyze this image. Is there a mobile phone, book, or another person visible? Reply strictly in JSON format like {\"phone_detected\": false, \"book_detected\": false, \"multiple_people\": false, \"confidence\": 0.9}."}]
                vision_result = await gateway.complete(
                    "proctoring_vision", 
                    messages=vision_prompt, 
                    json_mode=True, 
                    media_bytes=img_bytes, 
                    mime_type=f"image/{ext}"
                )
                data = json.loads(vision_result)
                
                if data.get("phone_detected") or data.get("book_detected") or data.get("multiple_people"):
                    suspicion_score = 5.0
                    if data.get("phone_detected"):
                        violation_type = "mobile_phone_detected"
                    elif data.get("book_detected"):
                        violation_type = "book_detected"
                    else:
                        violation_type = "multiple_people_detected"
            except Exception as e:
                # Silently fail vision API, keep standard score
                import logging
                logging.getLogger("acadmix.ws").warning(f"Vision API failed: {e}")
        except Exception as e:
            import logging
            logging.getLogger("acadmix.ws").warning(f"Image decode failed: {e}")
            
    violation = models.ProctoringViolation(
        college_id=user["college_id"],
        attempt_id=attempt_id,
        violation_type=violation_type,
        suspicion_score=suspicion_score,
        evidence_url=evidence_url
    )
    session.add(violation)
    
    from sqlalchemy import func
    attempt.telemetry_strikes = func.coalesce(models.QuizAttempt.telemetry_strikes, 0) + 1
    
    await log_audit(session, user["id"], "proctoring_violation", "create", {"attempt_id": attempt_id, "type": violation_type})
    await session.commit()
    
    # Broadcast Live Event to Faculty Dashboard
    try:
        await ws_router.broadcast_quiz_event(attempt.quiz_id, {
            "event": "violation",
            "student_id": attempt.student_id,
            "type": violation_type,
            "evidence_url": evidence_url,
            "suspicion_score": suspicion_score,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        import logging
        logging.getLogger("acadmix.ws").error(f"WS Broadcast failed: {e}")
    
    # Count total violations for this attempt
    count_r = await session.execute(
        select(models.ProctoringViolation).where(models.ProctoringViolation.attempt_id == attempt_id)
    )
    total = len(count_r.scalars().all())
    
    return {"message": "Violation logged", "total_violations": total, "evidence_url": evidence_url}


@router.post("/attempts/{attempt_id}/submit")
@limiter.limit("3/minute")
async def submit_attempt(attempt_id: str, request: Request, user: dict = Depends(get_current_user), session: AsyncSession = Depends(get_db)):
    result = await session.execute(
        select(models.QuizAttempt).where(
            models.QuizAttempt.id == attempt_id,
            models.QuizAttempt.student_id == user["id"]
        )
    )
    attempt = result.scalars().first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    if attempt.status == "submitted":
        raise HTTPException(status_code=400, detail="Already submitted")

    quiz_r = await session.execute(select(models.Quiz).where(models.Quiz.id == attempt.quiz_id))
    quiz = quiz_r.scalars().first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions_r = await session.execute(select(models.Question).where(models.Question.quiz_id == quiz.id).order_by(models.Question.id))
    questions = questions_r.scalars().all()

    answers_r = await session.execute(select(models.QuizAnswer).where(models.QuizAnswer.attempt_id == attempt_id))
    answers_map = {a.question_id: a for a in answers_r.scalars().all()}

    # ── Gather and run coding evaluations concurrently ────────────────────
    coding_tasks = []
    coding_indices = []
    
    for i, q in enumerate(questions):
        if q.type == "coding":
            ans_row = answers_map.get(q.id)
            student_answer = ans_row.code_submitted if ans_row else None
            coding_tasks.append(
                evaluate_coding_answer(student_answer, q.content or {}, q.marks)
            )
            coding_indices.append(i)
            
    import asyncio
    coding_results = await asyncio.gather(*coding_tasks) if coding_tasks else []
    coding_lookup = {idx: res for idx, res in zip(coding_indices, coding_results)}

    score = 0.0
    results = []
    total_marks = sum(q.marks for q in questions)

    for i, q in enumerate(questions):
        content = q.content or {}
        student_answer = None
        ans_row = answers_map.get(q.id)
        if ans_row:
            student_answer = ans_row.code_submitted

        is_correct = False
        marks_awarded = 0.0
        q_type = q.type

        if q_type in ("mcq", "mcq-single", "boolean"):
            correct_ans = content.get("correctAnswer") or content.get("correct_answer")
            if student_answer is not None and student_answer == str(correct_ans):
                is_correct = True
                marks_awarded = q.marks
        elif q_type in ("multiple", "mcq-multiple"):
            import json
            correct_set = set(content.get("correctAnswers") or content.get("correct_answers", []))
            try:
                sel = json.loads(student_answer) if student_answer else []
            except Exception:
                sel = []
            if correct_set == set(sel):
                is_correct = True
                marks_awarded = q.marks
        elif q_type == "short":
            expected = str(content.get("expectedAnswer") or content.get("expected_answer", "")).strip()
            if student_answer and expected and student_answer.strip().lower() == expected.lower():
                is_correct = True
                marks_awarded = q.marks
            elif student_answer:
                marks_awarded = round(q.marks * 0.5)
        elif q_type == "coding":
            is_correct, marks_awarded = coding_lookup.get(i, (False, 0.0))

        score += marks_awarded

        # Update the answer row with grading
        if ans_row:
            ans_row.is_correct = is_correct
            ans_row.marks_awarded = marks_awarded

        results.append({
            "question_index": i, "type": q_type,
            "student_answer": student_answer, "is_correct": is_correct,
            "marks_awarded": marks_awarded, "max_marks": q.marks
        })

    percentage = round((score / total_marks) * 100, 1) if total_marks > 0 else 0
    attempt.status = "submitted"
    attempt.final_score = percentage
    attempt.end_time = datetime.now(timezone.utc)
    await session.commit()

    return {
        "id": attempt.id, "quiz_id": attempt.quiz_id, "student_id": attempt.student_id,
        "status": attempt.status, "final_score": attempt.final_score,
        "percentage": percentage, "results": results,
        "submitted_at": attempt.end_time.isoformat()
    }


@router.get("/attempts/{attempt_id}/result")
async def get_attempt_result(attempt_id: str, user: dict = Depends(get_current_user), session: AsyncSession = Depends(get_db)):
    result = await session.execute(
        select(models.QuizAttempt).join(models.Quiz, models.Quiz.id == models.QuizAttempt.quiz_id)
        .where(models.QuizAttempt.id == attempt_id, models.Quiz.college_id == user["college_id"])
    )
    attempt = result.scalars().first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    if user["role"] == "student" and attempt.student_id != user["id"]:
        raise HTTPException(status_code=403, detail="Not your attempt")
    return {
        "id": attempt.id, "quiz_id": attempt.quiz_id, "student_id": attempt.student_id,
        "status": attempt.status, "final_score": attempt.final_score,
        "start_time": attempt.start_time.isoformat() if attempt.start_time else None,
        "end_time": attempt.end_time.isoformat() if attempt.end_time else None,
    }


@router.get("/attempts")
async def list_attempts(quiz_id: Optional[str] = None, user: dict = Depends(get_current_user), session: AsyncSession = Depends(get_db)):
    # JOIN Quiz to enforce tenant isolation — QuizAttempt has no college_id column
    stmt = select(models.QuizAttempt).join(
        models.Quiz, models.Quiz.id == models.QuizAttempt.quiz_id
    ).where(
        models.QuizAttempt.status == "submitted",
        models.Quiz.college_id == user["college_id"],
    )
    if user["role"] == "student":
        stmt = stmt.where(models.QuizAttempt.student_id == user["id"])
    if quiz_id:
        stmt = stmt.where(models.QuizAttempt.quiz_id == quiz_id)
    result = await session.execute(stmt.order_by(models.QuizAttempt.end_time.desc()))
    attempts = result.scalars().all()
    return [{
        "id": a.id, "quiz_id": a.quiz_id, "student_id": a.student_id,
        "status": a.status, "final_score": a.final_score,
        "submitted_at": a.end_time.isoformat() if a.end_time else None
    } for a in attempts]
