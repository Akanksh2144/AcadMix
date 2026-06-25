import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient, ASGITransport

from app.main import app
from database import get_db
from app import models

pytestmark = pytest.mark.asyncio

@pytest_asyncio.fixture
async def mock_db():
    session = AsyncMock()
    session.add = MagicMock()
    session.flush = AsyncMock()
    session.commit = AsyncMock()
    return session

@pytest_asyncio.fixture
async def auth_teacher():
    return {
        "id": "teacher-123",
        "role": "teacher",
        "email": "teacher@test.edu",
        "name": "Test Teacher",
        "college_id": "test-college"
    }

class TestLabSessionRestriction:
    async def test_create_session_fails_if_subject_not_assigned(self, mock_db, auth_teacher):
        app.dependency_overrides[get_db] = lambda: mock_db

        # Mock the execute call for FacultyAssignment query to return None (no assignment)
        mock_result = MagicMock()
        mock_result.scalars.return_value.first.return_value = None
        mock_db.execute.return_value = mock_result

        payload = {
            "subject": "CS-101",
            "title": "Lab Exam 1",
            "batch": "2026",
            "section": "A",
            "semester": 1,
            "assignment_mode": "cyclic",
            "questions_per_student": 1
        }

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            with patch("app.core.security.get_current_user", new_callable=AsyncMock) as mock_get_user:
                mock_get_user.return_value = auth_teacher
                resp = await client.post("/api/lab/sessions", json=payload)
                assert resp.status_code == 400
                body = resp.json()
                assert "data" in body
                assert "detail" in body["data"]
                assert "You are not assigned to teach this subject" in body["data"]["detail"]

        app.dependency_overrides.clear()

    async def test_create_session_succeeds_if_subject_assigned(self, mock_db, auth_teacher):
        app.dependency_overrides[get_db] = lambda: mock_db

        # Mock FacultyAssignment query to return a valid assignment
        mock_assignment = models.FacultyAssignment(
            teacher_id="teacher-123",
            college_id="test-college",
            subject_name="CS-101",
            batch="2026",
            section="A",
            semester=1,
            subject_code="CS101",
            department="CSE"
        )
        mock_result1 = MagicMock()
        mock_result1.scalars.return_value.first.return_value = mock_assignment

        # Mock _generate_session_code check to return None (no collision)
        mock_result2 = MagicMock()
        mock_result2.scalars.return_value.first.return_value = None

        mock_db.execute.side_effect = [
            mock_result1, # FacultyAssignment query
            mock_result2  # Session code collision check
        ]

        payload = {
            "subject": "CS-101",
            "title": "Lab Exam 1",
            "batch": "2026",
            "section": "A",
            "semester": 1,
            "assignment_mode": "cyclic",
            "questions_per_student": 1
        }

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            with patch("app.core.security.get_current_user", new_callable=AsyncMock) as mock_get_user:
                mock_get_user.return_value = auth_teacher
                resp = await client.post("/api/lab/sessions", json=payload)
                assert resp.status_code == 200
                body = resp.json()
                assert "data" in body or "id" in body

        app.dependency_overrides.clear()
