from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime
import re

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    address: Optional[str] = None
    phone: Optional[str] = None

class UserInDB(UserBase):
    id: int
    address: Optional[str] = None
    phone: Optional[str] = None
    kyc_status: str
    email_notifications: bool
    sms_notifications: bool
    created_at: datetime

    class Config:
        from_attributes = True

class User(UserInDB):
    pass

class UserUpdate(BaseModel):
    address: Optional[str] = None
    phone: Optional[str] = None
    email_notifications: Optional[bool] = None
    sms_notifications: Optional[bool] = None

class UserData(BaseModel):
    username: str
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    address: Optional[str] = None
    phone: Optional[str] = None
    email_notifications: bool = True
    sms_notifications: bool = False

    @validator('password')
    def password_strength(cls, v):
        if not re.search(r"[A-Z]", v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?~]", v):
            raise ValueError('Password must contain at least one special character')
        return v

class RegistrationRequest(BaseModel):
    scope: str
    user: UserData
