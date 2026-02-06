"""
MedAI Hub - LangGraph Workflow Definition
==========================================

Defines the StateGraph for systematic review orchestration.
The workflow manages the sequential progression through review stages.

Architecture:
    START -> orchestrator -> [stage_node] -> END
                                   ^
                                   |
    Stage nodes: research_question, protocol, search, screening,
                 extraction, synthesis, reporting

The orchestrator analyzes user input and current_stage to route
to the appropriate stage-specific node. Each stage node has its
own modular implementation in the nodes/ package.
"""

import logging
from typing import Literal, Dict, Any

from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from app.graph.state import (
    ReviewState,
    ReviewStage,
    get_next_stage,
    get_stage_display_name,
)
from app.core.prompts.orchestrator import (
    ORCHESTRATOR_SYSTEM_PROMPT,
    get_stage_instructions,
)
from app.core.config import settings

# Import modular node implementations
from app.graph.nodes import (
    research_question_node,
    protocol_builder_node,
)

logger = logging.getLogger(__name__)


# ============================================================================
# AI Model Initialization
# ============================================================================

def get_llm() -> ChatGoogleGenerativeAI:
    """Get the Gemini LLM instance for orchestration."""
    return ChatGoogleGenerativeAI(
        model=settings.GEMINI_FLASH_MODEL,
        google_api_key=settings.GOOGLE_API_KEY,
        temperature=0.7,
        max_tokens=4096,
    )


# ============================================================================
# Node Definitions
# ============================================================================

async def orchestrator_node(state: ReviewState) -> Dict[str, Any]:
    """
    Main orchestrator node that analyzes input and decides what to do.

    This node:
    1. Gets the current stage from state
    2. Builds context-aware prompt
    3. Calls LLM for response
    4. Returns updated state with AI response

    Args:
        state: Current workflow state

    Returns:
        State updates including AI message
    """
    current_stage = state.get("current_stage", "research_question")
    language = state.get("language", "en")
    messages = state.get("messages", [])

    logger.info(f"Orchestrator processing stage: {current_stage}")

    # Build system prompt with stage-specific instructions
    system_prompt = get_stage_instructions(current_stage)

    # Add stage context to system prompt
    stage_display = get_stage_display_name(current_stage, language)
    context_header = f"\n\n[CURRENT STAGE: {stage_display}]\n"
    full_system_prompt = system_prompt + context_header

    # Get artifacts summary if any exist
    artifacts = state.get("artifacts", {})
    if artifacts:
        artifacts_summary = "\n\n[COMPLETED ARTIFACTS]:\n"
        for stage_name, artifact in artifacts.items():
            artifacts_summary += f"- {stage_name}: Completed\n"
        full_system_prompt += artifacts_summary

    try:
        # Build LangChain message list
        llm_messages = [SystemMessage(content=full_system_prompt)]

        # Add conversation history
        for msg in messages:
            if isinstance(msg, HumanMessage):
                llm_messages.append(msg)
            elif isinstance(msg, AIMessage):
                llm_messages.append(msg)
            elif hasattr(msg, 'type'):
                # Handle dict-like messages
                if msg.type == "human":
                    llm_messages.append(HumanMessage(content=msg.content))
                elif msg.type == "ai":
                    llm_messages.append(AIMessage(content=msg.content))

        # Call LLM
        llm = get_llm()
        response = await llm.ainvoke(llm_messages)

        # Return state update with new AI message
        return {
            "messages": [AIMessage(content=response.content)],
            "status": "waiting_for_user",
        }

    except Exception as e:
        logger.error(f"Orchestrator error: {e}")
        error_msg = f"I encountered an error: {str(e)}. Please try again."
        return {
            "messages": [AIMessage(content=error_msg)],
            "status": "error",
            "last_error": str(e),
            "errors": [str(e)],
        }


# research_question_node and protocol_builder_node are now imported from app.graph.nodes
# See app/graph/nodes/research_question.py and app/graph/nodes/protocol.py for implementations


async def search_query_node(state: ReviewState) -> Dict[str, Any]:
    """
    Stub node for Search Query building stage.

    This will be fully implemented in Epic 3.
    """
    logger.info("Search Query node processing...")

    response_content = """[STAGE: Search Strategy]

I'm helping you create your database search strategy.

**Status:** AI processing for Search stage...

This node will:
- Translate question to search terms
- Identify MeSH terms
- Build Boolean queries
- Test and validate searches

Please confirm you're ready to build the search strategy."""

    return {
        "messages": [AIMessage(content=response_content)],
        "status": "waiting_for_user",
    }


async def screening_node(state: ReviewState) -> Dict[str, Any]:
    """Stub node for Screening stage."""
    logger.info("Screening node processing...")

    return {
        "messages": [AIMessage(content="[STAGE: Screening]\n\nAI processing for Screening stage...")],
        "status": "waiting_for_user",
    }


async def extraction_node(state: ReviewState) -> Dict[str, Any]:
    """Stub node for Data Extraction stage."""
    logger.info("Extraction node processing...")

    return {
        "messages": [AIMessage(content="[STAGE: Data Extraction]\n\nAI processing for Extraction stage...")],
        "status": "waiting_for_user",
    }


async def synthesis_node(state: ReviewState) -> Dict[str, Any]:
    """Stub node for Synthesis stage."""
    logger.info("Synthesis node processing...")

    return {
        "messages": [AIMessage(content="[STAGE: Synthesis]\n\nAI processing for Synthesis stage...")],
        "status": "waiting_for_user",
    }


async def reporting_node(state: ReviewState) -> Dict[str, Any]:
    """Stub node for Reporting stage."""
    logger.info("Reporting node processing...")

    return {
        "messages": [AIMessage(content="[STAGE: Reporting]\n\nAI processing for Reporting stage...")],
        "status": "waiting_for_user",
    }


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
    current_stage = state.get("current_stage", "research_question")

    # Map stages to node names
    stage_to_node = {
        "research_question": "research_question_node",
        "protocol": "protocol_builder_node",
        "search": "search_query_node",
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
    current_stage = state.get("current_stage", "research_question")

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
    graph.add_node("research_question_node", research_question_node)
    graph.add_node("protocol_builder_node", protocol_builder_node)
    graph.add_node("search_query_node", search_query_node)
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
            "research_question_node": "research_question_node",
            "protocol_builder_node": "protocol_builder_node",
            "search_query_node": "search_query_node",
            "screening_node": "screening_node",
            "extraction_node": "extraction_node",
            "synthesis_node": "synthesis_node",
            "reporting_node": "reporting_node",
            "orchestrator": "orchestrator",  # Loop back if needed
        }
    )

    # Connect stage nodes back to END (for now)
    # In a more complex setup, they could route back to orchestrator
    graph.add_edge("research_question_node", END)
    graph.add_edge("protocol_builder_node", END)
    graph.add_edge("search_query_node", END)
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
