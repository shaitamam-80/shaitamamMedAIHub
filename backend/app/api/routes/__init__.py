"""
MedAI Hub - API Routes Package
==============================

Exports all API routers for the application.
"""

from . import projects
from . import review
from . import chat

__all__ = ["projects", "review", "chat"]
