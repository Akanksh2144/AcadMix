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
    def __init__(self, college_id, current_semester):
        self.college_id = college_id
        self.current_semester = current_semester

class MockCourse:
    def __init__(self, id, subject_code, name, credits):
        self.id = id
        self.subject_code = subject_code
        self.name = name
        self.credits = credits
        self.college_id = "test-college"
        self.is_deleted = False

class MockSemesterGrade:
    def __init__(self, id, student_id, semester, course_id, grade, credits_earned, is_supplementary=False):
        self.id = id
        self.college_id = "test-college"
        self.student_id = student_id
        self.semester = semester
        self.course_id = course_id
        self.grade = grade
        self.credits_earned = credits_earned
        self.is_supplementary = is_supplementary
        self.is_deleted = False

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

@pytest_asyncio.fixture
async def auth_teacher():
    return {
        "id": "tch-123",
        "role": "teacher",
        "email": "teacher@test.edu",
        "name": "Test Teacher",
        "college_id": "test-college"
    }

class TestSemesterResultsRouter:
    async def test_get_semester_results_resolves_course_details(self, mock_db, auth_student):
        app.dependency_overrides[get_db] = lambda: mock_db
        app.dependency_overrides[get_current_user] = lambda: auth_student

        # 1. Mock student info query
        mock_student_info = MagicMock()
        mock_student_info.first.return_value = MockUserRow("test-college", 3)

        # 2. Mock SemesterGrade outerjoin Course query
        mock_grade = MockSemesterGrade("grade-1", "stu-123", 1, "DS101", "A", 3)
        mock_grade_row = (mock_grade, "Data Structures", "DS101", 3)
        
        mock_grades_result = MagicMock()
        mock_grades_result.all.return_value = [mock_grade_row]

        # 3. Mock mid term marks query
        mock_mid_result = MagicMock()
        mock_mid_result.all.return_value = []

        # 4. Mock attendance query
        mock_att_result = MagicMock()
        mock_att_result.all.return_value = []

        # Set execute side effects in order of endpoint queries
        mock_db.execute.side_effect = [
            mock_student_info,
            mock_grades_result,
            mock_mid_result,
            mock_att_result
        ]

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            with patch("app.core.security.get_current_user", new_callable=AsyncMock) as mock_get_user:
                mock_get_user.return_value = auth_student
                
                resp = await client.get("/api/results/semester/stu-123")
                assert resp.status_code == 200
                body = resp.json()
                
                assert "data" in body
                data = body["data"]
                assert isinstance(data, list)
                assert len(data) == 1
                sem_data = data[0]
                assert sem_data["semester"] == 1
                assert len(sem_data["subjects"]) == 1
                
                subj = sem_data["subjects"][0]
                assert subj["code"] == "DS101"
                assert subj["name"] == "Data Structures"
                assert subj["credits"] == 3
                assert subj["grade"] == "A"
                assert subj["status"] == "PASS"

        app.dependency_overrides.clear()

    async def test_create_semester_result_resolves_course_uuid_and_sets_college_id(self, mock_db, auth_teacher):
        app.dependency_overrides[get_db] = lambda: mock_db

        # 1. Mock resolving student's college_id
        mock_student_row = MagicMock()
        mock_student_row.scalar_one_or_none.return_value = "test-college"

        # 2. Mock course resolution query by subject_code
        mock_course_row = MagicMock()
        mock_course_row.scalar_one_or_none.return_value = "resolved-course-uuid"

        mock_db.execute.side_effect = [
            mock_student_row,
            mock_course_row
        ]

        payload = {
            "student_id": "stu-123",
            "semester": 2,
            "subjects": [
                {"code": "DS101", "name": "Data Structures", "grade": "O", "credits": 4}
            ],
            "sgpa": 10.0,
            "cgpa": 9.5
        }

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            with patch("app.core.security.get_current_user", new_callable=AsyncMock) as mock_get_user:
                mock_get_user.return_value = auth_teacher
                
                resp = await client.post("/api/results/semester", json=payload)
                assert resp.status_code == 200
                body = resp.json()
                assert "data" in body
                data = body["data"]
                assert data["message"] == "Semester result saved"
                assert data["semester"] == 2

                # Verify session.add was called with a SemesterGrade having the correct college_id and resolved course_id
                added_grade = mock_db.add.call_args[0][0]
                assert isinstance(added_grade, models.SemesterGrade)
                assert added_grade.college_id == "test-college"
                assert added_grade.course_id == "resolved-course-uuid"
                assert added_grade.grade == "O"
                assert added_grade.credits_earned == 4

        app.dependency_overrides.clear()
