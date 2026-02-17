"""
MedAI Hub - Synthesis Node
============================

LangGraph node for the Synthesis stage (Meta-Analysis + GRADE).

Responsibilities:
    1. Assess pooling feasibility (deterministic)
    2. Select effect measure and model (deterministic)
    3. LLM generates R code and analysis plan (semantic)
    4. LLM conducts GRADE assessment per outcome (semantic)
    5. Compute GRADE certainty (deterministic)
    6. Generate SoF table and plain-language statements

Architecture (LLM for semantics, Code for determinism):
    - Code: pooling feasibility, I² interpretation, GRADE computation, plain language
    - LLM: analysis planning, R code generation, GRADE rationale, clinical interpretation
"""

import logging
import re
from typing import Dict, Any, List

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from app.graph.state import (
    ReviewState,
    SynthesisArtifact,
    get_next_stage,
    get_stage_display_name,
)
from app.core.constants.meta_analysis import (
    can_pool,
    interpret_i_squared,
    OUTCOME_TYPE_DEFAULT_MEASURE,
    STANDARD_SENSITIVITY_ANALYSES,
)
from app.core.constants.grade import (
    compute_grade_certainty,
    get_plain_language,
    STARTING_CERTAINTY,
    CERTAINTY_DEFINITIONS,
    DOWNGRADE_DOMAINS,
)
from app.core.prompts.synthesis import (
    SYNTHESIS_SYSTEM_PROMPT,
    get_synthesis_context,
)
from app.core.config import settings

logger = logging.getLogger(__name__)


# ============================================================================
# AI Model
# ============================================================================

def get_llm() -> ChatGoogleGenerativeAI:
    """Get the Gemini LLM for synthesis tasks."""
    return ChatGoogleGenerativeAI(
        model=settings.GEMINI_PRO_MODEL,
        google_api_key=settings.GOOGLE_API_KEY,
        temperature=0.3,  # Moderate for code generation + interpretation
        max_tokens=8192,
    )


# ============================================================================
# Parse GRADE Judgments from AI Response
# ============================================================================

def parse_grade_from_response(ai_response: str) -> Dict[str, Any]:
    """
    Extract GRADE domain judgments and certainty from AI response.

    Looks for GRADE table patterns with downgrade values.
    """
    grade_data = {}

    # Try to find downgrade values
    for domain in DOWNGRADE_DOMAINS:
        domain_name = domain["name"]
        # Match "Domain | judgment | -1/-2/0 | rationale"
        pattern = rf'{domain_name}\s*\|\s*(.+?)\s*\|\s*(-?\d)\s*\|\s*(.+?)(?:\n|\|)'
        match = re.search(pattern, ai_response, re.IGNORECASE)
        if match:
            grade_data[domain["id"]] = {
                "judgment": match.group(1).strip(),
                "downgrade": int(match.group(2)),
                "rationale": match.group(3).strip(),
            }

    # Try to find final certainty
    certainty_match = re.search(
        r'(?:Final|Overall)\s*certainty:\s*\*?\*?(High|Moderate|Low|Very Low)\*?\*?',
        ai_response, re.IGNORECASE,
    )
    if certainty_match:
        grade_data["final_certainty"] = certainty_match.group(1)

    return grade_data


# ============================================================================
# Stage Completion Check
# ============================================================================

def check_stage_completion(state: ReviewState) -> bool:
    """Check if synthesis stage completion criteria are met."""
    artifacts = state.get("artifacts", {})
    synthesis = artifacts.get("synthesis", {})

    has_meta = bool(synthesis.get("meta_analysis"))
    has_grade = bool(synthesis.get("grade_assessment"))

    return has_meta or has_grade


# ============================================================================
# Main Node Implementation
# ============================================================================

async def synthesis_node(state: ReviewState) -> Dict[str, Any]:
    """
    Synthesis stage node (Meta-Analysis + GRADE).

    Flow:
    1. Check pooling feasibility (deterministic)
    2. LLM plans analysis and generates R code
    3. LLM conducts GRADE assessment
    4. Apply deterministic GRADE computation
    5. Generate SoF table and plain-language statements

    Args:
        state: Current workflow state

    Returns:
        State updates with AI response and synthesis artifacts
    """
    language = state.get("language", "en")
    messages = state.get("messages", [])
    current_artifacts = state.get("artifacts", {})
    synthesis_artifact = current_artifacts.get("synthesis", {})
    extraction_artifact = current_artifacts.get("extraction", {})
    rob_artifact = current_artifacts.get("risk_of_bias", {})
    screening_artifact = current_artifacts.get("screening", {})
    rq_artifact = current_artifacts.get("research_question", {})

    logger.info("Synthesis node processing...")

    # Get the latest user message
    user_message = ""
    for msg in reversed(messages):
        if isinstance(msg, HumanMessage):
            user_message = msg.content
            break
        elif hasattr(msg, 'type') and msg.type == "human":
            user_message = msg.content
            break

    if not user_message:
        return {
            "messages": [AIMessage(content="[STAGE: Synthesis]\n\nLet's synthesize the evidence. Would you like to:\n1. Plan a meta-analysis\n2. Start GRADE assessment\n3. Do narrative synthesis (if pooling isn't appropriate)\n\nPlease describe your extracted data or type 'plan' to begin.")],
            "status": "waiting_for_user",
            "next_action": "Choose synthesis approach",
        }

    # Check for stage advancement
    advance_keywords = ["yes", "proceed", "next", "continue", "ready", "confirm", "done", "כן", "המשך", "אישור"]
    if any(kw in user_message.lower() for kw in advance_keywords) and check_stage_completion(state):
        next_stage = get_next_stage("synthesis")
        if next_stage:
            return {
                "current_stage": next_stage,
                "status": "active",
                "messages": [AIMessage(content=f"[STAGE: {get_stage_display_name(next_stage, language)}]\n\nSynthesis complete. Let's prepare the manuscript and report.")],
                "next_action": "Begin manuscript writing",
            }

    # Build context from prior artifacts
    extracted_studies = extraction_artifact.get("extracted_studies", [])
    study_designs = [s.get("_study_design", "rct") for s in extracted_studies]
    has_rob = bool(rob_artifact.get("assessments"))
    framework_type = rq_artifact.get("framework_type", "PICO")
    included_count = screening_artifact.get("included_count", 0)

    # Check pooling feasibility
    pooling = can_pool(num_studies=len(extracted_studies))

    synthesis_context = get_synthesis_context(
        num_included=included_count,
        num_extracted=len(extracted_studies),
        study_designs=study_designs,
        framework_type=framework_type,
        has_rob=has_rob,
    )

    # Add pooling feasibility to context
    if not pooling["can_pool"]:
        synthesis_context += f"\n\n[POOLING ASSESSMENT]\nNot recommended: {'; '.join(pooling['issues'])}"
        synthesis_context += f"\nRecommendation: {pooling['recommendation']}"
    else:
        synthesis_context += "\n\n[POOLING ASSESSMENT]\nPooling appears feasible."

    try:
        stage_display = get_stage_display_name("synthesis", language)
        full_system_prompt = f"{SYNTHESIS_SYSTEM_PROMPT}{synthesis_context}"

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

        # Parse GRADE data from response if present
        grade_data = parse_grade_from_response(ai_response)

        # If GRADE data was extracted, compute certainty deterministically
        if grade_data and "final_certainty" not in grade_data:
            downgrades = {}
            for domain_id, data in grade_data.items():
                if isinstance(data, dict) and "downgrade" in data:
                    downgrades[domain_id] = data["downgrade"]

            if downgrades:
                # Determine starting level from study designs
                primary_design = study_designs[0] if study_designs else "rct"
                starting = STARTING_CERTAINTY.get(primary_design, "High")
                certainty, adjustment = compute_grade_certainty(starting, downgrades)
                grade_data["computed_certainty"] = certainty
                grade_data["total_adjustment"] = adjustment

                ai_response += f"\n\n---\n**GRADE Certainty (computed): {certainty}** {CERTAINTY_DEFINITIONS.get(certainty, {}).get('symbol', '')}"

        # Update artifact
        updated_synthesis: SynthesisArtifact = {
            "meta_analysis": synthesis_artifact.get("meta_analysis", {}) or {"planned": True},
            "grade_assessment": grade_data if grade_data else synthesis_artifact.get("grade_assessment", {}),
            "forest_plots": synthesis_artifact.get("forest_plots", []),
            "summary_of_findings": synthesis_artifact.get("summary_of_findings", ""),
        }

        updated_artifacts = {**current_artifacts, "synthesis": updated_synthesis}

        # Check completion
        is_complete = check_stage_completion({**state, "artifacts": updated_artifacts})

        if is_complete and grade_data:
            ai_response += "\n\n**Synthesis stage complete!** Type 'proceed' to move to Reporting."

        return {
            "messages": [AIMessage(content=f"[STAGE: {stage_display}]\n\n{ai_response}")],
            "status": "waiting_for_user",
            "artifacts": updated_artifacts,
            "next_action": "Review and proceed" if is_complete else "Continue synthesis",
        }

    except Exception as e:
        logger.error(f"Synthesis node error: {e}")
        error_msg = f"I encountered an error during synthesis: {str(e)}. Please try again."
        return {
            "messages": [AIMessage(content=error_msg)],
            "status": "error",
            "last_error": str(e),
            "errors": [str(e)],
        }
