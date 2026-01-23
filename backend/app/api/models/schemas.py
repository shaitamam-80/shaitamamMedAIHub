"""
MedAI Hub - Pydantic Models and Schemas
Defines data validation models for API requests and responses
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID

# Import framework schemas from centralized prompts module
from app.core.prompts.shared import FRAMEWORK_SCHEMAS as PROMPTS_FRAMEWORK_SCHEMAS

# Import typed framework models
from .frameworks import (
    PICOData,
    PICOTData,
    PEOData,
    SPIDERData,
    CoCoPoPData,
    GenericFrameworkData,
    FrameworkDataUnion,
    framework_to_dict,
    detect_framework_type,
)


# ============================================================================
# Research Framework Models (Dynamic)
# ============================================================================

class FrameworkData(BaseModel):
    """
    Dynamic framework data - can contain any structure
    Examples:
    - PICO: {"P": "...", "I": "...", "C": "...", "O": "..."}
    - CoCoPop: {"Condition": "...", "Context": "...", "Population": "..."}
    - PEO: {"P": "...", "E": "...", "O": "..."}
    """

    data: Dict[str, str] = Field(
        default_factory=dict, description="Dynamic key-value pairs based on framework"
    )

    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "data": {
                        "P": "Elderly patients with diabetes",
                        "I": "Metformin treatment",
                        "C": "Placebo",
                        "O": "Blood glucose levels",
                    }
                }
            ]
        }

# ============================================================================
# Project Models
# ============================================================================

class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    framework_type: Optional[str] = Field(
        None,
        max_length=50,
        description="Research framework type: PICO, CoCoPop, PEO, SPIDER, SPICE, ECLIPSE, FINER",
    )
    # Relaxed validation to handle legacy data or lists
    framework_data: Optional[Any] = None


class ProjectCreate(ProjectBase):
    name: str = Field(..., min_length=1, max_length=255, examples=["Systematic Review on Exercise for Depression"])
    description: Optional[str] = Field(None, examples=["A systematic review investigating exercise interventions for elderly patients with depression"])
    framework_type: Optional[str] = Field(
        None,
        max_length=50,
        description="Research framework type: PICO, CoCoPop, PEO, SPIDER, SPICE, ECLIPSE, FINER",
        examples=["PICO"]
    )

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Exercise Interventions for Depression",
                "description": "Investigating the effectiveness of exercise programs in treating depression in elderly populations",
                "framework_type": "PICO"
            }
        }


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    framework_type: Optional[str] = None
    framework_data: Optional[Any] = None


class ProjectResponse(ProjectBase):
    id: str  # String to handle Supabase UUID format
    user_id: Optional[str] = None  # String to handle Supabase UUID format
    created_at: datetime
    updated_at: datetime
    current_step: str = Field(
        default="DEFINE",
        description="Current workflow step: DEFINE"
    )

    class Config:
        from_attributes = True


# ============================================================================
# Chat Models (for Define Tool)
# ============================================================================

class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str


class ChatRequest(BaseModel):
    project_id: UUID
    message: str = Field(..., examples=["I want to study the effects of exercise on depression in elderly patients"])
    framework_type: Optional[str] = Field(default="PICO", examples=["PICO"])
    language: Optional[str] = Field(default="en", examples=["en"], pattern="^(en|he)$")

    class Config:
        json_schema_extra = {
            "example": {
                "project_id": "123e4567-e89b-12d3-a456-426614174000",
                "message": "I want to investigate whether exercise programs reduce depression symptoms in elderly patients compared to standard care",
                "framework_type": "PICO",
                "language": "en"
            }
        }


class FinerScore(BaseModel):
    """Single FINER component score"""
    score: str = Field(..., pattern="^(high|medium|low)$")
    reason: str


class FinerAssessment(BaseModel):
    """FINER research question quality assessment"""
    F: Optional[FinerScore] = Field(None, description="Feasible - Can this study be conducted?")
    I: Optional[FinerScore] = Field(None, description="Interesting - Is this engaging to researchers?")
    N: Optional[FinerScore] = Field(None, description="Novel - Does this add new knowledge?")
    E: Optional[FinerScore] = Field(None, description="Ethical - Can this be conducted ethically?")
    R: Optional[FinerScore] = Field(None, description="Relevant - Will results matter?")
    overall: Optional[str] = Field(None, pattern="^(proceed|revise|reconsider)$")
    overall_score: Optional[int] = Field(None, ge=0, le=100, description="Numeric score 0-100")
    recommendation: Optional[str] = Field(None, pattern="^(proceed|revise|reconsider)$")
    suggestions: Optional[List[str]] = None


class FormulatedQuestion(BaseModel):
    """A formulated research question with FINER assessment"""
    type: str = Field(..., description="Question type: broad, focused, or alternative")
    hebrew: Optional[str] = Field(None, description="Hebrew version of the question")
    english: str = Field(..., description="English version of the question")
    finer_assessment: Optional[FinerAssessment] = None


class ChatResponse(BaseModel):
    message: str
    framework_data: Optional[Dict[str, Any]] = None
    extracted_fields: Optional[Dict[str, str]] = None
    finer_assessment: Optional[FinerAssessment] = None
    formulated_questions: Optional[List[FormulatedQuestion]] = Field(
        None,
        description="Formulated questions with automatic FINER assessment"
    )


class FinerAssessmentRequest(BaseModel):
    """Request for FINER assessment of a research question"""
    project_id: UUID
    research_question: str = Field(..., min_length=10, description="The research question to evaluate")
    framework_type: Optional[str] = "PICO"
    framework_data: Optional[Dict[str, Any]] = None
    language: Optional[str] = "en"  # "en" or "he"


class FinerAssessmentResponse(BaseModel):
    """Response containing FINER assessment results"""
    F: FinerScore = Field(..., description="Feasible - Can this study be conducted?")
    I: FinerScore = Field(..., description="Interesting - Is this engaging to researchers?")
    N: FinerScore = Field(..., description="Novel - Does this add new knowledge?")
    E: FinerScore = Field(..., description="Ethical - Can this be conducted ethically?")
    R: FinerScore = Field(..., description="Relevant - Will results matter?")
    overall: str = Field(..., pattern="^(proceed|revise|reconsider)$")
    suggestions: List[str] = Field(default_factory=list)
    research_question: str
    framework_type: str


# ============================================================================
# Framework Schema Definitions
# ============================================================================

def _convert_prompts_to_api_format() -> Dict[str, Any]:
    """
    Convert FRAMEWORK_SCHEMAS from prompts/shared.py format to API response format.

    Input format (prompts):
        {"PICO": {"description": "...", "components": ["P","I","C","O"], "labels": {"P": "Population", ...}}}

    Output format (API):
        {"PICO": {"name": "PICO", "description": "...", "fields": [{"key": "P", "label": "Population", "description": "..."}]}}
    """
    api_schemas = {}
    for name, schema in PROMPTS_FRAMEWORK_SCHEMAS.items():
        fields = []
        components = schema.get("components", [])
        labels = schema.get("labels", {})

        for comp in components:
            label = labels.get(comp, comp)
            fields.append({
                "key": comp,
                "label": label,
                "description": f"What is the {label.lower()}?"
            })

        api_schemas[name] = {
            "name": name,
            "description": schema.get("description", ""),
            "fields": fields
        }

    return api_schemas

# Build API-formatted schemas from prompts module
FRAMEWORK_SCHEMAS = _convert_prompts_to_api_format()


class FrameworkSchemaResponse(BaseModel):
    """Response containing framework schema definitions"""

    frameworks: Dict[str, Any] = Field(default_factory=_convert_prompts_to_api_format)


# ============================================================================
# Re-export typed framework models for convenience
# Usage: from app.api.models.schemas import PICOData, framework_to_dict
# ============================================================================
__all__ = [
    # Typed framework models
    "PICOData",
    "PICOTData",
    "PEOData",
    "SPIDERData",
    "CoCoPoPData",
    "GenericFrameworkData",
    "FrameworkDataUnion",
    "framework_to_dict",
    "detect_framework_type",
    # Project models
    "ProjectBase",
    "ProjectCreate",
    "ProjectUpdate",
    "ProjectResponse",
    # Chat/Define models
    "ChatMessage",
    "ChatRequest",
    "ChatResponse",
    "FinerScore",
    "FinerAssessment",
    "FinerAssessmentRequest",
    "FinerAssessmentResponse",
    "FormulatedQuestion",
    # Schema definitions
    "FrameworkData",
    "FrameworkSchemaResponse",
    "FRAMEWORK_SCHEMAS",
]
