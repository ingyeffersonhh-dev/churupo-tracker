from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routers import categories, budgets, merchant_rules, transactions, analytics, bot_internal, recurring, export, recurring_processor

app = FastAPI(
    title="PFM API - Gestión de Finanzas Personales",
    description="API para gestión de finanzas personales con sistema bi-monetario VES/USD",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permitir todos los orígenes para facilitar pruebas en móviles y red local
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok", "version": "2.0.0"}


app.include_router(categories.router)
app.include_router(budgets.router)
app.include_router(merchant_rules.router)
app.include_router(transactions.router)
app.include_router(analytics.router)
app.include_router(bot_internal.router)
app.include_router(recurring.router)
app.include_router(export.router)
app.include_router(recurring_processor.router)

