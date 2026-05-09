from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from schemas.entities import (
    MerchantRuleCreate,
    MerchantRuleUpdate,
    MerchantRuleResponse,
)
from supabase_client import get_supabase
from dependencies import get_current_user_id

router = APIRouter(prefix="/merchant-rules", tags=["merchant_rules"])


@router.get("/", response_model=list[MerchantRuleResponse])
def get_merchant_rules(
    user_id: str = Depends(get_current_user_id), supabase: Client = Depends(get_supabase)
):
    result = (
        supabase.table("merchant_rules")
        .select("*, categories(name, type)")
        .eq("user_id", user_id)
        .execute()
    )
    return result.data


@router.post("/", response_model=MerchantRuleResponse)
def create_merchant_rule(
    rule: MerchantRuleCreate,
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_supabase),
):
    category_check = (
        supabase.table("categories")
        .select("id")
        .eq("id", rule.category_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not category_check.data:
        raise HTTPException(status_code=404, detail="Category not found")

    data = rule.model_dump()
    data["user_id"] = user_id

    result = supabase.table("merchant_rules").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Error creating merchant rule")
    return result.data[0]


@router.put("/{rule_id}", response_model=MerchantRuleResponse)
def update_merchant_rule(
    rule_id: str,
    rule: MerchantRuleUpdate,
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_supabase),
):
    data = rule.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="No data to update")

    result = (
        supabase.table("merchant_rules")
        .update(data)
        .eq("id", rule_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Merchant rule not found")
    return result.data[0]


@router.delete("/{rule_id}")
def delete_merchant_rule(
    rule_id: str,
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_supabase),
):
    result = (
        supabase.table("merchant_rules")
        .delete()
        .eq("id", rule_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Merchant rule not found")
    return {"message": "Merchant rule deleted"}
