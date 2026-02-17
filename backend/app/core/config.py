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
    BACKEND_CORS_ORIGIN_REGEX: Optional[str] = r"^https://.*\.vercel\.app$"

    # Google Gemini API
    GOOGLE_API_KEY: str = ""  # Required at runtime
    GEMINI_PRO_MODEL: str = "gemini-2.5-flash"
    GEMINI_FLASH_MODEL: str = "gemini-2.5-flash"

    # Supabase Configuration
    SUPABASE_URL: str = ""  # Required at runtime
    SUPABASE_KEY: str = ""  # Required at runtime
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None  # Optional: For admin operations

    # Database
    DATABASE_URL: Optional[str] = None  # Optional: Direct PostgreSQL connection

    # PubMed / NCBI
    NCBI_API_KEY: Optional[str] = None       # 10 req/sec vs 3 without
    PUBMED_EMAIL: Optional[str] = None       # Required for Unpaywall & NCBI E-utilities

    # Full-text sources
    CORE_API_KEY: Optional[str] = None       # CORE.ac.uk API key
    EZPROXY_PREFIX: Optional[str] = None     # Institutional proxy URL prefix

    # AI Settings
    MAX_TOKENS: int = 8192
    TEMPERATURE: float = 0.7

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra env vars not defined in Settings


# Global settings instance
settings = Settings()
