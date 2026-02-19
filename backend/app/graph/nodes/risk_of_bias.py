"""
MedAI Hub - Risk of Bias Node
================================

LangGraph node for the Risk of Bias assessment stage.

Responsibilities:
    1. Auto-select RoB tool based on study design (deterministic)
    2. Present domains and signaling questions (deterministic)
    3. Use LLM to assess each domain from study text (semantic)
    4. Apply overall judgment algorithm (deterministic)
    5. Track assessment progress and manage stage completion

Architecture (LLM for semantics, Code for determinism):
    - Code: tool selection, domain definitions, overall judgment algorithms
    - LLM: answering signaling questions, citing evidence, writing justifications
"""

import logging
import re
import json
from typing import Dict, Any, List, Optional

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from app.graph.state import (
    ReviewState,
    get_next_stage,
    get_stage_display_name,
)
from sr_skills.constants.rob_tools import (
    select_rob_tool,
    get_domains_for_tool,
    rob2_overall_judgment,
    robins_i_overall_judgment,
    nos_interpret_stars,
    TOOL_ROB2,
    TOOL_ROBINS_I,
    TOOL_NOS_COHORT,
    TOOL_NOS_CASE_CONTROL,
    TOOL_DISPLAY_NAMES,
)
from sr_skills.prompts.risk_of_bias import (
    ROB_SYSTEM_PROMPT,
    get_rob_context,
)
from app.core.config import settings

logger = logging.getLogger(__name__)


# ============================================================================
# AI Model
# ============================================================================

def get_llm() -> ChatGoogleGenerativeAI:
    """Get the Gemini LLM for RoB assessments."""
    return ChatGoogleGenerativeAI(
        model=settings.GEMINI_PRO_MODEL,
        google_api_key=settings.GOOGLE_API_KEY,
        temperature=0.2,  # Low for consistent bias assessment
        max_tokens=8192,
    )


# ============================================================================
# Parse RoB Assessment from AI Response
# ============================================================================

def parse_domain_judgments(ai_response: str, tool_id: str) -> List[Dict[str, str]]:
    """
    Extract domain judgments from AI response text.

    Looks for patterns like:
        Domain 1: ... Judgment: Low/Some concerns/High
    or:
        D1: ... Judgment: Low
    """
    judgments = []

    # Match "Domain N:" or "D[N]:" blocks with "Judgment:" lines
    domain_blocks = re.split(r'(?:Domain\s+\d+|D\d+)\s*:', ai_response)

    for block in domain_blocks[1:]:  # Skip preamble
        judgment_match = re.search(
            r'Judgment:\s*\*?\*?(Low|Some concerns|Moderate|High|Serious|Critical|Unclear|No information)\*?\*?',
            block, re.IGNORECASE,
        )
        if judgment_match:
            judgment = judgment_match.group(1).strip()
            # Extract justification
            just_match = re.search(r'Justification:\s*(.+?)(?:\n\n|\nDomain|\Z)', block, re.DOTALL)
            justification = just_match.group(1).strip() if just_match else ""
            judgments.append({
                "judgment": judgment,
                "justification": justification,
            })

    return judgments


def compute_overall(domain_judgments: List[str], tool_id: str) -> str:
    """Apply deterministic overall judgment algorithm."""
    if tool_id == TOOL_ROB2:
        return rob2_overall_judgment(domain_judgments)
    elif tool_id == TOOL_ROBINS_I:
        return robins_i_overall_judgment(domain_judgments)
    elif tool_id in (TOOL_NOS_COHORT, TOOL_NOS_CASE_CONTROL):
        # For NOS, count stars from judgments
        stars = sum(1 for j in domain_judgments if j in ("Yes", "Star", "1", "+", "Low"))
        return nos_interpret_stars(stars)
    else:
        # Default: worst judgment
        if any(j in ("High", "Critical", "Serious") for j in domain_judgments):
            return "High"
        if any(j in ("Some concerns", "Moderate", "Unclear") for j in domain_judgments):
            return "Some concerns"
        return "Low"


# ============================================================================
# Stage Completion Check
# ============================================================================

def check_stage_completion(state: ReviewState) -> bool:
    """Check if RoB stage completion criteria are met."""
    artifacts = state.get("artifacts", {})
    rob_artifact = artifacts.get("risk_of_bias", {})
    extraction_artifact = artifacts.get("extraction", {})

    assessments = rob_artifact.get("assessments", [])
    extracted_count = len(extraction_artifact.get("extracted_studies", []))

    # Complete if all extracted studies have been assessed
    return extracted_count > 0 and len(assessments) >= extracted_count


# ============================================================================
# Main Node Implementation
# ============================================================================

async def risk_of_bias_node(state: ReviewState) -> Dict[str, Any]:
    """
    Risk of Bias assessment stage node.

    Flow:
    1. Auto-select RoB tool based on study design
    2. Present tool and domains for user confirmation
    3. LLM assesses each domain with evidence
    4. Apply deterministic overall judgment
    5. Accumulate assessments in artifact

    Args:
        state: Current workflow state

    Returns:
        State updates with AI response and RoB artifacts
    """
    language = state.get("language", "en")
    messages = state.get("messages", [])
    current_artifacts = state.get("artifacts", {})
    rob_artifact = current_artifacts.get("risk_of_bias", {})
    extraction_artifact = current_artifacts.get("extraction", {})
    rq_artifact = current_artifacts.get("research_question", {})

    logger.info("Risk of Bias node processing...")

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
            "messages": [AIMessage(content="[STAGE: Risk of Bias]\n\nPlease provide a study for Risk of Bias assessment, or type 'auto' to assess all extracted studies.")],
            "status": "waiting_for_user",
            "next_action": "Provide study or start batch assessment",
        }

    # Check for stage advancement
    advance_keywords = ["yes", "proceed", "next", "continue", "ready", "confirm", "done", "כן", "המשך", "אישור"]
    if any(kw in user_message.lower() for kw in advance_keywords) and check_stage_completion(state):
        next_stage = get_next_stage("extraction")  # extraction → synthesis is next after RoB
        # Actually, RoB is between extraction and synthesis in the workflow
        # The stage after extraction is synthesis (as per state.py stages)
        # But RoB is a sub-stage. Let's advance to synthesis.
        return {
            "current_stage": "synthesis",
            "status": "active",
            "messages": [AIMessage(content=f"[STAGE: {get_stage_display_name('synthesis', language)}]\n\nRisk of Bias assessment complete. Let's synthesize the evidence.")],
            "next_action": "Begin evidence synthesis",
        }

    # Determine study design for tool selection
    # Try to get from extraction artifact or user message
    current_design = extraction_artifact.get("current_design", "rct")

    # Check if user specified a tool override
    tool_override = None
    for tool_key in TOOL_DISPLAY_NAMES:
        if tool_key.replace("_", " ") in user_message.lower() or tool_key in user_message.lower():
            tool_override = tool_key
            break

    if tool_override:
        tool_id = tool_override
        tool_name = TOOL_DISPLAY_NAMES.get(tool_id, {}).get("en", tool_id)
    else:
        # Get review type from RQ artifact
        framework_type = rq_artifact.get("framework_type", "PICO")
        review_type = ""
        if framework_type in ("CoCoPop",):
            review_type = "prevalence"
        elif framework_type in ("PFO", "QUIPS"):
            review_type = "prognosis"
        elif framework_type in ("PIRD",):
            review_type = "diagnostic"

        tool_id, tool_name = select_rob_tool(current_design, review_type)

    domains = get_domains_for_tool(tool_id)
    extracted_studies = extraction_artifact.get("extracted_studies", [])
    existing_assessments = rob_artifact.get("assessments", [])

    rob_context = get_rob_context(
        tool_id=tool_id,
        tool_name=tool_name,
        domains=domains,
        study_design=current_design,
        total_studies=len(extracted_studies),
        assessed_count=len(existing_assessments),
    )

    try:
        stage_display = get_stage_display_name("extraction", language)
        # Note: RoB doesn't have its own stage in the state machine yet;
        # it operates within the extraction→synthesis transition
        full_system_prompt = f"{ROB_SYSTEM_PROMPT}{rob_context}"

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

        # Parse domain judgments from response
        parsed_judgments = parse_domain_judgments(ai_response, tool_id)

        if parsed_judgments:
            domain_judgment_values = [j["judgment"] for j in parsed_judgments]
            overall = compute_overall(domain_judgment_values, tool_id)

            # Build assessment record
            new_assessment = {
                "tool_id": tool_id,
                "tool_name": tool_name,
                "study_design": current_design,
                "domain_judgments": parsed_judgments,
                "overall_judgment": overall,
            }

            updated_assessments = list(existing_assessments)
            updated_assessments.append(new_assessment)

            # Append overall to AI response
            ai_response += f"\n\n---\n**Overall Judgment (computed): {overall}**"
        else:
            updated_assessments = existing_assessments

        # Update artifact
        updated_rob = {
            "assessments": updated_assessments,
            "current_tool": tool_id,
            "summary_generated": False,
        }

        updated_artifacts = {**current_artifacts, "risk_of_bias": updated_rob}

        # Check completion
        is_complete = check_stage_completion({**state, "artifacts": updated_artifacts})

        if is_complete:
            total = len(updated_assessments)
            ai_response += f"\n\n**RoB assessment complete!**\n- Studies assessed: {total}\n\nType 'proceed' to move to Evidence Synthesis."

        return {
            "messages": [AIMessage(content=f"[STAGE: Risk of Bias]\n\n{ai_response}")],
            "status": "waiting_for_user",
            "artifacts": updated_artifacts,
            "next_action": "Review assessment and proceed" if is_complete else "Provide next study or review",
        }

    except Exception as e:
        logger.error(f"Risk of Bias node error: {e}")
        error_msg = f"I encountered an error during RoB assessment: {str(e)}. Please try again."
        return {
            "messages": [AIMessage(content=error_msg)],
            "status": "error",
            "last_error": str(e),
            "errors": [str(e)],
        }
