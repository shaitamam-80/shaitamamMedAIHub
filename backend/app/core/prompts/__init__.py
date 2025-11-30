"""
Prompts Package
Modular system prompts for Define and Query tools

Version: 2025.01
Implements the "Systematic Review Question Architect" methodology
"""

# Define tool exports
from .define import (
    get_define_system_prompt,
    get_extraction_prompt,
    get_response_template,
    get_finer_assessment_prompt
)

# Query tool exports
from .query import (
    get_query_system_prompt,
    get_simple_query_prompt,
    get_hedge_for_framework,
    get_all_hedges,
    get_framework_query_logic,
    get_proximity_query,
    get_proximity_guide,
    VALIDATED_HEDGES,
    FRAMEWORK_QUERY_LOGIC,
    PROXIMITY_SEARCH_GUIDE
)

# Shared utilities exports
from .shared import (
    FRAMEWORK_SCHEMAS,
    FRAMEWORK_VERSION,
    FRAMEWORK_LAST_UPDATED,
    FRAMEWORK_CHEAT_SHEET,
    CROSS_TYPE_GUIDANCE,
    USER_RESISTANCE_RESPONSES,
    HEBREW_GUIDELINES,
    INSUFFICIENT_INFO_RESPONSES,
    FINER_ASSESSMENT_SCHEMA,
    get_framework_components,
    get_framework_labels,
    get_framework_use_case,
    get_framework_trigger_words,
    format_framework_data,
    suggest_framework_from_text,
    validate_custom_framework,
    get_all_framework_names,
    get_framework_count
)

__all__ = [
    # Define tool
    "get_define_system_prompt",
    "get_extraction_prompt",
    "get_response_template",
    "get_finer_assessment_prompt",

    # Query tool
    "get_query_system_prompt",
    "get_simple_query_prompt",
    "get_hedge_for_framework",
    "get_all_hedges",
    "get_framework_query_logic",
    "get_proximity_query",
    "get_proximity_guide",
    "VALIDATED_HEDGES",
    "FRAMEWORK_QUERY_LOGIC",
    "PROXIMITY_SEARCH_GUIDE",

    # Shared utilities
    "FRAMEWORK_SCHEMAS",
    "FRAMEWORK_VERSION",
    "FRAMEWORK_LAST_UPDATED",
    "FRAMEWORK_CHEAT_SHEET",
    "CROSS_TYPE_GUIDANCE",
    "USER_RESISTANCE_RESPONSES",
    "HEBREW_GUIDELINES",
    "INSUFFICIENT_INFO_RESPONSES",
    "FINER_ASSESSMENT_SCHEMA",
    "get_framework_components",
    "get_framework_labels",
    "get_framework_use_case",
    "get_framework_trigger_words",
    "format_framework_data",
    "suggest_framework_from_text",
    "validate_custom_framework",
    "get_all_framework_names",
    "get_framework_count",
]
