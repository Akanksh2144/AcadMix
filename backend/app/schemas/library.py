"""
Library Management Module — Pydantic Schemas
==============================================
Request/response models for the library catalog, checkout/return
workflows, fine payments, and ESP32 kiosk integration.
"""

from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime


# ═══════════════════════════════════════════════════════════════════════════════
# BOOK CATALOG
# ═══════════════════════════════════════════════════════════════════════════════

class BookCreate(BaseModel):
    isbn: Optional[str] = None
    title: str = Field(..., max_length=500)
    author: str = Field(..., max_length=300)
    publisher: Optional[str] = Field(None, max_length=300)
    publication_year: Optional[int] = None
    category: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    cover_image_url: Optional[str] = None
    max_checkout_days: int = 14


class BookUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=500)
    author: Optional[str] = Field(None, max_length=300)
    publisher: Optional[str] = Field(None, max_length=300)
    publication_year: Optional[int] = None
    category: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    cover_image_url: Optional[str] = None
    max_checkout_days: Optional[int] = None


# ═══════════════════════════════════════════════════════════════════════════════
# BOOK COPIES
# ═══════════════════════════════════════════════════════════════════════════════

class BookCopyCreate(BaseModel):
    barcode: str = Field(..., max_length=100)
    rfid_tag: Optional[str] = Field(None, max_length=100)
    shelf_location: Optional[str] = Field(None, max_length=200)
    condition_notes: Optional[str] = None
    acquired_date: Optional[str] = None  # ISO date string


class BulkCopyCreate(BaseModel):
    """Register multiple copies for a book at once."""
    copies: List[BookCopyCreate] = Field(..., min_length=1, max_length=50)


# ═══════════════════════════════════════════════════════════════════════════════
# CHECKOUT / RETURN
# ═══════════════════════════════════════════════════════════════════════════════

class CheckoutRequest(BaseModel):
    """Flexible: works with user_id + copy_id (manual) or RFID tags (kiosk)."""
    user_id: Optional[str] = None
    copy_id: Optional[str] = None
    user_rfid: Optional[str] = None       # NFC/MIFARE UID from student card
    book_rfid: Optional[str] = None       # RFID tag on the book copy
    barcode: Optional[str] = None         # Barcode scan fallback


class ReturnRequest(BaseModel):
    copy_id: Optional[str] = None
    barcode: Optional[str] = None
    book_rfid: Optional[str] = None


class RenewRequest(BaseModel):
    transaction_id: str


# ═══════════════════════════════════════════════════════════════════════════════
# RESERVATIONS
# ═══════════════════════════════════════════════════════════════════════════════

class ReserveRequest(BaseModel):
    book_id: str


# ═══════════════════════════════════════════════════════════════════════════════
# FINES
# ═══════════════════════════════════════════════════════════════════════════════

class FinePayRequest(BaseModel):
    fine_id: str
    pay_via: str = Field(..., pattern="^(cash|points|waive)$")


# ═══════════════════════════════════════════════════════════════════════════════
# KIOSK (ESP32 Hardware)
# ═══════════════════════════════════════════════════════════════════════════════

class KioskPayload(BaseModel):
    """Single payload from ESP32 checkout kiosk."""
    user_rfid: str
    book_rfid: str
    action: str = Field("checkout", pattern="^(checkout|return)$")


# ═══════════════════════════════════════════════════════════════════════════════
# SEARCH
# ═══════════════════════════════════════════════════════════════════════════════

class SearchParams(BaseModel):
    q: str = Field("", max_length=200)
    category: Optional[str] = None
    available_only: bool = False
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)
