"""
Rate Limiter — tenant+user scoped for enterprise environments.

Key strategy:
  - Authenticated requests: scoped to tenant_id:user_id (from JWT claims)
  - Unauthenticated requests: scoped to real client IP (X-Forwarded-For aware)

This prevents corporate NAT/proxy users from sharing a single IP-based limit
while still protecting against per-user abuse within a tenant.
"""
import jwt
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
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    return get_remote_address(request)


def _get_rate_limit_key(request) -> str:
    """
    Enterprise-grade rate limit key:
      - If JWT present → tenant_id:user_id (per-user within tenant)
      - If no JWT       → client IP (for login, public endpoints)
    """
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        try:
            payload = jwt.decode(
                auth[7:],
                settings.JWT_SECRET,
                algorithms=[settings.JWT_ALGORITHM],
                options={"verify_exp": False},  # Don't reject expired for rate-limit keying
            )
            tenant = payload.get("tenant_id", "unknown")
            user = payload.get("sub", "unknown")
            return f"{tenant}:{user}"
        except Exception:
            pass
    return _get_real_ip(request)


limiter = Limiter(
    key_func=_get_rate_limit_key,
    storage_uri=redis_url,
) if redis_url else Limiter(key_func=_get_rate_limit_key)
