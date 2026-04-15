"""
WhatsApp State Machine — Redis-backed state for interactive flows.

When we send a message with buttons (e.g., "Approve / Reject gate pass"),
we store context in Redis keyed by the message_id returned from Meta API.
When the parent clicks a button, the webhook delivers the original message_id
in `context.id`, letting us atomically retrieve and clear the pending action.

Key schema:
    wa:action:{message_id}  — Pending interactive action (TTL: 1 hour)
    wa:conv:{phone}         — Multi-step conversation state (TTL: 30 min)
    wa:proxy:{slot_key}     — Atomic lock for teacher proxy claims
"""

import json
import logging
from typing import Optional, Dict, Any

import redis.asyncio as aioredis

from app.core.config import settings

logger = logging.getLogger("acadmix.wa_state")

# ─── Singleton Redis Pool ─────────────────────────────────────────────────────

_redis_pool: Optional[aioredis.Redis] = None


async def get_redis() -> aioredis.Redis:
    """Returns a shared async Redis connection (lazy-init)."""
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = aioredis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            max_connections=20,
        )
    return _redis_pool


# ─── Pending Action Store (for button/list replies) ──────────────────────────


async def store_pending_action(
    action_type: str,
    message_id: str,
    payload: Dict[str, Any],
    ttl: int = 3600,
) -> None:
    """
    Store context for a sent interactive message.

    Args:
        action_type: e.g. "gatepass_approval", "proxy_claim", "fee_payment"
        message_id: WhatsApp message ID returned from Meta API send
        payload: Arbitrary context dict (gate pass id, student id, etc.)
        ttl: Seconds until auto-expiry (default 1 hour)
    """
    r = await get_redis()
    key = f"wa:action:{message_id}"
    data = json.dumps({"type": action_type, **payload})
    await r.set(key, data, ex=ttl)
    logger.debug("Stored pending action %s for msg %s (TTL %ds)", action_type, message_id, ttl)


async def retrieve_and_clear(message_id: str) -> Optional[Dict[str, Any]]:
    """
    Atomically retrieve and delete a pending action.
    Returns None if expired or not found.
    """
    r = await get_redis()
    key = f"wa:action:{message_id}"
    data = await r.getdel(key)
    if data:
        logger.debug("Retrieved and cleared action for msg %s", message_id)
        return json.loads(data)
    return None


# ─── Conversation State (for multi-step flows) ───────────────────────────────


async def store_conversation_state(
    phone: str,
    state_data: Dict[str, Any],
    ttl: int = 1800,
) -> None:
    """Store a multi-step conversation state for a phone number."""
    r = await get_redis()
    key = f"wa:conv:{phone}"
    await r.set(key, json.dumps(state_data), ex=ttl)


async def get_conversation_state(phone: str) -> Optional[Dict[str, Any]]:
    """Get current conversation state for a phone number."""
    r = await get_redis()
    key = f"wa:conv:{phone}"
    data = await r.get(key)
    return json.loads(data) if data else None


async def clear_conversation_state(phone: str) -> None:
    """Clear conversation state for a phone number."""
    r = await get_redis()
    await r.delete(f"wa:conv:{phone}")


# ─── Atomic Locks (for teacher proxy "first-click-wins") ─────────────────────


async def try_claim_proxy(slot_key: str, teacher_id: str, ttl: int = 86400) -> bool:
    """
    Attempt to atomically claim a proxy slot.
    Returns True if this teacher won the race, False if already claimed.
    Uses Redis SETNX for atomic first-writer-wins.
    """
    r = await get_redis()
    key = f"wa:proxy:{slot_key}"
    claimed = await r.set(key, teacher_id, nx=True, ex=ttl)
    if claimed:
        logger.info("Teacher %s claimed proxy slot %s", teacher_id, slot_key)
    return bool(claimed)


async def get_proxy_claimer(slot_key: str) -> Optional[str]:
    """Get the teacher_id that claimed a proxy slot."""
    r = await get_redis()
    return await r.get(f"wa:proxy:{slot_key}")
