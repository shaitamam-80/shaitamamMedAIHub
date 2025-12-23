"""
MedAI Hub - Screening Routes
API endpoints for the Smart Screener module.
"""

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.models.screening import (
    CriteriaConfig,
)
from app.core.auth import UserPayload, get_current_user
from app.core.gems.criteria_library import ALL_CRITERIA
from app.services.screening_service import screening_service

router = APIRouter(prefix="/screening", tags=["screening"])


# Request Models
class InitCriteriaRequest(BaseModel):
    project_id: UUID
    review_type: str
    filters: CriteriaConfig


class ProcessPmidsRequest(BaseModel):
    project_id: UUID
    pmids: list[str]
    criteria_config: CriteriaConfig


@router.get("/criteria-library")
async def get_criteria_library(
    current_user: UserPayload = Depends(get_current_user),
):
    """Get the full GEMS criteria library definitions. Requires authentication."""
    return ALL_CRITERIA


@router.post("/init-criteria", response_model=dict[str, Any])
async def init_criteria(
    request: InitCriteriaRequest,
    current_user: UserPayload = Depends(get_current_user),
):
    """
    Save the screening criteria configuration for a project.
    This creates a snapshot of the settings used for screening.
    Requires authentication.
    """
    try:
        config_id = await screening_service.save_criteria_config(
            project_id=request.project_id,
            config=request.filters,
            user_id=current_user.id,
        )
        return {"id": config_id, "status": "saved"}
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/process-pmids")
async def process_pmids(
    request: ProcessPmidsRequest,
    current_user: UserPayload = Depends(get_current_user),
):
    """
    Run the screening pipeline on a list of PMIDs.
    Fetch -> Parse -> Rule Engine -> (AI) -> Save
    Requires authentication.
    """
    try:
        # Note: In production, this should probably be a background task if list is long.
        # But for the "Execution Console" experience, we might want stream or immediate return.
        # Given the "semapore limit 5-10" in spec, sticking to async await here for now.

        results = await screening_service.process_pmids(
            project_id=request.project_id,
            pmids=request.pmids,
            criteria_config=request.criteria_config,
            user_id=current_user.id,
        )
        return results
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
