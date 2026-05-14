FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PORT=8000

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

# ── Dependencies ──────────────────────────────────────────────────────────────
# Copy lockfile first for layer caching — dependencies only reinstall
# when pyproject.toml or uv.lock change, not on every source change.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

# ── Source ────────────────────────────────────────────────────────────────────
COPY app ./app
COPY agents ./agents
COPY db ./db
RUN uv sync --frozen --no-dev

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
