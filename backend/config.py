from pydantic import field_validator
from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str
    SUPABASE_ANON_KEY: str
    DATABASE_URL: str = ""
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [s.strip() for s in v.split(",") if s.strip()]
        return v

    # Bot de Telegram
    TELEGRAM_BOT_TOKEN: str = ""
    BOT_INTERNAL_SECRET: str = "changeme-super-secret-key"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
