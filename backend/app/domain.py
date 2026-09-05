"""Layer 8 — Domain models. Framework-free business objects."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class ContactMessage:
    name: str
    email: str
    project: str
    message: str
    received_at: datetime = field(default_factory=utcnow)
    id: int | None = None
    idempotency_key: str = ""
    consent: bool = False
    created: bool = True
    payload_hash: str = ""


@dataclass
class Project:
    id: str
    title: str
    subtitle: str
    category: str
    year: str
    tags: list[str]
    link: str
    featured: bool = False


@dataclass
class ResumeEntry:
    range: str
    role: str
    company: str
    description: str
