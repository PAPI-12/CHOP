"""Consistent SQLite backup with timestamped retention.

Run daily from cron or your host scheduler:
  python backend/backup.py

Uses SQLite's online backup API, so WAL writes can continue safely.
"""

from __future__ import annotations

import os
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path

SOURCE = Path(os.environ.get("DATABASE_PATH", "backend/data/portfolio.db"))
DEST_DIR = Path(os.environ.get("BACKUP_DIR", "backend/backups"))
KEEP_DAYS = int(os.environ.get("BACKUP_RETENTION_DAYS", "30"))


def main() -> int:
    if not SOURCE.exists():
        print(f"Database does not exist: {SOURCE}")
        return 1

    DEST_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    destination = DEST_DIR / f"portfolio-{stamp}.db"

    with sqlite3.connect(SOURCE) as source, sqlite3.connect(destination) as target:
        source.backup(target)
        result = target.execute("PRAGMA integrity_check").fetchone()
        if not result or result[0] != "ok":
            destination.unlink(missing_ok=True)
            raise RuntimeError("Backup failed integrity_check")
    try:
        destination.chmod(0o600)
    except OSError:
        pass

    cutoff = datetime.now(timezone.utc) - timedelta(days=max(1, KEEP_DAYS))
    for path in DEST_DIR.glob("portfolio-*.db"):
        modified = datetime.fromtimestamp(path.stat().st_mtime, timezone.utc)
        if modified < cutoff:
            path.unlink()

    print(f"Backup created and verified: {destination}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())