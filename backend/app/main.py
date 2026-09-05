"""Layer 3 — Application factory (HTTP gateway).

Wires every layer in dependency order:
  config → observability → security/rate-limit middleware → routers
  → services → cache → repository → persistence → notifications.

Run:  uvicorn backend.app.main:app --reload --port 8000
"""

from __future__ import annotations

from contextlib import asynccontextmanager

import logging
import sqlite3
import uuid

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from .cache import TTLCache
from .config import get_settings
from .notifications import build_notifier
from .observability import (
    RequestObservabilityMiddleware,
    attach_json_logging,
    metrics,
    setup_logging,
)
from .repository import SQLiteRepository
from .routers import contact as contact_router
from .routers import content as content_router
from .seed import seed_database
from .security import RateLimitMiddleware, RequestSizeLimitMiddleware, SecurityHeadersMiddleware
from .services import ContactService, ContentService


def create_app() -> FastAPI:
    settings = get_settings()
    setup_logging(settings.log_level)
    attach_json_logging()

    repo = SQLiteRepository(settings.database_path)
    cache = TTLCache(ttl=settings.cache_ttl)
    notifier = build_notifier(settings)

    contact_service = ContactService(repo, notifier)
    content_service = ContentService(repo, cache)

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        # Upserts keep backend content aligned with the deployed frontend even
        # when an existing database survives a release.
        seed_database(repo)
        repo.prune_contacts(settings.contact_retention_days)
        yield

    app = FastAPI(
        title="Papi Raborife Portfolio API",
        version=settings.version,
        description="Python backend for the Papi Raborife portfolio SPA.",
        lifespan=lifespan,
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        openapi_url="/openapi.json" if settings.debug else None,
    )

    # Middleware order matters: observability outermost, then headers,
    # then rate limiting closest to the routes.
    app.add_middleware(RequestObservabilityMiddleware)
    app.add_middleware(SecurityHeadersMiddleware, enforce_https=settings.enforce_https)
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=list(settings.allowed_hosts))
    app.add_middleware(RequestSizeLimitMiddleware, max_bytes=settings.max_request_bytes)
    app.add_middleware(RateLimitMiddleware, limit=settings.rate_limit_requests, window=settings.rate_limit_window)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.allowed_origins),
        allow_credentials=False,
        allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "X-Idempotency-Key", "X-Request-ID"],
    )

    app.include_router(content_router.build_router(content_service, settings))
    app.include_router(contact_router.build_router(contact_service, settings))

    @app.exception_handler(sqlite3.Error)
    async def persistence_error(request: Request, exc: sqlite3.Error) -> JSONResponse:
        request_id = getattr(request.state, "request_id", uuid.uuid4().hex[:12])
        logging.getLogger("errors").exception(
            "persistence failure",
            extra={"request_id": request_id, "path": request.url.path},
        )
        return JSONResponse(
            status_code=503,
            content={
                "detail": "The enquiry store is temporarily unavailable. Your form has not been cleared; retry or use email.",
                "request_id": request_id,
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_error(request: Request, exc: Exception) -> JSONResponse:
        request_id = getattr(request.state, "request_id", uuid.uuid4().hex[:12])
        logging.getLogger("errors").exception(
            "unhandled request failure",
            extra={"request_id": request_id, "path": request.url.path},
        )
        return JSONResponse(
            status_code=500,
            content={
                "detail": "The studio API could not complete this request. Retry or use the direct email fallback.",
                "request_id": request_id,
            },
        )

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
