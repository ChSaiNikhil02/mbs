from sqlalchemy.orm import Session
import app.models as models

class AlertService:
    def __init__(self, db: Session):
        self.db = db

    def create_budget_alert(self, user_id: int, category: str, spent: float, limit: float):
        alert_msg = f"Budget exceeded for {category}! Spent: ₹{spent:.2f}, Limit: ₹{limit:.2f}"
        
        existing = self.db.query(models.Alert).filter(
            models.Alert.user_id == user_id,
            models.Alert.type == "budget_exceeded",
            models.Alert.message == alert_msg
        ).first()
        
        if not existing:
            new_alert = models.Alert(
                user_id=user_id,
                type="budget_exceeded",
                message=alert_msg,
                is_read=False
            )
            self.db.add(new_alert)
            # Removed commit to maintain atomicity in parent workflow
            return new_alert
        return existing

    def create_bill_reminder(self, user_id: int, biller_name: str, due_date: str, amount: float):
        alert_msg = f"Reminder: Bill for {biller_name} is due on {due_date}. Amount: ₹{amount:.2f}"
        
        existing = self.db.query(models.Alert).filter(
            models.Alert.user_id == user_id,
            models.Alert.type == "bill_due",
            models.Alert.message == alert_msg
        ).first()
        
        if not existing:
            new_alert = models.Alert(
                user_id=user_id,
                type="bill_due",
                message=alert_msg,
                is_read=False
            )
            self.db.add(new_alert)
            return new_alert
        return existing

    def create_low_balance_alert(self, user_id: int, account_number: str, balance: float):
        """Triggers an alert when an account balance falls below ₹1000."""
        alert_msg = f"Low Balance Alert: Account {account_number} is down to ₹{balance:.2f}."
        
        # Check if a similar unread alert exists to prevent spam
        existing = self.db.query(models.Alert).filter(
            models.Alert.user_id == user_id,
            models.Alert.type == "low_balance",
            models.Alert.is_read == False
        ).first()
        
        if not existing:
            new_alert = models.Alert(
                user_id=user_id,
                type="low_balance",
                message=alert_msg,
                is_read=False
            )
            self.db.add(new_alert)
            return new_alert
        return existing

    def run_full_alert_scan(self, user_id: int):
        """
        Milestone 4 - Step 2: Consolidated Brain
        Scans all conditions (Balance, Budget, Bills) and generates alerts.
        """
        triggered_count = 0
        
        # 1. Check Low Balances (< ₹1000)
        accounts = self.db.query(models.Account).filter(models.Account.user_id == user_id).all()
        for acc in accounts:
            if float(acc.balance) < 1000:
                if self.create_low_balance_alert(user_id, acc.account_number, float(acc.balance)):
                    triggered_count += 1

        # 2. Check Budget Limits (Current Month)
        from app.services.budget_service import BudgetService
        from datetime import datetime
        budget_service = BudgetService(self.db)
        now = datetime.utcnow()
        
        budgets = self.db.query(models.Budget).filter(
            models.Budget.user_id == user_id,
            models.Budget.month == now.month,
            models.Budget.year == now.year
        ).all()
        
        for budget in budgets:
            eval_result = budget_service.evaluate_category_budget(user_id, budget.category, now.month, now.year)
            if eval_result and eval_result.get("exceeded"):
                if self.create_budget_alert(user_id, budget.category, eval_result["spent"], eval_result["limit"]):
                    triggered_count += 1

        # 3. Check Bill Due Reminders (Due in next 3 days)
        from datetime import date, timedelta
        threshold = date.today() + timedelta(days=3)
        upcoming_bills = self.db.query(models.Bill).filter(
            models.Bill.user_id == user_id,
            models.Bill.due_date <= threshold,
            models.Bill.paid == False,
            models.Bill.status != "paid"
        ).all()
        
        for bill in upcoming_bills:
            if self.create_bill_reminder(user_id, bill.biller_name, bill.due_date.strftime("%Y-%m-%d"), float(bill.amount_due)):
                triggered_count += 1
        
        return triggered_count
