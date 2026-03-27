import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL = os.getenv("DATABASE_URL")
    SECRET_KEY = os.getenv("SECRET_KEY")
    ALGORITHM = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
    
    # PRODUCTION REDIS CONFIG
    # 1. Use REDIS_URL from environment (Best practice)
    # 2. Use the TCP Proxy address (Most reliable for Railway background tasks)
    # 3. Fallback to the user's provided domain
    # 4. Local fallback
    ENV_REDIS = os.getenv("REDIS_URL") or os.getenv("REDIS_PRIVATE_URL") or os.getenv("CELERY_BROKER_URL")
    TCP_PROXY = "redis://interchange.proxy.rlwy.net:19592"
    USER_DOMAIN = "redis://redis-production-86c0.up.railway.app:6379"
    
    CELERY_BROKER_URL = ENV_REDIS or TCP_PROXY or USER_DOMAIN or "redis://localhost:6373/0"
    
    EXCHANGERATE_API_KEY = os.getenv("EXCHANGERATE_API_KEY", "your_default_key_here")

settings = Settings()
