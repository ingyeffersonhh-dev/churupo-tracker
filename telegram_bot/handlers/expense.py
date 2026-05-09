"""
Handler de texto libre — Detecta y registra gastos en lenguaje natural.
Ejemplo: "Comida 15 USD", "Gasolina 50000 VES"
"""

from telegram import Update
from telegram.ext import ContextTypes
from api_client import api_post
import httpx

# Emojis por moneda
CURRENCY_EMOJI = {"USD": "💵", "VES": "🇻🇪"}

# Emojis de estado de presupuesto
STATUS_EMOJI = {"green": "🟢", "yellow": "🟡", "red": "🔴", "none": ""}


async def handle_expense_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Intenta parsear el mensaje como un gasto."""
    text = update.message.text.strip()
    tg_id = update.effective_user.id

    # Indicador de escritura
    await context.bot.send_chat_action(
        chat_id=update.effective_chat.id, action="typing"
    )

    try:
        result = await api_post("/bot/expense", {
            "telegram_id": tg_id,
            "text": text,
        })

        currency = result["currency"]
        amount = result["amount"]
        usd_eq = result.get("usd_equivalent")
        desc = result["description"]
        cat = result["category_name"]
        cat_type = result.get("category_type", "expense")
        emoji = CURRENCY_EMOJI.get(currency, "💰")

        tipo_str = "Ingreso" if cat_type == "income" else "Gasto"
        
        lines = [
            f"✅ *{tipo_str} registrado*",
            f"",
            f"{emoji} *{amount:,.2f} {currency}* — {desc}",
        ]
        if currency == "VES" and usd_eq:
            lines.append(f"📊 Equivalente: *${usd_eq:.2f} USD*")
        lines.append(f"🏷️ Categoría: {cat}")

        await update.message.reply_text(
            "\n".join(lines),
            parse_mode="Markdown",
        )

    except httpx.HTTPStatusError as e:
        status = e.response.status_code
        if status == 404:
            await update.message.reply_text(
                "🔗 *No tienes una cuenta vinculada.*\n"
                "Escribe /start para vincular tu cuenta de la app.",
                parse_mode="Markdown",
            )
        elif status == 422:
            detail = e.response.json().get("detail", "")
            await update.message.reply_text(
                f"🤔 {detail}\n\n"
                "_Ejemplos válidos:_\n"
                "• `Comida 15 USD` (Gasto)\n"
                "• `Gasolina 50000 VES`\n"
                "• `Sueldo 100$` (Ingreso)",
                parse_mode="Markdown",
            )
        else:
            await update.message.reply_text(
                "⚠️ Error al registrar el gasto. Intenta de nuevo."
            )
    except Exception:
        await update.message.reply_text(
            "⚠️ No pude conectar con el servidor. Intenta más tarde."
        )
