"""
Prometheus metrics middleware for FastAPI.

Exposes:
  GET /metrics  →  Prometheus scrape endpoint

Metrics collected:
  - http_requests_total          — counter by method, path, status
  - http_request_duration_seconds — histogram by method, path
  - http_requests_in_progress    — gauge of active requests
  - ws_connections_active         — gauge of WebSocket connections

Usage in main.py:
    from app.core.metrics import PrometheusMiddleware, metrics_endpoint
    app.add_middleware(PrometheusMiddleware)
    app.add_route("/metrics", metrics_endpoint)
"""
import time
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("acadmix.metrics")

try:
    from prometheus_client import (
        Counter,
        Histogram,
        Gauge,
        generate_latest,
        CONTENT_TYPE_LATEST,
        CollectorRegistry,
        REGISTRY,
    )

    REQUEST_COUNT = Counter(
        "http_requests_total",
        "Total HTTP requests",
        ["method", "path_template", "status_code"],
    )
    REQUEST_DURATION = Histogram(
        "http_request_duration_seconds",
        "HTTP request duration in seconds",
        ["method", "path_template"],
        buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
    )
    REQUESTS_IN_PROGRESS = Gauge(
        "http_requests_in_progress",
        "Number of HTTP requests currently being processed",
    )
    WS_CONNECTIONS = Gauge(
        "ws_connections_active",
        "Number of active WebSocket connections",
    )

    PROMETHEUS_AVAILABLE = True

except ImportError:
    PROMETHEUS_AVAILABLE = False
    logger.info("prometheus_client not installed — metrics disabled (pip install prometheus_client)")


def _normalize_path(path: str) -> str:
    """Collapse dynamic path segments to reduce cardinality.
    
    /api/v1/interview/abc123/message → /api/v1/interview/{id}/message
    /api/v1/quiz/xyz/monitor → /api/v1/quiz/{id}/monitor
    """
    parts = path.strip("/").split("/")
    normalized = []
    skip_next = False
    for i, part in enumerate(parts):
        if skip_next:
            skip_next = False
            continue
        # UUIDs and numeric IDs
        if len(part) > 20 or (part and part[0].isdigit()):
            normalized.append("{id}")
        else:
            normalized.append(part)
    return "/" + "/".join(normalized)


class PrometheusMiddleware(BaseHTTPMiddleware):
    """Collect request metrics per endpoint."""

    async def dispatch(self, request: Request, call_next):
        if not PROMETHEUS_AVAILABLE:
            return await call_next(request)

        # Skip metrics endpoint itself
        if request.url.path == "/metrics":
            return await call_next(request)

        method = request.method
        path = _normalize_path(request.url.path)

        REQUESTS_IN_PROGRESS.inc()
        start = time.perf_counter()

        try:
            response = await call_next(request)
            status = str(response.status_code)
        except Exception:
            status = "500"
            raise
        finally:
            duration = time.perf_counter() - start
            REQUEST_COUNT.labels(method=method, path_template=path, status_code=status).inc()
            REQUEST_DURATION.labels(method=method, path_template=path).observe(duration)
            REQUESTS_IN_PROGRESS.dec()

        return response


async def metrics_endpoint(request: Request) -> Response:
    """Prometheus scrape endpoint — returns metrics in Prometheus text format."""
    if not PROMETHEUS_AVAILABLE:
        return Response("prometheus_client not installed", status_code=501)
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
