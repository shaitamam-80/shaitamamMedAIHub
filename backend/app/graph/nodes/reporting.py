"""
MedAI Hub - Reporting Node
============================

LangGraph node for the Reporting stage (manuscript writing).

Responsibilities:
    1. Verify data availability from all prior stages
    2. Guide section-by-section manuscript writing (LLM)
    3. Track which sections are written
    4. Generate PRISMA checklist
    5. Apply journal formatting constraints (deterministic)

Architecture (LLM for semantics, Code for determinism):
    - Code: section order, journal constraints, GRADE language, PRISMA structure
    - LLM: actual writing, adapting to data, checklist completion
"""

import logging
from typing import Dict, Any, List

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from app.graph.state import (
    ReviewState,
    ReportingArtifact,
    get_stage_display_name,
)
from sr_skills.prompts.reporting import (
    REPORTING_SYSTEM_PROMPT,
    get_reporting_context,
    WRITING_ORDER,
    MANUSCRIPT_SECTIONS,
)
from app.core.config import settings

logger = logging.getLogger(__name__)


# ============================================================================
# AI Model
# ============================================================================

def get_llm() -> ChatGoogleGenerativeAI:
    """Get the Gemini LLM for manuscript writing."""
    return ChatGoogleGenerativeAI(
        model=settings.GEMINI_PRO_MODEL,
        google_api_key=settings.GOOGLE_API_KEY,
        temperature=0.4,  # Moderate for natural writing
        max_tokens=8192,
    )


# ============================================================================
# Data Availability Check
# ============================================================================

def check_data_availability(state: ReviewState) -> Dict[str, bool]:
    """Check which data is available from prior stages."""
    artifacts = state.get("artifacts", {})
    return {
        "research_question": bool(artifacts.get("research_question")),
        "protocol": bool(artifacts.get("protocol")),
        "search": bool(artifacts.get("search")),
        "screening": bool(artifacts.get("screening")),
        "extraction": bool(artifacts.get("extraction")),
        "risk_of_bias": bool(artifacts.get("risk_of_bias")),
        "synthesis": bool(artifacts.get("synthesis")),
    }


# ============================================================================
# Stage Completion Check
# ============================================================================

def check_stage_completion(state: ReviewState) -> bool:
    """Check if reporting stage completion criteria are met."""
    artifacts = state.get("artifacts", {})
    reporting = artifacts.get("reporting", {})

    # Complete if manuscript text exists
    return bool(reporting.get("manuscript_text"))


# ============================================================================
# Main Node Implementation
# ============================================================================

async def reporting_node(state: ReviewState) -> Dict[str, Any]:
    """
    Reporting stage node (manuscript writing).

    Flow:
    1. Check data availability from all prior stages
    2. Present writing plan and data verification
    3. LLM writes sections based on available data
    4. Track written sections in artifact
    5. Generate PRISMA checklist on completion

    Args:
        state: Current workflow state

    Returns:
        State updates with AI response and reporting artifacts
    """
    language = state.get("language", "en")
    messages = state.get("messages", [])
    current_artifacts = state.get("artifacts", {})
    reporting_artifact = current_artifacts.get("reporting", {})
    screening_artifact = current_artifacts.get("screening", {})

    logger.info("Reporting node processing...")

    # Get the latest user message
    user_message = ""
    for msg in reversed(messages):
        if isinstance(msg, HumanMessage):
            user_message = msg.content
            break
        elif hasattr(msg, 'type') and msg.type == "human":
            user_message = msg.content
            break

    # Check data availability
    data_status = check_data_availability(state)

    if not user_message:
        # Show data availability status
        status_lines = []
        for stage, available in data_status.items():
            icon = "+" if available else "-"
            status_lines.append(f"  [{icon}] {stage.replace('_', ' ').title()}")

        status_text = "\n".join(status_lines)
        return {
            "messages": [AIMessage(content=f"[STAGE: Reporting]\n\n**Data Availability Check:**\n{status_text}\n\nWhat would you like to do?\n- Type 'write' to start the full manuscript\n- Type 'section [name]' to write a specific section\n- Type 'prisma' to generate the PRISMA checklist")],
            "status": "waiting_for_user",
            "next_action": "Choose writing mode",
        }

    # Check for completion confirmation
    if check_stage_completion(state):
        advance_keywords = ["done", "finish", "complete", "סיום"]
        if any(kw in user_message.lower() for kw in advance_keywords):
            return {
                "status": "completed",
                "messages": [AIMessage(content="[STAGE: Reporting]\n\n**Systematic review manuscript complete!**\n\nAll stages of the systematic review workflow are done. You can download your manuscript and supplementary files from the project artifacts.")],
                "next_action": "Review complete",
            }

    # Build reporting context
    included_count = screening_artifact.get("included_count", 0)
    sections_written = reporting_artifact.get("sections_written", [])

    reporting_context = get_reporting_context(
        included_count=included_count,
        sections_written=sections_written,
    )

    # Add data availability summary
    reporting_context += "\n\n[DATA AVAILABILITY]"
    for stage, available in data_status.items():
        reporting_context += f"\n  {'✓' if available else '✗'} {stage}"

    # Add artifact summaries for context
    for stage_name in ["research_question", "protocol", "search", "screening", "extraction", "synthesis"]:
        artifact = current_artifacts.get(stage_name, {})
        if artifact:
            reporting_context += f"\n\n[{stage_name.upper()} DATA]"
            # Add key fields (limit to avoid prompt bloat)
            for key, val in list(artifact.items())[:5]:
                if isinstance(val, (str, int, float, bool)):
                    reporting_context += f"\n  {key}: {val}"

    try:
        stage_display = get_stage_display_name("reporting", language)
        full_system_prompt = f"{REPORTING_SYSTEM_PROMPT}{reporting_context}"

        # Build message list
        llm_messages = [SystemMessage(content=full_system_prompt)]

        history_messages = messages[-10:] if len(messages) > 10 else messages
        for msg in history_messages:
            if isinstance(msg, HumanMessage):
                llm_messages.append(msg)
            elif isinstance(msg, AIMessage):
                llm_messages.append(msg)
            elif hasattr(msg, 'type'):
                if msg.type == "human":
                    llm_messages.append(HumanMessage(content=msg.content))
                elif msg.type == "ai":
                    llm_messages.append(AIMessage(content=msg.content))

        # Call LLM
        llm = get_llm()
        response = await llm.ainvoke(llm_messages)
        ai_response = response.content

        # Track which section was written (detect from response or user request)
        written_section = None
        for section in MANUSCRIPT_SECTIONS:
            section_name = section["name"].lower()
            if section_name in user_message.lower() or f"## {section['name']}" in ai_response:
                written_section = section["id"]
                break

        # Update artifact
        updated_sections = list(sections_written)
        if written_section and written_section not in updated_sections:
            updated_sections.append(written_section)

        # Accumulate manuscript text
        existing_text = reporting_artifact.get("manuscript_text", "")
        if written_section:
            existing_text += f"\n\n{ai_response}"

        updated_reporting: ReportingArtifact = {
            "manuscript_text": existing_text,
            "prisma_flowchart": reporting_artifact.get("prisma_flowchart", ""),
            "tables": reporting_artifact.get("tables", []),
            "figures": reporting_artifact.get("figures", []),
        }
        # Store sections_written in a flexible way
        # (ReportingArtifact is total=False, so extra keys are fine at runtime)

        updated_artifacts = {**current_artifacts, "reporting": updated_reporting}

        return {
            "messages": [AIMessage(content=f"[STAGE: {stage_display}]\n\n{ai_response}")],
            "status": "waiting_for_user",
            "artifacts": updated_artifacts,
            "next_action": "Continue writing or finalize",
        }

    except Exception as e:
        logger.error(f"Reporting node error: {e}")
        error_msg = f"I encountered an error during manuscript writing: {str(e)}. Please try again."
        return {
            "messages": [AIMessage(content=error_msg)],
            "status": "error",
            "last_error": str(e),
            "errors": [str(e)],
        }
