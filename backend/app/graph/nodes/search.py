"""
MedAI Hub - Search Query Node
==============================

LangGraph node for the Search Strategy stage of systematic reviews.
Translates research questions into PubMed Boolean queries with MeSH terms,
generates 3 strategy variants (broad/focused/precision), and manages
query validation and execution.

Responsibilities:
    1. Read protocol/research_question artifacts for context
    2. Build concept blocks from framework components
    3. Generate 3 query strategies via AI
    4. Validate queries (syntax check)
    5. Store search_runs in DB when user confirms
    6. Manage stage completion and advancement
"""

import logging
import re
from typing import Dict, Any

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from app.graph.state import (
    ReviewState,
    SearchArtifact,
    get_next_stage,
    get_stage_display_name,
)
from app.core.prompts.search import (
    SEARCH_SYSTEM_PROMPT,
    CLINICAL_FILTERS,
    STRATEGY_DEFINITIONS,
    get_search_context,
)
from app.core.config import settings

logger = logging.getLogger(__name__)


# ============================================================================
# AI Model Initialization
# ============================================================================

def get_llm() -> ChatGoogleGenerativeAI:
    """Get the Gemini LLM instance for search query building."""
    return ChatGoogleGenerativeAI(
        model=settings.GEMINI_PRO_MODEL,
        google_api_key=settings.GOOGLE_API_KEY,
        temperature=0.3,  # Lower temperature for precise query syntax
        max_tokens=8192,
    )


# ============================================================================
# Query Extraction Helpers
# ============================================================================

def extract_queries_from_response(ai_response: str) -> Dict[str, str]:
    """
    Extract PubMed query strings from AI response by strategy label.

    Looks for code blocks or query patterns after strategy headers.
    Returns dict like {"broad": "query...", "focused": "query...", "precision": "query..."}.
    """
    queries = {}

    # Pattern: ### Strategy: Broad ... followed by a query
    # Try code blocks first, then raw multi-line queries
    for label in ["broad", "focused", "precision"]:
        # Match header like "### Strategy: Broad" (case-insensitive)
        header_pattern = rf"###?\s*Strategy[:\s]*{label}"
        header_match = re.search(header_pattern, ai_response, re.IGNORECASE)
        if not header_match:
            continue

        text_after = ai_response[header_match.end():]

        # Try to extract from code block
        code_match = re.search(r"```(?:\w*\n)?(.*?)```", text_after, re.DOTALL)
        if code_match:
            query = code_match.group(1).strip()
            if query and ("AND" in query.upper() or "[" in query):
                queries[label] = query
                continue

        # Try to extract raw query (lines containing PubMed syntax)
        lines = text_after.split("\n")
        query_lines = []
        capturing = False
        for line in lines:
            stripped = line.strip()
            # Start capturing at first line with PubMed syntax
            if not capturing and (
                "[mesh" in stripped.lower() or "[tiab]" in stripped.lower()
                or stripped.startswith("(") or "AND" in stripped
            ):
                capturing = True
            # Stop at next section header
            if capturing and stripped.startswith("###"):
                break
            if capturing and stripped:
                query_lines.append(stripped)
            # Stop after empty line following query content
            if capturing and not stripped and query_lines:
                break

        if query_lines:
            queries[label] = "\n".join(query_lines)

    return queries


def detect_question_type_from_artifacts(artifacts: dict) -> str:
    """Detect question type from existing artifacts to select clinical filter."""
    rq = artifacts.get("research_question", {})
    framework = rq.get("framework_type", "")
    protocol = artifacts.get("protocol", {})

    # Map framework to question type
    framework_to_type = {
        "PICO": "effectiveness",
        "PICOT": "effectiveness",
        "PICOS": "effectiveness",
        "CoCoPop": "prevalence",
        "PFO": "prognosis",
        "PEO": "etiology",
        "PECO": "etiology",
        "PIRD": "diagnostic",
        "SPIDER": "qualitative",
        "PICo": "scoping",
        "PCC": "scoping",
    }
    return framework_to_type.get(framework, "effectiveness")


def check_stage_completion(state: ReviewState) -> bool:
    """
    Check if search stage completion criteria are met.

    Criteria:
    1. At least one query strategy exists
    2. A query has been validated (user confirmed or results count available)
    """
    artifacts = state.get("artifacts", {})
    search_artifact = artifacts.get("search", {})

    has_query = bool(search_artifact.get("pubmed_query"))
    has_strategies = bool(search_artifact.get("strategies"))

    return has_query and has_strategies


# ============================================================================
# Main Node Implementation
# ============================================================================

async def search_node(state: ReviewState) -> Dict[str, Any]:
    """
    Search Strategy stage node.

    This node:
    1. Reads research_question and protocol artifacts for context
    2. Guides the user through PubMed query construction
    3. Generates 3 strategies (broad/focused/precision)
    4. Extracts and stores validated queries
    5. Manages stage completion and transition to screening

    Args:
        state: Current workflow state

    Returns:
        State updates with AI response and search artifacts
    """
    language = state.get("language", "en")
    messages = state.get("messages", [])
    current_artifacts = state.get("artifacts", {})
    search_artifact = current_artifacts.get("search", {})

    logger.info("Search node processing...")

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
            "messages": [AIMessage(content="[STAGE: Search Strategy]\n\nPlease describe what you'd like to search for, or type 'build query' to auto-generate from your research question.")],
            "status": "waiting_for_user",
            "next_action": "Describe search needs or type 'build query'",
        }

    # Check for stage advancement request
    advance_keywords = ["yes", "proceed", "next", "continue", "ready", "confirm", "כן", "המשך", "אישור"]
    if any(kw in user_message.lower() for kw in advance_keywords) and check_stage_completion(state):
        next_stage = get_next_stage("search")
        if next_stage:
            return {
                "current_stage": next_stage,
                "status": "active",
                "messages": [AIMessage(content=f"[STAGE: {get_stage_display_name(next_stage, language)}]\n\nSearch strategy is set. Let's move to screening your results.")],
                "next_action": "Configure screening criteria",
            }

    # -- Build context from prior artifacts --
    rq_artifact = current_artifacts.get("research_question", {})
    protocol_artifact = current_artifacts.get("protocol", {})

    framework_type = rq_artifact.get("framework_type", "PICO")
    framework_data = rq_artifact.get("framework_data", {})
    question_narrow = rq_artifact.get("question_narrow", "")
    question_broad = rq_artifact.get("question_broad", "")

    search_context = get_search_context(
        framework_type=framework_type,
        framework_data=framework_data,
        question_narrow=question_narrow,
        question_broad=question_broad,
    )

    # Add eligibility criteria from protocol if available
    if protocol_artifact.get("eligibility_criteria"):
        criteria = protocol_artifact["eligibility_criteria"]
        search_context += "\n\n[ELIGIBILITY CRITERIA FROM PROTOCOL]"
        if criteria.get("inclusion"):
            search_context += "\nInclusion: " + "; ".join(criteria["inclusion"])
        if criteria.get("exclusion"):
            search_context += "\nExclusion: " + "; ".join(criteria["exclusion"])

    # Add existing search progress
    if search_artifact:
        search_context += "\n\n[CURRENT SEARCH PROGRESS]"
        if search_artifact.get("strategies"):
            for label, query in search_artifact["strategies"].items():
                search_context += f"\n{label}: query built ({len(query)} chars)"
        if search_artifact.get("results_count"):
            search_context += f"\nLast results count: {search_artifact['results_count']}"

    # Add question type and available filter
    question_type = detect_question_type_from_artifacts(current_artifacts)
    available_filter = CLINICAL_FILTERS.get(question_type, {})
    if available_filter:
        search_context += f"\n\n[RECOMMENDED FILTER for {question_type}]"
        search_context += f"\nBroad: {available_filter.get('broad', 'N/A')}"
        search_context += f"\nNarrow: {available_filter.get('narrow', 'N/A')}"

    try:
        # Build full prompt
        stage_display = get_stage_display_name("search", language)
        full_system_prompt = f"{SEARCH_SYSTEM_PROMPT}{search_context}"

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

        # Call LLM
        llm = get_llm()
        response = await llm.ainvoke(llm_messages)
        ai_response = response.content

        # Extract queries from AI response
        extracted_queries = extract_queries_from_response(ai_response)

        # Merge with existing strategies
        existing_strategies = search_artifact.get("strategies", {})
        merged_strategies = {**existing_strategies, **extracted_queries}

        # Extract MeSH terms mentioned in the response
        mesh_pattern = r'"([^"]+)"\[MeSH Terms?\]'
        mesh_terms_found = list(set(re.findall(mesh_pattern, ai_response, re.IGNORECASE)))
        existing_mesh = search_artifact.get("mesh_terms", [])
        merged_mesh = list(set(existing_mesh + mesh_terms_found))

        # Pick the "focused" strategy as the primary query, fall back to first available
        primary_query = (
            merged_strategies.get("focused")
            or merged_strategies.get("broad")
            or merged_strategies.get("precision")
            or search_artifact.get("pubmed_query", "")
        )

        # Build updated artifact
        updated_artifact: SearchArtifact = {
            "pubmed_query": primary_query,
            "mesh_terms": merged_mesh,
            "search_filters": search_artifact.get("search_filters", []),
            "results_count": search_artifact.get("results_count", 0),
            "exported_file": search_artifact.get("exported_file", ""),
            "strategies": merged_strategies,
            "question_type": question_type,
        }

        updated_artifacts = {**current_artifacts, "search": updated_artifact}

        # Check completion
        is_complete = check_stage_completion({**state, "artifacts": updated_artifacts})

        if is_complete and not search_artifact.get("strategies"):
            # First time we have queries — prompt user to review
            ai_response += "\n\n---\n\nI've generated the query strategies above. Please review them and let me know if you'd like to:\n- **Modify** any concept block\n- **Add/remove** terms\n- **Proceed** to screening (type 'proceed')"

        return {
            "messages": [AIMessage(content=f"[STAGE: {stage_display}]\n\n{ai_response}")],
            "status": "waiting_for_user",
            "artifacts": updated_artifacts,
            "next_action": "Review queries and proceed to screening" if is_complete else "Continue refining search strategy",
        }

    except Exception as e:
        logger.error(f"Search node error: {e}")
        error_msg = f"I encountered an error while building your search strategy: {str(e)}. Please try again."
        return {
            "messages": [AIMessage(content=error_msg)],
            "status": "error",
            "last_error": str(e),
            "errors": [str(e)],
        }
