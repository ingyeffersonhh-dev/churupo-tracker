from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from schemas.entities import (
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse,
)
from supabase_client import get_supabase
from dependencies import get_current_user_id

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("/", response_model=list[CategoryResponse])
def get_categories(
    user_id: str = Depends(get_current_user_id), supabase: Client = Depends(get_supabase)
):
    result = supabase.table("categories").select("*").eq("user_id", user_id).execute()
    return result.data


@router.post("/", response_model=CategoryResponse)
def create_category(
    category: CategoryCreate,
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_supabase),
):
    data = category.model_dump()
    data["user_id"] = user_id

    result = supabase.table("categories").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Error creating category")
    return result.data[0]


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(
    category_id: str,
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_supabase),
):
    result = (
        supabase.table("categories")
        .select("*")
        .eq("id", category_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Category not found")
    return result.data[0]


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: str,
    category: CategoryUpdate,
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_supabase),
):
    data = category.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="No data to update")

    result = (
        supabase.table("categories")
        .update(data)
        .eq("id", category_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Category not found")
    return result.data[0]


@router.delete("/{category_id}")
def delete_category(
    category_id: str,
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_supabase),
):
    result = (
        supabase.table("categories")
        .delete()
        .eq("id", category_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted"}
