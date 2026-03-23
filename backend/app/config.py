import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL = os.getenv("DATABASE_URL")
    SECRET_KEY = os.getenv("SECRET_KEY")
    ALGORITHM = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6373/0")
    EXCHANGERATE_API_KEY = os.getenv("EXCHANGERATE_API_KEY", "your_default_key_here")

settings = Settings()
