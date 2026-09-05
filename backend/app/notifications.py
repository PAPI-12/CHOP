"""Layer 12 — Notification adapters.

Protocol-based: LogNotifier is the zero-config default; SmtpNotifier
activates when SMTP_* env vars are present. Failures never propagate to
the request path — delivery problems are logged, not raised.
"""

from __future__ import annotations

import logging
import smtplib
import ssl
from email.message import EmailMessage
from typing import Protocol

from .config import Settings
from .domain import ContactMessage

log = logging.getLogger("notify")


class Notifier(Protocol):
    def dispatch(self, contact: ContactMessage) -> bool: ...


class LogNotifier:
    """Dev fallback: persists the lead but does not claim external delivery."""

    def dispatch(self, contact: ContactMessage) -> bool:
        log.info("contact notification (log adapter)", extra={"contact_id": contact.id, "to": "studio"})
        return False


class SmtpNotifier:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def dispatch(self, contact: ContactMessage) -> bool:
        try:
            msg = EmailMessage()
            msg["Subject"] = f"[Portfolio] {contact.name} — {contact.project or 'New enquiry'}"
            msg["From"] = self.settings.smtp_user or "portfolio@studio.local"
            msg["To"] = self.settings.notify_to
            msg["Reply-To"] = contact.email
            msg.set_content(
                f"Name: {contact.name}\nEmail: {contact.email}\nProject: {contact.project or '-'}\n\n{contact.message}"
            )
            with smtplib.SMTP(self.settings.smtp_host, self.settings.smtp_port, timeout=5) as server:
                server.starttls(context=ssl.create_default_context())
                if self.settings.smtp_user:
                    server.login(self.settings.smtp_user, self.settings.smtp_password)
                server.send_message(msg)
            log.info("contact notification sent", extra={"contact_id": contact.id})
            return True
        except Exception as exc:  # noqa: BLE001 — never break the request path
            log.warning("smtp delivery failed: %s", exc)
            return False


def build_notifier(settings: Settings) -> Notifier:
    if settings.smtp_host:
        return SmtpNotifier(settings)
    return LogNotifier()
