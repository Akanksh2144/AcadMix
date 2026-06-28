import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport

from app.main import app
from database import get_db
from app import models
from app.core.security import get_current_user

pytestmark = pytest.mark.asyncio

class MockUser:
    def __init__(self, id, name, email, role, college_id):
        self.id = id
        self.name = name
        self.email = email
        self.role = role
        self.college_id = college_id
        self.profile_data = {"department": "Computer Science"}
        self.is_deleted = False

class MockStaffProfile:
    def __init__(self, user_id, employee_code, designation, department):
        self.user_id = user_id
        self.employee_code = employee_code
        self.designation = designation
        self.department = department
        self.college_id = "test-college"
        self.is_deleted = False

@pytest_asyncio.fixture
async def mock_db():
    session = AsyncMock()
    session.add = MagicMock()
    return session

@pytest_asyncio.fixture
async def auth_admin():
    return {
        "id": "adm-123",
        "role": "admin",
        "email": "admin@test.edu",
        "name": "Test Admin",
        "college_id": "test-college"
    }

@pytest_asyncio.fixture
async def auth_hod():
    return {
        "id": "hod-123",
        "role": "hod",
        "email": "hod@test.edu",
        "name": "Test HOD",
        "college_id": "test-college",
        "profile_data": {"department_id": "CS", "department": "Computer Science"}
    }

class TestAttendanceManagementRouter:
    async def test_record_daily_punch_check_in_and_check_out(self, mock_db, auth_admin):
        app.dependency_overrides[get_db] = lambda: mock_db
        app.dependency_overrides[get_current_user] = lambda: auth_admin

        # Mock resolving user:
        # First execution query - user ID check
        # Second execution query - daily record check
        mock_user_res = MagicMock()
        mock_user_res.scalar.return_value = "usr-123"

        mock_record_res = MagicMock()
        mock_record_res.scalars.return_value.first.return_value = None  # No check-in yet

        mock_db.execute.side_effect = [
            mock_user_res,
            mock_record_res
        ]

        payload = {
            "identifier": "usr-123",
            "timestamp": "2026-06-28T09:00:00Z",
            "source": "rfid",
            "device_id": "gate-1"
        }

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            with patch("app.core.security.get_current_user", new_callable=AsyncMock) as mock_get_user:
                mock_get_user.return_value = auth_admin
                
                resp = await client.post("/api/attendance/daily/punch", json=payload)
                assert resp.status_code == 200
                body = resp.json()
                assert "data" in body
                data = body["data"]
                assert "Checked in successfully" in data["message"]
                assert data["user_id"] == "usr-123"

        app.dependency_overrides.clear()

    async def test_get_daily_staff_summary(self, mock_db, auth_hod):
        app.dependency_overrides[get_db] = lambda: mock_db
        app.dependency_overrides[get_current_user] = lambda: auth_hod

        # Mock staff list query:
        mock_staff_rows = [
            (
                MockUser("tch-123", "Teacher One", "t1@test.edu", "teacher", "test-college"),
                MockStaffProfile("tch-123", "EMP001", "Professor", "Computer Science")
            )
        ]
        mock_staff_res = MagicMock()
        mock_staff_res.all.return_value = mock_staff_rows

        mock_att_res = MagicMock()
        mock_att_res.scalars.return_value.first.return_value = None

        mock_db.execute.side_effect = [
            mock_staff_res,
            mock_att_res
        ]

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            with patch("app.core.security.get_current_user", new_callable=AsyncMock) as mock_get_user:
                mock_get_user.return_value = auth_hod
                
                resp = await client.get("/api/attendance/daily/staff-summary?department=Computer%20Science")
                assert resp.status_code == 200
                body = resp.json()
                assert "data" in body
                data = body["data"]
                assert isinstance(data, list)
                assert len(data) == 1
                assert data[0]["name"] == "Teacher One"
                assert data[0]["employee_code"] == "EMP001"
                assert data[0]["status"] == "absent"

        app.dependency_overrides.clear()

    @patch("app.services.omnichannel_workers.dispatch_whatsapp_message", new_callable=AsyncMock)
    async def test_trigger_defaulter_alerts_sends_whatsapp(self, mock_dispatch, mock_db, auth_hod):
        app.dependency_overrides[get_db] = lambda: mock_db
        app.dependency_overrides[get_current_user] = lambda: auth_hod

        # Mock get_defaulters output via service patch or mock
        mock_defaulters = [
            {
                "student_id": "stu-789",
                "name": "Student A",
                "roll_no": "R001",
                "subject_code": "CS101",
                "present_slots": 5,
                "total_slots": 10,
                "percentage": 50.0
            }
        ]

        # In AttendanceService, trigger_defaulter_alerts first calls self.get_defaulters.
        # Let's mock execution sequence:
        # 1. Course name query
        mock_course_res = MagicMock()
        mock_course_res.scalar.return_value = "Intro to CS"

        # 2. Parent link query
        mock_parent_res = MagicMock()
        mock_parent_res.scalar.return_value = "prnt-123"

        # 3. Parent phone query
        mock_phone_res = MagicMock()
        mock_phone_res.scalar.return_value = "919999999999"

        # 4. Attendance counts query
        mock_counts_res = MagicMock()
        mock_counts_res.first.return_value = MagicMock(present_count=5, total_count=10)

        # 5. Mentor query
        mock_mentor_res = MagicMock()
        mock_mentor_res.scalar.return_value = "mentor-123"

        # 6. Mentor phone query
        mock_mentor_phone_res = MagicMock()
        mock_mentor_phone_res.scalar.return_value = "918888888888"

        mock_db.execute.side_effect = [
            mock_course_res,
            mock_parent_res,
            mock_phone_res,
            mock_counts_res,
            mock_mentor_res,
            mock_mentor_phone_res
        ]

        # Patch the get_defaulters method inside AttendanceService
        with patch("app.services.attendance_service.AttendanceService.get_defaulters", new_callable=AsyncMock) as mock_get_def:
            mock_get_def.return_value = mock_defaulters

            payload = {
                "threshold": 75.0,
                "academic_year": "2026-27"
            }

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                with patch("app.core.security.get_current_user", new_callable=AsyncMock) as mock_get_user:
                    mock_get_user.return_value = auth_hod
                    
                    resp = await client.post("/api/hod/attendance/send-defaulter-alerts", json=payload)
                    assert resp.status_code == 200
                    body = resp.json()
                    assert "data" in body
                    assert body["data"]["count"] == 1
                    assert mock_dispatch.call_count == 2
                    
                    # Verify first call is to parent
                    assert mock_dispatch.call_args_list[0][0][0] == "919999999999"
                    assert "Dear Parent" in mock_dispatch.call_args_list[0][0][1]
                    
                    # Verify second call is to mentor
                    assert mock_dispatch.call_args_list[1][0][0] == "918888888888"
                    assert "Dear Mentor" in mock_dispatch.call_args_list[1][0][1]

        app.dependency_overrides.clear()

    async def test_upload_daily_attendance_csv(self, mock_db, auth_hod):
        app.dependency_overrides[get_db] = lambda: mock_db
        app.dependency_overrides[get_current_user] = lambda: auth_hod

        mock_user_res = MagicMock()
        mock_user_res.scalar.return_value = "usr-789"

        mock_record_res = MagicMock()
        mock_record_res.scalars.return_value.first.return_value = None

        mock_db.execute.side_effect = [
            mock_user_res,
            mock_record_res
        ]

        csv_content = (
            "identifier,timestamp,source\n"
            "usr-789,2026-06-28 09:15:00,csv_import\n"
        )
        files = {
            "file": ("logs.csv", csv_content, "text/csv")
        }

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            with patch("app.core.security.get_current_user", new_callable=AsyncMock) as mock_get_user:
                mock_get_user.return_value = auth_hod
                
                resp = await client.post("/api/attendance/daily/upload-logs", files=files)
                assert resp.status_code == 200
                body = resp.json()
                assert "data" in body
                data = body["data"]
                assert data["success_count"] == 1
                assert data["error_count"] == 0

        app.dependency_overrides.clear()

    async def test_upload_rfid_mapping_csv(self, mock_db, auth_admin):
        app.dependency_overrides[get_db] = lambda: mock_db
        app.dependency_overrides[get_current_user] = lambda: auth_admin

        mock_profile = MagicMock()
        mock_profile.extra_data = {}

        mock_profile_res = MagicMock()
        mock_profile_res.scalar.return_value = mock_profile

        mock_db.execute.side_effect = [
            mock_profile_res
        ]

        csv_content = (
            "roll_no,rfid_uid\n"
            "ROLL001,CARD12345\n"
        )
        files = {
            "file": ("mapping.csv", csv_content, "text/csv")
        }

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            with patch("app.core.security.get_current_user", new_callable=AsyncMock) as mock_get_user:
                mock_get_user.return_value = auth_admin
                
                resp = await client.post("/api/admin/attendance/upload-rfid-mapping", files=files)
                assert resp.status_code == 200
                body = resp.json()
                assert "data" in body
                data = body["data"]
                assert data["success_count"] == 1
                assert data["error_count"] == 0
                assert mock_profile.extra_data["rfid_uid"] == "CARD12345"

        app.dependency_overrides.clear()

