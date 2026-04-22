import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-secret-change-in-production")
    
    # PostgreSQL — swap to SQLite for quick local dev:
    # SQLALCHEMY_DATABASE_URI = "sqlite:///lostandfound.db"
    SQLALCHEMY_DATABASE_URI = "sqlite:///lostandfound.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}
    
    # JWT expiry (hours)
    JWT_ACCESS_TOKEN_EXPIRES_HOURS = 24
