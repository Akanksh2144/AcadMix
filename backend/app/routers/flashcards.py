from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
import math
from datetime import date, timedelta, datetime

from database import get_db
from app.core.security import get_current_user, require_role
from app import models

router = APIRouter()

# ═══════════════════════════════════════════════════════════════════════════════
# Flashcard Decks
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/flashcard-decks")
async def get_flashcard_decks(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Get all flashcard decks visible to the user."""
    query = select(models.FlashcardDeck).where(
        models.FlashcardDeck.college_id == user["college_id"]
    ).order_by(models.FlashcardDeck.created_at.desc())
    
    # If student, only show published decks or decks they created
    if user["role"] == "student":
        query = query.where(
            (models.FlashcardDeck.is_published == True) | 
            (models.FlashcardDeck.created_by == user["id"])
        )
        
    result = await session.execute(query)
    return result.scalars().all()


@router.post("/flashcard-decks")
async def create_flashcard_deck(
    title: str = Body(..., max_length=200),
    description: Optional[str] = Body(None),
    subject_code: Optional[str] = Body(None),
    tags: List[str] = Body(default=[]),
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Create a new flashcard deck."""
    deck = models.FlashcardDeck(
        college_id=user["college_id"],
        title=title,
        description=description,
        subject_code=subject_code,
        tags=tags,
        created_by=user["id"],
        is_published=False if user["role"] == "student" else True
    )
    session.add(deck)
    await session.commit()
    await session.refresh(deck)
    return deck

@router.get("/flashcard-decks/{deck_id}/cards")
async def get_flashcards(
    deck_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Get all cards for a deck."""
    result = await session.execute(
        select(models.Flashcard).where(
            models.Flashcard.deck_id == deck_id
        ).order_by(models.Flashcard.created_at.asc())
    )
    return result.scalars().all()

@router.post("/flashcard-decks/{deck_id}/cards")
async def create_flashcard(
    deck_id: str,
    front_content: str = Body(...),
    back_content: str = Body(...),
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """Add a card to a deck."""
    # Verify deck exists
    deck_r = await session.execute(
        select(models.FlashcardDeck).where(
            models.FlashcardDeck.id == deck_id,
            models.FlashcardDeck.college_id == user["college_id"]
        )
    )
    if not deck_r.scalars().first():
        raise HTTPException(status_code=404, detail="Deck not found")
        
    card = models.Flashcard(
        deck_id=deck_id,
        front_content=front_content,
        back_content=back_content
    )
    session.add(card)
    await session.commit()
    await session.refresh(card)
    return card


# ═══════════════════════════════════════════════════════════════════════════════
# SM-2 Spaced Repetition Logic
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/flashcard-decks/{deck_id}/due")
async def get_due_flashcards(
    deck_id: str,
    user: dict = Depends(require_role("student")),
    session: AsyncSession = Depends(get_db)
):
    """Get cards that are due for review today."""
    today = date.today()
    
    # Get all cards in deck
    cards_r = await session.execute(
        select(models.Flashcard).where(models.Flashcard.deck_id == deck_id)
    )
    cards = cards_r.scalars().all()
    if not cards:
        return []
        
    # Get user's reviews for these cards
    card_ids = [c.id for c in cards]
    reviews_r = await session.execute(
        select(models.FlashcardReview).where(
            models.FlashcardReview.student_id == user["id"],
            models.FlashcardReview.card_id.in_(card_ids)
        )
    )
    reviews_map = {r.card_id: r for r in reviews_r.scalars().all()}
    
    due_cards = []
    for card in cards:
        review = reviews_map.get(card.id)
        if not review:
            # Never reviewed, it's due
            due_cards.append(card)
        elif review.next_review_date <= today:
            # Due for review
            due_cards.append(card)
            
    return due_cards

@router.post("/flashcards/{card_id}/review")
async def submit_flashcard_review(
    card_id: str,
    quality: int = Body(..., ge=0, le=5, description="0=Complete blackout, 5=Perfect response"),
    user: dict = Depends(require_role("student")),
    session: AsyncSession = Depends(get_db)
):
    """
    Submit a review for a flashcard and update its SM-2 scheduling parameters.
    """
    review_r = await session.execute(
        select(models.FlashcardReview).where(
            models.FlashcardReview.card_id == card_id,
            models.FlashcardReview.student_id == user["id"]
        )
    )
    review = review_r.scalars().first()
    
    if not review:
        review = models.FlashcardReview(
            card_id=card_id,
            student_id=user["id"],
            easiness_factor=2.5,
            interval_days=0,
            repetitions=0,
            next_review_date=date.today()
        )
        session.add(review)

    # SM-2 Algorithm Implementation
    if quality >= 3:
        # Correct response
        if review.repetitions == 0:
            review.interval_days = 1
        elif review.repetitions == 1:
            review.interval_days = 6
        else:
            review.interval_days = math.ceil(review.interval_days * review.easiness_factor)
            
        review.repetitions += 1
        review.easiness_factor = review.easiness_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    else:
        # Incorrect response
        review.repetitions = 0
        review.interval_days = 1
        
    # Ensure EF doesn't drop below 1.3
    if review.easiness_factor < 1.3:
        review.easiness_factor = 1.3
        
    review.last_reviewed_at = datetime.utcnow()
    review.next_review_date = date.today() + timedelta(days=review.interval_days)

    await session.commit()
    
    return {
        "message": "Review logged",
        "next_review_date": review.next_review_date,
        "interval_days": review.interval_days,
        "repetitions": review.repetitions
    }


# ═══════════════════════════════════════════════════════════════════════════════
# AI Generation
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/flashcards/generate-from-material")
async def generate_flashcards(
    deck_id: str = Body(...),
    material_text: str = Body(..., description="Text content to generate flashcards from"),
    num_cards: int = Body(10, ge=1, le=50),
    user: dict = Depends(require_role("student", "teacher", "faculty", "hod")),
    session: AsyncSession = Depends(get_db)
):
    """
    Generate flashcards from text material using AI.
    """
    # Verify deck exists
    deck_r = await session.execute(
        select(models.FlashcardDeck).where(
            models.FlashcardDeck.id == deck_id,
            models.FlashcardDeck.college_id == user["college_id"]
        )
    )
    deck = deck_r.scalars().first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
        
    from app.services.ai_service import ai_service
    import json
    
    prompt = f"""
    You are an expert tutor. I will provide you with some study material.
    Your task is to generate {num_cards} flashcards from this material.
    Each flashcard should have a clear, concise question on the front, and a comprehensive but brief answer on the back.
    Focus on key concepts, definitions, and important facts.
    
    Return the result as a strict JSON array of objects, with each object having "front" and "back" keys.
    Format exactly like this:
    [
        {{"front": "Question here", "back": "Answer here"}},
        ...
    ]
    
    Here is the material:
    {material_text[:20000]}
    """
    
    try:
        response_text = await ai_service.generate_text(prompt)
        
        # Clean up potential markdown formatting from the response
        if response_text.startswith("```json"):
            response_text = response_text[7:-3].strip()
        elif response_text.startswith("```"):
            response_text = response_text[3:-3].strip()
            
        cards_data = json.loads(response_text)
        
        created_cards = []
        for card_data in cards_data:
            card = models.Flashcard(
                deck_id=deck_id,
                front_content=card_data["front"],
                back_content=card_data["back"]
            )
            session.add(card)
            created_cards.append(card)
            
        await session.commit()
        
        return {
            "message": f"Successfully generated {len(created_cards)} flashcards",
            "cards_generated": len(created_cards)
        }
        
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to generate flashcards: {str(e)}")
