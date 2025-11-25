"""
Prompts Package
Modular system prompts for Define and Query tools
"""

from .define import get_define_system_prompt, get_extraction_prompt
from .query import get_query_system_prompt, get_simple_query_prompt, VALIDATED_HEDGES
from .shared import (
    FRAMEWORK_SCHEMAS,
    get_framework_components,
    get_framework_labels,
    format_framework_data
)

__all__ = [
    # Define tool
    "get_define_system_prompt",
    "get_extraction_prompt",

    # Query tool
    "get_query_system_prompt",
    "get_simple_query_prompt",
    "VALIDATED_HEDGES",

    # Shared utilities
    "FRAMEWORK_SCHEMAS",
    "get_framework_components",
    "get_framework_labels",
    "format_framework_data",
]
