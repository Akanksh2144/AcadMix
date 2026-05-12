"""
Rate Limiter — tenant+user scoped for enterprise environments.

Key strategy:
  - Authenticated requests: scoped to tenant_id:user_id (from JWT claims)
  - Unauthenticated requests: scoped to real client IP (X-Forwarded-For aware)

This prevents corporate NAT/proxy users from sharing a single IP-based limit
while still protecting against per-user abuse within a tenant.

Tenant-level rate limiting (TenantRateLimitMiddleware) adds a second
bucket that caps total requests per tenant, preventing a single college
from saturating the connection pool ("noisy neighbor" protection).
"""
import os
import logging
import jwt
import redis.asyncio as pyredis
from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from app.core.config import settings

logger = logging.getLogger("acadmix.limiter")

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
    in_memory_fallback_enabled=True,
    swallow_errors=True
) if redis_url else Limiter(key_func=_get_rate_limit_key)


# ═══════════════════════════════════════════════════════════════════════════════
# TENANT-LEVEL RATE LIMITING — "Noisy Neighbor" Protection
#
# Caps total requests per tenant_id per window. Independent of per-user limits.
# Uses Redis INCR + EXPIRE for atomic, distributed counting.
# ═══════════════════════════════════════════════════════════════════════════════

_TENANT_RATE_LIMIT = int(os.getenv("TENANT_RATE_LIMIT", "1000"))  # requests per window
_TENANT_RATE_WINDOW = int(os.getenv("TENANT_RATE_WINDOW", "60"))  # window in seconds

# Paths exempt from tenant rate limiting (health checks, metrics, etc.)
_TENANT_EXEMPT_PREFIXES = (
    "/api/health", "/api/v1/health", "/metrics", "/docs", "/openapi.json",
)


class TenantRateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware that enforces per-tenant request rate limits.

    Uses Redis INCR with TTL for atomic distributed counting.
    Falls back gracefully (no limit) when Redis is unavailable.

    This protects against a single "heavy" tenant (e.g., one college
    running bulk exports) from starving all other tenants' resources.
    """

    async def dispatch(self, request: Request, call_next):
        # Skip exempt paths
        path = request.url.path
        if any(path.startswith(p) for p in _TENANT_EXEMPT_PREFIXES):
            return await call_next(request)

        # Extract tenant from JWT (most reliable) or X-Tenant header (fallback)
        tenant_id = None
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            try:
                payload = jwt.decode(
                    auth[7:],
                    settings.JWT_SECRET,
                    algorithms=[settings.JWT_ALGORITHM],
                    options={"verify_exp": False},
                )
                tenant_id = payload.get("tenant_id")
            except Exception:
                pass

        if not tenant_id:
            tenant_id = request.headers.get("x-tenant")

        if not tenant_id or not redis_client:
            # No tenant identified or Redis unavailable — skip tenant limiting
            return await call_next(request)

        # Atomic Redis INCR + EXPIRE
        bucket_key = f"tenant_rl:{tenant_id}"
        try:
            current = await redis_client.incr(bucket_key)
            if current == 1:
                # First request in this window — set TTL
                await redis_client.expire(bucket_key, _TENANT_RATE_WINDOW)

            if current > _TENANT_RATE_LIMIT:
                ttl = await redis_client.ttl(bucket_key)
                logger.warning(
                    "Tenant rate limit exceeded: tenant=%s count=%d limit=%d",
                    tenant_id, current, _TENANT_RATE_LIMIT,
                )
                return JSONResponse(
                    status_code=429,
                    content={
                        "data": None,
                        "error": "Rate limit exceeded for your institution. Please try again shortly.",
                        "meta": {"retry_after_seconds": max(ttl, 1)},
                    },
                    headers={"Retry-After": str(max(ttl, 1))},
                )
        except Exception:
            # Redis error — fail open (don't block requests)
            logger.debug("Tenant rate limit check failed (Redis error) for tenant=%s", tenant_id)

        return await call_next(request)

