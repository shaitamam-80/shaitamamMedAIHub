"""
MedAI Hub - Review Tool API Routes
Handles MEDLINE file upload, parsing, and AI-powered abstract screening
"""

import logging
import os
import re
import aiofiles
from datetime import datetime
from typing import List
from uuid import UUID

from fastapi import APIRouter, HTTPException, UploadFile, File, status, BackgroundTasks, Depends
from app.api.models.schemas import (
    FileUploadResponse,
    AbstractResponse,
    AbstractUpdateDecision,
    BatchAnalysisRequest,
    BatchAnalysisResponse,
)
from app.services.database import db_service
from app.services.ai_service import ai_service
from app.services.medline_parser import MedlineParser
from app.core.config import settings
from app.core.auth import get_current_user, UserPayload

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/review", tags=["review"])


@router.post("/upload", response_model=FileUploadResponse)
async def upload_medline_file(
    project_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: UserPayload = Depends(get_current_user),
):
    """
    Upload and parse MEDLINE format file

    Accepts .txt or .medline files in PubMed MEDLINE format.
    Automatically parses abstracts and saves to database.
    """
    try:
        # Verify project exists
        project = await db_service.get_project(project_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        # Verify ownership
        if project.get("user_id") and project["user_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
            )

        # Validate file type
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}",
            )

        # Create uploads directory if not exists
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

        # Sanitize filename to prevent path traversal
        safe_basename = os.path.basename(file.filename)
        safe_basename = re.sub(r'[^\w\-_.]', '_', safe_basename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{timestamp}_{safe_basename}"
        file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

        # Read file in chunks to validate size before saving
        MAX_SIZE = settings.MAX_UPLOAD_SIZE
        chunks = []
        total_size = 0

        while True:
            chunk = await file.read(8192)  # Read 8KB at a time
            if not chunk:
                break
            total_size += len(chunk)
            if total_size > MAX_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File exceeds maximum size of {MAX_SIZE // (1024*1024)}MB",
                )
            chunks.append(chunk)

        content = b"".join(chunks)
        file_size = len(content)

        # Save file
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(content)

        # Create file record
        file_record = await db_service.create_file(
            {
                "project_id": str(project_id),
                "filename": file.filename,
                "file_path": file_path,
                "file_size": file_size,
                "file_type": "MEDLINE",
                "status": "uploaded",
            }
        )

        # Parse MEDLINE file in background
        background_tasks.add_task(
            parse_medline_file, file_path, project_id, file_record["id"]
        )

        return FileUploadResponse(
            id=file_record["id"],
            filename=file_record["filename"],
            file_size=file_size,
            status="processing",
            uploaded_at=file_record["uploaded_at"],
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error uploading file for project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while uploading the file. Please try again.",
        )


async def parse_medline_file(file_path: str, project_id: str, file_id: str):
    """Background task to parse MEDLINE file"""
    try:
        # Update file status
        await db_service.client.table("files").update({"status": "processing"}).eq(
            "id", file_id
        ).execute()

        # Parse file
        parser = MedlineParser()
        abstracts = parser.parse_file(file_path)

        # Prepare abstracts for database
        abstract_records = [
            {
                "project_id": project_id,
                "file_id": file_id,
                "pmid": abstract.pmid,
                "title": abstract.title,
                "abstract": abstract.abstract,
                "authors": abstract.authors,
                "journal": abstract.journal,
                "publication_date": abstract.publication_date,
                "keywords": abstract.keywords,
                "metadata": abstract.metadata,
                "status": "pending",
            }
            for abstract in abstracts
        ]

        # Bulk insert abstracts
        if abstract_records:
            await db_service.bulk_create_abstracts(abstract_records)

        # Update file status
        await db_service.client.table("files").update(
            {"status": "completed", "metadata": {"total_abstracts": len(abstracts)}}
        ).eq("id", file_id).execute()

    except Exception as e:
        logger.exception(f"Error parsing MEDLINE file {file_id}: {e}")
        # Update file status to error (with generic message for security)
        await db_service.client.table("files").update(
            {"status": "error", "metadata": {"error": "Failed to parse file"}}
        ).eq("id", file_id).execute()


@router.get("/abstracts/{project_id}", response_model=List[AbstractResponse])
async def get_abstracts(
    project_id: UUID,
    filter_status: str = None,
    current_user: UserPayload = Depends(get_current_user),
):
    """Get all abstracts for a project, optionally filtered by status"""
    try:
        # Verify project exists and ownership
        project = await db_service.get_project(project_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )
        if project.get("user_id") and project["user_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
            )

        abstracts = await db_service.get_abstracts_by_project(project_id, filter_status)
        return abstracts
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting abstracts for project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving abstracts.",
        )


@router.post("/analyze", response_model=BatchAnalysisResponse)
async def analyze_abstracts(
    request: BatchAnalysisRequest,
    background_tasks: BackgroundTasks,
    current_user: UserPayload = Depends(get_current_user),
):
    """
    Run AI-powered batch analysis on abstracts

    Uses Google Gemini to screen abstracts based on inclusion/exclusion criteria
    derived from the project's framework data.
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

        # Create analysis run
        analysis_run = await db_service.create_analysis_run(
            {
                "project_id": str(request.project_id),
                "tool": "REVIEW",
                "status": "running",
                "config": {
                    "criteria": request.criteria or project.get("framework_data", {}),
                    "batch_size": request.batch_size,
                },
            }
        )

        # Get pending abstracts
        abstracts = await db_service.get_abstracts_by_project(
            request.project_id, status="pending"
        )

        # Run analysis in background
        background_tasks.add_task(
            run_batch_analysis,
            abstracts,
            request.criteria or project.get("framework_data", {}),
            request.batch_size,
            analysis_run["id"],
        )

        return BatchAnalysisResponse(
            analysis_run_id=analysis_run["id"],
            total_abstracts=len(abstracts),
            processed=0,
            status="running",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error starting batch analysis for project {request.project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while starting the analysis.",
        )


async def run_batch_analysis(
    abstracts: List[dict], criteria: dict, batch_size: int, analysis_run_id: str
):
    """Background task to run AI analysis on abstracts"""
    try:
        total = len(abstracts)
        processed = 0

        # Process in batches
        for i in range(0, total, batch_size):
            batch = abstracts[i : i + batch_size]

            # Run AI analysis
            results = await ai_service.analyze_abstract_batch(batch, criteria)

            # Update abstracts with decisions
            for result in results:
                # Find matching abstract
                matching = next(
                    (a for a in batch if a["pmid"] == result.get("pmid")), None
                )
                if matching:
                    await db_service.update_abstract_decision(
                        matching["id"],
                        {
                            "decision": result.get("decision"),
                            "ai_reasoning": result.get("reasoning"),
                            "status": result.get("decision", "pending"),
                            "screened_at": datetime.now().isoformat(),
                        },
                    )
                    processed += 1

        # Update analysis run
        await db_service.update_analysis_run(
            analysis_run_id,
            {
                "status": "completed",
                "completed_at": datetime.now().isoformat(),
                "results": {"total_processed": processed, "total_abstracts": total},
            },
        )

    except Exception as e:
        logger.exception(f"Error in batch analysis {analysis_run_id}: {e}")
        # Update analysis run with generic error message for security
        await db_service.update_analysis_run(
            analysis_run_id,
            {
                "status": "failed",
                "completed_at": datetime.now().isoformat(),
                "error_message": "Analysis failed. Please try again.",
            },
        )


@router.patch("/abstracts/{abstract_id}", response_model=AbstractResponse)
async def update_abstract_decision(
    abstract_id: UUID,
    decision: AbstractUpdateDecision,
    current_user: UserPayload = Depends(get_current_user),
):
    """Update abstract screening decision (human override)"""
    try:
        # 1. Get the abstract first
        abstract = await db_service.get_abstract(abstract_id)
        if not abstract:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Abstract not found"
            )

        # 2. Get the file to find project_id
        file_record = await db_service.get_file(abstract["file_id"])
        if not file_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="File not found"
            )

        # 3. Verify project ownership
        project = await db_service.get_project(file_record["project_id"])
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )
        if project.get("user_id") and project["user_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
            )

        # 4. Now safe to update
        updated = await db_service.update_abstract_decision(
            abstract_id,
            {
                "human_decision": decision.human_decision or decision.decision,
                "status": decision.decision,
            },
        )

        return updated
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error updating abstract {abstract_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating the abstract.",
        )
