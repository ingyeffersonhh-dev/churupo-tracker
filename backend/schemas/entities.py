from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from decimal import Decimal


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: str = Field(..., pattern="^(income|expense)$")
    icon: Optional[str] = Field(None, max_length=50)


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    type: Optional[str] = Field(None, pattern="^(income|expense)$")
    icon: Optional[str] = Field(None, max_length=50)


class CategoryResponse(BaseModel):
    id: str
    user_id: str
    name: str
    type: str
    icon: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MerchantRuleCreate(BaseModel):
    keyword: str = Field(..., min_length=1, max_length=100)
    category_id: str


class MerchantRuleUpdate(BaseModel):
    keyword: Optional[str] = Field(None, min_length=1, max_length=100)
    category_id: Optional[str] = None


class MerchantRuleResponse(BaseModel):
    id: str
    user_id: str
    keyword: str
    category_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class BudgetCreate(BaseModel):
    category_id: str
    limit_amount: Decimal = Field(..., gt=0)
    currency: str = Field(default="USD", pattern="^(USD|VES)$")
    month: int = Field(..., ge=1, le=12)
    year: int


class BudgetUpdate(BaseModel):
    limit_amount: Optional[Decimal] = Field(None, gt=0)
    currency: Optional[str] = Field(None, pattern="^(USD|VES)$")


class BudgetResponse(BaseModel):
    id: str
    user_id: str
    category_id: str
    limit_amount: Decimal
    currency: str
    month: int
    year: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TransactionCreate(BaseModel):
    category_id: Optional[str] = None
    amount: Decimal = Field(..., gt=0)
    currency: str = Field(..., pattern="^(USD|VES)$")
    transaction_date: datetime
    description: Optional[str] = None


class TransactionUpdate(BaseModel):
    category_id: Optional[str] = None
    amount: Optional[Decimal] = Field(None, gt=0)
    currency: Optional[str] = Field(None, pattern="^(USD|VES)$")
    transaction_date: Optional[datetime] = None
    description: Optional[str] = None


class TransactionResponse(BaseModel):
    id: str
    user_id: str
    category_id: Optional[str] = None
    amount: Decimal
    currency: str
    usd_equivalent: Optional[Decimal] = None
    transaction_date: datetime
    description: Optional[str] = None
    source: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ExchangeRateResponse(BaseModel):
    id: str
    date: date
    bcv_rate: Decimal
    parallel_rate: Decimal

    class Config:
        from_attributes = True


class AnalyticsResponse(BaseModel):
    total_expenses_usd: Decimal
    total_income_usd: Decimal
    balance_usd: Decimal
    by_category: list[dict]


class CSVUploadResponse(BaseModel):
    imported: int
    categorized: int
    uncategorized: int
    errors: list[str] = []


# ─── Recurring Expenses ──────────────────────────────────────────────────────

class RecurringExpenseCreate(BaseModel):
    description: str = Field(..., min_length=1, max_length=200)
    amount: Decimal = Field(..., gt=0)
    currency: str = Field(..., pattern="^(USD|VES)$")
    category_id: Optional[str] = None
    day_of_month: int = Field(..., ge=1, le=28)  # Max 28 to avoid month-length issues


class RecurringExpenseUpdate(BaseModel):
    description: Optional[str] = Field(None, min_length=1, max_length=200)
    amount: Optional[Decimal] = Field(None, gt=0)
    currency: Optional[str] = Field(None, pattern="^(USD|VES)$")
    category_id: Optional[str] = None
    day_of_month: Optional[int] = Field(None, ge=1, le=28)
    is_active: Optional[bool] = None


class RecurringExpenseResponse(BaseModel):
    id: str
    user_id: str
    description: str
    amount: Decimal
    currency: str
    category_id: Optional[str] = None
    day_of_month: int
    is_active: bool
    last_executed: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
