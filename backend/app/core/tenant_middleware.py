"""
Tenant Middleware — Multi-Tenant Subdomain Routing

Reads the X-Tenant header from incoming requests and resolves it
to a TenantContext using a three-tier cache strategy:

Resolution order:
  1. In-memory TTL cache (instant — no I/O)
  2. Redis cache (key: tenant:{slug})  — TTL 5 minutes
  3. PostgreSQL colleges table         — cached on hit
  4. 400 error                         — unknown tenant rejected

The in-memory cache ensures that even when Redis is down, the DB is
hit at most once per slug per TTL window — eliminating the pool
exhaustion that occurs under high-frequency request bursts.
"""

import json
import time
import logging
import asyncio
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from fastapi import HTTPException

logger = logging.getLogger(__name__)

# Cache TTL for tenant configs (seconds)
TENANT_CACHE_TTL = 300  # 5 minutes
MEMORY_CACHE_TTL = 120  # 2 minutes for in-memory (shorter to stay fresh)
NEGATIVE_CACHE_TTL = 60  # 1 minute for "not found" slugs

# Max retries for transient DB failures
_DB_RESOLVE_MAX_RETRIES = 2
_DB_RESOLVE_RETRY_DELAY = 2.0  # seconds (initial TCP to Supabase takes 10-15s)

# Slugs that bypass tenant resolution (public endpoints)
PUBLIC_PATHS = {"/api/health", "/api/health/db", "/api/auth/login", "/api/auth/register", "/docs", "/openapi.json"}


# ═══════════════════════════════════════════════════════════════════════════════
# IN-MEMORY TTL CACHE — zero-dependency, thread-safe fallback
# Ensures DB is hit at most once per slug per MEMORY_CACHE_TTL window,
# even when Redis is completely unavailable.
# ═══════════════════════════════════════════════════════════════════════════════

class _TTLCache:
    """Simple in-memory TTL cache. Not bounded by size since tenant count is small."""

    def __init__(self):
        self._store: dict[str, tuple[float, dict | None]] = {}

    def get(self, key: str) -> tuple[bool, dict | None]:
        """Returns (hit, value). hit=True means cache is valid."""
        entry = self._store.get(key)
        if entry is None:
            return False, None
        expiry, value = entry
        if time.monotonic() > expiry:
            del self._store[key]
            return False, None
        return True, value

    def set(self, key: str, value: dict | None, ttl: float):
        self._store[key] = (time.monotonic() + ttl, value)

    def clear(self):
        self._store.clear()


_memory_cache = _TTLCache()


class TenantContext:
    """Immutable tenant context attached to each request."""
    __slots__ = ("slug", "college_id", "name", "plan", "domain", "is_demo")

    def __init__(self, slug: str, college_id: str, name: str, plan: str, domain: str = ""):
        self.slug = slug
        self.college_id = college_id
        self.name = name
        self.plan = plan
        self.domain = domain
        self.is_demo = slug == "demo"

    def __repr__(self):
        return f"<Tenant slug={self.slug} college={self.college_id}>"


async def _resolve_tenant_from_db(slug: str) -> dict | None:
    """Look up a tenant by slug/domain in the colleges table.

    Uses the admin engine so the lookup isn't subject to RLS.
    Returns a dict with tenant config, or None if not found.

    Includes retry logic for transient connection failures (TimeoutError,
    socket.gaierror) to handle intermittent Supabase pooler issues.
    """
    from database import AdminSessionLocal
    from sqlalchemy.future import select
    from sqlalchemy import func

    last_error = None

    for attempt in range(_DB_RESOLVE_MAX_RETRIES + 1):
        try:
            async with AdminSessionLocal() as session:
                from app.models.core import College

                # Match by domain (slug == domain prefix) or by name (case-insensitive)
                result = await session.execute(
                    select(College).where(
                        College.is_deleted == False,
                        (
                            (func.lower(College.domain) == slug)
                            | (func.lower(College.name) == slug)
                            | (func.lower(College.domain) == f"{slug}.acadmix.org")
                            | (func.lower(College.domain).startswith(f"{slug}."))
                        ),
                    )
                )
                college = result.scalars().first()

                if not college:
                    return None

                # Extract plan from settings or default to "starter"
                plan = "starter"
                if college.settings and isinstance(college.settings, dict):
                    plan = college.settings.get("plan", "starter")

                return {
                    "college_id": college.id,
                    "name": college.name,
                    "domain": college.domain or "",
                    "plan": plan,
                }

        except (TimeoutError, OSError, ConnectionRefusedError) as e:
            last_error = e
            if attempt < _DB_RESOLVE_MAX_RETRIES:
                logger.warning(
                    "Tenant DB lookup transient failure (attempt %d/%d) for '%s': %s",
                    attempt + 1, _DB_RESOLVE_MAX_RETRIES + 1, slug, type(e).__name__,
                )
                await asyncio.sleep(_DB_RESOLVE_RETRY_DELAY * (attempt + 1))
            else:
                logger.error(
                    "Tenant DB lookup failed after %d attempts for '%s': %s",
                    _DB_RESOLVE_MAX_RETRIES + 1, slug, e,
                )

        except Exception as e:
            # Non-transient errors — don't retry
            logger.error("Tenant DB lookup unexpected error for '%s': %s", slug, e)
            last_error = e
            break

    # All retries exhausted — raise so caller can handle gracefully
    raise last_error if last_error else RuntimeError(f"Tenant resolution failed for '{slug}'")


async def _get_redis():
    """Get the async Redis client, or None if unavailable."""
    try:
        from app.core.security import redis_client
        return redis_client
    except Exception:
        return None


async def resolve_tenant(slug: str) -> dict | None:
    """Resolve a tenant slug to a config dict.

    Resolution order:
      1. In-memory TTL cache (instant)
      2. Redis cache (fast path)
      3. DB lookup (slow path, cached on hit in both layers)

    Returns None for unknown slugs (cached briefly to prevent DB hammering).
    Raises on persistent DB connection failures.
    """
    # 1. In-memory cache (fastest — no I/O at all)
    hit, cached_config = _memory_cache.get(slug)
    if hit:
        return cached_config  # may be None for negative cache

    # 2. Try Redis cache
    cache_key = f"tenant:{slug}"
    redis = await _get_redis()
    if redis:
        try:
            cached = await redis.get(cache_key)
            if cached:
                config = json.loads(cached)
                # Populate memory cache from Redis
                _memory_cache.set(slug, config, MEMORY_CACHE_TTL)
                return config
        except Exception:
            logger.debug("Redis cache miss for tenant '%s' (connection issue)", slug)

    # 3. Fall back to DB lookup (with retry)
    config = await _resolve_tenant_from_db(slug)

    # Cache in memory (even None for negative cache to prevent hammering)
    _memory_cache.set(
        slug,
        config,
        MEMORY_CACHE_TTL if config else NEGATIVE_CACHE_TTL,
    )

    # Cache in Redis if available
    if config and redis:
        try:
            await redis.setex(cache_key, TENANT_CACHE_TTL, json.dumps(config))
        except Exception:
            logger.debug("Failed to cache tenant config for '%s'", slug)

    return config


class TenantMiddleware(BaseHTTPMiddleware):
    """
    Extracts tenant information from X-Tenant header.

    If no X-Tenant header is present, the request proceeds without
    tenant scoping (backwards-compatible with existing single-tenant usage).

    Handles DB connection failures gracefully (503) instead of crashing (500).
    """

    async def dispatch(self, request: Request, call_next):
        tenant_slug = request.headers.get("x-tenant")

        if tenant_slug:
            tenant_slug = tenant_slug.lower().strip()

            try:
                tenant_config = await resolve_tenant(tenant_slug)
            except (TimeoutError, OSError, ConnectionRefusedError) as e:
                # DB is unreachable — return 503 instead of crashing with 500
                logger.error(
                    "Tenant resolution failed (DB unreachable) for slug='%s': %s",
                    tenant_slug, type(e).__name__,
                )
                return JSONResponse(
                    status_code=503,
                    content={
                        "data": None,
                        "error": "Service temporarily unavailable. Please retry in a few seconds.",
                        "meta": {"retry_after_seconds": 5},
                    },
                    headers={"Retry-After": "5"},
                )
            except Exception as e:
                logger.error(
                    "Unexpected error during tenant resolution for slug='%s': %s",
                    tenant_slug, e,
                )
                return JSONResponse(
                    status_code=503,
                    content={
                        "data": None,
                        "error": "Service temporarily unavailable. Please retry in a few seconds.",
                        "meta": {"retry_after_seconds": 5},
                    },
                    headers={"Retry-After": "5"},
                )

            if tenant_config is None:
                # Unknown tenant — reject explicitly to prevent tenant impersonation.
                logger.warning("Rejected unknown tenant slug: %s", tenant_slug)
                return JSONResponse(
                    status_code=400,
                    content={"detail": f"Unknown tenant: '{tenant_slug}'. Contact support to provision a new tenant."},
                )

            request.state.tenant = TenantContext(
                slug=tenant_slug,
                college_id=tenant_config["college_id"],
                name=tenant_config["name"],
                plan=tenant_config["plan"],
                domain=tenant_config.get("domain", ""),
            )
            logger.debug("Tenant resolved: %s", request.state.tenant)
        else:
            # No tenant header — single-tenant / local dev mode
            request.state.tenant = None

        try:
            response = await call_next(request)
            return response
        except RuntimeError as e:
            if str(e) == 'No response returned.':
                logger.info(f"Client disconnected during request to {request.url.path}")
                from starlette.responses import Response
                return Response(status_code=499)
            raise


def get_tenant(request: Request) -> TenantContext | None:
    """FastAPI dependency to get the current tenant from request state."""
    return getattr(request.state, "tenant", None)


def require_tenant(request: Request) -> TenantContext:
    """FastAPI dependency that requires a valid tenant context."""
    tenant = getattr(request.state, "tenant", None)
    if tenant is None:
        raise HTTPException(
            status_code=400,
            detail="X-Tenant header is required for this endpoint."
        )
    return tenant
