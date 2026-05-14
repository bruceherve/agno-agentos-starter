# Agno Agentic Platform Starter

A self-hostable agentic platform built on [Agno AgentOS](https://github.com/agno-agi/agno).

This template gives you a production-ready AgentOS backend and a dashboard UI to manage and observe your agents, all in a single repository.

> **Runs locally with just `uv` and `npm`** — one command each for the FastAPI backend and the Next.js frontend. Docker is for those who want to package the platform into containers and deploy it to Kubernetes. It plays no role in local development, and it is not a requirement for running this in production either — a VM with `uv` and `npm` works just as well.

## What's included

**Backend** — FastAPI + Agno AgentOS (`app/`)

- One starter agent with agentic memory, session history, and tool support
- AG-UI streaming interface for real-time chat
- PostgreSQL + pgvector via a single `DB_URI`
- Tracing, scheduler, and human-in-the-loop approvals enabled by default
- Simple agent registry (`agents/registry.py`) — a plain Python list, add an agent and restart

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
- Node.js 24 LTS or later (always use an LTS release — even-numbered versions only)
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

The chart is published to GHCR. You can install directly without cloning the repo:

```bash
helm upgrade --install agno oci://ghcr.io/bruceherve/agno-agentic-platform-starter \
  --version 0.1.0 \
  --set image.repository=ghcr.io/your-org/agno-agentic-platform-starter \
  --set image.tag=latest \
  --set frontend.image.repository=ghcr.io/your-org/agno-agentic-platform-starter-ui \
  --set frontend.image.tag=latest \
  --set frontend.env.API_URL=http://agno-agno-agentos-starter:8000 \
  --set secretEnv.MODEL_API_KEY=your-api-key \
  --set secretEnv.DB_URI=postgresql+psycopg://user:password@db:5432/agentos
```

Or from the local chart if you have cloned the repo:

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

### Gateway API (recommended for production)

The [Kubernetes Gateway API](https://gateway-api.sigs.k8s.io/) is the modern successor to Ingress — GA, supported by all major controllers (NGINX, Cilium, Istio, Envoy, Traefik), and offers finer traffic management. The chart includes a `Gateway` and two `HTTPRoute` objects (one for the backend, one for the frontend) that you can enable instead of Ingress.

Requires Gateway API CRDs installed on your cluster:

```bash
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.2.0/standard-install.yaml
```

Enable via Helm:

```bash
--set gateway.enabled=true \
--set gateway.gatewayClassName=nginx \        # match your controller
--set gateway.backend.hostnames[0]=api.yourdomain.com \
--set gateway.frontend.hostnames[0]=app.yourdomain.com
```

The standard Ingress templates remain in the chart for clusters that have not yet adopted Gateway API.

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

The "registry" is simply `agents/registry.py` — a single function that returns a list of agents:

```python
def get_agents() -> list[Agent]:
    return [starter_agent]
```

AgentOS reads this list at startup and exposes each agent through the API and dashboard. To add a new agent:

1. Create a new file under `agents/` following the pattern in `agents/starter_agent.py`.
2. Import it in `agents/registry.py` and add it to the list.
3. Restart the backend — the agent appears automatically in the dashboard.

## Model and database

The model provider is configured in `app/settings.py`, not in environment variables. The default is `gpt-4.1-mini` via the OpenAI Responses API. To switch models or providers, edit `default_model()` in that file.

PostgreSQL is the only required infrastructure dependency (used for sessions, memory, and vector knowledge). [Neon](https://neon.tech) works as a drop-in Postgres-compatible alternative — point `DB_URI` at a Neon connection string and everything else stays unchanged.

## Production auth

Set `RUNTIME_ENV=prd` to enable AgentOS JWT authorization. In that mode, `JWT_VERIFICATION_KEY` must be provided. This should be the public verification key from your own JWT infrastructure — point it at your own domain and auth setup.
