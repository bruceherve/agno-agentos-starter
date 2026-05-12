from agno.agent import Agent

from agents.starter_agent import starter_agent


def get_agents() -> list[Agent]:
    return [starter_agent]
