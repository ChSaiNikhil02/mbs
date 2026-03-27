from celery import Celery
from celery.schedules import crontab
from app.config import settings
import os

broker_url = settings.CELERY_BROKER_URL

celery_app = Celery(
    "worker",
    broker=broker_url,
    backend=broker_url,
    include=['app.tasks.bill_reminders', 'app.tasks.alert_tasks']
)

celery_app.conf.update(
    broker_url=broker_url,
    result_backend=broker_url,
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone='Asia/Kolkata',
    enable_utc=False,
)

celery_app.conf.beat_schedule = {
    # Main Daily Bill Check at 9 AM IST
    "check-bills-daily-9am": {
        "task": "app.tasks.bill_reminders.check_upcoming_bills",
        "schedule": crontab(hour=9, minute=0),
    },
    # Periodic System Health Scan (Balances, Budgets)
    "comprehensive-alert-scan-every-6-hours": {
        "task": "app.tasks.alert_tasks.run_comprehensive_alert_scan",
        "schedule": crontab(minute=0, hour="*/6"),
    },
}
