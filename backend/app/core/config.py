"""
MedAI Hub - Configuration Module
Manages environment variables and application settings
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Application
    APP_NAME: str = "MedAI Hub"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # API Settings
    API_V1_PREFIX: str = "/api/v1"
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://shaitamam.com",
        "https://www.shaitamam.com",
    ]
    BACKEND_CORS_ORIGIN_REGEX: Optional[str] = r"^https://.*\.vercel\.app$"

    # Google Gemini API
    GOOGLE_API_KEY: str = ""  # Set in environment variables
    GEMINI_PRO_MODEL: str = "gemini-2.5-flash"
    GEMINI_FLASH_MODEL: str = "gemini-2.5-flash"

    # Supabase Configuration (defaults for build time, actual values from env at runtime)
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None  # Optional: For admin operations

    # Database
    DATABASE_URL: Optional[str] = None  # Optional: Direct PostgreSQL connection

    # File Upload Settings
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB default
    ALLOWED_EXTENSIONS: set[str] = {".txt", ".medline", ".csv"}
    UPLOAD_DIR: str = "uploads"

    # AI Settings
    MAX_TOKENS: int = 8192
    TEMPERATURE: float = 0.7
    BATCH_SIZE: int = 10  # Number of abstracts to process in one AI call

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()


# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
