"""Layers 4 & 5 — Cross-cutting security middleware + rate limiting.

Fixed-window per-IP limiter kept in memory (swap for Redis behind a
load balancer in production). Hardened response headers on every reply.
"""

from __future__ import annotations

import time
from threading import Lock

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, enforce_https: bool = False) -> None:
        super().__init__(app)
        self.enforce_https = enforce_https

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
        response.headers.setdefault("Cross-Origin-Resource-Policy", "same-site")
        response.headers.setdefault("Cache-Control", "no-store" if request.url.path.startswith("/api/contact") else "no-cache")
        if self.enforce_https:
            response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        return response


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """Reject oversized bodies before JSON parsing allocates memory."""

    def __init__(self, app, max_bytes: int) -> None:
        super().__init__(app)
        self.max_bytes = max_bytes

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.method in {"POST", "PUT", "PATCH"}:
            if request.url.path == "/api/contact":
                content_type = request.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
                if content_type != "application/json":
                    return JSONResponse(
                        {"detail": "Contact submissions must use application/json."},
                        status_code=415,
                    )
            raw_length = request.headers.get("Content-Length")
            if raw_length:
                try:
                    if int(raw_length) > self.max_bytes:
                        return JSONResponse({"detail": "Request body is too large."}, status_code=413)
                except ValueError:
                    return JSONResponse({"detail": "Invalid Content-Length header."}, status_code=400)
            # Chunked requests can omit Content-Length. Read the stream with a
            # hard cap and replay the accepted body to downstream handlers.
            chunks: list[bytes] = []
            total = 0
            async for chunk in request.stream():
                total += len(chunk)
                if total > self.max_bytes:
                    return JSONResponse({"detail": "Request body is too large."}, status_code=413)
                chunks.append(chunk)
            request._body = b"".join(chunks)  # Starlette request-body replay
        return await call_next(request)


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit: int, window: int) -> None:
        super().__init__(app)
        self.limit = limit
        self.window = window
        self._lock = Lock()
        self._buckets: dict[str, tuple[float, int]] = {}

    def _client_key(self, request: Request) -> str:
        # Do not trust client-supplied X-Forwarded-For. Configure the ASGI
        # server's trusted proxy support at deployment instead.
        return request.client.host if request.client else "unknown"

    def _allow(self, key: str) -> bool:
        now = time.time()
        with self._lock:
            window_start, count = self._buckets.get(key, (now, 0))
            if now - window_start >= self.window:
                window_start, count = now, 0
            count += 1
            self._buckets[key] = (window_start, count)
            # Opportunistic cleanup of stale buckets.
            if len(self._buckets) > 5000:
                cutoff = now - self.window * 2
                self._buckets = {k: v for k, v in self._buckets.items() if v[0] >= cutoff}
            return count <= self.limit

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.url.path.startswith("/api/") and not self._allow(self._client_key(request)):
            return JSONResponse(
                {"detail": "Too many requests. Slow down and try again shortly."},
                status_code=429,
                headers={"Retry-After": str(self.window)},
            )
        return await call_next(request)
