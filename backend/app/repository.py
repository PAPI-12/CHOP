"""Layers 9 & 10 — Repository contracts + SQLite persistence.

Stdlib sqlite3 only: no ORM, no extra deps. One connection per call keeps
it thread-safe under FastAPI's sync endpoint threadpool.
"""

from __future__ import annotations

import os
import sqlite3
from datetime import datetime, timedelta, timezone
from typing import Protocol

from .domain import ContactMessage, Project, ResumeEntry

SCHEMA = """
CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    project TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL DEFAULT '',
    received_at TEXT NOT NULL,
    idempotency_key TEXT NOT NULL DEFAULT '',
    consent INTEGER NOT NULL DEFAULT 0,
    payload_hash TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    category TEXT NOT NULL,
    year TEXT NOT NULL,
    tags TEXT NOT NULL,
    link TEXT NOT NULL,
    featured INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS resume (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
"""


class Repository(Protocol):
    def save_contact(self, contact: ContactMessage) -> ContactMessage: ...
    def list_contacts(self, limit: int = 100, offset: int = 0) -> list[ContactMessage]: ...
    def upsert_project(self, project: Project) -> None: ...
    def list_projects(self) -> list[Project]: ...
    def set_resume(self, payload: dict) -> None: ...
    def get_resume(self) -> dict | None: ...
    def delete_contact(self, contact_id: int) -> bool: ...
    def prune_contacts(self, retention_days: int) -> int: ...


class SQLiteRepository:
    def __init__(self, database_path: str) -> None:
        self.database_path = database_path
        os.makedirs(os.path.dirname(os.path.abspath(database_path)), exist_ok=True)
        with self._connect() as conn:
            conn.executescript(SCHEMA)
            # Safe forward migration for databases created by earlier builds.
            columns = {r["name"] for r in conn.execute("PRAGMA table_info(contacts)").fetchall()}
            if "idempotency_key" not in columns:
                conn.execute("ALTER TABLE contacts ADD COLUMN idempotency_key TEXT NOT NULL DEFAULT ''")
            if "consent" not in columns:
                conn.execute("ALTER TABLE contacts ADD COLUMN consent INTEGER NOT NULL DEFAULT 0")
            if "payload_hash" not in columns:
                conn.execute("ALTER TABLE contacts ADD COLUMN payload_hash TEXT NOT NULL DEFAULT ''")
            conn.execute(
                "CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_idempotency "
                "ON contacts(idempotency_key) WHERE idempotency_key <> ''"
            )
        try:
            os.chmod(self.database_path, 0o600)
        except OSError:
            # Some mounted/cloud filesystems do not expose POSIX permissions.
            pass

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.database_path, timeout=10)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys=ON")
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA synchronous=FULL")
        conn.execute("PRAGMA busy_timeout=10000")
        return conn

    # ---- contacts -----------------------------------------------------
    def save_contact(self, contact: ContactMessage) -> ContactMessage:
        with self._connect() as conn:
            try:
                cursor = conn.execute(
                    """INSERT INTO contacts
                       (name, email, project, message, received_at, idempotency_key, consent, payload_hash)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        contact.name,
                        contact.email,
                        contact.project,
                        contact.message,
                        contact.received_at.isoformat(),
                        contact.idempotency_key,
                        int(contact.consent),
                        contact.payload_hash,
                    ),
                )
                contact.id = cursor.lastrowid
            except sqlite3.IntegrityError:
                if not contact.idempotency_key:
                    raise
                row = conn.execute(
                    "SELECT * FROM contacts WHERE idempotency_key=?",
                    (contact.idempotency_key,),
                ).fetchone()
                if row is None:
                    raise
                contact.id = row["id"]
                contact.created = False
                contact.payload_hash = row["payload_hash"]
        return contact

    def list_contacts(self, limit: int = 100, offset: int = 0) -> list[ContactMessage]:
        safe_limit = min(max(int(limit), 1), 100)
        safe_offset = max(int(offset), 0)
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM contacts ORDER BY id DESC LIMIT ? OFFSET ?",
                (safe_limit, safe_offset),
            ).fetchall()
        return [
            ContactMessage(
                id=r["id"], name=r["name"], email=r["email"], project=r["project"],
                message=r["message"], idempotency_key=r["idempotency_key"], consent=bool(r["consent"]),
                created=False, payload_hash=r["payload_hash"],
            )
            for r in rows
        ]

    def delete_contact(self, contact_id: int) -> bool:
        with self._connect() as conn:
            cursor = conn.execute("DELETE FROM contacts WHERE id=?", (contact_id,))
            return cursor.rowcount > 0

    def prune_contacts(self, retention_days: int) -> int:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=max(1, retention_days))).isoformat()
        with self._connect() as conn:
            cursor = conn.execute("DELETE FROM contacts WHERE received_at < ?", (cutoff,))
            return cursor.rowcount

    def ping(self) -> bool:
        with self._connect() as conn:
            row = conn.execute("SELECT 1 AS ok").fetchone()
        return bool(row and row["ok"] == 1)

    # ---- projects -----------------------------------------------------
    def upsert_project(self, project: Project) -> None:
        with self._connect() as conn:
            conn.execute(
                """INSERT INTO projects (id, title, subtitle, category, year, tags, link, featured)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                   ON CONFLICT(id) DO UPDATE SET
                     title=excluded.title, subtitle=excluded.subtitle, category=excluded.category,
                     year=excluded.year, tags=excluded.tags, link=excluded.link, featured=excluded.featured""",
                (
                    project.id, project.title, project.subtitle, project.category,
                    project.year, ",".join(project.tags), project.link, int(project.featured),
                ),
            )

    def list_projects(self) -> list[Project]:
        with self._connect() as conn:
            rows = conn.execute("SELECT * FROM projects").fetchall()
        return [
            Project(
                id=r["id"], title=r["title"], subtitle=r["subtitle"], category=r["category"],
                year=r["year"], tags=r["tags"].split(",") if r["tags"] else [],
                link=r["link"], featured=bool(r["featured"]),
            )
            for r in rows
        ]

    # ---- resume -------------------------------------------------------
    def set_resume(self, payload: dict) -> None:
        import json
        with self._connect() as conn:
            conn.execute(
                "INSERT INTO resume (key, value) VALUES ('current', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
                (json.dumps(payload),),
            )

    def get_resume(self) -> dict | None:
        import json
        with self._connect() as conn:
            row = conn.execute("SELECT value FROM resume WHERE key='current'").fetchone()
        return json.loads(row["value"]) if row else None
