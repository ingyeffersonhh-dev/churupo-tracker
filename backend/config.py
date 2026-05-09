from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str
    SUPABASE_ANON_KEY: str
    DATABASE_URL: str = ""
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]

    # Bot de Telegram
    TELEGRAM_BOT_TOKEN: str = ""
    BOT_INTERNAL_SECRET: str = "changeme-super-secret-key"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
