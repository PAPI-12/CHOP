# Papi Raborife Portfolio — Python Backend (13-Layer Stack)

The front of the house is a React/Vite single-page app (built to `dist/`).
Everything server-side is **Python**, organized into thirteen layers:

| # | Layer | Where |
|---|-------|-------|
| 1 | Presentation (static SPA) | `src/`, built to `dist/` |
| 2 | Ops & delivery (Docker, compose, env) | `backend/Dockerfile`, `docker-compose.yml`, `.env.example` |
| 3 | HTTP gateway & routers | `backend/app/main.py`, `backend/app/routers/` |
| 4 | Cross-cutting middleware (headers, CORS, request-id) | `backend/app/security.py`, `backend/app/observability.py` |
| 5 | Rate limiting / abuse protection | `backend/app/security.py` |
| 6 | Validation (Pydantic contracts) | `backend/app/schemas.py` |
| 7 | Services / business logic | `backend/app/services.py` |
| 8 | Domain models | `backend/app/domain.py` |
| 9 | Repository contracts + SQLite implementation | `backend/app/repository.py` |
| 10 | Persistence (SQLite, stdlib) | `backend/app/repository.py`, seeded by `backend/app/seed.py` |
| 11 | Cache (thread-safe TTL) | `backend/app/cache.py` |
| 12 | Notification adapters (log / SMTP) | `backend/app/notifications.py` |
| 13 | Observability (JSON logs, request ids, /metrics) | `backend/app/observability.py` |

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
python -m pip install --upgrade pip setuptools wheel
python -m pip install -r backend/requirements-dev.txt
cp .env.example .env            # then edit values
uvicorn backend.main:app --reload --port 8000
```

Endpoints:

- `GET  /health` — liveness
- `GET  /metrics` — in-process counters
- `POST /api/contact` — contact form sink (validated, rate-limited, persisted, notified)
- `GET  /api/projects` — project archive served from SQLite
- `GET  /api/resume` — resume payload served from SQLite
- `GET  /api/contacts` — admin inbox (requires `Authorization: Bearer $ADMIN_TOKEN`)

## Verify the stack without a server

```bash
python backend/selftest.py
pytest -q backend/test_api.py
ruff check backend
pip-audit -r backend/requirements.txt
```

Exercises layers 6–13 in-process and prints a PASS/FAIL line per layer.

## Connect the frontend

Build the SPA with `VITE_API_URL=http://localhost:8000 npm run build`.
The contact form POSTs to `/api/contact` when the variable is present and
falls back to graceful local confirmation when the backend is absent —
so **static-only** and **with-backend** deployments both work cleanly.

## Deploy

```bash
docker compose up -d --build
```

Swap `LogNotifier` for real delivery by setting `SMTP_*` in `.env`; the
adapter is selected automatically at boot.
