"""
MedAI Hub - Database Service
Handles Supabase database operations
"""

from typing import Any
from uuid import UUID

from supabase import Client, create_client

from app.core.config import settings


class DatabaseService:
    """Service for database operations with Supabase"""

    def __init__(self):
        self._client: Client | None = None

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

    async def create_project(self, project_data: dict[str, Any]) -> dict[str, Any]:
        """Create a new project"""
        response = self.client.table("projects").insert(project_data).execute()
        return response.data[0] if response.data else None

    async def get_project(self, project_id: UUID) -> dict[str, Any] | None:
        """Get project by ID"""
        response = self.client.table("projects").select("*").eq("id", str(project_id)).execute()
        return response.data[0] if response.data else None

    async def update_project(self, project_id: UUID, update_data: dict[str, Any]) -> dict[str, Any]:
        """Update project"""
        response = (
            self.client.table("projects").update(update_data).eq("id", str(project_id)).execute()
        )
        return response.data[0] if response.data else None

    async def list_projects(
        self, user_id: str | None = None, limit: int = 100
    ) -> list[dict[str, Any]]:
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
            self.client.table("projects").delete().eq("id", str(project_id)).execute()
            return True
        except Exception:
            return False

    # ========================================================================
    # Files
    # ========================================================================

    async def create_file(self, file_data: dict[str, Any]) -> dict[str, Any]:
        """Create file record"""
        response = self.client.table("files").insert(file_data).execute()
        return response.data[0] if response.data else None

    async def get_file(self, file_id: UUID) -> dict[str, Any] | None:
        """Get file by ID"""
        response = self.client.table("files").select("*").eq("id", str(file_id)).execute()
        return response.data[0] if response.data else None

    async def get_files_by_project(self, project_id: UUID) -> list[dict[str, Any]]:
        """Get all files for a project"""
        response = (
            self.client.table("files").select("*").eq("project_id", str(project_id)).execute()
        )
        return response.data or []

    # ========================================================================
    # Chat Messages
    # ========================================================================

    async def save_message(self, message_data: dict[str, Any]) -> dict[str, Any]:
        """Save chat message"""
        response = self.client.table("chat_messages").insert(message_data).execute()
        return response.data[0] if response.data else None

    async def get_conversation(self, project_id: UUID, limit: int = 50) -> list[dict[str, Any]]:
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
            self.client.table("chat_messages").delete().eq("project_id", str(project_id)).execute()
            return True
        except Exception:
            return False

    # ========================================================================
    # Abstracts
    # ========================================================================

    async def create_abstract(self, abstract_data: dict[str, Any]) -> dict[str, Any]:
        """Create abstract record"""
        response = self.client.table("abstracts").insert(abstract_data).execute()
        return response.data[0] if response.data else None

    async def get_abstract(self, abstract_id: UUID) -> dict[str, Any] | None:
        """Get abstract by ID"""
        response = self.client.table("abstracts").select("*").eq("id", str(abstract_id)).execute()
        return response.data[0] if response.data else None

    async def bulk_create_abstracts(
        self, abstracts_data: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        """Bulk create abstract records"""
        response = self.client.table("abstracts").insert(abstracts_data).execute()
        return response.data or []

    async def get_abstracts_by_project(
        self,
        project_id: UUID,
        status: str | None = None,
        limit: int | None = None,
        offset: int | None = None,
    ) -> list[dict[str, Any]]:
        """Get abstracts for a project, optionally filtered by status with pagination"""
        query = self.client.table("abstracts").select("*").eq("project_id", str(project_id))

        if status:
            query = query.eq("status", status)

        # Add pagination
        if limit is not None:
            query = query.limit(limit)
        if offset is not None:
            query = query.range(offset, offset + (limit or 100) - 1)

        response = query.order("created_at", desc=False).execute()
        return response.data or []

    async def count_abstracts_by_project(self, project_id: UUID, status: str | None = None) -> int:
        """Get total count of abstracts for a project"""
        query = (
            self.client.table("abstracts")
            .select("id", count="exact")
            .eq("project_id", str(project_id))
        )

        if status:
            query = query.eq("status", status)

        response = query.execute()
        return response.count if hasattr(response, "count") and response.count is not None else 0

    async def update_abstract_decision(
        self, abstract_id: UUID, decision_data: dict[str, Any]
    ) -> dict[str, Any]:
        """Update abstract screening decision"""
        response = (
            self.client.table("abstracts")
            .update(decision_data)
            .eq("id", str(abstract_id))
            .execute()
        )
        return response.data[0] if response.data else None

    # ========================================================================
    # Analysis Runs
    # ========================================================================

    async def create_analysis_run(self, run_data: dict[str, Any]) -> dict[str, Any]:
        """Create analysis run record"""
        response = self.client.table("analysis_runs").insert(run_data).execute()
        return response.data[0] if response.data else None

    async def update_analysis_run(
        self, run_id: UUID, update_data: dict[str, Any]
    ) -> dict[str, Any]:
        """Update analysis run"""
        response = (
            self.client.table("analysis_runs").update(update_data).eq("id", str(run_id)).execute()
        )
        return response.data[0] if response.data else None

    async def get_analysis_runs_by_project(self, project_id: UUID) -> list[dict[str, Any]]:
        """Get all analysis runs for a project"""
        response = (
            self.client.table("analysis_runs")
            .select("*")
            .eq("project_id", str(project_id))
            .order("started_at", desc=True)
            .execute()
        )
        return response.data or []

    # ========================================================================
    # Query Strings
    # ========================================================================

    async def save_query_string(self, query_data: dict[str, Any]) -> dict[str, Any]:
        """Save generated query string"""
        response = self.client.table("query_strings").insert(query_data).execute()
        return response.data[0] if response.data else None

    async def get_query_strings_by_project(self, project_id: UUID) -> list[dict[str, Any]]:
        """Get all query strings for a project"""
        response = (
            self.client.table("query_strings")
            .select("*")
            .eq("project_id", str(project_id))
            .order("created_at", desc=True)
            .execute()
        )
        return response.data or []


# Global instance
db_service = DatabaseService()
