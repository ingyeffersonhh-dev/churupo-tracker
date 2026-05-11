from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routers import categories, budgets, merchant_rules, transactions, analytics, bot_internal, recurring, export, recurring_processor
from services.bcv_scraper import get_current_rate
from supabase_client import get_supabase
from dependencies import get_current_user_id

app = FastAPI(
    title="PFM API - Gestión de Finanzas Personales",
    description="API para gestión de finanzas personales con sistema bi-monetario VES/USD",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok", "version": "2.0.0"}


@app.get("/exchange-rate")
async def get_exchange_rate(
    _: str = Depends(get_current_user_id),
    supabase = Depends(get_supabase),
):
    """Obtiene la tasa BCV actual (requiere JWT)."""
    rate_info = await get_current_rate(supabase)
    return rate_info


app.include_router(categories.router)
app.include_router(budgets.router)
app.include_router(merchant_rules.router)
app.include_router(transactions.router)
app.include_router(analytics.router)
app.include_router(bot_internal.router)
app.include_router(recurring.router)
app.include_router(export.router)
app.include_router(recurring_processor.router)

