from sqlalchemy import Column, Integer, String, DECIMAL, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    category = Column(String(100), nullable=False)
    monthly_limit = Column(DECIMAL(15, 2), nullable=False)
    month = Column(Integer, nullable=False)  # 1-12
    year = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'month', 'year', 'category', name='budgets_user_id_month_year_category_key'),
    )
