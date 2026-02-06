"""
MedAI Hub - Database Service
============================

Handles Supabase database operations using the unified schema
shared between SR-Portal frontend and MedAI Hub backend.

Tables (from 001_initial_schema.sql):
    - profiles: User profiles (extends auth.users)
    - projects: Research projects
    - project_stages: 10 stages per project
    - conversations: Chat conversations per stage
    - messages: Individual chat messages
    - artifacts: Generated files/documents
    - project_shares: Collaboration
    - uploaded_files: User file uploads
"""

import logging
from supabase import create_client, Client
from app.core.config import settings
from typing import Optional, List, Dict, Any
from uuid import UUID

logger = logging.getLogger(__name__)


class DatabaseService:
    """Service for database operations with Supabase"""

    def __init__(self):
        self._client: Optional[Client] = None

    @property
    def client(self) -> Client:
        """Lazy initialization of Supabase client"""
        if self._client is None:
            key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY
            if not settings.SUPABASE_URL or not key:
                raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set")
            self._client = create_client(settings.SUPABASE_URL, key)
        return self._client

    # ========================================================================
    # Profiles
    # ========================================================================

    async def get_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user profile by ID."""
        response = (
            self.client.table("profiles")
            .select("*")
            .eq("id", user_id)
            .execute()
        )
        return response.data[0] if response.data else None

    async def update_profile(self, user_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update user profile."""
        response = (
            self.client.table("profiles")
            .update(data)
            .eq("id", user_id)
            .execute()
        )
        return response.data[0] if response.data else None

    # ========================================================================
    # Projects
    # ========================================================================

    async def create_project(self, project_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a new project. Triggers auto-creation of 10 stages."""
        response = (
            self.client.table("projects").insert(project_data).execute()
        )
        return response.data[0] if response.data else None

    async def get_project(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Get project by ID."""
        response = (
            self.client.table("projects")
            .select("*")
            .eq("id", project_id)
            .execute()
        )
        return response.data[0] if response.data else None

    async def update_project(
        self, project_id: str, update_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update project fields."""
        response = (
            self.client.table("projects")
            .update(update_data)
            .eq("id", project_id)
            .execute()
        )
        return response.data[0] if response.data else None

    async def list_projects(
        self, owner_id: Optional[str] = None, status: Optional[str] = None, limit: int = 100
    ) -> List[Dict[str, Any]]:
        """List projects, optionally filtered by owner and status."""
        query = self.client.table("projects").select("*")

        if owner_id:
            query = query.eq("owner_id", owner_id)
        if status:
            query = query.eq("status", status)

        response = query.order("created_at", desc=True).limit(limit).execute()
        return response.data or []

    async def delete_project(self, project_id: str) -> bool:
        """Delete a project and all associated data (CASCADE)."""
        try:
            self.client.table("projects").delete().eq("id", project_id).execute()
            return True
        except Exception as e:
            logger.error(f"Failed to delete project {project_id}: {e}")
            return False

    # ========================================================================
    # Project Stages
    # ========================================================================

    async def get_project_stages(self, project_id: str) -> List[Dict[str, Any]]:
        """Get all stages for a project, ordered by stage name."""
        response = (
            self.client.table("project_stages")
            .select("*")
            .eq("project_id", project_id)
            .execute()
        )
        return response.data or []

    async def get_stage(self, project_id: str, stage_name: str) -> Optional[Dict[str, Any]]:
        """Get a specific stage for a project."""
        response = (
            self.client.table("project_stages")
            .select("*")
            .eq("project_id", project_id)
            .eq("stage_name", stage_name)
            .execute()
        )
        return response.data[0] if response.data else None

    async def update_stage(
        self, stage_id: str, update_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update a stage's status, metrics, etc."""
        response = (
            self.client.table("project_stages")
            .update(update_data)
            .eq("id", stage_id)
            .execute()
        )
        return response.data[0] if response.data else None

    # ========================================================================
    # Conversations
    # ========================================================================

    async def create_conversation(self, conversation_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a new conversation."""
        response = (
            self.client.table("conversations")
            .insert(conversation_data)
            .execute()
        )
        return response.data[0] if response.data else None

    async def get_conversation(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Get a conversation by ID."""
        response = (
            self.client.table("conversations")
            .select("*")
            .eq("id", conversation_id)
            .execute()
        )
        return response.data[0] if response.data else None

    async def get_stage_conversation(
        self, project_id: str, stage_name: str, user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get the active conversation for a project stage and user."""
        # First get the stage ID
        stage = await self.get_stage(project_id, stage_name)
        if not stage:
            return None

        response = (
            self.client.table("conversations")
            .select("*")
            .eq("stage_id", stage["id"])
            .eq("user_id", user_id)
            .eq("status", "active")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        return response.data[0] if response.data else None

    # ========================================================================
    # Messages
    # ========================================================================

    async def save_message(self, message_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Save a chat message."""
        response = (
            self.client.table("messages").insert(message_data).execute()
        )
        return response.data[0] if response.data else None

    async def get_messages(
        self, conversation_id: str, limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get messages for a conversation, ordered chronologically."""
        response = (
            self.client.table("messages")
            .select("*")
            .eq("conversation_id", conversation_id)
            .order("created_at", desc=False)
            .limit(limit)
            .execute()
        )
        return response.data or []

    # ========================================================================
    # Artifacts
    # ========================================================================

    async def save_artifact(self, artifact_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Save an artifact."""
        response = (
            self.client.table("artifacts").insert(artifact_data).execute()
        )
        return response.data[0] if response.data else None

    async def get_project_artifacts(
        self, project_id: str, stage_name: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get artifacts for a project, optionally filtered by stage."""
        query = (
            self.client.table("artifacts")
            .select("*, project_stages!inner(stage_name)")
            .eq("project_id", project_id)
        )

        if stage_name:
            query = query.eq("project_stages.stage_name", stage_name)

        response = query.order("created_at", desc=True).execute()
        return response.data or []

    async def get_artifact(self, artifact_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific artifact."""
        response = (
            self.client.table("artifacts")
            .select("*")
            .eq("id", artifact_id)
            .execute()
        )
        return response.data[0] if response.data else None

    # ========================================================================
    # Uploaded Files
    # ========================================================================

    async def save_uploaded_file(self, file_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Save uploaded file metadata."""
        response = (
            self.client.table("uploaded_files").insert(file_data).execute()
        )
        return response.data[0] if response.data else None

    async def get_project_uploads(
        self, project_id: str, stage_name: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get uploaded files for a project."""
        query = self.client.table("uploaded_files").select("*").eq("project_id", project_id)

        if stage_name:
            # Need to join via stage_id
            stage = await self.get_stage(project_id, stage_name)
            if stage:
                query = query.eq("stage_id", stage["id"])

        response = query.order("created_at", desc=True).execute()
        return response.data or []


# Global instance
db_service = DatabaseService()
