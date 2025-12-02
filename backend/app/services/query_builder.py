"""
MedAI Hub - Query Builder Service
Programmatic PubMed query construction using MeSH expansion

This service builds queries WITHOUT AI, using:
1. MeSH term lookup from NCBI API
2. Validated methodological hedges
3. Framework-specific Boolean logic
"""

import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field

from .mesh_service import mesh_service, ExpandedTerms
from app.core.prompts.query import VALIDATED_HEDGES, FRAMEWORK_QUERY_LOGIC

logger = logging.getLogger(__name__)


@dataclass
class ConceptBlock:
    """Represents a single concept in the query (e.g., Population, Intervention)"""
    key: str  # P, I, C, O, etc.
    label: str  # Full name from framework
    original_value: str  # User's input
    expanded: Optional[ExpandedTerms] = None

    def to_broad_query(self) -> str:
        """Generate broad query (high sensitivity)"""
        if self.expanded:
            return self.expanded.to_broad_query()
        return f'"{self.original_value}"[tiab]'

    def to_focused_query(self) -> str:
        """Generate focused query (high precision)"""
        if self.expanded:
            return self.expanded.to_focused_query()
        return f'"{self.original_value}"[ti]'

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization - matches ConceptAnalysis schema"""
        # Map key to concept number (P=1, I=2, C=3, O=4, etc.)
        key_to_number = {"P": 1, "I": 2, "C": 3, "O": 4, "E": 5, "S": 6}
        concept_number = key_to_number.get(self.key, ord(self.key) - ord('A') + 1)

        result = {
            # Required fields for ConceptAnalysis schema
            "concept_number": concept_number,
            "component": self.label,
            "mesh_terms": [],
            "free_text_terms": [],
            # Additional fields for V2/extended info
            "key": self.key,
            "label": self.label,
            "original_value": self.original_value,
            "entry_terms": []
        }

        if self.expanded:
            # mesh_terms as strings (for ConceptAnalysis compatibility)
            result["mesh_terms"] = [
                m.descriptor_name for m in self.expanded.mesh_terms
            ]
            result["free_text_terms"] = self.expanded.free_text_terms
            result["entry_terms"] = self.expanded.entry_terms[:5]

        return result


@dataclass
class QueryStrategy:
    """Represents a complete search strategy"""
    name: str
    purpose: str
    formula: str
    query: str
    expected_yield: str
    use_cases: List[str] = field(default_factory=list)
    hedge_applied: Optional[str] = None
    hedge_citation: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        result = {
            "name": self.name,
            "purpose": self.purpose,
            "formula": self.formula,
            "query": self.query,
            "expected_yield": self.expected_yield,
            "use_cases": self.use_cases
        }
        if self.hedge_applied:
            result["hedge_applied"] = self.hedge_applied
            result["hedge_citation"] = self.hedge_citation
        return result


# Predefined toolbox filters
TOOLBOX_FILTERS = [
    # Age Filters
    {"category": "Age", "label": "Adults (19+)", "query": 'AND ("adult"[Mesh] OR adult*[tiab])', "description": "Limit to adult population (19 years and older)"},
    {"category": "Age", "label": "Children (0-18)", "query": 'AND ("child"[Mesh] OR "adolescent"[Mesh] OR child*[tiab] OR pediatric[tiab])', "description": "Limit to pediatric population"},
    {"category": "Age", "label": "Elderly (65+)", "query": 'AND ("aged"[Mesh] OR elderly[tiab] OR "older adult*"[tiab])', "description": "Limit to elderly population (65 years and older)"},

    # Article Type Filters
    {"category": "Article Type", "label": "Systematic Reviews", "query": 'AND (systematic review[pt] OR meta-analysis[pt] OR "systematic review"[tiab])', "description": "Limit to systematic reviews and meta-analyses"},
    {"category": "Article Type", "label": "RCTs Only", "query": 'AND (randomized controlled trial[pt] OR "randomized controlled trial"[tiab])', "description": "Limit to randomized controlled trials"},
    {"category": "Article Type", "label": "Clinical Trials", "query": 'AND (clinical trial[pt] OR "clinical trial"[tiab])', "description": "Limit to clinical trials"},
    {"category": "Article Type", "label": "Guidelines", "query": 'AND (practice guideline[pt] OR guideline[pt] OR "clinical guideline"[tiab])', "description": "Limit to clinical guidelines"},
    {"category": "Article Type", "label": "Observational Studies", "query": 'AND (cohort studies[Mesh] OR case-control studies[Mesh] OR observational[tiab])', "description": "Limit to observational studies"},
    {"category": "Article Type", "label": "Case Reports", "query": 'AND (case reports[pt])', "description": "Limit to case reports"},

    # Date Filters
    {"category": "Date", "label": "Last 5 Years", "query": 'AND ("last 5 years"[dp])', "description": "Published in the last 5 years"},
    {"category": "Date", "label": "Last 10 Years", "query": 'AND ("last 10 years"[dp])', "description": "Published in the last 10 years"},
    {"category": "Date", "label": "2020-Present", "query": 'AND ("2020"[dp] : "3000"[dp])', "description": "Published from 2020 onwards"},

    # Language Filters
    {"category": "Language", "label": "English Only", "query": "AND English[lang]", "description": "Limit to English language publications"},
    {"category": "Language", "label": "Free Full Text", "query": "AND free full text[sb]", "description": "Only articles with free full text available"},

    # Study Design Filters
    {"category": "Study Design", "label": "Humans Only", "query": "AND humans[Mesh]", "description": "Exclude animal-only studies"},
    {"category": "Study Design", "label": "Exclude Animals", "query": "NOT (animals[Mesh] NOT humans[Mesh])", "description": "Exclude studies on animals without human subjects"},
]


class QueryBuilder:
    """
    Programmatic PubMed query builder.

    Builds queries using:
    - MeSH expansion from NCBI API
    - Framework-specific Boolean logic
    - Validated methodological hedges
    """

    def __init__(self):
        self.mesh_service = mesh_service

    async def build_query_strategy(
        self,
        framework_data: Dict[str, str],
        framework_type: str
    ) -> Dict[str, Any]:
        """
        Build complete query strategy from framework data.

        Args:
            framework_data: Dict with framework components (P, I, C, O, etc.)
            framework_type: Framework type (PICO, PEO, etc.)

        Returns:
            Complete query strategy with concepts, strategies, and toolbox
        """
        logger.info(f"Building query for {framework_type} with {len(framework_data)} components")

        # Step 1: Expand all terms via MeSH API
        expanded_terms = await self.mesh_service.expand_framework_data(
            framework_data, framework_type
        )

        # Step 2: Build concept blocks
        concepts = self._build_concepts(framework_data, expanded_terms)

        # Step 3: Get framework-specific logic
        query_logic = FRAMEWORK_QUERY_LOGIC.get(framework_type, FRAMEWORK_QUERY_LOGIC["PICO"])
        recommended_hedge_key = query_logic.get("hedge")

        # Step 4: Build three strategies
        strategies = self._build_strategies(concepts, framework_type, recommended_hedge_key)

        # Step 5: Build result (V2 format with legacy compatibility)
        return {
            # V2 fields
            "report_intro": self._generate_report_intro(framework_type, concepts),
            "concepts": [c.to_dict() for c in concepts],
            "strategies": {
                "comprehensive": strategies[0].to_dict(),
                "direct": strategies[1].to_dict(),
                "clinical": strategies[2].to_dict()
            },
            "toolbox": TOOLBOX_FILTERS,
            "formatted_report": self._generate_formatted_report(
                framework_type, concepts, strategies
            ),

            # Legacy compatibility
            "queries": {
                "broad": strategies[0].query,
                "focused": strategies[1].query,
                "clinical_filtered": strategies[2].query
            },
            "message": f"Query strategy generated for {framework_type} framework using MeSH expansion.",

            # Metadata
            "framework_type": framework_type,
            "framework_data": framework_data,

            # Transparency (V2)
            "warnings": [],  # Empty - no warnings from programmatic builder
            "translation_status": {
                "success": True,
                "fields_translated": [],
                "fields_failed": [],
                "method": "programmatic"
            }
        }

    def _build_concepts(
        self,
        framework_data: Dict[str, str],
        expanded_terms: Dict[str, ExpandedTerms]
    ) -> List[ConceptBlock]:
        """Build concept blocks from framework data and expansions"""
        concepts = []

        for key, value in framework_data.items():
            if not value or key.lower() in ['research_question', 'framework_type']:
                continue

            concept = ConceptBlock(
                key=key,
                label=self._get_component_label(key),
                original_value=value,
                expanded=expanded_terms.get(key)
            )
            concepts.append(concept)

        return concepts

    def _get_component_label(self, key: str) -> str:
        """Get human-readable label for component key"""
        labels = {
            "P": "Population",
            "I": "Intervention",
            "C": "Comparison",
            "O": "Outcome",
            "E": "Exposure",
            "T": "Timeframe",
            "S": "Study Design",
            "F": "Prognostic Factor",
            "Condition": "Condition",
            "Context": "Context",
            "Population": "Population"
        }
        return labels.get(key, key)

    def _build_strategies(
        self,
        concepts: List[ConceptBlock],
        framework_type: str,
        hedge_key: Optional[str]
    ) -> List[QueryStrategy]:
        """
        Build three search strategies.

        For comparison questions (with C component), uses SPLIT logic:
        (P AND I AND O) OR (P AND C AND O)

        This captures:
        - Studies comparing I vs C directly
        - Studies of intervention I alone
        - Studies of comparator C alone
        """

        # Identify concept roles
        concept_map = {c.key: c for c in concepts}
        has_comparison = "C" in concept_map and concept_map["C"].original_value

        # Core concepts for PICO-family frameworks
        p_concept = concept_map.get("P")  # Population
        i_concept = concept_map.get("I")  # Intervention
        c_concept = concept_map.get("C")  # Comparison (optional)
        o_concept = concept_map.get("O")  # Outcome

        # Strategy A: Comprehensive (High Sensitivity)
        if has_comparison and p_concept and i_concept and o_concept:
            # SPLIT QUERY LOGIC for comparison questions
            # Formula: (P AND I AND O) OR (P AND C AND O)

            p_broad = p_concept.to_broad_query() if p_concept else ""
            i_broad = i_concept.to_broad_query() if i_concept else ""
            c_broad = c_concept.to_broad_query() if c_concept else ""
            o_broad = o_concept.to_broad_query() if o_concept else ""

            # Build the split query
            intervention_arm = f"({p_broad} AND {i_broad} AND {o_broad})"
            comparator_arm = f"({p_broad} AND {c_broad} AND {o_broad})"
            comprehensive_query = f"{intervention_arm} OR {comparator_arm}"

            formula = "(P AND I AND O) OR (P AND C AND O) - Split structure for comparison questions"

            logger.info(f"Built SPLIT query for comparison framework: {framework_type}")
        else:
            # Standard AND logic for non-comparison frameworks
            broad_parts = [c.to_broad_query() for c in concepts if c.to_broad_query()]
            comprehensive_query = " AND ".join(broad_parts)
            formula = "(" + ") AND (".join([c.key for c in concepts]) + ") with OR-expanded terms"

        comprehensive = QueryStrategy(
            name="Comprehensive Search (High Sensitivity)",
            purpose="Maximum recall for systematic reviews - captures all potentially relevant studies",
            formula=formula,
            query=comprehensive_query,
            expected_yield="High (500-5000+ results)",
            use_cases=[
                "Systematic reviews (Cochrane, JBI)",
                "Scoping reviews",
                "Evidence mapping",
                "When missing studies is unacceptable"
            ]
        )

        # Strategy B: Direct/Focused (High Precision)
        if has_comparison and p_concept and i_concept and c_concept and o_concept:
            # For comparison questions: require BOTH I and C to be mentioned
            # Formula: P AND I AND C AND O
            p_focused = p_concept.to_focused_query() if p_concept else ""
            i_focused = i_concept.to_focused_query() if i_concept else ""
            c_focused = c_concept.to_focused_query() if c_concept else ""
            o_focused = o_concept.to_focused_query() if o_concept else ""

            focused_query = f"{p_focused} AND {i_focused} AND {c_focused} AND {o_focused}"
            focused_formula = "P[majr] AND I[tiab] AND C[tiab] AND O[majr] - Direct comparison (requires both interventions)"
            focused_purpose = "Head-to-head comparison studies - requires both interventions mentioned"
        else:
            focused_parts = [c.to_focused_query() for c in concepts if c.to_focused_query()]
            focused_query = " AND ".join(focused_parts)
            focused_formula = "MeSH[majr] + Title terms for each concept"
            focused_purpose = "Balanced precision-recall for targeted searches"

        direct = QueryStrategy(
            name="Focused Search (High Precision)" if not has_comparison else "Direct Comparison (Head-to-Head)",
            purpose=focused_purpose,
            formula=focused_formula,
            query=focused_query,
            expected_yield="Medium (50-500 results)" if not has_comparison else "Medium-Low (20-300 results)",
            use_cases=[
                "Rapid reviews",
                "Clinical questions",
                "Initial scoping",
                "Time-limited searches"
            ] if not has_comparison else [
                "Clinical guidelines requiring direct comparison data",
                "Meta-analyses of head-to-head RCTs",
                "Comparative effectiveness research",
                "Health technology assessment"
            ]
        )

        # Strategy C: Clinical Filtered
        hedge_query = ""
        hedge_citation = ""
        if hedge_key and hedge_key in VALIDATED_HEDGES:
            hedge = VALIDATED_HEDGES[hedge_key]
            hedge_query = hedge["query"]
            hedge_citation = hedge.get("citation", "")

        if hedge_query:
            clinical_query = f"({focused_query}) AND ({hedge_query})"
        else:
            clinical_query = focused_query

        # Add humans filter
        clinical_query += " NOT (animals[Mesh] NOT humans[Mesh])"

        clinical = QueryStrategy(
            name="Clinical Filtered (Study Design Filter)",
            purpose="High-quality evidence with validated methodological hedge",
            formula="Focused query + " + (hedge_key or "Study design filter"),
            query=clinical_query,
            expected_yield="Low-Medium (20-200 results)",
            use_cases=[
                "Clinical guidelines",
                "Evidence-based practice",
                "Health technology assessment",
                "GRADE evidence profiles"
            ],
            hedge_applied=hedge_key,
            hedge_citation=hedge_citation
        )

        return [comprehensive, direct, clinical]

    def _generate_report_intro(
        self,
        framework_type: str,
        concepts: List[ConceptBlock]
    ) -> str:
        """Generate introduction text for the report"""
        concept_count = len(concepts)
        mesh_count = sum(1 for c in concepts if c.expanded and c.expanded.mesh_terms)

        # Check if this is a comparison question
        concept_keys = [c.key for c in concepts]
        has_comparison = "C" in concept_keys and any(
            c.key == "C" and c.original_value for c in concepts
        )

        comparison_note = ""
        if has_comparison:
            comparison_note = """
**Query Structure:** Split logic `(P AND I AND O) OR (P AND C AND O)` is used for the comprehensive strategy to capture:
- Studies comparing Intervention vs Comparator directly
- Studies of either intervention alone
"""

        intro = f"""## Search Strategy Report

This search strategy was generated for a **{framework_type}** research framework with {concept_count} concepts.

**MeSH Coverage:** {mesh_count}/{concept_count} concepts mapped to MeSH terms via NCBI API.
{comparison_note}
Three search strategies are provided:
1. **Comprehensive** - High sensitivity for systematic reviews
2. **{'Direct Comparison' if has_comparison else 'Focused'}** - {'Head-to-head studies' if has_comparison else 'Balanced precision-recall'}
3. **Clinical Filtered** - With validated methodological hedge
"""
        return intro

    def _generate_formatted_report(
        self,
        framework_type: str,
        concepts: List[ConceptBlock],
        strategies: List[QueryStrategy]
    ) -> str:
        """Generate complete formatted markdown report"""
        report_parts = [
            f"# PubMed Search Strategy: {framework_type}\n",
            "## Concept Analysis\n"
        ]

        # Concepts table
        for concept in concepts:
            report_parts.append(f"### {concept.key}: {concept.label}\n")
            report_parts.append(f"**Original Term:** {concept.original_value}\n")

            if concept.expanded:
                if concept.expanded.mesh_terms:
                    mesh_names = [m.descriptor_name for m in concept.expanded.mesh_terms]
                    report_parts.append(f"**MeSH Terms:** {', '.join(mesh_names)}\n")

                if concept.expanded.entry_terms:
                    report_parts.append(f"**Synonyms:** {', '.join(concept.expanded.entry_terms[:5])}\n")

            report_parts.append("\n")

        # Strategies
        report_parts.append("## Search Strategies\n")

        for i, strategy in enumerate(strategies, 1):
            report_parts.append(f"### Strategy {i}: {strategy.name}\n")
            report_parts.append(f"**Purpose:** {strategy.purpose}\n\n")
            report_parts.append(f"**Expected Yield:** {strategy.expected_yield}\n\n")
            report_parts.append("**Query:**\n```\n")
            report_parts.append(strategy.query)
            report_parts.append("\n```\n\n")

        return "".join(report_parts)


# Global singleton instance
query_builder = QueryBuilder()
