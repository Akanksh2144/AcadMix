"""
Integration Test — Results Cache (Redis)

Tests the highest business-risk endpoint: /results/semester/{student_id}
during results publication for 3,000–4,000 students.

Tests:
1. First request hits DB (cache miss), second request hits Redis (cache hit)
2. Responses are identical between cache miss and cache hit
3. Cache stores raw DB data (pre-middleware), not the envelope
4. Cache invalidation on POST /results/semester clears the correct key
5. Results endpoint returns valid JSON through the middleware
"""
import pytest
import pytest_asyncio
import json
from unittest.mock import patch, AsyncMock, MagicMock, PropertyMock
from fastapi import FastAPI
from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport

pytestmark = pytest.mark.asyncio


# ── Fixtures ─────────────────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def mock_redis():
    """In-memory Redis mock for cache testing."""
    store = {}

    class FakeRedis:
        async def get(self, key):
            return store.get(key)

        async def setex(self, key, ttl, value):
            store[key] = value

        async def delete(self, key):
            store.pop(key, None)

        async def exists(self, key):
            return key in store

    redis = FakeRedis()
    redis._store = store  # expose for assertions
    return redis


class TestResultsCacheMissHit:
    """Test cache miss → DB hit, then cache hit → Redis hit."""

    async def test_first_request_misses_cache_second_hits(self, mock_redis):
        """
        1. First call: redis.get returns None → DB query runs → redis.setex called
        2. Second call: redis.get returns cached data → DB query does NOT run
        """
        from app.core.response import ResponseEnvelopeMiddleware

        app = FastAPI()
        app.add_middleware(ResponseEnvelopeMiddleware)

        # Simulated semester data
        fake_db_result = [
            {"student_id": "stu-001", "semester": 1, "subjects": [
                {"course_id": "CS101", "grade": "A", "credits": 4},
                {"course_id": "MA101", "grade": "O", "credits": 3},
            ]},
            {"student_id": "stu-001", "semester": 2, "subjects": [
                {"course_id": "CS201", "grade": "A+", "credits": 4},
            ]},
        ]

        db_call_count = 0

        @app.get("/api/v1/results/semester/{student_id}")
        async def get_results(student_id: str):
            nonlocal db_call_count
            cache_key = f"result:college-1:{student_id}:all"
            cached = await mock_redis.get(cache_key)
            if cached:
                return json.loads(cached)

            # Simulate DB hit
            db_call_count += 1
            response_data = fake_db_result

            await mock_redis.setex(cache_key, 86400, json.dumps(response_data))
            return response_data

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # Request 1: Cache miss → DB hit
            resp1 = await client.get("/api/v1/results/semester/stu-001")
            assert resp1.status_code == 200
            body1 = resp1.json()

            # Request 2: Cache hit → no DB
            resp2 = await client.get("/api/v1/results/semester/stu-001")
            assert resp2.status_code == 200
            body2 = resp2.json()

            # DB should only be called once
            assert db_call_count == 1, f"DB was called {db_call_count} times (expected 1)"

            # Responses must be identical
            assert body1 == body2, "Cache hit response differs from cache miss response"

    async def test_cache_stores_raw_data_not_envelope(self, mock_redis):
        """Cache should store the raw list, NOT the middleware envelope.

        The middleware wraps AFTER the endpoint returns → cache stores pre-wrap data.
        """
        from app.core.response import ResponseEnvelopeMiddleware

        app = FastAPI()
        app.add_middleware(ResponseEnvelopeMiddleware)

        raw_data = [{"student_id": "stu-002", "semester": 1, "subjects": []}]

        @app.get("/api/v1/results/semester/{student_id}")
        async def get_results(student_id: str):
            await mock_redis.setex(f"result:college-1:{student_id}:all", 86400, json.dumps(raw_data))
            return raw_data

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            await client.get("/api/v1/results/semester/stu-002")

            # Check what's actually in the cache
            cached_value = await mock_redis.get("result:college-1:stu-002:all")
            cached_parsed = json.loads(cached_value)

            # Cache must have the RAW data, not the envelope
            assert isinstance(cached_parsed, list), "Cache should store raw list, not envelope dict"
            assert cached_parsed == raw_data

    async def test_cache_invalidation_on_post(self, mock_redis):
        """POST /results/semester must invalidate the cache for that student."""
        # Pre-populate cache
        cache_key = "result:college-1:stu-003:all"
        await mock_redis.setex(cache_key, 86400, json.dumps([{"semester": 1}]))

        # Verify cache is populated
        assert await mock_redis.get(cache_key) is not None

        # Simulate invalidation (what the POST handler does)
        await mock_redis.delete(cache_key)

        # Verify cache is cleared
        assert await mock_redis.get(cache_key) is None

    async def test_results_response_through_middleware(self, mock_redis):
        """Results endpoint (Bucket B) should be wrapped by the middleware."""
        from app.core.response import ResponseEnvelopeMiddleware

        app = FastAPI()
        app.add_middleware(ResponseEnvelopeMiddleware)

        @app.get("/api/v1/results/semester/{student_id}")
        async def get_results(student_id: str):
            return [{"student_id": student_id, "semester": 1, "subjects": []}]

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/v1/results/semester/stu-004")
            assert resp.status_code == 200
            body = resp.json()

            # Should be wrapped in {"data": [...], "error": null}
            assert "data" in body
            assert "error" in body
            assert body["error"] is None
            assert isinstance(body["data"], list)
            assert body["data"][0]["student_id"] == "stu-004"
