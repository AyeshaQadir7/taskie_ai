"""
Configuration management for backend application

Handles environment variables and application settings for:
- Database connection (Neon PostgreSQL)
- Authentication (JWT with Better Auth)
- API configuration (CORS, timeouts)
- Chat interface specifics (agent integration, history reconstruction)
"""

import os
from typing import List

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL environment variable is not set. "
        "Example: postgresql://user:password@ep-example.us-east-2.aws.neon.tech/dbname?sslmode=require"
    )

# Authentication Configuration
BETTER_AUTH_SECRET = os.getenv("BETTER_AUTH_SECRET")
if not BETTER_AUTH_SECRET:
    raise ValueError(
        "BETTER_AUTH_SECRET environment variable is not set. "
        "This is required for JWT token verification."
    )

if len(BETTER_AUTH_SECRET) < 32:
    raise ValueError(
        f"BETTER_AUTH_SECRET must be at least 32 characters (current: {len(BETTER_AUTH_SECRET)})"
    )

# CORS Configuration
CORS_ORIGINS: List[str] = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:3001,http://localhost:3002"
).split(",")

# Application Configuration
APP_NAME = os.getenv("APP_NAME", "Chat Interface API")
APP_VERSION = os.getenv("APP_VERSION", "1.0.0")
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

# Chat-specific Configuration
# Agent integration timeout (in seconds)
AGENT_TIMEOUT = int(os.getenv("AGENT_TIMEOUT", "30"))

# Maximum conversation history length for history reconstruction
# Prevents loading entire history for very large conversations
MAX_HISTORY_MESSAGES = int(os.getenv("MAX_HISTORY_MESSAGES", "100"))

# Per-request configuration
REQUEST_ID_HEADER = "X-Request-ID"
AUTHORIZATION_HEADER = "Authorization"

# API Response Configuration
RESPONSE_TIMEOUT = int(os.getenv("RESPONSE_TIMEOUT", "60"))  # seconds

# Logging Configuration
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FORMAT = os.getenv("LOG_FORMAT", "json")  # json or text

# Feature Flags
ENABLE_TOOL_CALL_LOGGING = os.getenv("ENABLE_TOOL_CALL_LOGGING", "true").lower() == "true"
ENABLE_STATELESSNESS_VALIDATION = os.getenv("ENABLE_STATELESSNESS_VALIDATION", "false").lower() == "true"
