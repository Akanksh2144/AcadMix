"""
Tenant Middleware — Multi-Tenant Subdomain Routing

Reads the X-Tenant header from incoming requests and resolves it
to a TenantContext using a Redis-cached, DB-backed lookup.

Flow:
  1. Client detects subdomain (e.g., "gnitc" from gnitc.acadmix.org)
  2. Frontend attaches X-Tenant: gnitc to every API request
  3. This middleware resolves "gnitc" → College row → TenantContext
  4. All downstream DB queries are scoped to that college

Resolution order:
  1. Redis cache (key: tenant:{slug})  — TTL 5 minutes
  2. PostgreSQL colleges table         — cached on hit
  3. 400 error                         — unknown tenant rejected
"""

import json
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from fastapi import HTTPException

logger = logging.getLogger(__name__)

# Cache TTL for tenant configs (seconds)
TENANT_CACHE_TTL = 300  # 5 minutes

# Slugs that bypass tenant resolution (public endpoints)
PUBLIC_PATHS = {"/api/health", "/api/health/db", "/api/auth/login", "/api/auth/register", "/docs", "/openapi.json"}


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
    """
    from database import AdminSessionLocal
    from sqlalchemy.future import select
    from sqlalchemy import func

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
      1. Redis cache (fast path)
      2. DB lookup (slow path, cached on hit)
    """
    cache_key = f"tenant:{slug}"

    # 1. Try Redis cache
    redis = await _get_redis()
    if redis:
        try:
            cached = await redis.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception:
            logger.debug("Redis cache miss for tenant '%s' (connection issue)", slug)

    # 2. Fall back to DB lookup
    config = await _resolve_tenant_from_db(slug)

    if config and redis:
        # Cache for future requests
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
    """

    async def dispatch(self, request: Request, call_next):
        tenant_slug = request.headers.get("x-tenant")

        if tenant_slug:
            tenant_slug = tenant_slug.lower().strip()

            tenant_config = await resolve_tenant(tenant_slug)

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

        response = await call_next(request)
        return response


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
