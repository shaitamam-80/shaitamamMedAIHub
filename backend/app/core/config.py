"""
MedAI Hub - Configuration Module
Manages environment variables and application settings
"""

import os

from pydantic_settings import BaseSettings


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
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:3004",
        "http://localhost:3005",
        "http://localhost:3006",
        "http://localhost:3007",
        "http://localhost:3008",
        "http://localhost:3009",
        "https://shaitamam.com",
        "https://www.shaitamam.com",
    ]
    BACKEND_CORS_ORIGIN_REGEX: str | None = r"^https://.*\.vercel\.app$"

    # Google Gemini API
    GOOGLE_API_KEY: str = ""  # Required at runtime
    GEMINI_PRO_MODEL: str = "gemini-2.5-flash"
    GEMINI_FLASH_MODEL: str = "gemini-2.5-flash"

    # Supabase Configuration
    SUPABASE_URL: str = ""  # Required at runtime
    SUPABASE_KEY: str = ""  # Required at runtime
    SUPABASE_SERVICE_ROLE_KEY: str | None = None  # Optional: For admin operations

    # Database
    DATABASE_URL: str | None = None  # Optional: Direct PostgreSQL connection

    # File Upload Settings
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB default
    ALLOWED_EXTENSIONS: set[str] = {".txt", ".medline", ".csv"}
    UPLOAD_DIR: str = "uploads"

    # AI Settings
    MAX_TOKENS: int = 8192
    TEMPERATURE: float = 0.7
    BATCH_SIZE: int = 10  # Number of abstracts to process in one AI call

    # NCBI PubMed API Settings
    # With API key: 10 requests/second, without: 3 requests/second
    # Get API key from: https://www.ncbi.nlm.nih.gov/account/settings/
    NCBI_API_KEY: str | None = None
    NCBI_EMAIL: str = "shaitamam@gmail.com"  # Required by NCBI for identification

    # Cache Settings
    # If REDIS_URL is set, Redis cache is used; otherwise, in-memory cache
    REDIS_URL: str | None = None  # e.g., redis://localhost:6379 or Railway Redis URL
    CACHE_TTL_DAYS: int = 30  # MeSH term cache TTL (MeSH updates annually)
    CACHE_MAX_SIZE: int = 10000  # Max entries for in-memory cache

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()


# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
