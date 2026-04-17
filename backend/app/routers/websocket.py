"""
WebSocket endpoints for real-time features.

Channels:
  - /ws/transport/{route_id}  → Live bus location updates
  - /ws/quiz/{quiz_id}/monitor → Live quiz monitoring for teachers
  - /ws/notifications          → User notification feed

Authentication: Pass JWT token as ?token= query parameter.
Scaling: Uses Redis pub/sub for multi-process broadcasting.
"""
import asyncio
import json
import logging
from typing import Dict, List, Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.core.security import JWT_SECRET, JWT_ALGORITHM
import jwt

router = APIRouter()
logger = logging.getLogger("acadmix.ws")

# Redis pub/sub channel name used by all workers
_REDIS_WS_CHANNEL = "acadmix:ws:broadcast"


# ═══════════════════════════════════════════════════════════════════════════════
# Connection Manager (with Redis pub/sub for multi-process scaling)
# ═══════════════════════════════════════════════════════════════════════════════

class ConnectionManager:
    """Manages WebSocket connections per channel with Redis pub/sub relay.

    In-process `active` dict tracks connections owned by THIS worker.
    All broadcast calls are routed through Redis pub/sub so every
    Gunicorn/Uvicorn worker receives the message and pushes it to
    its locally-connected clients.

    The Redis subscriber is initialized once at application startup
    via `start_subscriber()` — called from the FastAPI lifespan
    handler in main.py — NOT lazily on first connection. This avoids
    the race condition where a worker with zero WS connections misses
    broadcasts entirely.
    """

    def __init__(self):
        self.active: Dict[str, List[WebSocket]] = {}
        self._subscriber_task: Optional[asyncio.Task] = None
        self._redis_pubsub = None

    # ── Local connection tracking ────────────────────────────────────────

    async def connect(self, channel: str, ws: WebSocket):
        await ws.accept()
        self.active.setdefault(channel, []).append(ws)
        logger.info("[ws] Client connected to channel: %s (total: %d)",
                     channel, len(self.active[channel]))

    def disconnect(self, channel: str, ws: WebSocket):
        if channel in self.active:
            self.active[channel] = [c for c in self.active[channel] if c != ws]
            if not self.active[channel]:
                del self.active[channel]
        logger.info("[ws] Client disconnected from channel: %s", channel)

    # ── Broadcast (Redis-aware) ──────────────────────────────────────────

    async def broadcast(self, channel: str, data: dict):
        """Publish to Redis pub/sub so ALL workers relay the message.

        Falls back to local-only delivery if Redis is unavailable.
        """
        message = json.dumps({"channel": channel, "data": data})

        try:
            from app.core.security import redis_client
            if redis_client:
                await redis_client.publish(_REDIS_WS_CHANNEL, message)
                return
        except Exception as e:
            logger.warning("[ws] Redis publish failed, falling back to local: %s", e)

        # Fallback: local-only (single-worker mode / Redis down)
        await self._deliver_local(channel, data)

    async def _deliver_local(self, channel: str, data: dict):
        """Push data to all WebSocket connections on this worker for `channel`."""
        dead: List[WebSocket] = []
        for ws in self.active.get(channel, []):
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(channel, ws)

    # ── Redis Subscriber (started once at lifespan startup) ──────────────

    async def start_subscriber(self):
        """Start the background Redis subscriber task.

        Must be called from the FastAPI lifespan context manager so
        every worker — even those with zero WebSocket connections —
        is subscribed from the moment the process starts.
        """
        try:
            from app.core.security import redis_client
            if not redis_client:
                logger.info("[ws] No Redis client — pub/sub disabled (single-worker mode)")
                return

            self._redis_pubsub = redis_client.pubsub()
            await self._redis_pubsub.subscribe(_REDIS_WS_CHANNEL)
            self._subscriber_task = asyncio.create_task(self._subscriber_loop())
            logger.info("[ws] Redis pub/sub subscriber started on channel: %s", _REDIS_WS_CHANNEL)
        except Exception as e:
            logger.error("[ws] Failed to start Redis subscriber: %s", e)

    async def _subscriber_loop(self):
        """Infinite loop reading messages from Redis pub/sub.

        Each received message is dispatched to _deliver_local()
        which pushes it to WebSocket clients connected to THIS worker.
        """
        try:
            async for raw_message in self._redis_pubsub.listen():
                if raw_message["type"] != "message":
                    continue
                try:
                    payload = json.loads(raw_message["data"])
                    channel = payload["channel"]
                    data = payload["data"]
                    await self._deliver_local(channel, data)
                except (json.JSONDecodeError, KeyError) as e:
                    logger.warning("[ws] Malformed pub/sub message: %s", e)
        except asyncio.CancelledError:
            logger.info("[ws] Redis subscriber loop cancelled")
        except Exception as e:
            logger.error("[ws] Redis subscriber loop crashed: %s", e)

    async def stop_subscriber(self):
        """Gracefully shut down the Redis subscriber.

        Called from the lifespan shutdown phase.
        """
        if self._subscriber_task and not self._subscriber_task.done():
            self._subscriber_task.cancel()
            try:
                await self._subscriber_task
            except asyncio.CancelledError:
                pass
        if self._redis_pubsub:
            await self._redis_pubsub.unsubscribe(_REDIS_WS_CHANNEL)
            await self._redis_pubsub.close()
        logger.info("[ws] Redis subscriber stopped")

    def get_connection_count(self, channel: str = None) -> int:
        if channel:
            return len(self.active.get(channel, []))
        return sum(len(conns) for conns in self.active.values())


manager = ConnectionManager()


# ═══════════════════════════════════════════════════════════════════════════════
# Auth Helper
# ═══════════════════════════════════════════════════════════════════════════════

from fastapi import Depends, HTTPException
from app.core.security import get_current_user

@router.post("/ws/ticket")
async def create_ws_ticket(user: dict = Depends(get_current_user)):
    """Generate a short-lived ticket for secure WebSocket handshakes."""
    from app.core.security import redis_client
    import uuid
    if not redis_client:
        raise HTTPException(status_code=503, detail="Redis unavailable")
        
    ticket_id = str(uuid.uuid4())
    await redis_client.setex(f"ws_ticket:{ticket_id}", 30, json.dumps(user))
    return {"ticket": ticket_id}

async def _authenticate_ws(ticket: str) -> dict:
    """Verify WebSocket ticket against Redis and exchange for payload."""
    if not ticket:
        return None
    from app.core.security import redis_client
    if not redis_client:
        return None
        
    key = f"ws_ticket:{ticket}"
    data = await redis_client.get(key)
    if not data:
        return None
        
    await redis_client.delete(key) # Discard after single use
    return json.loads(data)


# ═══════════════════════════════════════════════════════════════════════════════
# Transport — Live Bus Location
# ═══════════════════════════════════════════════════════════════════════════════

@router.websocket("/ws/transport/{route_id}")
async def transport_ws(websocket: WebSocket, route_id: str, ticket: str = Query(None)):
    """Real-time bus location updates for a specific route.
    
    - Students/parents subscribe to receive live GPS updates
    - IoT webhook broadcasts location via `broadcast_transport_update()`
    """
    payload = await _authenticate_ws(ticket)
    if not payload:
        await websocket.close(code=1008, reason="Authentication required")
        return

    channel = f"transport:{route_id}"
    await manager.connect(channel, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(channel, websocket)


# ═══════════════════════════════════════════════════════════════════════════════
# Quiz — Live Monitoring
# ═══════════════════════════════════════════════════════════════════════════════

@router.websocket("/ws/quiz/{quiz_id}/monitor")
async def quiz_monitor_ws(websocket: WebSocket, quiz_id: str, ticket: str = Query(None)):
    """Real-time quiz monitoring for teachers/HODs.
    
    Events broadcasted:
    - student_joined: when a student starts the quiz
    - student_submitted: when a student submits
    - student_switched_tab: proctoring violation
    """
    payload = await _authenticate_ws(ticket)
    if not payload or payload.get("role") not in ("teacher", "hod", "admin", "principal"):
        await websocket.close(code=1008, reason="Insufficient permissions")
        return

    channel = f"quiz_monitor:{quiz_id}"
    await manager.connect(channel, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(channel, websocket)


# ═══════════════════════════════════════════════════════════════════════════════
# Notifications — User Feed
# ═══════════════════════════════════════════════════════════════════════════════

@router.websocket("/ws/notifications")
async def notifications_ws(websocket: WebSocket, ticket: str = Query(None)):
    """Per-user notification feed (announcements, fee reminders, etc.)."""
    payload = await _authenticate_ws(ticket)
    if not payload:
        await websocket.close(code=1008, reason="Authentication required")
        return

    user_id = payload.get("id") or payload.get("sub")
    channel = f"notifications:{user_id}"
    await manager.connect(channel, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(channel, websocket)


# ═══════════════════════════════════════════════════════════════════════════════
# Public API — for other services to broadcast events
# ═══════════════════════════════════════════════════════════════════════════════

async def broadcast_transport_update(route_id: str, location_data: dict):
    """Broadcast bus location update to all subscribers."""
    await manager.broadcast(f"transport:{route_id}", {
        "type": "location_update",
        **location_data,
    })


async def broadcast_quiz_event(quiz_id: str, event_data: dict):
    """Broadcast quiz event (join, submit, violation) to monitoring teachers."""
    await manager.broadcast(f"quiz_monitor:{quiz_id}", event_data)


async def push_notification(user_id: str, notification: dict):
    """Push a notification to a specific user's WebSocket feed."""
    await manager.broadcast(f"notifications:{user_id}", {
        "type": "notification",
        **notification,
    })


@router.get("/ws/stats")
async def ws_stats():
    """Admin: get WebSocket connection statistics."""
    return {
        "total_connections": manager.get_connection_count(),
        "channels": {
            channel: len(conns)
            for channel, conns in manager.active.items()
        },
    }
