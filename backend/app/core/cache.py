"""
Redis-backed response cache for read-heavy endpoints.

Usage in routers:
    from app.core.cache import cached_response, cache_set, invalidate_cache

    @router.get("/dashboard/student")
    async def student_dashboard(user = Depends(get_current_user), ...):
        cache_key = f"dashboard:student:{user['id']}"
        cached = await cached_response(cache_key)
        if cached:
            return cached

        result = await svc.get_dashboard(...)
        await cache_set(cache_key, result, ttl=60)
        return result

Cache invalidation on writes:
    await invalidate_cache("dashboard:student:*")
"""
import json
import logging
from typing import Any, Optional
from app.core.config import settings

logger = logging.getLogger("acadmix.cache")

_redis = None


async def _get_redis():
    """Lazy-init async Redis client. Returns None if Redis is not configured."""
    global _redis
    if _redis is None and settings.REDIS_URL:
        import redis.asyncio as aioredis
        _redis = aioredis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2,
        )
    return _redis


async def cached_response(key: str) -> Optional[Any]:
    """Get a cached response by key. Returns None on miss or error."""
    r = await _get_redis()
    if not r:
        return None
    try:
        raw = await r.get(f"cache:{key}")
        return json.loads(raw) if raw else None
    except Exception:
        logger.debug("Cache miss (error) for key: %s", key)
        return None


async def cache_set(key: str, value: Any, ttl: int = 60) -> None:
    """Cache a JSON-serializable value with TTL in seconds."""
    r = await _get_redis()
    if not r:
        return
    try:
        await r.setex(f"cache:{key}", ttl, json.dumps(value, default=str))
    except Exception:
        logger.debug("Cache set failed for key: %s", key)


async def invalidate_cache(pattern: str) -> None:
    """Invalidate all cache keys matching a glob pattern.
    
    Use sparingly — SCAN-based deletion is O(N) on key count.
    Prefer explicit key deletion where possible.
    """
    r = await _get_redis()
    if not r:
        return
    try:
        keys = []
        async for key in r.scan_iter(f"cache:{pattern}"):
            keys.append(key)
        if keys:
            await r.delete(*keys)
            logger.debug("Invalidated %d cache keys matching: %s", len(keys), pattern)
    except Exception:
        logger.debug("Cache invalidation failed for pattern: %s", pattern)
