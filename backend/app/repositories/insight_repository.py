from sqlalchemy.orm import Session
from sqlalchemy import func, extract, desc, and_
import app.models as models
from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta

class InsightRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_cashflow(self, user_id: int, start_date: Optional[date] = None, end_date: Optional[date] = None) -> List[Dict[str, Any]]:
        """
        Optimized query for Cashflow (Monthly Income vs Expense).
        Uses DATE_TRUNC for efficient grouping.
        """
        query = self.db.query(
            func.date_trunc('month', models.Transaction.txn_date).label('month'),
            models.Transaction.txn_type,
            func.sum(models.Transaction.amount).label('total_amount')
        ).join(models.Account, models.Transaction.account_id == models.Account.id) \
         .filter(models.Account.user_id == user_id)

        if start_date:
            query = query.filter(models.Transaction.txn_date >= start_date)
        if end_date:
            query = query.filter(models.Transaction.txn_date <= end_date)

        results = query.group_by('month', models.Transaction.txn_type) \
         .order_by(desc('month')).all()

        return [
            {
                "month": r.month.strftime("%Y-%m-%d") if r.month else None,
                "txn_type": r.txn_type,
                "total_amount": float(r.total_amount)
            } for r in results
        ]

    def get_category_spend(self, user_id: int, start_date: Optional[date] = None, end_date: Optional[date] = None) -> List[Dict[str, Any]]:
        """
        Optimized query for Category Spend.
        Filters for debit transactions only.
        """
        query = self.db.query(
            models.Transaction.category,
            func.sum(models.Transaction.amount).label('total_amount')
        ).join(models.Account, models.Transaction.account_id == models.Account.id) \
         .filter(
             models.Account.user_id == user_id,
             models.Transaction.txn_type == 'debit'
         )

        if start_date:
            query = query.filter(models.Transaction.txn_date >= start_date)
        if end_date:
            query = query.filter(models.Transaction.txn_date <= end_date)

        results = query.group_by(models.Transaction.category) \
         .order_by(desc('total_amount')).all()

        return [
            {
                "category": r.category or "Uncategorized",
                "total_amount": float(r.total_amount)
            } for r in results
        ]

    def get_top_merchants(self, user_id: int, limit: int = 10, start_date: Optional[date] = None, end_date: Optional[date] = None) -> List[Dict[str, Any]]:
        """
        Optimized query for Top Merchants by spending.
        """
        query = self.db.query(
            models.Transaction.merchant,
            func.sum(models.Transaction.amount).label('total_amount')
        ).join(models.Account, models.Transaction.account_id == models.Account.id) \
         .filter(
             models.Account.user_id == user_id,
             models.Transaction.txn_type == 'debit'
         )

        if start_date:
            query = query.filter(models.Transaction.txn_date >= start_date)
        if end_date:
            query = query.filter(models.Transaction.txn_date <= end_date)

        results = query.group_by(models.Transaction.merchant) \
         .order_by(desc('total_amount')) \
         .limit(limit).all()

        return [
            {
                "merchant": r.merchant or "Unknown",
                "total_amount": float(r.total_amount)
            } for r in results
        ]

    def get_burn_rate(self, user_id: int) -> Dict[str, Any]:
        """
        Calculates burn rate for the current month.
        Burn rate = Total Spent / Budget Base.
        Budget Base = Max(Total Budgeted, Total Income) for the month.
        If both are 0, it uses a minimal 1.0 to avoid division by zero.
        """
        now = datetime.utcnow()
        current_month = now.month
        current_year = now.year
        
        # 1. Get total budgeted for this month
        total_budget = self.db.query(func.sum(models.Budget.monthly_limit)) \
            .filter(
                models.Budget.user_id == user_id,
                models.Budget.month == current_month,
                models.Budget.year == current_year
            ).scalar() or 0.0
            
        # 2. Get total spent for this month (debits)
        total_spent = self.db.query(func.sum(models.Transaction.amount)) \
            .join(models.Account, models.Transaction.account_id == models.Account.id) \
            .filter(
                models.Account.user_id == user_id,
                models.Transaction.txn_type == 'debit',
                extract('month', models.Transaction.txn_date) == current_month,
                extract('year', models.Transaction.txn_date) == current_year
            ).scalar() or 0.0

        # 3. Get total income for this month (credits) - Fallback base
        total_income = self.db.query(func.sum(models.Transaction.amount)) \
            .join(models.Account, models.Transaction.account_id == models.Account.id) \
            .filter(
                models.Account.user_id == user_id,
                models.Transaction.txn_type == 'credit',
                extract('month', models.Transaction.txn_date) == current_month,
                extract('year', models.Transaction.txn_date) == current_year
            ).scalar() or 0.0
            
        # 4. Calculate pacing
        import calendar
        _, last_day = calendar.monthrange(current_year, current_month)
        days_passed = now.day
        month_progress = (days_passed / last_day) * 100 if last_day > 0 else 0
        
        # The logic: Use the higher of total_budget or total_income as the basis
        # This prevents 300%+ percentages if the user hasn't set up all category budgets
        budget_base = max(float(total_budget), float(total_income))
        
        # Avoid division by zero
        if budget_base <= 0:
            budget_usage = 0.0
            # If no budget and no income, but there is spending, use spending as base to show 100%
            if total_spent > 0:
                budget_base = float(total_spent)
                budget_usage = 100.0
        else:
            budget_usage = (float(total_spent) / budget_base) * 100
        
        return {
            "total_budget": float(budget_base), # We return the effective base
            "total_spent": float(total_spent),
            "budget_usage_percent": round(budget_usage, 2),
            "month_progress_percent": round(month_progress, 2),
            "is_over_pacing": budget_usage > month_progress,
            "daily_burn_rate": round(float(total_spent) / days_passed, 2) if days_passed > 0 else 0.0
        }
