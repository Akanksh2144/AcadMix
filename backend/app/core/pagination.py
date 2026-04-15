"""
Pagination — Reusable pagination utilities for list endpoints.

Usage in routers:

    from app.core.pagination import PaginatedParams, paginated_response

    @router.get("/items")
    async def list_items(
        params: PaginatedParams = Depends(),
        session: AsyncSession = Depends(get_db),
    ):
        query = select(Item).where(Item.college_id == college_id)
        return await paginated_response(session, query, params)

Response shape:
    {
        "data": [...],
        "pagination": {
            "page": 1,
            "page_size": 50,
            "total": 238,
            "total_pages": 5,
            "has_next": true,
            "has_prev": false
        }
    }
"""

import math
from typing import Any

from fastapi import Query
from sqlalchemy import func, select as sa_select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import Select


class PaginatedParams:
    """FastAPI dependency for pagination query parameters.

    Usage:
        async def my_endpoint(params: PaginatedParams = Depends()):
            ...
    """

    def __init__(
        self,
        page: int = Query(1, ge=1, description="Page number (1-indexed)"),
        page_size: int = Query(50, ge=1, le=200, description="Items per page (max 200)"),
    ):
        self.page = page
        self.page_size = page_size
        self.offset = (page - 1) * page_size


async def paginated_response(
    session: AsyncSession,
    query: Select,
    params: PaginatedParams,
    *,
    serialize: Any = None,
) -> dict:
    """Execute a query with pagination and return a standardized response.

    Args:
        session: The async DB session.
        query: A SQLAlchemy SELECT statement (before LIMIT/OFFSET).
        params: PaginatedParams dependency instance.
        serialize: Optional callable to transform each row (e.g., lambda r: r.__dict__).
                   If None, returns ORM objects as-is.

    Returns:
        Dict with "data" and "pagination" keys.
    """
    # Count total rows (without LIMIT/OFFSET)
    count_query = sa_select(func.count()).select_from(query.subquery())
    total_result = await session.execute(count_query)
    total = total_result.scalar() or 0

    # Fetch the page
    paginated_query = query.offset(params.offset).limit(params.page_size)
    result = await session.execute(paginated_query)
    rows = result.scalars().all()

    # Serialize if needed
    if serialize:
        data = [serialize(row) for row in rows]
    else:
        data = rows

    total_pages = math.ceil(total / params.page_size) if params.page_size else 0

    return {
        "data": data,
        "pagination": {
            "page": params.page,
            "page_size": params.page_size,
            "total": total,
            "total_pages": total_pages,
            "has_next": params.page < total_pages,
            "has_prev": params.page > 1,
        },
    }
