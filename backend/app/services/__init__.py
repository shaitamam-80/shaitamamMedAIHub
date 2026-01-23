"""
MedAI Hub - Services Module
Exports all service singletons for use throughout the application
"""

from .ai_service import ai_service
from .database import db_service

__all__ = [
    "ai_service",
    "db_service",
]
