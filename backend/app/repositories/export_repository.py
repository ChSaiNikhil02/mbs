from sqlalchemy.orm import Session
from sqlalchemy import func, extract, desc, and_
import app.models as models
from typing import List, Dict, Any
from datetime import datetime

class ExportRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_transactions_for_export(self, user_id: int) -> List[Dict[str, Any]]:
        """
        Fetches all transactions for a user, structured for CSV/PDF export.
        Ordered by date descending.
        """
        results = self.db.query(
            models.Transaction.txn_date.label("Date"),
            models.Transaction.description.label("Description"),
            models.Transaction.merchant.label("Merchant"),
            models.Transaction.category.label("Category"),
            models.Transaction.txn_type.label("Type"),
            models.Transaction.amount.label("Amount"),
            models.Transaction.currency.label("Currency"),
            models.Account.bank_name.label("Account")
        ).join(models.Account, models.Transaction.account_id == models.Account.id) \
         .filter(models.Account.user_id == user_id) \
         .order_by(desc(models.Transaction.txn_date)).all()

        return [r._asdict() for r in results]

    def get_budget_summary_for_export(self, user_id: int, month: int, year: int) -> List[Dict[str, Any]]:
        """
        Structured query for Budget Summary export.
        Joins budget limits with actual spent amounts.
        """
        # Subquery for spending per category
        spent_subquery = self.db.query(
            models.Transaction.category.label("cat"),
            func.sum(models.Transaction.amount).label("total_spent")
        ).join(models.Account, models.Transaction.account_id == models.Account.id) \
         .filter(
             models.Account.user_id == user_id,
             models.Transaction.txn_type == 'debit',
             extract('month', models.Transaction.txn_date) == month,
             extract('year', models.Transaction.txn_date) == year
         ).group_by(models.Transaction.category).subquery()

        results = self.db.query(
            models.Budget.category.label("Category"),
            models.Budget.monthly_limit.label("Monthly_Limit"),
            func.coalesce(spent_subquery.c.total_spent, 0).label("Spent"),
            (models.Budget.monthly_limit - func.coalesce(spent_subquery.c.total_spent, 0)).label("Remaining")
        ).outerjoin(spent_subquery, models.Budget.category == spent_subquery.c.cat) \
         .filter(
             models.Budget.user_id == user_id,
             models.Budget.month == month,
             models.Budget.year == year
         ).order_by(desc("Spent")).all()

        return [
            {
                "Category": r.Category,
                "Monthly_Limit": float(r.Monthly_Limit),
                "Spent": float(r.Spent),
                "Remaining": float(r.Remaining),
                "Usage_Percent": round((float(r.Spent) / float(r.Monthly_Limit)) * 100, 2) if float(r.Monthly_Limit) > 0 else 0
            } for r in results
        ]

    def get_insights_summary_for_export(self, user_id: int) -> Dict[str, Any]:
        """
        Aggregated insights summary for executive report exports.
        """
        # Category breakdown (All time)
        category_summary = self.db.query(
            models.Transaction.category.label("Category"),
            func.sum(models.Transaction.amount).label("Total_Spent")
        ).join(models.Account, models.Transaction.account_id == models.Account.id) \
         .filter(
             models.Account.user_id == user_id,
             models.Transaction.txn_type == 'debit'
         ).group_by(models.Transaction.category) \
         .order_by(desc("Total_Spent")).all()

        # Monthly Trends
        from sqlalchemy import case
        monthly_summary = self.db.query(
            func.date_trunc('month', models.Transaction.txn_date).label("Month"),
            func.sum(case((models.Transaction.txn_type == 'credit', models.Transaction.amount), else_=0)).label("Income"),
            func.sum(case((models.Transaction.txn_type == 'debit', models.Transaction.amount), else_=0)).label("Expense")
        ).join(models.Account, models.Transaction.account_id == models.Account.id) \
         .filter(models.Account.user_id == user_id) \
         .group_by("Month").order_by(desc("Month")).limit(12).all()

        return {
            "category_breakdown": [{"Category": r.Category or "Uncategorized", "Total_Spent": float(r.Total_Spent)} for r in category_summary],
            "monthly_trends": [{
                "Month": r.Month.strftime("%b %Y") if r.Month else "Unknown",
                "Income": float(r.Income),
                "Expense": float(r.Expense),
                "Net_Savings": float(r.Income - r.Expense)
            } for r in monthly_summary]
        }
