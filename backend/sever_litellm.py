import re

with open("c:\\AcadMix\\backend\\app\\services\\llm_gateway.py", "r", encoding="utf-8") as f:
    text = f.read()

# 1. Remove _litellm_complete and _litellm_stream
pattern_litellm_funcs = r'async def _litellm_complete.*?async def _litellm_stream.*?(?=# ---------------------------------------------------------------------------)'
text = re.sub(pattern_litellm_funcs, '', text, flags=re.DOTALL)

# 2. In complete(), replace the litellm fallback block with native vertex fallback
pattern_complete_fallback = r'        # "?"? Fallback to LiteLLM.*?return result\n        except Exception as e:\n            logger\.error\("\[LLMGateway\] All providers failed'
new_complete_fallback = """        # "?"? Strict Native Vertex Fallback "?"?
        try:
            self._metrics["fallbacks"] += 1
            logger.warning("[LLMGateway] Primary failed. Degrading natively inside Vertex to gemini-2.5-flash")
            result = await _vertex_complete(
                "gemini-2.5-flash", messages,
                temperature=temp, max_tokens=tokens,
                json_mode=json_mode, timeout=tout,
                media_bytes=media_bytes, mime_type=mime_type,
            )
            self._log_call(purpose, "vertex_fallback", "gemini-2.5-flash", start)
            return result
        except Exception as e:
            logger.error("[LLMGateway] All providers failed"""
text = re.sub(pattern_complete_fallback, new_complete_fallback, text, flags=re.DOTALL)

# 3. In stream(), replace litellm fallback with native vertex fallback
pattern_stream_fallback = r'        # "?"? Fallback to LiteLLM.*?yield chunk\n        except Exception as e:\n            logger\.error\("\[LLMGateway\] All stream providers failed'
new_stream_fallback = """        # "?"? Strict Native Vertex Fallback "?"?
        try:
            self._metrics["fallbacks"] += 1
            logger.warning("[LLMGateway] Primary failed. Degrading stream natively inside Vertex to gemini-2.5-flash")
            async for chunk in _vertex_stream("gemini-2.5-flash", messages, temperature=temp, max_tokens=tokens):
                yield chunk
        except Exception as e:
            logger.error("[LLMGateway] All stream providers failed"""
text = re.sub(pattern_stream_fallback, new_stream_fallback, text, flags=re.DOTALL)

with open("c:\\AcadMix\\backend\\app\\services\\llm_gateway.py", "w", encoding="utf-8") as f:
    f.write(text)

print("LiteLLM completely severed.")
