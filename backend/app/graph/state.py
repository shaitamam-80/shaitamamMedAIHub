"""
MedAI Hub - LangGraph State Definitions
=======================================

Core state types for the LangGraph state machine architecture.
Manages the lifecycle of Systematic Reviews through sequential stages.

Stages:
    0. idea - Refine research idea, check existing reviews, determine review type
    1. research_question - Formulate research question using PICO/etc frameworks
    2. protocol - Build PROSPERO-ready protocol
    3. search - Create and execute PubMed search queries
    4. screening - Screen abstracts/full-texts
    5. extraction - Extract data from included studies
    6. synthesis - Synthesize evidence (meta-analysis, GRADE)
    7. reporting - Generate manuscript/report
"""

from typing import TypedDict, Optional, List, Dict, Any, Literal
from typing_extensions import Annotated
from langgraph.graph.message import add_messages
from langchain_core.messages import AnyMessage


# ============================================================================
# Stage Definitions
# ============================================================================

# Valid stages in the systematic review workflow
ReviewStage = Literal[
    "idea",
    "research_question",
    "protocol",
    "search",
    "screening",
    "extraction",
    "synthesis",
    "reporting"
]

# Valid workflow statuses
WorkflowStatus = Literal[
    "active",           # Currently processing
    "waiting_for_user", # Awaiting user input
    "completed",        # Stage or workflow completed
    "error"             # Error state
]


# ============================================================================
# Artifact Types (Outputs from each stage)
# ============================================================================

class IdeaArtifact(TypedDict, total=False):
    """Output from idea stage — expert librarian consultation"""
    clinical_problem: str              # The core clinical/research problem
    review_type: str                   # systematic_intervention, scoping, etc.
    population_sketch: str             # Initial population description
    intervention_sketch: str           # Intervention/exposure/concept
    comparison_sketch: str             # Comparison group or condition (the C in PICO)
    outcome_sketch: str                # Expected outcomes or context
    study_designs: List[str]           # Study designs to include (RCT, cohort, etc.)
    existing_reviews_checked: bool     # Did user check PROSPERO/Cochrane?
    existing_reviews_notes: str        # Notes on existing reviews found
    timeline: str                      # User's deadline or timeline
    feasibility_notes: str             # Notes on feasibility, scope concerns
    recommendation: str                # proceed / refine / pivot


class ResearchQuestionArtifact(TypedDict, total=False):
    """Output from research_question stage"""
    framework_type: str           # PICO, CoCoPop, etc.
    framework_data: Dict[str, str]  # Extracted components
    question_narrow: str          # PubMed-ready question
    question_broad: str           # Exploratory question
    question_clinical: str        # Practical question
    finer_assessment: Dict[str, Any]  # FINER evaluation


class ProtocolArtifact(TypedDict, total=False):
    """Output from protocol stage"""
    protocol_text: str                     # Full protocol document (accumulated)
    review_type: str                       # Inherited from idea or detected
    registration_platform: str             # PROSPERO, OSF, INPLASY
    eligibility_criteria: Dict[str, Any]   # Structured eligibility (nested)
    information_sources: List[str]         # Databases to search
    search_strategy_draft: str             # Initial search strategy
    rob_tool: str                          # Selected RoB tool name
    rob_domains: List[str]                 # RoB domains to assess
    synthesis_method: str                  # meta-analysis, narrative, etc.
    effect_measure: str                    # RR, OR, MD, SMD, HR
    completed_sections: List[str]          # Sections substantively addressed
    approved_tools: List[str]              # Researcher-approved MedAI Hub tools
    tool_declarations: Dict[str, str]      # tool_key → academic protocol_text
    prospero_fields: Dict[str, Any]        # Backward compat


class SearchArtifact(TypedDict, total=False):
    """Output from search stage"""
    pubmed_query: str             # Final/primary PubMed query
    mesh_terms: List[str]         # MeSH terms used
    search_filters: List[str]     # Applied filters
    results_count: int            # Number of results
    exported_file: str            # Path to exported results
    strategies: Dict[str, str]    # {broad: query, focused: query, precision: query}
    question_type: str            # effectiveness, prevalence, prognosis, etc.


class ScreeningArtifact(TypedDict, total=False):
    """Output from screening stage"""
    total_records: int
    included_count: int
    excluded_count: int
    conflicts_count: int
    screening_decisions: List[Dict[str, Any]]


class ExtractionArtifact(TypedDict, total=False):
    """Output from extraction stage"""
    extracted_studies: List[Dict[str, Any]]  # List of extracted study data dicts
    extraction_template: str                 # Template ID used (template_a/b/c/d)
    current_design: str                      # Last detected study design
    user_confirmed_complete: bool            # User confirmed all studies extracted


class SynthesisArtifact(TypedDict, total=False):
    """Output from synthesis stage"""
    meta_analysis: Dict[str, Any]
    grade_assessment: Dict[str, Any]
    forest_plots: List[str]
    summary_of_findings: str


class ReportingArtifact(TypedDict, total=False):
    """Output from reporting stage"""
    manuscript_text: str
    prisma_flowchart: str
    tables: List[Dict[str, Any]]
    figures: List[str]


# ============================================================================
# Main Review State
# ============================================================================

class ReviewState(TypedDict, total=False):
    """
    Core state for systematic review workflows.

    This TypedDict defines the shape of state that flows through
    the LangGraph state machine. All nodes receive this state and
    can modify specific fields.

    The `messages` field uses LangGraph's add_messages reducer to
    accumulate conversation history automatically.
    """

    # ========================================
    # Identity & Session
    # ========================================
    project_id: str               # UUID of the current project
    user_id: str                  # UUID of the authenticated user
    language: str                 # Response language ("en" or "he")

    # ========================================
    # Workflow Control
    # ========================================
    current_stage: ReviewStage    # Current stage in the workflow
    status: WorkflowStatus        # Current workflow status
    next_action: str              # Hint for what the user should do next

    # ========================================
    # Conversation History (LangGraph managed)
    # ========================================
    messages: Annotated[List[AnyMessage], add_messages]

    # ========================================
    # Stage Artifacts (Outputs)
    # ========================================
    artifacts: Dict[str, Any]
    # Structure:
    # {
    #   "idea": IdeaArtifact,
    #   "research_question": ResearchQuestionArtifact,
    #   "protocol": ProtocolArtifact,
    #   "search": SearchArtifact,
    #   "screening": ScreeningArtifact,
    #   "extraction": ExtractionArtifact,
    #   "synthesis": SynthesisArtifact,
    #   "reporting": ReportingArtifact
    # }

    # ========================================
    # Stage Completion Tracking
    # ========================================
    completed_stages: List[str]   # List of completed stage names (for progress)

    # ========================================
    # Error Tracking
    # ========================================
    errors: List[str]             # List of error messages
    last_error: Optional[str]     # Most recent error


# ============================================================================
# Helper Functions
# ============================================================================

def get_initial_state(project_id: str, user_id: str, language: str = "en") -> ReviewState:
    """
    Create initial state for a new systematic review workflow.

    Args:
        project_id: UUID of the project
        user_id: UUID of the user
        language: Response language (default: "en")

    Returns:
        Initialized ReviewState
    """
    return ReviewState(
        project_id=project_id,
        user_id=user_id,
        language=language,
        current_stage="idea",
        status="active",
        next_action="Describe your research idea or topic",
        messages=[],
        artifacts={},
        completed_stages=[],
        errors=[],
        last_error=None
    )


def get_stage_order() -> List[ReviewStage]:
    """Get the ordered list of stages in the workflow."""
    return [
        "idea",
        "research_question",
        "protocol",
        "search",
        "screening",
        "extraction",
        "synthesis",
        "reporting"
    ]


def get_next_stage(current: ReviewStage) -> Optional[ReviewStage]:
    """Get the next stage after the current one, or None if at the end."""
    stages = get_stage_order()
    try:
        idx = stages.index(current)
        if idx < len(stages) - 1:
            return stages[idx + 1]
        return None
    except ValueError:
        return None


def get_previous_stage(current: ReviewStage) -> Optional[ReviewStage]:
    """Get the previous stage before the current one, or None if at the start."""
    stages = get_stage_order()
    try:
        idx = stages.index(current)
        if idx > 0:
            return stages[idx - 1]
        return None
    except ValueError:
        return None


def is_stage_complete(state: ReviewState, stage: ReviewStage) -> bool:
    """Check if a stage has completed artifacts."""
    return stage in state.get("artifacts", {})


# ============================================================================
# Stage Display Names (for UI)
# ============================================================================

STAGE_DISPLAY_NAMES: Dict[ReviewStage, Dict[str, str]] = {
    "idea": {
        "en": "Research Idea",
        "he": "רעיון מחקרי"
    },
    "research_question": {
        "en": "Research Question",
        "he": "שאלת מחקר"
    },
    "protocol": {
        "en": "Protocol",
        "he": "פרוטוקול"
    },
    "search": {
        "en": "Search Strategy",
        "he": "אסטרטגיית חיפוש"
    },
    "screening": {
        "en": "Screening",
        "he": "סינון"
    },
    "extraction": {
        "en": "Data Extraction",
        "he": "חילוץ נתונים"
    },
    "synthesis": {
        "en": "Synthesis",
        "he": "סינתזה"
    },
    "reporting": {
        "en": "Reporting",
        "he": "דיווח"
    }
}


def get_stage_display_name(stage: ReviewStage, language: str = "en") -> str:
    """Get human-readable display name for a stage."""
    return STAGE_DISPLAY_NAMES.get(stage, {}).get(language, stage)
