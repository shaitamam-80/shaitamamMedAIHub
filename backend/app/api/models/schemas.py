"""
MedAI Hub - Pydantic Models and Schemas
Defines data validation models for API requests and responses
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


# ============================================================================
# Project Models (aligned with Supabase projects table)
# ============================================================================

class ProjectCreate(BaseModel):
    """Create a new project. Only title is required; review_type and framework are set later."""
    title: str = Field(..., min_length=1, max_length=255, examples=["Exercise Interventions for Depression in Elderly"])
    description: Optional[str] = Field(None, examples=["A systematic review investigating exercise interventions for elderly patients with depression"])
    review_type: str = Field(
        default="systematic_intervention",
        description="Review type (can be updated later during workflow)",
        examples=["systematic_intervention"]
    )
    framework: str = Field(
        default="PICO",
        description="Research framework (determined during question formulation stage)",
        examples=["PICO"]
    )

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Exercise Interventions for Depression in Elderly",
                "description": "Investigating the effectiveness of exercise programs"
            }
        }


class ProjectUpdate(BaseModel):
    """Update project fields. Only provided fields will be updated."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    current_stage: Optional[str] = None
    progress_percentage: Optional[int] = Field(None, ge=0, le=100)
    status: Optional[str] = None


class ProjectResponse(BaseModel):
    """Project response matching Supabase projects table.
    Fields use Optional where the DB column allows NULL to prevent
    response validation errors (FastAPI 500s).
    """
    id: str
    owner_id: Optional[str] = None
    title: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    review_type: Optional[str] = None
    framework: Optional[str] = None
    current_stage: Optional[str] = Field(default="idea", description="Current workflow stage")
    progress_percentage: Optional[int] = Field(default=0, description="Overall progress 0-100")
    status: Optional[str] = Field(default="active", description="Project status")
    prospero_id: Optional[str] = None
    total_records_found: Optional[int] = 0
    total_screened: Optional[int] = 0
    total_included: Optional[int] = 0
    total_excluded: Optional[int] = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================================================
# Stage Workflow Models
# ============================================================================

class StageStatusUpdate(BaseModel):
    """Request to update a stage's status."""
    status: str = Field(
        ...,
        pattern="^(pending|in_progress|completed|skipped)$",
        description="New stage status",
        examples=["completed"]
    )


class ConversationMessagesResponse(BaseModel):
    """Response containing messages for a stage conversation."""
    conversation_id: Optional[str] = None
    messages: List[Dict[str, Any]] = Field(default_factory=list)


__all__ = [
    "ProjectCreate",
    "ProjectUpdate",
    "ProjectResponse",
    "StageStatusUpdate",
    "ConversationMessagesResponse",
]
