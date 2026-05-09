"""Handler /grafico — Gráfico de gastos del mes como imagen PNG."""

from telegram import Update
from telegram.ext import ContextTypes
from api_client import api_get_bytes
import httpx
from datetime import datetime


async def chart_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    tg_id = update.effective_user.id
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="upload_photo")

    now = datetime.now()
    params = {"month": now.month, "year": now.year}

    try:
        png_bytes = await api_get_bytes(f"/bot/chart/{tg_id}", params=params)

        await update.message.reply_photo(
            photo=png_bytes,
            caption=(
                f"📊 *Gastos de {_month_name(now.month)} {now.year}*\n"
                "_Gráfico generado en tiempo real_"
            ),
            parse_mode="Markdown",
        )

    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            await update.message.reply_text(
                "🔗 Cuenta no vinculada. Escribe /start para vincularla."
            )
        else:
            await update.message.reply_text("⚠️ Error generando el gráfico.")
    except Exception:
        await update.message.reply_text("⚠️ No pude generar el gráfico. Intenta más tarde.")


def _month_name(month: int) -> str:
    months = [
        "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ]
    return months[month] if 1 <= month <= 12 else "?"
