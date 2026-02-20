"""
MedAI Hub - Protocol Builder Node
=================================

LangGraph node for the Protocol stage of systematic reviews.
Uses a two-call architecture:
  1. Conversational call (Gemini Pro) -> user-facing markdown response
  2. Extraction call (Gemini Flash, structured output) -> structured JSON artifact

Responsibilities:
    1. Build PROSPERO-ready protocols (PRISMA-P / PRISMA-ScR compliant)
    2. Define eligibility criteria (inclusion/exclusion)
    3. Specify information sources and search strategy
    4. Outline study selection, data extraction, and RoB assessment
    5. Plan data synthesis approach
    6. Offer MedAI Hub AI toolkit with academic formulations
    7. Generate PROSPERO-formatted protocol document

Boundary with Research Question stage:
    - Research Question = framework + components + FINER (already done)
    - Protocol = eligibility, databases, RoB, synthesis, PROSPERO fields
    - Protocol reads RQ and Idea artifacts as context, does NOT re-ask about them
"""

import logging
from typing import Dict, Any, Optional, List, Literal

from pydantic import BaseModel, Field
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from app.graph.state import (
    ReviewState,
    ProtocolArtifact,
    ResearchQuestionArtifact,
    IdeaArtifact,
    get_next_stage,
    get_stage_display_name,
)
from sr_skills.prompts.protocol import (
    PROTOCOL_BUILDER_SYSTEM_PROMPT,
    PROTOCOL_EXTRACTION_PROMPT,
    MEDAI_TOOLKIT_DECLARATIONS,
    SCOPING_REVIEW_GUIDANCE,
    get_toolkit_declaration,
)
from app.core.config import settings

logger = logging.getLogger(__name__)

# Scalable language name mapping for prompt injection
LANGUAGE_NAMES = {
    "en": "English",
    "he": "Hebrew",
    "ar": "Arabic",
    "es": "Spanish",
    "fr": "French",
}


# ============================================================================
# Pydantic Models for Structured Extraction
# ============================================================================

class EligibilityCriteria(BaseModel):
    """Structured eligibility criteria for the protocol."""
    population_inclusion: Optional[List[str]] = Field(
        default=None,
        description="Population inclusion criteria. null if not yet discussed."
    )
    population_exclusion: Optional[List[str]] = Field(
        default=None,
        description="Population exclusion criteria. null if not yet discussed."
    )
    intervention_inclusion: Optional[List[str]] = Field(
        default=None,
        description="Intervention/exposure inclusion criteria. null if not yet discussed."
    )
    intervention_exclusion: Optional[List[str]] = Field(
        default=None,
        description="Intervention/exposure exclusion criteria. null if not yet discussed."
    )
    comparator_inclusion: Optional[List[str]] = Field(
        default=None,
        description="Comparator/control inclusion criteria. null if not yet discussed."
    )
    comparator_exclusion: Optional[List[str]] = Field(
        default=None,
        description="Comparator/control exclusion criteria. null if not yet discussed."
    )
    outcomes_primary: Optional[List[str]] = Field(
        default=None,
        description="Primary outcomes specified. null if not yet discussed."
    )
    outcomes_secondary: Optional[List[str]] = Field(
        default=None,
        description="Secondary outcomes specified. null if not yet discussed."
    )
    study_designs_included: Optional[List[str]] = Field(
        default=None,
        description="Study designs to include (e.g., ['RCTs', 'Cohort studies']). null if not discussed."
    )
    time_frame: Optional[str] = Field(
        default=None,
        description="Publication date limits or follow-up time frame. null if not discussed."
    )
    language_restrictions: Optional[str] = Field(
        default=None,
        description="Language restrictions (e.g., 'English only' or 'No restriction'). null if not discussed."
    )
    setting: Optional[str] = Field(
        default=None,
        description="Geographic or clinical setting restrictions. null if not discussed."
    )


class ProtocolExtraction(BaseModel):
    """Structured extraction of protocol metadata from conversation."""
    review_type: Optional[str] = Field(
        default=None,
        description="Review type: systematic_intervention, systematic_prevalence, systematic_prognosis, systematic_diagnostic, systematic_qualitative, scoping. null if not determined."
    )
    registration_platform: Optional[str] = Field(
        default=None,
        description="Registration platform: PROSPERO, OSF, INPLASY. null if not discussed."
    )
    eligibility_criteria: Optional[EligibilityCriteria] = Field(
        default=None,
        description="Structured eligibility criteria. Only include components explicitly discussed."
    )
    information_sources: Optional[List[str]] = Field(
        default=None,
        description="Databases and sources to search (e.g., ['PubMed/MEDLINE', 'Embase', 'CENTRAL']). null if not discussed."
    )
    rob_tool: Optional[str] = Field(
        default=None,
        description="Selected Risk of Bias tool (e.g., 'RoB 2.0', 'ROBINS-I', 'NOS', 'JBI-Prevalence', 'QUADAS-2', 'QUIPS'). null if not discussed."
    )
    rob_domains: Optional[List[str]] = Field(
        default=None,
        description="RoB domains to assess. null if not discussed."
    )
    synthesis_method: Optional[str] = Field(
        default=None,
        description="Data synthesis approach: 'meta-analysis', 'narrative', 'meta-aggregation', 'mixed'. null if not discussed."
    )
    effect_measure: Optional[str] = Field(
        default=None,
        description="Planned effect measure (RR, OR, MD, SMD, HR). null if not discussed or not applicable."
    )
    completed_sections: Optional[List[str]] = Field(
        default=None,
        description="Protocol sections substantively addressed. Valid keys: title, registration, eligibility_population, eligibility_intervention, eligibility_outcomes, eligibility_study_designs, information_sources, search_strategy, study_selection, data_extraction, risk_of_bias, data_synthesis, grade."
    )
    approved_tools: Optional[List[str]] = Field(
        default=None,
        description="MedAI Hub tools the researcher explicitly approved. Valid keys: search_assistant, screening_engine, extraction_engine, rob_assessor, grade_evaluator, audit_assistant. null if not offered or not discussed."
    )
    stage_ready_to_complete: bool = Field(
        default=False,
        description="True ONLY when ALL required sections are substantively addressed AND user confirms protocol is ready."
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

REQUIRED_SECTIONS = [
    "eligibility_population",
    "eligibility_intervention",
    "eligibility_outcomes",
    "information_sources",
    "study_selection",
    "data_extraction",
    "risk_of_bias",
    "data_synthesis",
]


def check_stage_completion(state: ReviewState) -> bool:
    """
    Check if all criteria for protocol stage completion are met.

    Uses extraction-based completed_sections when available,
    falls back to artifact field checks.
    """
    artifacts = state.get("artifacts", {})
    protocol_artifact = artifacts.get("protocol", {})

    completed = protocol_artifact.get("completed_sections", [])
    if completed:
        missing = [s for s in REQUIRED_SECTIONS if s not in completed]
        return len(missing) <= 1  # Allow 1 missing for flexibility

    # Fallback: check artifact fields directly
    has_eligibility = bool(protocol_artifact.get("eligibility_criteria"))
    has_protocol_text = bool(protocol_artifact.get("protocol_text"))
    has_info_sources = bool(protocol_artifact.get("information_sources"))
    has_rob = bool(protocol_artifact.get("rob_tool"))

    return all([has_eligibility, has_protocol_text, has_info_sources, has_rob])


# ============================================================================
# Structured Extraction
# ============================================================================

async def extract_structured_data(
    messages: list,
    existing_artifact: Dict[str, Any],
) -> Optional[ProtocolExtraction]:
    """
    Extract structured protocol data from the conversation.

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
                conversation_parts.append(f"PROTOCOL ARCHITECT: {msg.content}")

        conversation_text = "\n\n".join(conversation_parts)

        context = ""
        if existing_artifact:
            context = "\n\nPreviously extracted data (update if conversation has progressed):\n"
            if existing_artifact.get("review_type"):
                context += f"- Review type: {existing_artifact['review_type']}\n"
            if existing_artifact.get("information_sources"):
                context += f"- Databases: {', '.join(existing_artifact['information_sources'])}\n"
            if existing_artifact.get("rob_tool"):
                context += f"- RoB tool: {existing_artifact['rob_tool']}\n"
            if existing_artifact.get("completed_sections"):
                context += f"- Completed sections: {', '.join(existing_artifact['completed_sections'])}\n"
            if existing_artifact.get("approved_tools"):
                context += f"- Approved MedAI tools: {', '.join(existing_artifact['approved_tools'])}\n"

        system_instructions = f"{PROTOCOL_EXTRACTION_PROMPT}{context}"

        user_request = f"""--- CONVERSATION ---
{conversation_text}
--- END CONVERSATION ---

Extract the structured data from this conversation."""

        llm = get_extraction_llm()
        structured_llm = llm.with_structured_output(ProtocolExtraction)
        result = await structured_llm.ainvoke([
            SystemMessage(content=system_instructions),
            HumanMessage(content=user_request),
        ])

        return result

    except Exception as e:
        logger.warning(f"Protocol extraction failed (non-fatal): {e}")
        return None


# ============================================================================
# Main Node Implementation
# ============================================================================

async def protocol_builder_node(state: ReviewState) -> Dict[str, Any]:
    """
    Protocol Builder stage node.

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
    protocol_artifact = current_artifacts.get("protocol", {})
    rq_artifact = current_artifacts.get("research_question", {})
    idea_artifact = current_artifacts.get("idea", {})

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

    if not user_message:
        # Context-aware welcome based on available artifacts
        if rq_artifact and rq_artifact.get("question_narrow"):
            welcome = (
                f"Based on your research question: **{rq_artifact['question_narrow']}**, "
                f"let's build a PROSPERO-ready protocol. I'll guide you through "
                f"eligibility criteria, search strategy, and all required sections."
            )
        elif idea_artifact and idea_artifact.get("clinical_problem"):
            welcome = (
                f"Based on your research idea about **{idea_artifact['clinical_problem']}**, "
                f"let's build your systematic review protocol."
            )
        else:
            welcome = (
                "Let's build your systematic review protocol. "
                "Please describe your review topic so we can define the key protocol elements."
            )
        return {
            "messages": [AIMessage(content=welcome)],
            "status": "waiting_for_user",
            "next_action": "Provide details for your protocol",
        }

    # Check for stage advancement request
    advance_keywords = ["yes", "proceed", "next", "continue", "ready", "כן", "המשך", "הבא", "מוכן"]
    if any(kw in user_message.lower() for kw in advance_keywords) and check_stage_completion(state):
        next_stage = get_next_stage("protocol")
        if next_stage:
            return {
                "current_stage": next_stage,
                "status": "active",
                "messages": [AIMessage(
                    content=f"[STAGE: {get_stage_display_name(next_stage, language)}]\n\n"
                    f"Excellent! Your protocol is complete. Let's move on to building your search strategy."
                )],
                "next_action": "Build your PubMed search query",
            }

    try:
        # ── Call 1: Conversational Response (Gemini Pro) ──
        stage_display = get_stage_display_name("protocol", language)

        # Build context from Idea stage artifact
        idea_context = ""
        if idea_artifact:
            idea_context = "\n\n[CONTEXT FROM IDEA STAGE — DO NOT RE-ASK THESE]\n"
            if idea_artifact.get("clinical_problem"):
                idea_context += f"Clinical problem: {idea_artifact['clinical_problem']}\n"
            if idea_artifact.get("review_type"):
                idea_context += f"Review type: {idea_artifact['review_type']}\n"
            if idea_artifact.get("population_sketch"):
                idea_context += f"Population (sketch): {idea_artifact['population_sketch']}\n"
            if idea_artifact.get("intervention_sketch"):
                idea_context += f"Intervention/Exposure (sketch): {idea_artifact['intervention_sketch']}\n"
            if idea_artifact.get("outcome_sketch"):
                idea_context += f"Outcomes (sketch): {idea_artifact['outcome_sketch']}\n"
            if idea_artifact.get("study_designs"):
                idea_context += f"Study designs: {', '.join(idea_artifact['study_designs'])}\n"
            idea_context += "\nUse this context to inform eligibility criteria. Do NOT re-ask about the research topic or review type.\n"

        # Build context from Research Question stage artifact
        rq_context = ""
        if rq_artifact:
            rq_context = "\n\n[CONTEXT FROM RESEARCH QUESTION STAGE — DO NOT RE-ASK THESE]\n"
            if rq_artifact.get("framework_type"):
                rq_context += f"Framework: {rq_artifact['framework_type']}\n"
            if rq_artifact.get("framework_data"):
                rq_context += "Components:\n"
                for key, value in rq_artifact["framework_data"].items():
                    rq_context += f"  - {key}: {value}\n"
            if rq_artifact.get("question_narrow"):
                rq_context += f"Focused question: {rq_artifact['question_narrow']}\n"
            if rq_artifact.get("question_broad"):
                rq_context += f"Broad question: {rq_artifact['question_broad']}\n"
            rq_context += (
                "\nUse this research question and framework components as the foundation "
                "for eligibility criteria. Do NOT re-ask about the research topic or framework.\n"
            )

        # Build context from current protocol progress
        progress_context = ""
        if protocol_artifact:
            progress_context = "\n\n[CURRENT PROTOCOL PROGRESS]\n"
            if protocol_artifact.get("review_type"):
                progress_context += f"Review type: {protocol_artifact['review_type']}\n"
            if protocol_artifact.get("registration_platform"):
                progress_context += f"Registration: {protocol_artifact['registration_platform']}\n"
            if protocol_artifact.get("information_sources"):
                progress_context += f"Databases: {', '.join(protocol_artifact['information_sources'])}\n"
            if protocol_artifact.get("rob_tool"):
                progress_context += f"RoB tool: {protocol_artifact['rob_tool']}\n"
            if protocol_artifact.get("synthesis_method"):
                progress_context += f"Synthesis: {protocol_artifact['synthesis_method']}\n"
            completed = protocol_artifact.get("completed_sections", [])
            if completed:
                progress_context += f"Completed sections: {', '.join(completed)}\n"
                missing = [s for s in REQUIRED_SECTIONS if s not in completed]
                if missing:
                    progress_context += f"Missing sections: {', '.join(missing)}\n"
            if protocol_artifact.get("approved_tools"):
                progress_context += f"Approved MedAI tools: {', '.join(protocol_artifact['approved_tools'])}\n"

        # Determine review type from idea artifact (no re-detection)
        review_type = (
            protocol_artifact.get("review_type")
            or idea_artifact.get("review_type", "")
        )

        # Append scoping review guidance if applicable
        scoping_addendum = ""
        if review_type and "scoping" in review_type.lower():
            scoping_addendum = f"\n\n{SCOPING_REVIEW_GUIDANCE}"

        # Build language instruction (generic, scalable)
        lang_name = LANGUAGE_NAMES.get(language, "English")
        lang_instruction = (
            f"\n\n[LANGUAGE]\n"
            f"Respond strictly in {lang_name}. "
            f"All questions, explanations, and markdown content must be in {lang_name}."
        )

        full_system_prompt = (
            f"{PROTOCOL_BUILDER_SYSTEM_PROMPT}"
            f"{idea_context}"
            f"{rq_context}"
            f"{progress_context}"
            f"{scoping_addendum}"
            f"{lang_instruction}"
        )

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
        extraction = await extract_structured_data(all_messages_for_extraction, protocol_artifact)

        # ── Merge extraction into artifact ──
        updated_artifact: ProtocolArtifact = {
            "protocol_text": protocol_artifact.get("protocol_text", ""),
            "review_type": protocol_artifact.get("review_type", "") or idea_artifact.get("review_type", ""),
            "registration_platform": protocol_artifact.get("registration_platform", ""),
            "eligibility_criteria": protocol_artifact.get("eligibility_criteria", {}),
            "information_sources": protocol_artifact.get("information_sources", []),
            "search_strategy_draft": protocol_artifact.get("search_strategy_draft", ""),
            "rob_tool": protocol_artifact.get("rob_tool", ""),
            "rob_domains": protocol_artifact.get("rob_domains", []),
            "synthesis_method": protocol_artifact.get("synthesis_method", ""),
            "effect_measure": protocol_artifact.get("effect_measure", ""),
            "completed_sections": protocol_artifact.get("completed_sections", []),
            "approved_tools": protocol_artifact.get("approved_tools", []),
            "tool_declarations": protocol_artifact.get("tool_declarations", {}),
            "prospero_fields": protocol_artifact.get("prospero_fields", {}),
        }

        # Accumulate protocol text
        if updated_artifact["protocol_text"]:
            updated_artifact["protocol_text"] += "\n\n" + ai_response
        else:
            updated_artifact["protocol_text"] = ai_response

        # Merge extraction results
        if extraction:
            if extraction.review_type:
                updated_artifact["review_type"] = extraction.review_type
            if extraction.registration_platform:
                updated_artifact["registration_platform"] = extraction.registration_platform
            if extraction.eligibility_criteria:
                existing_elig = updated_artifact.get("eligibility_criteria", {})
                new_elig = extraction.eligibility_criteria.model_dump(exclude_none=True)
                updated_artifact["eligibility_criteria"] = {**existing_elig, **new_elig}
            if extraction.information_sources:
                existing_sources = set(updated_artifact.get("information_sources", []))
                new_sources = set(extraction.information_sources)
                updated_artifact["information_sources"] = sorted(existing_sources | new_sources)
            if extraction.rob_tool:
                updated_artifact["rob_tool"] = extraction.rob_tool
            if extraction.rob_domains:
                updated_artifact["rob_domains"] = extraction.rob_domains
            if extraction.synthesis_method:
                updated_artifact["synthesis_method"] = extraction.synthesis_method
            if extraction.effect_measure:
                updated_artifact["effect_measure"] = extraction.effect_measure
            if extraction.completed_sections:
                existing_completed = set(updated_artifact.get("completed_sections", []))
                new_completed = set(extraction.completed_sections)
                updated_artifact["completed_sections"] = sorted(existing_completed | new_completed)
            if extraction.approved_tools:
                existing_tools = set(updated_artifact.get("approved_tools", []))
                new_tools = set(extraction.approved_tools)
                all_tools = sorted(existing_tools | new_tools)
                updated_artifact["approved_tools"] = all_tools
                # Generate academic declarations for newly approved tools
                rob = updated_artifact.get("rob_tool", "")
                for tool_key in all_tools:
                    if tool_key not in updated_artifact.get("tool_declarations", {}):
                        decl = get_toolkit_declaration(tool_key, rob)
                        if decl:
                            updated_artifact.setdefault("tool_declarations", {})[tool_key] = decl

            # Keep prospero_fields in sync
            updated_artifact["prospero_fields"] = {
                "review_type": updated_artifact.get("review_type", ""),
                "registration": updated_artifact.get("registration_platform", ""),
                "rob_tool": updated_artifact.get("rob_tool", ""),
            }

        # Update artifacts in state
        updated_artifacts = {**current_artifacts, "protocol": updated_artifact}

        # Check if stage is complete
        is_complete = check_stage_completion({**state, "artifacts": updated_artifacts})

        if is_complete:
            completion_msg = (
                "\n\n---\n\n"
                "**Stage Complete!** Your protocol is ready for PROSPERO registration.\n\n"
                "Are you ready to proceed to the **Search Strategy** stage? "
                "(Type 'yes' or 'proceed')"
            )
            ai_response += completion_msg

        return {
            "messages": [AIMessage(content=f"[STAGE: {stage_display}]\n\n{ai_response}")],
            "status": "waiting_for_user",
            "artifacts": updated_artifacts,
            "next_action": (
                "Proceed to Search Strategy or refine your protocol"
                if is_complete
                else "Continue building your protocol"
            ),
        }

    except Exception as e:
        logger.error(f"Protocol Builder node error: {e}", exc_info=True)
        error_msg = f"I encountered an error while building your protocol: {str(e)}. Please try again."
        return {
            "messages": [AIMessage(content=error_msg)],
            "status": "error",
            "last_error": str(e),
            "errors": [str(e)],
        }
