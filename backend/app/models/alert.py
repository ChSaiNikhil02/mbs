from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ENUM
from datetime import datetime, timezone
from app.database import Base

# Define the Enum for PostgreSQL
alert_type_enum = ENUM('low_balance', 'bill_due', 'budget_exceeded', name='alert_type_enum', create_type=False)

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    type = Column(alert_type_enum, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User")

    __table_args__ = (
        UniqueConstraint('user_id', 'type', 'message', name='unique_user_alert'),
    )
