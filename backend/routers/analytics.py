from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from supabase_client import get_supabase
from dependencies import get_current_user_id
from decimal import Decimal
from datetime import datetime

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary")
def get_analytics_summary(
    user_id: str = Depends(get_current_user_id),
    month: int | None = None,
    year: int | None = None,
    supabase: Client = Depends(get_supabase),
):
    now = datetime.now()
    target_month = month or now.month
    target_year = year or now.year

    month_start = f"{target_year}-{target_month:02d}-01"
    if target_month == 12:
        next_year = target_year + 1
        next_month_start = f"{next_year}-01-01"
    else:
        next_month_start = f"{target_year}-{target_month + 1:02d}-01"

    # Obtener transacciones del mes
    transactions_result = (
        supabase.table("transactions")
        .select("usd_equivalent, category_id")
        .eq("user_id", user_id)
        .gte("transaction_date", month_start)
        .lt("transaction_date", next_month_start)
        .execute()
    )

    # Obtener mapa de categorías
    categories_result = (
        supabase.table("categories").select("id, name, type").eq("user_id", user_id).execute()
    )
    category_map = {cat["id"]: cat for cat in categories_result.data}

    total_expenses_usd = Decimal("0")
    total_income_usd = Decimal("0")
    by_category_expenses = {}

    for tx in transactions_result.data:
        usd_eq = tx.get("usd_equivalent")
        if usd_eq:
            cat_id = tx.get("category_id")
            # Determinar tipo (default: expense si no hay categoría)
            cat_type = "expense"
            if cat_id and cat_id in category_map:
                cat_type = category_map[cat_id].get("type", "expense")

            amount = Decimal(str(usd_eq))

            if cat_type == "income":
                total_income_usd += amount
            else:
                total_expenses_usd += amount
                
                # Agrupar solo gastos para by_category
                safe_cat_id = cat_id or "uncategorized"
                if safe_cat_id not in by_category_expenses:
                    by_category_expenses[safe_cat_id] = Decimal("0")
                by_category_expenses[safe_cat_id] += amount

    budgets_result = (
        supabase.table("budgets")
        .select("*")
        .eq("user_id", user_id)
        .eq("month", target_month)
        .eq("year", target_year)
        .execute()
    )

    categories_result = (
        supabase.table("categories").select("id, name, type").eq("user_id", user_id).execute()
    )
    category_map = {cat["id"]: cat for cat in categories_result.data}

    by_category = []
    for cat_id, spent in by_category_expenses.items():
        category_info = category_map.get(cat_id, {"name": "Sin categoría", "type": "expense"})

        budget_for_cat = None
        for b in budgets_result.data:
            if b["category_id"] == cat_id:
                budget_for_cat = b
                break

        budget_limit = None
        if budget_for_cat:
            budget_limit = float(Decimal(str(budget_for_cat["limit_amount"])))

        percentage = None
        if budget_limit and budget_limit > 0:
            percentage = float((spent / Decimal(str(budget_limit))) * 100)

        by_category.append(
            {
                "category_id": cat_id,
                "category_name": category_info["name"],
                "category_type": category_info.get("type", "expense"),
                "spent_usd": float(spent),
                "budget_usd": budget_limit,
                "percentage": round(percentage, 2) if percentage else None,
                "status": _get_budget_status(percentage),
            }
        )

    balance_usd = total_income_usd - total_expenses_usd

    return {
        "total_expenses_usd": float(total_expenses_usd),
        "total_income_usd": float(total_income_usd),
        "balance_usd": float(balance_usd),
        "by_category": by_category,
    }


def _get_budget_status(percentage: float | None) -> str:
    if percentage is None:
        return "none"
    if percentage >= 100:
        return "red"
    if percentage >= 80:
        return "yellow"
    return "green"
