"""
Standardized API response helpers + Request ID middleware.

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
import uuid
import logging
from typing import Any, Optional, Dict
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("acadmix.response")


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
