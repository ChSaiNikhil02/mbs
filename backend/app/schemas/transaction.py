from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .budget import BudgetState

class TransactionBase(BaseModel):
    amount: float
    description: Optional[str] = None
    currency: Optional[str] = "INR"
    merchant: Optional[str] = None
    category: Optional[str] = None

class TransactionCreate(TransactionBase):
    account_id: int
    txn_type: str # 'debit' or 'credit'
    bill_id: Optional[int] = None

class TransferCreate(BaseModel):
    from_account_id: int
    to_account_id: int
    amount: float
    description: Optional[str] = "Self Transfer"

class TransactionInDB(TransactionBase):
    id: int
    account_id: int
    txn_type: str
    txn_date: datetime

    class Config:
        from_attributes = True

class Transaction(TransactionInDB):
    pass

class TransactionUpdateCategory(BaseModel):
    category: str
    create_rule: bool = False

class TransactionCategoryResponse(BaseModel):
    transaction: Transaction
    budget_state: Optional[BudgetState] = None
    create_rule: bool = False
