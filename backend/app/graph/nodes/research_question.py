"""
MedAI Hub - Research Question Node
==================================

LangGraph node for the Research Question stage of systematic reviews.
Uses a two-call architecture:
  1. Conversational call (Gemini Pro) → user-facing markdown response
  2. Extraction call (Gemini Flash, structured output) → framework + FINER JSON

Responsibilities:
    1. Guide the user to formulate a precise, searchable research question
    2. Select and apply appropriate framework (PICO, CoCoPop, PEO, SPIDER, etc.)
    3. Extract framework components via structured LLM output
    4. Generate 3 question formulations (narrow, broad, clinical)
    5. Conduct real FINER assessment via LLM
    6. Manage stage completion and advancement to protocol
"""

import logging
from typing import Dict, Any, Optional, List, Literal

from pydantic import BaseModel, Field
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
# Pydantic Models for Structured Extraction
# ============================================================================

class FINERScore(BaseModel):
    """Assessment score for a single FINER criterion."""
    score: Literal["high", "medium", "low"] = Field(
        description="Quality score for this criterion"
    )
    reason: str = Field(
        description="Brief justification for the score (1-2 sentences)"
    )


class FINERAssessment(BaseModel):
    """Full FINER quality assessment of a research question."""
    F: FINERScore = Field(description="Feasible: Can this review be completed with available resources?")
    I: FINERScore = Field(description="Interesting: Is this clinically or scientifically relevant?")
    N: FINERScore = Field(description="Novel: Does this address a genuine knowledge gap?")
    E: FINERScore = Field(description="Ethical: Are there ethical concerns with this research?")
    R: FINERScore = Field(description="Relevant: Will findings impact clinical practice or policy?")
    overall: Literal["proceed", "revise", "reconsider"] = Field(
        description="Overall recommendation: proceed (all high/medium), revise (some low), reconsider (multiple low)"
    )
    suggestions: List[str] = Field(
        default_factory=list,
        description="Specific, actionable suggestions to improve the research question (max 3)"
    )


class ResearchQuestionExtraction(BaseModel):
    """Structured extraction of research question components from conversation."""
    framework_type: Optional[str] = Field(
        default=None,
        description="Selected framework (PICO, CoCoPop, SPIDER, PFO, PEO, PIRD, PCC, etc.) or null if not yet determined"
    )
    framework_components: Optional[Dict[str, str]] = Field(
        default=None,
        description="Extracted framework components as key-value pairs (e.g. {'P': 'elderly patients', 'I': 'exercise therapy', 'C': 'usual care', 'O': 'depression scores'}) or null"
    )
    question_narrow: Optional[str] = Field(
        default=None,
        description="Focused/narrow PubMed-ready research question or null if not yet formulated"
    )
    question_broad: Optional[str] = Field(
        default=None,
        description="Broad/exploratory research question formulation or null"
    )
    question_clinical: Optional[str] = Field(
        default=None,
        description="Clinical/practical question formulation or null"
    )
    finer_assessment: Optional[FINERAssessment] = Field(
        default=None,
        description="FINER quality assessment. Only provide if a complete research question with framework components has been formulated. null otherwise."
    )
    stage_ready_to_complete: bool = Field(
        default=False,
        description="True ONLY if ALL of: framework selected, components extracted, at least one question formulated, and FINER assessed"
    )


# ============================================================================
# Extraction Prompt
# ============================================================================

EXTRACTION_SYSTEM_PROMPT = """You are a systematic review methodology expert performing structured data extraction.

Analyze the conversation between a researcher and an AI assistant about formulating a systematic review research question. Extract ONLY information that has been explicitly discussed and confirmed.

CRITICAL RULES:
- Only extract data that appears in the conversation. Do NOT hallucinate or infer.
- framework_type: Only set if the assistant has explicitly recommended or the user confirmed a framework.
- framework_components: Only include components explicitly identified in the conversation.
- question formulations: Only include if the assistant generated explicit question formulations.
- finer_assessment: ONLY assess if a complete research question has been formulated with framework components. For FINER, provide genuine assessment based on the specific question - do NOT give generic scores.
- stage_ready_to_complete: True ONLY when framework + components + at least one question + FINER are ALL present and valid.

If the conversation is still in early stages (user just described a topic, no framework selected yet), return mostly null values."""


# ============================================================================
# AI Model Initialization
# ============================================================================

def get_conversational_llm() -> ChatGoogleGenerativeAI:
    """Get Gemini Pro for conversational responses (high quality)."""
    return ChatGoogleGenerativeAI(
        model=settings.GEMINI_PRO_MODEL,
        google_api_key=settings.GOOGLE_API_KEY,
        temperature=0.7,
        max_tokens=4096,
    )


def get_extraction_llm() -> ChatGoogleGenerativeAI:
    """Get Gemini Flash for structured extraction (fast, cheap)."""
    return ChatGoogleGenerativeAI(
        model=settings.GEMINI_FLASH_MODEL,
        google_api_key=settings.GOOGLE_API_KEY,
        temperature=0.1,  # Low temperature for reliable extraction
        max_tokens=2048,
    )


# ============================================================================
# Stage Completion Check
# ============================================================================

def check_stage_completion(state: ReviewState) -> bool:
    """
    Check if all criteria for stage completion are met.

    Criteria:
    1. Framework is selected
    2. Framework components are filled
    3. At least one question formulation exists
    4. FINER assessment is complete
    """
    artifacts = state.get("artifacts", {})
    rq_artifact = artifacts.get("research_question", {})

    has_framework = bool(rq_artifact.get("framework_type"))
    has_components = bool(rq_artifact.get("framework_data"))
    has_question = bool(rq_artifact.get("question_narrow") or rq_artifact.get("question_broad"))
    has_finer = bool(rq_artifact.get("finer_assessment"))

    return all([has_framework, has_components, has_question, has_finer])


# ============================================================================
# Structured Extraction
# ============================================================================

async def extract_structured_data(
    messages: List,
    existing_artifact: Dict[str, Any],
) -> Optional[ResearchQuestionExtraction]:
    """
    Extract structured research question data from the conversation.

    Uses Gemini Flash with structured output for reliable JSON extraction.
    Only runs when there are at least 2 messages (1 user + 1 assistant).
    """
    # Count meaningful messages (skip system messages)
    meaningful_count = sum(
        1 for msg in messages
        if isinstance(msg, (HumanMessage, AIMessage))
        or (hasattr(msg, 'type') and msg.type in ("human", "ai"))
    )

    if meaningful_count < 2:
        return None

    try:
        # Build conversation text for extraction
        conversation_parts = []
        for msg in messages[-20:]:  # Last 20 messages max
            if isinstance(msg, HumanMessage) or (hasattr(msg, 'type') and msg.type == "human"):
                conversation_parts.append(f"RESEARCHER: {msg.content}")
            elif isinstance(msg, AIMessage) or (hasattr(msg, 'type') and msg.type == "ai"):
                conversation_parts.append(f"ASSISTANT: {msg.content}")

        conversation_text = "\n\n".join(conversation_parts)

        # Add existing artifact context
        context = ""
        if existing_artifact:
            context = f"\n\nPreviously extracted data (update if conversation has progressed):\n"
            if existing_artifact.get("framework_type"):
                context += f"- Framework: {existing_artifact['framework_type']}\n"
            if existing_artifact.get("framework_data"):
                context += f"- Components: {existing_artifact['framework_data']}\n"

        system_instructions = f"{EXTRACTION_SYSTEM_PROMPT}{context}"

        user_request = f"""--- CONVERSATION ---
{conversation_text}
--- END CONVERSATION ---

Extract the structured data from this conversation."""

        llm = get_extraction_llm()
        structured_llm = llm.with_structured_output(ResearchQuestionExtraction)
        result = await structured_llm.ainvoke([
            SystemMessage(content=system_instructions),
            HumanMessage(content=user_request),
        ])

        return result

    except Exception as e:
        logger.warning(f"Structured extraction failed (non-fatal): {e}")
        return None


# ============================================================================
# Main Node Implementation
# ============================================================================

async def research_question_node(state: ReviewState) -> Dict[str, Any]:
    """
    Research Question stage node.

    Two-call architecture:
    1. Conversational call (Gemini Pro) → markdown response for the user
    2. Extraction call (Gemini Flash) → structured JSON for artifacts

    Args:
        state: Current workflow state

    Returns:
        State updates with AI response and structured artifacts
    """
    language = state.get("language", "en")
    messages = state.get("messages", [])
    current_artifacts = state.get("artifacts", {})
    rq_artifact = current_artifacts.get("research_question", {})
    idea_artifact = current_artifacts.get("idea", {})

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
        # Provide context-aware welcome based on whether Idea stage was completed
        if idea_artifact and idea_artifact.get("clinical_problem"):
            welcome = (
                f"Based on your refined idea about **{idea_artifact['clinical_problem']}**, "
                f"let's now formulate a precise research question using the appropriate methodology framework. "
                f"Tell me more about the specific aspects you'd like to investigate."
            )
        else:
            welcome = "Let's formulate your research question. Please describe what you'd like to investigate."
        return {
            "messages": [AIMessage(content=welcome)],
            "status": "waiting_for_user",
            "next_action": "Provide details for research question formulation"
        }

    # Check for stage advancement request
    advance_keywords = ["yes", "proceed", "next", "continue", "ready", "כן", "המשך", "הבא"]
    if any(kw in user_message.lower() for kw in advance_keywords) and check_stage_completion(state):
        next_stage = get_next_stage("research_question")
        if next_stage:
            return {
                "current_stage": next_stage,
                "status": "active",
                "messages": [AIMessage(
                    content=f"[STAGE: {get_stage_display_name(next_stage, language)}]\n\n"
                    f"Excellent! Your research question is finalized. Let's move on to building your systematic review protocol."
                )],
                "next_action": "Provide details for your protocol"
            }

    try:
        # ── Call 1: Conversational Response (Gemini Pro) ──
        stage_display = get_stage_display_name("research_question", language)

        # Build context from Idea stage artifact (handoff from previous stage)
        idea_context = ""
        if idea_artifact:
            idea_context = "\n\n[CONTEXT FROM IDEA STAGE — DO NOT RE-ASK THESE]\n"
            if idea_artifact.get("clinical_problem"):
                idea_context += f"Clinical problem: {idea_artifact['clinical_problem']}\n"
            if idea_artifact.get("review_type"):
                idea_context += f"Review type determined: {idea_artifact['review_type']}\n"
            if idea_artifact.get("population_sketch"):
                idea_context += f"Population (rough sketch): {idea_artifact['population_sketch']}\n"
            if idea_artifact.get("intervention_sketch"):
                idea_context += f"Intervention/Exposure (rough sketch): {idea_artifact['intervention_sketch']}\n"
            if idea_artifact.get("outcome_sketch"):
                idea_context += f"Outcomes (rough sketch): {idea_artifact['outcome_sketch']}\n"
            if idea_artifact.get("study_designs"):
                idea_context += f"Study designs to consider: {', '.join(idea_artifact['study_designs'])}\n"
            if idea_artifact.get("existing_reviews_notes"):
                idea_context += f"Existing reviews notes: {idea_artifact['existing_reviews_notes']}\n"
            idea_context += "\nUse this context to select the appropriate framework and refine components. Do NOT re-ask about the research topic, review type, or population — build on what is already established.\n"

        # Build context from existing RQ artifact (current stage progress)
        rq_context = ""
        if rq_artifact:
            rq_context = f"\n\n[CURRENT PROGRESS]\nFramework: {rq_artifact.get('framework_type', 'Not selected')}\n"
            if rq_artifact.get("framework_data"):
                rq_context += "Components extracted:\n"
                for key, value in rq_artifact["framework_data"].items():
                    rq_context += f"- {key}: {value}\n"
            if rq_artifact.get("question_narrow"):
                rq_context += f"Narrow question: {rq_artifact['question_narrow']}\n"
            if rq_artifact.get("question_broad"):
                rq_context += f"Broad question: {rq_artifact['question_broad']}\n"

        full_system_prompt = f"{RESEARCH_QUESTION_SYSTEM_PROMPT}{idea_context}{rq_context}"

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

        llm = get_conversational_llm()
        response = await llm.ainvoke(llm_messages)
        ai_response = response.content

        # ── Call 2: Structured Extraction (Gemini Flash) ──
        # Include the new AI response in messages for extraction
        all_messages_for_extraction = list(messages) + [
            HumanMessage(content=user_message),
            AIMessage(content=ai_response),
        ]
        extraction = await extract_structured_data(all_messages_for_extraction, rq_artifact)

        # ── Merge extraction into artifacts ──
        updated_artifact: ResearchQuestionArtifact = {
            "framework_type": rq_artifact.get("framework_type", ""),
            "framework_data": rq_artifact.get("framework_data", {}),
            "question_narrow": rq_artifact.get("question_narrow", ""),
            "question_broad": rq_artifact.get("question_broad", ""),
            "question_clinical": rq_artifact.get("question_clinical", ""),
        }

        if extraction:
            if extraction.framework_type:
                updated_artifact["framework_type"] = extraction.framework_type
            if extraction.framework_components:
                # Merge: new values override old ones
                existing = updated_artifact.get("framework_data", {})
                updated_artifact["framework_data"] = {**existing, **extraction.framework_components}
            if extraction.question_narrow:
                updated_artifact["question_narrow"] = extraction.question_narrow
            if extraction.question_broad:
                updated_artifact["question_broad"] = extraction.question_broad
            if extraction.question_clinical:
                updated_artifact["question_clinical"] = extraction.question_clinical
            if extraction.finer_assessment:
                updated_artifact["finer_assessment"] = extraction.finer_assessment.model_dump()

        # Update artifacts in state
        updated_artifacts = {**current_artifacts, "research_question": updated_artifact}

        # Check if stage is complete
        is_complete = check_stage_completion({**state, "artifacts": updated_artifacts})

        if is_complete:
            completion_msg = (
                "\n\n---\n\n"
                "**Stage Complete!** Your research question is formulated.\n\n"
                "Are you ready to proceed to the **Protocol** stage? (Type 'yes' or 'proceed')"
            )
            ai_response += completion_msg

        return {
            "messages": [AIMessage(content=f"[STAGE: {stage_display}]\n\n{ai_response}")],
            "status": "waiting_for_user",
            "artifacts": updated_artifacts,
            "next_action": (
                "Refine your research question or proceed to the next stage"
                if is_complete
                else "Continue describing your research topic"
            ),
        }

    except Exception as e:
        logger.error(f"Research Question node error: {e}", exc_info=True)
        error_msg = f"I encountered an error while processing your research question: {str(e)}. Please try again."
        return {
            "messages": [AIMessage(content=error_msg)],
            "status": "error",
            "last_error": str(e),
            "errors": [str(e)],
        }
