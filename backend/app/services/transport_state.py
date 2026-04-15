"""
Transport Redis State Engine
=============================
All live bus data lives ONLY in Redis. Zero PostgreSQL writes during trips.

Key schema:
  bus:live:{route_id}    → {lat, lng, speed, heading, ts}   TTL 60s
  bus:trip:{route_id}    → {trip_id, state, direction, started_at}  TTL 18h
  bus:node:{route_id}    → node_index (int)                 TTL 18h
  bus:eta:{route_id}     → {next_stop, eta_min, updated_at} TTL 120s
  bus:maxspeed:{route_id}→ max speed recorded this trip     TTL 18h
"""

import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any

import redis.asyncio as aioredis
from app.core.config import settings

logger = logging.getLogger("acadmix.transport_state")

_redis: Optional[aioredis.Redis] = None


async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(
            settings.REDIS_URL or "redis://localhost:6379",
            decode_responses=True,
        )
    return _redis


# ─── Live Position ───────────────────────────────────────────────────────────


async def update_live_position(
    route_id: str, lat: float, lng: float,
    speed: float = 0, heading: float = 0,
):
    """Store latest GPS coordinates. TTL 60s — auto-expires if device stops pinging."""
    r = await get_redis()
    data = json.dumps({
        "lat": lat, "lng": lng,
        "speed": speed, "heading": heading,
        "ts": datetime.utcnow().isoformat(),
    })
    await r.set(f"bus:live:{route_id}", data, ex=60)

    # Track max speed for trip summary
    current_max = await r.get(f"bus:maxspeed:{route_id}")
    if current_max is None or speed > float(current_max):
        await r.set(f"bus:maxspeed:{route_id}", str(speed), ex=64800)  # 18h


async def get_live_position(route_id: str) -> Optional[Dict[str, Any]]:
    """Get last known position from Redis. Returns None if bus is inactive."""
    r = await get_redis()
    data = await r.get(f"bus:live:{route_id}")
    if data:
        return json.loads(data)
    return None


# ─── Trip State ──────────────────────────────────────────────────────────────


async def start_trip(route_id: str, trip_id: str, direction: str = "morning"):
    """Set trip state to STARTED in Redis."""
    r = await get_redis()
    data = json.dumps({
        "trip_id": trip_id,
        "state": "started",
        "direction": direction,
        "started_at": datetime.utcnow().isoformat(),
    })
    await r.set(f"bus:trip:{route_id}", data, ex=64800)  # 18h
    await r.set(f"bus:node:{route_id}", "0", ex=64800)
    logger.info("Trip started: route=%s trip=%s direction=%s", route_id, trip_id, direction)


async def get_trip_state(route_id: str) -> Optional[Dict[str, Any]]:
    """Get current trip state."""
    r = await get_redis()
    data = await r.get(f"bus:trip:{route_id}")
    if data:
        return json.loads(data)
    return None


async def end_trip(route_id: str) -> Optional[float]:
    """Clear all Redis keys for this route. Returns max speed recorded."""
    r = await get_redis()
    max_speed = await r.get(f"bus:maxspeed:{route_id}")
    # Clean up all state
    await r.delete(
        f"bus:live:{route_id}",
        f"bus:trip:{route_id}",
        f"bus:node:{route_id}",
        f"bus:eta:{route_id}",
        f"bus:maxspeed:{route_id}",
    )
    logger.info("Trip ended: route=%s", route_id)
    return float(max_speed) if max_speed else None


# ─── Current Node ────────────────────────────────────────────────────────────


async def set_current_node(route_id: str, node_index: int):
    """Update the current stop node the bus has reached/departed."""
    r = await get_redis()
    await r.set(f"bus:node:{route_id}", str(node_index), ex=64800)

    # Also update trip state
    trip_data = await get_trip_state(route_id)
    if trip_data:
        trip_data["state"] = "in_transit"
        await r.set(f"bus:trip:{route_id}", json.dumps(trip_data), ex=64800)

    logger.info("Node update: route=%s node=%d", route_id, node_index)


async def get_current_node(route_id: str) -> Optional[int]:
    """Get the current node index (last stop the bus reached)."""
    r = await get_redis()
    node = await r.get(f"bus:node:{route_id}")
    if node is not None:
        return int(node)
    return None


# ─── ETA ─────────────────────────────────────────────────────────────────────


async def update_eta(route_id: str, next_stop_name: str, eta_minutes: int):
    """Store computed ETA for next stop."""
    r = await get_redis()
    data = json.dumps({
        "next_stop": next_stop_name,
        "eta_min": eta_minutes,
        "updated_at": datetime.utcnow().isoformat(),
    })
    await r.set(f"bus:eta:{route_id}", data, ex=120)


async def get_eta(route_id: str) -> Optional[Dict[str, Any]]:
    """Get ETA for next stop."""
    r = await get_redis()
    data = await r.get(f"bus:eta:{route_id}")
    if data:
        return json.loads(data)
    return None


# ─── Bulk Operations ─────────────────────────────────────────────────────────


async def get_all_active_trips() -> list:
    """Scan Redis for all active bus trips. Used by geofence worker."""
    r = await get_redis()
    keys = []
    async for key in r.scan_iter("bus:trip:*"):
        route_id = key.replace("bus:trip:", "")
        trip_data = await get_trip_state(route_id)
        if trip_data and trip_data.get("state") in ("started", "in_transit"):
            position = await get_live_position(route_id)
            keys.append({
                "route_id": route_id,
                "trip": trip_data,
                "position": position,
                "current_node": await get_current_node(route_id),
            })
    return keys
