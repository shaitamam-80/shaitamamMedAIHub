"""
MedAI Hub - Projects API Routes
Handles project CRUD operations
"""

import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, HTTPException, status, Depends
from app.api.models.schemas import ProjectCreate, ProjectUpdate, ProjectResponse
from app.services.database import db_service
from app.core.auth import get_current_user, UserPayload

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project: ProjectCreate,
    current_user: UserPayload = Depends(get_current_user)
):
    """Create a new research project"""
    try:
        project_data = project.model_dump()
        project_data["user_id"] = current_user.id  # Associate with authenticated user
        created_project = await db_service.create_project(project_data)

        if not created_project:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create project",
            )

        return created_project
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
        projects = await db_service.list_projects(user_id=current_user.id, limit=limit)
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
        project = await db_service.get_project(project_id)

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        # Verify ownership
        if project.get("user_id") and project["user_id"] != current_user.id:
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


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID,
    project_update: ProjectUpdate,
    current_user: UserPayload = Depends(get_current_user)
):
    """Update a project"""
    try:
        # Check if project exists
        existing_project = await db_service.get_project(project_id)
        if not existing_project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        # Verify ownership
        if existing_project.get("user_id") and existing_project["user_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
            )

        # Update only provided fields
        update_data = project_update.model_dump(exclude_unset=True)

        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update",
            )

        updated_project = await db_service.update_project(project_id, update_data)

        return updated_project
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error updating project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating the project.",
        )
