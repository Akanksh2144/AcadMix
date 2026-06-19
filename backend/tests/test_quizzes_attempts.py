import pytest
import pytest_asyncio
import json
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport

from app.main import app
from database import get_db
from app import models
from app.core.security import get_current_user

pytestmark = pytest.mark.asyncio

class MockUserRow:
    def __init__(self, id, name, role, college_id):
        self.id = id
        self.name = name
        self.role = role
        self.college_id = college_id
        self.profile_data = {"college_id": "STU101"}

class MockQuiz:
    def __init__(self, id, title, duration_minutes, type, college_id):
        self.id = id
        self.title = title
        self.duration_minutes = duration_minutes
        self.type = type
        self.college_id = college_id
        self.status = "active"

class MockQuestion:
    def __init__(self, id, quiz_id, type, marks, content):
        self.id = id
        self.quiz_id = quiz_id
        self.type = type
        self.marks = marks
        self.content = content

class MockQuizAttempt:
    def __init__(self, id, student_id, quiz_id, college_id, status="in_progress"):
        self.id = id
        self.student_id = student_id
        self.quiz_id = quiz_id
        self.college_id = college_id
        self.status = status
        self.start_time = None
        self.end_time = None
        self.final_score = 0.0
        self.telemetry_strikes = 0

class MockQuizAnswer:
    def __init__(self, id, attempt_id, question_id, code_submitted):
        self.id = id
        self.attempt_id = attempt_id
        self.question_id = question_id
        self.code_submitted = code_submitted
        self.is_correct = None
        self.marks_awarded = None
        self.college_id = "test-college"

@pytest_asyncio.fixture
async def mock_db():
    session = AsyncMock()
    session.add = MagicMock()
    return session

@pytest_asyncio.fixture
async def auth_student():
    return {
        "id": "stu-123",
        "role": "student",
        "email": "student@test.edu",
        "name": "Test Student",
        "college_id": "test-college"
    }

class TestQuizzesAttempts:
    async def test_submit_answer_saves_with_college_id(self, mock_db, auth_student):
        app.dependency_overrides[get_db] = lambda: mock_db
        app.dependency_overrides[get_current_user] = lambda: auth_student

        # 1. Mock select QuizAttempt
        mock_attempt_row = MagicMock()
        mock_attempt = MockQuizAttempt("att-123", "stu-123", "quiz-123", "test-college")
        mock_attempt_row.scalars.return_value.first.return_value = mock_attempt

        # 2. Mock select Questions
        mock_q_row = MagicMock()
        mock_q_row.scalars.return_value.all.return_value = ["question-123"]

        # 3. Mock existing answer query (return None so it inserts new one)
        mock_ans_row = MagicMock()
        mock_ans_row.scalars.return_value.first.return_value = None

        mock_db.execute.side_effect = [
            mock_attempt_row,
            mock_q_row,
            mock_ans_row
        ]

        payload = {
            "question_index": 0,
            "answer": "my selected option"
        }

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/attempts/att-123/answer", json=payload)
            assert resp.status_code == 200
            
            # Verify QuizAnswer was added with college_id
            added_ans = mock_db.add.call_args[0][0]
            assert isinstance(added_ans, models.QuizAnswer)
            assert added_ans.college_id == "test-college"
            assert added_ans.attempt_id == "att-123"
            assert added_ans.question_id == "question-123"
            assert added_ans.code_submitted == "my selected option"

        app.dependency_overrides.clear()

    async def test_log_violation_saves_with_college_id_and_increments_strikes(self, mock_db, auth_student):
        app.dependency_overrides[get_db] = lambda: mock_db
        app.dependency_overrides[get_current_user] = lambda: auth_student

        # 1. Mock select QuizAttempt
        mock_attempt_row = MagicMock()
        mock_attempt = MockQuizAttempt("att-123", "stu-123", "quiz-123", "test-college")
        mock_attempt_row.scalars.return_value.first.return_value = mock_attempt

        # 2. Mock select ProctoringViolation count
        mock_count_row = MagicMock()
        mock_count_row.scalars.return_value.all.return_value = ["violation-1"]

        mock_db.execute.side_effect = [
            mock_attempt_row,
            mock_count_row
        ]

        payload = {
            "violation_type": "tab_switch",
            "evidence": None
        }

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/attempts/att-123/violation", json=payload)
            assert resp.status_code == 200
            
            # Verify ProctoringViolation added with college_id
            added_objects = [args[0][0] for args in mock_db.add.call_args_list]
            violation_obj = next(obj for obj in added_objects if isinstance(obj, models.ProctoringViolation))
            assert violation_obj.college_id == "test-college"
            assert violation_obj.attempt_id == "att-123"
            assert violation_obj.violation_type == "tab_switch"

            # Verify telemetry_strikes was incremented
            assert mock_attempt.telemetry_strikes is not None

        app.dependency_overrides.clear()

    async def test_submit_attempt_grades_coding_question_via_sandbox(self, mock_db, auth_student):
        app.dependency_overrides[get_db] = lambda: mock_db
        app.dependency_overrides[get_current_user] = lambda: auth_student

        # 1. Mock QuizAttempt
        mock_attempt_row = MagicMock()
        mock_attempt = MockQuizAttempt("att-123", "stu-123", "quiz-123", "test-college")
        mock_attempt_row.scalars.return_value.first.return_value = mock_attempt

        # 2. Mock Quiz
        mock_quiz_row = MagicMock()
        mock_quiz = MockQuiz("quiz-123", "Quiz 1", 60, "python", "test-college")
        mock_quiz_row.scalars.return_value.first.return_value = mock_quiz

        # 3. Mock Questions: 1 MCQ and 1 Coding
        mcq_question = MockQuestion("q-mcq", "quiz-123", "mcq", 2, {"correctAnswer": "A"})
        coding_question = MockQuestion("q-code", "quiz-123", "coding", 10, {
            "language": "python",
            "test_cases": [{"input": "1 2", "output": "3"}]
        })
        
        mock_qs_row = MagicMock()
        mock_qs_row.scalars.return_value.all.return_value = [mcq_question, coding_question]

        # 4. Mock QuizAnswers
        mcq_answer = MockQuizAnswer("ans-mcq", "att-123", "q-mcq", "A")
        coding_answer = MockQuizAnswer("ans-code", "att-123", "q-code", "def solve(a, b): return a + b")
        
        mock_ans_row = MagicMock()
        mock_ans_row.scalars.return_value.all.return_value = [mcq_answer, coding_answer]

        mock_db.execute.side_effect = [
            mock_attempt_row,
            mock_quiz_row,
            mock_qs_row,
            mock_ans_row
        ]

        # Mock the sandbox post request
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "exit_code": 0,
            "output": "___ACADMIX_START_TESTS___\n___ACADMIX_STATUS_PASS___\n___ACADMIX_SEP___\n___ACADMIX_OK___\n___ACADMIX_END___"
        }

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            with patch("app.routers.attempts._http_client.post", new_callable=AsyncMock) as mock_post:
                mock_post.return_value = mock_response
                
                resp = await client.post("/api/attempts/att-123/submit")
                assert resp.status_code == 200
                body = resp.json()
                
                assert "data" in body
                data = body["data"]
                assert data["status"] == "submitted"
                assert data["final_score"] == 100.0 # Both MCQ (2 marks) and Coding (10 marks) passed
                
                results = data["results"]
                assert len(results) == 2
                assert results[0]["is_correct"] is True
                assert results[0]["marks_awarded"] == 2
                assert results[1]["is_correct"] is True
                assert results[1]["marks_awarded"] == 10

        app.dependency_overrides.clear()
