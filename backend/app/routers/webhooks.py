"""
WhatsApp Webhook — receives incoming messages from Meta Cloud API
and routes them through the WhatsApp Bot Service (Ami).
"""
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
from fastapi.responses import PlainTextResponse
import json
import hmac
import hashlib
import logging

from app.core.config import settings

router = APIRouter()
logger = logging.getLogger("acadmix.whatsapp_webhook")


def verify_whatsapp_signature(payload: bytes, signature: str) -> bool:
    secret = settings.WHATSAPP_APP_SECRET
    if not secret:
        logger.warning("WHATSAPP_APP_SECRET is empty — skipping signature check")
        return True

    if not signature or not signature.startswith('sha256='):
        return False

    hash_value = signature.split('sha256=')[1]
    expected_hash = hmac.new(
        key=secret.encode('utf-8'),
        msg=payload,
        digestmod=hashlib.sha256
    ).hexdigest()

    # hmac.compare_digest prevents timing attacks
    return hmac.compare_digest(hash_value, expected_hash)


@router.post("/whatsapp")
async def whatsapp_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Webhook receiver for WhatsApp Meta API delivery receipts and incoming messages.
    """
    signature = request.headers.get("X-Hub-Signature-256")
    body_bytes = await request.body()

    # In mock mode (local dev), skip signature verification
    if not settings.WHATSAPP_MOCK_MODE:
        if not verify_whatsapp_signature(body_bytes, signature):
            raise HTTPException(status_code=401, detail="Invalid signature")

    # Queue parsing logic for async processing to unblock the Meta API quickly (timeout max: 15s)
    try:
        payload = await request.json()
        logger.warning("[WA-WEBHOOK] Raw payload: %s", json.dumps(payload, indent=2)[:2000])
        background_tasks.add_task(_process_whatsapp_event_async, payload)
    except Exception as e:
        logger.error("Failed to parse webhook payload: %s", e)

    return {"status": "ok"}


@router.get("/whatsapp")
async def whatsapp_verify(request: Request):
    """
    Meta API Webhook verification challenge.
    Returns hub.challenge as plain text (required by Meta).
    """
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")

    logger.info(
        "Webhook verify request: mode=%s, token_match=%s, challenge=%s",
        mode,
        token == settings.WHATSAPP_VERIFY_TOKEN if token else "no_token",
        bool(challenge),
    )

    if mode == "subscribe" and token == settings.WHATSAPP_VERIFY_TOKEN:
        if not challenge:
            raise HTTPException(status_code=400, detail="Missing hub.challenge")
        logger.info("Webhook verification succeeded")
        return PlainTextResponse(content=challenge)

    logger.warning("Webhook verification FAILED — token mismatch or wrong mode")
    raise HTTPException(status_code=403, detail="Forbidden")


# ─── Local test endpoint (mock mode only) ─────────────────────────────────────

@router.post("/whatsapp/test")
async def whatsapp_test(request: Request):
    """
    LOCAL DEV ONLY: Test the bot without Meta API.
    Send JSON: { "phone": "9876543210", "message": "attendance" }
    Returns the bot's response directly.
    """
    if not settings.WHATSAPP_MOCK_MODE:
        raise HTTPException(status_code=404, detail="Not available in production")

    body = await request.json()
    phone = body.get("phone", "")
    message = body.get("message", "")

    if not phone or not message:
        raise HTTPException(status_code=400, detail="phone and message are required")

    from database import AsyncSessionLocal
    async with AsyncSessionLocal() as session:
        async with session.begin():
            from app.services.whatsapp_bot import WhatsAppBotService
            bot = WhatsAppBotService(session)
            response = await bot.route_message(phone, message)

    return {"to": phone, "response": response}


# ─── Background event processor ──────────────────────────────────────────────

async def _process_whatsapp_event_async(payload: dict):
    """Async processor for incoming WhatsApp events."""
    try:
        # Extract message data from Meta webhook payload
        entries = payload.get("entry", [])
        logger.warning("[WA-PROCESS] Processing %d entries", len(entries))
        for entry in entries:
            changes = entry.get("changes", [])
            logger.warning("[WA-PROCESS] Entry has %d changes", len(changes))
            for change in changes:
                value = change.get("value", {})
                messages = value.get("messages", [])
                logger.warning("[WA-PROCESS] Change has %d messages, keys: %s", len(messages), list(value.keys()))

                for msg in messages:
                    msg_type = msg.get("type")
                    sender_phone = msg.get("from", "")
                    logger.warning("[WA-PROCESS] Message type=%s from=%s", msg_type, sender_phone)

                    # Handle text messages
                    if msg_type == "text":
                        text_body = msg.get("text", {}).get("body", "")
                        logger.warning("[WA-PROCESS] Text body: %s", text_body)
                        if text_body and sender_phone:
                            await _handle_incoming_message(sender_phone, text_body)

                    # Handle interactive messages (button replies, list selections)
                    elif msg_type == "interactive":
                        interactive = msg.get("interactive", {})
                        logger.warning("[WA-PROCESS] Interactive: %s", interactive.get("type"))
                        if interactive and sender_phone:
                            await _handle_interactive_reply(sender_phone, interactive)

                # Handle delivery status updates (optional logging)
                statuses = value.get("statuses", [])
                for status in statuses:
                    logger.warning(
                        "[WA-STATUS] Delivery: %s -> %s",
                        status.get("id", "?"),
                        status.get("status", "?")
                    )
    except Exception as e:
        logger.error("Error processing WhatsApp event: %s", e, exc_info=True)


async def _handle_incoming_message(phone: str, text: str):
    """Process a single incoming message through the bot and send reply."""
    from database import AsyncSessionLocal
    from app.services.whatsapp_bot import WhatsAppBotService, send_whatsapp_message

    logger.info("Incoming WhatsApp from ...%s: %s", phone[-4:], text[:50])

    async with AsyncSessionLocal() as session:
        async with session.begin():
            bot = WhatsAppBotService(session)
            response = await bot.route_message(phone, text)

    # Send reply
    await send_whatsapp_message(phone, response)


async def _handle_interactive_reply(phone: str, interactive_data: dict):
    """Process an interactive message reply (button click, list selection)."""
    from database import AsyncSessionLocal
    from app.services.wa_interactive import send_text_message

    itype = interactive_data.get("type", "")
    logger.info(
        "Interactive reply from ...%s: type=%s",
        phone[-4:], itype,
    )

    async with AsyncSessionLocal() as session:
        async with session.begin():
            from app.services.whatsapp_bot import WhatsAppBotService
            bot = WhatsAppBotService(session)
            response = await bot.route_interactive(phone, interactive_data)

    # Send reply
    await send_text_message(phone, response)


# Note: _process_whatsapp_event_async is called directly as a background task.
# FastAPI's BackgroundTasks supports async callables natively, running them on
# uvicorn's event loop, which avoids asyncpg "attached to a different loop" errors.
