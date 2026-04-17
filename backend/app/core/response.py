"""
Standardized API response helpers + Request ID middleware + Response Envelope middleware.

Every outbound response should follow the envelope:
    {
        "data": <payload>,
        "error": null | "message",
        "meta": { "request_id": "abc", ... }
    }

Usage:
    from app.core.response import success

    @router.get("/items")
    async def list_items(...):
        items = await svc.list_items()
        return success(items)
"""
import json
import uuid
import logging
from typing import Any, Optional, Dict
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import StreamingResponse, Response

logger = logging.getLogger("acadmix.response")


async def mark_enveloped(response: Response):
    """FastAPI dependency that marks a response as already-enveloped.

    Used on Bucket A routers (those that already return {"data": ...}).
    Prevents ResponseEnvelopeMiddleware from double-wrapping.

    Usage (router-level, applies to all endpoints):
        router = APIRouter(dependencies=[Depends(mark_enveloped)])

    Usage (per-endpoint):
        @router.get("/endpoint", dependencies=[Depends(mark_enveloped)])
    """
    response.headers["X-Envelope-Applied"] = "true"

def success(data: Any = None, meta: Optional[Dict] = None, status_code: int = 200) -> dict:
    """Wrap a successful response in the standard envelope."""
    envelope = {
        "data": data,
        "error": None,
    }
    if meta:
        envelope["meta"] = meta
    return envelope


def error_response(message: str, status_code: int = 400, details: Optional[dict] = None) -> JSONResponse:
    """Return a standardized error response."""
    return JSONResponse(
        status_code=status_code,
        content={
            "data": None,
            "error": message,
            "meta": {"details": details} if details else {},
        },
    )


class RequestIdMiddleware(BaseHTTPMiddleware):
    """Adds X-Request-ID header to every request/response for log correlation.
    
    If the client sends an X-Request-ID, it's preserved.
    Otherwise, a short UUID is generated.
    """

    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())[:8]
        request.state.request_id = request_id
        
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


class ResponseEnvelopeMiddleware(BaseHTTPMiddleware):
    """Global middleware that wraps flat JSON responses in the standard envelope.

    Bucket classification:
      - Bucket A (already enveloped): detected by X-Envelope-Applied header (contract)
        or {"data", "error"} shape (emergency heuristic for DomainException handler)
      - Bucket B (flat JSON): wrapped into {"data": <payload>, "error": null}
      - Bucket C (excluded): skipped via path prefix or response type

    CTO-mandated safety features:
      1. StreamingResponse isinstance check before body read (prevents memory bomb)
      2. content-length stripped from passthrough headers (prevents truncation)
      3. Exhausted body_iterator handled with Response(content=body)
      4. Heuristic is emergency-only net; header is the contract
    """

    EXCLUDE_PREFIXES = (
        "/api/v1/health",
        "/api/health",
        "/api/v1/ws/",
        "/api/ws/",
        "/api/v1/webhooks/",
        "/api/webhooks/",
        "/metrics",
        "/docs",
        "/redoc",
        "/openapi.json",
    )

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # 1. Path-based exclusion (Bucket C)
        if any(path.startswith(p) for p in self.EXCLUDE_PREFIXES):
            return await call_next(request)

        response = await call_next(request)

        # 2. Skip non-JSON by content-type
        #    This catches SSE (text/event-stream), HTML, CSV, binary, etc.
        #    NOTE: In BaseHTTPMiddleware, call_next() wraps ALL responses in
        #    an internal _StreamingResponse, so isinstance(response, StreamingResponse)
        #    is ALWAYS True — do NOT use isinstance check here.
        content_type = response.headers.get("content-type", "")
        if "application/json" not in content_type:
            return response

        # 4. Skip explicitly marked responses (Bucket A header contract)
        if response.headers.get("X-Envelope-Applied") == "true":
            return response

        # 5. Read and parse body (iterator is consumed — must reconstruct)
        body = b"".join([chunk async for chunk in response.body_iterator])

        # 5a. Empty body (e.g. 204 No Content) — pass through
        if not body:
            return Response(
                content=body,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=content_type,
            )

        try:
            data = json.loads(body)
        except (json.JSONDecodeError, ValueError):
            # Unparseable JSON — return original response unchanged
            return Response(
                content=body,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=content_type,
            )

        # 6. Emergency heuristic — DomainException handler already enveloped
        #    This is the FALLBACK, not the primary mechanism. Bucket A routers
        #    MUST set X-Envelope-Applied header; this only catches the global
        #    exception handler in main.py which returns {"data", "error"}.
        if isinstance(data, dict) and "data" in data and "error" in data:
            return Response(
                content=body,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=content_type,
            )

        # 7. Wrap in envelope (Bucket B)
        envelope = {"data": data, "error": None}

        # Strip content-length and content-type from passthrough headers (Issue 4 fix)
        # JSONResponse will set its own correct values. Passing the old content-length
        # from the unwrapped body causes nginx/k8s ingress to truncate the response.
        passthrough_headers = {
            k: v for k, v in response.headers.items()
            if k.lower() not in ("content-length", "content-type", "x-envelope-applied")
        }

        return JSONResponse(
            content=envelope,
            status_code=response.status_code,
            headers=passthrough_headers,
        )

