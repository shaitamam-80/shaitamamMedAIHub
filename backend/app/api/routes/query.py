"""
MedAI Hub - Query Tool API Routes
Handles PubMed search query generation and execution
"""

import logging
from uuid import UUID
from typing import Optional, List

from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel, Field
from app.api.models.schemas import QueryGenerateRequest, QueryGenerateResponse
from app.services.database import db_service
from app.services.ai_service import ai_service
from app.services.pubmed_service import pubmed_service
from app.core.auth import get_current_user, UserPayload

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/query", tags=["query"])


# ============================================================================
# Additional Pydantic Models for New Endpoints
# ============================================================================

class PubMedSearchRequest(BaseModel):
    """Request to execute a PubMed search"""
    query: str = Field(..., min_length=3, description="PubMed search query")
    max_results: int = Field(default=20, ge=1, le=100, description="Max results to return")
    sort: str = Field(default="relevance", pattern="^(relevance|date)$")


class PubMedArticle(BaseModel):
    """Summary of a PubMed article"""
    pmid: str
    title: str
    authors: str
    journal: str
    pubdate: str
    doi: Optional[str] = None
    pubtype: Optional[List[str]] = None


class PubMedSearchResponse(BaseModel):
    """Response from PubMed search"""
    count: int = Field(..., description="Total matching articles")
    returned: int = Field(..., description="Number of articles returned")
    articles: List[PubMedArticle]
    query: str


class QueryValidationResponse(BaseModel):
    """Response from query validation"""
    valid: bool
    count: int
    query_translation: str
    errors: List[str]


class ResearchQuestionRequest(BaseModel):
    """Request to generate query from a research question"""
    project_id: UUID
    research_question: str = Field(..., min_length=10, description="Research question text")
    framework_type: Optional[str] = None


# ============================================================================
# Existing Endpoints (Updated)
# ============================================================================

@router.post("/generate", response_model=QueryGenerateResponse)
async def generate_query(
    request: QueryGenerateRequest,
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Generate PubMed boolean search query from framework data

    Takes the framework data (e.g., PICO fields) and generates
    an optimized PubMed search query using AI.
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

        # Use project's framework data if not provided
        framework_data = request.framework_data
        if not framework_data:
            framework_data = project.get("framework_data", {})

        if not framework_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No framework data available. Please complete the Define tool first.",
            )

        # Get framework_type from project
        framework_type = project.get("framework_type", "PICO")

        # Generate comprehensive query strategy using AI
        result = await ai_service.generate_pubmed_query(framework_data, framework_type)

        # Save the focused query to database (primary query)
        focused_query = result.get("queries", {}).get("focused", "")
        await db_service.save_query_string(
            {
                "project_id": str(request.project_id),
                "query_text": focused_query,
                "query_type": request.query_type,
            }
        )

        # Create analysis run record
        await db_service.create_analysis_run(
            {
                "project_id": str(request.project_id),
                "tool": "QUERY",
                "status": "completed",
                "results": result,
                "config": {"framework_data": framework_data, "framework_type": framework_type},
            }
        )

        return QueryGenerateResponse(
            message=result.get("message", "Query generated successfully."),
            concepts=result.get("concepts", []),
            queries=result.get("queries", {"broad": "", "focused": "", "clinical_filtered": ""}),
            toolbox=result.get("toolbox", []),
            framework_type=framework_type,
            framework_data=framework_data
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error generating query for project {request.project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while generating the query.",
        )


@router.get("/history/{project_id}")
async def get_query_history(
    project_id: UUID,
    current_user: UserPayload = Depends(get_current_user)
):
    """Get all generated queries for a project"""
    try:
        # Verify project ownership
        project = await db_service.get_project(project_id)
        if project and project.get("user_id") and project["user_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
            )

        queries = await db_service.get_query_strings_by_project(project_id)
        return {"queries": queries}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting query history for project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving query history.",
        )


# ============================================================================
# New Endpoints: PubMed Search Execution
# ============================================================================

@router.post("/execute", response_model=PubMedSearchResponse)
async def execute_pubmed_search(
    request: PubMedSearchRequest,
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Execute a PubMed search query and return results.

    This allows running queries directly from the app without
    leaving to PubMed's website.
    """
    try:
        result = await pubmed_service.search(
            query=request.query,
            max_results=request.max_results,
            sort=request.sort
        )

        return PubMedSearchResponse(
            count=result["count"],
            returned=result["returned"],
            articles=[PubMedArticle(**article) for article in result["articles"]],
            query=result["query"]
        )

    except Exception as e:
        logger.exception(f"Error executing PubMed search: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/validate", response_model=QueryValidationResponse)
async def validate_query(
    request: PubMedSearchRequest,
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Validate a PubMed query syntax and return the result count.

    Useful for checking query syntax before executing a full search.
    """
    try:
        result = await pubmed_service.validate_query(request.query)
        return QueryValidationResponse(**result)

    except Exception as e:
        logger.exception(f"Error validating query: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/abstract/{pmid}")
async def get_abstract(
    pmid: str,
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Fetch full abstract for a specific PubMed article.

    Args:
        pmid: PubMed ID of the article
    """
    try:
        result = await pubmed_service.get_abstract(pmid)

        if result is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Article with PMID {pmid} not found"
            )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error fetching abstract for PMID {pmid}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ============================================================================
# New Endpoint: Get Research Questions from Project
# ============================================================================

@router.get("/research-questions/{project_id}")
async def get_research_questions(
    project_id: UUID,
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Get research questions extracted from a project's Define chat.

    Returns framework data and any formulated questions found
    in the conversation history.
    """
    try:
        # Verify project ownership
        project = await db_service.get_project(project_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )

        if project.get("user_id") and project["user_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Get conversation history
        conversation = await db_service.get_conversation(project_id)

        # Extract research questions from assistant messages
        questions = []
        import re

        def is_english(text: str) -> bool:
            """Check if text is primarily English (ASCII letters)"""
            # Count English letters vs Hebrew letters
            english_chars = sum(1 for c in text if c.isascii() and c.isalpha())
            total_letters = sum(1 for c in text if c.isalpha())
            if total_letters == 0:
                return False
            return (english_chars / total_letters) > 0.7

        for msg in conversation:
            if msg.get("role") == "assistant":
                content = msg.get("content", "")

                # Look for quoted questions
                patterns = [
                    r'"([^"]+\?)"',  # Standard quotes ending with ?
                    r'"([^"]+\?)"',  # Hebrew quotes ending with ?
                ]

                for pattern in patterns:
                    matches = re.findall(pattern, content)
                    for match in matches:
                        # Only include English questions (PubMed doesn't support Hebrew)
                        if len(match) >= 30 and is_english(match):
                            if match not in questions:
                                questions.append(match)

        # Translate framework_data to English (PubMed requires English)
        english_framework_data = await ai_service._translate_framework_data(
            project.get("framework_data", {})
        )

        return {
            "project_id": str(project_id),
            "project_name": project.get("name", ""),
            "framework_type": project.get("framework_type", "PICO"),
            "framework_data": english_framework_data,
            "research_questions": questions[:5]  # Max 5 questions
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting research questions for project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving research questions.",
        )


@router.post("/generate-from-question", response_model=QueryGenerateResponse)
async def generate_query_from_question(
    request: ResearchQuestionRequest,
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Generate PubMed query from a specific research question.

    This allows users to select which question they want to
    generate a query for.
    """
    try:
        # Verify project exists
        project = await db_service.get_project(request.project_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )

        # Verify ownership
        if project.get("user_id") and project["user_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Get framework data from project
        framework_data = project.get("framework_data", {})
        framework_type = request.framework_type or project.get("framework_type", "PICO")

        # Add research question to framework data for AI context
        enhanced_framework_data = {
            **framework_data,
            "research_question": request.research_question
        }

        # Generate query using AI
        result = await ai_service.generate_pubmed_query(enhanced_framework_data, framework_type)

        # Save the query
        focused_query = result.get("queries", {}).get("focused", "")
        await db_service.save_query_string(
            {
                "project_id": str(request.project_id),
                "query_text": focused_query,
                "query_type": "boolean",
            }
        )

        # Create analysis run record
        await db_service.create_analysis_run(
            {
                "project_id": str(request.project_id),
                "tool": "QUERY",
                "status": "completed",
                "results": result,
                "config": {
                    "framework_data": framework_data,
                    "framework_type": framework_type,
                    "research_question": request.research_question
                },
            }
        )

        return QueryGenerateResponse(
            message=result.get("message", "Query generated successfully."),
            concepts=result.get("concepts", []),
            queries=result.get("queries", {"broad": "", "focused": "", "clinical_filtered": ""}),
            toolbox=result.get("toolbox", []),
            framework_type=framework_type,
            framework_data=framework_data
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error generating query from question: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while generating the query.",
        )
