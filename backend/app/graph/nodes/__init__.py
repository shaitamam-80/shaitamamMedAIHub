"""
MedAI Hub - LangGraph Node Implementations
==========================================

This package contains modular node implementations for the
LangGraph state machine. Each stage has its own node module
with specialized AI logic.

Nodes:
    - research_question: Research question formulation with framework detection
    - protocol: PROSPERO-ready protocol building
    - search: PubMed query construction (stub)
    - screening: Abstract/full-text screening (stub)
    - extraction: Data extraction (stub)
    - synthesis: Meta-analysis and GRADE (stub)
    - reporting: PRISMA manuscript generation (stub)
"""

from .research_question import research_question_node
from .protocol import protocol_builder_node

__all__ = [
    "research_question_node",
    "protocol_builder_node",
]
