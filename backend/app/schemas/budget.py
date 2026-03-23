from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class BudgetBase(BaseModel):
    category: str
    monthly_limit: float
    month: int
    year: int

class BudgetCreate(BudgetBase):
    pass

class BudgetInDB(BudgetBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Budget(BudgetInDB):
    pass

class BudgetWithSpent(BudgetInDB):
    spent: float = 0.0
    remaining: float = 0.0
    percentage: float = 0.0

class BudgetState(BaseModel):
    category: str
    spent: float
    limit: float
    percentage: float
    alert_triggered: bool
