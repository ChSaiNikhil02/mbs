from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

class Reward(Base):
    __tablename__ = "rewards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    program_name = Column(String(100), nullable=False)
    points_balance = Column(Integer, default=0, nullable=False)
    last_updated = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), onupdate=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    user = relationship("User")
