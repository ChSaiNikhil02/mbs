from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import app.models as models
import app.schemas as schemas
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter()

@router.get("/", response_model=List[schemas.Alert])
async def get_alerts(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetch all alerts, latest first."""
    return db.query(models.Alert).filter(models.Alert.user_id == current_user.id).order_by(models.Alert.created_at.desc()).all()

@router.get("/unread", response_model=List[schemas.Alert])
async def get_unread_alerts(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetch only unread alerts."""
    return db.query(models.Alert).filter(
        models.Alert.user_id == current_user.id, 
        models.Alert.is_read == False
    ).order_by(models.Alert.created_at.desc()).all()

@router.post("/mark-all-read")
@router.post("/mark-read")
async def mark_all_alerts_as_read(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Mark all unread alerts as read for the current user."""
    db.query(models.Alert).filter(
        models.Alert.user_id == current_user.id,
        models.Alert.is_read == False
    ).update({models.Alert.is_read: True}, synchronize_session=False)
    db.commit()
    return {"message": "All alerts marked as read"}

@router.patch("/{alert_id}", response_model=schemas.Alert)
async def update_alert(alert_id: int, alert_update: schemas.AlertUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id, models.Alert.user_id == current_user.id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_read = alert_update.is_read
    db.commit()
    db.refresh(alert)
    return alert

@router.delete("/{alert_id}")
async def delete_alert(alert_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id, models.Alert.user_id == current_user.id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    db.delete(alert)
    db.commit()
    return {"message": "Alert deleted successfully"}
