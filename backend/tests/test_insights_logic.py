import pytest
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import Base
from app.models import User, Account, Transaction, Budget
from app.repositories.insight_repository import InsightRepository
from datetime import datetime, date, timedelta
from dotenv import load_dotenv

load_dotenv()

# Use a test database if possible, or connect to the dev one for verification
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_insights_aggregation_logic():
    db = TestingSessionLocal()
    repo = InsightRepository(db)
    
    # 1. Setup Test Data
    user = db.query(User).first()
    if not user:
        print("No user found in database to run insights verification. Skipping.")
        db.close()
        return
    
    print(f"\nVerifying Insights for User ID: {user.id}")
    
    # 2. Verify Cashflow
    cashflow = repo.get_cashflow(user.id)
    assert isinstance(cashflow, list)
    print(f"  - Cashflow records found: {len(cashflow)}")
    if cashflow:
        assert "month" in cashflow[0]
        assert "txn_type" in cashflow[0]
        assert "total_amount" in cashflow[0]

    # 3. Verify Category Spend
    category_spend = repo.get_category_spend(user.id)
    assert isinstance(category_spend, list)
    print(f"  - Category spend records found: {len(category_spend)}")
    if category_spend:
        assert "category" in category_spend[0]
        assert "total_amount" in category_spend[0]

    # 4. Verify Top Merchants
    top_merchants = repo.get_top_merchants(user.id)
    assert isinstance(top_merchants, list)
    print(f"  - Top merchant records found: {len(top_merchants)}")
    if top_merchants:
        assert "merchant" in top_merchants[0]
        assert "total_amount" in top_merchants[0]

    # 5. Verify Burn Rate
    burn_rate = repo.get_burn_rate(user.id)
    assert isinstance(burn_rate, dict)
    print(f"  - Burn rate data: {burn_rate}")
    assert "total_budget" in burn_rate
    assert "total_spent" in burn_rate
    assert "budget_usage_percent" in burn_rate

    db.close()
    print("\nSUCCESS: Insights aggregation logic verified.")

if __name__ == "__main__":
    test_insights_aggregation_logic()
