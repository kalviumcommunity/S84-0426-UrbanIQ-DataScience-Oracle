from pathlib import Path

from pydantic_settings import BaseSettings


BACKEND_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    PROJECT_NAME: str = "Oracle Backend API"
    MONGODB_URL: str
    DATABASE_NAME: str

    class Config:
        env_file = BACKEND_DIR / ".env"

settings = Settings()
