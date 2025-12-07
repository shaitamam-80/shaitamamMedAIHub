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

from .mesh_service import mesh_service, ExpandedTerms, MeSHTerm
from app.core.prompts.query import VALIDATED_HEDGES, FRAMEWORK_QUERY_LOGIC
from app.core.search_config import TOOLBOX_FILTERS, PICO_PRIORITY

logger = logging.getLogger(__name__)


async def decompose_value_to_concepts(value: str) -> List[str]:
    """
    Decompose a composite phrase into individual MeSH-searchable concepts using AI.

    For example:
    "Adults with generalized anxiety disorder" -> ["Adults", "Generalized Anxiety Disorder"]

    Args:
        value: The composite phrase to decompose

    Returns:
        List of individual concepts
    """
    # Lazy import to avoid circular dependency
    from .ai_service import ai_service

    try:
        # Use AI to decompose the value
        result = await ai_service.decompose_to_mesh_concepts(
            {"concept": value}, "GENERIC"
        )
        if result and "concept" in result:
            return result["concept"]
    except Exception as e:
        logger.warning(f"AI decomposition failed for '{value}': {e}")

    # Fallback: return original value as single item
    return [value]


@dataclass
class ConceptBlock:
    """
    Represents a single concept in the query (e.g., Population, Intervention).

    IMPORTANT: Different PICO components use different logic for decomposed terms:

    - P (Population): "Adults with GAD" → AND (must be both adults AND have GAD)
    - I, C (Intervention/Comparison): "CBT or SSRIs" → OR (either treatment works)
    - O (Outcome): "ADL, Treatment Outcome, Time" → OR (any outcome measure)

    Within each sub-concept, synonyms are ALWAYS connected with OR.
    """
    key: str  # P, I, C, O, etc.
    label: str  # Full name from framework
    original_value: str  # User's input
    expanded_list: List[ExpandedTerms] = field(default_factory=list)  # List of sub-concepts

    def _get_join_operator(self) -> str:
        """
        Determine the operator to join decomposed sub-concepts.

        - Population (P): AND - "Adults with GAD" means BOTH must be present
        - Everything else (I, C, O, E, etc.): OR - any of the terms is sufficient
        """
        # Population requires intersection (AND)
        if self.key.upper() == "P":
            return " AND "
        # All other components use union (OR) - more permissive
        return " OR "

    def to_broad_query(self) -> str:
        """
        Generate broad query (high sensitivity).

        Population uses AND between decomposed terms (must match all).
        Other components (I, C, O) use OR (match any).

        Examples:
        - P: "Adults with GAD" → (Adults) AND (GAD)
        - O: "ADL, Treatment Outcome" → (ADL) OR (Treatment Outcome)
        """
        if not self.expanded_list:
            return f'"{self.original_value}"[tiab]'

        if len(self.expanded_list) == 1:
            # Single concept - just return its broad query
            return self.expanded_list[0].to_broad_query()

        # Multiple decomposed concepts - join with appropriate operator
        sub_queries = []
        for expanded in self.expanded_list:
            sub_query = expanded.to_broad_query()
            if sub_query:
                sub_queries.append(f"({sub_query})")

        if not sub_queries:
            return f'"{self.original_value}"[tiab]'

        # Join with AND for Population, OR for others
        join_op = self._get_join_operator()
        return join_op.join(sub_queries)

    def to_focused_query(self) -> str:
        """
        Generate focused query (higher precision but still usable).

        Uses [tiab] instead of [ti] to avoid 0 results.
        """
        if not self.expanded_list:
            return f'"{self.original_value}"[tiab]'

        if len(self.expanded_list) == 1:
            return self.expanded_list[0].to_focused_query()

        # Multiple decomposed concepts - join with appropriate operator
        sub_queries = []
        for expanded in self.expanded_list:
            sub_query = expanded.to_focused_query()
            if sub_query:
                sub_queries.append(f"({sub_query})")

        if not sub_queries:
            return f'"{self.original_value}"[tiab]'

        join_op = self._get_join_operator()
        return join_op.join(sub_queries)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization - matches ConceptAnalysis schema"""
        # Use PICO_PRIORITY from search_config for consistent numbering
        # For full-word keys, normalize to single letter first
        key_normalization = {
            "population": "P", "intervention": "I", "comparator": "C",
            "comparison": "C", "outcome": "O", "exposure": "E",
            "timeframe": "T", "study": "S", "factor": "F"
        }
        # Normalize key: single letter stays as-is, full word maps to letter
        normalized_key = self.key.upper() if len(self.key) == 1 else key_normalization.get(self.key.lower(), self.key[0].upper())
        concept_number = PICO_PRIORITY.get(normalized_key, 99)  # Use centralized priority

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
            "entry_terms": [],
            # Show decomposed sub-concepts
            "sub_concepts": []
        }

        # Aggregate all MeSH terms and free-text from all sub-concepts
        all_mesh = []
        all_free_text = []
        all_entry_terms = []
        sub_concepts = []

        for expanded in self.expanded_list:
            all_mesh.extend([m.descriptor_name for m in expanded.mesh_terms])
            all_free_text.extend(expanded.free_text_terms)
            all_entry_terms.extend(expanded.entry_terms[:5])  # Limit per sub-concept
            sub_concepts.append({
                "term": expanded.original_term,
                "mesh_terms": [m.descriptor_name for m in expanded.mesh_terms],
                "free_text": expanded.free_text_terms
            })

        result["mesh_terms"] = all_mesh
        result["free_text_terms"] = all_free_text
        result["entry_terms"] = all_entry_terms[:10]  # Overall limit
        result["sub_concepts"] = sub_concepts

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

        # Step 1: Decompose composite phrases into individual MeSH-searchable concepts
        # Example: "Adults with GAD" -> ["Adults", "Generalized Anxiety Disorder"]
        from .ai_service import ai_service
        try:
            decomposed = await ai_service.decompose_to_mesh_concepts(
                framework_data, framework_type
            )
            logger.info(f"Decomposed concepts: {decomposed}")
        except Exception as e:
            logger.warning(f"AI decomposition failed: {e}, using original values")
            decomposed = {k: [v] for k, v in framework_data.items() if v}

        # Step 2: Expand all decomposed terms via MeSH API
        # IMPORTANT: Keep each decomposed term SEPARATE, don't merge!
        # "Adults with GAD" decomposes to ["Adults", "GAD"]
        # Each should be its own sub-query connected with AND, not merged with OR
        expanded_terms: Dict[str, List[ExpandedTerms]] = {}  # List of ExpandedTerms per key
        for key, terms in decomposed.items():
            expanded_list = []
            for term in terms:
                term_expanded = await self.mesh_service.expand_term(term)
                if term_expanded and (term_expanded.mesh_terms or term_expanded.entry_terms or term_expanded.free_text_terms):
                    expanded_list.append(term_expanded)
                else:
                    # No MeSH found, create simple free-text ExpandedTerms
                    expanded_list.append(ExpandedTerms(
                        original_term=term,
                        mesh_terms=[],
                        entry_terms=[],
                        free_text_terms=[f'"{term}"']
                    ))
            expanded_terms[key] = expanded_list

        # Step 3: Build concept blocks
        concepts = self._build_concepts(framework_data, expanded_terms)

        # Step 4: Get framework-specific logic
        query_logic = FRAMEWORK_QUERY_LOGIC.get(framework_type, FRAMEWORK_QUERY_LOGIC["PICO"])
        recommended_hedge_key = query_logic.get("hedge")

        # Step 5: Build three strategies
        strategies = self._build_strategies(concepts, framework_type, recommended_hedge_key)

        # Step 6: Build result (V2 format with legacy compatibility)
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
        expanded_terms: Dict[str, List[ExpandedTerms]]
    ) -> List[ConceptBlock]:
        """
        Build concept blocks from framework data and expansions.

        Each concept may have multiple ExpandedTerms (from decomposition).
        For example, "Adults with GAD" decomposes to ["Adults", "GAD"],
        resulting in a List[ExpandedTerms] for that key.
        """
        concepts = []
        seen_labels = set()  # Track which component types we've already added

        # Map full-word keys to single-letter keys for normalization
        key_normalization = {
            "population": "P", "intervention": "I", "comparator": "C",
            "comparison": "C", "outcome": "O", "exposure": "E",
            "timeframe": "T", "study": "S", "factor": "F"
        }

        # Prioritize single-letter keys (P, I, C, O) over full-word keys, then by PICO order
        sorted_keys = sorted(
            framework_data.keys(),
            key=lambda k: (
                len(k) > 1,  # Single-letter keys first
                PICO_PRIORITY.get(k.upper(), 99)  # Then by PICO priority (P=1, I=2, C=3, O=4...)
            )
        )

        for key in sorted_keys:
            value = framework_data[key]
            if not value or key.lower() in ['research_question', 'framework_type']:
                continue

            # Normalize key to get the component label
            normalized_key = key_normalization.get(key.lower(), key)
            label = self._get_component_label(key)

            # Skip if we've already seen this component type
            if label in seen_labels:
                logger.debug(f"Skipping duplicate component: {key} -> {label}")
                continue

            seen_labels.add(label)

            # Use single-letter key for display if possible
            display_key = normalized_key if len(normalized_key) == 1 else key[0].upper()

            # Get the list of ExpandedTerms for this key (may have multiple from decomposition)
            expanded_list = expanded_terms.get(key, [])

            concept = ConceptBlock(
                key=display_key,
                label=label,
                original_value=value,
                expanded_list=expanded_list  # Pass the list, not single item
            )
            concepts.append(concept)

        return concepts

    def _get_component_label(self, key: str) -> str:
        """Get human-readable label for component key"""
        labels = {
            # Single-letter keys
            "P": "Population",
            "I": "Intervention",
            "C": "Comparison",
            "O": "Outcome",
            "E": "Exposure",
            "T": "Timeframe",
            "S": "Study Design",
            "F": "Prognostic Factor",
            # Full-word keys (lowercase)
            "population": "Population",
            "intervention": "Intervention",
            "comparator": "Comparison",
            "comparison": "Comparison",
            "outcome": "Outcome",
            "exposure": "Exposure",
            "timeframe": "Timeframe",
            "study": "Study Design",
            "factor": "Prognostic Factor",
            # Title case variants
            "Condition": "Condition",
            "Context": "Context",
            "Population": "Population"
        }
        # Try exact match first, then lowercase
        return labels.get(key, labels.get(key.lower(), key.title()))

    def _combine_concepts_broad(
        self,
        concepts: List[ConceptBlock],
        operator: str = "OR"
    ) -> str:
        """
        Combine multiple ConceptBlocks into a single query block.

        Args:
            concepts: List of ConceptBlocks to combine
            operator: "AND" or "OR" to join them

        Returns:
            Combined query string
        """
        if not concepts:
            return ""

        parts = []
        for concept in concepts:
            query = concept.to_broad_query()
            if query:
                parts.append(f"({query})")

        if not parts:
            return ""

        if len(parts) == 1:
            return parts[0]

        return f" {operator} ".join(parts)

    def _combine_concepts_focused(
        self,
        concepts: List[ConceptBlock],
        operator: str = "OR"
    ) -> str:
        """
        Combine multiple ConceptBlocks into a single focused query block.

        Args:
            concepts: List of ConceptBlocks to combine
            operator: "AND" or "OR" to join them

        Returns:
            Combined focused query string
        """
        if not concepts:
            return ""

        parts = []
        for concept in concepts:
            query = concept.to_focused_query()
            if query:
                parts.append(f"({query})")

        if not parts:
            return ""

        if len(parts) == 1:
            return parts[0]

        return f" {operator} ".join(parts)

    def _build_strategies(
        self,
        concepts: List[ConceptBlock],
        framework_type: str,
        hedge_key: Optional[str]
    ) -> List[QueryStrategy]:
        """
        Build three search strategies using Outcome-OR model.

        Query Structure (Optimal Model):
        P AND (I OR C) AND O

        Where:
        - P: Population terms joined with AND (must match all)
        - I OR C: Interventions/Comparators joined with OR (match any)
        - O: Outcomes joined with OR (match any)

        Note: We use P AND (I OR C) AND O instead of split logic
        (P AND I AND O) OR (P AND C AND O) because they are mathematically
        equivalent but the former is shorter and cleaner.
        """

        # Group concepts by PICO role
        p_concepts = [c for c in concepts if c.key == "P"]
        i_concepts = [c for c in concepts if c.key == "I"]
        c_concepts = [c for c in concepts if c.key == "C"]
        o_concepts = [c for c in concepts if c.key == "O"]
        other_concepts = [c for c in concepts if c.key not in ["P", "I", "C", "O"]]

        has_comparison = len(c_concepts) > 0 and any(c.original_value for c in c_concepts)

        # Build combined blocks for each PICO component
        # P: All population terms joined with AND
        p_broad = self._combine_concepts_broad(p_concepts, "AND") if p_concepts else ""
        p_focused = self._combine_concepts_focused(p_concepts, "AND") if p_concepts else ""

        # I: All intervention terms joined with OR
        i_broad = self._combine_concepts_broad(i_concepts, "OR") if i_concepts else ""
        i_focused = self._combine_concepts_focused(i_concepts, "OR") if i_concepts else ""

        # C: All comparison terms joined with OR
        c_broad = self._combine_concepts_broad(c_concepts, "OR") if c_concepts else ""
        c_focused = self._combine_concepts_focused(c_concepts, "OR") if c_concepts else ""

        # O: All outcome terms joined with OR
        o_broad = self._combine_concepts_broad(o_concepts, "OR") if o_concepts else ""
        o_focused = self._combine_concepts_focused(o_concepts, "OR") if o_concepts else ""

        # Combine I and C into single block with OR (Outcome-OR model)
        intervention_combined = ""
        if i_broad and c_broad:
            intervention_combined = f"({i_broad} OR {c_broad})"
        else:
            intervention_combined = i_broad or c_broad

        intervention_focused_combined = ""
        if i_focused and c_focused:
            intervention_focused_combined = f"({i_focused} OR {c_focused})"
        else:
            intervention_focused_combined = i_focused or c_focused

        # Strategy A: Comprehensive (High Sensitivity) - Always use P AND (I OR C) AND O
        parts = []
        if p_broad:
            parts.append(p_broad)
        if intervention_combined:
            parts.append(intervention_combined)
        if o_broad:
            parts.append(o_broad)
        # Add other concepts if any (like Context, Time, etc.)
        for c in other_concepts:
            part = c.to_broad_query()
            if part:
                parts.append(part)

        comprehensive_query = " AND ".join(parts) if parts else ""
        formula = "P AND (I OR C) AND O" if has_comparison else "P AND I AND O"
        if has_comparison:
            logger.info(f"Built Outcome-OR query for comparison framework: {framework_type}")

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

        # Strategy B: Direct/Focused (Higher Precision)
        # NOTE: Now uses [Mesh] and [tiab] instead of [Majr] and [ti] to avoid 0 results
        if has_comparison and p_focused and i_focused and c_focused and o_broad:
            # For comparison questions: require BOTH I and C to be mentioned
            focused_query = f"{p_focused} AND {i_focused} AND {c_focused} AND {o_broad}"
            focused_formula = "P[Mesh/tiab] AND I[Mesh/tiab] AND C[Mesh/tiab] AND O[Mesh/tiab]"
            focused_purpose = "Head-to-head comparison studies - requires both interventions mentioned"
        elif p_focused and intervention_focused_combined and o_broad:
            # Standard PICO structure for focused
            focused_query = f"{p_focused} AND {intervention_focused_combined} AND {o_broad}"
            focused_formula = "P[Mesh/tiab] AND (I OR C)[Mesh/tiab] AND O[Mesh/tiab]"
            focused_purpose = "Balanced precision-recall for targeted searches"
        else:
            # Fallback
            parts = [p for p in [p_focused, intervention_focused_combined, o_broad] if p]
            for c in other_concepts:
                part = c.to_focused_query()
                if part:
                    parts.append(part)
            focused_query = " AND ".join(parts) if parts else ""
            focused_formula = "P[Mesh/tiab] + I/C[Mesh/tiab] + O[Mesh/tiab]"
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
        # NOTE: Use comprehensive_query as base (not focused_query) to avoid "double cutting"
        # Hedge already filters aggressively, so we need the broader base for reasonable results
        hedge_query = ""
        hedge_citation = ""
        if hedge_key and hedge_key in VALIDATED_HEDGES:
            hedge = VALIDATED_HEDGES[hedge_key]
            hedge_query = hedge["query"]
            hedge_citation = hedge.get("citation", "")

        # Use comprehensive as base, fall back to focused if comprehensive is empty
        base_query = comprehensive_query if comprehensive_query else focused_query
        if hedge_query:
            clinical_query = f"({base_query}) AND ({hedge_query})"
        else:
            clinical_query = base_query

        # Add humans filter only if not already present in hedge/query
        # (Cochrane hedge already contains "NOT (animals[mh] NOT humans[mh])")
        if "animals[mh]" not in clinical_query.lower() and "animals[mesh]" not in clinical_query.lower():
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
        # Count concepts that have at least one MeSH term in any sub-concept
        mesh_count = sum(1 for c in concepts if any(exp.mesh_terms for exp in c.expanded_list))

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

            # Show decomposed sub-concepts if multiple
            if len(concept.expanded_list) > 1:
                report_parts.append(f"**Decomposed into:** {len(concept.expanded_list)} sub-concepts (connected with AND)\n")

            # Aggregate MeSH terms and synonyms from all sub-concepts
            all_mesh_names = []
            all_synonyms = []
            for expanded in concept.expanded_list:
                all_mesh_names.extend([m.descriptor_name for m in expanded.mesh_terms])
                all_synonyms.extend(expanded.entry_terms[:3])  # Limit per sub-concept

            if all_mesh_names:
                report_parts.append(f"**MeSH Terms:** {', '.join(all_mesh_names)}\n")

            if all_synonyms:
                report_parts.append(f"**Synonyms:** {', '.join(all_synonyms[:5])}\n")

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
