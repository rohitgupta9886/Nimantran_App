import logging
import sys
import json
import re
from datetime import datetime, timezone
from typing import Dict, Any, Optional

from app.core.context import get_current_context


# Patterns for redacting sensitive fields from logs
SENSITIVE_PATTERNS = [
    (re.compile(r'(?i)("?(?:password|token|secret|jwt|api_key|access_token|refresh_token|smtp_password)"?\s*[:=]\s*)"?([^",\s]+)"?'), r'\1"***REDACTED***"'),
    (re.compile(r'(?i)(bearer\s+)[a-zA-Z0-9_\-\.]+'), r'\1***REDACTED***'),
]


class PrivacyLogFilter(logging.Filter):
    """
    Log filter that scrubs credentials, tokens, passwords, and sensitive tokens from log messages.
    """

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            scrubbed = record.msg
            for pattern, repl in SENSITIVE_PATTERNS:
                scrubbed = pattern.sub(repl, scrubbed)
            record.msg = scrubbed
        return True


class StructuredJsonFormatter(logging.Formatter):
    """
    Structured JSON formatter injecting correlation IDs (request_id, event_id, campaign_id)
    and operational metadata into log records.
    """

    def format(self, record: logging.LogRecord) -> str:
        ctx = get_current_context()
        log_entry: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": ctx.get("request_id", "req_system"),
        }

        if eid := ctx.get("event_id"):
            log_entry["event_id"] = eid
        if cid := ctx.get("campaign_id"):
            log_entry["campaign_id"] = cid
        if mid := ctx.get("message_id"):
            log_entry["message_id"] = mid
        if uid := ctx.get("user_id"):
            log_entry["user_id"] = uid

        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry, default=str)


def setup_logging(structured: bool = True) -> None:
    """
    Initializes root application logging with contextual correlation IDs and privacy filters.
    """
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)

    # Remove existing handlers to avoid duplicates
    for h in list(root_logger.handlers):
        root_logger.removeHandler(h)

    handler = logging.StreamHandler(sys.stdout)
    handler.addFilter(PrivacyLogFilter())

    if structured:
        handler.setFormatter(StructuredJsonFormatter())
    else:
        handler.setFormatter(
            logging.Formatter("%(asctime)s [%(levelname)s] [%(name)s] %(message)s")
        )

    root_logger.addHandler(handler)

    # Silence overly chatty loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


logger = logging.getLogger("nimantran_ai")
