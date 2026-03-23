from datetime import datetime, timedelta
from app.celery_app import celery_app
from app.database import SessionLocal
import app.models as models
from app.services.alert_service import AlertService

@celery_app.task(name="app.tasks.bill_reminders.check_upcoming_bills")
def check_upcoming_bills():
    """
    Background job to identify bills due within 2 days and create in-app alerts.
    """
    db = SessionLocal()
    try:
        alert_service = AlertService(db)
        # We look for bills due on or before the threshold (today + 2 days) that aren't paid yet
        # This includes overdue bills to ensure the user is alerted until they pay.
        today = datetime.utcnow().date()
        threshold = today + timedelta(days=2)
        
        upcoming_bills = db.query(models.Bill).filter(
            models.Bill.due_date <= threshold,
            models.Bill.status != "paid",
            models.Bill.paid == False
        ).all()
        
        for bill in upcoming_bills:
            # Create in-app notification
            alert_service.create_bill_reminder(
                user_id=bill.user_id,
                biller_name=bill.biller_name,
                due_date=bill.due_date.strftime("%Y-%m-%d"),
                amount=float(bill.amount_due)
            )
            # Log reminder or send Email/SMS if integrated
            print(f"Reminder sent for bill {bill.id} to user {bill.user_id}")
            
        db.commit()
    except Exception as e:
        print(f"Error in bill reminder task: {e}")
        db.rollback()
    finally:
        db.close()
