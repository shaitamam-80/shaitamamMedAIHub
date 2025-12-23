"""
MedAI Hub - Screening Prompts
AI prompts for GEMS-based abstract screening (Layer B).
"""

SCREENING_SYSTEM_PROMPT = """You are an expert systematic reviewer screening medical literature using the GEMS v3.1 methodology.
Your task is to evaluate if an article meets the inclusion criteria for a {review_type} review.

RESEARCH QUESTION (Framework: {framework_type}):
{framework_context}

INCLUSION/EXCLUSION CRITERIA:
{criteria_text}

SCREENING RULES:
1. Read the title and abstract carefully
2. Check if the study population matches the criteria
3. Check if the intervention/exposure is relevant
4. Check if outcomes are measured
5. Check if study design is appropriate
6. When in doubt, use "unclear" status for manual review

DECISION GUIDELINES BY REVIEW TYPE:
{review_guidelines}

IMPORTANT: You MUST respond with valid JSON only. No markdown, no code blocks, no explanations outside JSON.

RESPONSE FORMAT:
{{
    "status": "included" | "excluded" | "unclear",
    "reason": "Brief explanation (1-2 sentences)",
    "evidence_quote": "Exact quote from abstract supporting your decision (max 150 chars)",
    "study_type": "RCT|Cohort|Case-Control|Cross-sectional|Case Report|Review|Meta-analysis|Qualitative|Other",
    "confidence": 0.85
}}
"""

SYSTEMATIC_REVIEW_GUIDELINES = """
SYSTEMATIC REVIEW MODE:
- Apply STRICT criteria
- When in doubt, EXCLUDE
- Focus on methodological rigor and direct relevance to PICO
- Require clear evidence of population, intervention, and outcome alignment
- Prioritize high-quality study designs (RCTs, systematic reviews)
"""

SCOPING_REVIEW_GUIDELINES = """
SCOPING REVIEW MODE:
- Apply BROAD criteria
- When in doubt, INCLUDE for full-text review
- Focus on topic relevance rather than methodological quality
- Be inclusive of diverse study designs
- Cast a wide net to map the literature landscape
"""

QUICK_ANSWER_GUIDELINES = """
QUICK ANSWER MODE:
- Focus on finding the most relevant and high-quality studies
- Prioritize RCTs and systematic reviews
- Balance relevance with quality
- Exclude clearly irrelevant or low-quality studies
"""

REVIEW_TYPE_GUIDELINES = {
    "systematic": SYSTEMATIC_REVIEW_GUIDELINES,
    "scoping": SCOPING_REVIEW_GUIDELINES,
    "quick": QUICK_ANSWER_GUIDELINES,
}


def get_screening_prompt(
    abstract_text: str,
    title: str,
    framework_data: dict[str, str],
    framework_type: str,
    criteria_text: str,
    review_type: str = "systematic",
) -> str:
    """
    Build a complete screening prompt for AI analysis.

    Args:
        abstract_text: The abstract to analyze
        title: Article title
        framework_data: PICO/PEO/SPIDER data
        framework_type: Framework name
        criteria_text: Human-readable criteria description
        review_type: "systematic", "scoping", or "quick"

    Returns:
        Complete prompt string
    """
    # Build framework context
    framework_context = "\n".join(
        [f"- **{key}**: {value}" for key, value in framework_data.items() if value]
    )

    # Get review guidelines
    review_guidelines = REVIEW_TYPE_GUIDELINES.get(review_type, SYSTEMATIC_REVIEW_GUIDELINES)

    # Build system prompt
    system_prompt = SCREENING_SYSTEM_PROMPT.format(
        review_type=review_type.upper(),
        framework_type=framework_type,
        framework_context=framework_context,
        criteria_text=criteria_text,
        review_guidelines=review_guidelines,
    )

    # Build user message with article details
    user_prompt = f"""Analyze this article:

TITLE: {title}

ABSTRACT:
{abstract_text}

Evaluate this article against the criteria and return your decision as JSON."""

    return system_prompt + "\n\n" + user_prompt


def get_criteria_text_for_prompt(codes: list[str]) -> str:
    """
    Convert criteria codes to natural language for the AI prompt.

    Args:
        codes: List of criteria codes (e.g., ["P1", "I1", "S2", "S-Ex1"])

    Returns:
        Human-readable text describing all criteria
    """
    from app.core.gems.criteria_library import get_criteria_by_code

    lines = []
    for code in codes:
        criteria = get_criteria_by_code(code)
        if criteria:
            prefix = "EXCLUDE:" if criteria.get("exclude") else "INCLUDE:"
            lines.append(f"- {prefix} {criteria['label']} - {criteria['description']}")

    if not lines:
        return "No specific criteria configured (default: include all relevant studies)"

    return "\n".join(lines)
