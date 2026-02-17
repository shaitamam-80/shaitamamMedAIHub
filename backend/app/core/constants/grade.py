"""
MedAI Hub - GRADE Constants
==============================

Deterministic mappings for GRADE certainty of evidence assessment.
5 downgrading domains + 3 upgrading domains + certainty levels.

Source: grade-assessment/SKILL.md.
"""

from typing import Dict, List, Tuple


# ============================================================================
# Starting Certainty
# ============================================================================

STARTING_CERTAINTY: Dict[str, str] = {
    "rct": "High",
    "quasi_experimental": "Low",
    "cohort": "Low",
    "case_control": "Low",
    "cross_sectional": "Low",
    "qualitative": "Low",  # N/A for GRADE, but fallback
}


# ============================================================================
# Certainty Levels
# ============================================================================

CERTAINTY_LEVELS = ["High", "Moderate", "Low", "Very Low"]

CERTAINTY_DEFINITIONS: Dict[str, Dict[str, str]] = {
    "High": {
        "meaning": "Very confident; true effect close to estimate",
        "symbol": "⊕⊕⊕⊕",
    },
    "Moderate": {
        "meaning": "Moderately confident; likely close but may differ",
        "symbol": "⊕⊕⊕◯",
    },
    "Low": {
        "meaning": "Limited confidence; may be substantially different",
        "symbol": "⊕⊕◯◯",
    },
    "Very Low": {
        "meaning": "Very little confidence; true effect likely different",
        "symbol": "⊕◯◯◯",
    },
}


# ============================================================================
# Downgrading Domains (5)
# ============================================================================

DOWNGRADE_DOMAINS: List[Dict[str, str]] = [
    {
        "id": "risk_of_bias",
        "name": "Risk of Bias",
        "question": "Are there concerns about bias in studies contributing most weight?",
    },
    {
        "id": "inconsistency",
        "name": "Inconsistency",
        "question": "Are results similar across studies (I², prediction interval, effect direction)?",
    },
    {
        "id": "indirectness",
        "name": "Indirectness",
        "question": "Do studies directly address the review question (PICO match)?",
    },
    {
        "id": "imprecision",
        "name": "Imprecision",
        "question": "Is the CI narrow enough to support a clinical decision?",
    },
    {
        "id": "publication_bias",
        "name": "Publication Bias",
        "question": "Is there evidence of unpublished/missing studies?",
    },
]


# ============================================================================
# Upgrading Domains (3, Observational Only)
# ============================================================================

UPGRADE_DOMAINS: List[Dict[str, str]] = [
    {
        "id": "large_effect",
        "name": "Large Effect",
        "rule": "RR > 2 or < 0.5 → +1; RR > 5 or < 0.2 → +2",
    },
    {
        "id": "dose_response",
        "name": "Dose-Response Gradient",
        "rule": "Clear dose-response relationship → +1",
    },
    {
        "id": "plausible_confounding",
        "name": "Plausible Confounding Reducing Effect",
        "rule": "Residual confounding would reduce observed effect → +1",
    },
]


# ============================================================================
# Imprecision Thresholds
# ============================================================================

IMPRECISION_THRESHOLDS = {
    "continuous": {
        "consider_downgrade_1": 400,  # Total N < 400
        "consider_downgrade_2": 200,  # Total N < 200
    },
    "dichotomous": {
        "consider_downgrade_1": 300,  # Total events < 300
        "consider_downgrade_2": 150,  # Total events < 150
    },
}


# ============================================================================
# Plain Language Statement Templates
# ============================================================================

PLAIN_LANGUAGE_TEMPLATES: Dict[str, str] = {
    "High_benefit": "{intervention} results in {outcome} (high-certainty evidence).",
    "Moderate_benefit": "{intervention} likely results in {outcome} (moderate-certainty evidence).",
    "Low_benefit": "{intervention} may result in {outcome} (low-certainty evidence).",
    "Very Low_benefit": "We are uncertain whether {intervention} results in {outcome} (very low-certainty evidence).",
    "no_effect": "{intervention} results in little to no difference in {outcome} ({certainty}-certainty evidence).",
}


# ============================================================================
# Deterministic Certainty Computation
# ============================================================================

def compute_grade_certainty(
    starting_level: str,
    downgrades: Dict[str, int],
    upgrades: Dict[str, int] | None = None,
) -> Tuple[str, int]:
    """
    Compute GRADE certainty level.

    Args:
        starting_level: "High" or "Low"
        downgrades: {domain_id: -1 or -2} for each domain
        upgrades: {domain_id: +1 or +2} (observational only)

    Returns:
        (certainty_level, total_adjustment)
    """
    level_to_num = {"High": 4, "Moderate": 3, "Low": 2, "Very Low": 1}
    num_to_level = {4: "High", 3: "Moderate", 2: "Low", 1: "Very Low"}

    current = level_to_num.get(starting_level, 4)

    # Apply downgrades
    total_down = sum(downgrades.values())
    current += total_down  # downgrades are negative

    # Apply upgrades (only if starting from observational = Low)
    total_up = 0
    if upgrades and starting_level == "Low":
        total_up = sum(upgrades.values())
        current += total_up

    # Clamp to valid range
    current = max(1, min(4, current))

    total_adjustment = total_down + total_up
    return num_to_level[current], total_adjustment


def get_plain_language(
    certainty: str,
    intervention: str,
    outcome: str,
    direction: str = "benefit",
) -> str:
    """Generate GRADE plain-language statement."""
    if direction == "no_effect":
        template = PLAIN_LANGUAGE_TEMPLATES["no_effect"]
        return template.format(intervention=intervention, outcome=outcome, certainty=certainty.lower())

    key = f"{certainty}_{direction}"
    template = PLAIN_LANGUAGE_TEMPLATES.get(key, PLAIN_LANGUAGE_TEMPLATES.get(f"Low_{direction}", ""))
    return template.format(intervention=intervention, outcome=outcome)
