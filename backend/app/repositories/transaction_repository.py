from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.repositories.base_repository import BaseRepository
import app.models as models
from datetime import date

class TransactionRepository(BaseRepository[models.Transaction]):
    def __init__(self, db: Session):
        super().__init__(models.Transaction, db)

    def get_by_user(self, user_id: int):
        return self.db.query(models.Transaction).join(models.Account).filter(models.Account.user_id == user_id).all()

    def aggregate_monthly_spending_by_category(self, user_id: int, month: int, year: int) -> dict:
        """
        Efficiently aggregates SUM(amount) grouped by category for a specific month.
        Returns a dictionary mapping category names to total spent.
        """
        results = self.db.query(
            models.Transaction.category,
            func.sum(models.Transaction.amount)
        ).join(models.Account, models.Transaction.account_id == models.Account.id).\
        filter(
            models.Account.user_id == user_id,
            models.Transaction.txn_type == "debit",
            extract('month', models.Transaction.txn_date) == month,
            extract('year', models.Transaction.txn_date) == year
        ).group_by(models.Transaction.category).all()
        
        return {str(cat or "Uncategorized"): float(amt or 0.0) for cat, amt in results}

    def aggregate_category_spending(self, user_id: int, category: str, month: int, year: int) -> float:
        """
        Calculates the SUM of debit transactions for a specific user, category, and month.
        Highly efficient database-level aggregation.
        """
        # We join with accounts to filter by user_id
        total = self.db.query(func.sum(models.Transaction.amount)).\
            join(models.Account, models.Transaction.account_id == models.Account.id).\
            filter(
                models.Account.user_id == user_id,
                models.Transaction.category.ilike(category),
                models.Transaction.txn_type == "debit",
                extract('month', models.Transaction.txn_date) == month,
                extract('year', models.Transaction.txn_date) == year
            ).scalar()
            
        return float(total or 0.0)
