"""
Library Management API Router
===============================
Public API for book catalog search, checkout/return workflows,
reservation holds, fine payments, and librarian admin operations.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from database import get_db
from app.core.security import require_role, get_current_user
from app.core.response import mark_enveloped
from app.services.library_service import LibraryService
from app.schemas.library import (
    BookCreate, BookUpdate, BulkCopyCreate,
    CheckoutRequest, ReturnRequest, RenewRequest,
    ReserveRequest, FinePayRequest, KioskPayload,
)

router = APIRouter(dependencies=[Depends(mark_enveloped)])


def get_library_service(session: AsyncSession = Depends(get_db)):
    return LibraryService(session)


# ═══════════════════════════════════════════════════════════════════════════════
# SEARCH — Public for all authenticated users
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/library/search")
async def search_books(
    q: str = Query("", max_length=200),
    category: Optional[str] = Query(None),
    available_only: bool = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: dict = Depends(get_current_user),
    svc: LibraryService = Depends(get_library_service),
):
    """Full-text catalog search with optional category filter."""
    return {"data": await svc.search_books(
        user["college_id"], q, category, available_only, page, page_size
    )}


@router.get("/library/books/{book_id}")
async def get_book_detail(
    book_id: str,
    user: dict = Depends(get_current_user),
    svc: LibraryService = Depends(get_library_service),
):
    """Book detail with all copy statuses."""
    return {"data": await svc.get_book_detail(book_id, user["college_id"])}


# ═══════════════════════════════════════════════════════════════════════════════
# CATALOG MANAGEMENT — Librarian / Admin
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/library/books")
async def add_book(
    payload: BookCreate,
    user: dict = Depends(require_role("librarian", "admin")),
    svc: LibraryService = Depends(get_library_service),
):
    """Add a new book to the catalog."""
    result = await svc.add_book(user["college_id"], payload.model_dump())
    return {"success": True, "data": result}


@router.put("/library/books/{book_id}")
async def update_book(
    book_id: str,
    payload: BookUpdate,
    user: dict = Depends(require_role("librarian", "admin")),
    svc: LibraryService = Depends(get_library_service),
):
    """Update book catalog metadata."""
    result = await svc.update_book(
        book_id, user["college_id"],
        payload.model_dump(exclude_none=True),
    )
    return {"success": True, "data": result}


@router.post("/library/books/{book_id}/copies")
async def add_copies(
    book_id: str,
    payload: BulkCopyCreate,
    user: dict = Depends(require_role("librarian", "admin")),
    svc: LibraryService = Depends(get_library_service),
):
    """Register physical copies for a book."""
    result = await svc.add_copies(
        book_id, user["college_id"],
        [c.model_dump() for c in payload.copies],
    )
    return {"success": True, "data": result}


# ═══════════════════════════════════════════════════════════════════════════════
# CHECKOUT / RETURN — Librarian / Admin (or Kiosk)
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/library/checkout")
async def checkout_book(
    payload: CheckoutRequest,
    user: dict = Depends(require_role("librarian", "admin")),
    svc: LibraryService = Depends(get_library_service),
):
    """Process a book checkout (manual or RFID-based)."""
    result = await svc.checkout(user["college_id"], payload.model_dump())
    return {"success": True, "data": result}


@router.post("/library/return")
async def return_book(
    payload: ReturnRequest,
    user: dict = Depends(require_role("librarian", "admin")),
    svc: LibraryService = Depends(get_library_service),
):
    """Process a book return."""
    result = await svc.return_book(user["college_id"], payload.model_dump())
    return {"success": True, "data": result}


@router.post("/library/renew")
async def renew_checkout(
    payload: RenewRequest,
    user: dict = Depends(require_role("student")),
    svc: LibraryService = Depends(get_library_service),
):
    """Renew an active checkout (extends due date)."""
    result = await svc.renew_checkout(payload.transaction_id, user["id"], user["college_id"])
    return {"success": True, "data": result}


# ═══════════════════════════════════════════════════════════════════════════════
# KIOSK — ESP32 Hardware Integration
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/library/kiosk/scan")
async def kiosk_scan(
    payload: KioskPayload,
    user: dict = Depends(require_role("librarian", "admin")),
    svc: LibraryService = Depends(get_library_service),
):
    """
    ESP32 kiosk sends: { user_rfid, book_rfid, action }.
    Routes to checkout or return based on action.
    """
    data = {"user_rfid": payload.user_rfid, "book_rfid": payload.book_rfid}
    if payload.action == "return":
        result = await svc.return_book(user["college_id"], data)
    else:
        result = await svc.checkout(user["college_id"], data)
    return {"success": True, "data": result}


# ═══════════════════════════════════════════════════════════════════════════════
# STUDENT — Reservations & Account
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/library/reserve")
async def reserve_book(
    payload: ReserveRequest,
    user: dict = Depends(require_role("student")),
    svc: LibraryService = Depends(get_library_service),
):
    """Reserve a book when no copies are available."""
    result = await svc.reserve_book(user["id"], user["college_id"], payload.book_id)
    return {"success": True, "data": result}


@router.get("/library/my-account")
async def get_my_account(
    user: dict = Depends(require_role("student")),
    svc: LibraryService = Depends(get_library_service),
):
    """Student's library account: checkouts, fines, reservations."""
    return {"data": await svc.get_my_account(user["id"], user["college_id"])}


# ═══════════════════════════════════════════════════════════════════════════════
# FINE PAYMENT
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/library/fines/{fine_id}/pay")
async def pay_fine(
    fine_id: str,
    payload: FinePayRequest,
    user: dict = Depends(require_role("student")),
    svc: LibraryService = Depends(get_library_service),
):
    """Pay a library fine via cash, ecosystem points, or waiver."""
    result = await svc.pay_fine(fine_id, user["id"], user["college_id"], payload.pay_via)
    return {"success": True, "data": result}


# ═══════════════════════════════════════════════════════════════════════════════
# LIBRARIAN DASHBOARD
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/library/dashboard")
async def librarian_dashboard(
    user: dict = Depends(require_role("librarian", "admin")),
    svc: LibraryService = Depends(get_library_service),
):
    """Aggregated library stats for the librarian dashboard."""
    return {"data": await svc.get_dashboard(user["college_id"])}
