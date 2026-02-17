"""
MedAI Hub - Risk of Bias Tool Definitions
===========================================

Deterministic mappings for RoB tool selection, domain definitions,
and judgment algorithms.

Supported tools:
    - RoB 2.0 (RCTs)
    - ROBINS-I (non-randomized interventions)
    - NOS Cohort / NOS Case-Control
    - JBI Cross-Sectional / JBI Cohort / JBI Case-Control / JBI-QARI
    - QUADAS-2 (diagnostic accuracy)
    - QUIPS (prognosis)

Source: risk-of-bias/SKILL.md tool selection table + judgment algorithms.
"""

from typing import Dict, List, Tuple, Optional


# ============================================================================
# Tool IDs (match DB CHECK constraint in 002_search_and_articles.sql)
# ============================================================================

TOOL_ROB2 = "rob2"
TOOL_ROBINS_I = "robins_i"
TOOL_NOS_COHORT = "nos_cohort"
TOOL_NOS_CASE_CONTROL = "nos_case_control"
TOOL_QUADAS2 = "quadas2"
TOOL_QUIPS = "quips"
TOOL_JBI_CROSS_SECTIONAL = "jbi_cross_sectional"
TOOL_JBI_COHORT = "jbi_cohort"
TOOL_JBI_CASE_CONTROL = "jbi_case_control"
TOOL_JBI_QUALITATIVE = "jbi_qualitative"
TOOL_JBI_PREVALENCE = "jbi_prevalence"


# ============================================================================
# Study Design → RoB Tool Mapping
# ============================================================================

DESIGN_TO_ROB_TOOL: Dict[str, List[str]] = {
    "rct": [TOOL_ROB2],
    "quasi_experimental": [TOOL_ROBINS_I],
    "cohort": [TOOL_NOS_COHORT, TOOL_QUIPS, TOOL_JBI_COHORT],
    "case_control": [TOOL_NOS_CASE_CONTROL, TOOL_JBI_CASE_CONTROL],
    "cross_sectional": [TOOL_JBI_CROSS_SECTIONAL, TOOL_JBI_PREVALENCE],
    "qualitative": [TOOL_JBI_QUALITATIVE],
}

# Review type can further refine tool selection
REVIEW_TYPE_TOOL_PREFERENCE: Dict[str, Dict[str, str]] = {
    "prognosis": {"cohort": TOOL_QUIPS},
    "etiology": {"cohort": TOOL_NOS_COHORT, "case_control": TOOL_NOS_CASE_CONTROL},
    "diagnostic": {"cross_sectional": TOOL_QUADAS2},
    "prevalence": {"cross_sectional": TOOL_JBI_PREVALENCE},
}


# ============================================================================
# Tool Display Names
# ============================================================================

TOOL_DISPLAY_NAMES: Dict[str, Dict[str, str]] = {
    TOOL_ROB2: {"en": "RoB 2.0 (Cochrane)", "he": "RoB 2.0 (קוקריין)"},
    TOOL_ROBINS_I: {"en": "ROBINS-I", "he": "ROBINS-I"},
    TOOL_NOS_COHORT: {"en": "Newcastle-Ottawa Scale (Cohort)", "he": "סולם ניוקאסל-אוטווה (עוקבה)"},
    TOOL_NOS_CASE_CONTROL: {"en": "Newcastle-Ottawa Scale (Case-Control)", "he": "סולם ניוקאסל-אוטווה (מקרה-ביקורת)"},
    TOOL_QUADAS2: {"en": "QUADAS-2", "he": "QUADAS-2"},
    TOOL_QUIPS: {"en": "QUIPS", "he": "QUIPS"},
    TOOL_JBI_CROSS_SECTIONAL: {"en": "JBI Cross-Sectional Checklist", "he": "JBI רשימת ביקורת חתך"},
    TOOL_JBI_COHORT: {"en": "JBI Cohort Checklist", "he": "JBI רשימת ביקורת עוקבה"},
    TOOL_JBI_CASE_CONTROL: {"en": "JBI Case-Control Checklist", "he": "JBI רשימת ביקורת מקרה-ביקורת"},
    TOOL_JBI_QUALITATIVE: {"en": "JBI-QARI (Qualitative)", "he": "JBI-QARI (איכותני)"},
    TOOL_JBI_PREVALENCE: {"en": "JBI Prevalence Checklist", "he": "JBI רשימת ביקורת שכיחות"},
}


# ============================================================================
# RoB 2.0 Domains
# ============================================================================

ROB2_DOMAINS: List[Dict[str, str]] = [
    {"id": "D1", "name": "Randomization process", "short": "Randomization"},
    {"id": "D2", "name": "Deviations from intended interventions", "short": "Deviations"},
    {"id": "D3", "name": "Missing outcome data", "short": "Missing data"},
    {"id": "D4", "name": "Measurement of the outcome", "short": "Measurement"},
    {"id": "D5", "name": "Selection of the reported result", "short": "Reporting"},
]

ROB2_JUDGMENTS = ["Low", "Some concerns", "High"]


# ============================================================================
# ROBINS-I Domains
# ============================================================================

ROBINS_I_DOMAINS: List[Dict[str, str]] = [
    {"id": "D1", "name": "Bias due to confounding", "short": "Confounding"},
    {"id": "D2", "name": "Bias in selection of participants", "short": "Selection"},
    {"id": "D3", "name": "Bias in classification of interventions", "short": "Classification"},
    {"id": "D4", "name": "Bias due to deviations from intended interventions", "short": "Deviations"},
    {"id": "D5", "name": "Bias due to missing data", "short": "Missing data"},
    {"id": "D6", "name": "Bias in measurement of outcomes", "short": "Measurement"},
    {"id": "D7", "name": "Bias in selection of the reported result", "short": "Reporting"},
]

ROBINS_I_JUDGMENTS = ["Low", "Moderate", "Serious", "Critical", "No information"]


# ============================================================================
# NOS Domains (Cohort)
# ============================================================================

NOS_COHORT_DOMAINS: List[Dict[str, str]] = [
    {"id": "S1", "name": "Representativeness of exposed cohort", "short": "Representativeness", "max_stars": 1},
    {"id": "S2", "name": "Selection of non-exposed cohort", "short": "Non-exposed selection", "max_stars": 1},
    {"id": "S3", "name": "Ascertainment of exposure", "short": "Exposure ascertainment", "max_stars": 1},
    {"id": "S4", "name": "Outcome not present at start", "short": "Outcome at start", "max_stars": 1},
    {"id": "C1", "name": "Comparability (main factor)", "short": "Comparability 1", "max_stars": 1},
    {"id": "C2", "name": "Comparability (additional)", "short": "Comparability 2", "max_stars": 1},
    {"id": "O1", "name": "Assessment of outcome", "short": "Outcome assessment", "max_stars": 1},
    {"id": "O2", "name": "Follow-up length", "short": "Follow-up length", "max_stars": 1},
    {"id": "O3", "name": "Adequacy of follow-up", "short": "Follow-up adequacy", "max_stars": 1},
]


# ============================================================================
# QUADAS-2 Domains
# ============================================================================

QUADAS2_DOMAINS: List[Dict[str, str]] = [
    {"id": "D1", "name": "Patient selection", "short": "Patient selection"},
    {"id": "D2", "name": "Index test", "short": "Index test"},
    {"id": "D3", "name": "Reference standard", "short": "Reference standard"},
    {"id": "D4", "name": "Flow and timing", "short": "Flow & timing"},
]

QUADAS2_JUDGMENTS = ["Low", "High", "Unclear"]


# ============================================================================
# Overall Judgment Algorithms (Deterministic)
# ============================================================================

def rob2_overall_judgment(domain_judgments: List[str]) -> str:
    """
    RoB 2.0 overall judgment algorithm.

    - Low risk in ALL domains → Low
    - Some concerns in ≥1 domain, no high → Some concerns
    - High risk in ≥1 domain → High
    - Some concerns in multiple domains → may be High
    """
    if all(j == "Low" for j in domain_judgments):
        return "Low"
    if any(j == "High" for j in domain_judgments):
        return "High"
    concerns_count = sum(1 for j in domain_judgments if j == "Some concerns")
    if concerns_count >= 3:
        return "High"  # Multiple concerns substantially lower confidence
    return "Some concerns"


def robins_i_overall_judgment(domain_judgments: List[str]) -> str:
    """
    ROBINS-I overall judgment algorithm.
    Overall = worst domain judgment (with nuance for 'No information').
    """
    severity = {"Low": 0, "Moderate": 1, "Serious": 2, "Critical": 3, "No information": 2}
    reverse = {0: "Low", 1: "Moderate", 2: "Serious", 3: "Critical"}
    max_severity = max(severity.get(j, 2) for j in domain_judgments)
    return reverse.get(max_severity, "Serious")


def nos_interpret_stars(total_stars: int) -> str:
    """
    NOS interpretation.
    7-9 stars → Low risk
    4-6 stars → Moderate risk
    0-3 stars → High risk
    """
    if total_stars >= 7:
        return "Low"
    if total_stars >= 4:
        return "Moderate"
    return "High"


# ============================================================================
# Tool Selection Function
# ============================================================================

def select_rob_tool(
    study_design: str,
    review_type: str = "",
) -> Tuple[str, str]:
    """
    Select the most appropriate RoB tool based on study design and review type.

    Returns:
        (tool_id, tool_display_name_en)
    """
    # Check review-type-specific preference first
    if review_type and review_type in REVIEW_TYPE_TOOL_PREFERENCE:
        prefs = REVIEW_TYPE_TOOL_PREFERENCE[review_type]
        if study_design in prefs:
            tool = prefs[study_design]
            name = TOOL_DISPLAY_NAMES.get(tool, {}).get("en", tool)
            return tool, name

    # Fall back to design-based selection (first option = default)
    tools = DESIGN_TO_ROB_TOOL.get(study_design, [TOOL_JBI_CROSS_SECTIONAL])
    tool = tools[0]
    name = TOOL_DISPLAY_NAMES.get(tool, {}).get("en", tool)
    return tool, name


def get_domains_for_tool(tool_id: str) -> List[Dict[str, str]]:
    """Get the domain definitions for a specific RoB tool."""
    tool_domains = {
        TOOL_ROB2: ROB2_DOMAINS,
        TOOL_ROBINS_I: ROBINS_I_DOMAINS,
        TOOL_NOS_COHORT: NOS_COHORT_DOMAINS,
        TOOL_QUADAS2: QUADAS2_DOMAINS,
    }
    return tool_domains.get(tool_id, [])
