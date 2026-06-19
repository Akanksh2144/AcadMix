import pytest
import pytest_asyncio
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport

from app.main import app
from database import get_db
from app import models
from app.core.security import get_current_user, get_pre_enroll_user

pytestmark = pytest.mark.asyncio

class MockHostel:
    def __init__(self, id, name, gender_type, total_floors, total_capacity, college_id):
        self.id = id
        self.name = name
        self.gender_type = gender_type
        self.total_floors = total_floors
        self.total_capacity = total_capacity
        self.college_id = college_id
        self.warden_id = "warden-123"
        self.is_deleted = False

class MockBed:
    def __init__(self, id, bed_identifier, grid_row, grid_col, category, is_premium, selection_fee, status, college_id, room_id):
        self.id = id
        self.bed_identifier = bed_identifier
        self.grid_row = grid_row
        self.grid_col = grid_col
        self.category = category
        self.is_premium = is_premium
        self.selection_fee = selection_fee
        self.status = status
        self.college_id = college_id
        self.room_id = room_id
        self.locked_at = None
        self.locked_by = None
        self.is_deleted = False

class MockAllocation:
    def __init__(self, id, student_id, admission_id, bed_id, room_id, hostel_id, academic_year, status, selection_fee_paid, payment_reference):
        self.id = id
        self.student_id = student_id
        self.admission_id = admission_id
        self.bed_id = bed_id
        self.room_id = room_id
        self.hostel_id = hostel_id
        self.academic_year = academic_year
        self.status = status
        self.selection_fee_paid = selection_fee_paid
        self.payment_reference = payment_reference
        self.allocated_at = datetime.now(timezone.utc)
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
        "college_id": "test-college",
        "gender": "male"
    }

class TestHostelBooking:
    async def test_get_available_hostels_student_passes_gender(self, mock_db, auth_student):
        app.dependency_overrides[get_db] = lambda: mock_db

        # 1. select(Hostel)
        hostel_male = MockHostel("h-male", "Male Hostel", "male", 3, 100, "test-college")
        mock_hostel_result = MagicMock()
        mock_hostel_result.scalars.return_value.all.return_value = [hostel_male]

        # 2. Bed counts query inside _compute_hostel_availability
        mock_counts_row = MagicMock()
        mock_counts_row.total = 100
        mock_counts_row.available = 50
        mock_counts_row.booked = 40
        mock_counts_row.locked = 10
        mock_counts_row.premium_available = 5
        mock_counts_result = MagicMock()
        mock_counts_result.first.return_value = mock_counts_row

        mock_db.execute.side_effect = [
            mock_hostel_result,
            mock_counts_result
        ]

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            with patch("app.core.security.get_current_user", new_callable=AsyncMock) as mock_get_user:
                mock_get_user.return_value = auth_student
                resp = await client.get("/api/hostel/available")
                assert resp.status_code == 200
                body = resp.json()
                assert "data" in body
                hostels = body["data"]
                assert len(hostels) == 1
                assert hostels[0]["id"] == "h-male"
                assert hostels[0]["available_beds"] == 50

        app.dependency_overrides.clear()

    async def test_lock_bed_expired_override(self, mock_db, auth_student):
        app.dependency_overrides[get_db] = lambda: mock_db

        # 1. Mock SELECT bed row (returns a LOCKED bed with expired locked_at)
        expired_locked_at = datetime.now(timezone.utc) - timedelta(minutes=15)
        mock_bed_row = MagicMock()
        mock_bed_row.id = "bed-123"
        mock_bed_row.room_id = "room-123"
        mock_bed_row.selection_fee = 100.0
        mock_bed_row.is_premium = True
        mock_bed_row.bed_identifier = "A1"
        mock_bed_row.status = "LOCKED"
        mock_bed_row.locked_at = expired_locked_at
        mock_bed_row.locked_by = "other-student"

        mock_select_result = MagicMock()
        mock_select_result.first.return_value = mock_bed_row

        # 2. Mock Allocation check (no active allocation)
        mock_alloc_result = MagicMock()
        mock_alloc_result.scalars.return_value.first.return_value = None

        mock_db.execute.side_effect = [
            mock_select_result,
            mock_alloc_result,
            # For UPDATE beds
            MagicMock()
        ]

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            with patch("app.core.security.get_current_user", new_callable=AsyncMock) as mock_get_user:
                mock_get_user.return_value = auth_student
                resp = await client.post("/api/hostel/beds/lock", json={"bed_id": "bed-123"})
                assert resp.status_code == 200
                body = resp.json()
                assert body["success"] is True
                assert body["data"]["bed_id"] == "bed-123"

        app.dependency_overrides.clear()

    async def test_lock_bed_active_lock_collision(self, mock_db, auth_student):
        app.dependency_overrides[get_db] = lambda: mock_db

        # Mock SELECT bed row (returns a LOCKED bed with active locked_at)
        active_locked_at = datetime.now(timezone.utc) - timedelta(minutes=5)
        mock_bed_row = MagicMock()
        mock_bed_row.id = "bed-123"
        mock_bed_row.room_id = "room-123"
        mock_bed_row.selection_fee = 100.0
        mock_bed_row.is_premium = True
        mock_bed_row.bed_identifier = "A1"
        mock_bed_row.status = "LOCKED"
        mock_bed_row.locked_at = active_locked_at
        mock_bed_row.locked_by = "other-student"

        mock_select_result = MagicMock()
        mock_select_result.first.return_value = mock_bed_row

        mock_db.execute.side_effect = [
            mock_select_result
        ]

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            with patch("app.core.security.get_current_user", new_callable=AsyncMock) as mock_get_user:
                mock_get_user.return_value = auth_student
                resp = await client.post("/api/hostel/beds/lock", json={"bed_id": "bed-123"})
                assert resp.status_code == 409
                body = resp.json()
                assert "error" in body
                assert "currently being booked by another student" in body["error"]

        app.dependency_overrides.clear()

    async def test_confirm_booking_lock_expired(self, mock_db, auth_student):
        app.dependency_overrides[get_db] = lambda: mock_db

        # Mock SELECT bed (LOCKED by current student but expired locked_at)
        expired_locked_at = datetime.now(timezone.utc) - timedelta(minutes=15)
        mock_bed = MockBed("bed-123", "A1", 1, 1, "Standard", False, 0.0, "LOCKED", "test-college", "room-123")
        mock_bed.locked_at = expired_locked_at
        mock_bed.locked_by = "stu-123"

        mock_select_result = MagicMock()
        mock_select_result.scalars.return_value.first.return_value = mock_bed

        mock_db.execute.side_effect = [
            mock_select_result
        ]

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            with patch("app.core.security.get_current_user", new_callable=AsyncMock) as mock_get_user:
                mock_get_user.return_value = auth_student
                resp = await client.post("/api/hostel/beds/confirm", json={"bed_id": "bed-123", "payment_reference": "pay-123"})
                assert resp.status_code == 409
                body = resp.json()
                assert "error" in body
                assert "lock may have expired" in body["error"]
                assert mock_bed.status == "AVAILABLE"

        app.dependency_overrides.clear()

    async def test_confirm_booking_success(self, mock_db, auth_student):
        app.dependency_overrides[get_db] = lambda: mock_db

        # Mock SELECT bed (LOCKED by current student and active locked_at)
        active_locked_at = datetime.now(timezone.utc) - timedelta(minutes=5)
        mock_bed = MockBed("bed-123", "A1", 1, 1, "Standard", False, 0.0, "LOCKED", "test-college", "room-123")
        mock_bed.locked_at = active_locked_at
        mock_bed.locked_by = "stu-123"

        mock_select_result = MagicMock()
        mock_select_result.scalars.return_value.first.return_value = mock_bed

        # Mock hostel lookup query for _get_hostel_id_for_room
        mock_hostel_id_result = MagicMock()
        mock_hostel_id_result.scalar.return_value = "hostel-123"

        mock_db.execute.side_effect = [
            mock_select_result,
            mock_hostel_id_result
        ]

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            with patch("app.core.security.get_current_user", new_callable=AsyncMock) as mock_get_user:
                mock_get_user.return_value = auth_student
                resp = await client.post("/api/hostel/beds/confirm", json={"bed_id": "bed-123", "payment_reference": "pay-123"})
                assert resp.status_code == 200
                body = resp.json()
                assert body["success"] is True
                assert mock_bed.status == "BOOKED"
                # Verify session.add was called with models.Allocation
                added_objects = [args[0][0] for args in mock_db.add.call_args_list]
                alloc = next(obj for obj in added_objects if isinstance(obj, models.Allocation))
                assert alloc.bed_id == "bed-123"
                assert alloc.payment_reference == "pay-123"

        app.dependency_overrides.clear()

    async def test_apply_gatepass_success(self, mock_db, auth_student):
        app.dependency_overrides[get_db] = lambda: mock_db

        # Mock allocation select (must have active allocation)
        mock_alloc = MockAllocation("alloc-123", "stu-123", None, "bed-123", "room-123", "hostel-123", "2026", "active", 0.0, None)
        mock_select_result = MagicMock()
        mock_select_result.scalars.return_value.first.return_value = mock_alloc

        mock_db.execute.side_effect = [
            mock_select_result
        ]

        payload = {
            "reason": "Weekend visit",
            "requested_exit": "2026-06-20T08:00:00+00:00",
            "expected_return": "2026-06-21T18:00:00+00:00"
        }

        # Mock the ARQ create_pool so we don't try to connect to real redis
        with patch("arq.create_pool", new_callable=AsyncMock) as mock_redis_pool:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                with patch("app.core.security.get_current_user", new_callable=AsyncMock) as mock_get_user:
                    mock_get_user.return_value = auth_student
                    resp = await client.post("/api/hostel/gatepasses/apply", json=payload)
                    assert resp.status_code == 200
                    body = resp.json()
                    assert body["success"] is True
                    assert body["data"]["status"] == "pending"

                    # Verify GatePass was added
                    added_objects = [args[0][0] for args in mock_db.add.call_args_list]
                    gp = next(obj for obj in added_objects if isinstance(obj, models.GatePass))
                    assert gp.student_id == "stu-123"
                    assert gp.reason == "Weekend visit"

        app.dependency_overrides.clear()

    async def test_review_gatepass_success(self, mock_db):
        warden_user = {
            "id": "warden-123",
            "role": "warden",
            "email": "warden@test.edu",
            "name": "Test Warden",
            "college_id": "test-college"
        }
        app.dependency_overrides[get_db] = lambda: mock_db

        # Mock select GatePass
        gp = models.GatePass(
            id="gp-123",
            college_id="test-college",
            student_id="stu-123",
            hostel_id="hostel-123",
            reason="Holiday",
            requested_exit=datetime.now(timezone.utc),
            expected_return=datetime.now(timezone.utc),
            approval_status="pending"
        )
        mock_gp_result = MagicMock()
        mock_gp_result.scalars.return_value.first.return_value = gp

        mock_db.execute.side_effect = [
            mock_gp_result
        ]

        payload = {
            "action": "approve",
            "remarks": "Approved by warden"
        }

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            with patch("app.core.security.get_current_user", new_callable=AsyncMock) as mock_get_user:
                mock_get_user.return_value = warden_user
                resp = await client.put("/api/hostel/gatepasses/gp-123/review", json=payload)
                assert resp.status_code == 200
                body = resp.json()
                assert body["success"] is True
                assert body["data"]["status"] == "approved"
                assert gp.approval_status == "approved"
                assert gp.approved_by == "warden-123"
                assert gp.remarks == "Approved by warden"

        app.dependency_overrides.clear()

    async def test_reconcile_admissions(self, mock_db):
        admin_user = {
            "id": "admin-123",
            "role": "admin",
            "email": "admin@test.edu",
            "name": "Test Admin",
            "college_id": "test-college"
        }
        app.dependency_overrides[get_db] = lambda: mock_db

        # 1. Mock first UPDATE execute (for allocations)
        mock_alloc_rows = [("alloc-123",)]
        mock_alloc_result = MagicMock()
        mock_alloc_result.fetchall.return_value = mock_alloc_rows

        # 2. Mock second UPDATE execute (for admissions)
        mock_admissions_result = MagicMock()

        mock_db.execute.side_effect = [
            mock_alloc_result,
            mock_admissions_result
        ]

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            with patch("app.core.security.get_current_user", new_callable=AsyncMock) as mock_get_user:
                mock_get_user.return_value = admin_user
                resp = await client.post("/api/admin/hostel/reconcile-admissions")
                assert resp.status_code == 200
                body = resp.json()
                assert body["success"] is True
                assert body["data"]["reconciled_count"] == 1

        app.dependency_overrides.clear()

    async def test_pre_enroll_get_available_hostels(self, mock_db):
        guest_user = {
            "id": "adm-123",
            "college_id": "test-college",
            "admission_number": "ADM001",
            "gender": "male"
        }
        app.dependency_overrides[get_db] = lambda: mock_db
        app.dependency_overrides[get_pre_enroll_user] = lambda: guest_user

        # Mock select(Hostel)
        hostel_male = MockHostel("h-male", "Male Hostel", "male", 3, 100, "test-college")
        mock_hostel_result = MagicMock()
        mock_hostel_result.scalars.return_value.all.return_value = [hostel_male]

        # Bed counts query
        mock_counts_row = MagicMock()
        mock_counts_row.total = 100
        mock_counts_row.available = 50
        mock_counts_row.booked = 40
        mock_counts_row.locked = 10
        mock_counts_row.premium_available = 5
        mock_counts_result = MagicMock()
        mock_counts_result.first.return_value = mock_counts_row

        mock_db.execute.side_effect = [
            mock_hostel_result,
            mock_counts_result
        ]

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/pre-enroll/hostel/available")
            assert resp.status_code == 200
            body = resp.json()
            assert "data" in body
            assert len(body["data"]["data"]) == 1

        app.dependency_overrides.clear()

    async def test_pre_enroll_lock_bed(self, mock_db):
        guest_user = {
            "id": "adm-123",
            "college_id": "test-college",
            "admission_number": "ADM001",
            "gender": "male"
        }
        app.dependency_overrides[get_db] = lambda: mock_db
        app.dependency_overrides[get_pre_enroll_user] = lambda: guest_user

        # Mock SELECT bed row (returns an AVAILABLE bed)
        mock_bed_row = MagicMock()
        mock_bed_row.id = "bed-123"
        mock_bed_row.room_id = "room-123"
        mock_bed_row.selection_fee = 0.0
        mock_bed_row.is_premium = False
        mock_bed_row.bed_identifier = "A1"
        mock_bed_row.status = "AVAILABLE"
        mock_bed_row.locked_at = None
        mock_bed_row.locked_by = None

        mock_select_result = MagicMock()
        mock_select_result.first.return_value = mock_bed_row

        # Mock Allocation check
        mock_alloc_result = MagicMock()
        mock_alloc_result.scalars.return_value.first.return_value = None

        mock_db.execute.side_effect = [
            mock_select_result,
            mock_alloc_result,
            MagicMock()
        ]

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/api/pre-enroll/hostel/beds/lock", json={"bed_id": "bed-123"})
            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
            body = resp.json()
            assert body["data"]["success"] is True

        app.dependency_overrides.clear()
