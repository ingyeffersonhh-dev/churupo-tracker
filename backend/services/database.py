from supabase import Client
from typing import Optional
from datetime import date
from decimal import Decimal


def get_exchange_rate(
    supabase: Client, transaction_date: date
) -> Optional[dict]:
    result = supabase.table("exchange_rates").select("*").eq("date", str(transaction_date)).execute()
    if result.data:
        return result.data[0]
    return None


def get_closest_exchange_rate(
    supabase: Client, transaction_date: date
) -> Optional[dict]:
    result = (
        supabase.table("exchange_rates")
        .select("*")
        .lte("date", str(transaction_date))
        .order("date", desc=True)
        .limit(1)
        .execute()
    )
    if result.data:
        return result.data[0]
    return None


def calculate_usd_equivalent(
    amount_ves: Decimal, rate: Decimal
) -> Decimal:
    if rate == 0:
        return amount_ves
    return round(amount_ves / rate, 2)


def match_category_from_rules(
    supabase: Client, user_id: str, description: str
) -> Optional[str]:
    if not description:
        return None

    result = (
        supabase.table("merchant_rules")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )

    description_lower = description.lower()
    for rule in result.data:
        if rule["keyword"].lower() in description_lower:
            return rule["category_id"]

    return None
