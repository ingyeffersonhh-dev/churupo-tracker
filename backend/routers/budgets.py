from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from schemas.entities import (
    BudgetCreate,
    BudgetUpdate,
    BudgetResponse,
)
from supabase_client import get_supabase
from dependencies import get_current_user_id

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.get("/", response_model=list[BudgetResponse])
def get_budgets(
    user_id: str = Depends(get_current_user_id),
    month: int | None = None,
    year: int | None = None,
    supabase: Client = Depends(get_supabase),
):
    query = supabase.table("budgets").select("*").eq("user_id", user_id)

    if month:
        query = query.eq("month", month)
    if year:
        query = query.eq("year", year)

    result = query.execute()
    return result.data


@router.post("/", response_model=BudgetResponse)
def create_budget(
    budget: BudgetCreate,
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_supabase),
):
    data = budget.model_dump(mode='json')
    data["user_id"] = user_id

    result = supabase.table("budgets").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Error creating budget")
    return result.data[0]


@router.put("/{budget_id}", response_model=BudgetResponse)
def update_budget(
    budget_id: str,
    budget: BudgetUpdate,
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_supabase),
):
    data = budget.model_dump(mode='json', exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="No data to update")

    result = (
        supabase.table("budgets")
        .update(data)
        .eq("id", budget_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Budget not found")
    return result.data[0]


@router.delete("/{budget_id}")
def delete_budget(
    budget_id: str,
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_supabase),
):
    result = (
        supabase.table("budgets")
        .delete()
        .eq("id", budget_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Budget not found")
    return {"message": "Budget deleted"}
