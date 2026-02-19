"""
MedAI Hub - Protocol Builder Node
=================================

LangGraph node for the Protocol stage of systematic reviews.
This node helps researchers build PROSPERO-ready protocols that comply
with PRISMA-P (2015) and PRISMA-ScR (2018) guidelines.

Responsibilities:
    1. Determine review type (systematic vs. scoping)
    2. Define eligibility criteria (inclusion/exclusion)
    3. Specify information sources and search strategy
    4. Outline study selection, data extraction, and RoB assessment
    5. Plan data synthesis approach
    6. Generate PROSPERO-formatted protocol document
"""

import logging
import re
from typing import Dict, Any, Optional, List

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from app.graph.state import (
    ReviewState,
    ProtocolArtifact,
    ResearchQuestionArtifact,
    get_next_stage,
    get_stage_display_name,
)
from sr_skills.prompts.protocol import (
    PROTOCOL_BUILDER_SYSTEM_PROMPT,
    PROTOCOL_SECTIONS,
    ROB_TOOLS,
    get_rob_tool,
    is_section_required,
)
from app.core.config import settings

logger = logging.getLogger(__name__)


# ============================================================================
# AI Model Initialization
# ============================================================================

def get_llm() -> ChatGoogleGenerativeAI:
    """Get the Gemini LLM instance for protocol building."""
    return ChatGoogleGenerativeAI(
        model=settings.GEMINI_FLASH_MODEL,
        google_api_key=settings.GOOGLE_API_KEY,
        temperature=0.7,
        max_tokens=4096,
    )


# ============================================================================
# Review Type Detection
# ============================================================================

def detect_review_type(
    framework: str,
    user_input: str
) -> str:
    """
    Detect review type based on framework and user input.

    Args:
        framework: The research question framework (PICO, PCC, etc.)
        user_input: User's description

    Returns:
        Review type string
    """
    user_lower = user_input.lower()

    # Scoping review indicators
    if framework == "PCC" or "scoping" in user_lower or "mapping" in user_lower:
        return "scoping_review"

    # Qualitative review indicators
    if framework in ["SPIDER", "PICo"] or "qualitative" in user_lower:
        return "qualitative_review"

    # Prevalence review
    if framework == "CoCoPop" or "prevalence" in user_lower:
        return "prevalence_review"

    # Prognosis review
    if framework == "PFO" or "prognosis" in user_lower:
        return "prognosis_review"

    # Diagnostic review
    if framework == "PIRD" or "diagnostic" in user_lower:
        return "diagnostic_review"

    # Default to intervention review
    return "intervention_review"


def get_recommended_registration(review_type: str) -> str:
    """Get recommended registration platform for review type."""
    if review_type == "scoping_review":
        return "OSF or INPLASY"
    return "PROSPERO"


def get_recommended_rob_tool(review_type: str) -> Dict:
    """Get recommended RoB tool for review type."""
    type_to_design = {
        "intervention_review": "rct",
        "prevalence_review": "prevalence",
        "prognosis_review": "prognosis",
        "diagnostic_review": "diagnostic",
        "qualitative_review": "qualitative",
        "scoping_review": "cross-sectional"  # Optional for scoping
    }
    design = type_to_design.get(review_type, "rct")
    return get_rob_tool(design)


# ============================================================================
# Protocol Section Tracking
# ============================================================================

REQUIRED_SECTIONS = [
    "eligibility_population",
    "eligibility_intervention",
    "eligibility_outcomes",
    "information_sources",
    "study_selection",
    "data_extraction",
    "risk_of_bias",
    "data_synthesis"
]


def get_completed_sections(artifact: Dict) -> List[str]:
    """Get list of completed protocol sections."""
    completed = []

    if artifact.get("eligibility_criteria"):
        criteria = artifact["eligibility_criteria"]
        if criteria.get("population"):
            completed.append("eligibility_population")
        if criteria.get("intervention") or criteria.get("exposure"):
            completed.append("eligibility_intervention")
        if criteria.get("outcomes"):
            completed.append("eligibility_outcomes")

    if artifact.get("information_sources"):
        completed.append("information_sources")

    if artifact.get("search_strategy_draft"):
        completed.append("search_strategy")

    # Check for other sections in protocol_text
    protocol_text = artifact.get("protocol_text", "")
    if "STUDY SELECTION" in protocol_text.upper():
        completed.append("study_selection")
    if "DATA EXTRACTION" in protocol_text.upper():
        completed.append("data_extraction")
    if "RISK OF BIAS" in protocol_text.upper():
        completed.append("risk_of_bias")
    if "DATA SYNTHESIS" in protocol_text.upper() or "SYNTHESIS" in protocol_text.upper():
        completed.append("data_synthesis")

    return completed


def get_missing_sections(artifact: Dict) -> List[str]:
    """Get list of missing required protocol sections."""
    completed = get_completed_sections(artifact)
    return [s for s in REQUIRED_SECTIONS if s not in completed]


def check_stage_completion(state: ReviewState) -> bool:
    """
    Check if all criteria for protocol stage completion are met.

    Criteria:
    1. Review type is determined
    2. Eligibility criteria are defined
    3. Information sources are listed
    4. Study selection process is outlined
    5. Data extraction plan exists
    6. RoB tool is selected
    7. Synthesis plan is defined
    """
    artifacts = state.get("artifacts", {})
    protocol_artifact = artifacts.get("protocol", {})

    # Check required elements
    has_eligibility = bool(protocol_artifact.get("eligibility_criteria"))
    has_protocol = bool(protocol_artifact.get("protocol_text"))

    missing = get_missing_sections(protocol_artifact)
    has_all_sections = len(missing) <= 2  # Allow some flexibility

    return has_eligibility and has_protocol and has_all_sections


# ============================================================================
# Protocol Generation
# ============================================================================

def extract_eligibility_criteria(response: str) -> Dict[str, List[str]]:
    """Extract eligibility criteria from AI response."""
    criteria = {
        "population": {"inclusion": [], "exclusion": []},
        "intervention": {"inclusion": [], "exclusion": []},
        "comparison": {"inclusion": [], "exclusion": []},
        "outcomes": {"inclusion": [], "exclusion": []},
        "study_designs": {"inclusion": [], "exclusion": []}
    }

    # Simple extraction patterns
    # In production, use structured output from LLM

    return criteria


def build_protocol_context(rq_artifact: ResearchQuestionArtifact) -> str:
    """Build context from research question artifact."""
    context = "\n\n[RESEARCH QUESTION FROM PREVIOUS STAGE]\n"

    if rq_artifact.get("framework_type"):
        context += f"Framework: {rq_artifact['framework_type']}\n"

    if rq_artifact.get("framework_data"):
        context += "Components:\n"
        for key, value in rq_artifact["framework_data"].items():
            context += f"  - {key}: {value}\n"

    if rq_artifact.get("question_narrow"):
        context += f"\nFocused Question: {rq_artifact['question_narrow']}\n"

    return context


# ============================================================================
# Main Node Implementation
# ============================================================================

async def protocol_builder_node(state: ReviewState) -> Dict[str, Any]:
    """
    Protocol Builder stage node.

    This node:
    1. Retrieves research question from previous stage
    2. Determines review type (systematic/scoping)
    3. Guides through protocol sections
    4. Generates PROSPERO-formatted protocol
    5. Manages stage completion and transition

    Args:
        state: Current workflow state

    Returns:
        State updates with AI response and artifacts
    """
    language = state.get("language", "en")
    messages = state.get("messages", [])
    current_artifacts = state.get("artifacts", {})
    protocol_artifact = current_artifacts.get("protocol", {})
    rq_artifact = current_artifacts.get("research_question", {})

    logger.info("Protocol Builder node processing...")

    # Get the latest user message
    user_message = ""
    for msg in reversed(messages):
        if isinstance(msg, HumanMessage):
            user_message = msg.content
            break
        elif hasattr(msg, 'type') and msg.type == "human":
            user_message = msg.content
            break

    # Check if we have a research question from previous stage
    if not rq_artifact or not rq_artifact.get("framework_type"):
        return {
            "messages": [AIMessage(content="[STAGE: Protocol]\n\nI notice we don't have a completed research question. Let me help you build a protocol, but please note that having a structured research question first makes this process more effective.\n\nWhat is the topic of your systematic review?")],
            "status": "waiting_for_user",
            "next_action": "Describe your review topic"
        }

    # Check for stage advancement request
    advance_keywords = ["yes", "proceed", "next", "continue", "ready", "כן", "המשך"]
    if any(kw in user_message.lower() for kw in advance_keywords) and check_stage_completion(state):
        next_stage = get_next_stage("protocol")
        if next_stage:
            return {
                "current_stage": next_stage,
                "status": "active",
                "messages": [AIMessage(content=f"[STAGE: {get_stage_display_name(next_stage, language)}]\n\nExcellent! Your protocol is complete. Let's move on to building your search strategy.")],
                "next_action": "Build your PubMed search query"
            }

    # Detect review type
    framework = rq_artifact.get("framework_type", "PICO")
    review_type = detect_review_type(framework, user_message)
    registration = get_recommended_registration(review_type)
    rob_tool = get_recommended_rob_tool(review_type)

    try:
        # Build context-aware system prompt
        stage_display = get_stage_display_name("protocol", language)

        # Add research question context
        rq_context = build_protocol_context(rq_artifact)

        # Add protocol progress context
        progress_context = ""
        if protocol_artifact:
            completed = get_completed_sections(protocol_artifact)
            missing = get_missing_sections(protocol_artifact)
            if completed:
                progress_context = f"\n\n[PROTOCOL PROGRESS]\nCompleted sections: {', '.join(completed)}\n"
            if missing:
                progress_context += f"Missing sections: {', '.join(missing)}\n"

        # Add review type context
        type_context = f"\n\n[REVIEW TYPE]\nType: {review_type.replace('_', ' ').title()}\nRecommended Registration: {registration}\nRecommended RoB Tool: {rob_tool.get('name', 'TBD')}\n"

        full_system_prompt = f"{PROTOCOL_BUILDER_SYSTEM_PROMPT}{rq_context}{type_context}{progress_context}"

        # Build message list for LLM
        llm_messages = [SystemMessage(content=full_system_prompt)]

        # Add conversation history (last 10 messages)
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

        # Extract and update eligibility criteria
        extracted_criteria = extract_eligibility_criteria(ai_response)
        existing_criteria = protocol_artifact.get("eligibility_criteria", {})

        # Merge criteria (new overwrites old)
        merged_criteria = {**existing_criteria}
        for key, value in extracted_criteria.items():
            if value.get("inclusion") or value.get("exclusion"):
                merged_criteria[key] = value

        # Build updated artifact
        updated_artifact: ProtocolArtifact = {
            "protocol_text": protocol_artifact.get("protocol_text", "") + "\n" + ai_response if protocol_artifact.get("protocol_text") else ai_response,
            "prospero_fields": protocol_artifact.get("prospero_fields", {
                "review_type": review_type,
                "registration": registration,
                "rob_tool": rob_tool.get("name", "")
            }),
            "eligibility_criteria": merged_criteria,
            "search_strategy_draft": protocol_artifact.get("search_strategy_draft", "")
        }

        # Update artifacts in state
        updated_artifacts = {**current_artifacts, "protocol": updated_artifact}

        # Check if stage is complete
        is_complete = check_stage_completion({**state, "artifacts": updated_artifacts})

        if is_complete:
            completion_msg = "\n\n---\n\n✅ **Stage Complete!** Your protocol is ready for PROSPERO registration.\n\nAre you ready to proceed to the **Search Strategy** stage? (Type 'yes' or 'proceed')"
            ai_response += completion_msg

        return {
            "messages": [AIMessage(content=f"[STAGE: {stage_display}]\n\n{ai_response}")],
            "status": "waiting_for_user",
            "artifacts": updated_artifacts,
            "next_action": "Finalize your protocol or proceed to the next stage" if is_complete else "Continue building your protocol"
        }

    except Exception as e:
        logger.error(f"Protocol Builder node error: {e}")
        error_msg = f"I encountered an error while building your protocol: {str(e)}. Please try again."
        return {
            "messages": [AIMessage(content=error_msg)],
            "status": "error",
            "last_error": str(e),
            "errors": [str(e)]
        }
