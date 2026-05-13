"""
Bot de Telegram — Entry Point
Modo Webhook sobre $PORT. Las actualizaciones llegan desde Telegram
como tráfico entrante, manteniendo el servicio activo en Render.
"""

import logging
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from telegram.ext import Application, CommandHandler, MessageHandler, filters
from config import TELEGRAM_BOT_TOKEN, BACKEND_URL, BOT_INTERNAL_SECRET
from handlers.start import get_start_conversation_handler
from handlers.expense import handle_expense_text
from handlers.tasa import tasa_command
from handlers.budgets import budgets_command
from handlers.transactions import transactions_command
from handlers.chart import chart_command
from handlers.help import help_command
from scheduler import setup_scheduler

logging.basicConfig(
    format="%(asctime)s | %(levelname)s | %(name)s — %(message)s",
    level=logging.INFO,
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

WEBHOOK_URL = f"https://churupo-bot-wtql.onrender.com/webhook/{TELEGRAM_BOT_TOKEN}"


async def post_init(application: Application) -> None:
    """Configura el scheduler."""
    scheduler = setup_scheduler(application)
    scheduler.start()
    logger.info("Scheduler activo — resúmenes diarios/semanales/mensuales listos")


def main():
    logger.info("Iniciando Bot de Gastos Personales (Webhook)...")

    port = int(os.environ.get("PORT", 8080))

    app = (
        Application.builder()
        .token(TELEGRAM_BOT_TOKEN)
        .post_init(post_init)
        .build()
    )

    app.add_handler(get_start_conversation_handler())
    app.add_handler(CommandHandler("ayuda", help_command))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("tasa", tasa_command))
    app.add_handler(CommandHandler("presupuestos", budgets_command))
    app.add_handler(CommandHandler("ultimos", transactions_command))
    app.add_handler(CommandHandler("grafico", chart_command))
    app.add_handler(
        MessageHandler(filters.TEXT & ~filters.COMMAND, handle_expense_text)
    )

    logger.info(f"Bot activo — webhook en puerto {port}")
    app.run_webhook(
        listen="0.0.0.0",
        port=port,
        url_path=f"webhook/{TELEGRAM_BOT_TOKEN}",
        webhook_url=WEBHOOK_URL,
        secret_token=BOT_INTERNAL_SECRET,
        allowed_updates=["message", "callback_query"],
        drop_pending_updates=True,
    )


if __name__ == "__main__":
    main()