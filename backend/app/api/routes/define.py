"""
MedAI Hub - Define Tool API Routes
Handles research question formulation with AI chat
"""

from fastapi import APIRouter, HTTPException, status
from app.api.models.schemas import ChatRequest, ChatResponse, FrameworkSchemaResponse
from app.services.database import db_service
from app.services.ai_service import ai_service

router = APIRouter(prefix="/define", tags=["define"])


@router.get("/frameworks", response_model=FrameworkSchemaResponse)
async def get_frameworks():
    """Get all available research framework schemas"""
    return FrameworkSchemaResponse()


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.get("/conversation/{project_id}")
async def get_conversation(project_id: str):
    """Get full conversation history for a project"""
    try:
        conversation = await db_service.get_conversation(project_id)
        return {"messages": conversation}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.delete("/conversation/{project_id}")
async def clear_conversation(project_id: str):
    """Clear all chat history for a project"""
    try:
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )
