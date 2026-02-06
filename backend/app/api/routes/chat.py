"""
MedAI Hub - Chat API Route (SSE Streaming)
===========================================

Main chat endpoint that replaces SR-Portal's /api/chat route.
Receives messages from the frontend ChatInterface, loads the appropriate
skill prompt, and streams Gemini response as Server-Sent Events (SSE).

Phase 1 additions:
- Message persistence: saves user + AI messages to Supabase
- Conversation management: finds or creates conversations per project+stage
- Artifact detection: extracts ```artifact:filename.ext``` blocks and saves them

Endpoint:
    POST /api/v1/chat - Send message and receive streaming SSE response
"""

import logging
import json
import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from app.core.auth import get_current_user, get_optional_user, UserPayload
from app.core.config import settings
from app.services.database import db_service
from app.services.skill_loader import load_skill, load_skill_for_stage, STAGE_SKILL_MAP, STANDALONE_SKILL_MAP

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


# ============================================================================
# Request/Response Models
# ============================================================================

class ChatMessage(BaseModel):
    """A single chat message."""
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., min_length=1)


class ChatRequest(BaseModel):
    """
    Chat request from the SR-Portal frontend.
    Matches the format sent by ChatInterface.tsx.
    """
    messages: list[ChatMessage] = Field(..., min_length=1)
    skillName: str = Field(..., min_length=1, description="Skill or stage name")
    projectContext: Optional[dict] = Field(
        None,
        description="Project context with projectId, stage, stageName"
    )
    language: Optional[str] = Field(default="he", pattern="^(he|en)$")
    attachedFileContent: Optional[str] = Field(None, description="Content of attached file")

    class Config:
        json_schema_extra = {
            "example": {
                "messages": [
                    {"role": "user", "content": "I want to study exercise effects on depression in elderly"}
                ],
                "skillName": "research-question",
                "projectContext": {
                    "projectId": "abc-123",
                    "stage": "question",
                    "stageName": "Research Question"
                },
                "language": "he"
            }
        }


# ============================================================================
# Helper Functions
# ============================================================================

def _resolve_skill_name(skill_name: str) -> str:
    """
    Resolve a skill name from the frontend to the actual skill directory name.

    The frontend may send either:
    - A stage slug (e.g., 'question', 'protocol')
    - A skill name directly (e.g., 'research-question', 'protocol-builder')
    - A standalone tool name (e.g., 'article-appraisal')
    """
    # Check if it's a stage slug first
    if skill_name in STAGE_SKILL_MAP:
        return STAGE_SKILL_MAP[skill_name]["skill_name"]

    # Check standalone tools
    if skill_name in STANDALONE_SKILL_MAP:
        return STANDALONE_SKILL_MAP[skill_name]["skill_name"]

    # It might already be the skill name
    return skill_name


def _get_model_for_skill(skill_name: str) -> str:
    """Get the appropriate Gemini model for a skill."""
    # Check stage map
    for config in STAGE_SKILL_MAP.values():
        if config["skill_name"] == skill_name:
            return config["model"]

    # Check standalone map
    for config in STANDALONE_SKILL_MAP.values():
        if config["skill_name"] == skill_name:
            return config["model"]

    # Default to pro
    return "pro"


def _get_gemini_model_name(model_tier: str) -> str:
    """Map model tier to actual Gemini model name from settings."""
    if model_tier == "flash":
        return settings.GEMINI_FLASH_MODEL
    return settings.GEMINI_PRO_MODEL


def _build_system_instruction(
    skill_content: str,
    language: str = "he",
    project_context: Optional[dict] = None,
    has_file: bool = False,
) -> str:
    """
    Build the full system instruction with portal preamble.
    Adapted from SR-Portal's prompt-adapter.ts.
    """
    # Portal preamble (adapted from prompt-adapter.ts)
    preamble = f"""You are an AI assistant integrated into SystematicOS - a web-based platform for systematic literature reviews.

## Context
- You are communicating through a chat interface in a web portal
- The user is a researcher working on a systematic review project
- Response language: {"Hebrew (עברית)" if language == "he" else "English"}
- {"The user has attached a file. Analyze its content as part of your response." if has_file else ""}

## Response Guidelines
- Format responses with Markdown (headers, bold, lists, tables)
- Use ```artifact:filename.ext``` blocks to generate downloadable files
- Be concise but thorough
- Always maintain academic rigor
"""

    # Project context section
    if project_context:
        preamble += f"""
## Current Project Context
- Stage: {project_context.get('stageName', project_context.get('stage', 'Unknown'))}
- Project ID: {project_context.get('projectId', 'N/A')}
"""

    # Combine preamble with skill instruction
    return f"{preamble}\n\n---\n\n{skill_content}"


# ============================================================================
# Conversation & Message Persistence
# ============================================================================

async def _find_or_create_conversation(
    project_context: Optional[dict],
    user_id: Optional[str],
    skill_name: str,
) -> Optional[dict]:
    """
    Find an existing conversation or create a new one for this project+stage+user.
    Returns the conversation dict, or None if no project context or no user.
    """
    if not project_context or not user_id:
        return None

    project_id = project_context.get("projectId")
    stage_slug = project_context.get("stage")
    stage_name_display = project_context.get("stageName", stage_slug)

    if not project_id or not stage_slug:
        return None

    try:
        # Try to find existing active conversation for this stage
        conversation = await db_service.get_stage_conversation(
            project_id=project_id,
            stage_name=stage_slug,
            user_id=user_id,
        )

        if conversation:
            return conversation

        # No existing conversation - create one
        stage = await db_service.get_stage(project_id, stage_slug)
        stage_id = stage["id"] if stage else None

        conversation = await db_service.create_conversation({
            "project_id": project_id,
            "stage_id": stage_id,
            "user_id": user_id,
            "title": f"Chat - {stage_name_display}",
            "status": "active",
        })

        if conversation:
            logger.info(f"Created conversation {conversation['id']} for project={project_id}, stage={stage_slug}")

        return conversation

    except Exception as e:
        logger.warning(f"Failed to find/create conversation: {e}")
        return None


async def _extract_and_save_artifacts(
    content: str,
    conversation: Optional[dict],
    project_context: Optional[dict],
) -> None:
    """
    Detect ```artifact:filename.ext``` blocks in AI response and save them.
    """
    if not project_context or not conversation:
        return

    project_id = project_context.get("projectId")
    if not project_id:
        return

    # Pattern matches: ```artifact:filename.ext\n...content...\n```
    pattern = r'```artifact:([\w\-\.]+)\n(.*?)```'
    matches = re.findall(pattern, content, re.DOTALL)

    if not matches:
        return

    type_map = {
        'md': 'markdown', 'csv': 'csv', 'html': 'html',
        'txt': 'txt', 'json': 'json', 'r': 'r_script',
        'docx': 'docx', 'pdf': 'pdf',
    }

    for filename, file_content in matches:
        try:
            ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else 'txt'
            file_type = type_map.get(ext, 'txt')

            await db_service.save_artifact({
                "project_id": project_id,
                "stage_id": conversation.get("stage_id"),
                "conversation_id": conversation["id"],
                "filename": filename,
                "display_name": filename,
                "file_type": file_type,
                "content": file_content.strip(),
            })
            logger.info(f"Saved artifact: {filename} for project {project_id}")
        except Exception as e:
            logger.warning(f"Failed to save artifact {filename}: {e}")


# ============================================================================
# Streaming with Persistence
# ============================================================================

async def _stream_gemini_response(
    model_name: str,
    system_instruction: str,
    history: list[dict],
    user_message: str,
    attached_file: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: int = 8192,
):
    """
    Stream response from Gemini as SSE events.
    Yields SSE-formatted strings: 'data: {"content": "..."}\n\n'
    """
    try:
        llm = ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=temperature,
            max_tokens=max_tokens,
            streaming=True,
        )

        # Build message list
        messages = [SystemMessage(content=system_instruction)]

        # Add conversation history
        for msg in history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                messages.append(AIMessage(content=msg["content"]))

        # Build the user message (with optional file content)
        full_user_message = user_message
        if attached_file:
            full_user_message = f"{user_message}\n\n---\n[Attached File Content]:\n{attached_file}"

        messages.append(HumanMessage(content=full_user_message))

        # Stream the response
        async for chunk in llm.astream(messages):
            if chunk.content:
                sse_data = json.dumps({"content": chunk.content}, ensure_ascii=False)
                yield f"data: {sse_data}\n\n"

        # Send done signal
        yield "data: [DONE]\n\n"

    except Exception as e:
        logger.error(f"Gemini streaming error: {e}")
        error_data = json.dumps({"error": str(e)}, ensure_ascii=False)
        yield f"data: {error_data}\n\n"
        yield "data: [DONE]\n\n"


async def _stream_and_persist(
    generator,
    conversation: Optional[dict],
    model_name: str,
    project_context: Optional[dict],
):
    """
    Wrapper around the SSE generator that accumulates the full AI response
    and persists it to the database after streaming completes.
    """
    full_response = ""

    async for chunk in generator:
        # Accumulate content from SSE data chunks
        if chunk.startswith("data: ") and chunk.strip() != "data: [DONE]":
            try:
                data = json.loads(chunk[6:].strip())
                if "content" in data:
                    full_response += data["content"]
            except (json.JSONDecodeError, KeyError):
                pass

        yield chunk

    # After streaming is done, persist the AI message
    if conversation and full_response:
        try:
            await db_service.save_message({
                "conversation_id": conversation["id"],
                "role": "assistant",
                "content": full_response,
                "model_used": model_name,
            })
            logger.info(f"Saved AI response ({len(full_response)} chars) to conversation {conversation['id']}")

            # Extract and save any artifacts
            await _extract_and_save_artifacts(full_response, conversation, project_context)

        except Exception as e:
            logger.warning(f"Failed to persist AI message: {e}")


# ============================================================================
# API Endpoint
# ============================================================================

@router.post("")
async def chat_stream(
    request: ChatRequest,
    current_user: Optional[UserPayload] = Depends(get_optional_user),
):
    """
    Main streaming chat endpoint.

    Receives messages from the SR-Portal ChatInterface,
    loads the appropriate skill prompt, and streams Gemini
    response as Server-Sent Events (SSE).

    Phase 1: Also persists conversations, messages, and artifacts to Supabase.

    The SSE format matches what ChatInterface.tsx expects:
    - data: {"content": "chunk of text"}
    - data: {"error": "error message"}
    - data: [DONE]
    """
    try:
        # 1. Resolve skill name
        resolved_skill = _resolve_skill_name(request.skillName)
        logger.info(f"Chat request: skill={resolved_skill}, messages={len(request.messages)}")

        # 2. Load skill content
        try:
            # Try loading by stage slug first
            skill = load_skill_for_stage(request.skillName)
        except ValueError:
            # Fall back to direct skill name loading
            try:
                skill = load_skill(resolved_skill)
            except FileNotFoundError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unknown skill: {request.skillName}"
                )

        # 3. Build system instruction
        system_instruction = _build_system_instruction(
            skill_content=skill.combined_instruction,
            language=request.language or "he",
            project_context=request.projectContext,
            has_file=bool(request.attachedFileContent),
        )

        # 4. Get the appropriate model
        model_tier = _get_model_for_skill(resolved_skill)
        model_name = _get_gemini_model_name(model_tier)

        # 5. Separate history from the last user message
        messages = request.messages
        if not messages or messages[-1].role != "user":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Last message must be from user"
            )

        last_user_message = messages[-1].content
        history = [{"role": m.role, "content": m.content} for m in messages[:-1]]

        # 6. Find or create conversation for persistence
        user_id = current_user.id if current_user else None
        conversation = await _find_or_create_conversation(
            project_context=request.projectContext,
            user_id=user_id,
            skill_name=resolved_skill,
        )

        # 7. Save user message
        if conversation:
            try:
                await db_service.save_message({
                    "conversation_id": conversation["id"],
                    "role": "user",
                    "content": last_user_message,
                })
            except Exception as e:
                logger.warning(f"Failed to save user message: {e}")

        # 8. Stream the response (with persistence wrapper)
        gemini_stream = _stream_gemini_response(
            model_name=model_name,
            system_instruction=system_instruction,
            history=history,
            user_message=last_user_message,
            attached_file=request.attachedFileContent,
            temperature=settings.TEMPERATURE,
            max_tokens=settings.MAX_TOKENS,
        )

        # Wrap with persistence layer
        persistent_stream = _stream_and_persist(
            generator=gemini_stream,
            conversation=conversation,
            model_name=model_name,
            project_context=request.projectContext,
        )

        return StreamingResponse(
            persistent_stream,
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",  # Disable nginx buffering
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Chat endpoint error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat processing error: {str(e)}"
        )
