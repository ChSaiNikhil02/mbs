from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.database import engine, Base
from app.routes import auth, users, accounts, transactions, budgets, categories, alerts, bills, rewards, currency, insights, exports

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Modern Digital Banking API")

# Configure CORS
origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://localhost:8080",
    "https://mbs-production.up.railway.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(accounts.router, prefix="/accounts", tags=["Accounts"])
app.include_router(transactions.router, prefix="/transactions", tags=["Transactions"])
app.include_router(budgets.router, prefix="/api/budgets", tags=["Budgets"])
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(bills.router, prefix="/api/bills", tags=["Bills"])
app.include_router(rewards.router, prefix="/api/rewards", tags=["Rewards"])
app.include_router(currency.router, prefix="/api/currency", tags=["Currency"])
app.include_router(insights.router, prefix="/api/insights", tags=["Insights"])
app.include_router(exports.router, tags=["Exports"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Modern Digital Banking Backend!"}
