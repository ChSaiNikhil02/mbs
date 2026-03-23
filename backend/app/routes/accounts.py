from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import app.models as models
import app.schemas as schemas
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter()

@router.post("/", response_model=schemas.Account)
async def create_user_account(
    account: schemas.AccountCreate, 
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    db_account = models.Account(
        user_id=current_user.id,
        account_number=account.account_number,
        account_type=account.account_type,
        balance=account.balance or 0.00
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

@router.get("/{account_id}/transactions/", response_model=List[schemas.Transaction])
async def read_account_transactions(
    account_id: int, 
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    account = db.query(models.Account).filter(
        models.Account.id == account_id, 
        models.Account.user_id == current_user.id
    ).first()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found or not owned by user")
    
    transactions = db.query(models.Transaction).filter(models.Transaction.account_id == account_id).all()
    return transactions
