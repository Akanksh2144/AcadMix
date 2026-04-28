"""
Structured JSON logging for production environments.

Outputs each log record as a single JSON line for easy ingestion by
ELK, Loki, CloudWatch, or any structured log consumer.

Automatically includes request_id, tenant_id, path, and method from
the request_context ContextVar set by RequestIdMiddleware.

Usage:
    from app.core.logging_config import setup_logging
    setup_logging("INFO")  # call once at startup
"""
import logging
import json
import sys
from datetime import datetime, timezone


class JSONFormatter(logging.Formatter):
    """Format log records as single-line JSON for structured log aggregation.

    Automatically reads request context (request_id, tenant_id, path, method)
    from the request_context ContextVar without any caller changes needed.
    """

    def format(self, record):
        log_record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        # Attach exception info if present
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)

        # Attach request context from ContextVar (set by RequestIdMiddleware)
        try:
            from app.core.response import request_context
            ctx = request_context.get()
            if ctx:
                for key in ("request_id", "tenant_id", "path", "method"):
                    if key in ctx and ctx[key]:
                        log_record[key] = ctx[key]
        except Exception:
            pass  # Outside request context (startup, workers) — skip silently

        # Attach extra context if explicitly passed via logger.info("msg", extra={...})
        for key in ("request_id", "tenant_id", "user_id"):
            if hasattr(record, key) and key not in log_record:
                log_record[key] = getattr(record, key)
        return json.dumps(log_record)


def setup_logging(level: str = "INFO"):
    """Configure root logger with structured JSON output.
    
    Call this once during application startup (in main.py lifespan).
    """
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())

    root = logging.getLogger()
    root.setLevel(getattr(logging, level.upper(), logging.INFO))
    root.handlers = [handler]

    # Quiet noisy libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)

