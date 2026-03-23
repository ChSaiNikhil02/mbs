import sys
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app
from app.database import get_db, Base
from app.models import User
from app.dependencies import get_current_user
from dotenv import load_dotenv

load_dotenv()

client = TestClient(app)

# Mock user for edge case testing (User with no data)
class MockUser:
    def __init__(self, id, username):
        self.id = id
        self.username = username
        self.kyc_status = "pending"

def get_mock_user_empty():
    return MockUser(id=999, username="empty_user")

def get_mock_user_existing():
    # We'll try to find a real user with data first, or fallback to ID 7 which we know exists
    return MockUser(id=7, username="sowmya")

def run_qa_suite():
    print("\n--- MILESTONE 4: BACKEND QA & API VALIDATION ---\n")

    # 1. Test Unauthorized Access (401)
    print("1. Testing Unauthorized Access...")
    response = client.get("/api/insights/cashflow")
    assert response.status_code == 401
    print("   [OK] GET /api/insights/cashflow returned 401 as expected.")

    # 2. Testing Edge Cases (User with NO DATA)
    print("\n2. Testing Edge Cases (User with No Data)...")
    app.dependency_overrides[get_current_user] = get_mock_user_empty
    
    # Insights (Empty)
    endpoints = [
        "/api/insights/cashflow",
        "/api/insights/category-spend",
        "/api/insights/top-merchants",
        "/api/insights/burn-rate"
    ]
    for ep in endpoints:
        resp = client.get(ep)
        assert resp.status_code == 200
        data = resp.json()
        if ep == "/api/insights/burn-rate":
            assert data["total_budget"] == 0
            assert data["total_spent"] == 0
        else:
            assert isinstance(data, list)
            assert len(data) == 0
        print(f"   [OK] {ep} handled empty data correctly.")

    # Alerts (Empty)
    resp = client.get("/api/alerts/unread")
    assert resp.status_code == 200
    assert len(resp.json()) == 0
    print("   [OK] GET /api/alerts/unread handled empty data correctly.")

    # 3. Testing Logic Integrity (User with EXISTING DATA)
    print("\n3. Testing Logic Integrity (User with Data)...")
    app.dependency_overrides[get_current_user] = get_mock_user_existing
    
    # Insights (Data)
    resp = client.get("/api/insights/cashflow")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    print(f"   [OK] GET /api/insights/cashflow returned {len(resp.json())} records.")

    # Alerts (Data)
    resp = client.get("/api/alerts/")
    assert resp.status_code == 200
    print(f"   [OK] GET /api/alerts/ returned {len(resp.json())} alerts.")

    # 4. Testing Exports (Format & Headers)
    print("\n4. Testing Exports (CSV/PDF)...")
    
    # Transactions CSV
    resp = client.get("/export/transactions?format=csv")
    assert resp.status_code == 200
    print(f"   [DEBUG] Content-Type: {resp.headers.get('content-type')}")
    print(f"   [DEBUG] Content-Disposition: {resp.headers.get('content-disposition')}")
    assert "text/csv" in resp.headers["content-type"]
    assert "attachment" in resp.headers["content-disposition"]
    print("   [OK] GET /export/transactions?format=csv returned correct headers.")

    # Insights PDF
    resp = client.get("/export/insights?format=pdf")
    assert resp.status_code == 200
    assert "application/pdf" in resp.headers["content-type"]
    print("   [OK] GET /export/insights?format=pdf returned correct headers.")

    # 5. Clean up
    app.dependency_overrides.clear()
    print("\n--- QA SUITE COMPLETE: ALL TESTS PASSED ---\n")

if __name__ == "__main__":
    try:
        run_qa_suite()
    except Exception as e:
        print(f"\n[ERROR] QA Validation Failed: {e}")
        sys.exit(1)
