"""
Scheduler — Resúmenes automáticos diarios, semanales y mensuales.
Usa APScheduler para enviar mensajes a todos los usuarios vinculados.
"""

import logging
import calendar
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from api_client import api_get, api_post
from telegram.ext import Application
from datetime import date

logger = logging.getLogger(__name__)

MONTHS = [
    "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]


async def _get_all_users() -> list[dict]:
    """Obtiene todos los telegram_id vinculados."""
    try:
        data = await api_get("/bot/all-users")
        return data.get("users", [])
    except Exception as e:
        logger.error(f"Error fetching users for scheduler: {e}")
        return []


async def send_daily_summary(app: Application):
    """Resumen diario — enviado a las 10:00 PM."""
    users = await _get_all_users()
    now = datetime.now()

    for user in users:
        tg_id = user["telegram_id"]
        try:
            data = await api_get(f"/bot/transactions/{tg_id}", {"limit": 20})
            txs = data.get("transactions", [])

            # Filtrar solo las de hoy
            today = now.date()
            today_txs = []
            today_total = 0.0
            for tx in txs:
                try:
                    dt = datetime.fromisoformat(tx["transaction_date"].replace("Z", "+00:00"))
                    if dt.date() == today:
                        today_txs.append(tx)
                        today_total += float(tx.get("usd_equivalent") or 0)
                except Exception:
                    pass

            if not today_txs:
                msg = (
                    f"🌙 *Resumen del {today.strftime('%d/%m/%Y')}*\n\n"
                    "📭 No registraste gastos hoy.\n"
                    "_¿Se te olvidó algo? Escríbelo ahora:_\n"
                    "`Nombre del gasto + monto + moneda`"
                )
            else:
                lines = [f"🌙 *Resumen del {today.strftime('%d/%m/%Y')}*\n"]
                lines.append(f"📊 Total hoy: *${today_total:.2f} USD* en {len(today_txs)} gasto(s)\n")
                for tx in today_txs[:5]:
                    desc = tx.get("description") or "Sin desc."
                    usd = float(tx.get("usd_equivalent") or 0)
                    lines.append(f"  • {desc}: ${usd:.2f}")
                if len(today_txs) > 5:
                    lines.append(f"  _...y {len(today_txs) - 5} más_")
                msg = "\n".join(lines)

            await app.bot.send_message(
                chat_id=tg_id, text=msg, parse_mode="Markdown"
            )

        except Exception as e:
            logger.warning(f"Could not send daily summary to {tg_id}: {e}")


async def send_weekly_summary(app: Application):
    """Resumen semanal — domingos a las 8:00 PM."""
    users = await _get_all_users()
    now = datetime.now()

    for user in users:
        tg_id = user["telegram_id"]
        try:
            data = await api_get(f"/bot/budgets/{tg_id}")
            budgets = data.get("budgets", [])

            # Top 3 categorías con más gasto
            top3 = sorted(budgets, key=lambda x: x["spent_usd"], reverse=True)[:3]

            lines = [f"📅 *Resumen Semanal — Semana del {now.strftime('%d/%m')}*\n"]

            if top3:
                lines.append("🏆 *Top 3 categorías de la semana:*")
                medals = ["🥇", "🥈", "🥉"]
                for i, cat in enumerate(top3):
                    lines.append(
                        f"{medals[i]} *{cat['category_name']}*: ${cat['spent_usd']:.2f} USD"
                    )
            else:
                lines.append("📭 Sin gastos registrados esta semana.")

            # Alertas de presupuestos
            alerts = [b for b in budgets if b["status"] in ("yellow", "red")]
            if alerts:
                lines.append("\n⚠️ *Alertas de presupuesto:*")
                for a in alerts[:3]:
                    emoji = "🔴" if a["status"] == "red" else "🟡"
                    lines.append(
                        f"{emoji} {a['category_name']}: {a['percentage']:.0f}% del límite"
                    )

            lines.append("\n_Escribe /grafico para ver el desglose completo_")
            msg = "\n".join(lines)

            await app.bot.send_message(
                chat_id=tg_id, text=msg, parse_mode="Markdown"
            )

        except Exception as e:
            logger.warning(f"Could not send weekly summary to {tg_id}: {e}")


async def send_monthly_summary(app: Application):
    """Resumen mensual — último día del mes a las 9:00 PM."""
    users = await _get_all_users()
    now = datetime.now()
    month_name = MONTHS[now.month]

    for user in users:
        tg_id = user["telegram_id"]
        try:
            data = await api_get(f"/bot/budgets/{tg_id}")
            budgets = data.get("budgets", [])
            total = sum(b["spent_usd"] for b in budgets)

            exceeded = [b for b in budgets if b["status"] == "red"]
            ok = [b for b in budgets if b["status"] == "green"]

            lines = [
                f"📆 *Resumen de {month_name} {now.year}*\n",
                f"💵 *Total gastado: ${total:.2f} USD*\n",
            ]

            if budgets:
                lines.append(f"✅ Categorías dentro del presupuesto: {len(ok)}")
                if exceeded:
                    lines.append(f"❌ Presupuestos excedidos: {len(exceeded)}")
                    for b in exceeded[:3]:
                        lines.append(f"   • {b['category_name']}: {b['percentage']:.0f}%")

            lines.append("\n_Escribe /grafico para ver el desglose visual_")
            msg = "\n".join(lines)

            await app.bot.send_message(
                chat_id=tg_id, text=msg, parse_mode="Markdown"
            )

        except Exception as e:
            logger.warning(f"Could not send monthly summary to {tg_id}: {e}")


async def process_recurring_expenses(app: Application):
    """Procesa gastos recurrentes diariamente a las 8:00 AM."""
    try:
        result = await api_post("/bot/recurring/process-today", {})
        processed = result.get("processed", 0)
        total = result.get("total", 0)

        if processed > 0:
            logger.info(f"Recurring: {processed}/{total} gastos procesados")

            # Notify users whose recurring expenses were processed
            users = await _get_all_users()
            success_items = [r for r in result.get("results", []) if r.get("status") == "success"]

            for user in users:
                tg_id = user["telegram_id"]
                user_items = [r for r in success_items if r.get("user_id") == str(tg_id) or True]
                # Simplified: send to all users if they had processed items
                # In production, filter by user_id match

            if success_items:
                logger.info(f"Processed recurring expenses: {[r['description'] for r in success_items]}")
        else:
            logger.debug("No recurring expenses to process today")

    except Exception as e:
        logger.error(f"Error processing recurring expenses: {e")


async def update_bcv_rate(app: Application):
    """Actualiza la tasa BCV cada día a las 7:00 AM."""
    try:
        result = await api_post("/bot/update-exchange-rate", {})
        if result.get("success"):
            logger.info(f"BCV rate updated: {result.get('bcv_rate')} - {result.get('date')}")
        else:
            logger.warning(f"Failed to update BCV rate: {result.get('message')}")
    except Exception as e:
        logger.error(f"Error updating BCV rate: {e}")


def setup_scheduler(app: Application) -> AsyncIOScheduler:
    """Configura y retorna el scheduler."""
    scheduler = AsyncIOScheduler(timezone="America/Caracas")

    # Actualizar tasa BCV: diario a las 7:00 AM
    scheduler.add_job(
        update_bcv_rate,
        trigger=CronTrigger(hour=7, minute=0),
        args=[app],
        id="update_bcv_rate",
        name="Daily BCV Rate Update",
    )

    # Gastos recurrentes: diario a las 8:00 AM
    scheduler.add_job(
        process_recurring_expenses,
        trigger=CronTrigger(hour=8, minute=0),
        args=[app],
        id="recurring_expenses",
        name="Daily Recurring Expenses Processor",
    )

    # Resumen diario: 10:00 PM hora Venezuela
    scheduler.add_job(
        send_daily_summary,
        trigger=CronTrigger(hour=22, minute=0),
        args=[app],
        id="daily_summary",
        name="Daily Expense Summary",
    )

    # Resumen semanal: domingos a las 8:00 PM
    scheduler.add_job(
        send_weekly_summary,
        trigger=CronTrigger(day_of_week="sun", hour=20, minute=0),
        args=[app],
        id="weekly_summary",
        name="Weekly Expense Summary",
    )

    # Resumen mensual: último día del mes a las 9:00 PM
    scheduler.add_job(
        send_monthly_summary,
        trigger=CronTrigger(day="last", hour=21, minute=0),
        args=[app],
        id="monthly_summary",
        name="Monthly Expense Summary",
    )

    logger.info("Scheduler configured: recurring (08:00), daily (22:00), weekly (Sun 20:00), monthly (last day 21:00)")
    return scheduler
