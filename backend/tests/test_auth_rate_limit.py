"""
Integration Test — Rate Limiting + Middleware Interaction

Tests:
1. Rate limit (5/minute) returns 429 on the 6th request
2. Rate limit (30/minute) returns 429 on the 31st request
3. 429 responses from slowapi are valid JSON through the middleware
4. Retry-After header is present on 429 responses
5. Different IPs have independent rate limits

Self-contained: uses in-memory storage, no Redis/DB required.
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from fastapi import FastAPI, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.requests import Request as StarletteRequest
from starlette.responses import JSONResponse

pytestmark = pytest.mark.asyncio


def _test_key_func(request) -> str:
    """Mirror production's _get_real_ip — read X-Forwarded-For header.

    ASGITransport doesn't set scope["client"] from headers, so
    slowapi's get_remote_address always returns 127.0.0.1.
    This custom key func reads the header like production does.
    """
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return get_remote_address(request)


def create_rate_limit_app():
    """Create a minimal app with rate limiting + envelope middleware."""
    from app.core.response import ResponseEnvelopeMiddleware

    # In-memory limiter with header-aware key func (no Redis needed)
    limiter = Limiter(key_func=_test_key_func, storage_uri="memory://")

    app = FastAPI()
    app.state.limiter = limiter

    # slowapi's 429 handler — mirrors what main.py registers
    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(request: StarletteRequest, exc: RateLimitExceeded):
        return JSONResponse(
            status_code=429,
            content={"error": f"Rate limit exceeded: {exc.detail}"},
            headers={"Retry-After": str(exc.detail.split(" per ")[0]) if " per " in str(exc.detail) else "60"},
        )

    # Register envelope middleware
    app.add_middleware(ResponseEnvelopeMiddleware)

    # ── Simulates /api/auth/login (5/minute) ─────────────────────────────
    @app.post("/api/v1/auth/login")
    @limiter.limit("5/minute")
    async def login(request: Request):
        return {"access_token": "fake-jwt", "user": {"id": "1", "role": "student"}}

    # ── Simulates /api/v1/code/execute (30/minute) ───────────────────────
    @app.post("/api/v1/code/execute")
    @limiter.limit("30/minute")
    async def execute_code(request: Request):
        return {"output": "Hello World", "exit_code": 0}

    return app


# ═══════════════════════════════════════════════════════════════════════════════

@pytest.fixture
def test_app():
    return create_rate_limit_app()


@pytest_asyncio.fixture
async def client(test_app):
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ═══════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
class TestLoginRateLimit:
    """Test /api/auth/login 5/minute rate limit."""

    async def test_login_429_on_6th_request(self, client: AsyncClient):
        """Fire 6 login requests — the 6th must return 429."""
        for i in range(6):
            resp = await client.post(
                "/api/v1/auth/login",
                json={},
                headers={"X-Forwarded-For": "10.0.0.1"},
            )
            if i < 5:
                assert resp.status_code == 200, (
                    f"Request {i+1} should succeed, got {resp.status_code}"
                )
            else:
                assert resp.status_code == 429, (
                    f"Request {i+1} should be rate-limited, got {resp.status_code}"
                )

    async def test_429_is_valid_json(self, client: AsyncClient):
        """429 response must be parseable JSON with error detail."""
        for _ in range(6):
            resp = await client.post(
                "/api/v1/auth/login",
                json={},
                headers={"X-Forwarded-For": "10.0.0.2"},
            )

        assert resp.status_code == 429
        body = resp.json()
        # The 429 handler returns {"error": "Rate limit exceeded: ..."}
        # Middleware wraps it: {"data": {"error": "..."}, "error": null}
        # because it's a flat dict with no "data"+"error" heuristic match
        assert "application/json" in resp.headers.get("content-type", "")

    async def test_429_has_retry_after_header(self, client: AsyncClient):
        """429 response must include Retry-After header."""
        for _ in range(6):
            resp = await client.post(
                "/api/v1/auth/login",
                json={},
                headers={"X-Forwarded-For": "10.0.0.3"},
            )

        assert resp.status_code == 429
        retry_after = resp.headers.get("retry-after")
        assert retry_after is not None, "429 must have Retry-After header"

    async def test_different_ips_independent_limits(self, client: AsyncClient):
        """Two different IPs should have independent rate limits."""
        # Exhaust limit for IP-A
        for _ in range(5):
            await client.post(
                "/api/v1/auth/login",
                json={},
                headers={"X-Forwarded-For": "10.0.0.4"},
            )

        # IP-B should still be allowed
        resp = await client.post(
            "/api/v1/auth/login",
            json={},
            headers={"X-Forwarded-For": "10.0.0.5"},
        )
        assert resp.status_code == 200, "Different IP should not be rate-limited"


@pytest.mark.asyncio
class TestCodeExecuteRateLimit:
    """Test /api/code/execute 30/minute rate limit — the open audit checkbox."""

    async def test_execute_429_on_31st_request(self, client: AsyncClient):
        """Fire 31 requests — the 31st must return 429."""
        for i in range(31):
            resp = await client.post(
                "/api/v1/code/execute",
                json={},
                headers={"X-Forwarded-For": "10.0.1.1"},
            )
            if i < 30:
                assert resp.status_code == 200, (
                    f"Request {i+1} should succeed, got {resp.status_code}"
                )
            else:
                assert resp.status_code == 429, (
                    f"Request {i+1} should be rate-limited, got {resp.status_code}"
                )

    async def test_429_not_double_wrapped(self, client: AsyncClient):
        """429 from slowapi: middleware wraps it as Bucket B (flat JSON).

        The 429 handler returns {"error": "Rate limit exceeded: ..."}
        which does NOT have both "data" AND "error" keys (no "data" key),
        so the heuristic won't catch it, and the middleware wraps it:
        {"data": {"error": "..."}, "error": null}

        This is correct — the frontend interceptor then unwraps it.
        """
        for _ in range(31):
            resp = await client.post(
                "/api/v1/code/execute",
                json={},
                headers={"X-Forwarded-For": "10.0.1.2"},
            )

        assert resp.status_code == 429
        body = resp.json()

        # Middleware wraps it because it's Bucket B (flat dict with just "error" key)
        # The envelope is {"data": {"error": "Rate limit exceeded..."}, "error": null}
        assert "data" in body
        assert "error" in body
        assert body["error"] is None
        assert "Rate limit" in body["data"]["error"]
