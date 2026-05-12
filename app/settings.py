from dotenv import load_dotenv
from os import getenv

from agno.models.openai import OpenAIResponses

load_dotenv()


DEFAULT_MODEL_ID = "gpt-4.1-mini"


def default_model() -> OpenAIResponses:
    """Return the default model used by starter agents.

    Keep model selection in code so the starter does not depend on env-driven
    provider or model switching. Replace this factory with the provider you
    want to standardize on for your platform.

    Examples:
    - OpenRouterResponses(id="openai/gpt-oss-20b", api_key=getenv("MODEL_API_KEY"))
    - OllamaResponses(id="gpt-oss:20b")
    """
    return OpenAIResponses(id=DEFAULT_MODEL_ID, api_key=getenv("MODEL_API_KEY"))

