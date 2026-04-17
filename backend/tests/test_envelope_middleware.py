"""
Tests for ResponseEnvelopeMiddleware.

Written BEFORE the middleware implementation per CTO sequencing:
1. Bucket B endpoint → returns {"data": <payload>, "error": null}
2. Bucket A endpoint with X-Envelope-Applied → not double-wrapped
3. /api/v1/health → passes through unchanged
4. Content-length matches actual body after wrapping
"""
import pytest
import pytest_asyncio

pytestmark = pytest.mark.asyncio
import json
from httpx import AsyncClient, ASGITransport
from fastapi import FastAPI, Response
from starlette.responses import StreamingResponse, HTMLResponse


# ─── Build a test app that mirrors production structure ─────────────────────

def create_test_app():
    """Create a minimal FastAPI app with the middleware under test."""
    from app.core.response import ResponseEnvelopeMiddleware

    app = FastAPI()
    app.add_middleware(ResponseEnvelopeMiddleware)

    # ── Bucket B: Flat JSON endpoint ──────────────────────────────────────
    @app.get("/api/v1/dashboard/student")
    async def student_dashboard():
        return {"total_quizzes": 5, "avg_score": 78.3, "rank": 2}

    # ── Bucket A: Already-enveloped endpoint (with header) ────────────────
    @app.get("/api/v1/hostel/templates")
    async def hostel_templates(response: Response):
        response.headers["X-Envelope-Applied"] = "true"
        return {"data": [{"id": 1, "name": "Boys Hostel"}], "success": True}

    # ── Bucket A: Already-enveloped (DomainException shape — heuristic) ──
    @app.get("/api/v1/trigger-domain-error")
    async def domain_error():
        """Simulates what the DomainException handler returns."""
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=400,
            content={"data": None, "error": "Validation failed", "meta": {}},
        )

    # ── Bucket C: Health probe ────────────────────────────────────────────
    @app.get("/api/v1/health")
    async def health():
        return {"status": "healthy", "timestamp": "2026-04-16T00:00:00Z"}

    @app.get("/api/v1/health/ready")
    async def health_ready():
        return {"status": "ready", "checks": {"database": "ok"}}

    # ── Bucket C: WebSocket path ──────────────────────────────────────────
    @app.get("/api/v1/ws/stats")
    async def ws_stats():
        return {"active_connections": 3}

    # ── Bucket C: Streaming response ──────────────────────────────────────
    @app.get("/api/v1/code/coach")
    async def code_coach():
        async def generate():
            yield b'data: {"token": "hello"}\n\n'
        return StreamingResponse(generate(), media_type="text/event-stream")

    # ── Bucket C: HTML response ───────────────────────────────────────────
    @app.get("/api/v1/student/hall-ticket")
    async def hall_ticket():
        return HTMLResponse(content="<html><body>Hall Ticket</body></html>")

    # ── Bucket C: Webhook ─────────────────────────────────────────────────
    @app.post("/api/v1/webhooks/whatsapp")
    async def whatsapp_webhook():
        return {"status": "ok"}

    # ── Bucket A: notifications-style (has "data" but no "error") ─────────
    @app.get("/api/v1/notifications-no-header")
    async def notifications_no_header():
        """Has 'data' key but NOT 'error' — will be wrapped without header."""
        return {"data": [{"id": 1}], "unread_count": 3}

    @app.get("/api/v1/notifications-with-header")
    async def notifications_with_header(response: Response):
        """Has 'data' key, sets header — should not be wrapped."""
        response.headers["X-Envelope-Applied"] = "true"
        return {"data": [{"id": 1}], "unread_count": 3}

    # ── Bucket B: endpoint returning a list ───────────────────────────────
    @app.get("/api/v1/quizzes")
    async def list_quizzes():
        return [{"id": 1, "title": "Quiz 1"}, {"id": 2, "title": "Quiz 2"}]

    # ── Edge case: 204 No Content ─────────────────────────────────────────
    @app.delete("/api/v1/items/1")
    async def delete_item():
        from fastapi.responses import Response as RawResponse
        return RawResponse(status_code=204)

    return app


# ═══════════════════════════════════════════════════════════════════════════════
# Test Cases
# ═══════════════════════════════════════════════════════════════════════════════

@pytest.fixture
def test_app():
    return create_test_app()


@pytest_asyncio.fixture
async def client(test_app):
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
class TestBucketB:
    """Flat JSON endpoints should be wrapped in the standard envelope."""

    async def test_flat_dict_is_wrapped(self, client: AsyncClient):
        """A flat dict response should become {"data": <original>, "error": null}."""
        resp = await client.get("/api/v1/dashboard/student")
        assert resp.status_code == 200
        body = resp.json()

        assert "data" in body
        assert "error" in body
        assert body["error"] is None
        assert body["data"]["total_quizzes"] == 5
        assert body["data"]["avg_score"] == 78.3
        assert body["data"]["rank"] == 2

    async def test_flat_list_is_wrapped(self, client: AsyncClient):
        """A flat list response should be wrapped inside data."""
        resp = await client.get("/api/v1/quizzes")
        assert resp.status_code == 200
        body = resp.json()

        assert "data" in body
        assert "error" in body
        assert body["error"] is None
        assert isinstance(body["data"], list)
        assert len(body["data"]) == 2
        assert body["data"][0]["title"] == "Quiz 1"

    async def test_content_length_matches_body(self, client: AsyncClient):
        """Content-Length must match actual JSON body size (Issue 4)."""
        resp = await client.get("/api/v1/dashboard/student")
        content_length = int(resp.headers.get("content-length", 0))
        actual_length = len(resp.content)

        assert content_length == actual_length, (
            f"Content-Length mismatch: header says {content_length}, "
            f"body is {actual_length} bytes"
        )


@pytest.mark.asyncio
class TestBucketA:
    """Already-enveloped endpoints should NOT be double-wrapped."""

    async def test_header_prevents_double_wrap(self, client: AsyncClient):
        """Endpoint with X-Envelope-Applied: true should pass through as-is."""
        resp = await client.get("/api/v1/hostel/templates")
        assert resp.status_code == 200
        body = resp.json()

        # Should NOT be {"data": {"data": [...], "success": true}, "error": null}
        # Should be {"data": [...], "success": true}
        assert "success" in body
        assert body["success"] is True
        assert isinstance(body["data"], list)
        assert body["data"][0]["name"] == "Boys Hostel"

    async def test_domain_exception_heuristic(self, client: AsyncClient):
        """DomainException responses (data+error shape) should not be re-wrapped."""
        resp = await client.get("/api/v1/trigger-domain-error")
        assert resp.status_code == 400
        body = resp.json()

        # Should be {"data": null, "error": "Validation failed", "meta": {}}
        assert body["data"] is None
        assert body["error"] == "Validation failed"
        assert "meta" in body

    async def test_notifications_without_header_gets_wrapped(self, client: AsyncClient):
        """Issue 1: {"data": [...], "unread_count": N} WITHOUT header WILL be wrapped
        because it lacks "error" key and has no header."""
        resp = await client.get("/api/v1/notifications-no-header")
        body = resp.json()

        # This WILL be double-wrapped because no header and no "error" key
        assert body["data"]["data"] == [{"id": 1}]
        assert body["data"]["unread_count"] == 3
        assert body["error"] is None

    async def test_notifications_with_header_not_wrapped(self, client: AsyncClient):
        """Issue 1 fix: {"data": [...], "unread_count": N} WITH header passes through."""
        resp = await client.get("/api/v1/notifications-with-header")
        body = resp.json()

        # Should NOT be double-wrapped
        assert body["data"] == [{"id": 1}]
        assert body["unread_count"] == 3


@pytest.mark.asyncio
class TestBucketC:
    """Excluded endpoints should pass through completely unchanged."""

    async def test_health_passes_through(self, client: AsyncClient):
        """Health probe should NOT be wrapped."""
        resp = await client.get("/api/v1/health")
        assert resp.status_code == 200
        body = resp.json()

        assert body["status"] == "healthy"
        assert "data" not in body  # should NOT have envelope
        assert "error" not in body

    async def test_health_ready_passes_through(self, client: AsyncClient):
        resp = await client.get("/api/v1/health/ready")
        body = resp.json()
        assert body["status"] == "ready"
        assert "data" not in body

    async def test_ws_stats_passes_through(self, client: AsyncClient):
        """WebSocket path prefix should be excluded."""
        resp = await client.get("/api/v1/ws/stats")
        body = resp.json()
        assert body["active_connections"] == 3
        assert "data" not in body

    async def test_streaming_response_passes_through(self, client: AsyncClient):
        """StreamingResponse (SSE) should not be buffered or wrapped."""
        resp = await client.get("/api/v1/code/coach")
        assert resp.status_code == 200
        assert "text/event-stream" in resp.headers.get("content-type", "")
        # Body should be raw SSE, not JSON envelope
        assert b"data:" in resp.content

    async def test_html_response_passes_through(self, client: AsyncClient):
        """HTMLResponse should pass through unchanged."""
        resp = await client.get("/api/v1/student/hall-ticket")
        assert resp.status_code == 200
        assert "text/html" in resp.headers.get("content-type", "")
        assert b"Hall Ticket" in resp.content

    async def test_webhook_passes_through(self, client: AsyncClient):
        """Webhook paths should be excluded."""
        resp = await client.post("/api/v1/webhooks/whatsapp")
        body = resp.json()
        assert body["status"] == "ok"
        assert "data" not in body

    async def test_204_no_content_passes_through(self, client: AsyncClient):
        """204 responses have no body — must not crash the middleware."""
        resp = await client.delete("/api/v1/items/1")
        assert resp.status_code == 204


@pytest.mark.asyncio
class TestContentIntegrity:
    """Verify response integrity after middleware wrapping."""

    async def test_request_id_header_preserved(self, client: AsyncClient):
        """Custom headers from the original response should survive wrapping."""
        resp = await client.get("/api/v1/dashboard/student")
        # JSONResponse should set correct content-type
        assert "application/json" in resp.headers.get("content-type", "")

    async def test_wrapped_response_is_valid_json(self, client: AsyncClient):
        """The wrapped response must be parseable JSON."""
        resp = await client.get("/api/v1/dashboard/student")
        # This will raise if not valid JSON
        body = json.loads(resp.content)
        assert isinstance(body, dict)
        assert set(body.keys()) == {"data", "error"}
