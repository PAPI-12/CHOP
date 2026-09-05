"""HTTP-level regression tests for money/data/legal failure paths.

Run:
    python -m pip install -r backend/requirements-dev.txt
    pytest -q backend/test_api.py
"""

from __future__ import annotations

import os
import tempfile
from pathlib import Path

# Configure safe values before importing the module-level FastAPI app.
_MODULE_TMP = tempfile.TemporaryDirectory()
os.environ.update(
    {
        "DEBUG": "1",
        "DATABASE_PATH": str(Path(_MODULE_TMP.name) / "module.db"),
        "ADMIN_TOKEN": "test-admin-token-that-is-at-least-32-chars",
        "ALLOWED_ORIGINS": "http://testserver",
        "ALLOWED_HOSTS": "testserver,localhost,127.0.0.1",
        "RATE_LIMIT_REQUESTS": "100",
    }
)

from fastapi.testclient import TestClient

from backend.app.main import create_app


def make_client(tmp_path: Path) -> TestClient:
    os.environ["DATABASE_PATH"] = str(tmp_path / "portfolio.db")
    return TestClient(create_app())


def valid_payload(**changes):
    payload = {
        "name": "Thabo Studio",
        "email": "thabo@example.com",
        "project": "UX/UI",
        "message": "I would like to discuss a new product design engagement.",
        "consent": True,
        "website": "",
    }
    payload.update(changes)
    return payload


def test_health_checks_persistence(tmp_path: Path) -> None:
    with make_client(tmp_path) as client:
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"
        assert response.headers.get("X-Request-ID")


def test_contact_is_stored_and_duplicate_is_suppressed(tmp_path: Path) -> None:
    with make_client(tmp_path) as client:
        headers = {"X-Idempotency-Key": "browser_request_key_000001"}
        first = client.post("/api/contact", json=valid_payload(), headers=headers)
        second = client.post("/api/contact", json=valid_payload(), headers=headers)

        assert first.status_code == 201
        assert first.json()["ok"] is True
        assert first.json()["duplicate"] is False
        assert first.json()["notification_sent"] is False  # log adapter is not external delivery
        assert second.status_code == 200
        assert second.json()["duplicate"] is True
        assert second.json()["id"] == first.json()["id"]


def test_changed_payload_with_same_key_is_rejected(tmp_path: Path) -> None:
    with make_client(tmp_path) as client:
        headers = {"X-Idempotency-Key": "browser_request_key_000002"}
        assert client.post("/api/contact", json=valid_payload(), headers=headers).status_code == 201
        changed = client.post(
            "/api/contact",
            json=valid_payload(message="This is a materially changed project request."),
            headers=headers,
        )
        assert changed.status_code == 409
        assert "different content" in changed.json()["detail"]


def test_validation_consent_and_honeypot(tmp_path: Path) -> None:
    with make_client(tmp_path) as client:
        headers = {"X-Idempotency-Key": "browser_request_key_000003"}
        assert client.post("/api/contact", json=valid_payload(name=""), headers=headers).status_code == 422
        assert client.post("/api/contact", json=valid_payload(consent=False), headers=headers).status_code == 422
        assert client.post("/api/contact", json=valid_payload(website="bot-filled"), headers=headers).status_code == 422
        assert client.post("/api/contact", json=valid_payload(message="short"), headers=headers).status_code == 422


def test_missing_and_malformed_idempotency_key(tmp_path: Path) -> None:
    with make_client(tmp_path) as client:
        assert client.post("/api/contact", json=valid_payload()).status_code == 422
        malformed = client.post(
            "/api/contact",
            json=valid_payload(),
            headers={"X-Idempotency-Key": "tiny"},
        )
        assert malformed.status_code == 400


def test_oversized_body_is_rejected(tmp_path: Path) -> None:
    with make_client(tmp_path) as client:
        response = client.post(
            "/api/contact",
            content=b"x" * 20_000,
            headers={
                "Content-Type": "application/json",
                "X-Idempotency-Key": "browser_request_key_000004",
            },
        )
        assert response.status_code == 413


def test_non_json_contact_is_rejected(tmp_path: Path) -> None:
    with make_client(tmp_path) as client:
        response = client.post(
            "/api/contact",
            content="name=unexpected",
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "X-Idempotency-Key": "browser_request_key_000006",
            },
        )
        assert response.status_code == 415


def test_admin_endpoints_require_token_and_support_deletion(tmp_path: Path) -> None:
    with make_client(tmp_path) as client:
        headers = {"X-Idempotency-Key": "browser_request_key_000005"}
        created = client.post("/api/contact", json=valid_payload(), headers=headers).json()
        contact_id = created["id"]

        assert client.get("/api/contacts").status_code == 403
        auth = {"Authorization": "Bearer test-admin-token-that-is-at-least-32-chars"}
        inbox = client.get("/api/contacts?limit=100&offset=0", headers=auth)
        assert inbox.status_code == 200
        assert inbox.headers["Cache-Control"] == "no-store, private"
        assert any(item["id"] == contact_id for item in inbox.json())

        assert client.delete(f"/api/contacts/{contact_id}", headers=auth).status_code == 204
        assert client.delete(f"/api/contacts/{contact_id}", headers=auth).status_code == 404


def test_metrics_are_private(tmp_path: Path) -> None:
    with make_client(tmp_path) as client:
        assert client.get("/metrics").status_code == 403
        auth = {"Authorization": "Bearer test-admin-token-that-is-at-least-32-chars"}
        assert client.get("/metrics", headers=auth).status_code == 200