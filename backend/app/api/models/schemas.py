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
        description="Research framework type: PICO, CoCoPop, PEO, SPIDER, SPICE, ECLIPSE, FINER",
    )
    # Relaxed validation to handle legacy data or lists
    framework_data: Optional[Any] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    framework_type: Optional[str] = None
    framework_data: Optional[Any] = None


class ProjectResponse(ProjectBase):
    id: UUID
    user_id: Optional[UUID] = None  # Added for frontend synchronization
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
    message: str
    framework_type: Optional[str] = "PICO"
    language: Optional[str] = "en"  # "en" or "he"


class ChatResponse(BaseModel):
    message: str
    framework_data: Optional[Dict[str, Any]] = None
    extracted_fields: Optional[Dict[str, str]] = None


# ============================================================================
# Query Tool Models
# ============================================================================

class QueryGenerateRequest(BaseModel):
    project_id: UUID
    framework_data: Dict[str, Any]
    query_type: str = Field(default="boolean", pattern="^(boolean|mesh|advanced)$")


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
    pmid: str
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
    results: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================================================
# Batch Analysis Models (for AI screening)
# ============================================================================

class BatchAnalysisRequest(BaseModel):
    project_id: UUID
    file_id: UUID
    criteria: Optional[Dict[str, Any]] = None  # Inclusion/exclusion criteria
    batch_size: int = Field(default=10, ge=1, le=50)


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
