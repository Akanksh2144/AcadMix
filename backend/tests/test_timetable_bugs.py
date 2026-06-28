import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient, ASGITransport

from app.main import app
from database import get_db
from app import models
from app.core.security import get_current_user

pytestmark = pytest.mark.asyncio


class MockDepartment:
    def __init__(self, id, code, name, college_id):
        self.id = id
        self.code = code
        self.name = name
        self.college_id = college_id


class MockFacultyAssignment:
    def __init__(self, subject_code, subject_name, semester, is_lab, hours_per_week, college_id, department):
        self.subject_code = subject_code
        self.subject_name = subject_name
        self.semester = semester
        self.is_lab = is_lab
        self.hours_per_week = hours_per_week
        self.college_id = college_id
        self.department = department
        self.is_deleted = False


class MockPeriodSlot:
    def __init__(self, id, college_id, department_id, batch, section, semester, academic_year, day, period_no, start_time, end_time, subject_code, subject_name, faculty_id, room, slot_type="regular"):
        self.id = id
        self.college_id = college_id
        self.department_id = department_id
        self.batch = batch
        self.section = section
        self.semester = semester
        self.academic_year = academic_year
        self.day = day
        self.period_no = period_no
        self.start_time = start_time
        self.end_time = end_time
        self.subject_code = subject_code
        self.subject_name = subject_name
        self.faculty_id = faculty_id
        self.room = room
        self.slot_type = slot_type
        self.is_deleted = False


@pytest_asyncio.fixture
async def mock_db():
    session = AsyncMock()
    session.add = MagicMock()
    return session


@pytest_asyncio.fixture
async def auth_hod():
    return {
        "id": "hod-123",
        "role": "hod",
        "email": "hod@test.edu",
        "name": "Test HOD",
        "college_id": "test-college",
        "department": "CS",
        "scope": {"department": "CS"}
    }


class TestTimetableBugsRouter:
    async def test_get_hod_department_info(self, mock_db, auth_hod):
        app.dependency_overrides[get_db] = lambda: mock_db
        app.dependency_overrides[get_current_user] = lambda: auth_hod

        mock_dept = MockDepartment("dept-uuid-123", "CS", "Computer Science", "test-college")
        mock_res = MagicMock()
        mock_res.scalars.return_value.first.return_value = mock_dept
        mock_db.execute.return_value = mock_res

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            with patch("app.core.security.get_current_user", new_callable=AsyncMock) as mock_get_user:
                mock_get_user.return_value = auth_hod
                resp = await client.get("/api/hod/department-info")
                assert resp.status_code == 200
                body = resp.json()
                assert "data" in body
                data = body["data"]
                assert data["id"] == "dept-uuid-123"
                assert data["code"] == "CS"
                assert data["name"] == "Computer Science"

        app.dependency_overrides.clear()

    async def test_get_hod_timetable_subjects(self, mock_db, auth_hod):
        app.dependency_overrides[get_db] = lambda: mock_db
        app.dependency_overrides[get_current_user] = lambda: auth_hod

        mock_assign1 = MockFacultyAssignment("CS101", "Intro to CS", 3, False, 4, "test-college", "CS")
        mock_assign2 = MockFacultyAssignment("CS102", "Data Structures", 3, True, 6, "test-college", "CS")
        
        mock_res = MagicMock()
        mock_res.all.return_value = [mock_assign1, mock_assign2]
        mock_db.execute.return_value = mock_res

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            with patch("app.core.security.get_current_user", new_callable=AsyncMock) as mock_get_user:
                mock_get_user.return_value = auth_hod
                resp = await client.get("/api/hod/timetable/subjects?semester=3")
                assert resp.status_code == 200
                body = resp.json()
                assert "data" in body
                data = body["data"]
                assert isinstance(data, list)
                assert len(data) == 2
                assert data[0]["code"] == "CS101"
                assert data[1]["code"] == "CS102"
                assert data[1]["is_lab"] is True

        app.dependency_overrides.clear()

    async def test_get_timetable_conflicts_no_conflicts(self, mock_db, auth_hod):
        app.dependency_overrides[get_db] = lambda: mock_db
        app.dependency_overrides[get_current_user] = lambda: auth_hod

        mock_res = MagicMock()
        mock_res.scalars.return_value.all.return_value = []
        mock_db.execute.return_value = mock_res

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            with patch("app.core.security.get_current_user", new_callable=AsyncMock) as mock_get_user:
                mock_get_user.return_value = auth_hod
                resp = await client.get("/api/admin/timetable/conflicts?academic_year=2025-2026")
                assert resp.status_code == 200
                body = resp.json()
                assert "data" in body
                data = body["data"]
                assert data["conflict_count"] == 0
                assert data["conflicts"] == []

        app.dependency_overrides.clear()

    async def test_get_timetable_conflicts_with_faculty_clash(self, mock_db, auth_hod):
        app.dependency_overrides[get_db] = lambda: mock_db
        app.dependency_overrides[get_current_user] = lambda: auth_hod

        # Faculty "fac-1" is scheduled for two slots at same day ("MON") and period (1)
        slot1 = MockPeriodSlot("slot-1", "test-college", "dept-1", "2024", "A", 3, "2025-2026", "MON", 1, "09:00", "09:50", "CS101", "Intro to CS", "fac-1", "Room 101")
        slot2 = MockPeriodSlot("slot-2", "test-college", "dept-1", "2024", "B", 3, "2025-2026", "MON", 1, "09:00", "09:50", "CS102", "Data Structures", "fac-1", "Room 102")

        mock_res = MagicMock()
        mock_res.scalars.return_value.all.return_value = [slot1, slot2]
        mock_db.execute.return_value = mock_res

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            with patch("app.core.security.get_current_user", new_callable=AsyncMock) as mock_get_user:
                mock_get_user.return_value = auth_hod
                resp = await client.get("/api/admin/timetable/conflicts?academic_year=2025-2026")
                assert resp.status_code == 200
                body = resp.json()
                assert "data" in body
                data = body["data"]
                assert data["conflict_count"] == 1
                assert data["conflicts"][0]["type"] == "faculty_clash"
                assert data["conflicts"][0]["faculty_id"] == "fac-1"
                assert len(data["conflicts"][0]["clashing_slots"]) == 2

        app.dependency_overrides.clear()

    async def test_get_timetable_conflicts_with_section_clash(self, mock_db, auth_hod):
        app.dependency_overrides[get_db] = lambda: mock_db
        app.dependency_overrides[get_current_user] = lambda: auth_hod

        # Section CS/2024/A has two classes scheduled at MON/period 1
        slot1 = MockPeriodSlot("slot-1", "test-college", "dept-1", "2024", "A", 3, "2025-2026", "MON", 1, "09:00", "09:50", "CS101", "Intro to CS", "fac-1", "Room 101")
        slot2 = MockPeriodSlot("slot-2", "test-college", "dept-1", "2024", "A", 3, "2025-2026", "MON", 1, "09:00", "09:50", "CS102", "Data Structures", "fac-2", "Room 102")

        mock_res = MagicMock()
        mock_res.scalars.return_value.all.return_value = [slot1, slot2]
        mock_db.execute.return_value = mock_res

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            with patch("app.core.security.get_current_user", new_callable=AsyncMock) as mock_get_user:
                mock_get_user.return_value = auth_hod
                resp = await client.get("/api/admin/timetable/conflicts?academic_year=2025-2026")
                assert resp.status_code == 200
                body = resp.json()
                assert "data" in body
                data = body["data"]
                assert data["conflict_count"] == 1
                assert data["conflicts"][0]["type"] == "section_clash"
                assert data["conflicts"][0]["section"] == "A"
                assert len(data["conflicts"][0]["clashing_slots"]) == 2

        app.dependency_overrides.clear()
