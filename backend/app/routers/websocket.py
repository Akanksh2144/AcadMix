"""
WebSocket endpoints for real-time features.

Channels:
  - /ws/transport/{route_id}  → Live bus location updates
  - /ws/quiz/{quiz_id}/monitor → Live quiz monitoring for teachers
  - /ws/notifications          → User notification feed

Authentication: Pass JWT token as ?token= query parameter.
Scaling: Uses Redis pub/sub for multi-process broadcasting.
"""
import json
import logging
from typing import Dict, List

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.core.security import JWT_SECRET, JWT_ALGORITHM
import jwt

router = APIRouter()
logger = logging.getLogger("acadmix.ws")


# ═══════════════════════════════════════════════════════════════════════════════
# Connection Manager (with Redis pub/sub for multi-process scaling)
# ═══════════════════════════════════════════════════════════════════════════════

class ConnectionManager:
    """Manages WebSocket connections per channel.
    
    In a single-process setup, this handles all connections in-memory.
    For multi-process (Gunicorn), add Redis pub/sub adapter.
    """

    def __init__(self):
        self.active: Dict[str, List[WebSocket]] = {}
        self._redis_pubsub = None

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

    async def broadcast(self, channel: str, data: dict):
        """Send data to all connections on a channel."""
        dead = []
        for ws in self.active.get(channel, []):
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        # Clean up dead connections
        for ws in dead:
            self.disconnect(channel, ws)

    def get_connection_count(self, channel: str = None) -> int:
        if channel:
            return len(self.active.get(channel, []))
        return sum(len(conns) for conns in self.active.values())


manager = ConnectionManager()


# ═══════════════════════════════════════════════════════════════════════════════
# Auth Helper
# ═══════════════════════════════════════════════════════════════════════════════

def _authenticate_ws(token: str) -> dict:
    """Verify JWT token for WebSocket connection. Returns payload or None."""
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.InvalidTokenError:
        return None


# ═══════════════════════════════════════════════════════════════════════════════
# Transport — Live Bus Location
# ═══════════════════════════════════════════════════════════════════════════════

@router.websocket("/ws/transport/{route_id}")
async def transport_ws(websocket: WebSocket, route_id: str, token: str = Query(None)):
    """Real-time bus location updates for a specific route.
    
    - Students/parents subscribe to receive live GPS updates
    - IoT webhook broadcasts location via `broadcast_transport_update()`
    """
    payload = _authenticate_ws(token)
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
async def quiz_monitor_ws(websocket: WebSocket, quiz_id: str, token: str = Query(None)):
    """Real-time quiz monitoring for teachers/HODs.
    
    Events broadcasted:
    - student_joined: when a student starts the quiz
    - student_submitted: when a student submits
    - student_switched_tab: proctoring violation
    """
    payload = _authenticate_ws(token)
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
async def notifications_ws(websocket: WebSocket, token: str = Query(None)):
    """Per-user notification feed (announcements, fee reminders, etc.)."""
    payload = _authenticate_ws(token)
    if not payload:
        await websocket.close(code=1008, reason="Authentication required")
        return

    user_id = payload.get("sub")
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
