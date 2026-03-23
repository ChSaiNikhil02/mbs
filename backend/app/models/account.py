from sqlalchemy import Column, Integer, String, DECIMAL, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    bank_name = Column(String(100), nullable=True)
    account_number = Column(String(20), unique=True, index=True, nullable=False)
    account_type = Column(String(50), nullable=False)
    masked_account = Column(String(50), nullable=True)
    currency = Column(String(3), default="INR")
    balance = Column(DECIMAL(15, 2), default=0.00)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    owner = relationship("User", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account")
