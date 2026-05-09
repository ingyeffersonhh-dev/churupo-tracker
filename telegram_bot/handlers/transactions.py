"""Handler /ultimos [N] — Últimas N transacciones."""

from telegram import Update
from telegram.ext import ContextTypes
from api_client import api_get
from datetime import datetime
import httpx

SOURCE_EMOJI = {"manual": "✏️", "csv": "📄", "telegram": "🤖"}


async def transactions_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    tg_id = update.effective_user.id
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")

    # Parsear el número de transacciones del argumento
    limit = 5
    if context.args:
        try:
            limit = max(1, min(int(context.args[0]), 20))
        except ValueError:
            pass

    try:
        data = await api_get(f"/bot/transactions/{tg_id}", {"limit": limit})
        txs = data.get("transactions", [])

        if not txs:
            await update.message.reply_text(
                "📭 *No tienes transacciones registradas aún.*\n\n"
                "Escribe algo como `Comida 15 USD` para registrar tu primer gasto.",
                parse_mode="Markdown",
            )
            return

        lines = [f"📋 *Últimas {len(txs)} transacciones*\n"]

        for tx in txs:
            try:
                dt = datetime.fromisoformat(tx["transaction_date"].replace("Z", "+00:00"))
                date_str = dt.strftime("%d/%m %H:%M")
            except Exception:
                date_str = "?"

            source_emoji = SOURCE_EMOJI.get(tx.get("source", ""), "")
            currency = tx["currency"]
            amount = tx["amount"]
            usd_eq = tx.get("usd_equivalent", 0)
            desc = tx.get("description") or "Sin descripción"
            cat = tx.get("category_name", "Sin cat.")

            if currency == "VES":
                amount_str = f"{amount:,.0f} Bs (${usd_eq:.2f})"
            else:
                amount_str = f"${amount:.2f}"

            lines.append(
                f"{source_emoji} `{date_str}` — *{desc}*\n"
                f"   💰 {amount_str} | 🏷️ {cat}\n"
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
            await update.message.reply_text("⚠️ Error consultando transacciones.")
    except Exception:
        await update.message.reply_text("⚠️ No pude conectar con el servidor.")
