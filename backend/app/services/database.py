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
        self.client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

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

    async def list_projects(self, limit: int = 100) -> List[Dict[str, Any]]:
        """List all projects"""
        response = (
            self.client.table("projects")
            .select("*")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return response.data or []

    # ========================================================================
    # Files
    # ========================================================================

    async def create_file(self, file_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create file record"""
        response = self.client.table("files").insert(file_data).execute()
        return response.data[0] if response.data else None

    async def get_files_by_project(self, project_id: UUID) -> List[Dict[str, Any]]:
        """Get all files for a project"""
        response = (
            self.client.table("files")
            .select("*")
            .eq("project_id", str(project_id))
            .execute()
        )
        return response.data or []

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

    # ========================================================================
    # Abstracts
    # ========================================================================

    async def create_abstract(self, abstract_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create abstract record"""
        response = (
            self.client.table("abstracts").insert(abstract_data).execute()
        )
        return response.data[0] if response.data else None

    async def bulk_create_abstracts(
        self, abstracts_data: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Bulk create abstract records"""
        response = (
            self.client.table("abstracts").insert(abstracts_data).execute()
        )
        return response.data or []

    async def get_abstracts_by_project(
        self, project_id: UUID, status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get abstracts for a project, optionally filtered by status"""
        query = self.client.table("abstracts").select("*").eq("project_id", str(project_id))

        if status:
            query = query.eq("status", status)

        response = query.order("created_at", desc=False).execute()
        return response.data or []

    async def update_abstract_decision(
        self, abstract_id: UUID, decision_data: Dict[str, Any]
    ) -> Dict[str, Any]:
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

    async def create_analysis_run(self, run_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create analysis run record"""
        response = (
            self.client.table("analysis_runs").insert(run_data).execute()
        )
        return response.data[0] if response.data else None

    async def update_analysis_run(
        self, run_id: UUID, update_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update analysis run"""
        response = (
            self.client.table("analysis_runs")
            .update(update_data)
            .eq("id", str(run_id))
            .execute()
        )
        return response.data[0] if response.data else None

    async def get_analysis_runs_by_project(
        self, project_id: UUID
    ) -> List[Dict[str, Any]]:
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

    async def save_query_string(self, query_data: Dict[str, Any]) -> Dict[str, Any]:
        """Save generated query string"""
        response = (
            self.client.table("query_strings").insert(query_data).execute()
        )
        return response.data[0] if response.data else None

    async def get_query_strings_by_project(
        self, project_id: UUID
    ) -> List[Dict[str, Any]]:
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
