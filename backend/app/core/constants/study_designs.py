"""
MedAI Hub - Study Design Detection
====================================

Deterministic keyword-based study design detection.
Maps keyword indicators to study design types and extraction template IDs.

Source: data-extraction/SKILL.md study design detection table.
"""

from typing import Dict, List, Tuple

# ============================================================================
# Study Design Enum-like Constants
# ============================================================================

DESIGN_RCT = "rct"
DESIGN_QUASI = "quasi_experimental"
DESIGN_COHORT = "cohort"
DESIGN_CASE_CONTROL = "case_control"
DESIGN_CROSS_SECTIONAL = "cross_sectional"
DESIGN_QUALITATIVE = "qualitative"

# ============================================================================
# Keyword → Study Design Detection
# ============================================================================
# Order matters: first match wins. RCT checked before cohort because
# "trial" is more specific than "followed".

DESIGN_KEYWORDS: List[Tuple[str, List[str]]] = [
    (DESIGN_RCT, [
        "randomized",
        "randomised",
        "randomly assigned",
        "random allocation",
        "rct",
        "randomized controlled trial",
        "randomised controlled trial",
        "double-blind",
        "double blind",
        "triple-blind",
        "placebo-controlled",
    ]),
    (DESIGN_QUASI, [
        "non-randomized",
        "non-randomised",
        "quasi-experimental",
        "quasi experimental",
        "before-after",
        "before and after",
        "interrupted time series",
        "controlled before",
        "pre-post",
    ]),
    (DESIGN_QUALITATIVE, [
        "qualitative",
        "interviews",
        "focus group",
        "thematic analysis",
        "grounded theory",
        "phenomenology",
        "ethnography",
        "content analysis",
        "narrative analysis",
    ]),
    (DESIGN_CASE_CONTROL, [
        "case-control",
        "case control",
        "cases and controls",
        "matched controls",
        "odds ratio",
    ]),
    (DESIGN_COHORT, [
        "cohort",
        "prospective study",
        "retrospective study",
        "follow-up study",
        "longitudinal",
        "incidence",
        "hazard ratio",
        "survival analysis",
    ]),
    (DESIGN_CROSS_SECTIONAL, [
        "cross-sectional",
        "cross sectional",
        "prevalence",
        "survey",
        "point in time",
        "point prevalence",
    ]),
]

# ============================================================================
# Study Design → Extraction Template Mapping
# ============================================================================

DESIGN_TO_TEMPLATE: Dict[str, str] = {
    DESIGN_RCT: "template_a",
    DESIGN_QUASI: "template_a",          # Similar extraction to RCTs
    DESIGN_COHORT: "template_c",
    DESIGN_CASE_CONTROL: "template_c",   # Similar to cohort extraction
    DESIGN_CROSS_SECTIONAL: "template_b",
    DESIGN_QUALITATIVE: "template_d",
}

# ============================================================================
# Display Names
# ============================================================================

DESIGN_DISPLAY_NAMES: Dict[str, Dict[str, str]] = {
    DESIGN_RCT: {"en": "Randomized Controlled Trial", "he": "ניסוי מבוקר אקראי"},
    DESIGN_QUASI: {"en": "Quasi-Experimental Study", "he": "מחקר מעין-ניסויי"},
    DESIGN_COHORT: {"en": "Cohort Study", "he": "מחקר עוקבה"},
    DESIGN_CASE_CONTROL: {"en": "Case-Control Study", "he": "מחקר מקרה-ביקורת"},
    DESIGN_CROSS_SECTIONAL: {"en": "Cross-Sectional Study", "he": "מחקר חתך"},
    DESIGN_QUALITATIVE: {"en": "Qualitative Study", "he": "מחקר איכותני"},
}


# ============================================================================
# Detection Function
# ============================================================================

def detect_study_design(title: str, abstract: str) -> Tuple[str, float]:
    """
    Detect study design from title and abstract using keyword matching.

    Returns:
        (design_type, confidence) where confidence is 0.0-1.0.
        Higher confidence when keywords appear in the title.
    """
    title_lower = title.lower()
    abstract_lower = abstract.lower()
    combined = f"{title_lower} {abstract_lower}"

    for design, keywords in DESIGN_KEYWORDS:
        for kw in keywords:
            if kw in title_lower:
                return design, 0.9  # High confidence: keyword in title
            if kw in combined:
                return design, 0.6  # Moderate confidence: keyword in abstract

    return DESIGN_CROSS_SECTIONAL, 0.2  # Default fallback with low confidence
