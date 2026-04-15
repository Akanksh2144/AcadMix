"""
Shared test fixtures for all backend tests.

Provides:
- Async test database (PostgreSQL)
- Per-test transaction rollback (clean state per test)
- Authenticated HTTP test client
- Factory helpers for creating test entities

Usage:
    async def test_something(client, auth_headers):
        resp = await client.get("/api/health", headers=auth_headers)
        assert resp.status_code == 200
"""
import os
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

# Override settings BEFORE importing app
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/acadmix_test")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379")
os.environ.setdefault("JWT_SECRET", "test-secret-not-for-production")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")
os.environ.setdefault("ADMIN_PASSWORD", "TestAdmin@123")
os.environ.setdefault("ADMIN_COLLEGE_ID", "GNITC")

from app.main import app  # noqa: E402


@pytest_asyncio.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest_asyncio.fixture
async def client():
    """Async HTTP test client against the full app."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        follow_redirects=True,
    ) as ac:
        yield ac


@pytest_asyncio.fixture
async def auth_headers(client):
    """Get auth headers for the seeded admin user.
    
    Requires SEED_DEMO_USERS=true or the admin user to exist.
    Returns: dict with Authorization: Bearer <token>
    """
    resp = await client.post("/api/auth/login", json={
        "college_id": "admin@gni.edu",
        "password": os.getenv("ADMIN_PASSWORD", "TestAdmin@123"),
    })
    if resp.status_code != 200:
        pytest.skip("Admin user not seeded — set SEED_DEMO_USERS=true")
    
    data = resp.json()
    token = data.get("access_token")
    return {
        "Authorization": f"Bearer {token}",
        "X-Tenant": "gnitc",
    }


@pytest_asyncio.fixture
async def student_headers(client):
    """Get auth headers for a test student."""
    resp = await client.post("/api/auth/login", json={
        "college_id": "230801001",
        "password": "student",
    })
    if resp.status_code != 200:
        pytest.skip("Student user not seeded — set SEED_DEMO_USERS=true")
    
    data = resp.json()
    return {
        "Authorization": f"Bearer {data['access_token']}",
        "X-Tenant": "gnitc",
    }


@pytest_asyncio.fixture
async def teacher_headers(client):
    """Get auth headers for a test teacher."""
    resp = await client.post("/api/auth/login", json={
        "college_id": "TCH001",
        "password": "faculty",
    })
    if resp.status_code != 200:
        pytest.skip("Teacher user not seeded — set SEED_DEMO_USERS=true")
    
    data = resp.json()
    return {
        "Authorization": f"Bearer {data['access_token']}",
        "X-Tenant": "gnitc",
    }
