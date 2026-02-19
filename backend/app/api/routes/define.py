"""
MedAI Hub - Define Tool API Routes
Handles research question formulation with AI chat

NOTE: This module is under migration to SystematicOS LangGraph architecture.
All AI-dependent endpoints return 501 Not Implemented until migration is complete.
"""

import logging

from fastapi import APIRouter, HTTPException, status, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.api.models.schemas import (
    ChatRequest,
    ChatResponse,
    FrameworkSchemaResponse,
    FinerAssessmentRequest,
    FinerAssessmentResponse,
)
from app.services.database import db_service
from app.core.auth import get_current_user, UserPayload

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/define", tags=["define"])
limiter = Limiter(key_func=get_remote_address)


@router.get("/frameworks", response_model=FrameworkSchemaResponse)
async def get_frameworks():
    """Get all available research framework schemas"""
    return FrameworkSchemaResponse()


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("10/minute")
async def chat(
    request: Request,
    chat_request: ChatRequest,
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Handle chat interaction for research question formulation

    NOTE: This endpoint is under migration to SystematicOS architecture.
    """
    # Migration placeholder - AI logic removed
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint under migration to SystematicOS architecture"
    )


@router.get("/conversation/{project_id}")
async def get_conversation(
    project_id: str,
    current_user: UserPayload = Depends(get_current_user)
):
    """Get full conversation history for a project"""
    try:
        # Verify project ownership
        project = await db_service.get_project(project_id)
        if project and project.get("owner_id") and project["owner_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
            )

        conversation = await db_service.get_conversation(project_id)
        return {"messages": conversation}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting conversation for project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving the conversation.",
        )


@router.delete("/conversation/{project_id}")
async def clear_conversation(
    project_id: str,
    current_user: UserPayload = Depends(get_current_user)
):
    """Clear all chat history for a project"""
    try:
        # Verify project ownership
        project = await db_service.get_project(project_id)
        if project and project.get("owner_id") and project["owner_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
            )

        success = await db_service.clear_conversation(project_id)
        if success:
            return {"status": "cleared", "project_id": project_id}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to clear conversation"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error clearing conversation for project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while clearing the conversation.",
        )


@router.post("/finer-assessment", response_model=FinerAssessmentResponse)
async def assess_finer(
    request: FinerAssessmentRequest,
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Evaluate a research question using the FINER criteria.

    NOTE: This endpoint is under migration to SystematicOS architecture.
    """
    # Migration placeholder - AI logic removed
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint under migration to SystematicOS architecture"
    )
