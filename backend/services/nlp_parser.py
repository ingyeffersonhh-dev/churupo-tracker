"""
NLP Parser - Parsea texto natural para extraer gastos.

Ejemplos soportados:
  "Comida 15 USD"          → amount=15.0,  currency=USD, description="Comida"
  "Gasolina 50000 VES"     → amount=50000, currency=VES, description="Gasolina"
  "Uber 8.5$"              → amount=8.5,   currency=USD, description="Uber"
  "Mercado 120,50 bs"      → amount=120.5, currency=VES, description="Mercado"
  "Netflix 12 dolares"     → amount=12.0,  currency=USD, description="Netflix"
  "15 USD comida"          → amount=15.0,  currency=USD, description="comida"
"""

import re
from dataclasses import dataclass
from typing import Optional


@dataclass
class ParsedExpense:
    amount: float
    currency: str          # "USD" o "VES"
    description: str
    raw_text: str


# Patrones para detectar la moneda
_USD_PATTERNS = [
    r"\$", r"\busd\b", r"\bdolar(es)?\b", r"\bdólar(es)?\b", r"\bdlrs?\b"
]
_VES_PATTERNS = [
    r"\bves\b", r"\bbs\.?f?\b", r"\bbolivares?\b", r"\bbolivar(es)?\b"
]

# Patrón para extraer el número
# Orden: primero formatos con separadores, luego entero simple
_NUMBER_PATTERN = (
    r"(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?"   # 50.000 / 50,000 / 50.000,50
    r"|\d+[.,]\d{1,2}"                            # 120,50 / 8.5
    r"|\d+)"                                       # 50000 / 15
)



def _normalize_number(raw: str) -> float:
    """Convierte '50.000,50' o '50,000.50' o '120,50' a float."""
    # Sin separadores: número entero simple como "50000", "15"
    if "." not in raw and "," not in raw:
        return float(raw)

    # Si tiene ambos separadores, detectar cuál es decimal
    if "." in raw and "," in raw:
        # El último separador es el decimal
        if raw.rfind(".") > raw.rfind(","):
            # Último es punto → formato 1,000.50
            return float(raw.replace(",", ""))
        else:
            # Último es coma → formato 1.000,50
            return float(raw.replace(".", "").replace(",", "."))
    elif "," in raw:
        # Puede ser separador de miles (50,000) o decimal (120,50)
        parts = raw.split(",")
        if len(parts) == 2 and len(parts[1]) <= 2:
            # Decimal: "120,50"
            return float(raw.replace(",", "."))
        else:
            # Miles: "50,000"
            return float(raw.replace(",", ""))
    else:
        # Solo punto → puede ser decimal "15.5" o miles "50.000"
        parts = raw.split(".")
        if len(parts) == 2 and len(parts[1]) <= 2:
            # Decimal: "15.5", "120.50"
            return float(raw)
        else:
            # Miles: "50.000"
            return float(raw.replace(".", ""))



def _detect_currency(text: str) -> Optional[str]:
    lower = text.lower()
    for pat in _USD_PATTERNS:
        if re.search(pat, lower):
            return "USD"
    for pat in _VES_PATTERNS:
        if re.search(pat, lower):
            return "VES"
    return None


def _remove_currency_tokens(text: str) -> str:
    """Elimina las palabras/símbolos de moneda del texto."""
    patterns_to_remove = _USD_PATTERNS + _VES_PATTERNS + [r"\$"]
    result = text
    for pat in patterns_to_remove:
        result = re.sub(pat, "", result, flags=re.IGNORECASE)
    return result


def parse_expense(text: str) -> Optional[ParsedExpense]:
    """
    Parsea un mensaje de texto libre y extrae el gasto.
    Devuelve None si no puede parsear.
    """
    raw_text = text.strip()
    currency = _detect_currency(raw_text)
    if not currency:
        return None

    # Buscar el número en el texto
    match = re.search(_NUMBER_PATTERN, raw_text)
    if not match:
        return None

    try:
        amount = _normalize_number(match.group(1))
    except (ValueError, IndexError):
        return None

    if amount <= 0:
        return None

    # La descripción es el texto restante después de quitar moneda y número
    clean = re.sub(_NUMBER_PATTERN, "", raw_text, count=1)
    clean = _remove_currency_tokens(clean)
    description = re.sub(r"\s+", " ", clean).strip(" -–:,.")

    if not description:
        description = "Gasto sin descripción"

    # Capitalizar primer letra
    description = description[0].upper() + description[1:] if description else description

    return ParsedExpense(
        amount=amount,
        currency=currency,
        description=description,
        raw_text=raw_text,
    )
