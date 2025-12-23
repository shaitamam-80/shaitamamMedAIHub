"""
MedAI Hub - Pydantic Models and Schemas
Defines data validation models for API requests and responses
"""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

# Import framework schemas from centralized prompts module
from app.core.prompts.shared import FRAMEWORK_SCHEMAS as PROMPTS_FRAMEWORK_SCHEMAS

# Import typed framework models
from .frameworks import (
    CoCoPoPData,
    FrameworkDataUnion,
    GenericFrameworkData,
    PEOData,
    PICOData,
    PICOTData,
    SPIDERData,
    detect_framework_type,
    framework_to_dict,
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

    data: dict[str, str] = Field(
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
    description: str | None = None
    framework_type: str | None = Field(
        None,
        max_length=50,
        description="Research framework type: PICO, CoCoPop, PEO, SPIDER, SPICE, ECLIPSE, FINER",
    )
    # Relaxed validation to handle legacy data or lists
    framework_data: Any | None = None


class ProjectCreate(ProjectBase):
    name: str = Field(
        ..., min_length=1, max_length=255, examples=["Systematic Review on Exercise for Depression"]
    )
    description: str | None = Field(
        None,
        examples=[
            "A systematic review investigating exercise interventions for elderly patients with depression"
        ],
    )
    framework_type: str | None = Field(
        None,
        max_length=50,
        description="Research framework type: PICO, CoCoPop, PEO, SPIDER, SPICE, ECLIPSE, FINER",
        examples=["PICO"],
    )

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Exercise Interventions for Depression",
                "description": "Investigating the effectiveness of exercise programs in treating depression in elderly populations",
                "framework_type": "PICO",
            }
        }


class ProjectUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    framework_type: str | None = None
    framework_data: Any | None = None


class ProjectResponse(ProjectBase):
    id: str  # String to handle Supabase UUID format
    user_id: str | None = None  # String to handle Supabase UUID format
    created_at: datetime
    updated_at: datetime
    current_step: str = Field(
        default="DEFINE", description="Current workflow step: DEFINE, QUERY, REVIEW, COMPLETED"
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
    message: str = Field(
        ..., examples=["I want to study the effects of exercise on depression in elderly patients"]
    )
    framework_type: str | None = Field(default="PICO", examples=["PICO"])
    language: str | None = Field(default="en", examples=["en"], pattern="^(en|he)$")

    class Config:
        json_schema_extra = {
            "example": {
                "project_id": "123e4567-e89b-12d3-a456-426614174000",
                "message": "I want to investigate whether exercise programs reduce depression symptoms in elderly patients compared to standard care",
                "framework_type": "PICO",
                "language": "en",
            }
        }


class FinerScore(BaseModel):
    """Single FINER component score"""

    score: str = Field(..., pattern="^(high|medium|low)$")
    reason: str


class FinerAssessment(BaseModel):
    """FINER research question quality assessment"""

    F: FinerScore | None = Field(None, description="Feasible - Can this study be conducted?")
    I: FinerScore | None = Field(None, description="Interesting - Is this engaging to researchers?")
    N: FinerScore | None = Field(None, description="Novel - Does this add new knowledge?")
    E: FinerScore | None = Field(None, description="Ethical - Can this be conducted ethically?")
    R: FinerScore | None = Field(None, description="Relevant - Will results matter?")
    overall: str | None = Field(None, pattern="^(proceed|revise|reconsider)$")
    overall_score: int | None = Field(None, ge=0, le=100, description="Numeric score 0-100")
    recommendation: str | None = Field(None, pattern="^(proceed|revise|reconsider)$")
    suggestions: list[str] | None = None


class FormulatedQuestion(BaseModel):
    """A formulated research question with FINER assessment"""

    type: str = Field(..., description="Question type: broad, focused, or alternative")
    hebrew: str | None = Field(None, description="Hebrew version of the question")
    english: str = Field(..., description="English version of the question")
    finer_assessment: FinerAssessment | None = None


class ChatResponse(BaseModel):
    message: str
    framework_data: dict[str, Any] | None = None
    extracted_fields: dict[str, str] | None = None
    finer_assessment: FinerAssessment | None = None
    formulated_questions: list[FormulatedQuestion] | None = Field(
        None, description="Formulated questions with automatic FINER assessment"
    )


class FinerAssessmentRequest(BaseModel):
    """Request for FINER assessment of a research question"""

    project_id: UUID
    research_question: str = Field(
        ..., min_length=10, description="The research question to evaluate"
    )
    framework_type: str | None = "PICO"
    framework_data: dict[str, Any] | None = None
    language: str | None = "en"  # "en" or "he"


class FinerAssessmentResponse(BaseModel):
    """Response containing FINER assessment results"""

    F: FinerScore = Field(..., description="Feasible - Can this study be conducted?")
    I: FinerScore = Field(..., description="Interesting - Is this engaging to researchers?")
    N: FinerScore = Field(..., description="Novel - Does this add new knowledge?")
    E: FinerScore = Field(..., description="Ethical - Can this be conducted ethically?")
    R: FinerScore = Field(..., description="Relevant - Will results matter?")
    overall: str = Field(..., pattern="^(proceed|revise|reconsider)$")
    suggestions: list[str] = Field(default_factory=list)
    research_question: str
    framework_type: str


# ============================================================================
# Query Tool Models
# ============================================================================


class QueryGenerateRequest(BaseModel):
    project_id: UUID
    framework_data: dict[str, Any] = Field(
        ...,
        examples=[
            {
                "P": "Elderly patients with depression",
                "I": "Exercise programs",
                "C": "Standard care",
                "O": "Depression symptoms",
            }
        ],
    )
    query_type: str = Field(
        default="boolean", pattern="^(boolean|mesh|advanced)$", examples=["boolean"]
    )

    class Config:
        json_schema_extra = {
            "example": {
                "project_id": "123e4567-e89b-12d3-a456-426614174000",
                "framework_data": {
                    "P": "Elderly patients with depression",
                    "I": "Exercise programs",
                    "C": "Standard care or usual care",
                    "O": "Depression symptoms or depressive symptoms",
                },
                "query_type": "boolean",
            }
        }


class ConceptAnalysis(BaseModel):
    concept_number: int
    component: str
    free_text_terms: list[str]
    mesh_terms: list[str]
    entry_terms: list[str] = []  # MeSH synonyms from NLM thesaurus
    key: str | None = None  # P, I, C, O
    label: str | None = None  # Population, Intervention, etc.
    original_value: str | None = None  # User's original input


class QueryStrategies(BaseModel):
    broad: str  # Relaxed logic
    focused: str  # Strict logic
    clinical_filtered: str  # Validated Hedges


class ToolboxItem(BaseModel):
    label: str
    query: str


class QueryGenerateResponse(BaseModel):
    message: str  # Markdown explanation
    concepts: list[ConceptAnalysis]
    queries: QueryStrategies
    toolbox: list[ToolboxItem] | None = None
    framework_type: str
    framework_data: dict[str, Any]
    research_question: str | None = None  # Original research question
    strategies: dict[str, Any] | None = None  # V2 strategies (comprehensive, direct, clinical)


# ============================================================================
# Enhanced Query Tool Models (V2)
# ============================================================================


class QueryStrategy(BaseModel):
    """Single query strategy with full metadata"""

    name: str  # "Comprehensive", "Direct Comparison", "Clinically Filtered"
    goal: str  # Description of what this strategy achieves
    logic: str  # Boolean logic formula shown to user
    sensitivity: str  # "high" | "medium" | "low"
    specificity: str  # "high" | "medium" | "low"
    query: str  # The actual PubMed query
    query_narrow: str | None = None  # For clinical filtered - narrow variant


class ConceptAnalysisV2(BaseModel):
    """Concept breakdown with terms"""

    concept: str  # "Population", "Intervention", etc.
    component_key: str  # "P", "I", "C", "O"
    free_text_terms: list[str]  # Terms with [tiab] tags
    mesh_terms: list[str]  # MeSH suggestions (display names)
    mesh_queries: list[str]  # MeSH in query format


class ToolboxFilter(BaseModel):
    """Pre-built filter for toolbox"""

    category: str  # "Age", "Article Type", "Date", "Language"
    label: str  # Human-readable label
    query: str  # Query fragment to append
    description: str | None = None


class TranslationStatus(BaseModel):
    """Status of Hebrew to English translation"""

    success: bool
    fields_translated: list[str] = []
    fields_failed: list[str] = []
    method: str  # "batch" | "field_by_field" | "none_needed"


class QueryWarning(BaseModel):
    """Warning message for query generation"""

    code: str  # "TRANSLATION_PARTIAL" | "TIMEOUT" | "FALLBACK_USED"
    message: str
    severity: str  # "info" | "warning" | "error"


class QueryGenerateResponseV2(BaseModel):
    """Enhanced response with professional report format"""

    # Report header
    report_title: str = "PubMed Query Generation Report"
    report_intro: str  # Context paragraph about the search

    # Concept analysis
    concepts: list[ConceptAnalysisV2]

    # Three strategies
    strategies: dict[str, QueryStrategy]  # "comprehensive", "direct", "clinical"

    # Rich toolbox (15+ filters)
    toolbox: list[ToolboxFilter]

    # Formatted report (markdown)
    formatted_report: str  # Complete markdown report for display

    # Legacy compatibility
    queries: dict[str, str]  # broad/focused/clinical_filtered for backward compat
    message: str  # Legacy message field

    # Metadata
    framework_type: str
    framework_data: dict[str, Any]
    research_question: str | None = None

    # New fields for transparency
    translation_status: TranslationStatus | None = None
    warnings: list[QueryWarning] = []


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
    title: str | None = None
    abstract: str | None = None
    authors: str | None = None
    journal: str | None = None
    publication_date: str | None = None
    keywords: list[str] | None = None
    metadata: dict[str, Any] | None = None


class AbstractResponse(AbstractBase):
    id: UUID
    project_id: UUID
    status: str
    decision: str | None = None
    ai_reasoning: str | None = None
    human_decision: str | None = None
    screened_at: datetime | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class AbstractUpdateDecision(BaseModel):
    decision: str = Field(..., pattern="^(include|exclude|maybe)$")
    human_decision: str | None = Field(None, pattern="^(include|exclude)$")


class PaginatedAbstractsResponse(BaseModel):
    """Paginated response for abstracts"""

    items: list[AbstractResponse]
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
    config: dict[str, Any] | None = None


class AnalysisRunCreate(AnalysisRunBase):
    pass


class AnalysisRunResponse(AnalysisRunBase):
    id: UUID
    status: str
    started_at: datetime
    completed_at: datetime | None = None
    results: Any | None = None
    error_message: str | None = None

    class Config:
        from_attributes = True


# ============================================================================
# Batch Analysis Models (for AI screening)
# ============================================================================


class BatchAnalysisRequest(BaseModel):
    project_id: UUID
    file_id: UUID
    criteria: dict[str, Any] | None = Field(
        None,
        examples=[
            {
                "P": "Elderly patients with depression",
                "I": "Exercise programs",
                "C": "Standard care",
                "O": "Depression symptoms",
            }
        ],
    )
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
                    "O": "Depression symptoms",
                },
                "batch_size": 10,
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


def _convert_prompts_to_api_format() -> dict[str, Any]:
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
            fields.append(
                {"key": comp, "label": label, "description": f"What is the {label.lower()}?"}
            )

        api_schemas[name] = {
            "name": name,
            "description": schema.get("description", ""),
            "fields": fields,
        }

    return api_schemas


# Build API-formatted schemas from prompts module
FRAMEWORK_SCHEMAS = _convert_prompts_to_api_format()


class FrameworkSchemaResponse(BaseModel):
    """Response containing framework schema definitions"""

    frameworks: dict[str, Any] = Field(default_factory=_convert_prompts_to_api_format)


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
    # Query models
    "QueryGenerateRequest",
    "QueryGenerateResponse",
    "QueryGenerateResponseV2",
    "ConceptAnalysis",
    "ConceptAnalysisV2",
    "QueryStrategy",
    "QueryStrategies",
    "ToolboxFilter",
    "ToolboxItem",
    "TranslationStatus",
    "QueryWarning",
    # File/Abstract models
    "FileUploadResponse",
    "AbstractBase",
    "AbstractResponse",
    "AbstractUpdateDecision",
    "PaginatedAbstractsResponse",
    # Analysis models
    "AnalysisRunBase",
    "AnalysisRunCreate",
    "AnalysisRunResponse",
    "BatchAnalysisRequest",
    "BatchAnalysisResponse",
    # Schema definitions
    "FrameworkData",
    "FrameworkSchemaResponse",
    "FRAMEWORK_SCHEMAS",
]
