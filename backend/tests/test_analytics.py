import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport

from app.main import app
from database import get_db
from app import models

pytestmark = pytest.mark.asyncio

# Mock models representing database records
class MockFacultyAssignment:
    def __init__(self, id, subject_code, subject_name, department, batch, section):
        self.id = id
        self.subject_code = subject_code
        self.subject_name = subject_name
        self.department = department
        self.batch = batch
        self.section = section
        self.college_id = "test-college"
        self.teacher_id = "tch-123"

class MockRow:
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

@pytest_asyncio.fixture
async def mock_db():
    session = AsyncMock()
    return session

@pytest_asyncio.fixture
async def auth_teacher():
    return {
        "id": "tch-123",
        "role": "teacher",
        "email": "teacher@test.edu",
        "name": "Test Teacher",
        "college_id": "test-college",
        "department": "DS"
    }

class TestAnalyticsRouter:
    async def test_class_results_analytics_success(self, mock_db, auth_teacher):
        # Override get_db dependency
        app.dependency_overrides[get_db] = lambda: mock_db

        # Mock query results
        # 1. Faculty assignments
        mock_assignment = MockFacultyAssignment("fa-1", "DS301", "Data Structures", "DS", 2026, "A")
        mock_assignments_result = MagicMock()
        mock_assignments_result.scalars.return_value.all.return_value = [mock_assignment]

        # 2. Student counts
        mock_count_row = MockRow(department="DS", batch=2026, section="A", cnt=15)
        mock_counts_result = MagicMock()
        mock_counts_result.all.return_value = [mock_count_row]

        # 3. Quiz attempts
        mock_attempts_result = MagicMock()
        mock_attempts_result.all.return_value = []

        # 4. Mid term submissions
        mock_mid_result = MagicMock()
        mock_mid_result.all.return_value = []

        # Mock execute to return our mocked results in order of execution
        mock_db.execute.side_effect = [
            mock_assignments_result,
            mock_counts_result,
            mock_attempts_result,
            mock_mid_result
        ]

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            with patch("app.core.security.get_current_user", new_callable=AsyncMock) as mock_get_current_user:
                mock_get_current_user.return_value = auth_teacher
                resp = await client.get("/api/analytics/teacher/class-results")
                assert resp.status_code == 200
                body = resp.json()
                
                assert "data" in body
                data = body["data"]
                assert "assignedClasses" in data
                classes = data["assignedClasses"]
                assert len(classes) == 1
                assert classes[0]["rawSection"] == "A"
                assert classes[0]["totalStudents"] == 15

        # Clean up overrides
        app.dependency_overrides.clear()

    async def test_get_quiz_detailed_analytics_with_filters(self, mock_db, auth_teacher):
        # Override get_db dependency
        app.dependency_overrides[get_db] = lambda: mock_db

        # Mock query results
        mock_student = MagicMock()
        mock_student.id = "stu-1"
        mock_student.name = "Aarav Sharma"
        mock_student.profile_data = {"college_id": "22WJ8A6745"}

        mock_students_result = MagicMock()
        mock_students_result.scalars.return_value.all.return_value = [mock_student]

        mock_attempts_result = MagicMock()
        mock_attempts_result.scalars.return_value.all.return_value = []

        mock_db.execute.side_effect = [
            mock_students_result,
            mock_attempts_result
        ]

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            with patch("app.core.security.get_current_user", new_callable=AsyncMock) as mock_get_current_user:
                mock_get_current_user.return_value = auth_teacher
                # Pass query params to test filtering
                resp = await client.get(
                    "/api/analytics/teacher/quiz-results/quiz-1",
                    params={"department": "DS", "batch": "2026", "section": "A"}
                )
                assert resp.status_code == 200
                body = resp.json()
                
                assert "data" in body
                data = body["data"]
                assert len(data) == 1
                assert data[0]["name"] == "Aarav Sharma"
                assert data[0]["status"] == "Not Attempted"

        # Verify that the query built inside the route executed correct filtering
        called_args = mock_db.execute.call_args_list[0][0][0]
        # Check that inner join was executed on UserProfile
        called_str = str(called_args)
        assert "JOIN user_profiles" in called_str
        assert "user_profiles.department =" in called_str
        assert "user_profiles.batch =" in called_str
        assert "user_profiles.section =" in called_str

        # Clean up overrides
        app.dependency_overrides.clear()
