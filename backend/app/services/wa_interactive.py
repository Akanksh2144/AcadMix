"""
WhatsApp Interactive Message Builders & Senders

Supports Meta Cloud API interactive message types:
  - Reply Buttons (max 3 buttons)
  - List Messages (max 10 rows across sections)
  - CTA URL Buttons (for payment links, receipts)
  - Template Messages (for proactive utility notifications)

All senders integrate with the TokenBucketRateLimiter and support
WHATSAPP_MOCK_MODE for local development.
"""

import logging
from typing import Optional, List, Dict, Any

import httpx

from app.core.config import settings
from app.services.omnichannel_workers import whatsapp_limiter

logger = logging.getLogger("acadmix.wa_interactive")

META_API_URL = "https://graph.facebook.com/v19.0"


# ─── Low-Level Sender ────────────────────────────────────────────────────────


async def _send_raw(to_phone: str, payload: Dict[str, Any]) -> Optional[str]:
    """
    Send a raw WhatsApp API payload. Returns message_id on success, None on failure.
    In mock mode, logs the payload and returns a fake message ID.
    """
    if settings.WHATSAPP_MOCK_MODE or not settings.WHATSAPP_ACCESS_TOKEN:
        import uuid
        fake_id = f"mock_{uuid.uuid4().hex[:12]}"
        logger.info(
            "📱 [MOCK WA Interactive] To: %s | Type: %s | MsgID: %s\n%s",
            to_phone[-4:].rjust(len(to_phone), '*'),
            payload.get("type", "unknown"),
            fake_id,
            _pretty_payload(payload),
        )
        return fake_id

    await whatsapp_limiter.acquire()

    url = f"{META_API_URL}/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }
    body = {"messaging_product": "whatsapp", "to": to_phone, **payload}

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(url, json=body, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                msg_id = data.get("messages", [{}])[0].get("id")
                logger.info("Interactive message sent to %s (id=%s)", to_phone[-4:].rjust(10, '*'), msg_id)
                return msg_id
            else:
                logger.error("WA Interactive API error %d: %s", resp.status_code, resp.text[:300])
                return None
    except Exception as e:
        logger.error("WA Interactive send failed: %s", e)
        return None


def _pretty_payload(payload: Dict[str, Any]) -> str:
    """Human-readable summary of a payload for mock logging."""
    msg_type = payload.get("type", "")
    if msg_type == "interactive":
        interactive = payload.get("interactive", {})
        itype = interactive.get("type", "")
        body_text = interactive.get("body", {}).get("text", "")[:80]
        if itype == "button":
            buttons = [b.get("reply", {}).get("title", "?") for b in interactive.get("action", {}).get("buttons", [])]
            return f"  [BUTTON] {body_text}\n  Buttons: {buttons}"
        elif itype == "list":
            return f"  [LIST] {body_text}"
        elif itype == "cta_url":
            url = interactive.get("action", {}).get("parameters", {}).get("url", "")
            display = interactive.get("action", {}).get("parameters", {}).get("display_text", "")
            return f"  [CTA] {body_text}\n  Button: [{display}] → {url}"
    elif msg_type == "text":
        return f"  [TEXT] {payload.get('text', {}).get('body', '')[:100]}"
    return f"  [{msg_type}] (raw payload)"


# ─── Reply Buttons ────────────────────────────────────────────────────────────


async def send_button_message(
    to_phone: str,
    body_text: str,
    buttons: List[Dict[str, str]],
    header_text: Optional[str] = None,
    footer_text: Optional[str] = None,
) -> Optional[str]:
    """
    Send an interactive reply-button message (max 3 buttons).

    Args:
        to_phone: Recipient phone (with country code)
        body_text: Main message body
        buttons: List of {"id": "btn_id", "title": "Button Label"} (max 3)
        header_text: Optional header
        footer_text: Optional footer
    Returns:
        Message ID from Meta API, or mock ID, or None on failure
    """
    if len(buttons) > 3:
        logger.warning("WhatsApp allows max 3 reply buttons, truncating")
        buttons = buttons[:3]

    interactive = {
        "type": "button",
        "body": {"text": body_text},
        "action": {
            "buttons": [
                {"type": "reply", "reply": {"id": b["id"], "title": b["title"][:20]}}
                for b in buttons
            ]
        },
    }
    if header_text:
        interactive["header"] = {"type": "text", "text": header_text}
    if footer_text:
        interactive["footer"] = {"text": footer_text}

    return await _send_raw(to_phone, {"type": "interactive", "interactive": interactive})


# ─── List Messages ────────────────────────────────────────────────────────────


async def send_list_message(
    to_phone: str,
    body_text: str,
    button_text: str,
    sections: List[Dict[str, Any]],
    header_text: Optional[str] = None,
    footer_text: Optional[str] = None,
) -> Optional[str]:
    """
    Send an interactive list message.

    Args:
        sections: [{"title": "Section", "rows": [{"id": "row_1", "title": "Item", "description": "..."}]}]
    """
    interactive = {
        "type": "list",
        "body": {"text": body_text},
        "action": {
            "button": button_text[:20],
            "sections": sections,
        },
    }
    if header_text:
        interactive["header"] = {"type": "text", "text": header_text}
    if footer_text:
        interactive["footer"] = {"text": footer_text}

    return await _send_raw(to_phone, {"type": "interactive", "interactive": interactive})


# ─── CTA URL Button (for payment links, receipts) ────────────────────────────


async def send_cta_url_message(
    to_phone: str,
    body_text: str,
    button_text: str,
    url: str,
    header_text: Optional[str] = None,
    footer_text: Optional[str] = None,
) -> Optional[str]:
    """
    Send a CTA URL button message (clickable link button).

    This is the primary mechanism for fee payment links and receipt downloads.
    """
    interactive = {
        "type": "cta_url",
        "body": {"text": body_text},
        "action": {
            "name": "cta_url",
            "parameters": {
                "display_text": button_text[:20],
                "url": url,
            },
        },
    }
    if header_text:
        interactive["header"] = {"type": "text", "text": header_text}
    if footer_text:
        interactive["footer"] = {"text": footer_text}

    return await _send_raw(to_phone, {"type": "interactive", "interactive": interactive})


# ─── Plain Text (upgraded version of existing sender) ────────────────────────


async def send_text_message(to_phone: str, body: str) -> Optional[str]:
    """Send a plain text message. Returns message ID."""
    return await _send_raw(to_phone, {"type": "text", "text": {"body": body}})


# ─── Template Messages (for proactive utility notifications) ─────────────────


async def send_template_message(
    to_phone: str,
    template_name: str,
    language_code: str = "en",
    components: Optional[List[Dict[str, Any]]] = None,
) -> Optional[str]:
    """
    Send a pre-approved template message.
    Templates are required for proactive messages (bus alerts, fee reminders)
    sent outside the 24-hour customer service window.
    """
    template = {
        "name": template_name,
        "language": {"code": language_code},
    }
    if components:
        template["components"] = components

    return await _send_raw(to_phone, {"type": "template", "template": template})
