from contextlib import asynccontextmanager
from os import getenv
from pathlib import Path

from agno.os import AgentOS
from agno.os.interfaces.agui import AGUI
from agno.utils.log import log_info

from agents.starter_agent import starter_agent
from agents.registry import get_agents
from db import get_postgres_db

runtime_env = getenv("RUNTIME_ENV", "dev")
scheduler_base_url = getenv("AGENTOS_URL", "http://127.0.0.1:8000")

interfaces: list = [AGUI(agent=starter_agent)]


@asynccontextmanager
async def lifespan(app):  # type: ignore[no-untyped-def]
    log_info("AgentOS lifespan: startup")
    try:
        yield
    finally:
        log_info("AgentOS lifespan: shutdown")


agent_os = AgentOS(
    name="Agno AgentOS Starter",
    tracing=True,
    scheduler=True,
    scheduler_base_url=scheduler_base_url,
    authorization=runtime_env == "prd",
    lifespan=lifespan,
    db=get_postgres_db(),
    agents=get_agents(),
    interfaces=interfaces,
    config=str(Path(__file__).parent / "config.yaml"),
)
app = agent_os.get_app()


if __name__ == "__main__":
    agent_os.serve(app="app.main:app", reload=runtime_env == "dev")
