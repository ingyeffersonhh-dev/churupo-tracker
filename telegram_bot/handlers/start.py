"""
Handler /start — Vincula la cuenta de Telegram con la app.
Flujo conversacional:
  1. Usuario escribe /start
  2. Bot pide email
  3. Usuario envía email
  4. Bot pide contraseña
  5. Usuario envía contraseña
  6. Bot llama a /bot/link-user y confirma
"""

from telegram import Update, ReplyKeyboardRemove
from telegram.ext import (
    ContextTypes,
    ConversationHandler,
    CommandHandler,
    MessageHandler,
    filters,
)
from api_client import api_post
import httpx

ASK_EMAIL, ASK_PASSWORD = range(2)

WELCOME_MSG = """
👋 *¡Bienvenido al Bot de Gastos Personales!*

Este bot te permite registrar y consultar tus gastos directamente desde Telegram.

Para comenzar, necesito vincular tu cuenta. Por favor, envíame tu *email* de la aplicación.
"""

ALREADY_LINKED_MSG = """
✅ *¡Ya tienes tu cuenta vinculada!*

Puedes empezar a registrar transacciones. Ejemplos:
• `Comida 15 USD` (Gasto)
• `Gasolina 50000 VES`
• `Sueldo 200$` (Ingreso)

Escribe /ayuda para ver todos los comandos.
"""


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    tg_id = update.effective_user.id

    # Verificar si ya está vinculado
    try:
        await api_post("/bot/expense", {"telegram_id": tg_id, "text": "test 0 USD"})
        # Si no lanza 404 → ya está vinculado (aunque el gasto no se guarda por monto 0)
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            # No vinculado → iniciar flujo
            await update.message.reply_text(WELCOME_MSG, parse_mode="Markdown")
            return ASK_EMAIL
        # Otro error no importa, está vinculado
    except Exception:
        pass

    await update.message.reply_text(ALREADY_LINKED_MSG, parse_mode="Markdown")
    return ConversationHandler.END


async def ask_email(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    email = update.message.text.strip()
    if "@" not in email or "." not in email:
        await update.message.reply_text("⚠️ Eso no parece un email válido. Intenta de nuevo:")
        return ASK_EMAIL
    context.user_data["email"] = email
    await update.message.reply_text(
        "🔒 Ahora envíame tu *contraseña*.\n_(Este mensaje será eliminado automáticamente)_",
        parse_mode="Markdown",
    )
    return ASK_PASSWORD


async def ask_password(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    password = update.message.text.strip()
    email = context.user_data.get("email")
    tg_user = update.effective_user

    # Intentar eliminar el mensaje con la contraseña (privacidad)
    try:
        await update.message.delete()
    except Exception:
        pass

    if not email or not password:
        await update.message.reply_text("❌ Error. Escribe /start para intentar de nuevo.")
        return ConversationHandler.END

    await update.message.reply_text("⏳ Vinculando tu cuenta...")

    try:
        result = await api_post("/bot/link-user", {
            "telegram_id": tg_user.id,
            "telegram_username": tg_user.username,
            "supabase_email": email,
            "supabase_password": password,
        })
        await update.message.reply_text(
            f"✅ *{result['message']}*\n\n"
            "Ya puedes registrar transacciones. Ejemplos:\n"
            "• `Comida 15 USD` (Gasto)\n"
            "• `Gasolina 50000 VES`\n"
            "• `Bono 100 dolares` (Ingreso)\n\n"
            "Escribe /ayuda para ver todos los comandos.",
            parse_mode="Markdown",
        )
    except httpx.HTTPStatusError as e:
        detail = e.response.json().get("detail", "Error desconocido")
        await update.message.reply_text(
            f"❌ *Error al vincular:* {detail}\n\nEscribe /start para intentar de nuevo.",
            parse_mode="Markdown",
        )
    except Exception as e:
        await update.message.reply_text(
            "❌ No pude conectar con el servidor. Intenta más tarde.",
        )

    context.user_data.clear()
    return ConversationHandler.END


async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data.clear()
    await update.message.reply_text(
        "❌ Cancelado. Escribe /start cuando quieras vincular tu cuenta.",
        reply_markup=ReplyKeyboardRemove(),
    )
    return ConversationHandler.END


def get_start_conversation_handler() -> ConversationHandler:
    return ConversationHandler(
        entry_points=[CommandHandler("start", start)],
        states={
            ASK_EMAIL: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_email)],
            ASK_PASSWORD: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_password)],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
    )
