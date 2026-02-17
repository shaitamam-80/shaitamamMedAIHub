"""
MedAI Hub - Data Extraction Node
==================================

LangGraph node for the Data Extraction stage of systematic reviews.

Responsibilities:
    1. Auto-detect study design from title/abstract (deterministic)
    2. Select appropriate extraction template (deterministic)
    3. Use LLM to extract structured data from study text (semantic)
    4. Apply statistical conversions when needed (deterministic)
    5. Track extraction progress and manage stage completion

Architecture (LLM for semantics, Code for determinism):
    - Code: study design detection, template selection, stat conversions
    - LLM: reading study text, filling template fields, identifying outcomes
"""

import logging
import json
import re
from typing import Dict, Any, List, Optional

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from app.graph.state import (
    ReviewState,
    ExtractionArtifact,
    get_next_stage,
    get_stage_display_name,
)
from app.core.constants.study_designs import (
    detect_study_design,
    DESIGN_TO_TEMPLATE,
    DESIGN_DISPLAY_NAMES,
)
from app.core.constants.extraction_templates import (
    get_template,
    get_template_for_design,
    get_required_fields,
    TEMPLATES,
)
from app.core.prompts.extraction import (
    EXTRACTION_SYSTEM_PROMPT,
    get_extraction_context,
    EXTRACTION_PITFALLS,
)
from app.core.config import settings

logger = logging.getLogger(__name__)


# ============================================================================
# AI Model
# ============================================================================

def get_llm() -> ChatGoogleGenerativeAI:
    """Get the Gemini LLM for extraction tasks."""
    return ChatGoogleGenerativeAI(
        model=settings.GEMINI_PRO_MODEL,
        google_api_key=settings.GOOGLE_API_KEY,
        temperature=0.1,  # Very low for precise data extraction
        max_tokens=8192,
    )


# ============================================================================
# Helper: Build Template Summary for LLM
# ============================================================================

def build_template_summary(template_id: str) -> str:
    """Build a human-readable summary of template fields for the LLM."""
    template = get_template(template_id)
    if not template:
        return ""

    lines = [f"\n[EXTRACTION TEMPLATE: {template['name']}]"]
    for section in template["sections"]:
        lines.append(f"\n### {section['name']}")
        for field in section["fields"]:
            req = "* " if field.get("required") else "  "
            lines.append(f"  {req}{field['label']} ({field['key']})")
    lines.append("\n(* = required field)")
    return "\n".join(lines)


# ============================================================================
# Helper: Extract Structured Data from AI Response
# ============================================================================

def parse_extraction_from_response(ai_response: str) -> Dict[str, Any]:
    """
    Parse extracted data fields from the AI response.

    Looks for patterns like:
        Field Label: value [FLAG] (source: Table 1)
    or JSON blocks.
    """
    extracted = {}

    # Try to find JSON block first
    json_match = re.search(r'```json\s*\n(.*?)\n```', ai_response, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass

    # Fall back to line-by-line parsing
    for line in ai_response.split("\n"):
        # Match "Key: Value" or "**Key**: Value" patterns
        match = re.match(r'[\*\s]*([A-Za-z_\s]+?)[\*]*:\s*(.+)', line.strip())
        if match:
            key = match.group(1).strip().lower().replace(" ", "_")
            value = match.group(2).strip()
            if value and value not in ["-", "—", "N/A"]:
                extracted[key] = value

    return extracted


# ============================================================================
# Stage Completion Check
# ============================================================================

def check_stage_completion(state: ReviewState) -> bool:
    """Check if extraction stage completion criteria are met."""
    artifacts = state.get("artifacts", {})
    extraction = artifacts.get("extraction", {})
    screening = artifacts.get("screening", {})

    extracted_studies = extraction.get("extracted_studies", [])
    included_count = screening.get("included_count", 0)

    # Complete if all included studies have been extracted
    if included_count > 0 and len(extracted_studies) >= included_count:
        return True

    # Also complete if user explicitly confirmed extraction is done
    return extraction.get("user_confirmed_complete", False)


# ============================================================================
# Main Node Implementation
# ============================================================================

async def extraction_node(state: ReviewState) -> Dict[str, Any]:
    """
    Data Extraction stage node.

    Flow:
    1. If no study provided → ask user to provide study text/PDF
    2. Detect study design (deterministic keyword matching)
    3. Select extraction template (deterministic mapping)
    4. Present template to LLM with study text
    5. LLM extracts structured data
    6. Accumulate extracted studies in artifact

    Args:
        state: Current workflow state

    Returns:
        State updates with AI response and extraction artifacts
    """
    language = state.get("language", "en")
    messages = state.get("messages", [])
    current_artifacts = state.get("artifacts", {})
    extraction_artifact = current_artifacts.get("extraction", {})
    screening_artifact = current_artifacts.get("screening", {})
    rq_artifact = current_artifacts.get("research_question", {})

    logger.info("Extraction node processing...")

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
            "messages": [AIMessage(content="[STAGE: Data Extraction]\n\nPlease provide the study text (abstract or full-text) for data extraction, or type 'template' to see a blank extraction form.")],
            "status": "waiting_for_user",
            "next_action": "Provide study text or request template",
        }

    # Check for stage advancement
    advance_keywords = ["yes", "proceed", "next", "continue", "ready", "confirm", "done", "כן", "המשך", "אישור", "סיימתי"]
    if any(kw in user_message.lower() for kw in advance_keywords) and check_stage_completion(state):
        next_stage = get_next_stage("extraction")
        if next_stage:
            return {
                "current_stage": next_stage,
                "status": "active",
                "messages": [AIMessage(content=f"[STAGE: {get_stage_display_name(next_stage, language)}]\n\nData extraction complete. Let's assess the risk of bias in the included studies.")],
                "next_action": "Begin risk of bias assessment",
            }

    # Check for template request
    if user_message.lower().strip() in ["template", "blank", "form", "תבנית"]:
        # Use first included study's design or ask user
        design = extraction_artifact.get("current_design", "rct")
        template_id = DESIGN_TO_TEMPLATE.get(design, "template_a")
        template_summary = build_template_summary(template_id)

        template = get_template(template_id)
        template_name = template["name"] if template else template_id

        return {
            "messages": [AIMessage(content=f"[STAGE: Data Extraction]\n\nHere is the blank extraction template for **{template_name}**:\n{template_summary}\n\nPlease provide study text (abstract or full-text) and I'll fill in the fields.")],
            "status": "waiting_for_user",
            "next_action": "Provide study text for extraction",
        }

    # -- Attempt study design detection from user message --
    # The user message may contain study title + abstract
    detected_design, confidence = detect_study_design(
        title=user_message[:500],  # First 500 chars likely title area
        abstract=user_message,
    )

    template_id = DESIGN_TO_TEMPLATE.get(detected_design, "template_a")
    template = get_template(template_id)
    template_name = template["name"] if template else template_id
    design_display = DESIGN_DISPLAY_NAMES.get(detected_design, {}).get(language, detected_design)

    # Build template fields for LLM context
    template_summary = build_template_summary(template_id)

    # Build extraction context
    framework_type = rq_artifact.get("framework_type", "")
    included_count = screening_artifact.get("included_count", 0)
    extracted_studies = extraction_artifact.get("extracted_studies", [])

    extraction_context = get_extraction_context(
        study_design=design_display,
        design_confidence=confidence,
        template_id=template_id,
        template_name=template_name,
        framework_type=framework_type,
        included_count=included_count,
        extracted_count=len(extracted_studies),
    )

    try:
        stage_display = get_stage_display_name("extraction", language)
        full_system_prompt = f"{EXTRACTION_SYSTEM_PROMPT}{extraction_context}{template_summary}"

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

        # Try to parse extracted data from response
        new_extraction = parse_extraction_from_response(ai_response)

        # If we got meaningful data, add to extracted studies
        if new_extraction and len(new_extraction) > 3:
            new_extraction["_study_design"] = detected_design
            new_extraction["_design_confidence"] = confidence
            new_extraction["_template_id"] = template_id

            existing_studies = list(extraction_artifact.get("extracted_studies", []))
            existing_studies.append(new_extraction)

            updated_artifact: ExtractionArtifact = {
                "extracted_studies": existing_studies,
                "extraction_template": template_id,
            }
        else:
            # Keep existing artifact, just update template info
            updated_artifact: ExtractionArtifact = {
                "extracted_studies": extraction_artifact.get("extracted_studies", []),
                "extraction_template": template_id,
            }

        updated_artifacts = {**current_artifacts, "extraction": updated_artifact}

        # Check completion
        is_complete = check_stage_completion({**state, "artifacts": updated_artifacts})

        if is_complete:
            total = len(updated_artifact.get("extracted_studies", []))
            ai_response += f"\n\n---\n\n**Extraction complete!**\n- Studies extracted: {total}\n\nType 'proceed' to move to Risk of Bias assessment."

        return {
            "messages": [AIMessage(content=f"[STAGE: {stage_display}]\n\n{ai_response}")],
            "status": "waiting_for_user",
            "artifacts": updated_artifacts,
            "next_action": "Review extraction and proceed" if is_complete else "Provide next study or review extraction",
        }

    except Exception as e:
        logger.error(f"Extraction node error: {e}")
        error_msg = f"I encountered an error during data extraction: {str(e)}. Please try again."
        return {
            "messages": [AIMessage(content=error_msg)],
            "status": "error",
            "last_error": str(e),
            "errors": [str(e)],
        }
