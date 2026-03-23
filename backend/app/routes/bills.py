from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

import app.models as models
import app.schemas as schemas
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter()

def _refresh_bill_status(bill: models.Bill):
    """Updates the bill status based on the current date if not already paid."""
    if bill.status == "paid" or bill.paid:
        bill.status = "paid"
        return
    
    today = datetime.utcnow().date()
    if today < bill.due_date:
        bill.status = "upcoming"
    else:
        bill.status = "overdue"

@router.post("/", response_model=schemas.BillResponse, status_code=status.HTTP_201_CREATED)
async def create_bill(
    bill: schemas.BillCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_bill = models.Bill(
        user_id=current_user.id,
        biller_name=bill.bill_name,
        due_date=bill.due_date,
        amount_due=bill.amount,
        status=bill.status,
        auto_pay=bill.auto_pay,
        paid=bill.status == "paid"
    )
    if db_bill.paid:
        db_bill.paid_at = datetime.utcnow()
        
    _refresh_bill_status(db_bill)
    db.add(db_bill)
    
    # Trigger reminder immediately if due soon (within 2 days)
    today = datetime.utcnow().date()
    if not db_bill.paid and db_bill.due_date <= (today + timedelta(days=2)):
        from app.services.alert_service import AlertService
        alert_service = AlertService(db)
        alert_service.create_bill_reminder(
            user_id=current_user.id,
            biller_name=db_bill.biller_name,
            due_date=db_bill.due_date.strftime("%Y-%m-%d"),
            amount=float(db_bill.amount_due)
        )
        
    db.commit()
    db.refresh(db_bill)
    return db_bill

@router.get("/", response_model=List[schemas.BillResponse])
async def get_bills(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    bills = db.query(models.Bill).filter(models.Bill.user_id == current_user.id).all()
    for bill in bills:
        _refresh_bill_status(bill)
    db.commit() # Persist status changes if any (e.g. upcoming -> overdue)
    return bills

@router.get("/{bill_id}/", response_model=schemas.BillResponse)
async def get_bill(
    bill_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    bill = db.query(models.Bill).filter(models.Bill.id == bill_id, models.Bill.user_id == current_user.id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    _refresh_bill_status(bill)
    db.commit()
    return bill

@router.put("/{bill_id}/", response_model=schemas.BillResponse)
async def update_bill(
    bill_id: int,
    bill_update: schemas.BillUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_bill = db.query(models.Bill).filter(models.Bill.id == bill_id, models.Bill.user_id == current_user.id).first()
    if not db_bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    update_data = bill_update.dict(exclude_unset=True)
    
    # Map frontend names to backend model names
    if "bill_name" in update_data:
        db_bill.biller_name = update_data.pop("bill_name")
    if "amount" in update_data:
        db_bill.amount_due = update_data.pop("amount")
    
    for key, value in update_data.items():
        setattr(db_bill, key, value)
    
    if db_bill.status == "paid":
        db_bill.paid = True
        if not db_bill.paid_at:
            db_bill.paid_at = datetime.utcnow()
    
    _refresh_bill_status(db_bill)
    
    # Trigger reminder if updated bill is due soon (within 2 days)
    today = datetime.utcnow().date()
    if not db_bill.paid and db_bill.due_date <= (today + timedelta(days=2)):
        from app.services.alert_service import AlertService
        alert_service = AlertService(db)
        alert_service.create_bill_reminder(
            user_id=current_user.id,
            biller_name=db_bill.biller_name,
            due_date=db_bill.due_date.strftime("%Y-%m-%d"),
            amount=float(db_bill.amount_due)
        )
        
    db.commit()
    db.refresh(db_bill)
    return db_bill

@router.put("/{bill_id}/pay/", response_model=schemas.BillResponse)
async def pay_bill(
    bill_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_bill = db.query(models.Bill).filter(models.Bill.id == bill_id, models.Bill.user_id == current_user.id).first()
    if not db_bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    db_bill.status = "paid"
    db_bill.paid = True
    db_bill.paid_at = datetime.utcnow()
    db_bill.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_bill)
    return db_bill

@router.post("/{bill_id}/send-reminder/", response_model=schemas.Alert)
async def send_bill_reminder(
    bill_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually triggers a reminder alert for a specific bill."""
    bill = db.query(models.Bill).filter(models.Bill.id == bill_id, models.Bill.user_id == current_user.id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    from app.services.alert_service import AlertService
    alert_service = AlertService(db)
    
    alert = alert_service.create_bill_reminder(
        user_id=current_user.id,
        biller_name=bill.biller_name,
        due_date=bill.due_date.strftime("%Y-%m-%d"),
        amount=float(bill.amount_due)
    )
    db.commit()
    return alert

@router.delete("/{bill_id}/")
async def delete_bill(
    bill_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_bill = db.query(models.Bill).filter(models.Bill.id == bill_id, models.Bill.user_id == current_user.id).first()
    if not db_bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    db.delete(db_bill)
    db.commit()
    return {"message": "Bill deleted successfully"}
