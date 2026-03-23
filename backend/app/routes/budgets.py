from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

import app.models as models
import app.schemas as schemas
from app.database import get_db
from app.dependencies import get_current_user
from app.services.budget_service import BudgetService
from app.routes.transactions import internal_evaluate_budget

router = APIRouter()

@router.get("/spending-by-category")
async def get_spending_by_category(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    m = month or datetime.now().month
    y = year or datetime.now().year
    from app.repositories.transaction_repository import TransactionRepository
    txn_repo = TransactionRepository(db)
    spending = txn_repo.aggregate_monthly_spending_by_category(current_user.id, m, y)
    if "Income" in spending:
        del spending["Income"]
    return {"spending": spending}

@router.post("", response_model=schemas.Budget)
async def create_budget(
    budget: schemas.BudgetCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = db.query(models.Budget).filter(
        models.Budget.user_id == current_user.id,
        models.Budget.category == budget.category,
        models.Budget.month == budget.month,
        models.Budget.year == budget.year
    ).first()

    if existing:
        existing.monthly_limit = budget.monthly_limit
        db_budget = existing
    else:
        db_budget = models.Budget(
            user_id=current_user.id,
            category=budget.category,
            monthly_limit=budget.monthly_limit,
            month=budget.month,
            year=budget.year
        )
        db.add(db_budget)
    db.flush()
    internal_evaluate_budget(db, current_user.id, db_budget.category, db_budget.month, db_budget.year)
    db.commit()
    db.refresh(db_budget)
    return db_budget

@router.get("", response_model=List[schemas.BudgetWithSpent])
async def get_budgets(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    m = month or datetime.now().month
    y = year or datetime.now().year
    budgets = db.query(models.Budget).filter(models.Budget.user_id == current_user.id, models.Budget.month == m, models.Budget.year == y).all()
    budget_service = BudgetService(db)
    result = []
    for budget in budgets:
        evaluation = budget_service.evaluate_category_budget(current_user.id, budget.category, m, y)
        spent = evaluation["spent"] if evaluation else 0.0
        percentage = evaluation["percentage"] if evaluation else 0.0
        remaining = float(budget.monthly_limit) - spent
        result.append(schemas.BudgetWithSpent(id=budget.id, user_id=budget.user_id, category=budget.category, monthly_limit=budget.monthly_limit, month=budget.month, year=budget.year, created_at=budget.created_at, spent=spent, remaining=remaining, percentage=percentage))
    return result

@router.put("/{budget_id}", response_model=schemas.Budget)
async def update_budget(
    budget_id: int,
    budget_update: schemas.BudgetCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    budget = db.query(models.Budget).filter(models.Budget.id == budget_id, models.Budget.user_id == current_user.id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    budget.category = budget_update.category
    budget.monthly_limit = budget_update.monthly_limit
    budget.month = budget_update.month
    budget.year = budget_update.year
    db.flush()
    internal_evaluate_budget(db, current_user.id, budget.category, budget.month, budget.year)
    db.commit()
    db.refresh(budget)
    return budget

@router.delete("/{budget_id}")
async def delete_budget(
    budget_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    budget = db.query(models.Budget).filter(models.Budget.id == budget_id, models.Budget.user_id == current_user.id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    db.delete(budget)
    db.commit()
    return {"message": "Budget deleted successfully"}
