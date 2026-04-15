"""
Health check endpoints for liveness and readiness probes.

- GET /health          → Lightweight liveness probe (k8s/Fly.io)
- GET /health/ready    → Deep readiness: DB + Redis connectivity  
- GET /health/db       → Pool metrics + RLS shadow status
- GET /health/test-sentry → Intentional crash to verify Sentry
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from database import get_db
from app.core.config import settings

router = APIRouter()


@router.get("/")
async def health():
    """Lightweight liveness probe — no external dependencies."""
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}


@router.get("/ready")
async def readiness(session: AsyncSession = Depends(get_db)):
    """Deep readiness probe — verifies DB and Redis connectivity.
    
    Use this for container orchestration readiness gates and 
    deployment health checks (Fly.io, Railway, k8s).
    """
    checks = {}

    # Database connectivity
    try:
        await session.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as e:
        checks["database"] = f"error: {type(e).__name__}"

    # Redis connectivity
    try:
        if settings.REDIS_URL:
            import redis.asyncio as aioredis
            r = aioredis.from_url(settings.REDIS_URL, socket_connect_timeout=2)
            await r.ping()
            await r.aclose()
            checks["redis"] = "ok"
        else:
            checks["redis"] = "not_configured"
    except Exception as e:
        checks["redis"] = f"error: {type(e).__name__}"

    all_ok = all(v == "ok" for v in checks.values() if v != "not_configured")

    return {
        "status": "ready" if all_ok else "degraded",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "checks": checks,
    }


@router.get("/db")
async def health_db():
    """Connection pool metrics + RLS shadow-mode status.

    Use this endpoint for production monitoring dashboards (Prometheus,
    Grafana, Datadog). Alerts should fire when:
      - checked_out approaches pool_size (pool saturation)
      - rls_circuit_open is True (cross-tenant leak detected)
    """
    from database import get_pool_status

    pool = get_pool_status()
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "connection_pool": {
            "pool_size": pool["pool_size"],
            "checked_in": pool["checked_in"],
            "checked_out": pool["checked_out"],
            "overflow": pool["overflow"],
            "max_overflow": pool["max_overflow"],
            "pgbouncer_enabled": pool["pgbouncer_enabled"],
        },
        "rls_shadow_mode": {
            "mode": pool["rls_shadow_mode"],
            "violations_logged": pool["rls_shadow_violations"],
            "circuit_open": pool["rls_circuit_open"],
        },
    }


@router.get("/test-sentry")
async def test_sentry():
    """Intentional crash to verify Sentry connection and PII scrubbing."""
    division_by_zero = 1 / 0
    return {"message": "If you see this, Sentry didn't catch the intentional crash!"}
