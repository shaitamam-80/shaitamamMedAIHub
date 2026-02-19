"""
MedAI Hub - Research Question Node
==================================

LangGraph node for the Research Question stage of systematic reviews.
This node helps researchers formulate precise, searchable research questions
using appropriate frameworks (PICO, CoCoPop, PEO, SPIDER, etc.).

Responsibilities:
    1. Analyze user input to identify question type
    2. Select and apply appropriate framework
    3. Extract framework components
    4. Generate 3 question formulations (narrow, broad, alternative)
    5. Conduct FINER assessment
    6. Manage stage completion and advancement
"""

import logging
import json
import re
from typing import Dict, Any, Optional, List

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from app.graph.state import (
    ReviewState,
    ResearchQuestionArtifact,
    get_next_stage,
    get_stage_display_name,
)
from sr_skills.prompts.research_question import (
    RESEARCH_QUESTION_SYSTEM_PROMPT,
    FRAMEWORK_DEFINITIONS,
    FINER_CRITERIA,
    get_framework_definition,
)
from app.core.config import settings

logger = logging.getLogger(__name__)


# ============================================================================
# AI Model Initialization
# ============================================================================

def get_llm() -> ChatGoogleGenerativeAI:
    """Get the Gemini LLM instance for research question formulation."""
    return ChatGoogleGenerativeAI(
        model=settings.GEMINI_FLASH_MODEL,
        google_api_key=settings.GOOGLE_API_KEY,
        temperature=0.7,
        max_tokens=4096,
    )


# ============================================================================
# Framework Detection Logic
# ============================================================================

QUESTION_TYPE_TRIGGERS = {
    "effectiveness": {
        "triggers": ["does it work", "comparison", "more effective", "better than", "efficacy", "treatment", "therapy"],
        "framework": "PICO"
    },
    "prevalence": {
        "triggers": ["how many", "what percentage", "prevalence", "incidence", "rate", "frequency", "proportion"],
        "framework": "CoCoPop"
    },
    "prognosis": {
        "triggers": ["predicts", "prognostic factor", "recovery", "course of illness", "outcome", "prognosis"],
        "framework": "PFO"
    },
    "etiology": {
        "triggers": ["causes", "risk factor", "exposure", "associated with", "leads to", "etiology"],
        "framework": "PEO"
    },
    "diagnostic": {
        "triggers": ["accuracy", "sensitivity", "specificity", "diagnostic", "test", "screening"],
        "framework": "PIRD"
    },
    "qualitative": {
        "triggers": ["experience", "perception", "feels like", "lived experience", "meaning", "perspective"],
        "framework": "SPIDER"
    },
    "scoping": {
        "triggers": ["map out", "what exists", "broad overview", "scope", "mapping"],
        "framework": "PCC"
    }
}


def detect_question_type(user_input: str) -> tuple[str, str]:
    """
    Detect question type from user input using trigger words.

    Args:
        user_input: The user's research question or topic description

    Returns:
        Tuple of (question_type, recommended_framework)
    """
    user_lower = user_input.lower()

    for question_type, config in QUESTION_TYPE_TRIGGERS.items():
        for trigger in config["triggers"]:
            if trigger in user_lower:
                return question_type, config["framework"]

    # Default to PICO for intervention questions
    return "effectiveness", "PICO"


def extract_framework_components(
    user_input: str,
    framework: str,
    llm_response: str
) -> Dict[str, str]:
    """
    Extract framework components from the AI response.

    This is a simplified extraction - in production, we'd use
    structured output from the LLM.
    """
    framework_def = get_framework_definition(framework)
    if not framework_def:
        return {}

    components = {}
    labels = framework_def.get("labels", {})

    # Try to extract components from LLM response
    for key, label in labels.items():
        # Look for patterns like "**P (Population):** elderly patients"
        pattern = rf"\*\*{key}[^:]*:\*\*\s*([^\n*]+)"
        match = re.search(pattern, llm_response, re.IGNORECASE)
        if match:
            components[key] = match.group(1).strip()

    return components


def assess_finer(framework_data: Dict[str, str], question: str) -> Dict[str, Any]:
    """
    Perform qualitative FINER assessment.

    Returns qualitative scores (high/medium/low) with reasoning.
    """
    # This is a simplified assessment - in production, the LLM would provide this
    finer = {
        "F": {"score": "high", "reason": "Systematic review methodology is well-established and feasible."},
        "I": {"score": "high", "reason": "Topic is of current interest to researchers and clinicians."},
        "N": {"score": "medium", "reason": "Should check for recent systematic reviews on this topic."},
        "E": {"score": "high", "reason": "Secondary research using published studies raises no ethical concerns."},
        "R": {"score": "high", "reason": "Findings could inform clinical practice and policy."},
        "overall": "proceed",
        "suggestions": [
            "Verify no recent systematic reviews exist on this exact topic",
            "Consider adding specific timeframe for outcomes"
        ]
    }
    return finer


def check_stage_completion(state: ReviewState) -> bool:
    """
    Check if all criteria for stage completion are met.

    Criteria:
    1. Framework is selected
    2. All required components are filled
    3. At least one question formulation exists
    4. FINER assessment is complete
    """
    artifacts = state.get("artifacts", {})
    rq_artifact = artifacts.get("research_question", {})

    # Check required elements
    has_framework = bool(rq_artifact.get("framework_type"))
    has_components = bool(rq_artifact.get("framework_data"))
    has_question = bool(rq_artifact.get("question_narrow") or rq_artifact.get("question_broad"))
    has_finer = bool(rq_artifact.get("finer_assessment"))

    return all([has_framework, has_components, has_question, has_finer])


# ============================================================================
# Main Node Implementation
# ============================================================================

async def research_question_node(state: ReviewState) -> Dict[str, Any]:
    """
    Research Question stage node.

    This node:
    1. Analyzes user input to detect question type and framework
    2. Guides framework component extraction
    3. Generates 3 question formulations
    4. Conducts FINER assessment
    5. Manages stage completion and transition

    Args:
        state: Current workflow state

    Returns:
        State updates with AI response and artifacts
    """
    language = state.get("language", "en")
    messages = state.get("messages", [])
    current_artifacts = state.get("artifacts", {})
    rq_artifact = current_artifacts.get("research_question", {})

    logger.info("Research Question node processing...")

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
            "messages": [AIMessage(content="Please describe your research question or topic.")],
            "status": "waiting_for_user",
            "next_action": "Describe your research topic or question"
        }

    # Check for stage advancement request
    advance_keywords = ["yes", "proceed", "next", "continue", "ready", "כן", "המשך"]
    if any(kw in user_message.lower() for kw in advance_keywords) and check_stage_completion(state):
        next_stage = get_next_stage("research_question")
        if next_stage:
            return {
                "current_stage": next_stage,
                "status": "active",
                "messages": [AIMessage(content=f"[STAGE: {get_stage_display_name(next_stage, language)}]\n\nExcellent! Let's move on to building your systematic review protocol.")],
                "next_action": "Provide details for your protocol"
            }

    # Detect question type and framework
    detected_type, detected_framework = detect_question_type(user_message)

    # Use existing framework if already selected, otherwise use detected
    framework = rq_artifact.get("framework_type", detected_framework)

    try:
        # Build context-aware system prompt
        stage_display = get_stage_display_name("research_question", language)

        # Add existing artifact context if available
        context_section = ""
        if rq_artifact:
            context_section = f"\n\n[CURRENT PROGRESS]\nFramework: {rq_artifact.get('framework_type', 'Not selected')}\n"
            if rq_artifact.get("framework_data"):
                context_section += "Components extracted:\n"
                for key, value in rq_artifact["framework_data"].items():
                    context_section += f"- {key}: {value}\n"

        full_system_prompt = f"{RESEARCH_QUESTION_SYSTEM_PROMPT}{context_section}"

        # Build message list for LLM
        llm_messages = [SystemMessage(content=full_system_prompt)]

        # Add conversation history (last 10 messages to avoid context overflow)
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

        # Extract framework components from response
        extracted_components = extract_framework_components(user_message, framework, ai_response)

        # Merge with existing components
        existing_components = rq_artifact.get("framework_data", {})
        merged_components = {**existing_components, **extracted_components}

        # Extract question formulations from response if present
        question_narrow = rq_artifact.get("question_narrow", "")
        question_broad = rq_artifact.get("question_broad", "")
        question_clinical = rq_artifact.get("question_clinical", "")

        # Simple extraction of formulations from response
        if "Focused Formulation" in ai_response and not question_narrow:
            match = re.search(r"Focused Formulation[^:]*:\s*([^\n]+)", ai_response)
            if match:
                question_narrow = match.group(1).strip()

        if "Broad Formulation" in ai_response and not question_broad:
            match = re.search(r"Broad Formulation[^:]*:\s*([^\n]+)", ai_response)
            if match:
                question_broad = match.group(1).strip()

        # Build updated artifact
        updated_artifact: ResearchQuestionArtifact = {
            "framework_type": framework,
            "framework_data": merged_components,
            "question_narrow": question_narrow,
            "question_broad": question_broad,
            "question_clinical": question_clinical,
        }

        # Perform FINER if we have enough data
        if merged_components and (question_narrow or question_broad):
            finer = assess_finer(merged_components, question_narrow or question_broad)
            updated_artifact["finer_assessment"] = finer

        # Update artifacts in state
        updated_artifacts = {**current_artifacts, "research_question": updated_artifact}

        # Check if stage is complete
        is_complete = check_stage_completion({**state, "artifacts": updated_artifacts})

        if is_complete:
            completion_msg = "\n\n---\n\n✅ **Stage Complete!** Your research question is formulated.\n\nAre you ready to proceed to the **Protocol** stage? (Type 'yes' or 'proceed')"
            ai_response += completion_msg

        return {
            "messages": [AIMessage(content=f"[STAGE: {stage_display}]\n\n{ai_response}")],
            "status": "waiting_for_user",
            "artifacts": updated_artifacts,
            "next_action": "Refine your research question or proceed to the next stage" if is_complete else "Continue describing your research topic"
        }

    except Exception as e:
        logger.error(f"Research Question node error: {e}")
        error_msg = f"I encountered an error while processing your research question: {str(e)}. Please try again."
        return {
            "messages": [AIMessage(content=error_msg)],
            "status": "error",
            "last_error": str(e),
            "errors": [str(e)]
        }
