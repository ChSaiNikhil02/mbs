from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import date, timedelta

import app.models as models
import app.schemas as schemas
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter()

@router.get("/me/", response_model=schemas.UserInDB)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.patch("/me/", response_model=schemas.UserInDB)
async def update_users_me(
    user_update: schemas.UserUpdate, 
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if user_update.address is not None:
        current_user.address = user_update.address
    if user_update.phone is not None:
        current_user.phone = user_update.phone
    if user_update.email_notifications is not None:
        current_user.email_notifications = user_update.email_notifications
    if user_update.sms_notifications is not None:
        current_user.sms_notifications = user_update.sms_notifications
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/me/transactions/summary", response_model=List[schemas.MonthlySummary])
async def get_transaction_summary(
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    today = date.today()
    summaries = []
    
    user_accounts = db.query(models.Account).filter(models.Account.user_id == current_user.id).all()
    account_ids = [account.id for account in user_accounts]
    
    if not account_ids:
        for i in range(5, -1, -1):
            d = today - timedelta(days=i*30)
            summaries.append(schemas.MonthlySummary(month=d.strftime("%b"), credit=0, debit=0))
        return summaries

    for i in range(5, -1, -1):
        first_day_of_month = date(today.year if today.month > i else today.year - 1, 
                                 (today.month - i - 1) % 12 + 1, 1)
        
        if first_day_of_month.month == 12:
            next_month = date(first_day_of_month.year + 1, 1, 1)
        else:
            next_month = date(first_day_of_month.year, first_day_of_month.month + 1, 1)
            
        month_label = first_day_of_month.strftime("%b")
        
        credits_sum = db.query(func.sum(models.Transaction.amount)).filter(
            models.Transaction.account_id.in_(account_ids),
            models.Transaction.txn_type == "credit",
            models.Transaction.txn_date >= first_day_of_month,
            models.Transaction.txn_date < next_month
        ).scalar() or 0
        
        debits_sum = db.query(func.sum(models.Transaction.amount)).filter(
            models.Transaction.account_id.in_(account_ids),
            models.Transaction.txn_type == "debit",
            models.Transaction.txn_date >= first_day_of_month,
            models.Transaction.txn_date < next_month
        ).scalar() or 0
        
        summaries.append(schemas.MonthlySummary(
            month=month_label,
            credit=float(credits_sum),
            debit=float(debits_sum)
        ))
        
    return summaries

@router.get("/me/accounts/", response_model=List[schemas.Account])
async def read_user_accounts(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    accounts = db.query(models.Account).filter(models.Account.user_id == current_user.id).all()
    return accounts
