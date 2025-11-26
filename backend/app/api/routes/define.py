"""
MedAI Hub - Define Tool API Routes
Handles research question formulation with AI chat
"""

import logging

from fastapi import APIRouter, HTTPException, status, Depends
from app.api.models.schemas import ChatRequest, ChatResponse, FrameworkSchemaResponse
from app.services.database import db_service
from app.services.ai_service import ai_service
from app.core.auth import get_current_user, UserPayload

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/define", tags=["define"])


@router.get("/frameworks", response_model=FrameworkSchemaResponse)
async def get_frameworks():
    """Get all available research framework schemas"""
    return FrameworkSchemaResponse()


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Handle chat interaction for research question formulation

    This endpoint:
    1. Saves the user's message
    2. Gets AI response based on framework type
    3. Extracts framework data from conversation
    4. Updates project with extracted data
    5. Returns AI response and extracted fields
    """
    try:
        # Verify project exists
        project = await db_service.get_project(request.project_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        # Verify ownership
        if project.get("user_id") and project["user_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
            )

        # Save user message
        await db_service.save_message(
            {
                "project_id": str(request.project_id),
                "role": "user",
                "content": request.message,
            }
        )

        # Get conversation history
        conversation = await db_service.get_conversation(request.project_id)

        # Convert to format expected by AI service
        chat_history = [
            {"role": msg["role"], "content": msg["content"]} for msg in conversation
        ]

        # Get AI response (returns dict with chat_response and framework_data)
        framework_type = request.framework_type or project.get("framework_type", "PICO")
        language = request.language or "en"
        ai_result = await ai_service.chat_for_define(
            message=request.message,
            conversation_history=chat_history,
            framework_type=framework_type,
            language=language,
        )

        # Extract parts
        ai_response = ai_result.get("chat_response", "")
        extracted_data = ai_result.get("framework_data", {})

        # Save AI response (only the chat_response text, not the full JSON)
        await db_service.save_message(
            {
                "project_id": str(request.project_id),
                "role": "assistant",
                "content": ai_response,
            }
        )

        # Update project with extracted data if any
        if extracted_data:
            await db_service.update_project(
                request.project_id,
                {
                    "framework_type": framework_type,
                    "framework_data": extracted_data,
                },
            )

        return ChatResponse(
            message=ai_response,
            framework_data=extracted_data if extracted_data else None,
            extracted_fields=extracted_data if extracted_data else None,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error in chat for project {request.project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your message.",
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
        if project and project.get("user_id") and project["user_id"] != current_user.id:
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
        if project and project.get("user_id") and project["user_id"] != current_user.id:
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
