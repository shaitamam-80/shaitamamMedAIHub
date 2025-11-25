"""
MedAI Hub - Pydantic Models and Schemas
Defines data validation models for API requests and responses
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID


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
    framework_data: Optional[Dict[str, Any]] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    framework_type: Optional[str] = None
    framework_data: Optional[Dict[str, Any]] = None


class ProjectResponse(ProjectBase):
    id: UUID
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

# These define the expected fields for each framework type
FRAMEWORK_SCHEMAS = {
    "PICO": {
        "name": "PICO",
        "description": "Population, Intervention, Comparison, Outcome",
        "fields": [
            {"key": "P", "label": "Population", "description": "Who is the patient or population?"},
            {"key": "I", "label": "Intervention", "description": "What is the intervention?"},
            {"key": "C", "label": "Comparison", "description": "What is the comparison?"},
            {"key": "O", "label": "Outcome", "description": "What is the outcome?"},
        ],
    },
    "CoCoPop": {
        "name": "CoCoPop",
        "description": "Condition, Context, Population",
        "fields": [
            {"key": "Condition", "label": "Condition", "description": "What is the health condition?"},
            {"key": "Context", "label": "Context", "description": "What is the context?"},
            {"key": "Population", "label": "Population", "description": "Who is the population?"},
        ],
    },
    "PEO": {
        "name": "PEO",
        "description": "Population, Exposure, Outcome",
        "fields": [
            {"key": "P", "label": "Population", "description": "Who is the population?"},
            {"key": "E", "label": "Exposure", "description": "What is the exposure?"},
            {"key": "O", "label": "Outcome", "description": "What is the outcome?"},
        ],
    },
    "SPIDER": {
        "name": "SPIDER",
        "description": "Sample, Phenomenon of Interest, Design, Evaluation, Research type",
        "fields": [
            {"key": "S", "label": "Sample", "description": "Who is the sample?"},
            {"key": "PI", "label": "Phenomenon of Interest", "description": "What is being studied?"},
            {"key": "D", "label": "Design", "description": "What is the study design?"},
            {"key": "E", "label": "Evaluation", "description": "What is being evaluated?"},
            {"key": "R", "label": "Research type", "description": "What type of research?"},
        ],
    },
    "SPICE": {
        "name": "SPICE",
        "description": "Setting, Perspective, Intervention, Comparison, Evaluation",
        "fields": [
            {"key": "S", "label": "Setting", "description": "Where is the research conducted?"},
            {"key": "P", "label": "Perspective", "description": "From whose perspective?"},
            {"key": "I", "label": "Intervention", "description": "What is the intervention?"},
            {"key": "C", "label": "Comparison", "description": "What is the comparison?"},
            {"key": "E", "label": "Evaluation", "description": "What is being evaluated?"},
        ],
    },
    "ECLIPSE": {
        "name": "ECLIPSE",
        "description": "Expectation, Client group, Location, Impact, Professionals, Service",
        "fields": [
            {"key": "E", "label": "Expectation", "description": "What information do you need?"},
            {"key": "C", "label": "Client group", "description": "Who is the client?"},
            {"key": "L", "label": "Location", "description": "Where is the service?"},
            {"key": "I", "label": "Impact", "description": "What is the impact?"},
            {"key": "P", "label": "Professionals", "description": "Who are the professionals?"},
            {"key": "S", "label": "Service", "description": "What is the service?"},
        ],
    },
    "FINER": {
        "name": "FINER",
        "description": "Feasible, Interesting, Novel, Ethical, Relevant",
        "fields": [
            {"key": "F", "label": "Feasible", "description": "Is it feasible?"},
            {"key": "I", "label": "Interesting", "description": "Is it interesting?"},
            {"key": "N", "label": "Novel", "description": "Is it novel?"},
            {"key": "E", "label": "Ethical", "description": "Is it ethical?"},
            {"key": "R", "label": "Relevant", "description": "Is it relevant?"},
        ],
    },
}


class FrameworkSchemaResponse(BaseModel):
    """Response containing framework schema definitions"""

    frameworks: Dict[str, Any] = Field(default=FRAMEWORK_SCHEMAS)
