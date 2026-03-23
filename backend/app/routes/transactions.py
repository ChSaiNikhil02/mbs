from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import logging

import app.models as models
import app.schemas as schemas
from app.database import get_db
from app.dependencies import get_current_user
from app.services.rule_engine import RuleEngine
from app.services.budget_service import BudgetService
from app.services.alert_service import AlertService

logger = logging.getLogger("banking-app")
router = APIRouter()

def internal_apply_rules(db: Session, user_id: int, description: str, merchant: Optional[str], current_category: Optional[str], is_credit: bool):
    rules = db.query(models.CategoryRule).filter(models.CategoryRule.user_id == user_id).all()
    assigned_category = RuleEngine.apply_rules(description, merchant, rules, is_credit)
    if assigned_category == "Uncategorized" and current_category:
        return current_category
    return assigned_category

def internal_evaluate_budget(db: Session, user_id: int, category: str, month: Optional[int] = None, year: Optional[int] = None):
    budget_service = BudgetService(db)
    alert_service = AlertService(db)
    result = budget_service.evaluate_category_budget(user_id, category, month, year)
    if result and result.get("exceeded"):
        logger.warning(f"Budget exceeded for user {user_id}, category {category}")
        alert_service.create_budget_alert(user_id, category, result["spent"], result["limit"])

@router.get("/me/", response_model=List[schemas.Transaction])
async def read_my_transactions(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    user_accounts = db.query(models.Account).filter(models.Account.user_id == current_user.id).all()
    if not user_accounts:
        return []
    account_ids = [account.id for account in user_accounts]
    transactions = db.query(models.Transaction).filter(models.Transaction.account_id.in_(account_ids)).order_by(models.Transaction.txn_date.desc()).all()
    return transactions

@router.post("/", response_model=schemas.Transaction)
async def create_transaction(
    txn_data: schemas.TransactionCreate, 
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    account = db.query(models.Account).filter(models.Account.id == txn_data.account_id, models.Account.user_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found or not owned by user")
    if txn_data.txn_type not in ["credit", "debit"]:
        raise HTTPException(status_code=400, detail="Invalid transaction type")
    if txn_data.txn_type == "debit" and float(account.balance) < txn_data.amount:
        raise HTTPException(status_code=400, detail="Insufficient funds")
    
    try:
        with db.begin_nested():
            final_category = internal_apply_rules(db, current_user.id, txn_data.description, txn_data.merchant, txn_data.category, txn_data.txn_type == "credit")
            db_txn = models.Transaction(
                account_id=txn_data.account_id,
                txn_type=txn_data.txn_type,
                amount=txn_data.amount,
                description=txn_data.description,
                category=final_category,
                merchant=txn_data.merchant,
                currency=txn_data.currency
            )
            if txn_data.txn_type == "debit":
                account.balance = float(account.balance) - txn_data.amount
                if float(account.balance) < 1000:
                    alert_service = AlertService(db)
                    alert_service.create_low_balance_alert(current_user.id, account.account_number, float(account.balance))
            else:
                account.balance = float(account.balance) + txn_data.amount
            
            # Link to Bill if bill_id provided
            if txn_data.bill_id:
                bill = db.query(models.Bill).filter(models.Bill.id == txn_data.bill_id, models.Bill.user_id == current_user.id).first()
                if bill:
                    bill.status = "paid"
                    bill.paid = True
                    bill.paid_at = datetime.utcnow()
                    db.add(bill)

            db.add(db_txn)
            db.add(account)
            db.flush()
            internal_evaluate_budget(db, current_user.id, final_category, db_txn.txn_date.month, db_txn.txn_date.year)
        db.commit()
        db.refresh(db_txn)
        return db_txn
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/transfer", response_model=List[schemas.Transaction])
async def transfer_funds(
    transfer_data: schemas.TransferCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from_acc = db.query(models.Account).filter(models.Account.id == transfer_data.from_account_id, models.Account.user_id == current_user.id).first()
    to_acc = db.query(models.Account).filter(models.Account.id == transfer_data.to_account_id, models.Account.user_id == current_user.id).first()

    if not from_acc or not to_acc:
        raise HTTPException(status_code=404, detail="One or both accounts not found")
    
    if float(from_acc.balance) < transfer_data.amount:
        raise HTTPException(status_code=400, detail="Insufficient funds in source account")

    try:
        with db.begin_nested():
            # 1. Create Debit Transaction
            debit_txn = models.Transaction(
                account_id=from_acc.id,
                txn_type="debit",
                amount=transfer_data.amount,
                description=f"Transfer to {to_acc.bank_name or 'Account'} - {transfer_data.description}",
                category="Transfer",
                currency=from_acc.currency
            )
            from_acc.balance = float(from_acc.balance) - transfer_data.amount
            
            # 2. Create Credit Transaction
            credit_txn = models.Transaction(
                account_id=to_acc.id,
                txn_type="credit",
                amount=transfer_data.amount,
                description=f"Transfer from {from_acc.bank_name or 'Account'} - {transfer_data.description}",
                category="Transfer",
                currency=to_acc.currency
            )
            to_acc.balance = float(to_acc.balance) + transfer_data.amount
            
            db.add(debit_txn)
            db.add(credit_txn)
            db.add(from_acc)
            db.add(to_acc)
            db.flush()
        
        db.commit()
        return [debit_txn, credit_txn]
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{transaction_id}/category", response_model=schemas.TransactionCategoryResponse)
async def update_transaction_category(
    transaction_id: int,
    category_update: schemas.TransactionUpdateCategory,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_accounts = db.query(models.Account).filter(models.Account.user_id == current_user.id).all()
    account_ids = [account.id for account in user_accounts]
    transaction = db.query(models.Transaction).filter(models.Transaction.id == transaction_id, models.Transaction.account_id.in_(account_ids)).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    is_credit = transaction.txn_type == "credit"
    if category_update.category == "Income" and not is_credit:
        raise HTTPException(status_code=400, detail="Debit transactions cannot be categorized as Income")
    
    old_category = transaction.category
    new_category = category_update.category
    txn_month = transaction.txn_date.month
    txn_year = transaction.txn_date.year

    try:
        budget_state = None
        with db.begin_nested():
            transaction.category = new_category
            db.add(transaction)
            if category_update.create_rule and transaction.merchant:
                existing_rule = db.query(models.CategoryRule).filter(models.CategoryRule.user_id == current_user.id, models.CategoryRule.merchant_name == transaction.merchant).first()
                if not existing_rule:
                    new_rule = models.CategoryRule(user_id=current_user.id, merchant_name=transaction.merchant, keyword=transaction.merchant, category=new_category)
                    db.add(new_rule)
            
            budget_service = BudgetService(db)
            if old_category and old_category != new_category:
                budget_service.evaluate_category_budget(current_user.id, old_category, txn_month, txn_year)
            evaluation = budget_service.evaluate_category_budget(current_user.id, new_category, txn_month, txn_year)
            if evaluation:
                alert_triggered = False
                if evaluation.get("exceeded"):
                    alert_service = AlertService(db)
                    alert_service.create_budget_alert(current_user.id, new_category, evaluation["spent"], evaluation["limit"])
                    alert_triggered = True
                budget_state = schemas.BudgetState(category=new_category, spent=evaluation["spent"], limit=evaluation["limit"], percentage=evaluation["percentage"], alert_triggered=alert_triggered)
            db.flush()
        db.commit()
        db.refresh(transaction)
        return schemas.TransactionCategoryResponse(transaction=transaction, budget_state=budget_state)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
