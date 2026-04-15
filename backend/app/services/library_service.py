"""
Library Management Service
===========================
Core business logic for the smart library system:
  - Full-text search via PostgreSQL tsvector
  - Transactional checkout/return with validation rules
  - Reservation hold queue with ARQ task triggers
  - Fine calculation and ecosystem point payments
  - Gamification hooks (early return rewards)
"""

import logging
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import List, Dict, Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text, update
from sqlalchemy.exc import IntegrityError

from app.models.library import (
    Book, BookCopy, LibraryTransaction, LibraryFine, LibraryReservation,
)
from app.models.core import User, UserProfile
from app.models.iot import RewardPointLog
from app.core.exceptions import DomainException

logger = logging.getLogger("acadmix.library")

# ─── Configuration ────────────────────────────────────────────────────────────
FINE_PER_DAY = Decimal("2.00")          # ₹2/day overdue
MAX_ACTIVE_CHECKOUTS = 3                # Per student
MAX_RENEWALS = 1                        # One renewal allowed
RESERVATION_HOLD_HOURS = 48             # Hours to pick up a reserved book
EARLY_RETURN_DAYS = 3                   # Days early to earn bonus points
EARLY_RETURN_POINTS = 5                 # Points for early return
TECHNICAL_CATEGORY_BONUS = 3            # Bonus for technical/syllabus books

TECHNICAL_CATEGORIES = {
    "computer science", "mathematics", "physics", "chemistry",
    "electronics", "mechanical", "civil", "electrical",
    "information technology", "data science", "engineering",
}


class LibraryService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ═══════════════════════════════════════════════════════════════════════════
    # SEARCH — Full-text via tsvector
    # ═══════════════════════════════════════════════════════════════════════════

    async def search_books(
        self, college_id: str, q: str = "", category: Optional[str] = None,
        available_only: bool = False, page: int = 1, page_size: int = 20,
    ) -> Dict[str, Any]:
        """Full-text catalog search with optional filters."""
        base = select(Book).where(
            Book.college_id == college_id,
            Book.is_deleted == False,
        )

        if q and q.strip():
            # Use plainto_tsquery for natural language search
            base = base.where(
                Book.search_vector.op("@@")(func.plainto_tsquery("english", q))
            ).order_by(
                func.ts_rank(Book.search_vector, func.plainto_tsquery("english", q)).desc()
            )
        else:
            base = base.order_by(Book.title)

        if category:
            base = base.where(Book.category == category)

        if available_only:
            base = base.where(Book.available_copies > 0)

        # Count total
        count_q = select(func.count()).select_from(base.subquery())
        total = (await self.db.execute(count_q)).scalar() or 0

        # Paginate
        offset = (page - 1) * page_size
        result = await self.db.execute(base.offset(offset).limit(page_size))
        books = result.scalars().all()

        return {
            "books": [self._book_to_dict(b) for b in books],
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size,
        }

    async def get_book_detail(self, book_id: str, college_id: str) -> Dict[str, Any]:
        """Returns catalog metadata + all copies with statuses."""
        book_q = await self.db.execute(
            select(Book).where(
                Book.id == book_id,
                Book.college_id == college_id,
                Book.is_deleted == False,
            )
        )
        book = book_q.scalars().first()
        if not book:
            raise DomainException("Book not found", status_code=404)

        copies_q = await self.db.execute(
            select(BookCopy).where(
                BookCopy.book_id == book_id,
                BookCopy.college_id == college_id,
                BookCopy.is_deleted == False,
            ).order_by(BookCopy.barcode)
        )
        copies = copies_q.scalars().all()

        book_dict = self._book_to_dict(book)
        book_dict["copies"] = [
            {
                "id": c.id,
                "barcode": c.barcode,
                "rfid_tag": c.rfid_tag,
                "shelf_location": c.shelf_location,
                "status": c.status,
                "condition_notes": c.condition_notes,
            }
            for c in copies
        ]
        return book_dict

    # ═══════════════════════════════════════════════════════════════════════════
    # CATALOG MANAGEMENT (Librarian/Admin)
    # ═══════════════════════════════════════════════════════════════════════════

    async def add_book(self, college_id: str, data: dict) -> Dict[str, Any]:
        """Add a new book to the catalog."""
        # Check for duplicate ISBN within the college
        if data.get("isbn"):
            existing = await self.db.execute(
                select(Book).where(
                    Book.college_id == college_id,
                    Book.isbn == data["isbn"],
                    Book.is_deleted == False,
                )
            )
            if existing.scalars().first():
                raise DomainException(
                    f"A book with ISBN '{data['isbn']}' already exists in your catalog",
                    status_code=409,
                )

        book = Book(
            college_id=college_id,
            isbn=data.get("isbn"),
            title=data["title"],
            author=data["author"],
            publisher=data.get("publisher"),
            publication_year=data.get("publication_year"),
            category=data.get("category"),
            description=data.get("description"),
            cover_image_url=data.get("cover_image_url"),
            max_checkout_days=data.get("max_checkout_days", 14),
        )
        self.db.add(book)
        await self.db.flush()

        # Update search vector manually (trigger will handle future updates)
        await self.db.execute(
            text("""
                UPDATE books SET search_vector =
                    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
                    setweight(to_tsvector('english', coalesce(author, '')), 'B') ||
                    setweight(to_tsvector('english', coalesce(publisher, '')), 'C') ||
                    setweight(to_tsvector('english', coalesce(category, '')), 'C')
                WHERE id = :bid
            """),
            {"bid": book.id},
        )

        return {"id": book.id, "title": book.title}

    async def update_book(self, book_id: str, college_id: str, data: dict) -> Dict[str, Any]:
        """Partial update of book catalog metadata."""
        book_q = await self.db.execute(
            select(Book).where(
                Book.id == book_id,
                Book.college_id == college_id,
                Book.is_deleted == False,
            )
        )
        book = book_q.scalars().first()
        if not book:
            raise DomainException("Book not found", status_code=404)

        for field in ["title", "author", "publisher", "publication_year",
                       "category", "description", "cover_image_url", "max_checkout_days"]:
            if field in data and data[field] is not None:
                setattr(book, field, data[field])

        # Refresh search vector
        await self.db.execute(
            text("""
                UPDATE books SET search_vector =
                    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
                    setweight(to_tsvector('english', coalesce(author, '')), 'B') ||
                    setweight(to_tsvector('english', coalesce(publisher, '')), 'C') ||
                    setweight(to_tsvector('english', coalesce(category, '')), 'C')
                WHERE id = :bid
            """),
            {"bid": book.id},
        )

        return {"id": book.id, "title": book.title, "updated": True}

    async def add_copies(self, book_id: str, college_id: str, copies_data: List[dict]) -> Dict[str, Any]:
        """Register physical copies for a book."""
        book_q = await self.db.execute(
            select(Book).where(
                Book.id == book_id,
                Book.college_id == college_id,
                Book.is_deleted == False,
            )
        )
        book = book_q.scalars().first()
        if not book:
            raise DomainException("Book not found", status_code=404)

        created = 0
        for c in copies_data:
            copy = BookCopy(
                college_id=college_id,
                book_id=book_id,
                barcode=c["barcode"],
                rfid_tag=c.get("rfid_tag"),
                shelf_location=c.get("shelf_location"),
                condition_notes=c.get("condition_notes"),
                acquired_date=c.get("acquired_date"),
                status="AVAILABLE",
            )
            self.db.add(copy)
            created += 1

        # Update aggregate counts
        book.total_copies = (book.total_copies or 0) + created
        book.available_copies = (book.available_copies or 0) + created

        await self.db.flush()
        return {"book_id": book_id, "copies_created": created, "total_copies": book.total_copies}

    # ═══════════════════════════════════════════════════════════════════════════
    # CHECKOUT — Transactional with validation
    # ═══════════════════════════════════════════════════════════════════════════

    async def checkout(self, college_id: str, data: dict) -> Dict[str, Any]:
        """
        Process a book checkout. Validates:
          1. Student has no unpaid fines
          2. Student hasn't exceeded max checkout limit
          3. The copy is AVAILABLE
        All mutations are within the current DB transaction.
        """
        # Resolve user
        user_id = data.get("user_id")
        if not user_id and data.get("user_rfid"):
            user_id = await self._resolve_user_by_rfid(data["user_rfid"], college_id)
        if not user_id:
            raise DomainException("User not identified. Provide user_id or user_rfid.", status_code=400)

        # Resolve copy
        copy_id = data.get("copy_id")
        if not copy_id:
            if data.get("book_rfid"):
                copy_id = await self._resolve_copy_by_rfid(data["book_rfid"], college_id)
            elif data.get("barcode"):
                copy_id = await self._resolve_copy_by_barcode(data["barcode"], college_id)
        if not copy_id:
            raise DomainException("Book copy not identified. Provide copy_id, book_rfid, or barcode.", status_code=400)

        # Validate: no unpaid fines
        unpaid_q = await self.db.execute(
            select(func.count()).select_from(LibraryFine).where(
                LibraryFine.user_id == user_id,
                LibraryFine.college_id == college_id,
                LibraryFine.status == "UNPAID",
                LibraryFine.is_deleted == False,
            )
        )
        if (unpaid_q.scalar() or 0) > 0:
            raise DomainException("You have unpaid library fines. Please clear them before checking out.", status_code=403)

        # Validate: max checkout limit
        active_q = await self.db.execute(
            select(func.count()).select_from(LibraryTransaction).where(
                LibraryTransaction.user_id == user_id,
                LibraryTransaction.college_id == college_id,
                LibraryTransaction.status == "ACTIVE",
                LibraryTransaction.is_deleted == False,
            )
        )
        if (active_q.scalar() or 0) >= MAX_ACTIVE_CHECKOUTS:
            raise DomainException(
                f"You have reached the maximum of {MAX_ACTIVE_CHECKOUTS} active checkouts.",
                status_code=403,
            )

        # Validate & lock copy
        copy_q = await self.db.execute(
            select(BookCopy).where(
                BookCopy.id == copy_id,
                BookCopy.college_id == college_id,
                BookCopy.status == "AVAILABLE",
                BookCopy.is_deleted == False,
            )
        )
        copy = copy_q.scalars().first()
        if not copy:
            raise DomainException("This copy is not available for checkout.", status_code=409)

        # Get the book for due date calculation
        book_q = await self.db.execute(select(Book).where(Book.id == copy.book_id))
        book = book_q.scalars().first()
        checkout_days = book.max_checkout_days if book else 14

        # Perform checkout
        copy.status = "CHECKED_OUT"

        now = datetime.now(timezone.utc)
        txn = LibraryTransaction(
            college_id=college_id,
            copy_id=copy_id,
            user_id=user_id,
            checkout_time=now,
            due_date=now + timedelta(days=checkout_days),
            status="ACTIVE",
        )
        self.db.add(txn)

        # Update book aggregate
        if book:
            book.available_copies = max(0, (book.available_copies or 1) - 1)

        await self.db.flush()

        # Fetch user name for response
        user_q = await self.db.execute(select(User.name).where(User.id == user_id))
        user_name = user_q.scalar() or "Unknown"

        return {
            "transaction_id": txn.id,
            "user_id": user_id,
            "user_name": user_name,
            "book_title": book.title if book else "Unknown",
            "copy_barcode": copy.barcode,
            "checkout_time": now.isoformat(),
            "due_date": txn.due_date.isoformat(),
        }

    # ═══════════════════════════════════════════════════════════════════════════
    # RETURN — With fine check & hold queue trigger
    # ═══════════════════════════════════════════════════════════════════════════

    async def return_book(self, college_id: str, data: dict) -> Dict[str, Any]:
        """
        Process a book return. Auto-generates fine if overdue.
        Triggers hold queue processing for waiting reservations.
        Awards gamification points for early returns.
        """
        # Resolve copy
        copy_id = data.get("copy_id")
        if not copy_id:
            if data.get("barcode"):
                copy_id = await self._resolve_copy_by_barcode(data["barcode"], college_id)
            elif data.get("book_rfid"):
                copy_id = await self._resolve_copy_by_rfid(data["book_rfid"], college_id)
        if not copy_id:
            raise DomainException("Book copy not identified.", status_code=400)

        # Find the active transaction
        txn_q = await self.db.execute(
            select(LibraryTransaction).where(
                LibraryTransaction.copy_id == copy_id,
                LibraryTransaction.college_id == college_id,
                LibraryTransaction.status.in_(["ACTIVE", "OVERDUE"]),
                LibraryTransaction.is_deleted == False,
            )
        )
        txn = txn_q.scalars().first()
        if not txn:
            raise DomainException("No active checkout found for this copy.", status_code=404)

        now = datetime.now(timezone.utc)
        txn.return_time = now
        txn.status = "RETURNED"

        # Check for overdue fine
        fine_amount = Decimal("0.00")
        if now > txn.due_date:
            overdue_days = (now - txn.due_date).days
            if overdue_days < 1:
                overdue_days = 1
            fine_amount = FINE_PER_DAY * overdue_days

            fine = LibraryFine(
                college_id=college_id,
                transaction_id=txn.id,
                user_id=txn.user_id,
                amount=fine_amount,
                status="UNPAID",
            )
            self.db.add(fine)

        # Free up the copy
        copy_q = await self.db.execute(select(BookCopy).where(BookCopy.id == copy_id))
        copy = copy_q.scalars().first()
        if copy:
            copy.status = "AVAILABLE"

        # Update book aggregate
        if copy:
            book_q = await self.db.execute(select(Book).where(Book.id == copy.book_id))
            book = book_q.scalars().first()
            if book:
                book.available_copies = (book.available_copies or 0) + 1

                # ── Gamification: Early return reward ──
                if fine_amount == 0:
                    await self._award_early_return_points(txn, book, now)

        await self.db.flush()

        # ── Trigger hold queue processing (async via ARQ) ──
        if copy:
            try:
                from arq import create_pool
                from arq.connections import RedisSettings
                from app.core.config import settings
                redis = await create_pool(RedisSettings.from_dsn(settings.REDIS_URL))
                await redis.enqueue_job("process_library_hold_queue", copy.book_id, college_id)
            except Exception as e:
                logger.warning("Failed to enqueue hold queue task: %s", e)

        return {
            "transaction_id": txn.id,
            "return_time": now.isoformat(),
            "fine_amount": float(fine_amount) if fine_amount > 0 else 0,
            "message": "Book returned successfully!" + (
                f" Overdue fine of ₹{fine_amount} has been applied." if fine_amount > 0 else ""
            ),
        }

    # ═══════════════════════════════════════════════════════════════════════════
    # RENEW
    # ═══════════════════════════════════════════════════════════════════════════

    async def renew_checkout(self, transaction_id: str, user_id: str, college_id: str) -> Dict[str, Any]:
        """Extend due date by the book's max_checkout_days. Max 1 renewal."""
        txn_q = await self.db.execute(
            select(LibraryTransaction).where(
                LibraryTransaction.id == transaction_id,
                LibraryTransaction.user_id == user_id,
                LibraryTransaction.college_id == college_id,
                LibraryTransaction.status == "ACTIVE",
                LibraryTransaction.is_deleted == False,
            )
        )
        txn = txn_q.scalars().first()
        if not txn:
            raise DomainException("Active checkout not found.", status_code=404)

        if txn.renewed_count >= MAX_RENEWALS:
            raise DomainException("Maximum renewals reached. Please return the book.", status_code=403)

        # Check if anyone has reserved this book
        copy_q = await self.db.execute(select(BookCopy.book_id).where(BookCopy.id == txn.copy_id))
        book_id = copy_q.scalar()
        if book_id:
            reserve_q = await self.db.execute(
                select(func.count()).select_from(LibraryReservation).where(
                    LibraryReservation.book_id == book_id,
                    LibraryReservation.college_id == college_id,
                    LibraryReservation.status == "PENDING",
                    LibraryReservation.is_deleted == False,
                )
            )
            if (reserve_q.scalar() or 0) > 0:
                raise DomainException("Cannot renew — other students are waiting for this book.", status_code=403)

        # Get book checkout days
        book_q = await self.db.execute(select(Book).where(Book.id == book_id))
        book = book_q.scalars().first()
        extend_days = book.max_checkout_days if book else 14

        txn.due_date = txn.due_date + timedelta(days=extend_days)
        txn.renewed_count += 1

        return {
            "transaction_id": txn.id,
            "new_due_date": txn.due_date.isoformat(),
            "renewals_used": txn.renewed_count,
        }

    # ═══════════════════════════════════════════════════════════════════════════
    # RESERVATIONS
    # ═══════════════════════════════════════════════════════════════════════════

    async def reserve_book(self, user_id: str, college_id: str, book_id: str) -> Dict[str, Any]:
        """Place a hold on a book if no copies are available."""
        book_q = await self.db.execute(
            select(Book).where(
                Book.id == book_id,
                Book.college_id == college_id,
                Book.is_deleted == False,
            )
        )
        book = book_q.scalars().first()
        if not book:
            raise DomainException("Book not found", status_code=404)

        if (book.available_copies or 0) > 0:
            raise DomainException("Copies are available — checkout directly instead of reserving.", status_code=400)

        # Check if user already has a pending reservation for this book
        existing_q = await self.db.execute(
            select(LibraryReservation).where(
                LibraryReservation.book_id == book_id,
                LibraryReservation.user_id == user_id,
                LibraryReservation.college_id == college_id,
                LibraryReservation.status.in_(["PENDING", "READY"]),
                LibraryReservation.is_deleted == False,
            )
        )
        if existing_q.scalars().first():
            raise DomainException("You already have a reservation for this book.", status_code=409)

        reservation = LibraryReservation(
            college_id=college_id,
            book_id=book_id,
            user_id=user_id,
            status="PENDING",
        )
        self.db.add(reservation)
        await self.db.flush()

        # Count queue position
        pos_q = await self.db.execute(
            select(func.count()).select_from(LibraryReservation).where(
                LibraryReservation.book_id == book_id,
                LibraryReservation.college_id == college_id,
                LibraryReservation.status == "PENDING",
                LibraryReservation.is_deleted == False,
            )
        )

        return {
            "reservation_id": reservation.id,
            "book_title": book.title,
            "queue_position": pos_q.scalar() or 1,
            "message": "You've been added to the hold queue. We'll notify you when a copy is available.",
        }

    # ═══════════════════════════════════════════════════════════════════════════
    # STUDENT ACCOUNT
    # ═══════════════════════════════════════════════════════════════════════════

    async def get_my_account(self, user_id: str, college_id: str) -> Dict[str, Any]:
        """Student's library account: active checkouts, fines, reservations."""
        # Active checkouts
        checkouts_q = await self.db.execute(
            select(LibraryTransaction, BookCopy, Book)
            .join(BookCopy, BookCopy.id == LibraryTransaction.copy_id)
            .join(Book, Book.id == BookCopy.book_id)
            .where(
                LibraryTransaction.user_id == user_id,
                LibraryTransaction.college_id == college_id,
                LibraryTransaction.status.in_(["ACTIVE", "OVERDUE"]),
                LibraryTransaction.is_deleted == False,
            )
            .order_by(LibraryTransaction.due_date)
        )
        active = [
            {
                "transaction_id": txn.id,
                "book_title": book.title,
                "author": book.author,
                "barcode": copy.barcode,
                "checkout_time": txn.checkout_time.isoformat() if txn.checkout_time else None,
                "due_date": txn.due_date.isoformat() if txn.due_date else None,
                "status": txn.status,
                "renewed_count": txn.renewed_count,
                "is_overdue": txn.due_date < datetime.now(timezone.utc) if txn.due_date else False,
            }
            for txn, copy, book in checkouts_q.all()
        ]

        # Recent history (last 20 returned)
        history_q = await self.db.execute(
            select(LibraryTransaction, BookCopy, Book)
            .join(BookCopy, BookCopy.id == LibraryTransaction.copy_id)
            .join(Book, Book.id == BookCopy.book_id)
            .where(
                LibraryTransaction.user_id == user_id,
                LibraryTransaction.college_id == college_id,
                LibraryTransaction.status == "RETURNED",
                LibraryTransaction.is_deleted == False,
            )
            .order_by(LibraryTransaction.return_time.desc())
            .limit(20)
        )
        history = [
            {
                "book_title": book.title,
                "author": book.author,
                "checkout_time": txn.checkout_time.isoformat() if txn.checkout_time else None,
                "return_time": txn.return_time.isoformat() if txn.return_time else None,
            }
            for txn, copy, book in history_q.all()
        ]

        # Unpaid fines
        fines_q = await self.db.execute(
            select(LibraryFine).where(
                LibraryFine.user_id == user_id,
                LibraryFine.college_id == college_id,
                LibraryFine.status == "UNPAID",
                LibraryFine.is_deleted == False,
            )
        )
        fines = [
            {
                "fine_id": f.id,
                "amount": float(f.amount),
                "created_at": f.created_at.isoformat() if f.created_at else None,
            }
            for f in fines_q.scalars().all()
        ]

        # Active reservations
        reserves_q = await self.db.execute(
            select(LibraryReservation, Book)
            .join(Book, Book.id == LibraryReservation.book_id)
            .where(
                LibraryReservation.user_id == user_id,
                LibraryReservation.college_id == college_id,
                LibraryReservation.status.in_(["PENDING", "READY"]),
                LibraryReservation.is_deleted == False,
            )
            .order_by(LibraryReservation.reserved_at)
        )
        reservations = [
            {
                "reservation_id": r.id,
                "book_title": book.title,
                "status": r.status,
                "expires_at": r.expires_at.isoformat() if r.expires_at else None,
            }
            for r, book in reserves_q.all()
        ]

        total_fines = sum(f["amount"] for f in fines)

        return {
            "active_checkouts": active,
            "checkout_count": len(active),
            "max_checkouts": MAX_ACTIVE_CHECKOUTS,
            "history": history,
            "fines": fines,
            "total_unpaid_fines": total_fines,
            "reservations": reservations,
        }

    # ═══════════════════════════════════════════════════════════════════════════
    # FINE PAYMENT
    # ═══════════════════════════════════════════════════════════════════════════

    async def pay_fine(self, fine_id: str, user_id: str, college_id: str, pay_via: str) -> Dict[str, Any]:
        """Pay or waive a library fine."""
        fine_q = await self.db.execute(
            select(LibraryFine).where(
                LibraryFine.id == fine_id,
                LibraryFine.user_id == user_id,
                LibraryFine.college_id == college_id,
                LibraryFine.status == "UNPAID",
                LibraryFine.is_deleted == False,
            )
        )
        fine = fine_q.scalars().first()
        if not fine:
            raise DomainException("Fine not found or already paid.", status_code=404)

        now = datetime.now(timezone.utc)

        if pay_via == "points":
            # Deduct from acad_tokens
            profile_q = await self.db.execute(
                select(UserProfile).where(UserProfile.user_id == user_id)
            )
            profile = profile_q.scalars().first()
            if not profile:
                raise DomainException("User profile not found.", status_code=404)

            points_needed = int(fine.amount)  # 1 point = ₹1
            if profile.acad_tokens < points_needed:
                raise DomainException(
                    f"Insufficient points. Need {points_needed}, have {int(profile.acad_tokens)}.",
                    status_code=400,
                )

            profile.acad_tokens -= points_needed

            # Log the redemption
            new_balance = int(profile.acad_tokens)
            self.db.add(RewardPointLog(
                college_id=college_id,
                student_id=user_id,
                points=-points_needed,
                reason=f"Library fine payment (₹{fine.amount})",
                category="redeem",
                balance_after=new_balance,
            ))

        fine.status = "WAIVED" if pay_via == "waive" else "PAID"
        fine.paid_via = pay_via
        fine.paid_at = now

        return {"fine_id": fine.id, "status": fine.status, "paid_via": pay_via}

    # ═══════════════════════════════════════════════════════════════════════════
    # LIBRARIAN DASHBOARD
    # ═══════════════════════════════════════════════════════════════════════════

    async def get_dashboard(self, college_id: str) -> Dict[str, Any]:
        """Aggregate library stats for the librarian dashboard."""
        # Total books & copies
        books_count = (await self.db.execute(
            select(func.count()).select_from(Book).where(
                Book.college_id == college_id, Book.is_deleted == False
            )
        )).scalar() or 0

        copies_count = (await self.db.execute(
            select(func.count()).select_from(BookCopy).where(
                BookCopy.college_id == college_id, BookCopy.is_deleted == False
            )
        )).scalar() or 0

        # Status breakdown
        status_q = await self.db.execute(
            select(BookCopy.status, func.count()).where(
                BookCopy.college_id == college_id, BookCopy.is_deleted == False
            ).group_by(BookCopy.status)
        )
        status_breakdown = {row[0]: row[1] for row in status_q.all()}

        # Active checkouts
        active_checkouts = (await self.db.execute(
            select(func.count()).select_from(LibraryTransaction).where(
                LibraryTransaction.college_id == college_id,
                LibraryTransaction.status == "ACTIVE",
                LibraryTransaction.is_deleted == False,
            )
        )).scalar() or 0

        # Overdue count
        overdue_count = (await self.db.execute(
            select(func.count()).select_from(LibraryTransaction).where(
                LibraryTransaction.college_id == college_id,
                LibraryTransaction.status.in_(["ACTIVE", "OVERDUE"]),
                LibraryTransaction.due_date < datetime.now(timezone.utc),
                LibraryTransaction.is_deleted == False,
            )
        )).scalar() or 0

        # Unpaid fines total
        fines_total = (await self.db.execute(
            select(func.sum(LibraryFine.amount)).where(
                LibraryFine.college_id == college_id,
                LibraryFine.status == "UNPAID",
                LibraryFine.is_deleted == False,
            )
        )).scalar() or 0

        # Pending reservations
        pending_reserves = (await self.db.execute(
            select(func.count()).select_from(LibraryReservation).where(
                LibraryReservation.college_id == college_id,
                LibraryReservation.status == "PENDING",
                LibraryReservation.is_deleted == False,
            )
        )).scalar() or 0

        # Category distribution
        cat_q = await self.db.execute(
            select(Book.category, func.count()).where(
                Book.college_id == college_id,
                Book.is_deleted == False,
                Book.category != None,
            ).group_by(Book.category).order_by(func.count().desc()).limit(10)
        )
        categories = [{"name": row[0], "count": row[1]} for row in cat_q.all()]

        return {
            "total_books": books_count,
            "total_copies": copies_count,
            "available": status_breakdown.get("AVAILABLE", 0),
            "checked_out": status_breakdown.get("CHECKED_OUT", 0),
            "reserved": status_breakdown.get("RESERVED", 0),
            "maintenance": status_breakdown.get("MAINTENANCE", 0),
            "lost": status_breakdown.get("LOST", 0),
            "active_checkouts": active_checkouts,
            "overdue_count": overdue_count,
            "unpaid_fines_total": float(fines_total),
            "pending_reservations": pending_reserves,
            "categories": categories,
        }

    # ═══════════════════════════════════════════════════════════════════════════
    # INTERNAL HELPERS
    # ═══════════════════════════════════════════════════════════════════════════

    async def _resolve_user_by_rfid(self, rfid: str, college_id: str) -> Optional[str]:
        """Look up user_id from MIFARE/NFC UID stored in user_profiles.extra_data."""
        result = await self.db.execute(
            select(UserProfile.user_id).where(
                UserProfile.college_id == college_id,
                UserProfile.extra_data["rfid_uid"].astext == rfid,
                UserProfile.is_deleted == False,
            )
        )
        return result.scalar()

    async def _resolve_copy_by_rfid(self, rfid: str, college_id: str) -> Optional[str]:
        result = await self.db.execute(
            select(BookCopy.id).where(
                BookCopy.rfid_tag == rfid,
                BookCopy.college_id == college_id,
                BookCopy.is_deleted == False,
            )
        )
        return result.scalar()

    async def _resolve_copy_by_barcode(self, barcode: str, college_id: str) -> Optional[str]:
        result = await self.db.execute(
            select(BookCopy.id).where(
                BookCopy.barcode == barcode,
                BookCopy.college_id == college_id,
                BookCopy.is_deleted == False,
            )
        )
        return result.scalar()

    async def _award_early_return_points(self, txn: LibraryTransaction, book: Book, return_time: datetime):
        """Award ecosystem points for early book returns."""
        if not txn.due_date:
            return

        days_early = (txn.due_date - return_time).days
        if days_early < EARLY_RETURN_DAYS:
            return

        points = EARLY_RETURN_POINTS
        reason = f"Early book return: '{book.title}' ({days_early}d early)"

        # Bonus for technical category
        if book.category and book.category.lower() in TECHNICAL_CATEGORIES:
            points += TECHNICAL_CATEGORY_BONUS
            reason += " [technical bonus]"

        # Update acad_tokens
        profile_q = await self.db.execute(
            select(UserProfile).where(UserProfile.user_id == txn.user_id)
        )
        profile = profile_q.scalars().first()
        if profile:
            profile.acad_tokens = (profile.acad_tokens or 0) + points
            new_balance = int(profile.acad_tokens)

            self.db.add(RewardPointLog(
                college_id=txn.college_id,
                student_id=txn.user_id,
                points=points,
                reason=reason,
                category="academic",
                balance_after=new_balance,
            ))
            logger.info("[library] Awarded %d points to %s for early return", points, txn.user_id)

    def _book_to_dict(self, book: Book) -> dict:
        return {
            "id": book.id,
            "isbn": book.isbn,
            "title": book.title,
            "author": book.author,
            "publisher": book.publisher,
            "publication_year": book.publication_year,
            "category": book.category,
            "description": book.description,
            "cover_image_url": book.cover_image_url,
            "total_copies": book.total_copies,
            "available_copies": book.available_copies,
            "max_checkout_days": book.max_checkout_days,
        }
