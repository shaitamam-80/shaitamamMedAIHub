"""
MedAI Hub - Pydantic Models and Schemas
Defines data validation models for API requests and responses
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List, Union
from datetime import datetime
from uuid import UUID

# Import framework schemas from centralized prompts module
from app.core.prompts.shared import FRAMEWORK_SCHEMAS as PROMPTS_FRAMEWORK_SCHEMAS


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
    suggestions: Optional[List[str]] = None


class ChatResponse(BaseModel):
    message: str
    framework_data: Optional[Dict[str, Any]] = None
    extracted_fields: Optional[Dict[str, str]] = None
    finer_assessment: Optional[FinerAssessment] = None


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
# Query Tool Models
# ============================================================================

class QueryGenerateRequest(BaseModel):
    project_id: UUID
    framework_data: Dict[str, Any] = Field(..., examples=[{
        "P": "Elderly patients with depression",
        "I": "Exercise programs",
        "C": "Standard care",
        "O": "Depression symptoms"
    }])
    query_type: str = Field(default="boolean", pattern="^(boolean|mesh|advanced)$", examples=["boolean"])

    class Config:
        json_schema_extra = {
            "example": {
                "project_id": "123e4567-e89b-12d3-a456-426614174000",
                "framework_data": {
                    "P": "Elderly patients with depression",
                    "I": "Exercise programs",
                    "C": "Standard care or usual care",
                    "O": "Depression symptoms or depressive symptoms"
                },
                "query_type": "boolean"
            }
        }


class ConceptAnalysis(BaseModel):
    concept_number: int
    component: str
    free_text_terms: List[str]
    mesh_terms: List[str]


class QueryStrategies(BaseModel):
    broad: str          # Relaxed logic
    focused: str        # Strict logic
    clinical_filtered: str # Validated Hedges


class ToolboxItem(BaseModel):
    label: str
    query: str


class QueryGenerateResponse(BaseModel):
    message: str  # Markdown explanation
    concepts: List[ConceptAnalysis]
    queries: QueryStrategies
    toolbox: Optional[List[ToolboxItem]] = None
    framework_type: str
    framework_data: Dict[str, Any]


# ============================================================================
# File Upload Models
# ============================================================================

class FileUploadResponse(BaseModel):
    id: UUID
    filename: str
    file_size: int
    status: str
    uploaded_at: datetime


# ============================================================================
# Abstract Models (for Review Tool)
# ============================================================================

class AbstractBase(BaseModel):
    pmid: str = Field(..., pattern=r"^[0-9]{1,10}$", description="PubMed ID (1-10 digits)")
    title: Optional[str] = None
    abstract: Optional[str] = None
    authors: Optional[str] = None
    journal: Optional[str] = None
    publication_date: Optional[str] = None
    keywords: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None


class AbstractResponse(AbstractBase):
    id: UUID
    project_id: UUID
    status: str
    decision: Optional[str] = None
    ai_reasoning: Optional[str] = None
    human_decision: Optional[str] = None
    screened_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AbstractUpdateDecision(BaseModel):
    decision: str = Field(..., pattern="^(include|exclude|maybe)$")
    human_decision: Optional[str] = Field(None, pattern="^(include|exclude)$")


class PaginatedAbstractsResponse(BaseModel):
    """Paginated response for abstracts"""
    items: List[AbstractResponse]
    total: int = Field(..., description="Total number of abstracts in database")
    limit: int = Field(..., description="Maximum items per page")
    offset: int = Field(..., description="Number of items skipped")
    has_more: bool = Field(..., description="Whether there are more items to fetch")


# ============================================================================
# Analysis Run Models
# ============================================================================

class AnalysisRunBase(BaseModel):
    project_id: UUID
    tool: str = Field(..., pattern="^(DEFINE|QUERY|REVIEW)$")
    config: Optional[Dict[str, Any]] = None


class AnalysisRunCreate(AnalysisRunBase):
    pass


class AnalysisRunResponse(AnalysisRunBase):
    id: UUID
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    results: Optional[Any] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================================================
# Batch Analysis Models (for AI screening)
# ============================================================================

class BatchAnalysisRequest(BaseModel):
    project_id: UUID
    file_id: UUID
    criteria: Optional[Dict[str, Any]] = Field(None, examples=[{
        "P": "Elderly patients with depression",
        "I": "Exercise programs",
        "C": "Standard care",
        "O": "Depression symptoms"
    }])
    batch_size: int = Field(default=10, ge=1, le=50, examples=[10])

    class Config:
        json_schema_extra = {
            "example": {
                "project_id": "123e4567-e89b-12d3-a456-426614174000",
                "file_id": "987e6543-e21b-12d3-a456-426614174000",
                "criteria": {
                    "P": "Elderly patients with depression",
                    "I": "Exercise programs",
                    "C": "Standard care",
                    "O": "Depression symptoms"
                },
                "batch_size": 10
            }
        }


class BatchAnalysisResponse(BaseModel):
    analysis_run_id: UUID
    total_abstracts: int
    processed: int
    status: str


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
