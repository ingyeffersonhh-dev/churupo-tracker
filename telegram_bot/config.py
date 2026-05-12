from dotenv import load_dotenv
import os

load_dotenv()

TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000")
BOT_INTERNAL_SECRET: str = os.getenv("BOT_INTERNAL_SECRET", "changeme-super-secret-key")
PUBLIC_URL: str = os.getenv("PUBLIC_URL", "")

if not TELEGRAM_BOT_TOKEN:
    raise ValueError("TELEGRAM_BOT_TOKEN no está configurado en .env")

# Headers que el bot usa para autenticarse con la API interna
BOT_HEADERS = {"x-bot-secret": BOT_INTERNAL_SECRET, "Content-Type": "application/json"}