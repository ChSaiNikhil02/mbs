from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import app.models as models
import app.schemas as schemas
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter()

@router.get("/")
async def get_categories():
    return {"categories": schemas.PREDEFINED_CATEGORIES}

@router.post("/rules", response_model=schemas.CategoryRule)
async def create_category_rule(
    rule: schemas.CategoryRuleCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_rule = models.CategoryRule(
        user_id=current_user.id,
        keyword=rule.keyword,
        merchant_name=rule.merchant_name,
        category=rule.category
    )
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule

@router.get("/rules", response_model=List[schemas.CategoryRule])
async def get_category_rules(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.CategoryRule).filter(models.CategoryRule.user_id == current_user.id).all()

@router.put("/rules/{rule_id}", response_model=schemas.CategoryRule)
async def update_category_rule(
    rule_id: int,
    rule_update: schemas.CategoryRuleCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rule = db.query(models.CategoryRule).filter(models.CategoryRule.id == rule_id, models.CategoryRule.user_id == current_user.id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    rule.keyword = rule_update.keyword
    rule.merchant_name = rule_update.merchant_name
    rule.category = rule_update.category
    db.commit()
    db.refresh(rule)
    return rule

@router.delete("/rules/{rule_id}")
async def delete_category_rule(
    rule_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rule = db.query(models.CategoryRule).filter(models.CategoryRule.id == rule_id, models.CategoryRule.user_id == current_user.id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.delete(rule)
    db.commit()
    return {"message": "Rule deleted successfully"}

@router.post("/apply-rules")
async def apply_category_rules(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rules = db.query(models.CategoryRule).filter(models.CategoryRule.user_id == current_user.id).all()
    user_accounts = db.query(models.Account).filter(models.Account.user_id == current_user.id).all()
    account_ids = [account.id for account in user_accounts]
    transactions = db.query(models.Transaction).filter(models.Transaction.account_id.in_(account_ids)).all()
    
    updated_count = 0
    for txn in transactions:
        is_credit = txn.txn_type == "credit"
        for rule in rules:
            if rule.category == "Income" and not is_credit:
                continue
            if rule.keyword and rule.keyword.lower() in (txn.description or "").lower():
                if txn.category != rule.category:
                    txn.category = rule.category
                    updated_count += 1
                break
    if updated_count > 0:
        db.commit()
    return {"message": f"Successfully updated {updated_count} transactions based on rules."}
