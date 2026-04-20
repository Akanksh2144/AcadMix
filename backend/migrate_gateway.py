import re

with open("c:\\AcadMix\\backend\\app\\services\\llm_gateway.py", "r", encoding="utf-8") as f:
    text = f.read()

# Replace the top imports to include the new ones
imports_new = """import json
import logging
import time
from collections import defaultdict
from typing import AsyncGenerator, Dict, List, Optional, Any

from app.core.config import settings

from google import genai
from google.genai import types
from google.oauth2 import service_account
from anthropic import AsyncAnthropicVertex

logger = logging.getLogger("acadmix.llm_gateway")"""
text = re.sub(r'import json\nimport logging\n.*?\nlogger = logging.getLogger\("acadmix\.llm_gateway"\)', imports_new, text, flags=re.DOTALL)

# Find the _vertex_client definition block up to _litellm_complete
old_clients_pattern = r'_vertex_client = None.*?async def _litellm_complete'

new_clients = """
# ---------------------------------------------------------------------------
# Core Configuration & Auth
# ---------------------------------------------------------------------------

def _get_google_credentials():
    credentials_json = getattr(settings, "GOOGLE_APPLICATION_CREDENTIALS_JSON", None)
    if credentials_json:
        credentials_dict = json.loads(credentials_json)
        return service_account.Credentials.from_service_account_info(credentials_dict)
    return None

def _get_vertex_client() -> genai.Client:
    project_id = settings.VERTEX_PROJECT_ID
    location = settings.VERTEX_LOCATION
    credentials = _get_google_credentials()
    
    if credentials:
        return genai.Client(vertexai=True, project=project_id, location=location, credentials=credentials)
    return genai.Client(vertexai=True, project=project_id, location=location)

def _get_claude_client() -> AsyncAnthropicVertex:
    project_id = settings.VERTEX_PROJECT_ID
    region = settings.VERTEX_LOCATION
    credentials = _get_google_credentials()
    
    if credentials:
        return AsyncAnthropicVertex(project_id=project_id, region=region, google_credentials=credentials)
    return AsyncAnthropicVertex(project_id=project_id, region=region)

# ---------------------------------------------------------------------------
# Gemini Implementation (google-genai)
# ---------------------------------------------------------------------------

def _map_messages_to_content(messages: list[dict]) -> list[types.Content]:
    contents = []
    for msg in messages:
        role = "user" if msg["role"] in ["user", "system"] else "model"
        parts = []
        
        if isinstance(msg["content"], str):
            parts.append(types.Part.from_text(text=msg["content"]))
        elif isinstance(msg["content"], list):
            for item in msg["content"]:
                if item.get("type") == "text":
                    parts.append(types.Part.from_text(text=item.get("text")))
                elif item.get("type") == "document":
                    parts.append(
                        types.Part.from_bytes(
                            data=item.get("data"),
                            mime_type="application/pdf"
                        )
                    )
        contents.append(types.Content(role=role, parts=parts))
    return contents

async def _vertex_complete(model_name: str, messages: list[dict], **kwargs) -> str:
    json_mode = kwargs.get("json_mode", False)
    client = _get_vertex_client()
    contents = _map_messages_to_content(messages)
    
    config_params = {}
    if json_mode:
        config_params["response_mime_type"] = "application/json"
    
    # Handle media payload from ATS scoring properly via parts manually if passed via kwargs 
    # (Since ATS passes media_bytes directly to complete sometimes!)
    media_bytes = kwargs.get("media_bytes")
    mime_type = kwargs.get("mime_type", "application/pdf")
    if media_bytes:
        contents.append(types.Content(role="user", parts=[
            types.Part.from_text(text="Attached Document:\\n"),
            types.Part.from_bytes(data=media_bytes, mime_type=mime_type)
        ]))
        
    config = types.GenerateContentConfig(**config_params)

    response = await client.aio.models.generate_content(
        model=model_name,
        contents=contents,
        config=config
    )
    return response.text

async def _vertex_stream(model_name: str, messages: list[dict], **kwargs):
    client = _get_vertex_client()
    contents = _map_messages_to_content(messages)

    response_stream = await client.aio.models.generate_content_stream(
        model=model_name,
        contents=contents
    )
    async for chunk in response_stream:
        if chunk.text:
            yield chunk.text

# ---------------------------------------------------------------------------
# Claude Implementation (Anthropic Vertex)
# ---------------------------------------------------------------------------

def _parse_anthropic_messages(messages: list[dict]) -> tuple[str, list[dict]]:
    system_text = next((m["content"] for m in messages if m["role"] == "system"), "")
    user_messages = [m for m in messages if m["role"] != "system"]
    
    anthropic_messages = []
    for m in user_messages:
        role = "assistant" if m["role"] == "model" else "user"
        anthropic_messages.append({"role": role, "content": m["content"]})
        
    return system_text, anthropic_messages

async def _claude_complete(model_name: str, messages: list[dict], **kwargs) -> str:
    client = _get_claude_client()
    system_text, formatted_messages = _parse_anthropic_messages(messages)

    response = await client.messages.create(
        model=model_name,
        max_tokens=8192,
        system=system_text,
        messages=formatted_messages
    )
    return response.content[0].text

async def _claude_stream(model_name: str, messages: list[dict], **kwargs):
    client = _get_claude_client()
    system_text, formatted_messages = _parse_anthropic_messages(messages)

    async with client.messages.stream(
        model=model_name,
        max_tokens=8192,
        system=system_text,
        messages=formatted_messages
    ) as stream:
        async for text in stream.text_stream:
            yield text

async def _litellm_complete"""
text = re.sub(old_clients_pattern, new_clients, text, flags=re.DOTALL)

# Now in LLMGateway.complete and .stream, replace provider == "vertex" routing to support both
gate_c_old = """if provider == "vertex" and _get_vertex_client():
                self._metrics["provider_calls"]["vertex"] += 1
                result = await _vertex_complete(
                    model, messages,
                    temperature=temp, max_tokens=tokens,
                    json_mode=json_mode, timeout=tout,
                    media_bytes=media_bytes, mime_type=mime_type,
                )"""

gate_c_new = """if provider == "vertex":
                self._metrics["provider_calls"]["vertex"] += 1
                if "claude" in model.lower():
                    result = await _claude_complete(
                        model, messages,
                        temperature=temp, max_tokens=tokens,
                        json_mode=json_mode, timeout=tout,
                        media_bytes=media_bytes, mime_type=mime_type,
                    )
                else:
                    result = await _vertex_complete(
                        model, messages,
                        temperature=temp, max_tokens=tokens,
                        json_mode=json_mode, timeout=tout,
                        media_bytes=media_bytes, mime_type=mime_type,
                    )"""
text = text.replace(gate_c_old, gate_c_new)

gate_s_old = """if provider == "vertex" and _get_vertex_client():
                self._metrics["provider_calls"]["vertex"] += 1
                async for chunk in _vertex_stream(model, messages, temperature=temp, max_tokens=tokens):"""
                
gate_s_new = """if provider == "vertex":
                self._metrics["provider_calls"]["vertex"] += 1
                if "claude" in model.lower():
                    async for chunk in _claude_stream(model, messages, temperature=temp, max_tokens=tokens):
                        yield chunk
                else:
                    async for chunk in _vertex_stream(model, messages, temperature=temp, max_tokens=tokens):"""
text = text.replace(gate_s_old, gate_s_new)

with open("c:\\AcadMix\\backend\\app\\services\\llm_gateway.py", "w", encoding="utf-8") as f:
    f.write(text)

print("Migration script generated and applied successfully.")
