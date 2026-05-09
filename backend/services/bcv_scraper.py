"""
BCV Scraper - Obtiene la tasa de cambio actual del Banco Central de Venezuela.
Con fallback a la última tasa registrada en la BD.
"""

import httpx
import re
import logging
from typing import Optional
from datetime import date

logger = logging.getLogger(__name__)

BCV_URL = "https://www.bcv.org.ve/"

# Headers para simular un navegador real
_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-VE,es;q=0.9,en;q=0.8",
}

# Caché simple en memoria (evita hacer requests repetidos en el mismo proceso)
_cache: dict = {"rate": None, "date": None}


async def fetch_bcv_rate() -> Optional[float]:
    """
    Obtiene el tipo de cambio USD/VES del BCV.
    Retorna el valor en Bs. por 1 USD, o None si falla.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True, verify=False) as client:
            response = await client.get(BCV_URL, headers=_HEADERS)
            response.raise_for_status()
            html = response.text

        # El BCV muestra la tasa con formato "XX.XXX,XXXXX"
        # Buscar el bloque del dólar en el HTML
        # Patrón 1: valor con id específico del BCV
        patterns = [
            r'id="dolar"[^>]*>.*?<strong>\s*([\d.,]+)\s*</strong>',
            r'"dolar".*?(\d{1,3}(?:\.\d{3})*,\d+)',
            r'USD.*?(\d{1,3}(?:\.\d{3})*,\d+)',
            r'(\d{1,3}(?:\.\d{3})*,\d+)\s*Bs',
        ]

        for pattern in patterns:
            match = re.search(pattern, html, re.DOTALL | re.IGNORECASE)
            if match:
                raw = match.group(1)
                # Normalizar: "68.750,1234" → 68750.1234
                rate = float(raw.replace(".", "").replace(",", "."))
                if 1 < rate < 1_000_000:
                    _cache["rate"] = rate
                    _cache["date"] = str(date.today())
                    logger.info(f"BCV rate fetched: {rate}")
                    return rate

        logger.warning("Could not parse BCV rate from HTML")
        return None

    except Exception as e:
        logger.error(f"Error fetching BCV rate: {e}")
        return None


def get_bcv_rate_from_db(supabase) -> Optional[dict]:
    """Obtiene la tasa más reciente almacenada en la BD como fallback."""
    try:
        result = (
            supabase.table("exchange_rates")
            .select("*")
            .order("date", desc=True)
            .limit(1)
            .execute()
        )
        if result.data:
            return result.data[0]
    except Exception as e:
        logger.error(f"Error fetching rate from DB: {e}")
    return None


async def get_current_rate(supabase) -> dict:
    """
    Obtiene la tasa actual: primero intenta scraping BCV, luego fallback a BD.
    Retorna un dict con: rate, source, date
    """
    # Intentar caché en memoria (misma fecha)
    today = str(date.today())
    if _cache["rate"] and _cache["date"] == today:
        return {
            "rate": _cache["rate"],
            "source": "bcv_live",
            "date": today,
        }

    # Scraping
    rate = await fetch_bcv_rate()
    if rate:
        return {
            "rate": rate,
            "source": "bcv_live",
            "date": today,
        }

    # Fallback: última tasa en BD
    db_rate = get_bcv_rate_from_db(supabase)
    if db_rate:
        return {
            "rate": float(db_rate["bcv_rate"]),
            "source": "database",
            "date": str(db_rate["date"]),
        }

    return {"rate": None, "source": "unavailable", "date": today}
