import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL = os.getenv("DATABASE_URL")
    SECRET_KEY = os.getenv("SECRET_KEY")
    ALGORITHM = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
    
    # FORCIBLE PROTOCOL FIX: 
    # This ensures that even if the env var is "google.com", it becomes "redis://google.com"
    raw_url = os.getenv("REDIS_URL") or os.getenv("CELERY_BROKER_URL") or "redis://localhost:6373/0"
    
    if raw_url and not raw_url.startswith("redis://") and not raw_url.startswith("rediss://"):
        # Remove https:// if user accidentally added it, then add redis://
        clean_url = raw_url.replace("https://", "").replace("http://", "")
        CELERY_BROKER_URL = f"redis://{clean_url}"
    else:
        CELERY_BROKER_URL = raw_url
    
    EXCHANGERATE_API_KEY = os.getenv("EXCHANGERATE_API_KEY", "your_default_key_here")

settings = Settings()
