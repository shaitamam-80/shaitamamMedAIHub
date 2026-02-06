"""
MedAI Hub - Prompts Package
===========================

System prompts for LangGraph orchestration and stage-specific AI operations.
"""

from .orchestrator import (
    ORCHESTRATOR_SYSTEM_PROMPT,
    get_stage_prompt,
    get_stage_instructions,
    STAGE_PROMPTS,
)

from .research_question import (
    RESEARCH_QUESTION_SYSTEM_PROMPT,
    RESPONSE_TEMPLATE as RQ_RESPONSE_TEMPLATE,
    FRAMEWORK_DEFINITIONS,
    FINER_CRITERIA,
    get_framework_definition,
    get_all_framework_names,
    get_finer_criterion,
)

from .protocol import (
    PROTOCOL_BUILDER_SYSTEM_PROMPT,
    PROTOCOL_TEMPLATE,
    PROTOCOL_SECTIONS,
    ROB_TOOLS,
    SCOPING_REVIEW_GUIDANCE,
    get_rob_tool,
    get_protocol_section,
    get_all_protocol_sections,
    is_section_required,
)

__all__ = [
    # Orchestrator
    "ORCHESTRATOR_SYSTEM_PROMPT",
    "get_stage_prompt",
    "get_stage_instructions",
    "STAGE_PROMPTS",
    # Research Question
    "RESEARCH_QUESTION_SYSTEM_PROMPT",
    "RQ_RESPONSE_TEMPLATE",
    "FRAMEWORK_DEFINITIONS",
    "FINER_CRITERIA",
    "get_framework_definition",
    "get_all_framework_names",
    "get_finer_criterion",
    # Protocol
    "PROTOCOL_BUILDER_SYSTEM_PROMPT",
    "PROTOCOL_TEMPLATE",
    "PROTOCOL_SECTIONS",
    "ROB_TOOLS",
    "SCOPING_REVIEW_GUIDANCE",
    "get_rob_tool",
    "get_protocol_section",
    "get_all_protocol_sections",
    "is_section_required",
]
