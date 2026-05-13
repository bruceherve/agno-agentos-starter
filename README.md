# Agno AgentOS Starter

This repository is a clean starter template for building an Agno AgentOS backend that can be connected to the hosted AgentOS UI at `os.agno.com`.

It is adapted from the upstream `agentos-railway-template`:

- https://github.com/agno-agi/agentos-railway-template

This starter keeps the reusable AgentOS backend structure, but strips away the deployment and workflow choices that were specific to that template. In particular, this repo removes Railway provisioning, Docker Compose, eval scaffolding, Claude-specific repo docs and prompts, Slack wiring, and project-specific example agents so the result stays generic and reusable as a public starter.

It keeps the backend generic and reusable:

- FastAPI app exposed through Agno AgentOS.
- PostgreSQL configured via a single `DB_URI`.
- One simple starter agent plus a clean registry pattern for adding more.
- Docker image build support.
- Helm chart skeleton for Kubernetes deployment.

## Repository layout

```text
app/
agents/
db/
charts/agno-agentos-starter/
pyproject.toml
Dockerfile
.dockerignore
README.md
example.env
```

## Install and use

### 0. Install `uv`

If you plan to use the local Python workflow in this repo, install `uv` first:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

This starter includes a committed `uv.lock`, so the expected local setup flow is `uv sync` from the repo root.

If you only plan to build and run the Docker image, `uv` is not required on the host.

### 1. Clone the repository

```bash
git clone <your-repo-url> agno-agentos-starter
cd agno-agentos-starter
```

### 2. Create a `.env` file

Start from the example file:

```bash
cp example.env .env
```

At minimum, set these two values:

- `MODEL_API_KEY` for the model provider configured in code.
- `DB_URI` for your database connection.

Example:

```env
MODEL_API_KEY=your-api-key
DB_URI=postgresql+psycopg://user:password@localhost:5432/agentos
```

The model provider and model ID are configured in code, not in `.env`. The environment file only carries credentials and runtime connection data. In production, the same values should normally come from Kubernetes or your platform secret store rather than a committed env file.

By default, this starter runs with `RUNTIME_ENV=dev`, so AgentOS token-based authorization is disabled for local development. When you switch to `RUNTIME_ENV=prd`, authorization is enabled by default. In that mode, `JWT_VERIFICATION_KEY` must be set or the app will refuse to serve production traffic.

Postgres is the only real infrastructure dependency assumed by this starter because the included knowledge helper uses `pgvector`. Agno supports other storage patterns and backends as well, so if you want to change that layer, check the Agno storage and database documentation before extending `db/session.py`.

If you want a Postgres-compatible alternative to vanilla Postgres, Neon also fits this starter because Agno supports Neon through the same `PostgresDb` path. In practice, that means you can point `DB_URI` at a Neon Postgres connection string and keep the rest of this starter unchanged.

### 3. Run locally with Python

Prerequisites:

- `uv`
- Python 3.12+
- A reachable database for `DB_URI`

Create the local environment and install the locked dependencies:

```bash
uv sync
```

Start the AgentOS backend:

```bash
uv run python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Then connect from the hosted UI:

- Open `https://os.agno.com`
- Add a new OS connection
- Point it at your running backend URL, for example `http://localhost:8000`

### 4. Build and run with Docker

Build the image:

```bash
docker build -t agno-agentos-starter:latest .
```

Run it:

```bash
docker run --rm -p 8000:8000 --env-file .env agno-agentos-starter:latest
```

### 5. Deploy with Helm

The chart in `charts/agno-agentos-starter` supports:

- image repository and tag
- plain env vars
- secrets
- service configuration
- ingress configuration
- resources
- liveness and readiness probes

Example install:

```bash
helm upgrade --install agno-agentos-starter ./charts/agno-agentos-starter \
  --set image.repository=ghcr.io/your-org/agno-agentos-starter \
  --set image.tag=latest
```

## Environment variables

Only the variables used by this starter are documented here. The only required values for basic local use are `MODEL_API_KEY` and `DB_URI`.

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `MODEL_API_KEY` | yes | none | API key for whichever model provider is configured in `app/settings.py`. |
| `DB_URI` | yes | none | SQLAlchemy-style PostgreSQL connection string. |
| `RUNTIME_ENV` | no | `dev` | `dev` disables JWT auth for local development. `prd` enables AgentOS authorization. |
| `AGENTOS_URL` | no | `http://127.0.0.1:8000` | Base URL used by the AgentOS scheduler. |
| `PORT` | no | `8000` | Port for the API server. |
| `JWT_VERIFICATION_KEY` | only in `prd` | none | Public verification key from `os.agno.com`. Required in production when `RUNTIME_ENV=prd`, otherwise the app will refuse to serve traffic. |

## Adding agents

Add a new module under `agents/` and register it in `agents/registry.py`. Then add matching quick prompts under `app/config.yaml` using the agent `id` as the key.

## Starter behavior

- AgentOS is exposed through FastAPI via `app/main.py`.
- The default model choice lives in `app/settings.py`, not in environment variables.
- Scheduler support is enabled.
- Authorization is disabled by default in `dev` and enabled automatically when `RUNTIME_ENV=prd`.
- The starter does not add a custom `/health` route to avoid colliding with AgentOS health handling.
