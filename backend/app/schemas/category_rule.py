from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CategoryRuleBase(BaseModel):
    keyword: str
    merchant_name: Optional[str] = None
    category: str

class CategoryRuleCreate(CategoryRuleBase):
    pass

class CategoryRuleInDB(CategoryRuleBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class CategoryRule(CategoryRuleInDB):
    pass
