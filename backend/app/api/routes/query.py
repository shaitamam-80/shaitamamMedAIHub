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
