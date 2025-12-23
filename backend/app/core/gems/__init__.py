"""GEMS - Guided Evidence Mapping & Screening"""

from .criteria_library import (
    ALL_CRITERIA,
    BASIC_QUALITY_PACK,
    COMPARATOR_CRITERIA,
    INTERVENTION_CRITERIA,
    OUTCOME_CRITERIA,
    POPULATION_CRITERIA,
    STUDY_DESIGN_CRITERIA,
    get_criteria_by_code,
    get_exclusion_criteria,
    get_query_filters_for_codes,
)
from .defaults import (
    QUICK_ANSWER_DEFAULTS,
    SCOPING_REVIEW_DEFAULTS,
    SYSTEMATIC_REVIEW_DEFAULTS,
    get_all_modes,
    get_defaults_for_mode,
    merge_with_defaults,
)

__all__ = [
    # Criteria
    "POPULATION_CRITERIA",
    "INTERVENTION_CRITERIA",
    "COMPARATOR_CRITERIA",
    "OUTCOME_CRITERIA",
    "STUDY_DESIGN_CRITERIA",
    "BASIC_QUALITY_PACK",
    "ALL_CRITERIA",
    "get_criteria_by_code",
    "get_exclusion_criteria",
    "get_query_filters_for_codes",
    # Defaults
    "SYSTEMATIC_REVIEW_DEFAULTS",
    "SCOPING_REVIEW_DEFAULTS",
    "QUICK_ANSWER_DEFAULTS",
    "get_defaults_for_mode",
    "get_all_modes",
    "merge_with_defaults",
]
