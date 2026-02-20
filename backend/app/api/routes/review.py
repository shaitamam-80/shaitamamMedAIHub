"""
MedAI Hub - Review Workflow API Routes
======================================

API endpoints for the LangGraph-powered systematic review workflow.
Manages the orchestrated multi-stage review process.

Endpoints:
    POST /api/v1/review/stream   - SSE streaming message (primary - used by frontend)
    POST /api/v1/review/message  - Sync message (fallback)
    GET  /api/v1/review/state/{project_id} - Get current workflow state
    POST /api/v1/review/reset/{project_id} - Reset workflow to initial state
    GET  /api/v1/review/stages   - Get workflow stage definitions
"""

import json
import logging
from typing import Dict, Any, Optional, List
from uuid import UUID

from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import StreamingResponse
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
    """Response from the review workflow (sync endpoint)."""
    message: str = Field(..., description="AI response text")
    current_stage: str = Field(..., description="Current workflow stage")
    stage_display_name: str = Field(..., description="Human-readable stage name")
    status: str = Field(..., description="Workflow status")
    artifacts: Dict[str, Any] = Field(default_factory=dict, description="Completed artifacts")
    next_action: Optional[str] = Field(None, description="Suggested next action")


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
# Helpers
# ============================================================================

async def _validate_project_access(
    project_id: str, user_id: str
) -> Dict[str, Any]:
    """Validate project exists and user has access. Returns project dict."""
    project = await db_service.get_project(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    if project.get("owner_id") and project["owner_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    return project


def _get_current_state(graph, config) -> tuple[str, str]:
    """Get current stage and language from graph state, with defaults."""
    try:
        existing = graph.get_state(config)
        if existing.values:
            return (
                existing.values.get("current_stage", "idea"),
                existing.values.get("language", "en"),
            )
    except Exception:
        pass
    return "idea", "en"


# ============================================================================
# SSE Streaming Endpoint (Primary)
# ============================================================================

@router.post("/stream")
async def stream_message(
    request: ReviewMessageRequest,
    current_user: UserPayload = Depends(get_current_user),
):
    """
    Send a message to the review workflow with SSE streaming response.

    Streams AI response tokens in real-time as they're generated,
    then sends a final state_update event with artifacts and stage info.

    SSE format (compatible with frontend ChatInterface):
        data: {"content": "token"}     — streamed text chunks
        data: {"type": "state_update", "current_stage": "...", "artifacts": {...}}
        data: [DONE]

    Uses astream_events to capture token-level events from the LangGraph
    execution. Filters to only stream tokens from the stage node's
    conversational LLM call (skips orchestrator and extraction calls).
    """
    # Validate before entering the generator
    await _validate_project_access(str(request.project_id), current_user.id)

    graph = get_graph()
    thread_id = str(request.project_id)
    config = {"configurable": {"thread_id": thread_id}}

    current_stage, stored_language = _get_current_state(graph, config)
    language = stored_language if stored_language != "en" else (request.language or "en")

    input_state = {
        "messages": [HumanMessage(content=request.message)],
        "project_id": thread_id,
        "user_id": current_user.id,
        "language": language,
        "current_stage": current_stage,
        "status": "active",
    }

    async def event_generator():
        # Track model calls per node to distinguish conversational vs extraction
        node_model_calls: Dict[str, int] = {}

        try:
            async for event in graph.astream_events(
                input_state, config=config, version="v2"
            ):
                kind = event["event"]
                node = event.get("metadata", {}).get("langgraph_node", "")

                # Count model calls per node
                if kind == "on_chat_model_start":
                    node_model_calls[node] = node_model_calls.get(node, 0) + 1

                # Stream tokens from the stage node's FIRST model call only
                # (First call = conversational response, second = structured extraction)
                if kind == "on_chat_model_stream":
                    if node != "orchestrator" and node_model_calls.get(node, 0) == 1:
                        chunk = event["data"].get("chunk")
                        if chunk and hasattr(chunk, "content") and chunk.content:
                            payload = json.dumps({"content": chunk.content})
                            yield f"data: {payload}\n\n"

            # After graph execution completes, send final state update
            try:
                final_snapshot = graph.get_state(config)
                if final_snapshot.values:
                    state = final_snapshot.values
                    stage = state.get("current_stage", current_stage)
                    state_update = {
                        "type": "state_update",
                        "current_stage": stage,
                        "stage_display_name": get_stage_display_name(stage, language),
                        "status": state.get("status", "waiting_for_user"),
                        "artifacts": state.get("artifacts", {}),
                        "next_action": state.get("next_action", ""),
                    }
                    yield f"data: {json.dumps(state_update)}\n\n"
            except Exception as e:
                logger.warning(f"Failed to get final state: {e}")

        except Exception as e:
            logger.exception(f"Streaming error for project {thread_id}: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ============================================================================
# Sync Message Endpoint (Fallback)
# ============================================================================

@router.post("/message", response_model=ReviewMessageResponse)
async def send_message(
    request: ReviewMessageRequest,
    current_user: UserPayload = Depends(get_current_user),
):
    """
    Send a message to the review workflow (synchronous, non-streaming).

    Returns the full AI response after graph execution completes.
    Use /stream for real-time token streaming.
    """
    try:
        await _validate_project_access(str(request.project_id), current_user.id)

        graph = get_graph()
        thread_id = str(request.project_id)
        config = {"configurable": {"thread_id": thread_id}}

        current_stage, stored_language = _get_current_state(graph, config)
        language = stored_language if stored_language != "en" else (request.language or "en")

        input_state = {
            "messages": [HumanMessage(content=request.message)],
            "project_id": thread_id,
            "user_id": current_user.id,
            "language": language,
            "current_stage": current_stage,
            "status": "active",
        }

        logger.info(f"Invoking graph for project {thread_id}, stage: {current_stage}")
        result = await graph.ainvoke(input_state, config=config)

        # Extract last AI message
        messages = result.get("messages", [])
        ai_response = ""
        for msg in reversed(messages):
            if isinstance(msg, AIMessage):
                ai_response = msg.content
                break
            elif hasattr(msg, "type") and msg.type == "ai":
                ai_response = msg.content
                break

        if not ai_response:
            ai_response = "I'm processing your request. Please continue."

        updated_stage = result.get("current_stage", current_stage)
        return ReviewMessageResponse(
            message=ai_response,
            current_stage=updated_stage,
            stage_display_name=get_stage_display_name(updated_stage, language),
            status=result.get("status", "waiting_for_user"),
            artifacts=result.get("artifacts", {}),
            next_action=result.get("next_action"),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error in review message for project {request.project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing your message: {str(e)}",
        )


# ============================================================================
# State & Management Endpoints
# ============================================================================

@router.get("/state/{project_id}", response_model=ReviewStateResponse)
async def get_state(
    project_id: UUID,
    current_user: UserPayload = Depends(get_current_user),
):
    """Get the current workflow state for a project."""
    try:
        await _validate_project_access(str(project_id), current_user.id)

        graph = get_graph()
        thread_id = str(project_id)
        config = {"configurable": {"thread_id": thread_id}}

        try:
            state_snapshot = graph.get_state(config)
            if state_snapshot.values:
                state = state_snapshot.values
                stage = state.get("current_stage", "idea")
                return ReviewStateResponse(
                    project_id=thread_id,
                    current_stage=stage,
                    stage_display_name=get_stage_display_name(
                        stage, state.get("language", "en")
                    ),
                    status=state.get("status", "active"),
                    artifacts=state.get("artifacts", {}),
                    message_count=len(state.get("messages", [])),
                    errors=state.get("errors", []),
                )
        except Exception:
            pass

        return ReviewStateResponse(
            project_id=thread_id,
            current_stage="idea",
            stage_display_name="Research Idea",
            status="not_started",
            artifacts={},
            message_count=0,
            errors=[],
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting state for project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving the workflow state.",
        )


@router.post("/reset/{project_id}", response_model=ReviewResetResponse)
async def reset_workflow(
    project_id: UUID,
    current_user: UserPayload = Depends(get_current_user),
):
    """Reset the workflow state for a project back to initial state."""
    try:
        await _validate_project_access(str(project_id), current_user.id)

        graph = get_graph()
        thread_id = str(project_id)
        config = {"configurable": {"thread_id": thread_id}}

        initial_state = get_initial_state(
            project_id=thread_id,
            user_id=current_user.id,
            language="en",
        )
        await graph.ainvoke(initial_state, config=config)

        return ReviewResetResponse(
            project_id=thread_id,
            status="reset",
            message="Workflow has been reset to initial state.",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error resetting workflow for project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while resetting the workflow.",
        )


@router.get("/stages", response_model=Dict[str, Any])
async def get_stages():
    """Get information about all workflow stages."""
    from app.graph.state import get_stage_order, STAGE_DISPLAY_NAMES

    stages = get_stage_order()
    return {
        "stages": [
            {
                "id": stage,
                "order": idx,
                "display_name_en": STAGE_DISPLAY_NAMES.get(stage, {}).get("en", stage),
                "display_name_he": STAGE_DISPLAY_NAMES.get(stage, {}).get("he", stage),
            }
            for idx, stage in enumerate(stages, 1)
        ],
        "total_stages": len(stages),
    }
