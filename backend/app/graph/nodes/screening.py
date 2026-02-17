"""
MedAI Hub - Screening Node
===========================

LangGraph node for the Screening stage of systematic reviews.
Implements a hybrid approach: Rule Engine (deterministic) + AI screening.

Responsibilities:
    1. Load articles from the search stage
    2. Apply rule-engine pre-filters (fast, deterministic)
    3. Run AI-assisted screening against eligibility criteria
    4. Record screening decisions in DB
    5. Present results and manage stage completion
"""

import logging
import re
from typing import Dict, Any, List

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from app.graph.state import (
    ReviewState,
    ScreeningArtifact,
    get_next_stage,
    get_stage_display_name,
)
from app.core.prompts.screening import (
    SCREENING_SYSTEM_PROMPT,
    RULE_ENGINE_EXCLUSIONS,
    FRAMEWORK_CRITERIA_MAP,
    get_screening_context,
)
from app.core.config import settings

logger = logging.getLogger(__name__)


# ============================================================================
# AI Model
# ============================================================================

def get_llm() -> ChatGoogleGenerativeAI:
    """Get the Gemini LLM for screening decisions."""
    return ChatGoogleGenerativeAI(
        model=settings.GEMINI_PRO_MODEL,
        google_api_key=settings.GOOGLE_API_KEY,
        temperature=0.2,  # Low temperature for consistent screening
        max_tokens=8192,
    )


# ============================================================================
# Rule Engine (Deterministic Pre-filtering)
# ============================================================================

def apply_rule_engine(article: dict) -> tuple[str | None, str | None]:
    """
    Apply deterministic exclusion rules to a single article.

    Returns:
        (exclusion_code, exclusion_reason) or (None, None) if passes all rules.
    """
    title = (article.get("title") or "").lower()
    abstract = (article.get("abstract_text") or "").lower()
    combined = f"{title} {abstract}"
    pub_types = [pt.lower() for pt in (article.get("publication_types") or [])]
    language = (article.get("language") or "eng").lower()

    for rule in RULE_ENGINE_EXCLUSIONS:
        code = rule["code"]

        # Keyword-based rules
        if "keywords" in rule:
            for kw in rule["keywords"]:
                if kw.lower() in combined:
                    return code, rule["label"]

        # Publication type rules
        if "publication_types" in rule:
            for pt in rule["publication_types"]:
                if pt.lower() in pub_types:
                    return code, rule["label"]

        # Language check
        if rule.get("check") == "language_field":
            if language not in ("eng", "english"):
                return code, f"{rule['label']}: {language}"

    return None, None


def batch_rule_engine(articles: list[dict]) -> tuple[list[dict], list[dict]]:
    """
    Apply rule engine to a batch of articles.

    Returns:
        (passed_articles, excluded_articles_with_reasons)
    """
    passed = []
    excluded = []

    for article in articles:
        code, reason = apply_rule_engine(article)
        if code:
            excluded.append({**article, "_exclusion_code": code, "_exclusion_reason": reason})
        else:
            passed.append(article)

    return passed, excluded


# ============================================================================
# Screening Result Parsing
# ============================================================================

def extract_decisions_from_response(ai_response: str) -> list[dict]:
    """
    Extract per-article screening decisions from AI response.

    Looks for patterns like:
        **PMID: 12345678** ...
        Decision: **INCLUDE** / **EXCLUDE** / **MAYBE**
    """
    decisions = []

    # Split by PMID headers
    blocks = re.split(r'\*\*PMID:\s*(\d+)\*\*', ai_response)

    # blocks[0] is preamble, then alternating: pmid, content, pmid, content, ...
    for i in range(1, len(blocks) - 1, 2):
        pmid = blocks[i].strip()
        content = blocks[i + 1] if i + 1 < len(blocks) else ""

        # Extract decision
        decision_match = re.search(
            r'Decision:\s*\*\*(INCLUDE|EXCLUDE|MAYBE)\*\*',
            content, re.IGNORECASE,
        )
        decision = decision_match.group(1).lower() if decision_match else "maybe"

        # Extract reason
        reason_match = re.search(r'Reason:\s*(.+?)(?:\n|$)', content)
        reason = reason_match.group(1).strip() if reason_match else ""

        # Extract quote
        quote_match = re.search(r'Quote:\s*"(.+?)"', content, re.DOTALL)
        quote = quote_match.group(1).strip() if quote_match else ""

        decisions.append({
            "pmid": pmid,
            "decision": decision,
            "reason": reason,
            "quote": quote,
        })

    return decisions


# ============================================================================
# Stage Completion Check
# ============================================================================

def check_stage_completion(state: ReviewState) -> bool:
    """Check if screening stage completion criteria are met."""
    artifacts = state.get("artifacts", {})
    screening = artifacts.get("screening", {})

    has_decisions = bool(screening.get("screening_decisions"))
    total = screening.get("total_records", 0)
    included = screening.get("included_count", 0)
    excluded = screening.get("excluded_count", 0)

    # Complete if all articles have a decision
    all_decided = total > 0 and (included + excluded + screening.get("conflicts_count", 0)) >= total

    return has_decisions and all_decided


# ============================================================================
# Main Node Implementation
# ============================================================================

async def screening_node(state: ReviewState) -> Dict[str, Any]:
    """
    Screening stage node.

    Hybrid approach:
    1. Rule engine for fast deterministic exclusions
    2. AI for nuanced screening decisions
    3. Human override support

    Args:
        state: Current workflow state

    Returns:
        State updates with AI response and screening artifacts
    """
    language = state.get("language", "en")
    messages = state.get("messages", [])
    current_artifacts = state.get("artifacts", {})
    screening_artifact = current_artifacts.get("screening", {})

    logger.info("Screening node processing...")

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
            "messages": [AIMessage(content="[STAGE: Screening]\n\nPlease upload your MEDLINE file or describe how you'd like to screen your search results.")],
            "status": "waiting_for_user",
            "next_action": "Upload MEDLINE file or describe screening approach",
        }

    # Check for stage advancement
    advance_keywords = ["yes", "proceed", "next", "continue", "ready", "confirm", "כן", "המשך", "אישור"]
    if any(kw in user_message.lower() for kw in advance_keywords) and check_stage_completion(state):
        next_stage = get_next_stage("screening")
        if next_stage:
            return {
                "current_stage": next_stage,
                "status": "active",
                "messages": [AIMessage(content=f"[STAGE: {get_stage_display_name(next_stage, language)}]\n\nScreening complete. Let's extract data from the included studies.")],
                "next_action": "Begin data extraction",
            }

    # -- Build context from prior artifacts --
    rq_artifact = current_artifacts.get("research_question", {})
    protocol_artifact = current_artifacts.get("protocol", {})
    search_artifact = current_artifacts.get("search", {})

    framework_type = rq_artifact.get("framework_type", "PICO")
    framework_data = rq_artifact.get("framework_data", {})

    # Get review type from project (would come from state/DB in practice)
    review_type = "systematic_intervention"  # Default; will be enriched when project data is available

    screening_context = get_screening_context(
        framework_type=framework_type,
        framework_data=framework_data,
        review_type=review_type,
        eligibility_criteria=protocol_artifact.get("eligibility_criteria"),
        articles_count=search_artifact.get("results_count", 0),
    )

    # Add existing screening progress
    if screening_artifact:
        screening_context += "\n\n[SCREENING PROGRESS]"
        screening_context += f"\nTotal records: {screening_artifact.get('total_records', 0)}"
        screening_context += f"\nIncluded: {screening_artifact.get('included_count', 0)}"
        screening_context += f"\nExcluded: {screening_artifact.get('excluded_count', 0)}"
        screening_context += f"\nConflicts/Maybe: {screening_artifact.get('conflicts_count', 0)}"

    try:
        stage_display = get_stage_display_name("screening", language)
        full_system_prompt = f"{SCREENING_SYSTEM_PROMPT}{screening_context}"

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

        # Extract decisions from response
        new_decisions = extract_decisions_from_response(ai_response)

        # Merge with existing decisions
        existing_decisions = screening_artifact.get("screening_decisions", [])
        existing_pmids = {d["pmid"] for d in existing_decisions}
        for d in new_decisions:
            if d["pmid"] not in existing_pmids:
                existing_decisions.append(d)
                existing_pmids.add(d["pmid"])

        # Count decisions
        included = sum(1 for d in existing_decisions if d.get("decision") == "include")
        excluded = sum(1 for d in existing_decisions if d.get("decision") == "exclude")
        maybe = sum(1 for d in existing_decisions if d.get("decision") == "maybe")

        # Update artifact
        updated_artifact: ScreeningArtifact = {
            "total_records": screening_artifact.get("total_records", 0) or len(existing_decisions),
            "included_count": included,
            "excluded_count": excluded,
            "conflicts_count": maybe,
            "screening_decisions": existing_decisions,
        }

        updated_artifacts = {**current_artifacts, "screening": updated_artifact}

        # Check completion
        is_complete = check_stage_completion({**state, "artifacts": updated_artifacts})

        if is_complete:
            ai_response += f"\n\n---\n\n✅ **Screening complete!**\n- Included: {included}\n- Excluded: {excluded}\n- Maybe: {maybe}\n\nType 'proceed' to move to Data Extraction."

        return {
            "messages": [AIMessage(content=f"[STAGE: {stage_display}]\n\n{ai_response}")],
            "status": "waiting_for_user",
            "artifacts": updated_artifacts,
            "next_action": "Review decisions and proceed" if is_complete else "Continue screening or provide articles",
        }

    except Exception as e:
        logger.error(f"Screening node error: {e}")
        error_msg = f"I encountered an error during screening: {str(e)}. Please try again."
        return {
            "messages": [AIMessage(content=error_msg)],
            "status": "error",
            "last_error": str(e),
            "errors": [str(e)],
        }
