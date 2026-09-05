# Full-Stack Risk Audit — Papi Raborife Portfolio

Date: current build. Priority is business impact: revenue loss, personal-data loss/exposure, legal liability, then availability and polish. Frontend bundle verification was executed in this environment. Python/HTTP tests are implemented but require a Python 3.13 runtime and remain explicit pre-launch commands rather than being falsely marked as executed.

## Executive risk order

### P0 — Must be completed by the owner before public launch

1. **Approved portfolio rights and claims.** Confirm written permission to display every named client, logo/name, campaign description and creative asset. Current remote/placeholder/generated images must be replaced or explicitly approved. Risk: copyright/trademark/confidentiality claims and reputational damage.
2. **Production secrets and domains.** Set a 32+ byte random `ADMIN_TOKEN`; exact `ALLOWED_ORIGINS`; exact `ALLOWED_HOSTS`; HTTPS at the proxy. Empty/default values are intentionally safe but admin tools remain unavailable until configured.
3. **Real lead notification.** Configure SMTP or regularly monitor the authenticated inbox. The Python API durably stores leads even without SMTP, but the default log notifier now correctly reports `notification_sent=false`.
4. **Off-host backups.** Schedule `python backend/backup.py` daily and copy results to separate encrypted storage. A local database and Docker volume are not backups.
5. **Legal review.** Have a South African privacy professional review the POPIA wording, retention period, processor list and client usage rights. The included notice is operational, not legal advice.

### P1 — Material residual risks

- SQLite is single-service storage. Do not run multiple API replicas against one SQLite file; move to managed PostgreSQL before horizontal scaling.
- The in-memory rate limiter is per-process. Keep one worker or enforce rate limits at a CDN/WAF/Redis before scaling.
- PII is not application-level encrypted. Use an encrypted host volume/disk and encrypted off-host backups; restrict database filesystem permissions.
- Google Fonts and remote Pexels images create third-party availability/privacy dependencies. Self-host approved fonts and imagery for the strongest privacy and uptime posture.
- Frontend dependencies reported audit findings during package installation. Run `npm audit --omit=dev` and `npm audit` in CI, review exploitability, and patch before launch; do not blindly use `--force` on production.

## 13-layer audit

| Layer | Highest business risk found | Control now in place | Residual / owner action |
|---|---|---|---|
| 1 Presentation | False lead success; blank screen on unexpected React error; no consent | Static mode opens a populated email draft and says to press Send; API mode only clears after 2xx; ErrorBoundary; required privacy consent; honeypot | Browser cannot prove a mail draft was sent. User must press Send. |
| 2 Ops & delivery | Container failed when `.env` was missing; unbacked volume | Compose defaults; healthcheck; persistent volume; verified backup script | Set secrets, TLS, off-host backup schedule, and deployment monitoring. |
| 3 HTTP gateway | Python app did not boot: security classes were referenced but not imported | Imports fixed; app factory; production docs disabled | Smoke-test deployed `/health` after every release. |
| 4 Middleware | Missing body cap/security response metadata; spoofed proxy IP | Security headers; request ID; CORS allowlist; TrustedHost; chunk-aware 16KB body limit; direct socket IP only | Configure trusted proxy at ASGI/proxy layer, not from arbitrary headers. |
| 5 Abuse controls | Spam could create cost and lead noise | Per-IP limiter, honeypot, body cap, validation, 429/Retry-After | Add CDN/WAF or Redis limiter if using multiple workers/instances. |
| 6 Validation | Empty/hostile/control-character payloads; no consent | Pydantic bounds, EmailStr, control-char rejection, required `consent=true`, zero-length honeypot | Consider allowed project enum if the list becomes contractual. |
| 7 Services | Duplicate retries created records/notifications; changed content could reuse a prior key; notification failure hidden | Race-safe idempotency plus SHA-256 payload fingerprint; 409 on key/content mismatch; duplicate and notification metrics; store-before-notify | Alert on notification failures and review stored inbox. |
| 8 Domain | No consent/idempotency state | Domain now carries consent, idempotency key and create/duplicate state | Add audit actor fields only if an authenticated admin UI is introduced. |
| 9 Repository | Unlimited admin reads; no deletion; inefficient duplicate checks | Parameterized SQL, paginated max 100 reads, delete endpoint, DB-level unique key | Never expose admin bearer tokens to browser code. |
| 10 Persistence | Existing DB migration could fail; lock/corruption/data-loss posture weak | Forward migration reordered; WAL, FULL sync, busy timeout, integrity-checked online backups, retention pruning | Encrypt storage; move to managed PostgreSQL for replicas or higher traffic. |
| 11 Cache | Stale content after deploy | Seed upserts every boot; cache invalidation service; TTL | Process-local only; use Redis for multi-instance consistency. |
| 12 Notifications | Log adapter falsely claimed delivery | Log adapter now returns false; SMTP Reply-To; failure metric; API distinguishes stored from notified | Configure SMTP and alerting before relying on form leads. |
| 13 Observability | Metrics exposed publicly; no request correlation response | Metrics admin-gated; JSON logs exclude PII; `X-Request-ID`; latency/status counters | Export logs/metrics off-host and create alerts; counters reset on restart. |

## Unexpected-user scenarios verified by design

- **Double click / browser retry:** same `X-Idempotency-Key`; DB unique index; duplicate record and notification suppressed.
- **API times out after accepting:** static email fallback preserves a contact route; a later API retry with the same key cannot duplicate the stored lead.
- **API returns validation error:** form remains populated and gives a specific correction message.
- **Rate limited:** form remains populated; user is told to wait or use the visible email address.
- **JavaScript component crashes:** ErrorBoundary renders direct reload/email recovery, not a blank page.
- **Bot fills hidden field:** validation rejects it.
- **Huge/chunked body:** rejected at 16KB before Pydantic processing.
- **Wrong Content-Type:** contact endpoint returns an explicit 415 before parsing.
- **Host-header attack:** rejected by TrustedHost.
- **Spoofed `X-Forwarded-For`:** ignored by app-level limiter.
- **Duplicate concurrent writes:** SQLite unique index resolves the race and marks the second request duplicate.
- **Same key with different content:** payload fingerprint mismatch returns 409; no stale success response is returned.
- **SMTP outage:** lead remains committed; response says stored, notification metric increments failure.
- **Existing old database:** startup migrates missing columns before creating the unique index.
- **Database lock burst:** 10s busy timeout plus WAL; caller receives a server error only after the safe wait, and frontend opens the email fallback.
- **User asks for deletion:** privacy notice gives the route; authenticated admin DELETE endpoint removes the record.

## Verification commands

```bash
# Frontend compile / bundle
npm run build

# Python layers 6–13 (in-process)
python -m venv .venv && source .venv/bin/activate
python -m pip install --upgrade pip setuptools wheel
python -m pip install -r backend/requirements-dev.txt
python backend/selftest.py
pytest -q backend/test_api.py
ruff check backend

# Full API smoke test
uvicorn backend.main:app --port 8000
curl http://localhost:8000/health

# Supply-chain review
npm audit --omit=dev
npm audit
pip install pip-audit && pip-audit -r backend/requirements.txt

# Backup and verify
python backend/backup.py
```

## Option A / Option B outcomes

- **Option A — static frontend only:** contact submit opens a populated `mailto:` draft, preserves the form, and explicitly says the visitor must press Send. No fake “saved” state.
- **Option B — Python API enabled:** contact is validated, rate-limited, idempotently committed to SQLite, optionally emailed, and only then acknowledged. API/network failure opens the populated email fallback without clearing the user’s message.

Neither path emits or relies on the generic phrase “Something went wrong with this response, please try again.” Every failure branch has a concrete recovery action.

## Verification evidence in this environment

- `npm run build`: executed successfully after the final security changes.
- Python 3.13: declared in `.python-version`, `pyproject.toml`, and the container image. This coding sandbox does not expose a Python runner, so Python execution is not falsely claimed.
- `backend/selftest.py`: implemented for layers 6–13 and corrected for the non-delivering log adapter.
- `backend/test_api.py`: implemented for health, persistence, duplicate suppression, changed-payload conflicts, validation, consent, honeypot, malformed keys, body limits, content types, admin auth/deletion, and private metrics.
- `.github/workflows/ci.yml`: enforces build, self-test, API tests, Ruff, npm audit, pip-audit, and container build on every push and pull request.