"""
MedAI Hub - Database Service
Handles Supabase database operations
"""

from supabase import create_client, Client
from app.core.config import settings
from typing import Optional, List, Dict, Any
from uuid import UUID


class DatabaseService:
    """Service for database operations with Supabase"""

    def __init__(self):
        self._client: Optional[Client] = None

    @property
    def client(self) -> Client:
        """Lazy initialization of Supabase client"""
        if self._client is None:
            key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY
            self._client = create_client(settings.SUPABASE_URL, key)
        return self._client

    # ========================================================================
    # Projects
    # ========================================================================

    async def create_project(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new project"""
        response = (
            self.client.table("projects").insert(project_data).execute()
        )
        return response.data[0] if response.data else None

    async def get_project(self, project_id: UUID) -> Optional[Dict[str, Any]]:
        """Get project by ID"""
        response = (
            self.client.table("projects")
            .select("*")
            .eq("id", str(project_id))
            .execute()
        )
        return response.data[0] if response.data else None

    async def update_project(
        self, project_id: UUID, update_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update project"""
        response = (
            self.client.table("projects")
            .update(update_data)
            .eq("id", str(project_id))
            .execute()
        )
        return response.data[0] if response.data else None

    async def list_projects(
        self, user_id: Optional[str] = None, limit: int = 100
    ) -> List[Dict[str, Any]]:
        """List projects, optionally filtered by user_id"""
        query = self.client.table("projects").select("*")

        if user_id:
            query = query.eq("user_id", user_id)

        response = query.order("created_at", desc=True).limit(limit).execute()
        return response.data or []

    async def delete_project(self, project_id: UUID) -> bool:
        """
        Delete a project and all associated data (CASCADE).

        Args:
            project_id: UUID of the project to delete

        Returns:
            True if deletion succeeded, False otherwise
        """
        try:
            self.client.table("projects").delete().eq(
                "id", str(project_id)
            ).execute()
            return True
        except Exception:
            return False

    # ========================================================================
    # Chat Messages
    # ========================================================================

    async def save_message(self, message_data: Dict[str, Any]) -> Dict[str, Any]:
        """Save chat message"""
        response = (
            self.client.table("chat_messages").insert(message_data).execute()
        )
        return response.data[0] if response.data else None

    async def get_conversation(
        self, project_id: UUID, limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get conversation history for a project"""
        response = (
            self.client.table("chat_messages")
            .select("*")
            .eq("project_id", str(project_id))
            .order("created_at", desc=False)
            .limit(limit)
            .execute()
        )
        return response.data or []

    async def clear_conversation(self, project_id: UUID) -> bool:
        """Clear all chat messages for a project"""
        try:
            self.client.table("chat_messages").delete().eq(
                "project_id", str(project_id)
            ).execute()
            return True
        except Exception:
            return False


# Global instance
db_service = DatabaseService()
