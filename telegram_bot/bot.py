"""
Bot de Telegram — Entry Point
Inicia el bot con long polling + APScheduler para resúmenes automáticos.

Uso: python bot.py
"""

import logging
import sys
import os
import threading
import time
from flask import Flask

# Añadir el directorio del bot al path para imports relativos
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

# Configuración de Flask para Render
dummy_app = Flask(__name__)

@dummy_app.route('/')
def health_check():
    return "Bot is alive!", 200

@dummy_app.route('/health')
def health_check_path():
    return {"status": "ok"}, 200

def run_flask():
    # Render asigna el puerto en la variable PORT
    port = int(os.environ.get("PORT", 8080))
    dummy_app.run(host='0.0.0.0', port=port)

logging.basicConfig(
    format="%(asctime)s | %(levelname)s | %(name)s — %(message)s",
    level=logging.INFO,
    handlers=[
        logging.StreamHandler(),
        # logging.FileHandler("bot.log", encoding="utf-8"), # Comentado para Render
    ],
)
logger = logging.getLogger(__name__)


async def post_init(application: Application) -> None:
    """Configura e inicia el scheduler una vez que el loop está corriendo."""
    scheduler = setup_scheduler(application)
    scheduler.start()
    logger.info("✅ Scheduler iniciado")


def run_bot():
    """Crea la aplicación, registra handlers y retorna la app lista."""
    app = Application.builder().token(TELEGRAM_BOT_TOKEN).post_init(post_init).build()

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

    return app


def main():
    logger.info("🤖 Iniciando Bot de Gastos Personales...")

    # Iniciar servidor de salud en segundo plano para Render
    threading.Thread(target=run_flask, daemon=True).start()
    logger.info("✅ Servidor de salud iniciado para Render (Web Service)")

    # ── Loop de reconexión automática ─────────────────────────────────────────
    RETRY_DELAY = 10  # segundos entre reintentos

    while True:
        try:
            app = run_bot()
            logger.info("✅ Bot activo — escuchando mensajes...")
            app.run_polling(
                allowed_updates=["message", "callback_query"],
                drop_pending_updates=True,
            )
        except Exception as e:
            logger.error(f"⚠️ Bot desconectado: {e}. Reintentando en {RETRY_DELAY}s...")
        else:
            logger.warning(f"⚠️ run_polling terminó sin error. Reintentando en {RETRY_DELAY}s...")

        time.sleep(RETRY_DELAY)



if __name__ == "__main__":
    main()
