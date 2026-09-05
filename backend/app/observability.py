"""Layer 13 — Observability.

Structured JSON logging, per-request IDs with timing, and a lightweight
in-process metrics counter exposed at /metrics. Zero external deps.
"""

from __future__ import annotations

import json
import logging
import time
import uuid
from threading import Lock
from typing import Any

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


def setup_logging(level: str) -> None:
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="%(message)s",
    )


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        for key in ("request_id", "method", "path", "status", "duration_ms"):
            value = getattr(record, key, None)
            if value is not None:
                payload[key] = value
        return json.dumps(payload)


def attach_json_logging() -> None:
    for handler in logging.getLogger().handlers:
        handler.setFormatter(JsonFormatter())


class Metrics:
    """Thread-safe counter store — deliberately tiny, Prometheus-shape-ready."""

    def __init__(self) -> None:
        self._lock = Lock()
        self._counters: dict[str, int] = {
            "http_requests_total": 0,
            "http_4xx_total": 0,
            "http_5xx_total": 0,
            "contacts_submitted_total": 0,
            "contacts_duplicate_total": 0,
            "notifications_failed_total": 0,
            "cache_hits_total": 0,
            "cache_misses_total": 0,
        }

    def inc(self, name: str, amount: int = 1) -> None:
        with self._lock:
            self._counters[name] = self._counters.get(name, 0) + amount

    def snapshot(self) -> dict[str, int]:
        with self._lock:
            return dict(self._counters)


metrics = Metrics()


class RequestObservabilityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex[:12]
        request.state.request_id = request_id
        start = time.perf_counter()
        response: Response | None = None
        try:
            response = await call_next(request)
            response.headers["X-Request-ID"] = request_id
            return response
        finally:
            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            status = response.status_code if response is not None else 500
            metrics.inc("http_requests_total")
            if 400 <= status < 500:
                metrics.inc("http_4xx_total")
            if status >= 500:
                metrics.inc("http_5xx_total")
            logging.getLogger("http").info(
                "request",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status": status,
                    "duration_ms": duration_ms,
                },
            )
