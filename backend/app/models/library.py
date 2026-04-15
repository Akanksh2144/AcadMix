"""
Library Management Models
=========================
Smart library system with catalog/inventory separation:
  - books        → Abstract catalog metadata (ISBN, title, author)
  - book_copies  → Physical copies on the shelf (barcode, RFID, status)
  - library_transactions → Checkout/return ledger
  - library_fines        → Overdue fine tracking
  - library_reservations → Hold queue for unavailable books
"""

from sqlalchemy import (
    Column, String, Integer, Float, ForeignKey, DateTime, Boolean,
    Index, UniqueConstraint, CheckConstraint, Text, Numeric, Date,
)
from sqlalchemy.dialects.postgresql import JSONB, TSVECTOR
from sqlalchemy.sql import func, text
import uuid
from database import Base
from app.models.core import SoftDeleteMixin


def generate_uuid():
    return str(uuid.uuid4())


# ═══════════════════════════════════════════════════════════════════════════════
# BOOK CATALOG — Abstract metadata (one row per ISBN / title)
# ═══════════════════════════════════════════════════════════════════════════════


class Book(Base, SoftDeleteMixin):
    """
    Catalog entry for a book. Represents the abstract "work", not a physical copy.
    Multiple BookCopy rows link back here.
    """
    __tablename__ = "books"
    id               = Column(String, primary_key=True, index=True, default=generate_uuid)
    college_id       = Column(String, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False, index=True)
    isbn             = Column(String, nullable=True)
    title            = Column(String, nullable=False)
    author           = Column(String, nullable=False)
    publisher        = Column(String, nullable=True)
    publication_year = Column(Integer, nullable=True)
    category         = Column(String, nullable=True)            # "Computer Science", "Mathematics", "Fiction"
    description      = Column(Text, nullable=True)
    cover_image_url  = Column(String, nullable=True)
    total_copies     = Column(Integer, nullable=False, server_default=text('0'))
    available_copies = Column(Integer, nullable=False, server_default=text('0'))
    max_checkout_days = Column(Integer, nullable=False, server_default=text('14'))  # Default loan period
    search_vector    = Column(TSVECTOR, nullable=True)          # Auto-updated via DB trigger
    created_at       = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("college_id", "isbn", name="uq_book_isbn_college"),
        Index("ix_books_search", "search_vector", postgresql_using="gin"),
        Index("ix_books_category", "college_id", "category"),
    )


# ═══════════════════════════════════════════════════════════════════════════════
# BOOK COPIES — Physical inventory (one row per physical item)
# ═══════════════════════════════════════════════════════════════════════════════


class BookCopy(Base, SoftDeleteMixin):
    """
    A single physical copy of a book sitting on the shelf.
    Tracks barcode/RFID for hardware integration, current status, and condition.
    """
    __tablename__ = "book_copies"
    id              = Column(String, primary_key=True, index=True, default=generate_uuid)
    college_id      = Column(String, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False, index=True)
    book_id         = Column(String, ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    barcode         = Column(String, nullable=False, unique=True)           # Scannable barcode
    rfid_tag        = Column(String, nullable=True, unique=True)            # NFC/RFID tag (optional)
    shelf_location  = Column(String, nullable=True)                         # "Rack A3, Shelf 2"
    status          = Column(String, nullable=False, server_default="AVAILABLE")
    condition_notes = Column(Text, nullable=True)
    acquired_date   = Column(Date, nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint(
            "status IN ('AVAILABLE', 'CHECKED_OUT', 'RESERVED', 'MAINTENANCE', 'LOST')",
            name="ck_bookcopy_status",
        ),
        Index("ix_bookcopy_book_status", "book_id", "status"),
    )


# ═══════════════════════════════════════════════════════════════════════════════
# LIBRARY TRANSACTIONS — The Checkout/Return Ledger
# ═══════════════════════════════════════════════════════════════════════════════


class LibraryTransaction(Base, SoftDeleteMixin):
    """
    One row per checkout event. Tracks the full lifecycle:
    ACTIVE → RETURNED (or OVERDUE → RETURNED).
    """
    __tablename__ = "library_transactions"
    id              = Column(String, primary_key=True, index=True, default=generate_uuid)
    college_id      = Column(String, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False, index=True)
    copy_id         = Column(String, ForeignKey("book_copies.id", ondelete="CASCADE"), nullable=False)
    user_id         = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    checkout_time   = Column(DateTime(timezone=True), server_default=func.now())
    due_date        = Column(DateTime(timezone=True), nullable=False)
    return_time     = Column(DateTime(timezone=True), nullable=True)
    status          = Column(String, nullable=False, server_default="ACTIVE")
    renewed_count   = Column(Integer, nullable=False, server_default=text('0'))  # Track renewals

    __table_args__ = (
        CheckConstraint(
            "status IN ('ACTIVE', 'RETURNED', 'OVERDUE')",
            name="ck_libtxn_status",
        ),
        Index("ix_libtxn_user_status", "user_id", "status"),
        Index("ix_libtxn_copy_active", "copy_id", "status"),
        Index("ix_libtxn_due", "due_date", postgresql_where=text("status = 'ACTIVE'")),
    )


# ═══════════════════════════════════════════════════════════════════════════════
# LIBRARY FINES — Overdue penalty tracking
# ═══════════════════════════════════════════════════════════════════════════════


class LibraryFine(Base, SoftDeleteMixin):
    """
    Fine generated when a book is returned late or still overdue.
    Can be paid via cash, ecosystem points, or waived by librarian.
    """
    __tablename__ = "library_fines"
    id              = Column(String, primary_key=True, index=True, default=generate_uuid)
    college_id      = Column(String, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False, index=True)
    transaction_id  = Column(String, ForeignKey("library_transactions.id", ondelete="CASCADE"), nullable=False)
    user_id         = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount          = Column(Numeric(10, 2), nullable=False)
    status          = Column(String, nullable=False, server_default="UNPAID")
    paid_via        = Column(String, nullable=True)             # "cash", "points", null if unpaid
    paid_at         = Column(DateTime(timezone=True), nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint(
            "status IN ('UNPAID', 'PAID', 'WAIVED')",
            name="ck_libfine_status",
        ),
        Index("ix_libfine_user_status", "user_id", "status"),
    )


# ═══════════════════════════════════════════════════════════════════════════════
# LIBRARY RESERVATIONS — Hold queue for unavailable books
# ═══════════════════════════════════════════════════════════════════════════════


class LibraryReservation(Base, SoftDeleteMixin):
    """
    When all copies of a book are checked out, students can join a hold queue.
    On return, the next student is notified and given 48 hours to pick up.
    """
    __tablename__ = "library_reservations"
    id              = Column(String, primary_key=True, index=True, default=generate_uuid)
    college_id      = Column(String, ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False, index=True)
    book_id         = Column(String, ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    user_id         = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status          = Column(String, nullable=False, server_default="PENDING")
    reserved_at     = Column(DateTime(timezone=True), server_default=func.now())
    expires_at      = Column(DateTime(timezone=True), nullable=True)         # Set when copy becomes available
    notified_at     = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        CheckConstraint(
            "status IN ('PENDING', 'READY', 'FULFILLED', 'EXPIRED', 'CANCELLED')",
            name="ck_libreserve_status",
        ),
        Index("ix_libreserve_book_status", "book_id", "status"),
        Index("ix_libreserve_user", "user_id", "status"),
    )
