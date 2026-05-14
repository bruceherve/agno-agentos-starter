# Agno Agentic Platform Starter

A self-hostable, full-stack starter for [Agno AgentOS](https://github.com/agno-agi/agno) — open-source alternative to the gated dashboard at `os.agno.com`.

This template gives you a production-ready AgentOS backend and a fully featured Next.js dashboard UI in a single repository.

> **No Docker required to get started.**
> Two commands get you running locally — `uv run uvicorn ...` for the FastAPI backend and `npm run dev` for the Next.js frontend. Docker and Helm are available when you're ready to ship to production, but they're never required for development or learning.

## What's included

**Backend** — FastAPI + Agno AgentOS (`app/`)

- One starter agent with agentic memory, session history, and tool support
- AG-UI streaming interface for real-time chat
- PostgreSQL + pgvector via a single `DB_URI`
- Tracing, scheduler, and human-in-the-loop approvals enabled by default
- Clean agent registry for adding more agents

**Frontend dashboard** — Next.js 16 + Tailwind CSS (`ui/`)

| Page | What it does |
|---|---|
| Chat | Streaming conversation with the agent via AG-UI/SSE |
| Sessions | Paginated session list, inline history, delete |
| Memory | Agentic memory viewer, topic filter, search, optimize |
| Metrics | Token usage, run counts, date-range charts |
| Workflows | Workflow list, step tree, input schema |
| Approvals | Human-in-the-loop queue, approve/reject with reason |
| Schedules | Schedule list, enable/disable, manual trigger |
| Traces | Execution trace viewer with nested span tree |
| Teams | Agent team cards, click to start a chat |
| Settings | Live config overview — agents, models, feature flags |

## Repository layout

```
app/                          FastAPI + AgentOS entrypoint
agents/                       Agent definitions and registry
db/                           Postgres session and knowledge helpers
ui/                           Next.js dashboard (full frontend)
  app/                        Next.js App Router pages
  components/                 Sidebar, header, shadcn primitives
  lib/api.ts                  Fetch wrapper + AG-UI SSE client
  next.config.ts              /api/* rewrite proxy → backend
charts/agno-agentic-platform-starter/  Helm chart (backend + frontend)
Dockerfile                    Backend Docker image
ui/Dockerfile                 Frontend Docker image
pyproject.toml
example.env
```

## Local development

### Prerequisites

- `uv` (Python package manager)
- Node.js 20+
- A reachable PostgreSQL database (or Neon)
- An API key for your model provider

### 1. Clone

```bash
git clone https://github.com/bruceherve/agno-agentic-platform-starter
cd agno-agentic-platform-starter
```

### 2. Configure the backend

```bash
cp example.env .env
```

Edit `.env` with at minimum:

```env
MODEL_API_KEY=your-api-key
DB_URI=postgresql+psycopg://user:password@localhost:5432/agentos
```

### 3. Run the backend

```bash
uv sync
uv run python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend runs on `http://localhost:8000`. Health check: `GET /health`.

### 4. Run the frontend

```bash
cd ui
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`. All `/api/*` requests are proxied to the backend via Next.js rewrites — no CORS configuration needed.

The frontend reads `API_URL` from `ui/.env.local` (already set to `http://localhost:8000`). This is a server-side variable used by the Next.js rewrite proxy, so it works correctly at runtime without being baked into the client bundle.

## Docker

Two separate images — one per process.

**Backend:**

```bash
docker build -t agno-agentic-platform-starter:latest .
docker run --rm -p 8000:8000 --env-file .env agno-agentic-platform-starter:latest
```

**Frontend:**

```bash
docker build -t agno-agentic-platform-starter-ui:latest ./ui
docker run --rm -p 3000:3000 \
  -e API_URL=http://host.docker.internal:8000 \
  agno-agentic-platform-starter-ui:latest
```

`API_URL` is injected at container runtime (not baked in at build time) because the frontend proxies API calls server-side through Next.js rewrites.

## Kubernetes / Helm

The chart in `charts/agno-agentic-platform-starter` deploys both the backend and frontend as separate Kubernetes Deployments and Services.

```
release-agno-agentic-platform-starter      Deployment  port 8000  FastAPI backend
release-agno-agentic-platform-starter      Service     ClusterIP  Backend
release-agno-agentic-platform-starter-ui   Deployment  port 3000  Next.js frontend
release-agno-agentic-platform-starter-ui   Service     ClusterIP  Frontend
```

### Install

```bash
helm upgrade --install agno ./charts/agno-agentic-platform-starter \
  --set image.repository=ghcr.io/your-org/agno-agentic-platform-starter \
  --set image.tag=latest \
  --set frontend.image.repository=ghcr.io/your-org/agno-agentic-platform-starter-ui \
  --set frontend.image.tag=latest \
  --set frontend.env.API_URL=http://agno-agno-agentic-platform-starter:8000 \
  --set secretEnv.MODEL_API_KEY=your-api-key \
  --set secretEnv.DB_URI=postgresql+psycopg://user:password@db:5432/agentos
```

`frontend.env.API_URL` must point to the backend Service within the cluster. The pattern is `http://<release-name>-agno-agentic-platform-starter:8000`.

### Enable ingress

```bash
# Backend API
--set ingress.enabled=true \
--set ingress.hosts[0].host=api.yourdomain.com \

# Frontend UI
--set frontend.ingress.enabled=true \
--set frontend.ingress.hosts[0].host=app.yourdomain.com
```

### Disable the frontend

```bash
--set frontend.enabled=false
```

This deploys the backend only — useful if you want to connect a different frontend or use the AgentOS API directly.

## Environment variables

### Backend

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `MODEL_API_KEY` | yes | — | API key for the model provider configured in `app/settings.py` |
| `DB_URI` | yes | — | SQLAlchemy PostgreSQL connection string (`postgresql+psycopg://...`) |
| `RUNTIME_ENV` | no | `dev` | `dev` disables JWT auth. `prd` enables AgentOS authorization. |
| `JWT_VERIFICATION_KEY` | prd only | — | Public key from `os.agno.com`. Required when `RUNTIME_ENV=prd`. |
| `PORT` | no | `8000` | API server port. |

### Frontend

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `API_URL` | no | `http://localhost:8000` | Backend URL used by the Next.js rewrite proxy. Set at container runtime. |

## Adding agents

1. Add a new file under `agents/` following the pattern in `agents/starter_agent.py`.
2. Register it in `agents/registry.py`.
3. Restart the backend — the agent appears automatically in the dashboard.

## Model and database

The model provider is configured in `app/settings.py`, not in environment variables. The default is `gpt-4.1-mini` via the OpenAI Responses API. To switch models or providers, edit `default_model()` in that file.

PostgreSQL is the only required infrastructure dependency (used for sessions, memory, and vector knowledge). [Neon](https://neon.tech) works as a drop-in Postgres-compatible alternative — point `DB_URI` at a Neon connection string and everything else stays unchanged.

## Production auth

Set `RUNTIME_ENV=prd` to enable AgentOS JWT authorization. In that mode, `JWT_VERIFICATION_KEY` must be provided. Obtain this key from your `os.agno.com` account or your own JWT infrastructure.
