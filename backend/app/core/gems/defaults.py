"""
GEMS v3.1 - Path-Adaptive Defaults
Default criteria configurations for each review type
"""

from typing import Dict, Any, List
from .criteria_library import BASIC_QUALITY_PACK

# ============================================================================
# SYSTEMATIC REVIEW DEFAULTS
# ============================================================================

SYSTEMATIC_REVIEW_DEFAULTS: Dict[str, Any] = {
    "review_mode": "systematic",
    "description": "Two-stage screening for comprehensive systematic reviews",
    "best_for": ["Cochrane reviews", "Meta-analyses", "PRISMA-compliant reviews"],

    "population": {
        "age_groups": ["adults"],
        "sex": "all",
        "special_conditions": [],
        "exclusions": []
    },

    "intervention": {
        "must_appear_in_abstract": True,
        "exclude_surgical": False
    },

    "comparator": {
        "required": True,
        "type": "any"  # placebo, active, standard_care, any
    },

    "outcome": {
        "requires_quantitative": True,
        "accepts_qualitative": False,
        "minimum_followup": None,
        "exclude_diagnostics": False
    },

    "study_design": {
        "human_only": True,
        "allowed_types": ["rct", "cohort", "case_control"],
        "excluded_types": [
            "systematic_review", "meta_analysis", "narrative_review",
            "case_report", "case_series", "editorial", "letter"
        ],
        "quality_pack": True,
        "quality_pack_codes": BASIC_QUALITY_PACK
    },

    "screening": {
        "stages": 2,  # Stage 1: AI, Stage 2: Human validation
        "requires_human_validation": True,
        "track_inter_rater_reliability": True
    }
}

# ============================================================================
# SCOPING REVIEW DEFAULTS
# ============================================================================

SCOPING_REVIEW_DEFAULTS: Dict[str, Any] = {
    "review_mode": "scoping",
    "description": "AI-only screening for rapid evidence mapping",
    "best_for": ["Literature mapping", "Pilot searches", "Gap analysis"],

    "population": {
        "age_groups": ["all"],
        "sex": "all",
        "special_conditions": [],
        "exclusions": []
    },

    "intervention": {
        "must_appear_in_abstract": False,  # More lenient
        "exclude_surgical": False
    },

    "comparator": {
        "required": False,  # Not required for scoping
        "type": None
    },

    "outcome": {
        "requires_quantitative": False,
        "accepts_qualitative": True,
        "minimum_followup": None,
        "exclude_diagnostics": False
    },

    "study_design": {
        "human_only": False,  # May include animal for some scoping reviews
        "allowed_types": ["all"],  # Include everything
        "excluded_types": [],  # Only retracted/duplicates
        "quality_pack": False,  # Don't auto-exclude
        "quality_pack_codes": ["S-Ex10", "S-Ex11"]  # Only retracted and duplicates
    },

    "screening": {
        "stages": 1,  # AI-only
        "requires_human_validation": False,
        "track_inter_rater_reliability": False
    }
}

# ============================================================================
# QUICK CLINICAL ANSWER DEFAULTS
# ============================================================================

QUICK_ANSWER_DEFAULTS: Dict[str, Any] = {
    "review_mode": "quick",
    "description": "Rapid AI screening with synthesis for clinical questions",
    "best_for": ["Clinical queries", "Teaching", "Rapid answers", "Point-of-care"],

    "population": {
        "age_groups": ["adults"],
        "sex": "all",
        "special_conditions": [],
        "exclusions": []
    },

    "intervention": {
        "must_appear_in_abstract": True,
        "exclude_surgical": False
    },

    "comparator": {
        "required": False,
        "type": None
    },

    "outcome": {
        "requires_quantitative": False,
        "accepts_qualitative": False,
        "minimum_followup": None,
        "exclude_diagnostics": True  # Focus on treatment
    },

    "study_design": {
        "human_only": True,
        "allowed_types": ["systematic_review", "meta_analysis", "rct"],
        "excluded_types": [
            "case_report", "case_series", "editorial", "letter",
            "narrative_review", "conference_abstract"
        ],
        "quality_pack": True,
        "quality_pack_codes": BASIC_QUALITY_PACK,
        "prioritize": "strongest_evidence"  # SR/MA > RCT > Cohort
    },

    "date_filter": {
        "enabled": True,
        "years": 5  # Last 5 years
    },

    "screening": {
        "stages": 1,  # AI-only with synthesis
        "requires_human_validation": False,
        "generate_synthesis": True,  # AI generates summary
        "max_articles_for_synthesis": 10
    }
}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_defaults_for_mode(mode: str) -> Dict[str, Any]:
    """Get default criteria for a review mode"""
    defaults_map = {
        "systematic": SYSTEMATIC_REVIEW_DEFAULTS,
        "scoping": SCOPING_REVIEW_DEFAULTS,
        "quick": QUICK_ANSWER_DEFAULTS
    }
    return defaults_map.get(mode, SYSTEMATIC_REVIEW_DEFAULTS)


def get_all_modes() -> List[Dict[str, Any]]:
    """Get summary of all available review modes"""
    return [
        {
            "mode": "systematic",
            "name": "Systematic Review",
            "icon": "📊",
            "description": SYSTEMATIC_REVIEW_DEFAULTS["description"],
            "best_for": SYSTEMATIC_REVIEW_DEFAULTS["best_for"],
            "stages": SYSTEMATIC_REVIEW_DEFAULTS["screening"]["stages"]
        },
        {
            "mode": "scoping",
            "name": "Scoping Review",
            "icon": "🔍",
            "description": SCOPING_REVIEW_DEFAULTS["description"],
            "best_for": SCOPING_REVIEW_DEFAULTS["best_for"],
            "stages": SCOPING_REVIEW_DEFAULTS["screening"]["stages"]
        },
        {
            "mode": "quick",
            "name": "Quick Clinical Answer",
            "icon": "⚡",
            "description": QUICK_ANSWER_DEFAULTS["description"],
            "best_for": QUICK_ANSWER_DEFAULTS["best_for"],
            "stages": QUICK_ANSWER_DEFAULTS["screening"]["stages"]
        }
    ]


def merge_with_defaults(mode: str, custom_criteria: Dict[str, Any]) -> Dict[str, Any]:
    """Merge custom criteria with defaults for a mode"""
    import copy
    defaults = copy.deepcopy(get_defaults_for_mode(mode))

    # Deep merge
    def deep_merge(base: dict, override: dict) -> dict:
        for key, value in override.items():
            if key in base and isinstance(base[key], dict) and isinstance(value, dict):
                deep_merge(base[key], value)
            else:
                base[key] = value
        return base

    return deep_merge(defaults, custom_criteria)
