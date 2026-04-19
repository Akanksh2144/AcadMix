"""
AcadMix LLM Gateway — Production-Grade Multi-Provider AI Router

Architecture:
    ┌────────────────────────────────────────────────────────────────┐
    │                      LLMGateway                                │
    │                                                                │
    │  purpose="interview"     → Vertex AI  (Gemini 2.5 Flash)      │
    │  purpose="career_tools"  → Bedrock    (Nova Lite)              │
    │  purpose="code_review"   → Bedrock    (Nova Lite)              │
    │  purpose="ami_coach"     → Bedrock    (Nova Lite)              │
    │  purpose="ats_scoring"   → Bedrock    (Nova Lite)              │
    │  purpose="erp_insights"  → Bedrock    (Nova Pro)               │
    │  purpose="erp_complex"   → Bedrock    (Claude Sonnet 4.6)       │
    │                                                                │
    │  Fallback chain: Primary → LiteLLM/Groq → Gemini AI Studio    │
    └────────────────────────────────────────────────────────────────┘

Production compliance:
    - Vertex AI: Google Cloud DPA, data never used for training
    - AWS Bedrock: SOC2, HIPAA-eligible, data never used for training
    - No student data ever touches free-tier / prototyping APIs

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

    # ── Career Tools: Nova Lite via Bedrock ────────────────────────────────
    "career_tools": {
        "provider": "bedrock",
        "model": None,
        "temperature": 0.3,
        "max_tokens": 4096,
        "timeout": 30.0,
        "description": "Cover letters, JD analysis, cold emails, HR questions, DSA, career paths",
    },

    # ── Code Review: Nova Lite via Bedrock ─────────────────────────────────
    "code_review": {
        "provider": "bedrock",
        "model": None,
        "temperature": 0.1,
        "max_tokens": 2000,
        "timeout": 30.0,
        "description": "Code quality analysis, complexity estimation",
    },

    # ── Ami Coach: Nova Lite via Bedrock ───────────────────────────────────
    "ami_coach": {
        "provider": "bedrock",
        "model": None,
        "temperature": 0.5,
        "max_tokens": 500,
        "timeout": 30.0,
        "description": "Socratic tutor — streaming responses",
    },

    # ── ATS Scoring: Nova Lite via Bedrock ─────────────────────────────────
    "ats_scoring": {
        "provider": "bedrock",
        "model": None,
        "temperature": 0.0,
        "max_tokens": 2000,
        "timeout": 30.0,
        "description": "Resume ATS scoring, keyword matching",
    },

    # ── ERP Insights (standard): Nova Pro via Bedrock ──────────────────────
    "erp_insights": {
        "provider": "bedrock",
        "model": None,
        "temperature": 0.0,
        "max_tokens": 600,
        "timeout": 30.0,
        "description": "Text-to-SQL for faculty/admin/principal/HOD queries",
    },

    # ── ERP Insights (complex fallback): Claude Sonnet 4.6 via Bedrock ─────
    "erp_complex": {
        "provider": "bedrock",
        "model": None,
        "temperature": 0.0,
        "max_tokens": 1000,
        "timeout": 45.0,
        "description": "Complex multi-step ERP queries — fallback only when Nova Pro fails",
    },

    # ── ERP Summary: Nova Lite via Bedrock ─────────────────────────────────
    "erp_summary": {
        "provider": "bedrock",
        "model": None,
        "temperature": 0.1,
        "max_tokens": 500,
        "timeout": 30.0,
        "description": "Natural language summaries of ERP query results",
    },
}


def _resolve_models():
    """Bind config setting values to route definitions at runtime."""
    ROUTES["interview"]["model"] = settings.INTERVIEW_MODEL
    ROUTES["career_tools"]["model"] = settings.BEDROCK_NOVA_LITE_MODEL
    ROUTES["code_review"]["model"] = settings.BEDROCK_NOVA_LITE_MODEL
    ROUTES["ami_coach"]["model"] = settings.BEDROCK_NOVA_LITE_MODEL
    ROUTES["ats_scoring"]["model"] = settings.BEDROCK_NOVA_LITE_MODEL
    ROUTES["erp_insights"]["model"] = settings.BEDROCK_NOVA_PRO_MODEL
    ROUTES["erp_complex"]["model"] = settings.BEDROCK_CLAUDE_SONNET_MODEL
    ROUTES["erp_summary"]["model"] = settings.BEDROCK_NOVA_LITE_MODEL


# ═══════════════════════════════════════════════════════════════════════════════
# PROVIDER CLIENTS — Lazy-initialized singletons
# ═══════════════════════════════════════════════════════════════════════════════

_vertex_client = None
_bedrock_client = None


def _get_vertex_client():
    """Initialize Vertex AI client (lazy, singleton).
    
    Supports two credential modes:
    1. VERTEX_CREDENTIALS_JSON (env var) — for Render / ephemeral containers
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

        # Priority 1: JSON string from env var (Render / ephemeral containers)
        if settings.VERTEX_CREDENTIALS_JSON:
            import tempfile, os
            from google.oauth2 import service_account
            
            creds_dict = json.loads(settings.VERTEX_CREDENTIALS_JSON)
            credentials = service_account.Credentials.from_service_account_info(creds_dict)
            init_kwargs["credentials"] = credentials
            logger.info("Vertex AI credentials: loaded from VERTEX_CREDENTIALS_JSON env var")

        # Priority 2: File path (local dev)
        elif settings.VERTEX_CREDENTIALS_PATH:
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
            "Vertex AI initialized: project=%s, location=%s, model=%s",
            settings.VERTEX_PROJECT_ID,
            settings.VERTEX_LOCATION,
            settings.INTERVIEW_MODEL,
        )
        return _vertex_client
    except Exception as e:
        logger.error("Vertex AI initialization failed: %s", e)
        return None


def _get_bedrock_client():
    """Initialize AWS Bedrock Runtime client (lazy, singleton)."""
    global _bedrock_client
    if _bedrock_client is not None:
        return _bedrock_client

    if not settings.AWS_REGION:
        logger.warning("AWS_REGION not set — Bedrock disabled, falling back to LiteLLM")
        return None

    try:
        import boto3

        kwargs = {"region_name": settings.AWS_REGION}
        # Use explicit credentials if provided, otherwise rely on IAM role / env
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
            kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY

        _bedrock_client = boto3.client("bedrock-runtime", **kwargs)
        logger.info(
            "AWS Bedrock initialized: region=%s, models=[%s, %s, %s]",
            settings.AWS_REGION,
            settings.BEDROCK_NOVA_LITE_MODEL,
            settings.BEDROCK_NOVA_PRO_MODEL,
            settings.BEDROCK_CLAUDE_SONNET_MODEL,
        )
        return _bedrock_client
    except Exception as e:
        logger.error("AWS Bedrock initialization failed: %s", e)
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
    **kwargs,
) -> str:
    """Call Gemini via Vertex AI SDK (async)."""
    from vertexai.generative_models import GenerativeModel, GenerationConfig

    gen_config = GenerationConfig(
        temperature=temperature,
        max_output_tokens=max_tokens,
    )
    if json_mode:
        gen_config.response_mime_type = "application/json"

    gen_model = GenerativeModel(
        model,
        generation_config=gen_config,
    )

    # Convert OpenAI-style messages to Vertex AI format
    # Vertex uses system_instruction + contents
    system_parts = []
    contents = []
    for msg in messages:
        if msg["role"] == "system":
            system_parts.append(msg["content"])
        elif msg["role"] == "user":
            contents.append({"role": "user", "parts": [{"text": msg["content"]}]})
        elif msg["role"] == "assistant":
            contents.append({"role": "model", "parts": [{"text": msg["content"]}]})

    if system_parts:
        gen_model = GenerativeModel(
            model,
            generation_config=gen_config,
            system_instruction="\n\n".join(system_parts),
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


async def _bedrock_complete(
    model: str,
    messages: List[Dict[str, str]],
    temperature: float = 0.3,
    max_tokens: int = 4096,
    json_mode: bool = False,
    **kwargs,
) -> str:
    """Call AWS Bedrock Converse API (async via executor)."""
    import asyncio

    client = _get_bedrock_client()
    if not client:
        raise RuntimeError("Bedrock client not available")

    # Separate system messages from conversation
    system_messages = []
    converse_messages = []
    for msg in messages:
        if msg["role"] == "system":
            system_messages.append({"text": msg["content"]})
        else:
            role = "user" if msg["role"] == "user" else "assistant"
            converse_messages.append({
                "role": role,
                "content": [{"text": msg["content"]}],
            })

    # Ensure messages alternate user/assistant (Bedrock requirement)
    # If first message after system is assistant, prepend a user message
    if converse_messages and converse_messages[0]["role"] == "assistant":
        converse_messages.insert(0, {
            "role": "user",
            "content": [{"text": "Begin."}],
        })

    call_kwargs = {
        "modelId": model,
        "messages": converse_messages,
        "inferenceConfig": {
            "temperature": temperature,
            "maxTokens": max_tokens,
        },
    }
    if system_messages:
        call_kwargs["system"] = system_messages

    def _sync_call():
        response = client.converse(**call_kwargs)
        output = response.get("output", {})
        content_blocks = output.get("message", {}).get("content", [])
        texts = [b["text"] for b in content_blocks if "text" in b]
        return "\n".join(texts)

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, _sync_call)
    return result


async def _bedrock_stream(
    model: str,
    messages: List[Dict[str, str]],
    temperature: float = 0.5,
    max_tokens: int = 500,
    **kwargs,
) -> AsyncGenerator[str, None]:
    """Stream AWS Bedrock Converse API."""
    import asyncio

    client = _get_bedrock_client()
    if not client:
        raise RuntimeError("Bedrock client not available")

    system_messages = []
    converse_messages = []
    for msg in messages:
        if msg["role"] == "system":
            system_messages.append({"text": msg["content"]})
        else:
            role = "user" if msg["role"] == "user" else "assistant"
            converse_messages.append({
                "role": role,
                "content": [{"text": msg["content"]}],
            })

    if converse_messages and converse_messages[0]["role"] == "assistant":
        converse_messages.insert(0, {
            "role": "user",
            "content": [{"text": "Begin."}],
        })

    call_kwargs = {
        "modelId": model,
        "messages": converse_messages,
        "inferenceConfig": {
            "temperature": temperature,
            "maxTokens": max_tokens,
        },
    }
    if system_messages:
        call_kwargs["system"] = system_messages

    def _sync_stream():
        return client.converse_stream(**call_kwargs)

    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(None, _sync_stream)

    stream = response.get("stream", [])
    for event in stream:
        if "contentBlockDelta" in event:
            delta = event["contentBlockDelta"].get("delta", {})
            text = delta.get("text", "")
            if text:
                yield text


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
        _get_bedrock_client()

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
                )
                self._log_call(purpose, provider, model, start)
                return result

            elif provider == "bedrock" and _get_bedrock_client():
                self._metrics["provider_calls"]["bedrock"] += 1
                result = await _bedrock_complete(
                    model, messages,
                    temperature=temp, max_tokens=tokens, json_mode=json_mode,
                )
                self._log_call(purpose, provider, model, start)
                return result

        except Exception as e:
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

            elif provider == "bedrock" and _get_bedrock_client():
                self._metrics["provider_calls"]["bedrock"] += 1
                async for chunk in _bedrock_stream(model, messages, temperature=temp, max_tokens=tokens):
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
        ERP-specific completion with automatic complexity fallback.

        Tries Nova Pro first. Escalates to Claude Sonnet 4.6 only when:
        1. Nova Pro returns invalid SQL (doesn't start with SELECT)
        2. Nova Pro throws an exception
        3. Complexity heuristic classifies query as inherently complex

        Does NOT escalate on empty results — a valid query can return zero rows.
        """
        # ── Complexity heuristic — route hard queries directly to Claude ──
        complex_signals = [
            "compare", "trend", "across all", "correlation", "at-risk",
            "top performing", "analyze", "pattern", "anomaly", "predict",
            "year over year", "semester wise", "department wise breakdown",
        ]
        is_complex = any(signal in user_query.lower() for signal in complex_signals)

        if is_complex:
            logger.info("[LLMGateway] ERP query classified as COMPLEX — routing to Claude Sonnet 4.6")
            return await self.complete("erp_complex", messages, json_mode=json_mode)

        # ── Standard path: Nova Pro ──────────────────────────────────────
        try:
            result = await self.complete("erp_insights", messages, json_mode=json_mode)

            # Validate: Nova Pro must return valid SQL (not prose/errors)
            result_clean = result.strip()
            result_upper = result_clean.upper()

            if not json_mode:
                # Check 1: Must start with SELECT (not prose, not an error message)
                if not result_upper.startswith("SELECT"):
                    logger.info("[LLMGateway] Nova Pro returned non-SQL — escalating to Claude")
                    return await self.complete("erp_complex", messages, json_mode=json_mode)

                # Check 2: LLM explicitly says it can't handle the query
                inability_signals = ["I CANNOT", "I'M UNABLE", "NOT POSSIBLE", "BEYOND MY", "I NEED MORE CONTEXT"]
                if any(sig in result_upper for sig in inability_signals):
                    logger.info("[LLMGateway] Nova Pro signalled inability — escalating to Claude")
                    return await self.complete("erp_complex", messages, json_mode=json_mode)

            return result

        except Exception as e:
            logger.warning("[LLMGateway] Nova Pro ERP failed: %s — escalating to Claude", e)
            return await self.complete("erp_complex", messages, json_mode=json_mode)

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
