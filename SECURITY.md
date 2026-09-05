# Security, Privacy & Business-Risk Runbook

## Launch blockers (owner actions)

1. **Set strong secrets.** Generate `ADMIN_TOKEN` with at least 32 random bytes. Never commit `.env`.
2. **Set exact origins and hosts.** Replace localhost values in `ALLOWED_ORIGINS` and `ALLOWED_HOSTS` with production domains. Do not use `*` in production.
3. **Configure notification delivery.** Set `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `NOTIFY_TO`. Without SMTP, leads remain durable in SQLite but no email alert is sent; monitor `notifications_failed_total` and the admin inbox.
4. **Schedule backups.** Run `python backend/backup.py` daily and copy backups off-host. A Docker volume is persistence, not a backup.
5. **Use HTTPS only.** Terminate TLS at the host/reverse proxy. Redirect HTTP to HTTPS and enable HSTS there after confirming every subdomain supports HTTPS.
6. **Replace placeholder/social URLs.** Current Instagram/LinkedIn/Behance links point to platform homepages. Add the actual profiles before launch.
7. **Confirm portfolio image rights.** Remote Pexels URLs and generated images must be reviewed for accuracy, client approval, trademark permissions and portfolio usage rights. Replace placeholders with approved case-study assets.
8. **Review privacy wording with local counsel.** The included notice is an operational baseline, not jurisdiction-specific legal advice (POPIA/GDPR/other rules may apply).
9. **Keep CI green.** Do not deploy if frontend build, HTTP tests, self-test, Ruff, npm audit, pip-audit, or container build fails.

## Incident response

- **Suspected data exposure:** take the API offline, preserve logs, rotate `ADMIN_TOKEN` and SMTP credentials, snapshot the database, identify affected records, obtain legal advice on notification deadlines.
- **Lost leads / email outage:** leads remain in SQLite. Check `GET /api/contacts` with the admin token, then restore SMTP. Do not expose that endpoint publicly without TLS.
- **Spam/cost spike:** lower `RATE_LIMIT_REQUESTS`, inspect request metrics, block at the CDN/WAF. In multi-worker or multi-instance deployments replace the in-memory limiter with Redis/CDN rate limiting.
- **Database corruption:** stop writers, restore the latest verified backup, run `PRAGMA integrity_check`, then restart. Never copy a live `.db` file directly; use `backend/backup.py`.

## Data handling

- Contact form data: name, email, project type, message, consent and timestamp.
- Default retention: 365 days; old records are pruned at app startup.
- Deletion: admin `DELETE /api/contacts/{id}` after identity verification.
- No analytics/ad cookies are installed in this build.
- Logs intentionally exclude contact content and email addresses.

## Residual architectural limits

- SQLite is suitable for a single small portfolio service. For multiple app instances, migrate persistence to managed PostgreSQL and rate limiting/cache to Redis.
- Metrics are process-local and reset on restart. Export them to your monitoring platform for durable alerting.
- Static mode opens an email draft; the browser cannot prove the user pressed Send. The UI says exactly that and never claims the enquiry was stored.
- A successful frontend build does not certify Python dependencies or supply-chain safety. The Python self-test, HTTP tests, Ruff, pip-audit and npm audit are mandatory release gates in `.github/workflows/ci.yml`.