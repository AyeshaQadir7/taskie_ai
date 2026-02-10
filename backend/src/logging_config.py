"""
Logging configuration for backend application

Implements structured logging with:
- Request/response tracing via correlation IDs
- Tool call logging for audit trail
- Performance metrics (query time, agent response time)
- Production-ready JSON logging
"""

import logging
import logging.config
import json
import time
from typing import Optional
from datetime import datetime, timezone
import uuid

from src import config

# Logger names for different modules
LOGGER_API = "api"
LOGGER_DATABASE = "database"
LOGGER_AGENT = "agent"
LOGGER_CHAT = "chat"
LOGGER_AUTH = "auth"

# Global request context for correlation IDs
_request_context = {}


def get_request_id() -> str:
    """Get or generate request ID for current request"""
    return _request_context.get("request_id", str(uuid.uuid4()))


def set_request_context(request_id: str, user_id: Optional[str] = None):
    """Set request context for logging"""
    _request_context["request_id"] = request_id
    _request_context["user_id"] = user_id
    _request_context["timestamp"] = datetime.now(timezone.utc).isoformat()


def clear_request_context():
    """Clear request context after request completes"""
    _request_context.clear()


class JSONFormatter(logging.Formatter):
    """Format logs as JSON for structured logging"""

    def format(self, record: logging.LogRecord) -> str:
        log_obj = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": _request_context.get("request_id"),
        }

        # Add user context if available
        if "user_id" in _request_context:
            log_obj["user_id"] = _request_context["user_id"]

        # Add exception info if present
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)

        # Add extra fields
        if hasattr(record, "conversation_id"):
            log_obj["conversation_id"] = record.conversation_id
        if hasattr(record, "message_id"):
            log_obj["message_id"] = record.message_id
        if hasattr(record, "tool_name"):
            log_obj["tool_name"] = record.tool_name
        if hasattr(record, "duration_ms"):
            log_obj["duration_ms"] = record.duration_ms

        return json.dumps(log_obj)


class TextFormatter(logging.Formatter):
    """Format logs as human-readable text for development"""

    def format(self, record: logging.LogRecord) -> str:
        request_id = _request_context.get("request_id", "")
        user_id = _request_context.get("user_id", "")

        prefix = f"[{record.levelname}]"
        if request_id:
            prefix += f" [{request_id}]"
        if user_id:
            prefix += f" [user:{user_id}]"

        msg = f"{prefix} {record.name}: {record.getMessage()}"

        if record.exc_info:
            msg += "\n" + self.formatException(record.exc_info)

        return msg


def configure_logging():
    """Configure logging based on environment settings"""
    import os

    formatter_class = JSONFormatter if config.LOG_FORMAT == "json" else TextFormatter

    # Create logs directory if it doesn't exist
    log_dir = "logs"
    os.makedirs(log_dir, exist_ok=True)

    logging_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "json": {"()": JSONFormatter},
            "text": {"()": TextFormatter},
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": config.LOG_FORMAT,
                "stream": "ext://sys.stdout",
            },
            "file": {
                "class": "logging.handlers.RotatingFileHandler",
                "formatter": config.LOG_FORMAT,
                "filename": os.path.join(log_dir, "app.log"),
                "maxBytes": 10485760,  # 10MB
                "backupCount": 5,
            },
        },
        "loggers": {
            LOGGER_API: {"level": config.LOG_LEVEL, "handlers": ["console", "file"]},
            LOGGER_DATABASE: {"level": config.LOG_LEVEL, "handlers": ["console", "file"]},
            LOGGER_AGENT: {"level": config.LOG_LEVEL, "handlers": ["console", "file"]},
            LOGGER_CHAT: {"level": config.LOG_LEVEL, "handlers": ["console", "file"]},
            LOGGER_AUTH: {"level": config.LOG_LEVEL, "handlers": ["console", "file"]},
        },
        "root": {"level": config.LOG_LEVEL, "handlers": ["console", "file"]},
    }

    logging.config.dictConfig(logging_config)


# Get module-specific loggers
api_logger = logging.getLogger(LOGGER_API)
db_logger = logging.getLogger(LOGGER_DATABASE)
agent_logger = logging.getLogger(LOGGER_AGENT)
chat_logger = logging.getLogger(LOGGER_CHAT)
auth_logger = logging.getLogger(LOGGER_AUTH)


# Utility functions for common logging patterns
def log_agent_execution(
    agent_input: str,
    agent_output: str,
    duration_ms: float,
    conversation_id: str,
    message_id: int,
):
    """Log agent execution with performance metrics"""
    agent_logger.info(
        f"Agent execution completed in {duration_ms}ms",
        extra={
            "conversation_id": conversation_id,
            "message_id": message_id,
            "duration_ms": duration_ms,
        },
    )


def log_tool_call(
    tool_name: str,
    parameters: dict,
    result: dict,
    duration_ms: float,
    message_id: int,
):
    """Log tool call execution for audit trail"""
    if config.ENABLE_TOOL_CALL_LOGGING:
        agent_logger.info(
            f"Tool call: {tool_name}",
            extra={
                "tool_name": tool_name,
                "message_id": message_id,
                "duration_ms": duration_ms,
            },
        )


def log_conversation_created(conversation_id: str, user_id: str):
    """Log conversation creation"""
    chat_logger.info(f"Conversation created: {conversation_id}", extra={})


def log_message_persisted(
    message_id: int,
    conversation_id: str,
    role: str,
    duration_ms: float,
):
    """Log message persistence"""
    chat_logger.debug(
        f"Message {role} persisted to database",
        extra={
            "conversation_id": conversation_id,
            "message_id": message_id,
            "duration_ms": duration_ms,
        },
    )


# Initialize logging on module import
configure_logging()
