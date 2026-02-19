"""
MedAI Hub - Review Workflow API Routes
======================================

API endpoints for the LangGraph-powered systematic review workflow.
Manages the orchestrated multi-stage review process.

Endpoints:
    POST /api/v1/review/message - Send a message to the review workflow
    GET /api/v1/review/state/{project_id} - Get current workflow state
    POST /api/v1/review/reset/{project_id} - Reset workflow to initial state
"""

import logging
from typing import Dict, Any, Optional, List
from uuid import UUID

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from langchain_core.messages import HumanMessage, AIMessage

from app.core.auth import get_current_user, UserPayload
from app.services.database import db_service
from app.graph import (
    get_graph,
    get_initial_state,
    get_stage_display_name,
    ReviewStage,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/review", tags=["review"])


# ============================================================================
# Request/Response Models
# ============================================================================

class ReviewMessageRequest(BaseModel):
    """Request to send a message to the review workflow."""
    project_id: UUID = Field(..., description="UUID of the project")
    message: str = Field(..., min_length=1, description="User message text")
    language: Optional[str] = Field(default="en", pattern="^(en|he)$", description="Response language")

    class Config:
        json_schema_extra = {
            "example": {
                "project_id": "123e4567-e89b-12d3-a456-426614174000",
                "message": "I want to study the effects of exercise on depression in elderly patients",
                "language": "en"
            }
        }


class ReviewMessageResponse(BaseModel):
    """Response from the review workflow."""
    message: str = Field(..., description="AI response text")
    current_stage: str = Field(..., description="Current workflow stage")
    stage_display_name: str = Field(..., description="Human-readable stage name")
    status: str = Field(..., description="Workflow status (active, waiting_for_user, completed)")
    artifacts: Dict[str, Any] = Field(default_factory=dict, description="Completed artifacts")
    next_action: Optional[str] = Field(None, description="Suggested next action for user")

    class Config:
        json_schema_extra = {
            "example": {
                "message": "[STAGE: Research Question]\n\nGreat! Let's formulate your research question...",
                "current_stage": "research_question",
                "stage_display_name": "Research Question",
                "status": "waiting_for_user",
                "artifacts": {},
                "next_action": "Describe your research topic or question"
            }
        }


class ReviewStateResponse(BaseModel):
    """Response containing current workflow state."""
    project_id: str
    current_stage: str
    stage_display_name: str
    status: str
    artifacts: Dict[str, Any]
    message_count: int
    errors: List[str]


class ReviewResetResponse(BaseModel):
    """Response from workflow reset."""
    project_id: str
    status: str
    message: str


# ============================================================================
# API Endpoints
# ============================================================================

@router.post("/message", response_model=ReviewMessageResponse)
async def send_message(
    request: ReviewMessageRequest,
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Send a message to the systematic review workflow.

    This endpoint:
    1. Validates project ownership
    2. Initializes or retrieves workflow state
    3. Invokes the LangGraph with user message
    4. Returns AI response and updated state

    The workflow uses the project_id as the thread ID for state persistence.
    """
    try:
        # Verify project exists and user has access
        project = await db_service.get_project(str(request.project_id))
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )

        if project.get("owner_id") and project["owner_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Get the compiled graph
        graph = get_graph()

        # Thread ID for state persistence (use project_id)
        thread_id = str(request.project_id)
        config = {"configurable": {"thread_id": thread_id}}

        # Get existing state or create initial state
        try:
            existing_state = graph.get_state(config)
            if existing_state.values:
                # State exists, use it
                current_stage = existing_state.values.get("current_stage", "research_question")
                language = existing_state.values.get("language", request.language)
            else:
                # Initialize new state
                current_stage = "research_question"
                language = request.language
        except Exception:
            # No existing state, will be initialized on first invoke
            current_stage = "research_question"
            language = request.language

        # Create input with user message
        user_message = HumanMessage(content=request.message)

        input_state = {
            "messages": [user_message],
            "project_id": thread_id,
            "user_id": current_user.id,
            "language": language,
            "current_stage": current_stage,
            "status": "active",
        }

        # Invoke the graph
        logger.info(f"Invoking graph for project {thread_id}, stage: {current_stage}")
        result = await graph.ainvoke(input_state, config=config)

        # Extract response
        messages = result.get("messages", [])
        ai_response = ""

        # Get the last AI message
        for msg in reversed(messages):
            if isinstance(msg, AIMessage):
                ai_response = msg.content
                break
            elif hasattr(msg, 'type') and msg.type == "ai":
                ai_response = msg.content
                break

        if not ai_response:
            ai_response = "I'm processing your request. Please continue."

        # Get updated state info
        updated_stage = result.get("current_stage", current_stage)
        updated_status = result.get("status", "waiting_for_user")
        artifacts = result.get("artifacts", {})
        next_action = result.get("next_action", "Continue describing your research topic")

        return ReviewMessageResponse(
            message=ai_response,
            current_stage=updated_stage,
            stage_display_name=get_stage_display_name(updated_stage, language),
            status=updated_status,
            artifacts=artifacts,
            next_action=next_action
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error in review message for project {request.project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing your message: {str(e)}"
        )


@router.get("/state/{project_id}", response_model=ReviewStateResponse)
async def get_state(
    project_id: UUID,
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Get the current workflow state for a project.

    Returns the current stage, status, artifacts, and message count.
    """
    try:
        # Verify project exists and user has access
        project = await db_service.get_project(str(project_id))
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )

        if project.get("owner_id") and project["owner_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Get the graph and check state
        graph = get_graph()
        thread_id = str(project_id)
        config = {"configurable": {"thread_id": thread_id}}

        try:
            state_snapshot = graph.get_state(config)
            if state_snapshot.values:
                state = state_snapshot.values
                return ReviewStateResponse(
                    project_id=thread_id,
                    current_stage=state.get("current_stage", "research_question"),
                    stage_display_name=get_stage_display_name(
                        state.get("current_stage", "research_question"),
                        state.get("language", "en")
                    ),
                    status=state.get("status", "active"),
                    artifacts=state.get("artifacts", {}),
                    message_count=len(state.get("messages", [])),
                    errors=state.get("errors", [])
                )
        except Exception:
            pass

        # No state exists yet
        return ReviewStateResponse(
            project_id=thread_id,
            current_stage="research_question",
            stage_display_name="Research Question",
            status="not_started",
            artifacts={},
            message_count=0,
            errors=[]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting state for project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving the workflow state."
        )


@router.post("/reset/{project_id}", response_model=ReviewResetResponse)
async def reset_workflow(
    project_id: UUID,
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Reset the workflow state for a project.

    This clears all conversation history and artifacts,
    starting fresh from the research_question stage.
    """
    try:
        # Verify project exists and user has access
        project = await db_service.get_project(str(project_id))
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )

        if project.get("owner_id") and project["owner_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Get the graph
        graph = get_graph()
        thread_id = str(project_id)
        config = {"configurable": {"thread_id": thread_id}}

        # Reset by invoking with initial state
        # Note: MemorySaver doesn't have a delete method, so we overwrite
        initial_state = get_initial_state(
            project_id=thread_id,
            user_id=current_user.id,
            language="en"
        )

        # Update state by invoking with empty message
        # This effectively resets the conversation
        await graph.ainvoke(initial_state, config=config)

        return ReviewResetResponse(
            project_id=thread_id,
            status="reset",
            message="Workflow has been reset to initial state. Ready to start a new systematic review."
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error resetting workflow for project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while resetting the workflow."
        )


@router.get("/stages", response_model=Dict[str, Any])
async def get_stages():
    """
    Get information about all workflow stages.

    Returns stage names, display names, and order.
    """
    from app.graph.state import get_stage_order, STAGE_DISPLAY_NAMES

    stages = get_stage_order()
    result = {
        "stages": [],
        "total_stages": len(stages)
    }

    for idx, stage in enumerate(stages, 1):
        result["stages"].append({
            "id": stage,
            "order": idx,
            "display_name_en": STAGE_DISPLAY_NAMES.get(stage, {}).get("en", stage),
            "display_name_he": STAGE_DISPLAY_NAMES.get(stage, {}).get("he", stage),
        })

    return result
