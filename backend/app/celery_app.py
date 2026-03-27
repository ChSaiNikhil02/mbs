from celery import Celery
from app.config import settings

celery_app = Celery(
    "worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_BROKER_URL
)

celery_app.conf.task_routes = {
    "app.tasks.bill_reminders.*": "main-queue",
}

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

from celery.schedules import crontab

celery_app.conf.beat_schedule = {
    "check-bills-every-morning": {
        "task": "app.tasks.bill_reminders.check_upcoming_bills",
        "schedule": crontab(hour=11, minute=0), # 4:30 PM IST
    },
    "comprehensive-alert-scan-every-6-hours": {
        "task": "app.tasks.alert_tasks.run_comprehensive_alert_scan",
        "schedule": crontab(minute=0, hour="*/6"), # Every 6 hours
    },
}

# Optional: Automatic task discovery
celery_app.autodiscover_tasks(["app.tasks"])
