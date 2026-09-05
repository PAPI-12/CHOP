"""Layer 3 — Content + meta endpoints (projects, resume, health, metrics)."""

from __future__ import annotations

import secrets

from fastapi import APIRouter, Header, HTTPException

from ..config import Settings
from ..observability import metrics
from ..schemas import HealthOut, ProjectOut, ResumeOut
from ..services import ContentService

def build_router(service: ContentService, settings: Settings) -> APIRouter:
    router = APIRouter(tags=["content"])

    @router.get("/health", response_model=HealthOut)
    def health() -> HealthOut:
        if not service.repo.ping():
            raise HTTPException(status_code=503, detail="Persistence is unavailable.")
        return HealthOut(status="ok", service=settings.app_name, version=settings.version)

    @router.get("/metrics")
    def get_metrics(authorization: str | None = Header(default=None)) -> dict:
        expected = f"Bearer {settings.admin_token}"
        if (
            not settings.admin_token
            or authorization is None
            or not secrets.compare_digest(authorization, expected)
        ):
            raise HTTPException(status_code=403, detail="Admin token required.")
        return metrics.snapshot()

    @router.get("/api/projects", response_model=list[ProjectOut])
    def projects() -> list[ProjectOut]:
        return [
            ProjectOut(
                id=p.id, title=p.title, subtitle=p.subtitle, category=p.category,
                year=p.year, tags=p.tags, link=p.link, featured=p.featured,
            )
            for p in service.projects()
        ]

    @router.get("/api/resume", response_model=ResumeOut | None)
    def resume() -> ResumeOut | None:
        data = service.resume()
        return ResumeOut(**data) if data else None

    return router
