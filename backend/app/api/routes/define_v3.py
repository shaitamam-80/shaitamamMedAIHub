"""
Define Tool v3.0 - API Routes
==============================

Wizard-based research question formulation endpoints.

NOTE: This module is under migration to SystematicOS LangGraph architecture.
All AI-dependent endpoints return 501 Not Implemented until migration is complete.

Key Features (when restored):
- Clarification-based framework detection
- Three question formulations (narrow, broad, clinical)
- Qualitative FINER assessment (high/medium/low)
"""

from fastapi import APIRouter, Depends, HTTPException, status
import logging
from typing import Dict, Any

from app.api.models.schemas import (
    DetectFrameworkRequest,
    DetectFrameworkResponse,
    ClarifyFrameworkRequest,
    ClarifyFrameworkResponse,
    GenerateQuestionsRequest,
    GenerateQuestionsResponse,
)
from app.core.auth import get_current_user
from app.services.database import db_service

router = APIRouter(prefix="/define", tags=["define-v3"])
logger = logging.getLogger(__name__)


# ============================================================================
# Framework Detection Endpoint (Clarification-Based)
# ============================================================================

@router.post("/detect-framework", response_model=DetectFrameworkResponse)
async def detect_framework(
    request: DetectFrameworkRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Detect appropriate research framework from user input using clarification approach.

    NOTE: This endpoint is under migration to SystematicOS architecture.

    **v3.0 Strategy (when restored):**
    - NO keyword matching
    - NO default to PICO
    - Ask clarifying questions when ambiguous
    - Present multiple options when applicable
    """
    # Verify project exists and belongs to user
    project = await db_service.get_project(str(request.project_id))
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    if project.get("owner_id") != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this project"
        )

    # Migration placeholder - AI logic removed
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint under migration to SystematicOS architecture"
    )


# ============================================================================
# Clarify Framework Endpoint
# ============================================================================

@router.post("/clarify-framework", response_model=ClarifyFrameworkResponse)
async def clarify_framework(
    request: ClarifyFrameworkRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Process clarification answer and finalize framework selection.

    NOTE: This endpoint is under migration to SystematicOS architecture.

    **Flow (when restored):**
    1. User receives clarification question from /detect-framework
    2. User answers the question
    3. This endpoint processes the answer and returns final framework
    """
    # Verify project access
    project = await db_service.get_project(str(request.project_id))
    if not project or project.get("owner_id") != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    # Migration placeholder - AI logic removed
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint under migration to SystematicOS architecture"
    )


# ============================================================================
# Generate Questions Endpoint (with Qualitative FINER)
# ============================================================================

@router.post("/generate-questions", response_model=GenerateQuestionsResponse)
async def generate_questions(
    request: GenerateQuestionsRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Generate three research question formulations with qualitative FINER assessment.

    NOTE: This endpoint is under migration to SystematicOS architecture.

    **Generates (when restored):**
    1. **Narrow** - PubMed-ready, highly specific, includes all details
    2. **Broad** - Exploratory, suitable for scoping reviews
    3. **Clinical** - Practical, real-world clinical settings

    **FINER Assessment:**
    - Qualitative ONLY (high/medium/low)
    - NO numeric scores
    - NO formulas or thresholds
    - Holistic expert judgment
    """
    # Verify project access
    project = await db_service.get_project(str(request.project_id))
    if not project or project.get("owner_id") != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    # Migration placeholder - AI logic removed
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint under migration to SystematicOS architecture"
    )
