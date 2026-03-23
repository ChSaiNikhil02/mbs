from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
import logging

import app.models as models
import app.schemas as schemas
from app.database import get_db
from app.utils.security import verify_password, get_password_hash, create_access_token
from app.config import settings

logger = logging.getLogger("banking-app")
router = APIRouter()

@router.post("/register/", response_model=schemas.UserInDB)
async def register_user(reg_data: schemas.RegistrationRequest, db: Session = Depends(get_db)):
    user_data = reg_data.user
    logger.info(f"New registration attempt: {user_data.username}")

    db_user = db.query(models.User).filter(models.User.username == user_data.username).first()
    if db_user:
        logger.warning(f"Registration failed: Username {user_data.username} taken")
        raise HTTPException(status_code=400, detail="Username already registered")

    db_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if db_user:
        logger.warning(f"Registration failed: Email {user_data.email} taken")
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user_data.password)
    db_user = models.User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password,
        address=user_data.address,
        phone=user_data.phone
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    logger.info(f"User created: {db_user.username} (ID: {db_user.id})")
    return db_user

@router.post("/token/", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        logger.warning(f"Failed login attempt for username: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    logger.info(f"User logged in: {user.username}")
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
