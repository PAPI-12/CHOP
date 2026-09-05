"""Layer 7 — Services / business logic.

Orchestrates repository (9/10), cache (11) and notifications (12).
Endpoints stay thin; all decisions live here.
"""

from __future__ import annotations

import logging
import hashlib

from .cache import TTLCache
from .domain import ContactMessage
from .notifications import Notifier
from .observability import metrics
from .repository import SQLiteRepository

log = logging.getLogger("services")

PROJECTS_CACHE_KEY = "projects"
RESUME_CACHE_KEY = "resume"


class ContactService:
    def __init__(self, repo: SQLiteRepository, notifier: Notifier) -> None:
        self.repo = repo
        self.notifier = notifier

    def submit(
        self,
        name: str,
        email: str,
        project: str,
        message: str,
        idempotency_key: str,
        consent: bool,
    ) -> tuple[ContactMessage, bool, bool]:
        contact = ContactMessage(
            name=name.strip(),
            email=email.strip().lower(),
            project=(project or "").strip(),
            message=(message or "").strip(),
            idempotency_key=idempotency_key,
            consent=consent,
        )
        canonical = "\x1f".join(
            [contact.name, contact.email, contact.project, contact.message, "1" if contact.consent else "0"]
        )
        expected_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
        contact.payload_hash = expected_hash
        saved = self.repo.save_contact(contact)
        duplicate = not saved.created
        if duplicate:
            if saved.payload_hash and saved.payload_hash != expected_hash:
                raise ValueError("Idempotency key was reused with different content.")
            metrics.inc("contacts_duplicate_total")
            return saved, True, False

        notified = self.notifier.dispatch(saved)
        if not notified:
            metrics.inc("notifications_failed_total")
        metrics.inc("contacts_submitted_total")
        log.info("contact stored", extra={"contact_id": saved.id})
        return saved, False, notified


class ContentService:
    def __init__(self, repo: SQLiteRepository, cache: TTLCache) -> None:
        self.repo = repo
        self.cache = cache

    def projects(self):
        cached = self.cache.get(PROJECTS_CACHE_KEY)
        if cached is not None:
            return cached
        data = self.repo.list_projects()
        self.cache.set(PROJECTS_CACHE_KEY, data)
        return data

    def resume(self):
        cached = self.cache.get(RESUME_CACHE_KEY)
        if cached is not None:
            return cached
        data = self.repo.get_resume()
        if data is not None:
            self.cache.set(RESUME_CACHE_KEY, data)
        return data

    def refresh(self) -> None:
        self.cache.invalidate(PROJECTS_CACHE_KEY)
        self.cache.invalidate(RESUME_CACHE_KEY)
