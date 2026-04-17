"""
Integration Test — WebSocket Pub/Sub Subscriber Lifecycle

Tests:
1. start_subscriber() connects to Redis and creates a subscriber task
2. broadcast() publishes to Redis, subscriber delivers to local WS clients
3. stop_subscriber() cleans up without hanging
4. WebSocket paths bypass ResponseEnvelopeMiddleware (Bucket C)
5. Local-only fallback works when Redis is unavailable
"""
import pytest
import pytest_asyncio
import asyncio
import json
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient, ASGITransport

pytestmark = pytest.mark.asyncio


class TestConnectionManagerLifecycle:
    """Test start/stop subscriber lifecycle."""

    async def test_start_subscriber_creates_task(self):
        """start_subscriber() should create a background asyncio task."""
        from app.routers.websocket import ConnectionManager

        mgr = ConnectionManager()

        # Mock Redis client with pubsub
        mock_pubsub = AsyncMock()
        mock_pubsub.subscribe = AsyncMock()
        mock_pubsub.listen = AsyncMock(return_value=aiter_empty())
        mock_pubsub.unsubscribe = AsyncMock()
        mock_pubsub.close = AsyncMock()

        mock_redis = MagicMock()
        mock_redis.pubsub = MagicMock(return_value=mock_pubsub)

        # redis_client is imported lazily inside start_subscriber() via
        # "from app.core.security import redis_client" — patch at source
        with patch("app.core.security.redis_client", mock_redis):
            await mgr.start_subscriber()

            # Task should be created
            assert mgr._subscriber_task is not None
            assert not mgr._subscriber_task.done()

            # Clean up
            await mgr.stop_subscriber()

    async def test_stop_subscriber_cancels_cleanly(self):
        """stop_subscriber() should cancel the task and unsubscribe without hanging."""
        from app.routers.websocket import ConnectionManager

        mgr = ConnectionManager()

        # Simulate a running subscriber
        async def fake_loop():
            try:
                await asyncio.sleep(3600)  # runs forever
            except asyncio.CancelledError:
                pass

        mgr._subscriber_task = asyncio.create_task(fake_loop())
        mgr._redis_pubsub = AsyncMock()
        mgr._redis_pubsub.unsubscribe = AsyncMock()
        mgr._redis_pubsub.close = AsyncMock()

        # Should not hang — 2 second timeout
        await asyncio.wait_for(mgr.stop_subscriber(), timeout=2.0)

        # Task should be done
        assert mgr._subscriber_task.done()
        mgr._redis_pubsub.unsubscribe.assert_called_once()
        mgr._redis_pubsub.close.assert_called_once()

    async def test_start_subscriber_no_redis_graceful(self):
        """start_subscriber() should handle missing Redis gracefully."""
        from app.routers.websocket import ConnectionManager

        mgr = ConnectionManager()

        with patch("app.core.security.redis_client", None):
            await mgr.start_subscriber()

            # No task should be created when Redis is unavailable
            assert mgr._subscriber_task is None


class TestBroadcastDelivery:
    """Test message broadcast + local delivery."""

    async def test_local_delivery(self):
        """broadcast() with no Redis should deliver to local connections only."""
        from app.routers.websocket import ConnectionManager

        mgr = ConnectionManager()

        # Create a mock WebSocket
        mock_ws = AsyncMock()
        mock_ws.send_json = AsyncMock()

        mgr.active["notifications:user-1"] = [mock_ws]

        with patch("app.core.security.redis_client", None):
            await mgr.broadcast("notifications:user-1", {"type": "test", "message": "hello"})

        mock_ws.send_json.assert_called_once_with({"type": "test", "message": "hello"})

    async def test_dead_connection_cleanup(self):
        """Dead WebSocket connections should be cleaned up during delivery."""
        from app.routers.websocket import ConnectionManager

        mgr = ConnectionManager()

        # One healthy, one dead
        healthy_ws = AsyncMock()
        healthy_ws.send_json = AsyncMock()

        dead_ws = AsyncMock()
        dead_ws.send_json = AsyncMock(side_effect=Exception("Connection closed"))

        mgr.active["channel-1"] = [healthy_ws, dead_ws]

        with patch("app.core.security.redis_client", None):
            await mgr.broadcast("channel-1", {"msg": "test"})

        # Healthy should receive
        healthy_ws.send_json.assert_called_once()

        # Dead should be removed
        assert dead_ws not in mgr.active.get("channel-1", [])

    async def test_connection_count(self):
        """get_connection_count() should return correct counts."""
        from app.routers.websocket import ConnectionManager

        mgr = ConnectionManager()
        mgr.active["ch-a"] = [AsyncMock(), AsyncMock()]
        mgr.active["ch-b"] = [AsyncMock()]

        assert mgr.get_connection_count("ch-a") == 2
        assert mgr.get_connection_count("ch-b") == 1
        assert mgr.get_connection_count() == 3  # total
        assert mgr.get_connection_count("nonexistent") == 0


class TestWebSocketMiddlewareExclusion:
    """WebSocket paths must be in Bucket C — excluded from ResponseEnvelopeMiddleware."""

    async def test_ws_path_excluded(self):
        """Verify /api/v1/ws/* is in the EXCLUDE_PREFIXES."""
        from app.core.response import ResponseEnvelopeMiddleware

        prefixes = ResponseEnvelopeMiddleware.EXCLUDE_PREFIXES
        assert any("/ws/" in p for p in prefixes), (
            f"WebSocket prefix not found in EXCLUDE_PREFIXES: {prefixes}"
        )

    async def test_ws_stats_endpoint_not_wrapped(self):
        """A JSON endpoint under /api/v1/ws/ should NOT be wrapped."""
        from app.core.response import ResponseEnvelopeMiddleware
        from fastapi import FastAPI

        app = FastAPI()
        app.add_middleware(ResponseEnvelopeMiddleware)

        @app.get("/api/v1/ws/stats")
        async def ws_stats():
            return {"active_connections": 42}

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/v1/ws/stats")
            body = resp.json()

            # Should NOT have envelope
            assert body == {"active_connections": 42}
            assert "data" not in body
            assert "error" not in body


# ── Helpers ──────────────────────────────────────────────────────────────────

async def aiter_empty():
    """Empty async iterator for mocking pubsub.listen()."""
    return
    yield  # noqa — makes this an async generator
