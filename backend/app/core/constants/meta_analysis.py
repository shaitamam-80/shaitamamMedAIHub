"""
MedAI Hub - Meta-Analysis Constants
======================================

Deterministic mappings for effect measure selection, model selection,
heterogeneity interpretation, and publication bias assessment.

Source: meta-analysis/SKILL.md.
"""

from typing import Dict, List


# ============================================================================
# Effect Measure Selection
# ============================================================================

# Dichotomous outcomes
DICHOTOMOUS_MEASURES: List[Dict[str, str]] = [
    {"id": "RR", "name": "Risk Ratio", "when": "Cohort, RCTs, intuitive interpretation"},
    {"id": "OR", "name": "Odds Ratio", "when": "Case-control, rare outcomes (<10%)"},
    {"id": "RD", "name": "Risk Difference", "when": "Absolute risk, NNT calculation"},
    {"id": "HR", "name": "Hazard Ratio", "when": "Time-to-event data"},
]

# Continuous outcomes
CONTINUOUS_MEASURES: List[Dict[str, str]] = [
    {"id": "MD", "name": "Mean Difference", "when": "Same scale across studies"},
    {"id": "SMD", "name": "Standardized Mean Difference", "when": "Different scales (e.g., PHQ-9 vs BDI)"},
]

# SMD interpretation thresholds (Cohen's d)
SMD_THRESHOLDS = {
    "small": 0.2,
    "medium": 0.5,
    "large": 0.8,
}

# Outcome type → default effect measure
OUTCOME_TYPE_DEFAULT_MEASURE: Dict[str, str] = {
    "dichotomous": "RR",
    "continuous_same_scale": "MD",
    "continuous_different_scales": "SMD",
    "time_to_event": "HR",
    "case_control": "OR",
    "rare_event": "OR",
}


# ============================================================================
# Model Selection
# ============================================================================

MODELS: Dict[str, Dict[str, str]] = {
    "fixed": {
        "name": "Fixed-Effect Model",
        "assumption": "All studies estimate the SAME true effect",
        "use_when": "Studies functionally identical, or very few studies",
        "weighting": "Inverse variance only",
    },
    "random": {
        "name": "Random-Effects Model",
        "assumption": "True effects VARY across studies",
        "use_when": "Studies differ in population/setting/implementation (DEFAULT for most reviews)",
        "weighting": "Inverse variance + between-study variance (tau-squared)",
    },
}

# Tau-squared estimators
TAU_ESTIMATORS: List[Dict[str, str]] = [
    {"id": "REML", "name": "Restricted Maximum Likelihood", "note": "Recommended, less biased"},
    {"id": "DL", "name": "DerSimonian-Laird", "note": "Most common, can underestimate"},
    {"id": "PM", "name": "Paule-Mandel", "note": "Good with few studies"},
    {"id": "HKSJ", "name": "Hartung-Knapp-Sidik-Jonkman", "note": "Better CI coverage, use with REML"},
]


# ============================================================================
# Heterogeneity Interpretation
# ============================================================================

I_SQUARED_INTERPRETATION: List[Dict[str, str]] = [
    {"range": "0-40%", "label": "Might not be important", "action": "Proceed"},
    {"range": "30-60%", "label": "Moderate heterogeneity", "action": "Investigate sources"},
    {"range": "50-90%", "label": "Substantial heterogeneity", "action": "Subgroup analyses essential"},
    {"range": "75-100%", "label": "Considerable heterogeneity", "action": "Consider not pooling"},
]


def interpret_i_squared(i_squared: float) -> Dict[str, str]:
    """Interpret I-squared value."""
    if i_squared < 40:
        return {"label": "Low", "action": "Proceed with pooling"}
    elif i_squared < 60:
        return {"label": "Moderate", "action": "Investigate sources of heterogeneity"}
    elif i_squared < 75:
        return {"label": "Substantial", "action": "Subgroup analyses essential"}
    else:
        return {"label": "Considerable", "action": "Consider not pooling"}


# ============================================================================
# When NOT to Meta-Analyze (Deterministic Checks)
# ============================================================================

MIN_STUDIES_FOR_META = 3
MIN_STUDIES_FOR_FUNNEL = 10
MIN_STUDIES_FOR_META_REGRESSION = 10
MIN_EVENTS_FOR_PCURVE = 20


def can_pool(
    num_studies: int,
    i_squared: float | None = None,
) -> Dict[str, any]:
    """
    Check if pooling is appropriate.

    Returns dict with 'can_pool' bool and 'reasons' list.
    """
    issues = []

    if num_studies < MIN_STUDIES_FOR_META:
        issues.append(f"Too few studies ({num_studies} < {MIN_STUDIES_FOR_META})")

    if i_squared is not None and i_squared > 75:
        issues.append(f"Considerable heterogeneity (I² = {i_squared}%)")

    return {
        "can_pool": len(issues) == 0,
        "issues": issues,
        "recommendation": "Narrative synthesis" if issues else "Proceed with meta-analysis",
    }


# ============================================================================
# Publication Bias Methods
# ============================================================================

PUBLICATION_BIAS_METHODS: List[Dict[str, str]] = [
    {"id": "funnel", "name": "Funnel Plot", "min_studies": "10"},
    {"id": "egger", "name": "Egger's Test", "min_studies": "10"},
    {"id": "begg", "name": "Begg's Test", "min_studies": "10"},
    {"id": "trim_fill", "name": "Trim and Fill", "min_studies": "10"},
    {"id": "p_curve", "name": "P-curve", "min_studies": "20 significant results"},
]


# ============================================================================
# Sensitivity Analyses (Always Recommend)
# ============================================================================

STANDARD_SENSITIVITY_ANALYSES = [
    "Leave-one-out analysis",
    "Low RoB studies only",
    "Fixed vs. random effects comparison",
    "Remove outliers/influential studies",
    "Different effect measures (OR vs RR)",
    "Different tau-squared estimators",
]
