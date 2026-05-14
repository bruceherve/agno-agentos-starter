from agno.agent import Agent

from app.settings import default_model
from db import get_postgres_db

INSTRUCTIONS = """\
You are the starter agent for an Agno AgentOS backend template. Help developers understand the scaffold, explain how to add more agents, and answer clearly and concisely.
"""

starter_agent = Agent(
    id="starter-agent",
    name="Starter Agent",
    model=default_model(),
    db=get_postgres_db(),
    instructions=INSTRUCTIONS,
    enable_agentic_memory=True,
    add_datetime_to_context=True,
    add_history_to_context=True,
    num_history_runs=5,
    markdown=True,
)
