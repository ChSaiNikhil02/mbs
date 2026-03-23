from sqlalchemy import Column, Integer, String, DECIMAL, DateTime, ForeignKey, Boolean, Date, text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ENUM
from datetime import datetime, timezone
from app.database import Base

# Define the Enum for PostgreSQL
bill_status_enum = ENUM('upcoming', 'paid', 'overdue', name='bill_status', create_type=False)

class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    biller_name = Column(String(100), nullable=False)
    due_date = Column(Date, nullable=False, index=True)
    amount_due = Column(DECIMAL(15, 2), nullable=False)
    status = Column(bill_status_enum, server_default=text("'upcoming'::bill_status"), index=True)
    auto_pay = Column(Boolean, server_default=text("false"))
    last_reminder_sent = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), onupdate=lambda: datetime.now(timezone.utc))
    paid = Column(Boolean, nullable=False, server_default=text("false"))
    paid_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User")
