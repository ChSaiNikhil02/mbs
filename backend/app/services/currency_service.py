import httpx
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional
from app.config import settings

logger = logging.getLogger("banking-app")

class CurrencyService:
    _cache: Dict[str, any] = {}
    _cache_expiry: Optional[datetime] = None
    
    BASE_URL = "https://v6.exchangerate-api.com/v6"
    
    @classmethod
    async def get_latest_rates(cls, base_currency: str = "INR") -> Dict[str, float]:
        """
        Fetches latest rates from ExchangeRate API with a 1-hour in-memory cache.
        Defaults to INR as base for currency conversion UI.
        """
        now = datetime.utcnow()
        
        # Check cache (1 hour duration)
        if cls._cache_expiry and now < cls._cache_expiry and base_currency in cls._cache:
            return cls._cache[base_currency]
        
        # Skip API call if key is default placeholder
        if settings.EXCHANGERATE_API_KEY == "your_default_key_here":
            logger.warning("ExchangeRate API key not configured. Using fallback rates.")
            return cls._get_fallback_rates(base_currency)
        
        url = f"{cls.BASE_URL}/{settings.EXCHANGERATE_API_KEY}/latest/{base_currency}"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=5.0)
                response.raise_for_status()
                data = response.json()
                
                if data.get("result") == "success":
                    rates = data.get("conversion_rates", {})
                    # Filter for important currencies
                    important_keys = ["USD", "EUR", "GBP", "INR", "CAD", "AUD", "JPY", "CNY"]
                    filtered_rates = {k: v for k, v in rates.items() if k in important_keys}
                    
                    # Update cache
                    cls._cache[base_currency] = filtered_rates
                    cls._cache_expiry = now + timedelta(hours=1)
                    
                    return filtered_rates
                else:
                    logger.error(f"ExchangeRate API error: {data.get('error-type')}")
                    return cls._get_fallback_rates(base_currency)
                    
        except Exception as e:
            logger.error(f"Failed to fetch currency rates: {e}")
            return cls._get_fallback_rates(base_currency)

    @classmethod
    async def convert_to_base(cls, amount: float, from_currency: str, base_currency: str = "INR") -> float:
        """
        Converts an amount from a foreign currency to the base currency using cached rates.
        """
        if from_currency == base_currency:
            return amount
            
        rates = await cls.get_latest_rates(base_currency=base_currency)
        # rates contains how many [CURRENCY] per 1 base unit (e.g. 0.012 USD per 1 INR)
        rate = rates.get(from_currency, 1.0)
        
        if rate <= 0:
            return amount
            
        return amount / rate

    @staticmethod
    def _get_fallback_rates(base: str = "INR") -> Dict[str, float]:
        """Returns mock rates if API fails. Rates are relative to INR if base is INR."""
        if base == "INR":
            return {
                "INR": 1.0,
                "USD": 0.012, # 1 INR = 0.012 USD
                "EUR": 0.011,
                "GBP": 0.0095,
                "CAD": 0.016,
                "AUD": 0.018,
                "JPY": 1.81,
                "CNY": 0.086
            }
        return {
            "USD": 1.0, "EUR": 0.92, "GBP": 0.79, "INR": 83.12,
            "CAD": 1.35, "AUD": 1.52, "JPY": 150.50, "CNY": 7.19
        }
