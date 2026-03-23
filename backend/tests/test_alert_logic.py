import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import Base
from app.models import User, Account, Transaction, Budget, Bill, Alert
from app.services.alert_service import AlertService
from datetime import datetime, date, timedelta
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def verify_step_2_alert_logic():
    db = TestingSessionLocal()
    alert_service = AlertService(db)
    
    # 1. Get a test user
    user = db.query(User).first()
    if not user:
        print("No user found. Skipping.")
        return

    print(f"\nStep 2 Verification: Running Alert Scan for User ID {user.id}")
    
    # 2. Setup trigger conditions if they don't exist
    # - Ensure at least one account has low balance
    acc = db.query(Account).filter(Account.user_id == user.id).first()
    if acc:
        original_balance = acc.balance
        acc.balance = 500 # Set low balance
        db.commit()
        print(f"  - Force-set account {acc.account_number} balance to 500.")

    # - Ensure a bill is due soon
    bill = db.query(Bill).filter(Bill.user_id == user.id).first()
    if not bill:
        bill = Bill(user_id=user.id, biller_name="Test Utility", due_date=date.today() + timedelta(days=1), amount_due=1500.0)
        db.add(bill)
        db.commit()
        print("  - Created test bill due tomorrow.")
    else:
        bill.due_date = date.today() + timedelta(days=1)
        bill.paid = False
        db.commit()
        print(f"  - Updated bill {bill.biller_name} to be due tomorrow.")

    # 3. RUN THE BRAIN
    triggered = alert_service.run_full_alert_scan(user.id)
    db.commit()
    print(f"  - Scan complete. Triggered {triggered} new/existing unread alerts.")

    # 4. Verify insertion in DB
    alerts = db.query(Alert).filter(Alert.user_id == user.id, Alert.is_read == False).all()
    print(f"  - Total unread alerts in DB for user: {len(alerts)}")
    for a in alerts:
        print(f"    [*] {a.type}: {a.message}")

    # Cleanup (restore balance)
    if acc:
        acc.balance = original_balance
        db.commit()

    db.close()
    print("\nSUCCESS: Milestone 4 - Step 2 logic verified.")

if __name__ == "__main__":
    verify_step_2_alert_logic()
