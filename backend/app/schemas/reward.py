from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class RewardBase(BaseModel):
    program_name: str = Field(..., min_length=1)
    points_balance: int = Field(0, ge=0)

class RewardCreate(RewardBase):
    pass

class RewardUpdate(BaseModel):
    program_name: Optional[str] = Field(None, min_length=1)
    points_balance: Optional[int] = Field(None, ge=0)

class RewardInDB(RewardBase):
    id: int
    user_id: int
    last_updated: datetime

    class Config:
        from_attributes = True

class RewardResponse(RewardInDB):
    pass

class RewardRedeem(BaseModel):
    reward_id: int
    points: Optional[int] = Field(None, gt=0) # For money conversion
    redemption_type: str  # "money" or "bill"
    account_id: Optional[int] = None # For money conversion
    bill_id: Optional[int] = None # For bill payment
