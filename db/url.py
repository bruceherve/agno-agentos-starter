from os import getenv

from dotenv import load_dotenv

load_dotenv()


def normalize_db_url(db_uri: str) -> str:
    if db_uri.startswith("postgres://"):
        return db_uri.replace("postgres://", "postgresql+psycopg://", 1)
    if db_uri.startswith("postgresql://"):
        return db_uri.replace("postgresql://", "postgresql+psycopg://", 1)
    if db_uri.startswith("postgresql+psycopg2://"):
        return db_uri.replace("postgresql+psycopg2://", "postgresql+psycopg://", 1)
    return db_uri


def build_db_url() -> str:
    db_uri = getenv("DB_URI", "").strip()
    if db_uri:
        return normalize_db_url(db_uri)

    raise RuntimeError(
        "DB_URI environment variable is not set. Set it in your shell or .env file, for example: "
        "postgresql+psycopg://user:password@localhost:5432/agentos"
    )


db_url = build_db_url()
