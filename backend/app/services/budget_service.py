from sqlalchemy.orm import Session
from datetime import date
import app.models as models
from app.repositories.transaction_repository import TransactionRepository
from app.repositories.budget_repository import BudgetRepository

class BudgetService:
    def __init__(self, db: Session):
        self.db = db
        self.transaction_repo = TransactionRepository(db)
        self.budget_repo = BudgetRepository(db)

    def evaluate_category_budget(self, user_id: int, category: str, month: int = None, year: int = None):
        """
        Recalculates SUM(amount) for the affected category and checks against limit.
        Only the specified category is recalculated to maintain high performance.
        """
        if not category or category == "Income":
            return None

        from datetime import datetime
        today = datetime.utcnow()
        m = month if month is not None else today.month
        y = year if year is not None else today.year

        # 1. Fetch the budget definition
        budget = self.budget_repo.get_user_budget_for_category(user_id, category, m, y)
        if not budget:
            return None

        # 2. Perform high-performance DB aggregation
        total_spent = self.transaction_repo.aggregate_category_spending(user_id, category, m, y)

        # 3. Validation & Integrity Check
        # Ensure we handle negative values or abnormal states gracefully
        total_spent = max(0.0, total_spent)

        limit = float(budget.monthly_limit)
        
        # Calculate progress percentage with strict rules:
        # 1. Prevent division by zero (return 0 if limit is 0)
        # 2. Round to 2 decimal places
        # 3. Handle math on backend as per requirements
        percentage = 0.0
        if limit > 0:
            percentage = round((total_spent / limit) * 100, 2)
        
        return {
            "category": category,
            "month": m,
            "year": y,
            "spent": total_spent,
            "limit": limit,
            "exceeded": total_spent > limit,
            "percentage": percentage
        }
