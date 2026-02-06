"""
MedAI Hub - State Persistence (Checkpointer)
=============================================

Replaces the in-memory MemorySaver with a PostgreSQL-backed checkpointer
using LangGraph's checkpoint-postgres package.

This ensures conversation state survives backend restarts and deployments.

The checkpointer uses the same Supabase PostgreSQL database that the
rest of the application uses. It requires the DATABASE_URL environment
variable to be set (direct PostgreSQL connection string).

If DATABASE_URL is not available, falls back to MemorySaver (in-memory).
"""

import logging
from typing import Optional

from langgraph.checkpoint.memory import MemorySaver

from app.core.config import settings

logger = logging.getLogger(__name__)

# Global checkpointer instance
_checkpointer = None
_checkpointer_initialized = False


def _build_database_url() -> Optional[str]:
    """
    Build the PostgreSQL connection string.

    Priority:
    1. DATABASE_URL from settings (direct PostgreSQL connection)
    2. Construct from SUPABASE_URL (if it's a Supabase project)

    Returns:
        PostgreSQL connection string or None
    """
    # Direct DATABASE_URL takes priority
    if settings.DATABASE_URL:
        return settings.DATABASE_URL

    # Try to construct from Supabase URL
    # Supabase URLs look like: https://abcdefg.supabase.co
    # The database is at: postgresql://postgres:[password]@db.abcdefg.supabase.co:5432/postgres
    if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
        # Extract the project ref from the URL
        try:
            import re
            match = re.search(r'https://([^.]+)\.supabase\.co', settings.SUPABASE_URL)
            if match:
                project_ref = match.group(1)
                # Note: This requires the database password, not the service role key
                # The user should set DATABASE_URL directly for production use
                logger.info(
                    f"Supabase project detected: {project_ref}. "
                    "Set DATABASE_URL env var for persistent checkpointing."
                )
        except Exception:
            pass

    return None


def get_checkpointer():
    """
    Get or create the checkpointer instance.

    Uses PostgreSQL checkpointer if DATABASE_URL is available,
    otherwise falls back to in-memory MemorySaver.

    Returns:
        A LangGraph checkpointer instance
    """
    global _checkpointer, _checkpointer_initialized

    if _checkpointer_initialized:
        return _checkpointer

    database_url = _build_database_url()

    if database_url:
        try:
            from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

            # Create async PostgreSQL checkpointer
            _checkpointer = AsyncPostgresSaver.from_conn_string(database_url)
            logger.info("Using PostgreSQL checkpointer for state persistence")
            _checkpointer_initialized = True
            return _checkpointer

        except ImportError:
            logger.warning(
                "langgraph-checkpoint-postgres not installed. "
                "Install with: pip install langgraph-checkpoint-postgres"
            )
        except Exception as e:
            logger.error(f"Failed to create PostgreSQL checkpointer: {e}")
    else:
        logger.warning(
            "DATABASE_URL not set. Using in-memory state (will be lost on restart). "
            "Set DATABASE_URL for persistent state."
        )

    # Fallback to in-memory
    _checkpointer = MemorySaver()
    _checkpointer_initialized = True
    return _checkpointer


async def setup_checkpointer():
    """
    Initialize the checkpointer tables if using PostgreSQL.
    Should be called during application startup.
    """
    checkpointer = get_checkpointer()

    # Only PostgreSQL checkpointer needs table setup
    if hasattr(checkpointer, 'setup'):
        try:
            await checkpointer.setup()
            logger.info("Checkpointer tables created/verified")
        except Exception as e:
            logger.error(f"Failed to setup checkpointer tables: {e}")
            # Don't crash the app - fall back to MemorySaver
            global _checkpointer, _checkpointer_initialized
            _checkpointer = MemorySaver()
            _checkpointer_initialized = True
            logger.warning("Falling back to in-memory checkpointer")
