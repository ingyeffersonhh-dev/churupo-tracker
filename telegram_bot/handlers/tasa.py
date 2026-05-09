"""Handler /tasa — Muestra la tasa BCV actual."""

from telegram import Update
from telegram.ext import ContextTypes
from api_client import api_get
import httpx


async def tasa_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")

    try:
        data = await api_get("/bot/tasa")
        rate = data.get("rate")
        source = data.get("source", "")
        date_str = data.get("date", "")

        if rate is None:
            await update.message.reply_text(
                "⚠️ No se pudo obtener la tasa de cambio en este momento.\n"
                "Verifica más tarde o ingresa la tasa manualmente en la app."
            )
            return

        source_label = "🏦 BCV (en vivo)" if source == "bcv_live" else f"📂 BD ({date_str})"

        await update.message.reply_text(
            f"💱 *Tasa de Cambio BCV*\n\n"
            f"🇻🇪 `1 USD = {rate:,.2f} Bs`\n"
            f"📅 Fecha: {date_str}\n"
            f"🔎 Fuente: {source_label}",
            parse_mode="Markdown",
        )

    except httpx.HTTPStatusError:
        await update.message.reply_text("⚠️ Error consultando la tasa. Intenta más tarde.")
    except Exception:
        await update.message.reply_text("⚠️ No pude conectar con el servidor.")
