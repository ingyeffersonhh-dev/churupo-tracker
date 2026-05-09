"""Handler /presupuestos — Estado de presupuestos del mes actual."""

from telegram import Update
from telegram.ext import ContextTypes
from api_client import api_get
import httpx

STATUS_EMOJI = {"green": "🟢", "yellow": "🟡", "red": "🔴", "none": "⚪"}
STATUS_LABEL = {"green": "OK", "yellow": "Atención", "red": "¡Excedido!", "none": ""}

MONTHS = [
    "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]


async def budgets_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    tg_id = update.effective_user.id
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")

    try:
        data = await api_get(f"/bot/budgets/{tg_id}")
        budgets = data.get("budgets", [])
        month = data.get("month", 1)
        year = data.get("year", 2025)

        if not budgets:
            await update.message.reply_text(
                "📋 *No tienes presupuestos configurados*\n\n"
                "Puedes crear presupuestos por categoría desde la aplicación web.",
                parse_mode="Markdown",
            )
            return

        month_name = MONTHS[month]
        lines = [f"📊 *Presupuestos — {month_name} {year}*\n"]

        for b in budgets:
            emoji = STATUS_EMOJI.get(b["status"], "⚪")
            label = STATUS_LABEL.get(b["status"], "")
            name = b["category_name"]
            spent = b["spent_usd"]
            limit = b["limit_usd"]
            pct = b["percentage"]

            # Barra de progreso visual
            filled = min(int(pct / 10), 10)
            bar = "█" * filled + "░" * (10 - filled)

            lines.append(
                f"{emoji} *{name}* {f'— {label}' if label else ''}\n"
                f"`[{bar}] {pct:.0f}%`\n"
                f"   ${spent:.2f} / ${limit:.2f} USD\n"
            )

        await update.message.reply_text(
            "\n".join(lines),
            parse_mode="Markdown",
        )

    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            await update.message.reply_text(
                "🔗 Cuenta no vinculada. Escribe /start para vincularla."
            )
        else:
            await update.message.reply_text("⚠️ Error consultando presupuestos.")
    except Exception:
        await update.message.reply_text("⚠️ No pude conectar con el servidor.")
