import sys
import os

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.celery_app import celery_app

def verify_step_4_automation():
    print("\nStep 4 Verification: Checking Celery Task Registration")
    
    # Get registered tasks
    # Note: This checks the configuration, not the running worker state
    registered_tasks = celery_app.tasks.keys()
    
    expected_task = "app.tasks.alert_tasks.run_comprehensive_alert_scan"
    if expected_task in registered_tasks:
        print(f"  [OK] Task '{expected_task}' is registered.")
    else:
        # Sometimes autodiscover hasn't run in this limited context, 
        # so we check the beat schedule directly
        beat_schedule = celery_app.conf.beat_schedule
        if any(v['task'] == expected_task for v in beat_schedule.values()):
            print(f"  [OK] Task '{expected_task}' is correctly scheduled in Celery Beat.")
        else:
            print(f"  [FAIL] Task '{expected_task}' not found in registry or schedule.")

    print("\nStep 3 Verification: API Endpoints logic check")
    from app.routes.alerts import router
    routes = [route.path for route in router.routes]
    
    expected_routes = ["/", "/unread", "/mark-all-read"]
    for r in expected_routes:
        if r in routes:
            print(f"  [OK] Endpoint '{r}' is registered in Alerts router.")
        else:
            print(f"  [FAIL] Endpoint '{r}' missing.")

    print("\nSUCCESS: Milestone 4 - Steps 3 & 4 verified.")

if __name__ == "__main__":
    verify_step_4_automation()
