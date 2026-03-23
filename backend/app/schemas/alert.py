from pydantic import BaseModel
from datetime import datetime

class AlertBase(BaseModel):
    type: str
    message: str
    is_read: bool = False

class AlertCreate(AlertBase):
    user_id: int

class Alert(AlertBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AlertUpdate(BaseModel):
    is_read: bool
