"""
MedAI Hub - LangGraph Node Implementations
==========================================

This package contains modular node implementations for the
LangGraph state machine. Each stage has its own node module
with specialized AI logic.

Nodes:
    - idea: Research idea refinement (expert librarian consultation)
    - research_question: Research question formulation with framework detection
    - protocol: PROSPERO-ready protocol building
    - search: PubMed query construction with MeSH enrichment
    - screening: Abstract/full-text screening (rule engine + AI)
    - extraction: Structured data extraction with design detection + templates
    - risk_of_bias: RoB assessment with tool selection + judgment algorithms
    - synthesis: Meta-analysis + GRADE certainty assessment
    - reporting: PRISMA 2020 manuscript writing with journal formatting
"""

from .idea import idea_node
from .research_question import research_question_node
from .protocol import protocol_builder_node
from .search import search_node
from .screening import screening_node
from .extraction import extraction_node
from .risk_of_bias import risk_of_bias_node
from .synthesis import synthesis_node
from .reporting import reporting_node

__all__ = [
    "idea_node",
    "research_question_node",
    "protocol_builder_node",
    "search_node",
    "screening_node",
    "extraction_node",
    "risk_of_bias_node",
    "synthesis_node",
    "reporting_node",
]
