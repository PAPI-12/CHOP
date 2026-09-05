# Layer 2 — containerized ops for the Python backend.
FROM python:3.13-slim

WORKDIR /srv

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

COPY backend/requirements.txt .
RUN python -m pip install --upgrade pip setuptools wheel \
    && python -m pip install --requirement requirements.txt

COPY backend ./backend

# Drop root privileges; /srv/backend/data is owned by the runtime user.
RUN addgroup --system app && adduser --system --ingroup app app \
    && mkdir -p /srv/backend/data \
    && chown -R app:app /srv/backend
USER app

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
