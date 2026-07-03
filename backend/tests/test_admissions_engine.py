import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient, ASGITransport

from app.main import app
from database import get_db
from app.models.admissions import Admission

pytestmark = pytest.mark.asyncio

@pytest_asyncio.fixture
async def mock_db():
    session = AsyncMock()
    session.add = MagicMock()
    session.info = {"college_id": "col-1"}
    return session

async def test_bulk_import_candidates(mock_db):
    mock_db.execute.return_value = MagicMock(scalars=MagicMock(return_value=MagicMock(first=MagicMock(return_value=None))))
    
    def override_db():
        yield mock_db
    app.dependency_overrides[get_db] = override_db
    
    auth_user = {"id": "admin-1", "college_id": "col-1", "role": "admin", "name": "Admissions Officer"}
    csv_payload = "admission_number,full_name,mobile_number,email,gender,branch,batch,quota,category,exam_type,exam_roll_number,exam_score,exam_percentile,course_preferences\nAD-1,Rahul Sharma,9876543210,rahul@gmail.com,Male,CSE,2026,General,General,JEE,12345,95.5,99.2,CSE,ECE"
    
    with patch("app.core.security.get_current_user", new_callable=AsyncMock) as mock_user:
        mock_user.return_value = auth_user
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post("/api/admissions/bulk-import", json={"csv_data": csv_payload})
            assert resp.status_code == 200
            data = resp.json()["data"]
            assert data["imported"] == 1
            assert data["skipped"] == 0
            
    app.dependency_overrides.clear()

async def test_generate_merit_list(mock_db):
    cand1 = Admission(id="cand-1", full_name="Rahul", exam_percentile=99.2, category="General")
    cand2 = Admission(id="cand-2", full_name="Sneha", exam_percentile=95.1, category="OBC")
    
    mock_db.execute.return_value = MagicMock(scalars=MagicMock(return_value=MagicMock(all=MagicMock(return_value=[cand1, cand2]))))
    
    def override_db():
        yield mock_db
    app.dependency_overrides[get_db] = override_db
    
    auth_user = {"id": "admin-1", "college_id": "col-1", "role": "admin"}
    
    with patch("app.core.security.get_current_user", new_callable=AsyncMock) as mock_user:
        mock_user.return_value = auth_user
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post("/api/admissions/generate-merit-list", json={"phase_name": "Phase 1"})
            assert resp.status_code == 200
            data = resp.json()["data"]
            assert len(data) == 2
            assert data[0]["merit_rank"] == 1
            assert data[1]["merit_rank"] == 2
            
    app.dependency_overrides.clear()

async def test_run_counseling(mock_db):
    cand1 = Admission(id="cand-1", full_name="Rahul", merit_rank=1, course_preferences="CSE,ECE", branch="CSE")
    cand2 = Admission(id="cand-2", full_name="Sneha", merit_rank=2, course_preferences="CSE", branch="CSE")
    
    mock_db.execute.return_value = MagicMock(scalars=MagicMock(return_value=MagicMock(all=MagicMock(return_value=[cand1, cand2]))))
    
    def override_db():
        yield mock_db
    app.dependency_overrides[get_db] = override_db
    
    auth_user = {"id": "admin-1", "college_id": "col-1", "role": "admin"}
    
    with patch("app.core.security.get_current_user", new_callable=AsyncMock) as mock_user:
        mock_user.return_value = auth_user
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post("/api/admissions/run-counseling", json={"branch_capacities": {"CSE": 1, "ECE": 5}})
            assert resp.status_code == 200
            data = resp.json()["data"]
            assert len(data["allocated"]) == 1
            assert len(data["waitlisted"]) == 1
            assert data["allocated"][0]["allocated_branch"] == "CSE"
            
    app.dependency_overrides.clear()

async def test_verify_documents(mock_db):
    cand = Admission(id="cand-1", full_name="Rahul", documents_verified="pending", status="submitted")
    mock_db.execute.return_value = MagicMock(scalar_one_or_none=MagicMock(return_value=cand), scalars=MagicMock(return_value=MagicMock(first=MagicMock(return_value=cand))))
    
    def override_db():
        yield mock_db
    app.dependency_overrides[get_db] = override_db
    
    auth_user = {"id": "admin-1", "college_id": "col-1", "role": "admin"}
    
    with patch("app.core.security.get_current_user", new_callable=AsyncMock) as mock_user:
        mock_user.return_value = auth_user
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.put("/api/admissions/cand-1/verify-documents", json={"status": "verified"})
            assert resp.status_code == 200
            assert cand.documents_verified == "verified"
            assert cand.status == "admitted"
            
    app.dependency_overrides.clear()

async def test_rollover_candidate(mock_db):
    cand = Admission(id="cand-1", full_name="Rahul Sharma", admission_number="A-001", batch="2026", branch="CSE", status="admitted", documents_verified="verified")
    mock_db.execute.return_value = MagicMock(scalar_one_or_none=MagicMock(return_value=cand), scalars=MagicMock(return_value=MagicMock(first=MagicMock(return_value=cand))))
    
    def override_db():
        yield mock_db
    app.dependency_overrides[get_db] = override_db
    
    auth_user = {"id": "admin-1", "college_id": "col-1", "role": "admin"}
    
    with patch("app.core.security.get_current_user", new_callable=AsyncMock) as mock_user:
        mock_user.return_value = auth_user
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post("/api/admissions/cand-1/rollover")
            assert resp.status_code == 200
            data = resp.json()["data"]
            assert "register_number" in data
            assert cand.status == "enrolled"
            
    app.dependency_overrides.clear()

async def test_calculate_candidate_melt_risk(mock_db):
    from datetime import datetime, timezone, timedelta
    # 5 days ago to trigger the doc delay risk partially
    created_date = datetime.now(timezone.utc) - timedelta(days=6)
    cand = Admission(
        id="cand-1",
        full_name="Rahul Sharma",
        admission_number="A-001",
        fee_payment_status="pending",
        documents_verified="pending",
        address="123 Street, Bangalore, Karnataka", # Out of state (Karnataka vs AITS Hyderabad)
        created_at=created_date,
        melt_risk_score=0.0
    )
    mock_db.execute.return_value = MagicMock(scalar_one_or_none=MagicMock(return_value=cand), scalars=MagicMock(return_value=MagicMock(first=MagicMock(return_value=cand))))
    
    def override_db():
        yield mock_db
    app.dependency_overrides[get_db] = override_db
    
    auth_user = {"id": "admin-1", "college_id": "col-1", "role": "admin"}
    
    with patch("app.core.security.get_current_user", new_callable=AsyncMock) as mock_user:
        mock_user.return_value = auth_user
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post("/api/admissions/cand-1/recalculate-risk")
            assert resp.status_code == 200
            data = resp.json()["data"]
            
            # Expected scoring:
            # 1. Unpaid fees (pending) -> +35
            # 2. Doc delay (>5 days) -> +25
            # 3. Out-of-state address (Bangalore) -> +20
            # Total score should be 80% (or 100% depending on low comm response hash code)
            assert data["melt_risk_score"] >= 80.0
            assert "Fees Unpaid" in data["melt_risk_factors"]
            assert "Out-of-state" in data["melt_risk_factors"]
            
    app.dependency_overrides.clear()
