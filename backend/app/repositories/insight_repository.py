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
        Calculates financial health in two parts:
        1. Cashflow: Total Income vs Total Spending (Debits)
        2. Budget Adherence: Total of set Budgets vs Spending in those specific categories
        """
        now = datetime.utcnow()
        current_month = now.month
        current_year = now.year
        
        # 1. Total Income (Credits)
        total_income = self.db.query(func.sum(models.Transaction.amount)) \
            .join(models.Account, models.Transaction.account_id == models.Account.id) \
            .filter(
                models.Account.user_id == user_id,
                models.Transaction.txn_type == 'credit',
                extract('month', models.Transaction.txn_date) == current_month,
                extract('year', models.Transaction.txn_date) == current_year
            ).scalar() or 0.0

        # 2. Total Spending (All Debits)
        total_spent = self.db.query(func.sum(models.Transaction.amount)) \
            .join(models.Account, models.Transaction.account_id == models.Account.id) \
            .filter(
                models.Account.user_id == user_id,
                models.Transaction.txn_type == 'debit',
                extract('month', models.Transaction.txn_date) == current_month,
                extract('year', models.Transaction.txn_date) == current_year
            ).scalar() or 0.0
            
        # 3. Budget Adherence (Sum of budgets vs Spending in those categories only)
        # Get categories that have a budget
        budgets = self.db.query(models.Budget.category, models.Budget.monthly_limit) \
            .filter(
                models.Budget.user_id == user_id,
                models.Budget.month == current_month,
                models.Budget.year == current_year
            ).all()
        
        total_budgeted_limit = sum(float(b.monthly_limit) for b in budgets)
        budgeted_categories = [b.category for b in budgets]
        
        spent_on_budgeted_categories = 0.0
        if budgeted_categories:
            spent_on_budgeted_categories = self.db.query(func.sum(models.Transaction.amount)) \
                .join(models.Account, models.Transaction.account_id == models.Account.id) \
                .filter(
                    models.Account.user_id == user_id,
                    models.Transaction.txn_type == 'debit',
                    models.Transaction.category.in_(budgeted_categories),
                    extract('month', models.Transaction.txn_date) == current_month,
                    extract('year', models.Transaction.txn_date) == current_year
                ).scalar() or 0.0

        # Calculate Pacing
        import calendar
        _, last_day = calendar.monthrange(current_year, current_month)
        days_passed = now.day
        month_progress = (days_passed / last_day) * 100 if last_day > 0 else 0
        
        return {
            "cashflow": {
                "income": float(total_income),
                "spent": float(total_spent),
                "usage_percent": round((float(total_spent) / float(total_income) * 100), 2) if total_income > 0 else 0,
                "is_over_pacing": (float(total_spent) / float(total_income) * 100) > month_progress if total_income > 0 else False
            },
            "budget_adherence": {
                "limit": float(total_budgeted_limit),
                "spent": float(spent_on_budgeted_categories),
                "usage_percent": round((float(spent_on_budgeted_categories) / float(total_budgeted_limit) * 100), 2) if total_budgeted_limit > 0 else 0,
                "is_over_pacing": (float(spent_on_budgeted_categories) / float(total_budgeted_limit) * 100) > month_progress if total_budgeted_limit > 0 else False
            },
            "month_progress_percent": round(month_progress, 2),
            "daily_burn_rate": round(float(total_spent) / days_passed, 2) if days_passed > 0 else 0.0
        }
