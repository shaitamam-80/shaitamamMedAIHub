"""
MedAI Hub - LangGraph State Machine Architecture
=================================================

This package contains the state machine architecture for AI operations.
Uses LangGraph for orchestrating multi-step systematic review workflows.

Modules:
    - state: Core state definitions (TypedDict classes)
    - workflow: LangGraph graph definition and routing
    - nodes/: Modular node implementations for each stage
"""

from .state import (
    # State types
    ReviewState,
    ReviewStage,
    WorkflowStatus,
    # Artifact types
    ResearchQuestionArtifact,
    ProtocolArtifact,
    SearchArtifact,
    ScreeningArtifact,
    ExtractionArtifact,
    SynthesisArtifact,
    ReportingArtifact,
    # Helper functions
    get_initial_state,
    get_stage_order,
    get_next_stage,
    get_previous_stage,
    is_stage_complete,
    get_stage_display_name,
    STAGE_DISPLAY_NAMES,
)

from .workflow import (
    build_review_graph,
    get_compiled_graph,
    get_graph,
)

from .nodes import (
    research_question_node,
    protocol_builder_node,
    search_node,
    screening_node,
    extraction_node,
    risk_of_bias_node,
    synthesis_node,
    reporting_node,
)

__all__ = [
    # State types
    "ReviewState",
    "ReviewStage",
    "WorkflowStatus",
    # Artifact types
    "ResearchQuestionArtifact",
    "ProtocolArtifact",
    "SearchArtifact",
    "ScreeningArtifact",
    "ExtractionArtifact",
    "SynthesisArtifact",
    "ReportingArtifact",
    # Helper functions
    "get_initial_state",
    "get_stage_order",
    "get_next_stage",
    "get_previous_stage",
    "is_stage_complete",
    "get_stage_display_name",
    "STAGE_DISPLAY_NAMES",
    # Workflow
    "build_review_graph",
    "get_compiled_graph",
    "get_graph",
    # Nodes
    "research_question_node",
    "protocol_builder_node",
    "search_node",
    "screening_node",
    "extraction_node",
    "risk_of_bias_node",
    "synthesis_node",
    "reporting_node",
]
