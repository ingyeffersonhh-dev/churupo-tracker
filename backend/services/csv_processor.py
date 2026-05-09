import pandas as pd
import io
from typing import Tuple
from datetime import date
from decimal import Decimal, InvalidOperation


def parse_csv(content: bytes) -> pd.DataFrame:
    try:
        df = pd.read_csv(io.BytesIO(content), encoding="utf-8")
    except UnicodeDecodeError:
        df = pd.read_csv(io.BytesIO(content), encoding="latin-1")

    expected_columns = {"Fecha", "Referencia", "Descripción", "Monto"}
    if not expected_columns.issubset(set(df.columns)):
        raise ValueError(
            f"Columnas faltantes. Esperadas: {expected_columns}, Encontradas: {set(df.columns)}"
        )

    df = df.rename(columns={"Fecha": "fecha", "Descripción": "descripcion", "Monto": "monto"})

    df["fecha"] = pd.to_datetime(df["fecha"], format="mixed", dayfirst=True)
    df["monto"] = df["monto"].astype(float)
    df["descripcion"] = df["descripcion"].fillna("")

    return df[["fecha", "descripcion", "monto"]]


def prepare_transactions_for_insert(
    df: pd.DataFrame, user_id: str, category_match_func
) -> Tuple[list[dict], int, int, list[str]]:
    transactions = []
    categorized = 0
    uncategorized = 0
    errors = []

    for idx, row in df.iterrows():
        try:
            amount = Decimal(str(row["monto"])).copy_negate()
            if amount > 0:
                amount = abs(amount)

            category_id = category_match_func(row["descripcion"])
            if category_id:
                categorized += 1
            else:
                uncategorized += 1

            transaction_date = row["fecha"]
            if isinstance(transaction_date, str):
                transaction_date = pd.to_datetime(transaction_date)

            transactions.append(
                {
                    "user_id": user_id,
                    "category_id": category_id,
                    "amount": float(amount),
                    "currency": "VES",
                    "usd_equivalent": None,
                    "transaction_date": transaction_date.isoformat(),
                    "description": row["descripcion"],
                    "source": "csv",
                }
            )
        except (InvalidOperation, ValueError, Exception) as e:
            errors.append(f"Fila {idx + 1}: {str(e)}")

    return transactions, categorized, uncategorized, errors
