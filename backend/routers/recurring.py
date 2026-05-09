"""
Recurring Expenses Router — CRUD para gastos recurrentes automáticos.
Permite a los usuarios definir gastos fijos mensuales que se registran
automáticamente el día configurado.
"""

from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from schemas.entities import (
    RecurringExpenseCreate,
    RecurringExpenseUpdate,
    RecurringExpenseResponse,
)
from supabase_client import get_supabase
from dependencies import get_current_user_id

router = APIRouter(prefix="/recurring", tags=["recurring-expenses"])


@router.get("/", response_model=list[RecurringExpenseResponse])
def get_recurring_expenses(
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_supabase),
):
    """Lista todos los gastos recurrentes del usuario."""
    result = (
        supabase.table("recurring_expenses")
        .select("*")
        .eq("user_id", user_id)
        .order("day_of_month")
        .execute()
    )
    return result.data


@router.post("/", response_model=RecurringExpenseResponse)
def create_recurring_expense(
    expense: RecurringExpenseCreate,
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_supabase),
):
    """Crear un nuevo gasto recurrente."""
    data = expense.model_dump(mode="json")
    data["user_id"] = user_id
    data["is_active"] = True

    result = supabase.table("recurring_expenses").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Error creating recurring expense")
    return result.data[0]


@router.put("/{expense_id}", response_model=RecurringExpenseResponse)
def update_recurring_expense(
    expense_id: str,
    expense: RecurringExpenseUpdate,
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_supabase),
):
    """Actualizar un gasto recurrente existente."""
    data = expense.model_dump(exclude_unset=True, mode="json")
    if not data:
        raise HTTPException(status_code=400, detail="No data to update")

    result = (
        supabase.table("recurring_expenses")
        .update(data)
        .eq("id", expense_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Recurring expense not found")
    return result.data[0]


@router.delete("/{expense_id}")
def delete_recurring_expense(
    expense_id: str,
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_supabase),
):
    """Eliminar un gasto recurrente."""
    result = (
        supabase.table("recurring_expenses")
        .delete()
        .eq("id", expense_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Recurring expense not found")
    return {"message": "Recurring expense deleted"}


@router.post("/{expense_id}/toggle")
def toggle_recurring_expense(
    expense_id: str,
    user_id: str = Depends(get_current_user_id),
    supabase: Client = Depends(get_supabase),
):
    """Activar/desactivar un gasto recurrente."""
    # Get current state
    current = (
        supabase.table("recurring_expenses")
        .select("is_active")
        .eq("id", expense_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    if not current or not current.data:
        raise HTTPException(status_code=404, detail="Recurring expense not found")

    new_state = not current.data["is_active"]
    result = (
        supabase.table("recurring_expenses")
        .update({"is_active": new_state})
        .eq("id", expense_id)
        .eq("user_id", user_id)
        .execute()
    )
    return {"is_active": new_state, "message": f"Recurring expense {'activated' if new_state else 'deactivated'}"}
