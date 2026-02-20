"""
MedAI Hub - Idea Node
=====================

LangGraph node for the Idea stage of systematic reviews.
Acts as an expert research librarian who helps the researcher:
  1. Clarify and refine their research idea
  2. Check if similar reviews already exist (PROSPERO, Cochrane, JBI)
  3. Determine the appropriate review type (systematic vs scoping)
  4. Sketch initial population, intervention/exposure, outcomes
  5. Assess feasibility and timeline
  6. Decide: proceed, refine, or pivot

Uses a two-call architecture:
  1. Conversational call (Gemini Pro) -> user-facing markdown response
  2. Extraction call (Gemini Flash, structured output) -> IdeaArtifact JSON

Boundary with Research Question stage:
  - Idea = "What are we studying?" (domain expertise)
  - Research Question = "How do we formulate it methodologically?" (framework, FINER)
  - Idea does NOT select frameworks or formulate precise questions
"""

import logging
from typing import Dict, Any, Optional, List, Literal

from pydantic import BaseModel, Field
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from app.graph.state import (
    ReviewState,
    IdeaArtifact,
    get_next_stage,
    get_stage_display_name,
)
from sr_skills.prompts.idea import (
    IDEA_SYSTEM_PROMPT,
    IDEA_EXTRACTION_PROMPT,
)
from app.core.config import settings

logger = logging.getLogger(__name__)


# ============================================================================
# Pydantic Models for Structured Extraction
# ============================================================================

class IdeaExtraction(BaseModel):
    """Structured extraction of idea stage data from conversation."""
    clinical_problem: Optional[str] = Field(
        default=None,
        description="The core clinical or research problem described. null if not yet discussed."
    )
    review_type: Optional[str] = Field(
        default=None,
        description="Review type if determined: systematic_intervention, systematic_prevalence, systematic_prognosis, systematic_diagnostic, systematic_qualitative, scoping. null if not yet decided."
    )
    population_sketch: Optional[str] = Field(
        default=None,
        description="Initial rough population description (e.g., 'women over 18 with diabetes'). null if not discussed."
    )
    intervention_sketch: Optional[str] = Field(
        default=None,
        description="Intervention, exposure, or concept being studied. null if not discussed."
    )
    outcome_sketch: Optional[str] = Field(
        default=None,
        description="Expected outcomes or context. null if not discussed."
    )
    study_designs: Optional[List[str]] = Field(
        default=None,
        description="Study designs to include (e.g., ['RCT', 'cohort', 'cross-sectional']). null if not discussed."
    )
    existing_reviews_checked: bool = Field(
        default=False,
        description="True if user confirmed they checked PROSPERO/Cochrane/JBI or discussed existing reviews."
    )
    existing_reviews_notes: Optional[str] = Field(
        default=None,
        description="Notes about existing reviews found or gaps identified. null if not discussed."
    )
    timeline: Optional[str] = Field(
        default=None,
        description="User's timeline or deadline for the project. null if not discussed."
    )
    feasibility_notes: Optional[str] = Field(
        default=None,
        description="Notes on feasibility, scope concerns, or adjustments suggested. null if not discussed."
    )
    recommendation: Optional[Literal["proceed", "refine", "pivot"]] = Field(
        default=None,
        description="Current recommendation: proceed (idea is ready), refine (needs narrowing/clarification), pivot (major change needed). null if too early to tell."
    )
    stage_ready_to_complete: bool = Field(
        default=False,
        description="True ONLY if ALL: clinical problem clear, review type determined, population/concept sketched, existing reviews discussed, and feasibility considered."
    )




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
        temperature=0.1,
        max_tokens=2048,
    )


# ============================================================================
# Stage Completion Check
# ============================================================================

def check_stage_completion(state: ReviewState) -> bool:
    """
    Check if all criteria for idea stage completion are met.

    Criteria:
    1. Clinical problem is described
    2. Review type is determined
    3. Population or concept is sketched
    4. Existing reviews have been discussed
    """
    artifacts = state.get("artifacts", {})
    idea_artifact = artifacts.get("idea", {})

    has_problem = bool(idea_artifact.get("clinical_problem"))
    has_review_type = bool(idea_artifact.get("review_type"))
    has_population = bool(
        idea_artifact.get("population_sketch")
        or idea_artifact.get("intervention_sketch")
    )
    has_existing_check = idea_artifact.get("existing_reviews_checked", False)

    return all([has_problem, has_review_type, has_population, has_existing_check])


# ============================================================================
# Structured Extraction
# ============================================================================

async def extract_structured_data(
    messages: list,
    existing_artifact: Dict[str, Any],
) -> Optional[IdeaExtraction]:
    """
    Extract structured idea data from the conversation.

    Uses Gemini Flash with structured output. Only runs when there
    are at least 2 meaningful messages.
    """
    meaningful_count = sum(
        1 for msg in messages
        if isinstance(msg, (HumanMessage, AIMessage))
        or (hasattr(msg, 'type') and msg.type in ("human", "ai"))
    )

    if meaningful_count < 2:
        return None

    try:
        conversation_parts = []
        for msg in messages[-20:]:
            if isinstance(msg, HumanMessage) or (hasattr(msg, 'type') and msg.type == "human"):
                conversation_parts.append(f"RESEARCHER: {msg.content}")
            elif isinstance(msg, AIMessage) or (hasattr(msg, 'type') and msg.type == "ai"):
                conversation_parts.append(f"LIBRARIAN: {msg.content}")

        conversation_text = "\n\n".join(conversation_parts)

        context = ""
        if existing_artifact:
            context = "\n\nPreviously extracted data (update if conversation has progressed):\n"
            if existing_artifact.get("clinical_problem"):
                context += f"- Problem: {existing_artifact['clinical_problem']}\n"
            if existing_artifact.get("review_type"):
                context += f"- Review type: {existing_artifact['review_type']}\n"
            if existing_artifact.get("population_sketch"):
                context += f"- Population: {existing_artifact['population_sketch']}\n"

        system_instructions = f"{IDEA_EXTRACTION_PROMPT}{context}"

        user_request = f"""--- CONVERSATION ---
{conversation_text}
--- END CONVERSATION ---

Extract the structured data from this conversation."""

        llm = get_extraction_llm()
        structured_llm = llm.with_structured_output(IdeaExtraction)
        result = await structured_llm.ainvoke([
            SystemMessage(content=system_instructions),
            HumanMessage(content=user_request),
        ])

        return result

    except Exception as e:
        logger.warning(f"Idea extraction failed (non-fatal): {e}")
        return None


# ============================================================================
# Main Node Implementation
# ============================================================================

async def idea_node(state: ReviewState) -> Dict[str, Any]:
    """
    Idea stage node — Expert Research Librarian.

    Two-call architecture:
    1. Conversational call (Gemini Pro) -> markdown response for the user
    2. Extraction call (Gemini Flash) -> structured JSON for artifacts

    Args:
        state: Current workflow state

    Returns:
        State updates with AI response and structured artifacts
    """
    language = state.get("language", "en")
    messages = state.get("messages", [])
    current_artifacts = state.get("artifacts", {})
    idea_artifact = current_artifacts.get("idea", {})

    logger.info("Idea node processing...")

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
            "messages": [AIMessage(content="Please describe your research idea or topic.")],
            "status": "waiting_for_user",
            "next_action": "Describe your research idea",
        }

    # Check for stage advancement request
    advance_keywords = ["yes", "proceed", "next", "continue", "ready", "כן", "המשך", "הבא", "מוכן"]
    if any(kw in user_message.lower() for kw in advance_keywords) and check_stage_completion(state):
        next_stage = get_next_stage("idea")
        if next_stage:
            return {
                "current_stage": next_stage,
                "status": "active",
                "messages": [AIMessage(
                    content=f"[STAGE: {get_stage_display_name(next_stage, language)}]\n\n"
                    f"Your research idea is well-defined. Let's move on to formulating "
                    f"your research question using the appropriate methodology framework."
                )],
                "next_action": "Describe your research question for framework selection",
            }

    try:
        # ── Call 1: Conversational Response (Gemini Pro) ──
        stage_display = get_stage_display_name("idea", language)

        # Build context from existing artifact
        context_section = ""
        if idea_artifact:
            context_section = "\n\n[CURRENT PROGRESS]\n"
            if idea_artifact.get("clinical_problem"):
                context_section += f"Problem: {idea_artifact['clinical_problem']}\n"
            if idea_artifact.get("review_type"):
                context_section += f"Review type: {idea_artifact['review_type']}\n"
            if idea_artifact.get("population_sketch"):
                context_section += f"Population: {idea_artifact['population_sketch']}\n"
            if idea_artifact.get("intervention_sketch"):
                context_section += f"Intervention/Concept: {idea_artifact['intervention_sketch']}\n"
            if idea_artifact.get("existing_reviews_checked"):
                context_section += "Existing reviews: Checked\n"
            if idea_artifact.get("timeline"):
                context_section += f"Timeline: {idea_artifact['timeline']}\n"

        full_system_prompt = f"{IDEA_SYSTEM_PROMPT}{context_section}"

        # Build message list for LLM
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

        llm = get_conversational_llm()
        response = await llm.ainvoke(llm_messages)
        ai_response = response.content

        # ── Call 2: Structured Extraction (Gemini Flash) ──
        all_messages_for_extraction = list(messages) + [
            HumanMessage(content=user_message),
            AIMessage(content=ai_response),
        ]
        extraction = await extract_structured_data(all_messages_for_extraction, idea_artifact)

        # ── Merge extraction into artifacts ──
        updated_artifact: IdeaArtifact = {
            "clinical_problem": idea_artifact.get("clinical_problem", ""),
            "review_type": idea_artifact.get("review_type", ""),
            "population_sketch": idea_artifact.get("population_sketch", ""),
            "intervention_sketch": idea_artifact.get("intervention_sketch", ""),
            "outcome_sketch": idea_artifact.get("outcome_sketch", ""),
            "study_designs": idea_artifact.get("study_designs", []),
            "existing_reviews_checked": idea_artifact.get("existing_reviews_checked", False),
            "existing_reviews_notes": idea_artifact.get("existing_reviews_notes", ""),
            "timeline": idea_artifact.get("timeline", ""),
            "feasibility_notes": idea_artifact.get("feasibility_notes", ""),
            "recommendation": idea_artifact.get("recommendation", ""),
        }

        if extraction:
            if extraction.clinical_problem:
                updated_artifact["clinical_problem"] = extraction.clinical_problem
            if extraction.review_type:
                updated_artifact["review_type"] = extraction.review_type
            if extraction.population_sketch:
                updated_artifact["population_sketch"] = extraction.population_sketch
            if extraction.intervention_sketch:
                updated_artifact["intervention_sketch"] = extraction.intervention_sketch
            if extraction.outcome_sketch:
                updated_artifact["outcome_sketch"] = extraction.outcome_sketch
            if extraction.study_designs:
                updated_artifact["study_designs"] = extraction.study_designs
            if extraction.existing_reviews_checked:
                updated_artifact["existing_reviews_checked"] = True
            if extraction.existing_reviews_notes:
                updated_artifact["existing_reviews_notes"] = extraction.existing_reviews_notes
            if extraction.timeline:
                updated_artifact["timeline"] = extraction.timeline
            if extraction.feasibility_notes:
                updated_artifact["feasibility_notes"] = extraction.feasibility_notes
            if extraction.recommendation:
                updated_artifact["recommendation"] = extraction.recommendation

        # Update artifacts in state
        updated_artifacts = {**current_artifacts, "idea": updated_artifact}

        # Check if stage is complete
        is_complete = check_stage_completion({**state, "artifacts": updated_artifacts})

        if is_complete:
            completion_msg = (
                "\n\n---\n\n"
                "**Stage Complete!** Your research idea is well-defined.\n\n"
                "Are you ready to proceed to the **Research Question** stage? "
                "(Type 'yes' or 'proceed')"
            )
            ai_response += completion_msg

        return {
            "messages": [AIMessage(content=f"[STAGE: {stage_display}]\n\n{ai_response}")],
            "status": "waiting_for_user",
            "artifacts": updated_artifacts,
            "next_action": (
                "Proceed to Research Question stage or refine your idea"
                if is_complete
                else "Continue describing your research idea"
            ),
        }

    except Exception as e:
        logger.error(f"Idea node error: {e}", exc_info=True)
        error_msg = f"I encountered an error while processing your idea: {str(e)}. Please try again."
        return {
            "messages": [AIMessage(content=error_msg)],
            "status": "error",
            "last_error": str(e),
            "errors": [str(e)],
        }
