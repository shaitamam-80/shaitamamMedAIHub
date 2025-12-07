"""
GEMS v3.1 - Methodological Criteria Library
A Path-Adaptive Guidance Tool for Study Screening

This module contains all PICOS criteria codes used for systematic screening.
"""

from typing import Dict, Any, List

# ============================================================================
# P - POPULATION CRITERIA
# ============================================================================

POPULATION_CRITERIA: Dict[str, Dict[str, Any]] = {
    "P1": {
        "code": "P1",
        "label": "Adults (18+)",
        "description": "Studies where the main population is adults",
        "query_filter": "adult[mh]",
        "exclude": False,
    },
    "P2": {
        "code": "P2",
        "label": "Children/Adolescents (0-18)",
        "description": "Studies where the main population is children",
        "query_filter": "child[mh] OR adolescent[mh]",
        "exclude": False,
    },
    "P3": {
        "code": "P3",
        "label": "Women only",
        "description": "Studies specific to women (excluding men)",
        "query_filter": "female[mh]",
        "exclude": False,
    },
    "P4": {
        "code": "P4",
        "label": "Men only",
        "description": "Studies specific to men (excluding women)",
        "query_filter": "male[mh]",
        "exclude": False,
    },
    "P5": {
        "code": "P5",
        "label": "All ages",
        "description": "Studies with no age restrictions",
        "query_filter": None,
        "exclude": False,
    },
    "P-Ex1": {
        "code": "P-Ex1",
        "label": "Exclude Pediatrics",
        "description": "Exclude pediatric studies",
        "query_filter": "NOT (child[mh] OR adolescent[mh])",
        "exclude": True,
    },
    "P-Ex2": {
        "code": "P-Ex2",
        "label": "Exclude Geriatrics",
        "description": "Exclude geriatric studies (65+)",
        "query_filter": "NOT aged[mh]",
        "exclude": True,
    },
    "P-Ex3": {
        "code": "P-Ex3",
        "label": "Exclude Pregnant Women",
        "description": "Exclude studies on pregnant women",
        "query_filter": "NOT pregnancy[mh]",
        "exclude": True,
    },
    "P-Ex4": {
        "code": "P-Ex4",
        "label": "Exclude Rare Subpopulations",
        "description": "Exclude transplant patients, HIV, etc.",
        "query_filter": None,
        "exclude": True,
    },
}

# ============================================================================
# I - INTERVENTION CRITERIA
# ============================================================================

INTERVENTION_CRITERIA: Dict[str, Dict[str, Any]] = {
    "I1": {
        "code": "I1",
        "label": "Mention Intervention in abstract",
        "description": "The intervention must appear in title/abstract",
        "required": True,
        "exclude": False,
    },
    "I2": {
        "code": "I2",
        "label": "Mention Outcome in abstract",
        "description": "The outcome must appear in title/abstract",
        "required": True,
        "exclude": False,
    },
    "I3": {
        "code": "I3",
        "label": "Both entities must appear",
        "description": "Both intervention and outcome must appear",
        "required": True,
        "strict": True,
        "exclude": False,
    },
    "I4": {
        "code": "I4",
        "label": "One mention is sufficient",
        "description": "Sufficient for intervention OR outcome to appear",
        "required": False,
        "exclude": False,
    },
    "I-Ex1": {
        "code": "I-Ex1",
        "label": "Exclude Surgical Treatment",
        "description": "Exclude studies on surgical procedures",
        "query_filter": "NOT surgery[mh]",
        "exclude": True,
    },
}

# ============================================================================
# C - COMPARATOR CRITERIA
# ============================================================================

COMPARATOR_CRITERIA: Dict[str, Dict[str, Any]] = {
    "C1": {
        "code": "C1",
        "label": "Requires Control Group",
        "description": "Must have some kind of comparison group",
        "required": True,
        "exclude": False,
    },
    "C2": {
        "code": "C2",
        "label": "Requires Placebo Control",
        "description": "The comparison must be to placebo",
        "type": "placebo",
        "exclude": False,
    },
    "C3": {
        "code": "C3",
        "label": "Requires Active Comparator",
        "description": "The comparison must be to another treatment",
        "type": "active",
        "exclude": False,
    },
}

# ============================================================================
# O - OUTCOME CRITERIA
# ============================================================================

OUTCOME_CRITERIA: Dict[str, Dict[str, Any]] = {
    "O1": {
        "code": "O1",
        "label": "Quantitative Reporting",
        "description": "Requires p-values, effect sizes, CI",
        "required": True,
        "exclude": False,
    },
    "O2": {
        "code": "O2",
        "label": "Accepts Qualitative Results",
        "description": "Accepts qualitative studies (interviews, focus groups)",
        "accepts_qualitative": True,
        "exclude": False,
    },
    "O3": {
        "code": "O3",
        "label": "Minimum Follow-up Required",
        "description": "Requires minimum follow-up time",
        "min_followup": True,
        "exclude": False,
    },
    "O-Ex1": {
        "code": "O-Ex1",
        "label": "Exclude Diagnostics Studies",
        "description": "Exclude studies on diagnosis, test accuracy",
        "exclude": True,
    },
}

# ============================================================================
# S - STUDY DESIGN CRITERIA
# ============================================================================

STUDY_DESIGN_CRITERIA: Dict[str, Dict[str, Any]] = {
    "S1": {
        "code": "S1",
        "label": "Human Studies Only",
        "description": "Automatically excludes animal and in-vitro",
        "exclude_animal": True,
        "query_filter": "humans[mh]",
        "exclude": False,
    },
    "S2": {
        "code": "S2",
        "label": "RCTs Only",
        "description": "Only Randomized Controlled Trials",
        "types": ["rct"],
        "query_filter": "randomized controlled trial[pt]",
        "pub_types": ["Randomized Controlled Trial"],
        "exclude": False,
    },
    "S3": {
        "code": "S3",
        "label": "Clinical Studies (RCT, Cohort, CC)",
        "description": "All analytical studies",
        "types": ["rct", "cohort", "case_control"],
        "exclude": False,
    },
    "S4": {
        "code": "S4",
        "label": "Include Systematic Reviews",
        "description": "Explicitly includes reviews and meta-analyses",
        "types": ["systematic_review", "meta_analysis"],
        "exclude": False,
    },
    "S5": {
        "code": "S5",
        "label": "Include Case Reports/Series",
        "description": "Includes reports on single patients or small series",
        "types": ["case_report", "case_series"],
        "exclude": False,
    },
    # Exclusion criteria
    "S-Ex1": {
        "code": "S-Ex1",
        "label": "Exclude Animal/In-vitro",
        "description": "Exclude lab and animal studies",
        "query_filter": "NOT (animals[mh] NOT humans[mh])",
        "exclude": True,
    },
    "S-Ex2": {
        "code": "S-Ex2",
        "label": "Exclude Letters/Correspondence",
        "description": "Exclude letters to the editor",
        "query_filter": "NOT letter[pt]",
        "pub_types": ["Letter"],
        "exclude": True,
    },
    "S-Ex3": {
        "code": "S-Ex3",
        "label": "Exclude Editorials/Opinions",
        "description": "Exclude opinion pieces",
        "query_filter": "NOT editorial[pt]",
        "pub_types": ["Editorial"],
        "exclude": True,
    },
    "S-Ex4": {
        "code": "S-Ex4",
        "label": "Exclude Conference Abstracts",
        "description": "Exclude abstracts without full paper",
        "exclude": True,
    },
    "S-Ex5": {
        "code": "S-Ex5",
        "label": "Exclude Narrative Reviews",
        "description": "Exclude non-systematic reviews",
        "query_filter": "NOT review[pt]",
        "pub_types": ["Review"],
        "exclude": True,
    },
    "S-Ex6a": {
        "code": "S-Ex6a",
        "label": "Exclude Case Reports (n=1)",
        "description": "Exclude single-patient reports",
        "query_filter": "NOT case reports[pt]",
        "pub_types": ["Case Reports"],
        "exclude": True,
    },
    "S-Ex6b": {
        "code": "S-Ex6b",
        "label": "Exclude Case Series (n<10)",
        "description": "Exclude small case series",
        "exclude": True,
    },
    "S-Ex7": {
        "code": "S-Ex7",
        "label": "Exclude Theoretical Studies",
        "description": "Exclude models, hypotheses without data",
        "exclude": True,
    },
    "S-Ex8": {
        "code": "S-Ex8",
        "label": "Exclude Modeling Studies",
        "description": "Exclude simulations without real data",
        "exclude": True,
    },
    "S-Ex9": {
        "code": "S-Ex9",
        "label": "Exclude Non-Peer Reviewed",
        "description": "Exclude Preprints, Grey Literature",
        "exclude": True,
    },
    "S-Ex10": {
        "code": "S-Ex10",
        "label": "Exclude Retracted Articles",
        "description": "Exclude withdrawn articles",
        "query_filter": "NOT retracted publication[pt]",
        "pub_types": ["Retracted Publication"],
        "exclude": True,
    },
    "S-Ex11": {
        "code": "S-Ex11",
        "label": "Exclude Duplicates",
        "description": "Exclude duplicate publications",
        "exclude": True,
    },
}

# ============================================================================
# BASIC QUALITY PACK - Default exclusions bundle
# ============================================================================

BASIC_QUALITY_PACK: List[str] = [
    "S-Ex2",  # Letters/Correspondence
    "S-Ex3",  # Editorials/Opinions
    "S-Ex9",  # Non-peer reviewed
    "S-Ex10",  # Retracted articles
    "S-Ex11",  # Duplicates
]

# ============================================================================
# ALL CRITERIA - Combined dictionary
# ============================================================================

ALL_CRITERIA: Dict[str, Dict[str, Dict[str, Any]]] = {
    "population": POPULATION_CRITERIA,
    "intervention": INTERVENTION_CRITERIA,
    "comparator": COMPARATOR_CRITERIA,
    "outcome": OUTCOME_CRITERIA,
    "study_design": STUDY_DESIGN_CRITERIA,
}


def get_criteria_by_code(code: str) -> Dict[str, Any] | None:
    """Get a specific criterion by its code (e.g., 'P1', 'S-Ex2')"""
    for category in ALL_CRITERIA.values():
        if code in category:
            return category[code]
    return None


def get_exclusion_criteria() -> List[Dict[str, Any]]:
    """Get all exclusion criteria across all categories"""
    exclusions = []
    for category in ALL_CRITERIA.values():
        for code, criteria in category.items():
            if criteria.get("exclude", False):
                exclusions.append(criteria)
    return exclusions


def get_query_filters_for_codes(codes: List[str]) -> List[str]:
    """Get PubMed query filters for a list of criteria codes"""
    filters = []
    for code in codes:
        criteria = get_criteria_by_code(code)
        if criteria and criteria.get("query_filter"):
            filters.append(criteria["query_filter"])
    return filters
