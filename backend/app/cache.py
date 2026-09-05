"""Layer 11 — In-memory TTL cache (thread-safe)."""

from __future__ import annotations

import time
from threading import Lock
from typing import Any

from .observability import metrics


class TTLCache:
    def __init__(self, ttl: int = 300) -> None:
        self.ttl = ttl
        self._lock = Lock()
        self._store: dict[str, tuple[float, Any]] = {}

    def get(self, key: str) -> Any:
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                metrics.inc("cache_misses_total")
                return None
            expires_at, value = entry
            if time.time() > expires_at:
                del self._store[key]
                metrics.inc("cache_misses_total")
                return None
            metrics.inc("cache_hits_total")
            return value

    def set(self, key: str, value: Any) -> None:
        with self._lock:
            self._store[key] = (time.time() + self.ttl, value)

    def invalidate(self, key: str) -> None:
        with self._lock:
            self._store.pop(key, None)

    def clear(self) -> None:
        with self._lock:
            self._store.clear()
