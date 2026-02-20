"""
MedAI Hub - LangGraph Workflow Definition
==========================================

Defines the StateGraph for systematic review orchestration.
The workflow manages the sequential progression through review stages.

Architecture:
    START -> orchestrator -> [stage_node] -> END
                                   ^
                                   |
    Stage nodes: idea, research_question, protocol, search, screening,
                 extraction, synthesis, reporting

The orchestrator analyzes user input and current_stage to route
to the appropriate stage-specific node. Each stage node has its
own modular implementation in the nodes/ package.
"""

import logging
from typing import Literal, Dict, Any

from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

from app.graph.state import (
    ReviewState,
    ReviewStage,
    get_next_stage,
    get_stage_display_name,
)

# Import modular node implementations
from app.graph.nodes import (
    idea_node,
    research_question_node,
    protocol_builder_node,
    search_node,
    screening_node,
    extraction_node,
    synthesis_node,
    reporting_node,
)

logger = logging.getLogger(__name__)


# ============================================================================
# Node Definitions
# ============================================================================

async def orchestrator_node(state: ReviewState) -> Dict[str, Any]:
    """
    Pure router — validates state and sets defaults.

    No LLM call. Routing to the correct stage node happens via
    the route_by_stage conditional edges. Each stage node has its
    own system prompt and conversational LLM call.
    """
    current_stage = state.get("current_stage", "idea")
    logger.info(f"Orchestrator routing to stage: {current_stage}")
    return {
        "status": "active",
    }


# All stage nodes are imported from app.graph.nodes


# ============================================================================
# Routing Logic
# ============================================================================

def route_by_stage(state: ReviewState) -> str:
    """
    Route to the appropriate node based on current_stage.

    Args:
        state: Current workflow state

    Returns:
        Name of the next node to execute
    """
    current_stage = state.get("current_stage", "idea")

    # Map stages to node names
    stage_to_node = {
        "idea": "idea_node",
        "research_question": "research_question_node",
        "protocol": "protocol_builder_node",
        "search": "search_node",
        "screening": "screening_node",
        "extraction": "extraction_node",
        "synthesis": "synthesis_node",
        "reporting": "reporting_node",
    }

    node = stage_to_node.get(current_stage, "orchestrator")
    logger.info(f"Routing from stage '{current_stage}' to node '{node}'")
    return node


def should_continue(state: ReviewState) -> Literal["continue", "end"]:
    """
    Determine if workflow should continue or end.

    The workflow ends when:
    - Status is "completed" and we're at the final stage
    - An unrecoverable error occurred

    Args:
        state: Current workflow state

    Returns:
        "continue" or "end"
    """
    status = state.get("status", "active")
    current_stage = state.get("current_stage", "idea")

    # End if completed at final stage
    if status == "completed" and current_stage == "reporting":
        return "end"

    # Continue otherwise (including waiting_for_user)
    return "continue"


# ============================================================================
# Graph Builder
# ============================================================================

def build_review_graph() -> StateGraph:
    """
    Build and return the compiled StateGraph for systematic review workflow.

    Graph Structure:
        START -> orchestrator -> [route_by_stage] -> stage_node -> END

    The orchestrator is the main entry point. It analyzes user input
    and routes to stage-specific nodes based on current_stage.

    Returns:
        Compiled StateGraph ready for execution
    """
    # Create the graph with ReviewState schema
    graph = StateGraph(ReviewState)

    # Add nodes
    graph.add_node("orchestrator", orchestrator_node)
    graph.add_node("idea_node", idea_node)
    graph.add_node("research_question_node", research_question_node)
    graph.add_node("protocol_builder_node", protocol_builder_node)
    graph.add_node("search_node", search_node)
    graph.add_node("screening_node", screening_node)
    graph.add_node("extraction_node", extraction_node)
    graph.add_node("synthesis_node", synthesis_node)
    graph.add_node("reporting_node", reporting_node)

    # Connect START to orchestrator
    graph.add_edge(START, "orchestrator")

    # Add conditional edges from orchestrator to stage nodes
    graph.add_conditional_edges(
        "orchestrator",
        route_by_stage,
        {
            "idea_node": "idea_node",
            "research_question_node": "research_question_node",
            "protocol_builder_node": "protocol_builder_node",
            "search_node": "search_node",
            "screening_node": "screening_node",
            "extraction_node": "extraction_node",
            "synthesis_node": "synthesis_node",
            "reporting_node": "reporting_node",
            "orchestrator": "orchestrator",  # Loop back if needed
        }
    )

    # Connect stage nodes back to END (for now)
    # In a more complex setup, they could route back to orchestrator
    graph.add_edge("idea_node", END)
    graph.add_edge("research_question_node", END)
    graph.add_edge("protocol_builder_node", END)
    graph.add_edge("search_node", END)
    graph.add_edge("screening_node", END)
    graph.add_edge("extraction_node", END)
    graph.add_edge("synthesis_node", END)
    graph.add_edge("reporting_node", END)

    return graph


def get_compiled_graph(checkpointer=None):
    """
    Get a compiled graph instance with optional checkpointer.

    Args:
        checkpointer: Optional checkpointer for state persistence
                     (MemorySaver, AsyncPostgresSaver, etc.)

    Returns:
        Compiled graph ready for invocation
    """
    graph = build_review_graph()

    if checkpointer:
        return graph.compile(checkpointer=checkpointer)
    else:
        return graph.compile()


# ============================================================================
# Graph Instance (Singleton-ish for the application)
# ============================================================================

# Use persistent checkpointer (PostgreSQL if DATABASE_URL set, else MemorySaver)
_graph_instance = None

def get_graph():
    """
    Get the compiled graph with persistent state.

    Uses PostgreSQL checkpointer when DATABASE_URL is configured,
    otherwise falls back to in-memory MemorySaver.
    """
    global _graph_instance
    if _graph_instance is None:
        from app.services.checkpointer import get_checkpointer
        checkpointer = get_checkpointer()
        _graph_instance = get_compiled_graph(checkpointer=checkpointer)
    return _graph_instance
