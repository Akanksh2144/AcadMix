"""
Idempotency Guard — prevents duplicate mutations from network retries.

Protects critical endpoints (bed booking, enrollment, payments) from
double-processing when a client retries due to network timeout.

Usage (as a decorator on router handlers):

    from app.core.idempotency import idempotent

    @router.post("/hostel/book-bed")
    @idempotent(resource="bed_booking", ttl_hours=24)
    async def book_bed(request: Request, ...):
        ...

The guard reads the X-Idempotency-Key header:
  - If absent → normal execution (backwards compatible)
  - If present + new → execute, cache response, return it
  - If present + seen → return cached response (HTTP 200, same body)

Atomicity is ensured via Redis SET NX (set-if-not-exists) with TTL.
"""
import json
import logging
import functools
from typing import Optional

from fastapi import Request
from fastapi.responses import JSONResponse

logger = logging.getLogger("acadmix.idempotency")


async def _get_redis():
    """Get the shared Redis client, or None if unavailable."""
    try:
        from app.core.security import redis_client
        return redis_client
    except Exception:
        return None


async def check_idempotency(
    request: Request,
    resource: str,
    ttl_seconds: int = 86400,
) -> Optional[JSONResponse]:
    """Check if a request with the given idempotency key has been processed.

    Args:
        request: The FastAPI request object.
        resource: Resource namespace (e.g., "bed_booking", "enrollment").
        ttl_seconds: TTL for the idempotency key in Redis (default: 24h).

    Returns:
        - JSONResponse with cached result if the key was already processed.
        - None if the key is new (caller should proceed with execution).
    """
    idem_key = request.headers.get("X-Idempotency-Key")
    if not idem_key:
        return None  # No idempotency header — normal execution

    redis = await _get_redis()
    if not redis:
        return None  # Redis unavailable — skip idempotency check

    cache_key = f"idem:{resource}:{idem_key}"

    try:
        # Check if this key was already processed
        cached = await redis.get(cache_key)
        if cached:
            logger.info(
                "Idempotency hit: resource=%s key=%s (returning cached response)",
                resource, idem_key,
            )
            data = json.loads(cached)
            return JSONResponse(
                content=data["body"],
                status_code=data.get("status_code", 200),
                headers={"X-Idempotency-Replayed": "true"},
            )
    except Exception:
        logger.debug("Idempotency check failed (Redis error) for key=%s", idem_key)

    return None


async def store_idempotency(
    request: Request,
    resource: str,
    response_body: dict,
    status_code: int = 200,
    ttl_seconds: int = 86400,
) -> None:
    """Store a processed response for future idempotency checks.

    Call this AFTER successfully processing the request.

    Args:
        request: The FastAPI request object.
        resource: Resource namespace (must match check_idempotency call).
        response_body: The JSON-serializable response body to cache.
        status_code: The HTTP status code to cache.
        ttl_seconds: TTL for the cached response (default: 24h).
    """
    idem_key = request.headers.get("X-Idempotency-Key")
    if not idem_key:
        return

    redis = await _get_redis()
    if not redis:
        return

    cache_key = f"idem:{resource}:{idem_key}"

    try:
        payload = json.dumps({
            "body": response_body,
            "status_code": status_code,
        }, default=str)

        # SET NX + EX: only set if not exists, with TTL
        await redis.set(cache_key, payload, ex=ttl_seconds, nx=True)
    except Exception:
        logger.debug("Failed to store idempotency result for key=%s", idem_key)


def idempotent(resource: str, ttl_hours: int = 24):
    """Decorator that adds idempotency guard to a FastAPI endpoint.

    Usage:
        @router.post("/book-bed")
        @idempotent(resource="bed_booking", ttl_hours=24)
        async def book_bed(request: Request, ...):
            ...

    The decorated function MUST accept `request: Request` as its first
    positional argument (standard FastAPI pattern).

    Behavior:
      - If X-Idempotency-Key header is absent → normal execution
      - If header is present + new → execute, cache result, return it
      - If header is present + already seen → return cached result

    NOTE: This decorator works with functions that return dicts.
    If the function returns a Response object directly, the caching
    will be skipped (the response is returned as-is).
    """
    ttl_seconds = ttl_hours * 3600

    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Find the Request object from args/kwargs
            request = kwargs.get("request")
            if request is None and args:
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break

            if request is None:
                # Can't do idempotency without a Request — just run normally
                return await func(*args, **kwargs)

            # Check for cached response
            cached = await check_idempotency(request, resource, ttl_seconds)
            if cached is not None:
                return cached

            # Execute the handler
            result = await func(*args, **kwargs)

            # Cache the result (only if it's a dict, not a Response object)
            if isinstance(result, dict):
                await store_idempotency(
                    request, resource, result, status_code=200, ttl_seconds=ttl_seconds,
                )

            return result

        return wrapper
    return decorator
