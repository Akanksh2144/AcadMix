from datetime import datetime, timezone
from fastapi import APIRouter

from app.schemas import *
router = APIRouter()

@router.get("/")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}


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
