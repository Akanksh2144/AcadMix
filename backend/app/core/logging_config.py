"""
Structured JSON logging for production environments.

Outputs each log record as a single JSON line for easy ingestion by
ELK, Loki, CloudWatch, or any structured log consumer.

Usage:
    from app.core.logging_config import setup_logging
    setup_logging("INFO")  # call once at startup
"""
import logging
import json
import sys
from datetime import datetime, timezone


class JSONFormatter(logging.Formatter):
    """Format log records as single-line JSON for structured log aggregation."""

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
        # Attach extra context if available (request_id, tenant, etc.)
        for key in ("request_id", "tenant_id", "user_id"):
            if hasattr(record, key):
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
