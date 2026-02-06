"""
MedAI Hub - Projects API Routes
Handles project CRUD operations.
Aligned with Supabase projects table schema (001_initial_schema.sql).
"""

import logging
import re
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status, Depends
from app.api.models.schemas import (
    ProjectCreate, ProjectUpdate, ProjectResponse,
    StageStatusUpdate, ConversationMessagesResponse,
)
from app.services.database import db_service
from app.core.auth import get_current_user, UserPayload

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/projects", tags=["projects"])


def slugify(text: str) -> str:
    """Generate a URL-safe slug from text. Handles Hebrew and English."""
    text = text.lower().strip()
    # Replace Hebrew/non-latin chars with empty, keep alphanumeric, spaces, hyphens
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    text = text.strip('-')
    return text[:100] if text else 'untitled'


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project: ProjectCreate,
    current_user: UserPayload = Depends(get_current_user)
):
    """Create a new research project. Auto-generates slug and triggers 10 stage creation."""
    try:
        project_data = project.model_dump()
        project_data["owner_id"] = current_user.id
        project_data["slug"] = slugify(project_data["title"])

        created_project = await db_service.create_project(project_data)

        if not created_project:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create project",
            )

        return created_project
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error creating project: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating the project.",
        )


@router.get("/", response_model=List[ProjectResponse])
async def list_projects(
    limit: int = 100,
    current_user: UserPayload = Depends(get_current_user)
):
    """List user's projects"""
    try:
        projects = await db_service.list_projects(owner_id=current_user.id, limit=limit)
        return projects
    except Exception as e:
        logger.exception(f"Error listing projects for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving projects.",
        )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: UUID,
    current_user: UserPayload = Depends(get_current_user)
):
    """Get a specific project by ID"""
    try:
        project = await db_service.get_project(str(project_id))

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        # Verify ownership
        if project.get("owner_id") and project["owner_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
            )

        return project
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving the project.",
        )


@router.get("/{project_id}/stages")
async def get_project_stages(
    project_id: UUID,
    current_user: UserPayload = Depends(get_current_user)
):
    """Get all 10 stages for a project with their current status."""
    try:
        # Verify project exists and user has access
        project = await db_service.get_project(str(project_id))
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        if project.get("owner_id") and project["owner_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
            )

        stages = await db_service.get_project_stages(str(project_id))
        return stages
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting stages for project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving project stages.",
        )


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID,
    project_update: ProjectUpdate,
    current_user: UserPayload = Depends(get_current_user)
):
    """Update a project"""
    try:
        existing_project = await db_service.get_project(str(project_id))
        if not existing_project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        if existing_project.get("owner_id") and existing_project["owner_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
            )

        update_data = project_update.model_dump(exclude_unset=True)
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update",
            )

        updated_project = await db_service.update_project(str(project_id), update_data)
        return updated_project
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error updating project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating the project.",
        )


@router.delete("/{project_id}")
async def delete_project(
    project_id: UUID,
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Delete a project and all associated data.
    CASCADE deletes all related stages, conversations, messages, artifacts.
    """
    try:
        existing_project = await db_service.get_project(str(project_id))
        if not existing_project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        if existing_project.get("owner_id") and existing_project["owner_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
            )

        success = await db_service.delete_project(str(project_id))
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete project",
            )

        return {"status": "success", "id": str(project_id), "message": "Project deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error deleting project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while deleting the project.",
        )


# ============================================================================
# Phase 2: Stage Workflow Endpoints
# ============================================================================

# Ordered stage names for progress calculation
STAGE_ORDER = [
    'idea', 'question', 'protocol', 'search', 'screening',
    'extraction', 'rob', 'synthesis', 'grade', 'manuscript',
]


@router.get("/{project_id}/stages/{stage_name}/messages", response_model=ConversationMessagesResponse)
async def get_stage_messages(
    project_id: UUID,
    stage_name: str,
    current_user: UserPayload = Depends(get_current_user)
):
    """Get conversation messages for a specific project stage."""
    try:
        # Verify project access
        project = await db_service.get_project(str(project_id))
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        if project.get("owner_id") and project["owner_id"] != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

        # Find the active conversation for this stage
        conversation = await db_service.get_stage_conversation(
            str(project_id), stage_name, current_user.id
        )

        if not conversation:
            return {"conversation_id": None, "messages": []}

        # Get messages
        messages = await db_service.get_messages(conversation["id"], limit=200)
        return {
            "conversation_id": conversation["id"],
            "messages": messages,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting messages for project {project_id}, stage {stage_name}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving stage messages.",
        )


@router.patch("/{project_id}/stages/{stage_name}")
async def update_stage_status(
    project_id: UUID,
    stage_name: str,
    body: StageStatusUpdate,
    current_user: UserPayload = Depends(get_current_user)
):
    """Update a stage's status. Auto-recalculates project progress and current_stage."""
    try:
        # Verify project access
        project = await db_service.get_project(str(project_id))
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        if project.get("owner_id") and project["owner_id"] != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

        # Get the stage
        stage = await db_service.get_stage(str(project_id), stage_name)
        if not stage:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stage not found")

        # Build update data with timestamps
        now = datetime.now(timezone.utc).isoformat()
        update_data = {"status": body.status}

        if body.status == "in_progress" and not stage.get("started_at"):
            update_data["started_at"] = now
        elif body.status == "completed":
            update_data["completed_at"] = now

        # Update the stage
        updated_stage = await db_service.update_stage(stage["id"], update_data)

        # Recalculate project progress
        all_stages = await db_service.get_project_stages(str(project_id))
        completed_count = sum(1 for s in all_stages if s.get("status") == "completed")
        progress = int((completed_count / 10) * 100)

        # Find the first non-completed stage (in order) as current_stage
        completed_names = {s["stage_name"] for s in all_stages if s.get("status") == "completed"}
        current_stage = "manuscript"  # default: all done
        for sn in STAGE_ORDER:
            if sn not in completed_names:
                current_stage = sn
                break

        # Update project
        await db_service.update_project(str(project_id), {
            "progress_percentage": progress,
            "current_stage": current_stage,
        })

        return updated_stage
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error updating stage {stage_name} for project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating the stage.",
        )


@router.get("/{project_id}/artifacts")
async def get_project_artifacts(
    project_id: UUID,
    stage_name: Optional[str] = Query(None, description="Filter by stage name"),
    current_user: UserPayload = Depends(get_current_user)
):
    """Get all artifacts for a project, optionally filtered by stage."""
    try:
        # Verify project access
        project = await db_service.get_project(str(project_id))
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        if project.get("owner_id") and project["owner_id"] != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

        artifacts = await db_service.get_project_artifacts(str(project_id), stage_name)
        return artifacts
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting artifacts for project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving artifacts.",
        )


@router.get("/{project_id}/artifacts/{artifact_id}")
async def get_artifact(
    project_id: UUID,
    artifact_id: UUID,
    current_user: UserPayload = Depends(get_current_user)
):
    """Get a single artifact by ID (includes content for download)."""
    try:
        # Verify project access
        project = await db_service.get_project(str(project_id))
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        if project.get("owner_id") and project["owner_id"] != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

        artifact = await db_service.get_artifact(str(artifact_id))
        if not artifact:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artifact not found")

        # Verify artifact belongs to this project
        if artifact.get("project_id") != str(project_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Artifact does not belong to this project")

        return artifact
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting artifact {artifact_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving the artifact.",
        )
