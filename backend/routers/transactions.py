from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from supabase import Client
from schemas.entities import (
    TransactionCreate,
    TransactionResponse,
    CSVUploadResponse,
)
from supabase_client import get_supabase
from dependencies import get_current_user_id
from services.database import (
    get_exchange_rate,
    get_closest_exchange_rate,
    calculate_usd_equivalent,
    match_category_from_rules,
)
from services.csv_processor import parse_csv, prepare_transactions_for_insert
from decimal import Decimal
from datetime import date

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("/", response_model=list[TransactionResponse])
def get_transactions(
    user_id: str = Depends(get_current_user_id),
    start_date: str | None = None,
    end_date: str | None = None,
    category_id: str | None = None,
    supabase: Client = Depends(get_supabase),
):
    query = supabase.table("transactions").select("*").eq("user_id", user_id)

    if start_date:
        query = query.gte("transaction_date", start_date)
    if end_date:
        query = query.lte("transaction_date", end_date)
    if category_id:
        query = query.eq("category_id", category_id)

    query = query.order("transaction_date", desc=True)

    result = query.execute()
    return result.data


@router.post("/", response_model=TransactionResponse)
def create_transaction(
    transaction: TransactionCreate,
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_supabase),
):
    data = transaction.model_dump(mode='json')
    data["user_id"] = user_id
    data["source"] = "manual"

    if transaction.currency == "VES":
        tx_date = transaction.transaction_date.date()
        rate_data = get_exchange_rate(supabase, tx_date)
        if not rate_data:
            rate_data = get_closest_exchange_rate(supabase, tx_date)

        if rate_data:
            rate = Decimal(str(rate_data["bcv_rate"]))
            data["usd_equivalent"] = float(
                calculate_usd_equivalent(Decimal(str(transaction.amount)), rate)
            )
        else:
            raise HTTPException(
                status_code=404,
                detail=f"No exchange rate found for {tx_date} or earlier",
            )
    else:
        data["usd_equivalent"] = float(transaction.amount)

    if not data.get("category_id"):
        if data.get("description"):
            matched = match_category_from_rules(supabase, user_id, data["description"])
            if matched:
                data["category_id"] = matched

    result = supabase.table("transactions").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Error creating transaction")
    return result.data[0]


@router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: str,
    user_id: str = Depends(get_current_user_id),
    amount: float | None = None,
    currency: str | None = None,
    category_id: str | None = None,
    description: str | None = None,
    supabase: Client = Depends(get_supabase),
):
    data = {}
    if amount is not None:
        data["amount"] = amount
    if currency is not None:
        data["currency"] = currency
    if category_id is not None:
        data["category_id"] = category_id
    if description is not None:
        data["description"] = description

    if not data:
        raise HTTPException(status_code=400, detail="No data to update")

    result = (
        supabase.table("transactions")
        .update(data)
        .eq("id", transaction_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return result.data[0]


@router.delete("/{transaction_id}")
def delete_transaction(
    transaction_id: str,
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_supabase),
):
    result = (
        supabase.table("transactions")
        .delete()
        .eq("id", transaction_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"message": "Transaction deleted"}


@router.post("/upload", response_model=CSVUploadResponse)
async def upload_csv(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_supabase),
):
    content = await file.read()
    df = parse_csv(content)

    def match_category(description: str) -> str | None:
        return match_category_from_rules(supabase, user_id, description)

    transactions, categorized, uncategorized, errors = (
        prepare_transactions_for_insert(df, user_id, match_category)
    )

    for tx in transactions:
        tx_date = date.fromisoformat(tx["transaction_date"][:10])
        rate_data = get_exchange_rate(supabase, tx_date)
        if not rate_data:
            rate_data = get_closest_exchange_rate(supabase, tx_date)

        if rate_data:
            rate = Decimal(str(rate_data["bcv_rate"]))
            tx["usd_equivalent"] = float(
                calculate_usd_equivalent(Decimal(str(tx["amount"])), rate)
            )
        else:
            errors.append(
                f"No exchange rate for {tx_date} - transaction will lack USD equivalent"
            )

    if transactions:
        result = supabase.table("transactions").insert(transactions).execute()
        if not result.data:
            raise HTTPException(status_code=400, detail="Error inserting transactions")

    return CSVUploadResponse(
        imported=len(transactions),
        categorized=categorized,
        uncategorized=uncategorized,
        errors=errors,
    ).model_dump()
