"""Layer 3 — Contact API endpoints."""

from __future__ import annotations

import re
import secrets

from fastapi import APIRouter, Header, HTTPException, Response

from ..config import Settings
from ..observability import metrics
from ..schemas import ContactIn, ContactOut
from ..services import ContactService

def build_router(service: ContactService, settings: Settings) -> APIRouter:
    router = APIRouter(prefix="/api", tags=["contact"])

    @router.post("/contact", response_model=ContactOut, status_code=201)
    def submit(
        payload: ContactIn,
        response: Response,
        x_idempotency_key: str = Header(..., alias="X-Idempotency-Key"),
    ) -> ContactOut:
        if not re.fullmatch(r"[A-Za-z0-9_-]{16,128}", x_idempotency_key):
            raise HTTPException(status_code=400, detail="Invalid idempotency key.")
        try:
            saved, duplicate, notified = service.submit(
                payload.name,
                str(payload.email),
                payload.project or "",
                payload.message,
                x_idempotency_key,
                payload.consent,
            )
        except ValueError as exc:
            raise HTTPException(status_code=409, detail=str(exc)) from exc
        if duplicate:
            response.status_code = 200
        return ContactOut(
            id=saved.id or 0,
            duplicate=duplicate,
            notification_sent=notified,
            message=(
                "This enquiry was already received; no duplicate was created."
                if duplicate
                else "Thanks — your enquiry was stored securely."
            ),
        )

    @router.get("/contacts")
    def list_contacts(
        response: Response,
        authorization: str | None = Header(default=None),
        limit: int = 50,
        offset: int = 0,
    ):
        """Dev/admin-only inbox. Requires the configured ADMIN_TOKEN."""
        expected = f"Bearer {settings.admin_token}"
        if (
            not settings.admin_token
            or authorization is None
            or not secrets.compare_digest(authorization, expected)
        ):
            raise HTTPException(status_code=403, detail="Admin token required.")
        limit = min(max(limit, 1), 100)
        offset = max(offset, 0)
        response.headers["Cache-Control"] = "no-store, private"
        return [
            {"id": c.id, "name": c.name, "email": c.email, "project": c.project, "message": c.message}
            for c in service.repo.list_contacts(limit=limit, offset=offset)
        ]

    @router.delete("/contacts/{contact_id}", status_code=204)
    def delete_contact(
        contact_id: int,
        authorization: str | None = Header(default=None),
    ) -> Response:
        expected = f"Bearer {settings.admin_token}"
        if (
            not settings.admin_token
            or authorization is None
            or not secrets.compare_digest(authorization, expected)
        ):
            raise HTTPException(status_code=403, detail="Admin token required.")
        if not service.repo.delete_contact(contact_id):
            raise HTTPException(status_code=404, detail="Contact not found.")
        return Response(status_code=204)

    return router
