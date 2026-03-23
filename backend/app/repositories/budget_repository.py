from sqlalchemy.orm import Session
from app.repositories.base_repository import BaseRepository
import app.models as models
from typing import Optional

class BudgetRepository(BaseRepository[models.Budget]):
    def __init__(self, db: Session):
        super().__init__(models.Budget, db)

    def get_user_budget_for_category(self, user_id: int, category: str, month: int, year: int) -> Optional[models.Budget]:
        """Fetches a specific budget record for a user/category/month (case-insensitive)."""
        return self.db.query(models.Budget).filter(
            models.Budget.user_id == user_id,
            models.Budget.category.ilike(category),
            models.Budget.month == month,
            models.Budget.year == year
        ).first()
