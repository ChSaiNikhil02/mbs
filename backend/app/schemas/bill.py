from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime, date

class BillBase(BaseModel):
    bill_name: str = Field(..., min_length=1, alias="biller_name")
    due_date: date
    amount: float = Field(..., gt=0, alias="amount_due")
    status: str = "pending"
    auto_pay: bool = False

    class Config:
        populate_by_name = True
        json_encoders = {
            date: lambda v: v.isoformat()
        }

class BillCreate(BaseModel):
    bill_name: str = Field(..., min_length=1)
    due_date: date
    amount: float = Field(..., gt=0)
    status: str = "pending"
    auto_pay: bool = False

class BillUpdate(BaseModel):
    bill_name: Optional[str] = Field(None, min_length=1)
    due_date: Optional[date] = None
    amount: Optional[float] = Field(None, gt=0)
    status: Optional[str] = None
    auto_pay: Optional[bool] = None

class BillInDB(BaseModel):
    id: int
    user_id: int
    bill_name: str = Field(..., alias="biller_name")
    due_date: date
    amount: float = Field(..., alias="amount_due")
    status: str
    auto_pay: bool
    is_paid: bool = Field(..., alias="paid")
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True

class BillResponse(BillInDB):
    pass
