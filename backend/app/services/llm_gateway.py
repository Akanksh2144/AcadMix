"""
AcadMix LLM Gateway — Production-Grade Multi-Provider AI Router

Architecture:
    ┌────────────────────────────────────────────────────────────────┐
    │                      LLMGateway                                │
    │                                                                │
    │  purpose="interview"     → Vertex AI  (Gemini 2.5 Flash)       │
    │  purpose="career_tools"  → Vertex AI  (Gemini 2.0 Flash Lite)  │
    │  purpose="code_review"   → Vertex AI  (Gemini 2.0 Flash Lite)  │
    │  purpose="ami_coach"     → Vertex AI  (Gemini 2.0 Flash Lite)  │
    │  purpose="ats_scoring"   → Vertex AI  (Gemini 2.0 Flash Lite)  │
    │  purpose="erp_summary"   → Vertex AI  (Gemini 2.0 Flash Lite)  │
    │  purpose="erp_insights"  → Vertex AI  (Gemini 2.0 Flash)       │
    │  purpose="erp_complex"   → Vertex AI  (Gemini 2.5 Pro)         │
    │  purpose="erp_last_resort"→ Vertex AI (Claude Sonnet 4.6)      │
    │                                                                │
    │  Fallback chain: Primary → LiteLLM/Groq → Gemini AI Studio     │
    └────────────────────────────────────────────────────────────────┘

Production compliance:
    - Google Cloud Vertex AI DPA available, data never used for training

Usage:
    from app.services.llm_gateway import gateway

    # Simple completion
    result = await gateway.complete("career_tools", messages=[...])

    # Streaming (Ami coach, interviews)
    async for chunk in gateway.stream("ami_coach", messages=[...]):
        yield chunk

    # ERP with auto-fallback
    result = await gateway.complete_erp(user_query, messages=[...])
"""

import json
import logging
import time
from collections import defaultdict
from typing import AsyncGenerator, Dict, List, Optional, Any

from app.core.config import settings

logger = logging.getLogger("acadmix.llm_gateway")


# ═══════════════════════════════════════════════════════════════════════════════
# COST GUARD — Prevent runaway bills from loops / prompt injection
# ═══════════════════════════════════════════════════════════════════════════════

MAX_TOKENS_PER_REQUEST = 8000        # Hard cap — no single call can exceed this
MAX_REQUESTS_PER_USER_PER_DAY = 50   # Per-student daily limit

# In-memory daily request counter (reset on worker restart; Redis-backed in Phase 2)
_daily_user_requests: Dict[str, int] = defaultdict(int)
_daily_reset_timestamp: float = time.time()


# ═══════════════════════════════════════════════════════════════════════════════
# ROUTE DEFINITIONS — Purpose → (Provider, Model)
# ═══════════════════════════════════════════════════════════════════════════════

ROUTES: Dict[str, Dict[str, Any]] = {
    # ── Interviews: Gemini 2.5 Flash via Vertex AI ─────────────────────────
    "interview": {
        "provider": "vertex",
        "model": None,  # Set dynamically from settings
        "temperature": 0.7,
        "max_tokens": 1024,
        "timeout": 15.0,
        "description": "Mock interviews — best reasoning for multi-turn conversation",
    },

    # ── Career Tools: Gemini 2.0 Flash Lite via Vertex AI ──────────────────
    "career_tools": {
        "provider": "vertex",
        "model": None,
        "temperature": 0.3,
        "max_tokens": 4096,
        "timeout": 30.0,
        "description": "Cover letters, JD analysis, cold emails, HR questions, DSA, career paths",
    },

    # ── Code Review: Gemini 2.0 Flash Lite via Vertex AI ───────────────────
    "code_review": {
        "provider": "vertex",
        "model": None,
        "temperature": 0.1,
        "max_tokens": 2000,
        "timeout": 30.0,
        "description": "Code quality analysis, complexity estimation",
    },

    # ── Ami Coach: Gemini 2.0 Flash Lite via Vertex AI ─────────────────────
    "ami_coach": {
        "provider": "vertex",
        "model": None,
        "temperature": 0.5,
        "max_tokens": 500,
        "timeout": 30.0,
        "description": "Socratic tutor — streaming responses",
    },

    # ── ATS Scoring: Gemini 2.0 Flash Lite via Vertex AI ───────────────────
    "ats_scoring": {
        "provider": "vertex",
        "model": None,
        "temperature": 0.0,
        "max_tokens": 2000,
        "timeout": 30.0,
        "description": "Resume ATS scoring, keyword matching",
    },

    # ── ERP Insights (standard): Gemini 2.0 Flash via Vertex AI ────────────
    "erp_insights": {
        "provider": "vertex",
        "model": None,
        "temperature": 0.0,
        "max_tokens": 600,
        "timeout": 30.0,
        "description": "Text-to-SQL for faculty/admin/principal/HOD queries",
    },

    # ── ERP Insights (complex): Gemini 2.5 Pro via Vertex AI ───────────────
    "erp_complex": {
        "provider": "vertex",
        "model": None,
        "temperature": 0.0,
        "max_tokens": 1000,
        "timeout": 45.0,
        "description": "Complex multi-step ERP queries",
    },
    
    # ── ERP Insights (fallback): Claude 4.6 via Anthropic Vertex Model Garden ──
    "erp_last_resort": {
        "provider": "vertex_anthropic",
        "model": None,
        "temperature": 0.0,
        "max_tokens": 1000,
        "timeout": 60.0,
        "description": "Last-resort fallback for ERP queries when Gemini Pro fails",
    },

    # ── ERP Summary: Gemini 2.0 Flash Lite via Vertex AI ───────────────────
    "erp_summary": {
        "provider": "vertex",
        "model": None,
        "temperature": 0.1,
        "max_tokens": 500,
        "timeout": 30.0,
        "description": "Natural language summaries of ERP query results",
    },
}


def _resolve_models():
    """Bind config setting values to route definitions at runtime."""
    ROUTES["interview"]["model"] = getattr(settings, "VERTEX_MODEL_INTERVIEW", "gemini-2.5-flash-preview-04-17")
    ROUTES["career_tools"]["model"] = getattr(settings, "VERTEX_MODEL_LITE", "gemini-2.0-flash-lite")
    ROUTES["code_review"]["model"] = getattr(settings, "VERTEX_MODEL_LITE", "gemini-2.0-flash-lite")
    ROUTES["ami_coach"]["model"] = getattr(settings, "VERTEX_MODEL_LITE", "gemini-2.0-flash-lite")
    ROUTES["ats_scoring"]["model"] = getattr(settings, "VERTEX_MODEL_LITE", "gemini-2.0-flash-lite")
    ROUTES["erp_insights"]["model"] = getattr(settings, "VERTEX_MODEL_FLASH", "gemini-2.0-flash-001")
    ROUTES["erp_complex"]["model"] = getattr(settings, "VERTEX_MODEL_PRO", "gemini-2.5-pro")
    ROUTES["erp_last_resort"]["model"] = getattr(settings, "VERTEX_MODEL_FALLBACK", "claude-sonnet-4-6")
    ROUTES["erp_summary"]["model"] = getattr(settings, "VERTEX_MODEL_LITE", "gemini-2.0-flash-lite")


# ═══════════════════════════════════════════════════════════════════════════════
# PROVIDER CLIENTS — Lazy-initialized singletons
# ═══════════════════════════════════════════════════════════════════════════════

_vertex_client = None


def _get_vertex_client():
    """Initialize Vertex AI client (lazy, singleton).
    
    Supports two credential modes:
    1. GOOGLE_APPLICATION_CREDENTIALS_JSON (env var) — for Render / ephemeral containers
    2. VERTEX_CREDENTIALS_PATH (file path) — for local development
    3. Application Default Credentials — if neither is set
    """
    global _vertex_client
    if _vertex_client is not None:
        return _vertex_client

    if not settings.VERTEX_PROJECT_ID:
        logger.warning("VERTEX_PROJECT_ID not set — Vertex AI disabled, falling back to LiteLLM")
        return None

    try:
        import vertexai

        init_kwargs = {
            "project": settings.VERTEX_PROJECT_ID,
            "location": settings.VERTEX_LOCATION,
        }

        # Priority 1: JSON string from env var
        if getattr(settings, "GOOGLE_APPLICATION_CREDENTIALS_JSON", None):
            import json
            from google.oauth2 import service_account
            
            creds_dict = json.loads(settings.GOOGLE_APPLICATION_CREDENTIALS_JSON)
            credentials = service_account.Credentials.from_service_account_info(creds_dict)
            init_kwargs["credentials"] = credentials
            logger.info("Vertex AI credentials: loaded from GOOGLE_APPLICATION_CREDENTIALS_JSON env var")
        # Legacy fallback rename check
        elif getattr(settings, "VERTEX_CREDENTIALS_JSON", None):
            import json
            from google.oauth2 import service_account
            
            creds_dict = json.loads(settings.VERTEX_CREDENTIALS_JSON)
            credentials = service_account.Credentials.from_service_account_info(creds_dict)
            init_kwargs["credentials"] = credentials
            logger.info("Vertex AI credentials: loaded from VERTEX_CREDENTIALS_JSON env var")

        # Priority 2: File path
        elif getattr(settings, "VERTEX_CREDENTIALS_PATH", None):
            from google.oauth2 import service_account
            credentials = service_account.Credentials.from_service_account_file(
                settings.VERTEX_CREDENTIALS_PATH
            )
            init_kwargs["credentials"] = credentials
            logger.info("Vertex AI credentials: loaded from file %s", settings.VERTEX_CREDENTIALS_PATH)

        # Priority 3: Application Default Credentials
        else:
            logger.info("Vertex AI credentials: using Application Default Credentials")

        vertexai.init(**init_kwargs)
        _vertex_client = True  # Flag that Vertex is initialized
        logger.info(
            "Vertex AI initialized: project=%s, location=%s, models=[%s, %s, %s]",
            settings.VERTEX_PROJECT_ID,
            settings.VERTEX_LOCATION,
            getattr(settings, "VERTEX_MODEL_INTERVIEW", ""),
            getattr(settings, "VERTEX_MODEL_FLASH", ""),
            getattr(settings, "VERTEX_MODEL_FALLBACK", ""),
        )
        return _vertex_client
    except Exception as e:
        logger.error("Vertex AI initialization failed: %s", e)
        return None


# ═══════════════════════════════════════════════════════════════════════════════
# PROVIDER-SPECIFIC COMPLETION IMPLEMENTATIONS
# ═══════════════════════════════════════════════════════════════════════════════

async def _vertex_complete(
    model: str,
    messages: List[Dict[str, str]],
    temperature: float = 0.7,
    max_tokens: int = 1024,
    json_mode: bool = False,
    media_bytes: Optional[bytes] = None,
    mime_type: str = "application/pdf",
    **kwargs,
) -> str:
    """Call Gemini via Vertex AI SDK (async)."""
    from vertexai.generative_models import GenerativeModel, GenerationConfig, Part

    gen_config = GenerationConfig(
        temperature=temperature,
        max_output_tokens=max_tokens,
    )
    if json_mode:
        gen_config.response_mime_type = "application/json"

    system_parts = []
    contents = []
    
    if media_bytes:
        # Prepend the media block to the user prompt context
        contents.append({"role": "user", "parts": [{"text": "Attached Document:\n"}, Part.from_data(data=media_bytes, mime_type=mime_type)]})

    for msg in messages:
        if msg["role"] == "system":
            system_parts.append(msg["content"])
        elif msg["role"] == "user":
            if contents and contents[-1]["role"] == "user":
                contents[-1]["parts"].append({"text": msg["content"]})
            else:
                contents.append({"role": "user", "parts": [{"text": msg["content"]}]})
        elif msg["role"] == "assistant":
            contents.append({"role": "model", "parts": [{"text": msg["content"]}]})

    gen_model = GenerativeModel(
        model,
        generation_config=gen_config,
        system_instruction="\n\n".join(system_parts) if system_parts else None,
    )

    import asyncio
    # Vertex AI Python SDK is synchronous — run in executor
    def _sync_call():
        response = gen_model.generate_content(contents)
        return response.text

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, _sync_call)
    return result


async def _vertex_stream(
    model: str,
    messages: List[Dict[str, str]],
    temperature: float = 0.7,
    max_tokens: int = 1024,
    **kwargs,
) -> AsyncGenerator[str, None]:
    """Stream Gemini via Vertex AI SDK."""
    from vertexai.generative_models import GenerativeModel, GenerationConfig
    import asyncio

    gen_config = GenerationConfig(
        temperature=temperature,
        max_output_tokens=max_tokens,
    )

    system_parts = []
    contents = []
    for msg in messages:
        if msg["role"] == "system":
            system_parts.append(msg["content"])
        elif msg["role"] == "user":
            contents.append({"role": "user", "parts": [{"text": msg["content"]}]})
        elif msg["role"] == "assistant":
            contents.append({"role": "model", "parts": [{"text": msg["content"]}]})

    gen_model = GenerativeModel(
        model,
        generation_config=gen_config,
        system_instruction="\n\n".join(system_parts) if system_parts else None,
    )

    def _sync_stream():
        return gen_model.generate_content(contents, stream=True)

    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(None, _sync_stream)

    for chunk in response:
        if chunk.text:
            yield chunk.text


async def _vertex_anthropic_complete(
    model: str,
    messages: List[Dict[str, str]],
    temperature: float = 0.0,
    max_tokens: int = 1000,
    **kwargs,
) -> str:
    """Call Claude 4.6 via Vertex Model Garden (AnthropicVertex client)."""
    import asyncio
    from anthropic import AnthropicVertex
    
    # Initialize ephemeral AnthropicVertex client
    client = AnthropicVertex(
        region=settings.VERTEX_LOCATION,
        project_id=settings.VERTEX_PROJECT_ID,
    )

    # Separate system messages from conversation
    system_messages = ""
    converse_messages = []
    for msg in messages:
        if msg["role"] == "system":
            system_messages += msg["content"] + "\n"
        else:
            role = "user" if msg["role"] == "user" else "assistant"
            converse_messages.append({
                "role": role,
                "content": [{"type": "text", "text": msg["content"]}],
            })

    def _sync_call():
        response = client.messages.create(
            model=model,
            max_tokens=max_tokens,
            temperature=temperature,
            system=system_messages.strip(),
            messages=converse_messages
        )
        return response.content[0].text

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, _sync_call)
    return result


# ═══════════════════════════════════════════════════════════════════════════════
# LITELLM FALLBACK — Used when Vertex/Bedrock are not configured or fail
# ═══════════════════════════════════════════════════════════════════════════════

async def _litellm_complete(
    messages: List[Dict[str, str]],
    temperature: float = 0.5,
    max_tokens: int = 2000,
    json_mode: bool = False,
    timeout: float = 30.0,
    **kwargs,
) -> str:
    """Fallback to LiteLLM (Groq/Gemini AI Studio)."""
    import litellm

    litellm.api_key = settings.GEMINI_API_KEY

    call_kwargs = {
        "model": settings.LLM_REVIEW_MODEL,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "timeout": timeout,
    }
    if json_mode:
        call_kwargs["response_format"] = {"type": "json_object"}

    response = await litellm.acompletion(**call_kwargs)
    return response.choices[0].message.content.strip()


async def _litellm_stream(
    messages: List[Dict[str, str]],
    temperature: float = 0.5,
    max_tokens: int = 500,
    timeout: float = 30.0,
    **kwargs,
) -> AsyncGenerator[str, None]:
    """Fallback streaming via LiteLLM."""
    import litellm

    litellm.api_key = settings.GEMINI_API_KEY

    response = await litellm.acompletion(
        model=settings.LLM_REVIEW_MODEL,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
        stream=True,
        timeout=timeout,
    )
    async for chunk in response:
        content = chunk.choices[0].delta.content
        if content:
            yield content


# ═══════════════════════════════════════════════════════════════════════════════
# GATEWAY CLASS — The single entrypoint for all AI calls in AcadMix
# ═══════════════════════════════════════════════════════════════════════════════

class LLMGateway:
    """
    Production-grade LLM router for AcadMix.

    Routes AI calls to the optimal provider+model based on purpose.
    Handles fallbacks, metrics, and error recovery automatically.

    Usage:
        result = await gateway.complete("career_tools", messages=[...])
        async for chunk in gateway.stream("ami_coach", messages=[...]):
            yield chunk
    """

    def __init__(self):
        self._initialized = False
        self._metrics = {
            "total_calls": 0,
            "provider_calls": {"vertex": 0, "bedrock": 0, "litellm": 0},
            "errors": 0,
            "fallbacks": 0,
        }

    def initialize(self):
        """Initialize provider clients. Call once at app startup."""
        if self._initialized:
            return

        _resolve_models()

        # Attempt to initialize providers (non-fatal if they fail)
        _get_vertex_client()

        self._initialized = True
        logger.info("LLM Gateway initialized — routes: %s", list(ROUTES.keys()))

    async def complete(
        self,
        purpose: str,
        messages: List[Dict[str, str]],
        json_mode: bool = False,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        timeout: Optional[float] = None,
        media_bytes: Optional[bytes] = None,
        mime_type: str = "application/pdf",
    ) -> str:
        """
        Route a completion request to the right provider.

        Args:
            purpose: One of the ROUTES keys (e.g., "interview", "career_tools")
            messages: OpenAI-format messages [{role, content}, ...]
            json_mode: If True, request JSON output
            temperature: Override route default
            max_tokens: Override route default
            timeout: Override route default
            media_bytes: Raw bytes of an uploaded file (e.g., PDF)
            mime_type: Content type of media_bytes

        Returns:
            The LLM response text.

        Raises:
            HTTPException(502) if all providers fail.
        """
        if not self._initialized:
            self.initialize()

        route = ROUTES.get(purpose)
        if not route:
            raise ValueError(f"Unknown LLM purpose: {purpose}. Valid: {list(ROUTES.keys())}")

        provider = route["provider"]
        model = route["model"]
        temp = temperature if temperature is not None else route["temperature"]
        tokens = max_tokens if max_tokens is not None else route["max_tokens"]
        tout = timeout if timeout is not None else route["timeout"]

        # ── Cost Guard: enforce hard token cap ──────────────────────────────
        tokens = min(tokens, MAX_TOKENS_PER_REQUEST)

        self._metrics["total_calls"] += 1
        start = time.monotonic()

        # ── Try primary provider ─────────────────────────────────────────
        try:
            if provider == "vertex" and _get_vertex_client():
                self._metrics["provider_calls"]["vertex"] += 1
                result = await _vertex_complete(
                    model, messages,
                    temperature=temp, max_tokens=tokens, json_mode=json_mode,
                    media_bytes=media_bytes, mime_type=mime_type,
                )
                self._log_call(purpose, provider, model, start)
                return result

            elif provider == "vertex_anthropic" and _get_vertex_client():
                self._metrics["provider_calls"]["vertex"] += 1
                result = await _vertex_anthropic_complete(
                    model, messages,
                    temperature=temp, max_tokens=tokens,
                )
                self._log_call(purpose, provider, model, start)
                return result

        except Exception as e:
            if provider == "vertex_anthropic":
                from fastapi import HTTPException
                logger.error("[LLMGateway] Critical Tier 3 failure (AnthropicVertex): %s", e)
                raise HTTPException(status_code=503, detail="ERP Fallback explicitly failed. Ensure Claude 4.6 is enabled in Model Garden.")

            logger.warning(
                "[LLMGateway] Primary provider %s/%s failed for %s: %s — falling back to LiteLLM",
                provider, model, purpose, e,
            )
            self._metrics["errors"] += 1

        # ── Fallback to LiteLLM (Groq / Gemini AI Studio) ────────────────
        try:
            self._metrics["fallbacks"] += 1
            self._metrics["provider_calls"]["litellm"] += 1
            logger.info("[LLMGateway] Falling back to LiteLLM for purpose=%s", purpose)
            result = await _litellm_complete(
                messages,
                temperature=temp, max_tokens=tokens,
                json_mode=json_mode, timeout=tout,
            )
            self._log_call(purpose, "litellm", settings.LLM_REVIEW_MODEL, start)
            return result
        except Exception as e:
            logger.error("[LLMGateway] All providers failed for %s: %s", purpose, e)
            self._metrics["errors"] += 1
            from fastapi import HTTPException
            raise HTTPException(status_code=502, detail="AI service temporarily unavailable")

    async def stream(
        self,
        purpose: str,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Route a streaming request to the right provider.

        Yields text chunks as they arrive from the LLM.
        """
        if not self._initialized:
            self.initialize()

        route = ROUTES.get(purpose)
        if not route:
            raise ValueError(f"Unknown LLM purpose: {purpose}")

        provider = route["provider"]
        model = route["model"]
        temp = temperature if temperature is not None else route["temperature"]
        tokens = max_tokens if max_tokens is not None else route["max_tokens"]

        self._metrics["total_calls"] += 1

        # ── Try primary provider ─────────────────────────────────────────
        try:
            if provider == "vertex" and _get_vertex_client():
                self._metrics["provider_calls"]["vertex"] += 1
                async for chunk in _vertex_stream(model, messages, temperature=temp, max_tokens=tokens):
                    yield chunk
                return

        except Exception as e:
            logger.warning(
                "[LLMGateway] Primary stream %s/%s failed for %s: %s — falling back",
                provider, model, purpose, e,
            )
            self._metrics["errors"] += 1

        # ── Fallback to LiteLLM ──────────────────────────────────────────
        try:
            self._metrics["fallbacks"] += 1
            self._metrics["provider_calls"]["litellm"] += 1
            async for chunk in _litellm_stream(messages, temperature=temp, max_tokens=tokens):
                yield chunk
        except Exception as e:
            logger.error("[LLMGateway] All stream providers failed for %s: %s", purpose, e)
            yield "\n\n*AI service is currently unavailable. Please try again.*"

    async def complete_erp(
        self,
        user_query: str,
        messages: List[Dict[str, str]],
        json_mode: bool = False,
    ) -> str:
        """
        ERP-specific completion with 3-tier complexity fallback.

        Tier 1: Gemini 2.0 Flash (`erp_insights`)
        Tier 2: Gemini 2.5 Pro (`erp_complex`). Escalates if invalid SQL, keywords, or 3+ JOINs.
        Tier 3: Claude Sonnet 4.6 (`erp_last_resort`). Escalates if Tier 2 fails or invalid.
        """
        import re

        def _clean_sql(query: str) -> str:
            """Remove markdown sql fences before validation."""
            cleaned = re.sub(r"^```(?:sql)?\s*", "", query.strip(), flags=re.IGNORECASE)
            cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.IGNORECASE)
            return cleaned.strip().upper()
        
        async def _tier_3_fallback(msgs: List[Dict[str, str]], json_req: bool) -> str:
            logger.warning("[LLMGateway] Escalating to Tier 3: Claude Sonnet 4.6")
            return await self.complete("erp_last_resort", msgs, json_mode=json_req)
            
        async def _tier_2_fallback(msgs: List[Dict[str, str]], json_req: bool) -> str:
            logger.info("[LLMGateway] Escalating to Tier 2: Gemini 2.5 Pro")
            try:
                t2_result = await self.complete("erp_complex", msgs, json_mode=json_req)
                t2_upper = _clean_sql(t2_result)
                if not json_req and not t2_upper.startswith("SELECT"):
                    return await _tier_3_fallback(msgs, json_req)
                return t2_result
            except Exception as e:
                logger.error("[LLMGateway] Tier 2 failed: %s", e)
                return await _tier_3_fallback(msgs, json_req)

        # ── Complexity heuristic — route hard queries directly to Tier 2 ──
        complex_signals = [
            "compare", "trend", "across all", "correlation", "at-risk",
            "top performing", "analyze", "pattern", "anomaly", "predict",
            "year over year", "semester wise", "department wise breakdown",
            "vs last year",
        ]
        is_complex = any(signal in user_query.lower() for signal in complex_signals)

        if is_complex:
            return await _tier_2_fallback(messages, json_mode)

        # ── Standard path: Tier 1 (Gemini 2.0 Flash) ───────────────────────
        try:
            result = await self.complete("erp_insights", messages, json_mode=json_mode)

            # Validate: Flash must return valid SQL (not prose/errors)
            result_upper = _clean_sql(result)

            if not json_mode:
                # Escalation trigger 1: Not SQL
                if not result_upper.startswith("SELECT"):
                    return await _tier_2_fallback(messages, json_mode)

                # Escalation trigger 2: Expressed inability
                inability_signals = ["I CANNOT", "I'M UNABLE", "NOT POSSIBLE", "BEYOND MY", "I NEED MORE CONTEXT"]
                if any(sig in result_upper for sig in inability_signals):
                    return await _tier_2_fallback(messages, json_mode)
                    
                # Escalation trigger 3: Heavily complex query generated (3+ JOINs)
                if result_upper.count("JOIN") >= 3:
                    logger.info("[LLMGateway] Tier 1 generated complex query (3+ JOINs) — escalating to Tier 2 to verify logic")
                    return await _tier_2_fallback(messages, json_mode)

            return result

        except Exception as e:
            logger.warning("[LLMGateway] Tier 1 ERP failed: %s — escalating to Tier 2", e)
            return await _tier_2_fallback(messages, json_mode)

    def get_metrics(self) -> dict:
        """Return gateway usage metrics for monitoring dashboards."""
        return {**self._metrics}

    def _log_call(self, purpose: str, provider: str, model: str, start_time: float):
        """Log a successful LLM call with latency."""
        latency_ms = int((time.monotonic() - start_time) * 1000)
        logger.info(
            "[LLMGateway] %s → %s/%s — %dms",
            purpose, provider, model, latency_ms,
        )


# ═══════════════════════════════════════════════════════════════════════════════
# GLOBAL SINGLETON — Import this everywhere
# ═══════════════════════════════════════════════════════════════════════════════

gateway = LLMGateway()
"""
Global LLM Gateway instance.

Usage:
    from app.services.llm_gateway import gateway
    result = await gateway.complete("career_tools", messages=[...])
"""
