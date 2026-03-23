from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.services.currency_service import CurrencyService
from app.dependencies import get_current_user
from app.database import get_db
import app.models as models

router = APIRouter()

@router.get("/rates/")
async def get_currency_rates(
    current_user: models.User = Depends(get_current_user)
):
    """
    Returns latest exchange rates relative to INR.
    Requires authentication.
    """
    rates = await CurrencyService.get_latest_rates(base_currency="INR")
    return {
        "rates": rates,
        "base": "INR",
        "last_updated": CurrencyService._cache_expiry.isoformat() if CurrencyService._cache_expiry else None
    }

@router.get("/summary/")
async def get_currency_summary(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Calculates the total balance across all user accounts converted to a base currency (INR).
    """
    rates = await CurrencyService.get_latest_rates(base_currency="INR")
    
    total_balance_inr = 0.0
    account_summaries = []
    
    for account in current_user.accounts:
        balance = float(account.balance)
        currency = account.currency or "INR"
        
        balance_in_inr = await CurrencyService.convert_to_base(balance, currency, base_currency="INR")
        
        total_balance_inr += balance_in_inr
        
        account_summaries.append({
            "account_id": account.id,
            "account_number": account.account_number,
            "original_balance": balance,
            "original_currency": currency,
            "balance_in_inr": round(balance_in_inr, 2)
        })
        
    return {
        "total_balance_inr": round(total_balance_inr, 2),
        "base_currency": "INR",
        "accounts": account_summaries,
        "last_updated": CurrencyService._cache_expiry.isoformat() if CurrencyService._cache_expiry else None
    }
