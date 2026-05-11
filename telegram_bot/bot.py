"""
Bot de Telegram — Entry Point
Usa webhooks en vez de long polling para mayor estabilidad en Render.
"""

import logging
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from telegram.ext import Application, CommandHandler, MessageHandler, filters

from config import TELEGRAM_BOT_TOKEN, PUBLIC_URL, BOT_INTERNAL_SECRET
from handlers.start import get_start_conversation_handler
from handlers.expense import handle_expense_text
from handlers.tasa import tasa_command
from handlers.budgets import budgets_command
from handlers.transactions import transactions_command
from handlers.chart import chart_command
from handlers.help import help_command
from scheduler import setup_scheduler
from apscheduler.triggers.interval import IntervalTrigger

logging.basicConfig(
    format="%(asctime)s | %(levelname)s | %(name)s — %(message)s",
    level=logging.INFO,
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger(__name__)


async def verify_webhook(app: Application):
    """Verifica que el webhook de Telegram siga configurado correctamente."""
    webhook_url = f"{PUBLIC_URL.rstrip('/')}/webhook/{TELEGRAM_BOT_TOKEN}"
    try:
        info = await app.bot.get_webhook_info()
        if info.url != webhook_url:
            logger.warning("⚠️ Webhook cambiado, reconfigurando...")
            await app.bot.set_webhook(
                url=webhook_url,
                secret_token=BOT_INTERNAL_SECRET,
                allowed_updates=["message", "callback_query"],
            )
            logger.info("✅ Webhook reconfigurado")
    except Exception as e:
        logger.error(f"⚠️ Error verificando webhook: {e}")


async def post_init(application: Application) -> None:
    scheduler = setup_scheduler(application)
    scheduler.add_job(
        verify_webhook,
        trigger=IntervalTrigger(hours=1),
        args=[application],
        id="webhook_verification",
        name="Webhook Health Check",
    )
    scheduler.start()
    logger.info("✅ Scheduler iniciado")


def main():
    logger.info("🤖 Iniciando Bot de Gastos Personales (Webhook)...")

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

    port = int(os.environ.get("PORT", 8080))

    logger.info("✅ Bot activo — esperando mensajes vía webhook...")
    app.run_webhook(
        listen="0.0.0.0",
        port=port,
        url_path=f"webhook/{TELEGRAM_BOT_TOKEN}",
        webhook_url=f"{PUBLIC_URL.rstrip('/')}/webhook/{TELEGRAM_BOT_TOKEN}",
        secret_token=BOT_INTERNAL_SECRET,
        allowed_updates=["message", "callback_query"],
        drop_pending_updates=True,
    )


if __name__ == "__main__":
    main()
