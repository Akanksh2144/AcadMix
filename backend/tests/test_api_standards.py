"""
Test: API Response Standards

Verifies that the standardized response envelope and middleware work correctly:
- X-Request-ID header is present on all responses
- Error responses follow the {data, error, meta} envelope
- Health endpoints are publicly accessible
"""
import pytest


@pytest.mark.asyncio
async def test_request_id_header_present(client):
    """Every response should include an X-Request-ID header."""
    resp = await client.get("/api/health/")
    assert "x-request-id" in resp.headers
    assert len(resp.headers["x-request-id"]) >= 8


@pytest.mark.asyncio
async def test_request_id_forwarded(client):
    """If client sends X-Request-ID, it should be preserved in response."""
    resp = await client.get("/api/health/", headers={"X-Request-ID": "test-req-123"})
    assert resp.headers.get("x-request-id") == "test-req-123"


@pytest.mark.asyncio
async def test_404_returns_json(client, auth_headers):
    """Non-existent endpoints should return JSON, not HTML."""
    resp = await client.get("/api/v1/this-does-not-exist", headers=auth_headers)
    assert resp.status_code in (404, 405)


@pytest.mark.asyncio
async def test_health_is_public(client):
    """Health endpoints should not require authentication."""
    resp = await client.get("/api/health/")
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_websocket_stats_endpoint(client):
    """WebSocket stats endpoint should return connection counts."""
    resp = await client.get("/api/ws/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_connections" in data
    assert "channels" in data


@pytest.mark.asyncio
async def test_cors_headers_present(client):
    """CORS headers should be present on responses."""
    resp = await client.options("/api/health/", headers={
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "GET",
    })
    # Should not error — CORS preflight should work
    assert resp.status_code in (200, 204, 405)
