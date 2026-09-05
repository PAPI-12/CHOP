"""Thin shim so `uvicorn backend.main:app` keeps working."""

from backend.app.main import app  # noqa: F401

__all__ = ["app"]
