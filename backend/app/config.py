"""Layer 0 — Configuration.

Environment-driven settings with safe defaults so the stack boots in any
of the three modes: static-only, local Python backend, or containerized.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field


def _env(name: str, default: str) -> str:
    return os.environ.get(name, default)


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


@dataclass(frozen=True)
class Settings:
    app_name: str = "papi-raborife-portfolio"
    version: str = "1.0.0"
    debug: bool = field(default_factory=lambda: _env("DEBUG", "0") == "1")
    enforce_https: bool = field(default_factory=lambda: _env("ENFORCE_HTTPS", "0") == "1")
    log_level: str = field(default_factory=lambda: _env("LOG_LEVEL", "INFO"))

    # Persistence (Layer 10)
    database_path: str = field(default_factory=lambda: _env("DATABASE_PATH", "backend/data/portfolio.db"))

    # Abuse protection (Layer 5)
    rate_limit_requests: int = field(default_factory=lambda: _env_int("RATE_LIMIT_REQUESTS", 30))
    rate_limit_window: int = field(default_factory=lambda: _env_int("RATE_LIMIT_WINDOW", 60))

    # Cache (Layer 11)
    cache_ttl: int = field(default_factory=lambda: _env_int("CACHE_TTL", 300))
    contact_retention_days: int = field(default_factory=lambda: _env_int("CONTACT_RETENTION_DAYS", 365))
    max_request_bytes: int = field(default_factory=lambda: _env_int("MAX_REQUEST_BYTES", 16384))

    # Admin / dev endpoints
    admin_token: str = field(default_factory=lambda: _env("ADMIN_TOKEN", ""))

    # Notification adapter (Layer 12) — empty SMTP host => log adapter
    smtp_host: str = field(default_factory=lambda: _env("SMTP_HOST", ""))
    smtp_port: int = field(default_factory=lambda: _env_int("SMTP_PORT", 587))
    smtp_user: str = field(default_factory=lambda: _env("SMTP_USER", ""))
    smtp_password: str = field(default_factory=lambda: _env("SMTP_PASSWORD", ""))
    notify_to: str = field(default_factory=lambda: _env("NOTIFY_TO", "papiraborife@gmail.com"))

    allowed_origins: tuple[str, ...] = field(
        default_factory=lambda: tuple(
            o.strip()
            for o in _env(
                "ALLOWED_ORIGINS",
                "http://localhost:5173,http://127.0.0.1:5173",
            ).split(",")
            if o.strip()
        )
    )
    allowed_hosts: tuple[str, ...] = field(
        default_factory=lambda: tuple(
            h.strip() for h in _env("ALLOWED_HOSTS", "localhost,127.0.0.1,testserver").split(",") if h.strip()
        )
    )


def get_settings() -> Settings:
    settings = Settings()
    if settings.rate_limit_requests < 1 or settings.rate_limit_window < 1:
        raise ValueError("Rate limit settings must be positive integers.")
    if settings.max_request_bytes < 1024 or settings.max_request_bytes > 1_048_576:
        raise ValueError("MAX_REQUEST_BYTES must be between 1024 and 1048576.")
    if settings.contact_retention_days < 1:
        raise ValueError("CONTACT_RETENTION_DAYS must be positive.")
    if any(origin == "*" for origin in settings.allowed_origins) and not settings.debug:
        raise ValueError("Wildcard CORS is forbidden when DEBUG=0.")
    if any(host == "*" for host in settings.allowed_hosts) and not settings.debug:
        raise ValueError("Wildcard hosts are forbidden when DEBUG=0.")
    if settings.admin_token and len(settings.admin_token) < 32:
        raise ValueError("ADMIN_TOKEN must contain at least 32 characters.")
    return settings
