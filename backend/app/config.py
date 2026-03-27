import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL = os.getenv("DATABASE_URL")
    SECRET_KEY = os.getenv("SECRET_KEY")
    ALGORITHM = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
    
    # RAILWAY PROOF REDIS CONFIG:
    # 1. First check REDIS_URL (Standard Railway)
    # 2. Then check CELERY_BROKER_URL (Custom)
    # 3. Then check REDIS_PRIVATE_URL (Internal Railway)
    # 4. Fallback to user-provided URL
    # 5. Final fallback to localhost
    REDIS_URL = os.getenv("REDIS_URL") or os.getenv("REDIS_PRIVATE_URL")
    USER_PROVIDED_URL = "redis://redis-production-86c0.up.railway.app"
    
    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", REDIS_URL or USER_PROVIDED_URL or "redis://localhost:6373/0")
    
    EXCHANGERATE_API_KEY = os.getenv("EXCHANGERATE_API_KEY", "your_default_key_here")

settings = Settings()
