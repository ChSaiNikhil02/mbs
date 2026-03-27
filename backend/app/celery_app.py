from celery import Celery
from celery.schedules import crontab
from app.config import settings

celery_app = Celery(
    "worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_BROKER_URL
)

# Use IST Timezone directly to avoid math errors
celery_app.conf.timezone = 'Asia/Kolkata'
celery_app.conf.enable_utc = False

celery_app.conf.task_routes = {
    "app.tasks.bill_reminders.*": "main-queue",
}

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
)

celery_app.conf.beat_schedule = {
    # This runs every 1 minute so we can see if Celery is alive in the logs
    "celery-heartbeat-every-minute": {
        "task": "app.tasks.bill_reminders.check_upcoming_bills",
        "schedule": 60.0, 
    },
    "check-bills-ist-afternoon": {
        "task": "app.tasks.bill_reminders.check_upcoming_bills",
        "schedule": crontab(hour=17, minute=25), # 5:25 PM IST
    },
    "comprehensive-alert-scan-every-6-hours": {
        "task": "app.tasks.alert_tasks.run_comprehensive_alert_scan",
        "schedule": crontab(minute=0, hour="*/6"),
    },
}

celery_app.autodiscover_tasks(["app.tasks"], force=True)
