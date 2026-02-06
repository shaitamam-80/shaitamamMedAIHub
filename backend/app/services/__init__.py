"""
MedAI Hub - Services Module
Exports all service singletons for use throughout the application

NOTE: ai_service has been removed during migration to LangGraph architecture.
"""

from .database import db_service

__all__ = [
    "db_service",
]
