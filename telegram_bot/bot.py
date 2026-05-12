"""
Bot de Telegram — Entry Point
Usa long polling con reconexión automática + Flask en $PORT para health checks.
Sin webhooks — evita conflictos de puerto y dependencias extra.
"""

import logging
import sys
import os
import threading
import time
from flask import Flask, jsonify

sys.path.insert(0, os.path.dirname(__file__))

from telegram.ext import Application, CommandHandler, MessageHandler, filters
from config import TELEGRAM_BOT_TOKEN
from handlers.start import get_start_conversation_handler
from handlers.expense import handle_expense_text
from handlers.tasa import tasa_command
from handlers.budgets import budgets_command
from handlers.transactions import transactions_command
from handlers.chart import chart_command
from handlers.help import help_command
from scheduler import setup_scheduler

logging.basicConfig(
    format="%(asctime)s | %(levelname)s | %(name)s \u2014 %(message)s",
    level=logging.INFO,
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger(__name__)


# Flask app for health checks \u2014 runs on $PORT so Render sees it as alive
flask_app = Flask(__name__)

@flask_app.route('/')
@flask_app.route('/health')
def health():
    return jsonify({"status": "ok", "service": "telegram-bot", "mode": "polling"}), 200


def run_flask(port: int):
    flask_app.run(host='0.0.0.0', port=port, debug=False)


async def delete_webhook(app: Application):
    """Elimina cualquier webhook previo para que polling funcione."""
    try:
        info = await app.bot.get_webhook_info()
        if info.url:
            logger.info(f"Eliminando webhook existente: {info.url}")
            await app.bot.delete_webhook(drop_pending_updates=True)
            logger.info("Webhook eliminado correctamente")
        else:
            logger.info("No hay webhook que eliminar")
    except Exception as e:
        logger.warning(f"No se pudo verificar/eliminar webhook: {e}")


async def post_init(application: Application) -> None:
    await delete_webhook(application)

    scheduler = setup_scheduler(application)
    scheduler.start()
    logger.info("Scheduler iniciado")


def main():
    logger.info("Iniciando Bot de Gastos Personales (Polling)...")

    port = int(os.environ.get("PORT", 8080))

    # Flask en $PORT para health checks (mantiene Render despierto)
    threading.Thread(target=run_flask, kwargs={'port': port}, daemon=True).start()
    logger.info(f"Servidor de salud iniciado en puerto {port}")

    while True:
        try:
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

            logger.info("Bot activo \u2014 esperando mensajes via polling...")
            app.run_polling(
                allowed_updates=["message", "callback_query"],
                drop_pending_updates=True,
            )

        except Exception as e:
            logger.error(f"Error en bot: {e}. Reconectando en 10 segundos...")
            time.sleep(10)


if __name__ == "__main__":
    main()
