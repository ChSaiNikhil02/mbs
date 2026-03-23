from app.celery_app import celery_app
from app.database import SessionLocal
import app.models as models
from app.services.alert_service import AlertService
import logging

logger = logging.getLogger("banking-worker")

@celery_app.task(name="app.tasks.alert_tasks.run_comprehensive_alert_scan")
def run_comprehensive_alert_scan():
    """
    Milestone 4 - Step 4: Comprehensive Automation
    Iterates through all users and runs the alert brain.
    Runs on a schedule (e.g., every 6 hours).
    """
    db = SessionLocal()
    try:
        alert_service = AlertService(db)
        users = db.query(models.User).all()
        
        total_triggered = 0
        for user in users:
            count = alert_service.run_full_alert_scan(user.id)
            total_triggered += count
            
        db.commit()
        logger.info(f"Comprehensive alert scan complete. Triggered {total_triggered} alerts across {len(users)} users.")
        return total_triggered
    except Exception as e:
        logger.error(f"Error in comprehensive alert scan: {e}")
        db.rollback()
    finally:
        db.close()
