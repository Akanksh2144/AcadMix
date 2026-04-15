"""
Rate Limiter — uses real client IP behind reverse proxy.

Supports X-Forwarded-For (Fly.io, Railway, Vercel) and X-Real-IP (Nginx).
Falls back to direct remote address for local development.
"""
import redis.asyncio as pyredis
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.config import settings

redis_url = settings.REDIS_URL
redis_client = pyredis.from_url(redis_url) if redis_url else None


def _get_real_ip(request) -> str:
    """Extract real client IP behind reverse proxy (Fly.io/Railway/Vercel)."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # X-Forwarded-For: client, proxy1, proxy2 — take the first (real client)
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    return get_remote_address(request)


limiter = Limiter(
    key_func=_get_real_ip,
    storage_uri=redis_url,
) if redis_url else Limiter(key_func=_get_real_ip)
