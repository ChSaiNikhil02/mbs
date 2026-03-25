from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List
import shutil
import os
from datetime import datetime

import app.models as models
import app.schemas as schemas
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(tags=["KYC"])

# Directory to save uploaded files
UPLOAD_DIR = "uploads/kyc"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/documents/", response_model=List[schemas.KycDocument])
async def get_kyc_documents(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.KycDocument).filter(models.KycDocument.user_id == current_user.id).all()

@router.post("/upload/")
async def upload_kyc_document(
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Save file to disk
    file_path = os.path.join(UPLOAD_DIR, f"{current_user.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Save document record to DB
    new_doc = models.KycDocument(
        user_id=current_user.id,
        document_type=document_type,
        file_name=file.filename,
        file_path=file_path,
        status="pending"
    )
    db.add(new_doc)
    db.commit()
    
    return {"message": "Document uploaded successfully", "document_id": new_doc.id}

@router.delete("/documents/{doc_id}")
async def delete_kyc_document(
    doc_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(models.KycDocument).filter(models.KycDocument.id == doc_id, models.KycDocument.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
        
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully"}
