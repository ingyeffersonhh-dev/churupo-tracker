"""Handler /ayuda — Lista de todos los comandos disponibles."""

from telegram import Update
from telegram.ext import ContextTypes

HELP_TEXT = """
🤖 *Bot de Gastos Personales* — Comandos

━━━━━━━━━━━━━━━━━━━━
📝 *REGISTRAR TRANSACCIONES*
━━━━━━━━━━━━━━━━━━━━
Escribe el gasto o ingreso en lenguaje natural:

• `Comida 15 USD` (Gasto)
• `Sueldo 200 USD` (Ingreso)
• `Gasolina 50000 VES`
• `Venta de zapatos 50$`

El bot detecta automáticamente si es ingreso o gasto según la categoría asignada en la app.

━━━━━━━━━━━━━━━━━━━━
📊 *CONSULTAS*
━━━━━━━━━━━━━━━━━━━━
/presupuestos — Estado de tus presupuestos del mes
/ultimos — Últimas 5 transacciones
/ultimos 10 — Últimas 10 transacciones
/grafico — Gráfico de gastos del mes (imagen)
/tasa — Tasa BCV actual

━━━━━━━━━━━━━━━━━━━━
⚙️ *CUENTA*
━━━━━━━━━━━━━━━━━━━━
/start — Vincular o re-vincular tu cuenta
/ayuda — Mostrar este menú

━━━━━━━━━━━━━━━━━━━━
💡 *TIPS*
━━━━━━━━━━━━━━━━━━━━
• Configura tus categorías y presupuestos desde la app web
• Recibirás resúmenes automáticos diarios, semanales y mensuales
• Escribe en minúsculas o mayúsculas, el bot entiende ambos
"""


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(HELP_TEXT, parse_mode="Markdown")
