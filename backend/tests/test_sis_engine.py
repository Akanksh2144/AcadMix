import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient, ASGITransport
import uuid
from datetime import date, datetime

from app.main import app
from database import get_db
from app import models

pytestmark = pytest.mark.asyncio

class MockUserProfile:
    def __init__(self, user_id="stud-1", college_id="col-1"):
        self.id = "prof-1"
        self.user_id = user_id
        self.college_id = college_id
        self.roll_number = "101"
        self.department = "CSE"
        self.section = "A"
        self.batch = "2024"
        self.current_semester = 4
        self.phone = "1234567890"
        self.blood_group = "O+"
        self.date_of_birth = date(2004, 1, 1)
        self.gender = "Male"
        self.aadhaar_number = "111122223333"
        self.father_name = "Father"
        self.mother_name = "Mother"
        self.address = "Address"
        self.abc_id = "ABC123456"
        self.enrollment_status = "active"
        self.extra_data = {"version": 1, "disciplinary_records": [], "mentoring_logs": [], "documents": []}


@pytest_asyncio.fixture
async def mock_db():
    session = AsyncMock()
    session.add = MagicMock()
    session.info = {"college_id": "col-1"}
    return session


async def test_student_profile_update(mock_db):
    profile = MockUserProfile()
    mock_db.execute.return_value = MagicMock(scalar_one_or_none=MagicMock(return_value=profile))

    def override_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_db

    auth_user = {"id": "stud-1", "college_id": "col-1", "role": "student", "name": "Test Student"}

    with patch("app.core.security.get_current_user", new_callable=AsyncMock) as mock_user:
        mock_user.return_value = auth_user
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.put("/api/student/profile", json={
                "phone": "9999999999",
                "aadhaar_number": "999988887777",
                "city": "Hyderabad"
            })
            assert resp.status_code == 200
            data = resp.json()["data"]
            assert data["version"] == 2
            assert profile.phone == "9999999999"
            assert profile.extra_data["city"] == "Hyderabad"
            # Verify AuditLog added to DB session
            assert any(isinstance(call[0][0], models.AuditLog) for call in mock_db.add.call_args_list)

    app.dependency_overrides.clear()


async def test_admin_update_optimistic_locking_collision(mock_db):
    profile = MockUserProfile()
    profile.extra_data["version"] = 2 # Modified elsewhere
    mock_db.execute.return_value = MagicMock(scalar_one_or_none=MagicMock(return_value=profile))

    def override_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_db

    auth_user = {"id": "admin-1", "college_id": "col-1", "role": "admin", "name": "Admin"}

    with patch("app.core.security.get_current_user", new_callable=AsyncMock) as mock_user:
        mock_user.return_value = auth_user
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.put("/api/students/stud-1/profile", json={
                "enrollment_status": "graduated",
                "expected_version": 1 # Stale version provided
            })
            assert resp.status_code == 409
            assert "Concurrent edit detected" in str(resp.json())

    app.dependency_overrides.clear()


async def test_admin_segregation_of_duties(mock_db):
    def override_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_db

    auth_user = {"id": "staff-stud-1", "college_id": "col-1", "role": "admin", "name": "Admin Student"}

    with patch("app.core.security.get_current_user", new_callable=AsyncMock) as mock_user:
        mock_user.return_value = auth_user
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.put("/api/students/staff-stud-1/profile", json={
                "enrollment_status": "graduated"
            })
            assert resp.status_code == 403
            assert "Segregation of Duties violation" in str(resp.json())

    app.dependency_overrides.clear()


async def test_disciplinary_records_flow(mock_db):
    profile = MockUserProfile()
    mock_db.execute.return_value = MagicMock(scalar_one_or_none=MagicMock(return_value=profile))

    def override_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_db

    auth_user = {"id": "hod-1", "college_id": "col-1", "role": "hod", "name": "HOD CSE"}

    with patch("app.core.security.get_current_user", new_callable=AsyncMock) as mock_user:
        mock_user.return_value = auth_user
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # Post incident
            post_resp = await client.post("/api/students/stud-1/disciplinary", json={
                "incident_type": "Attendance Shortage",
                "severity": "medium",
                "action_taken": "Parents called"
            })
            assert post_resp.status_code == 200
            inc = post_resp.json()["data"]["data"]
            assert inc["severity"] == "medium"
            assert len(profile.extra_data["disciplinary_records"]) == 1

            # Get incidents
            get_resp = await client.get("/api/students/stud-1/disciplinary")
            assert get_resp.status_code == 200
            assert len(get_resp.json()["data"]["data"]) == 1

    app.dependency_overrides.clear()


async def test_document_review_flow(mock_db):
    profile = MockUserProfile()
    doc_id = str(uuid.uuid4())
    profile.extra_data["documents"] = [{
        "id": doc_id,
        "doc_type": "marksheet",
        "filename": "sem1.pdf",
        "status": "pending"
    }]
    mock_db.execute.return_value = MagicMock(scalar_one_or_none=MagicMock(return_value=profile))

    def override_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_db

    auth_user = {"id": "admin-1", "college_id": "col-1", "role": "admin", "name": "Admin"}

    with patch("app.core.security.get_current_user", new_callable=AsyncMock) as mock_user:
        mock_user.return_value = auth_user
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.put(f"/api/students/stud-1/documents/{doc_id}/review", json={
                "status": "verified",
                "remarks": "Original verified"
            })
            assert resp.status_code == 200
            assert profile.extra_data["documents"][0]["status"] == "verified"
            assert profile.extra_data["documents"][0]["reviewed_by"] == "Admin"
            # Verify AuditLog added to DB session
            assert any(isinstance(call[0][0], models.AuditLog) for call in mock_db.add.call_args_list)

    app.dependency_overrides.clear()
