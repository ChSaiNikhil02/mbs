from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Any, Optional
from datetime import date
from app.database import get_db
from app.dependencies import get_current_user
import app.models as models
from app.repositories.insight_repository import InsightRepository

router = APIRouter()

@router.get("/cash-flow")
@router.get("/cashflow")
async def get_cashflow(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    repo = InsightRepository(db)
    return repo.get_cashflow(current_user.id, start_date, end_date)

@router.get("/category-spend")
async def get_category_spend(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    repo = InsightRepository(db)
    return repo.get_category_spend(current_user.id, start_date, end_date)

@router.get("/top-merchants")
async def get_top_merchants(
    limit: int = Query(10, ge=1, le=50),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    repo = InsightRepository(db)
    return repo.get_top_merchants(current_user.id, limit, start_date, end_date)

@router.get("/burn-rate")
async def get_burn_rate(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    repo = InsightRepository(db)
    return repo.get_burn_rate(current_user.id)
