"""In-process verification of layers 6–13 without booting a server.

Run:  python backend/selftest.py
Exits 0 when every layer responds correctly.
"""

from __future__ import annotations

import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.cache import TTLCache
from backend.app.config import Settings
from backend.app.domain import ContactMessage
from backend.app.notifications import build_notifier
from backend.app.observability import metrics
from backend.app.repository import SQLiteRepository
from backend.app.seed import seed_database
from backend.app.services import ContactService, ContentService
from backend.app.schemas import ContactIn


def main() -> int:
    checks: list[tuple[str, bool]] = []

    with tempfile.TemporaryDirectory() as tmp:
        db = os.path.join(tmp, "test.db")
        settings = Settings(database_path=db, smtp_host="")

        repo = SQLiteRepository(db)
        checks.append(("L10 persistence: schema created", os.path.exists(db)))

        cache = TTLCache(ttl=60)
        notifier = build_notifier(settings)
        contacts = ContactService(repo, notifier)
        content = ContentService(repo, cache)

        seed_database(repo)
        checks.append(("L10 persistence: seed wrote projects", len(repo.list_projects()) == 7))
        checks.append(("L10 persistence: seed wrote resume", repo.get_resume() is not None))

        # Validation layer
        payload = ContactIn(name="Thabo", email="thabo@studio.co.za", project="UX/UI", message="Brief attached.", consent=True)
        checks.append(("L6 validation: accepts a valid payload", payload.email.endswith("studio.co.za")))
        try:
            ContactIn(name="", email="bad", message="short", consent=False)
            checks.append(("L6 validation: rejects invalid payload", False))
        except Exception:
            checks.append(("L6 validation: rejects invalid payload", True))

        # Service + notification + metrics
        saved, _duplicate, notified = contacts.submit(
            payload.name, str(payload.email), payload.project or "", payload.message,
            "test_idempotency_key_001", payload.consent,
        )
        checks.append(("L7 services: contact round-trip", saved.id is not None and saved.id > 0))
        duplicate_saved, is_duplicate, _ = contacts.submit(
            payload.name, str(payload.email), payload.project or "", payload.message,
            "test_idempotency_key_001", payload.consent,
        )
        checks.append(("L7/L10 idempotency: duplicate suppressed", is_duplicate and duplicate_saved.id == saved.id))
        try:
            contacts.submit(
                payload.name, str(payload.email), payload.project or "", "A changed message body.",
                "test_idempotency_key_001", payload.consent,
            )
            checks.append(("L7/L10 idempotency: changed payload rejected", False))
        except ValueError:
            checks.append(("L7/L10 idempotency: changed payload rejected", True))
        checks.append(("L12 notifications: log adapter reports no external delivery", notified is False))
        checks.append(("L13 observability: contact metric incremented", metrics.snapshot()["contacts_submitted_total"] >= 1))

        # Cache behaviour
        first = content.projects()
        second = content.projects()
        checks.append(("L11 cache: cache-through on projects", first is second))
        checks.append(("L11 cache: hit counted", metrics.snapshot()["cache_hits_total"] >= 1))
        content.refresh()
        third = content.projects()
        checks.append(("L11 cache: invalidate forces reload", third is not second and len(third) == 7))

        resume = content.resume()
        checks.append(("L7/L11 resume served with skills", bool(resume) and len(resume["skills"]) == 8))

    failures = 0
    for label, ok in checks:
        print(f"  [{'PASS' if ok else 'FAIL'}]  {label}")
        failures += 0 if ok else 1

    print(f"\n{len(checks) - failures}/{len(checks)} layers responding correctly.")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
