"""
Bot Internal Router - Endpoints exclusivos para el Bot de Telegram.
Autenticados con BOT_INTERNAL_SECRET (no JWT de usuario).
"""

from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.responses import Response
from supabase import Client
from supabase_client import get_supabase
from config import settings
from services.nlp_parser import parse_expense
from services.bcv_scraper import get_current_rate
from services.chart_generator import generate_monthly_chart
from services.database import (
    get_exchange_rate,
    get_closest_exchange_rate,
    calculate_usd_equivalent,
    match_category_from_rules,
)
from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime
from typing import Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/bot", tags=["bot-internal"])


# ─── Auth del bot ────────────────────────────────────────────────────────────

def verify_bot_secret(x_bot_secret: str = Header(...)):
    if x_bot_secret != settings.BOT_INTERNAL_SECRET:
        raise HTTPException(status_code=403, detail="Invalid bot secret")


def _get_user_id_by_telegram(supabase: Client, telegram_id: int) -> str:
    """Resuelve telegram_id → Supabase user_id. Lanza 404 si no está vinculado."""
    try:
        result = (
            supabase.table("telegram_users")
            .select("user_id")
            .eq("telegram_id", telegram_id)
            .maybe_single()
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
        
    if not result or not result.data:
        raise HTTPException(
            status_code=404,
            detail="Telegram user not linked. Use /start to link your account.",
        )
    return result.data["user_id"]


# ─── Modelos de Request/Response ─────────────────────────────────────────────

class LinkUserRequest(BaseModel):
    telegram_id: int
    telegram_username: Optional[str] = None
    supabase_email: str
    supabase_password: str


class ExpenseRequest(BaseModel):
    telegram_id: int
    text: str           # Texto libre: "Comida 15 USD"
    category_id: Optional[str] = None  # Override manual


class LinkResponse(BaseModel):
    success: bool
    message: str
    user_id: Optional[str] = None


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.post("/link-user", response_model=LinkResponse)
def link_telegram_user(
    body: LinkUserRequest,
    _: str = Depends(verify_bot_secret),
    supabase: Client = Depends(get_supabase),
):
    """Vincula un telegram_id con una cuenta de Supabase Auth."""
    # Autenticar con Supabase para obtener el user_id
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": body.supabase_email,
            "password": body.supabase_password,
        })
        user_id = auth_response.user.id
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid credentials: {str(e)}")

    # Verificar si ya existe el vínculo
    existing = (
        supabase.table("telegram_users")
        .select("id")
        .eq("telegram_id", body.telegram_id)
        .execute()
    )

    if existing.data:
        # Actualizar el vínculo existente
        supabase.table("telegram_users").update({
            "user_id": user_id,
            "telegram_username": body.telegram_username,
        }).eq("telegram_id", body.telegram_id).execute()
        return LinkResponse(success=True, message="Cuenta actualizada correctamente.", user_id=user_id)

    # Crear nuevo vínculo usando service key (bypass RLS)
    result = supabase.table("telegram_users").insert({
        "user_id": user_id,
        "telegram_id": body.telegram_id,
        "telegram_username": body.telegram_username,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Error linking account")

    return LinkResponse(success=True, message="¡Cuenta vinculada exitosamente!", user_id=user_id)


@router.post("/expense")
def register_expense_from_bot(
    body: ExpenseRequest,
    _: str = Depends(verify_bot_secret),
    supabase: Client = Depends(get_supabase),
):
    """Parsea texto natural y registra el gasto."""
    user_id = _get_user_id_by_telegram(supabase, body.telegram_id)

    # Parsear el texto
    parsed = parse_expense(body.text)
    if not parsed:
        raise HTTPException(
            status_code=422,
            detail="No pude entender el gasto. Intenta: 'Comida 15 USD' o 'Gasolina 50000 VES'",
        )

    tx_date = datetime.now()
    data = {
        "user_id": user_id,
        "amount": float(parsed.amount),
        "currency": parsed.currency,
        "description": parsed.description,
        "transaction_date": tx_date.isoformat(),
        "source": "telegram",
    }

    # Calcular equivalente USD si es VES
    if parsed.currency == "VES":
        rate_data = get_exchange_rate(supabase, tx_date.date())
        if not rate_data:
            rate_data = get_closest_exchange_rate(supabase, tx_date.date())
        if rate_data:
            rate = Decimal(str(rate_data["bcv_rate"]))
            data["usd_equivalent"] = float(
                calculate_usd_equivalent(Decimal(str(parsed.amount)), rate)
            )
        else:
            data["usd_equivalent"] = None
    else:
        data["usd_equivalent"] = parsed.amount

    # Auto-categorizar con merchant rules
    category_id = body.category_id
    if not category_id:
        category_id = match_category_from_rules(supabase, user_id, parsed.description)
    if category_id:
        data["category_id"] = category_id

    result = supabase.table("transactions").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Error saving transaction")

    tx = result.data[0]

    # Nombre de categoría para la respuesta
    category_name = "Sin categoría"
    category_type = "expense"
    if category_id:
        cat_res = supabase.table("categories").select("name, type").eq("id", category_id).maybe_single().execute()
        if cat_res and cat_res.data:
            category_name = cat_res.data["name"]
            category_type = cat_res.data["type"]

    return {
        "success": True,
        "transaction_id": tx["id"],
        "amount": parsed.amount,
        "currency": parsed.currency,
        "usd_equivalent": tx.get("usd_equivalent"),
        "description": parsed.description,
        "category_name": category_name,
        "category_type": category_type,
    }


@router.get("/budgets/{telegram_id}")
def get_budgets_status(
    telegram_id: int,
    _: str = Depends(verify_bot_secret),
    supabase: Client = Depends(get_supabase),
):
    """Estado actual de presupuestos del usuario."""
    user_id = _get_user_id_by_telegram(supabase, telegram_id)

    now = datetime.now()
    month = now.month
    year = now.year
    month_start = f"{year}-{month:02d}-01"
    if month == 12:
        next_month = f"{year + 1}-01-01"
    else:
        next_month = f"{year}-{month + 1:02d}-01"

    # Gastos del mes agrupados por categoría
    txs = (
        supabase.table("transactions")
        .select("usd_equivalent, category_id")
        .eq("user_id", user_id)
        .gte("transaction_date", month_start)
        .lt("transaction_date", next_month)
        .execute()
    )

    spending: dict = {}
    for tx in txs.data:
        cat = tx.get("category_id") or "sin_categoria"
        spending[cat] = spending.get(cat, 0) + float(tx.get("usd_equivalent") or 0)

    # Presupuestos del mes
    budgets = (
        supabase.table("budgets")
        .select("*, categories(name)")
        .eq("user_id", user_id)
        .eq("month", month)
        .eq("year", year)
        .execute()
    )

    result = []
    for b in budgets.data:
        cat_id = b["category_id"]
        limit = float(b["limit_amount"])
        spent = spending.get(cat_id, 0)
        pct = (spent / limit * 100) if limit > 0 else 0
        cat_name = (b.get("categories") or {}).get("name", "?")
        result.append({
            "category_name": cat_name,
            "limit_usd": limit,
            "spent_usd": round(spent, 2),
            "percentage": round(pct, 1),
            "status": "red" if pct >= 100 else ("yellow" if pct >= 80 else "green"),
        })

    result.sort(key=lambda x: x["percentage"], reverse=True)
    return {"budgets": result, "month": month, "year": year}


@router.get("/transactions/{telegram_id}")
def get_recent_transactions(
    telegram_id: int,
    limit: int = 5,
    _: str = Depends(verify_bot_secret),
    supabase: Client = Depends(get_supabase),
):
    """Últimas N transacciones del usuario."""
    user_id = _get_user_id_by_telegram(supabase, telegram_id)

    limit = min(max(limit, 1), 20)
    txs = (
        supabase.table("transactions")
        .select("*, categories(name)")
        .eq("user_id", user_id)
        .order("transaction_date", desc=True)
        .limit(limit)
        .execute()
    )

    results = []
    for tx in txs.data:
        cat_name = (tx.get("categories") or {}).get("name", "Sin categoría")
        results.append({
            "id": tx["id"],
            "description": tx.get("description", ""),
            "amount": float(tx["amount"]),
            "currency": tx["currency"],
            "usd_equivalent": float(tx.get("usd_equivalent") or 0),
            "category_name": cat_name,
            "transaction_date": tx["transaction_date"],
            "source": tx.get("source", ""),
        })

    return {"transactions": results}


@router.get("/chart/{telegram_id}")
async def get_monthly_chart(
    telegram_id: int,
    month: Optional[int] = None,
    year: Optional[int] = None,
    _: str = Depends(verify_bot_secret),
    supabase: Client = Depends(get_supabase),
):
    """Genera y retorna el gráfico mensual como PNG."""
    user_id = _get_user_id_by_telegram(supabase, telegram_id)

    now = datetime.now()
    target_month = month or now.month
    target_year = year or now.year

    month_start = f"{target_year}-{target_month:02d}-01"
    if target_month == 12:
        next_month = f"{target_year + 1}-01-01"
    else:
        next_month = f"{target_year}-{target_month + 1:02d}-01"

    # Obtener gastos del mes
    txs = (
        supabase.table("transactions")
        .select("usd_equivalent, category_id")
        .eq("user_id", user_id)
        .gte("transaction_date", month_start)
        .lt("transaction_date", next_month)
        .execute()
    )

    # Obtener categorías y presupuestos
    categories_res = supabase.table("categories").select("id, name").eq("user_id", user_id).execute()
    cat_map = {c["id"]: c["name"] for c in categories_res.data}

    budgets_res = (
        supabase.table("budgets")
        .select("category_id, limit_amount")
        .eq("user_id", user_id)
        .eq("month", target_month)
        .eq("year", target_year)
        .execute()
    )
    budget_map = {b["category_id"]: float(b["limit_amount"]) for b in budgets_res.data}

    # Agrupar gastos por categoría
    spending: dict = {}
    total_usd = 0
    for tx in txs.data:
        val = float(tx.get("usd_equivalent") or 0)
        cat = tx.get("category_id") or "sin_categoria"
        spending[cat] = spending.get(cat, 0) + val
        total_usd += val

    by_category = []
    for cat_id, spent in spending.items():
        budget = budget_map.get(cat_id)
        pct = (spent / budget * 100) if budget else None
        by_category.append({
            "category_name": cat_map.get(cat_id, "Sin cat."),
            "spent_usd": spent,
            "budget_usd": budget,
            "percentage": round(pct, 1) if pct else None,
            "status": "red" if pct and pct >= 100 else ("yellow" if pct and pct >= 80 else "green"),
        })

    # Obtener username del telegram_user
    tg_user = (
        supabase.table("telegram_users")
        .select("telegram_username")
        .eq("telegram_id", telegram_id)
        .maybe_single()
        .execute()
    )
    username = (tg_user.data if tg_user and tg_user.data else {}).get("telegram_username") or "Usuario"

    # Generar imagen
    png_bytes = generate_monthly_chart(by_category, target_month, target_year, total_usd, username)
    if not png_bytes:
        raise HTTPException(status_code=500, detail="Error generating chart")

    return Response(content=png_bytes, media_type="image/png")


@router.get("/tasa")
async def get_tasa(
    _: str = Depends(verify_bot_secret),
    supabase: Client = Depends(get_supabase),
):
    """Obtiene la tasa BCV actual."""
    rate_info = await get_current_rate(supabase)
    return rate_info


@router.get("/all-users")
def get_all_linked_users(
    _: str = Depends(verify_bot_secret),
    supabase: Client = Depends(get_supabase),
):
    """Lista todos los telegram_id vinculados (para el scheduler de notificaciones)."""
    result = supabase.table("telegram_users").select("telegram_id, telegram_username").execute()
    return {"users": result.data or []}


@router.post("/update-exchange-rate")
async def update_exchange_rate(
    _: str = Depends(verify_bot_secret),
    supabase: Client = Depends(get_supabase),
):
    """Actualiza la tasa BCV desde el scraper y la guarda en la BD."""
    from datetime import date
    
    rate_info = await get_current_rate(supabase)
    
    if rate_info and rate_info.get("rate"):
        today = date.today()
        result = supabase.table("exchange_rates").upsert({
            "date": str(today),
            "bcv_rate": rate_info["rate"],
            "parallel_rate": rate_info["rate"] * 1.04,  # Aproximado
        }, on_conflict="date").execute()
        
        return {
            "success": True,
            "date": str(today),
            "bcv_rate": rate_info["rate"],
            "source": rate_info.get("source"),
        }
    
    return {"success": False, "message": "No se pudo obtener la tasa"}
