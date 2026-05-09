"""
Recurring Expense Processor — Ejecutado diariamente por el scheduler.
Busca gastos recurrentes que deben ejecutarse hoy y los registra
como transacciones automáticas.
"""

from fastapi import APIRouter, Depends, Header, HTTPException
from supabase import Client
from supabase_client import get_supabase
from config import settings
from services.database import get_exchange_rate, get_closest_exchange_rate, calculate_usd_equivalent
from decimal import Decimal
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/bot/recurring", tags=["bot-internal"])


def verify_bot_secret(x_bot_secret: str = Header(...)):
    if x_bot_secret != settings.BOT_INTERNAL_SECRET:
        raise HTTPException(status_code=403, detail="Invalid bot secret")


@router.post("/process-today")
def process_recurring_today(
    _: str = Depends(verify_bot_secret),
    supabase: Client = Depends(get_supabase),
):
    """
    Process all active recurring expenses for today's day of month.
    Called by the scheduler daily.
    Returns a list of processed expenses with their results.
    """
    today = datetime.now()
    day = today.day
    month_key = f"{today.year}-{today.month:02d}"

    # Only process days 1-28 (our constraint)
    if day > 28:
        return {"processed": 0, "message": "Day > 28, no recurring expenses to process"}

    # Get all active recurring expenses for today's day
    result = (
        supabase.table("recurring_expenses")
        .select("*")
        .eq("day_of_month", day)
        .eq("is_active", True)
        .execute()
    )

    if not result.data:
        return {"processed": 0, "results": []}

    processed = []

    for exp in result.data:
        # Check if already executed this month
        if exp.get("last_executed") == month_key:
            processed.append({
                "description": exp["description"],
                "status": "skipped",
                "reason": "Already executed this month",
            })
            continue

        try:
            # Prepare transaction data
            tx_data = {
                "user_id": exp["user_id"],
                "amount": float(exp["amount"]),
                "currency": exp["currency"],
                "description": f"[Recurrente] {exp['description']}",
                "transaction_date": today.isoformat(),
                "source": "recurring",
            }

            if exp.get("category_id"):
                tx_data["category_id"] = exp["category_id"]

            # Calculate USD equivalent
            if exp["currency"] == "VES":
                rate_data = get_exchange_rate(supabase, today.date())
                if not rate_data:
                    rate_data = get_closest_exchange_rate(supabase, today.date())
                if rate_data:
                    rate = Decimal(str(rate_data["bcv_rate"]))
                    tx_data["usd_equivalent"] = float(
                        calculate_usd_equivalent(Decimal(str(exp["amount"])), rate)
                    )
                else:
                    tx_data["usd_equivalent"] = None
            else:
                tx_data["usd_equivalent"] = float(exp["amount"])

            # Insert transaction
            insert_result = supabase.table("transactions").insert(tx_data).execute()

            if insert_result.data:
                # Mark as executed for this month
                supabase.table("recurring_expenses").update(
                    {"last_executed": month_key}
                ).eq("id", exp["id"]).execute()

                processed.append({
                    "description": exp["description"],
                    "status": "success",
                    "amount": float(exp["amount"]),
                    "currency": exp["currency"],
                    "user_id": exp["user_id"],
                })
            else:
                processed.append({
                    "description": exp["description"],
                    "status": "error",
                    "reason": "Insert returned no data",
                })

        except Exception as e:
            logger.error(f"Error processing recurring expense {exp['id']}: {e}")
            processed.append({
                "description": exp["description"],
                "status": "error",
                "reason": str(e),
            })

    success_count = len([p for p in processed if p["status"] == "success"])
    return {"processed": success_count, "total": len(result.data), "results": processed}
