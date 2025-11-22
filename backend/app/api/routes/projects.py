"""
MedAI Hub - Projects API Routes
Handles project CRUD operations
"""

from fastapi import APIRouter, HTTPException, status
from app.api.models.schemas import ProjectCreate, ProjectUpdate, ProjectResponse
from app.services.database import db_service
from typing import List
from uuid import UUID

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(project: ProjectCreate):
    """Create a new research project"""
    try:
        project_data = project.model_dump()
        created_project = await db_service.create_project(project_data)

        if not created_project:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create project",
            )

        return created_project
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.get("/", response_model=List[ProjectResponse])
async def list_projects(limit: int = 100):
    """List all projects"""
    try:
        projects = await db_service.list_projects(limit=limit)
        return projects
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: UUID):
    """Get a specific project by ID"""
    try:
        project = await db_service.get_project(project_id)

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        return project
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: UUID, project_update: ProjectUpdate):
    """Update a project"""
    try:
        # Check if project exists
        existing_project = await db_service.get_project(project_id)
        if not existing_project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )
