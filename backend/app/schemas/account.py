from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AccountBase(BaseModel):
    account_number: str
    account_type: str
    bank_name: Optional[str] = None
    masked_account: Optional[str] = None
    currency: Optional[str] = "INR"

class AccountCreate(AccountBase):
    balance: Optional[float] = 0.0

class AccountInDB(AccountBase):
    id: int
    user_id: int
    balance: float
    created_at: datetime

    class Config:
        from_attributes = True

class Account(AccountInDB):
    pass
