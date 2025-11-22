"""
MedAI Hub - Query Tool API Routes
Handles PubMed search query generation
"""

from fastapi import APIRouter, HTTPException, status
from app.api.models.schemas import QueryGenerateRequest, QueryGenerateResponse
from app.services.database import db_service
from app.services.ai_service import ai_service
from uuid import UUID

router = APIRouter(prefix="/query", tags=["query"])


@router.post("/generate", response_model=QueryGenerateResponse)
async def generate_query(request: QueryGenerateRequest):
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

        # Use project's framework data if not provided
        framework_data = request.framework_data
        if not framework_data:
            framework_data = project.get("framework_data", {})

        if not framework_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No framework data available. Please complete the Define tool first.",
            )

        # Generate query using AI
        query_text = await ai_service.generate_pubmed_query(framework_data)

        # Save query to database
        await db_service.save_query_string(
            {
                "project_id": str(request.project_id),
                "query_text": query_text,
                "query_type": request.query_type,
            }
        )

        # Create analysis run record
        await db_service.create_analysis_run(
            {
                "project_id": str(request.project_id),
                "tool": "QUERY",
                "status": "completed",
                "results": {"query_text": query_text, "query_type": request.query_type},
                "config": {"framework_data": framework_data},
            }
        )

        return QueryGenerateResponse(
            query_text=query_text,
            query_type=request.query_type,
            suggestions=[
                "Try using MeSH terms for more precise results",
                "Consider adding year filters: AND 2020:2024[dp]",
                "Use [Title/Abstract] tags to limit search scope",
            ],
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.get("/history/{project_id}")
async def get_query_history(project_id: UUID):
    """Get all generated queries for a project"""
    try:
        queries = await db_service.get_query_strings_by_project(project_id)
        return {"queries": queries}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )
