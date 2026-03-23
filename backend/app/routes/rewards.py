from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone

import app.models as models
import app.schemas as schemas
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter()

@router.get("/", response_model=List[schemas.RewardResponse])
async def get_rewards(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.Reward).filter(models.Reward.user_id == current_user.id).all()

@router.post("/", response_model=schemas.RewardResponse, status_code=status.HTTP_201_CREATED)
async def create_reward(
    reward: schemas.RewardCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_reward = models.Reward(
        user_id=current_user.id,
        program_name=reward.program_name,
        points_balance=reward.points_balance
    )
    db.add(db_reward)
    db.commit()
    db.refresh(db_reward)
    return db_reward

@router.put("/{reward_id}", response_model=schemas.RewardResponse)
async def update_reward(
    reward_id: int,
    reward_update: schemas.RewardUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_reward = db.query(models.Reward).filter(models.Reward.id == reward_id, models.Reward.user_id == current_user.id).first()
    if not db_reward:
        raise HTTPException(status_code=404, detail="Reward program not found")
    
    update_data = reward_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_reward, key, value)
    
    db.commit()
    db.refresh(db_reward)
    return db_reward

@router.post("/redeem")
async def redeem_reward(
    payload: schemas.RewardRedeem,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reward = db.query(models.Reward).filter(
        models.Reward.id == payload.reward_id,
        models.Reward.user_id == current_user.id
    ).first()
    
    if not reward:
        raise HTTPException(status_code=404, detail="Reward program not found")
        
    if payload.redemption_type == "money":
        if not payload.account_id or not payload.points:
            raise HTTPException(status_code=400, detail="account_id and points required for money redemption")
            
        money_amount = round(payload.points / 25, 2)
        if reward.points_balance < payload.points:
            raise HTTPException(status_code=400, detail="Insufficient points")
            
        account = db.query(models.Account).filter(
            models.Account.id == payload.account_id,
            models.Account.user_id == current_user.id
        ).first()
        
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
            
        # Update account balance
        account.balance = float(account.balance) + money_amount
        
        # Create transaction
        db_txn = models.Transaction(
            account_id=account.id,
            txn_type="credit",
            amount=money_amount,
            description=f"Reward redemption: {reward.program_name}",
            category="Income",
            merchant="Reward Program"
        )
        db.add(db_txn)
        
        # Deduct points
        reward.points_balance -= payload.points
        
    elif payload.redemption_type == "bill":
        if not payload.bill_id:
            raise HTTPException(status_code=400, detail="bill_id required for bill redemption")
            
        bill = db.query(models.Bill).filter(
            models.Bill.id == payload.bill_id,
            models.Bill.user_id == current_user.id
        ).first()
        
        if not bill:
            raise HTTPException(status_code=404, detail="Bill not found")
            
        if bill.paid:
            raise HTTPException(status_code=400, detail="Bill is already paid")
            
        points_needed = int(float(bill.amount_due) * 25)
        if reward.points_balance < points_needed:
            raise HTTPException(status_code=400, detail=f"Insufficient points. Need {points_needed} pts.")
            
        # Mark bill as paid
        bill.status = "paid"
        bill.paid = True
        bill.paid_at = datetime.now(timezone.utc)
        
        # Deduct points
        reward.points_balance -= points_needed
        
    else:
        raise HTTPException(status_code=400, detail="Invalid redemption type")
        
    db.commit()
    return {"message": "Redemption successful", "new_balance": reward.points_balance}
