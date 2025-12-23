"""
MedAI Hub - Query Builder Tests
Tests for the programmatic query building service with Split Query Logic

Tests cover:
1. Split Query Logic for PICO comparison questions
2. Standard AND logic for non-comparison frameworks
3. MeSH expansion integration
4. Strategy generation (Comprehensive, Direct, Clinical)
"""

import os
import sys
from unittest.mock import patch

import pytest

# Set environment variables BEFORE any app imports
os.environ.setdefault("GOOGLE_API_KEY", "test-google-api-key-12345")
os.environ.setdefault("SUPABASE_URL", "https://test-project.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "test-supabase-anon-key-12345")
os.environ.setdefault("DEBUG", "True")

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.mesh_service import ExpandedTerms, MeSHTerm
from app.services.query_builder import QueryBuilder

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def query_builder():
    """Create a QueryBuilder instance"""
    return QueryBuilder()


@pytest.fixture
def mock_expanded_terms():
    """Create mock ExpandedTerms for testing"""

    def create_expanded(original_term: str, mesh_name: str = None):
        expanded = ExpandedTerms(original_term=original_term)
        if mesh_name:
            expanded.mesh_terms = [
                MeSHTerm(
                    descriptor_ui="D123456",
                    descriptor_name=mesh_name,
                    entry_terms=["synonym1", "synonym2"],
                )
            ]
        expanded.free_text_terms = [original_term, f"{original_term}*"]
        expanded.entry_terms = ["synonym1", "synonym2"]
        return expanded

    return create_expanded


@pytest.fixture
def pico_with_comparison():
    """PICO framework data WITH comparison (C component)"""
    return {
        "P": "Adults with Generalized Anxiety Disorder",
        "I": "Cognitive Behavioral Therapy",
        "C": "Psychotropic medications (SSRIs, benzodiazepines)",
        "O": "Anxiety symptom reduction",
    }


@pytest.fixture
def pico_without_comparison():
    """PICO framework data WITHOUT comparison"""
    return {
        "P": "Elderly patients with depression",
        "I": "Exercise intervention",
        "O": "Depression symptoms",
    }


@pytest.fixture
def peo_framework():
    """PEO framework data (no comparison)"""
    return {"P": "Healthcare workers", "E": "COVID-19 exposure", "O": "Mental health outcomes"}


# ============================================================================
# Split Query Logic Tests
# ============================================================================


class TestSplitQueryLogic:
    """Test the Split Query Logic for comparison questions"""

    @pytest.mark.asyncio
    async def test_split_query_generated_for_pico_with_comparison(
        self, query_builder, pico_with_comparison, mock_expanded_terms
    ):
        """
        Test that PICO with C component generates Split Query:
        (P AND I AND O) OR (P AND C AND O)
        """
        # Mock the mesh_service.expand_framework_data
        with patch.object(query_builder.mesh_service, "expand_framework_data") as mock_expand:
            mock_expand.return_value = {
                "P": mock_expanded_terms("Adults with GAD", "Anxiety Disorders"),
                "I": mock_expanded_terms("CBT", "Cognitive Behavioral Therapy"),
                "C": mock_expanded_terms("SSRIs", "Selective Serotonin Reuptake Inhibitors"),
                "O": mock_expanded_terms("Anxiety reduction", "Anxiety"),
            }

            result = await query_builder.build_query_strategy(pico_with_comparison, "PICO")

            # Verify comprehensive strategy uses SPLIT logic
            comprehensive = result["strategies"]["comprehensive"]

            # Check that the formula mentions Split structure
            assert "Split" in comprehensive["formula"] or "OR" in comprehensive["formula"]

            # Check query contains OR between intervention and comparator arms
            query = comprehensive["query"]
            assert " OR " in query, f"Split query should contain OR: {query}"

            # Verify the query has the expected structure
            # (P AND I AND O) OR (P AND C AND O)
            assert query.count("(") >= 2, "Should have nested parentheses for split"

    @pytest.mark.asyncio
    async def test_standard_and_logic_for_pico_without_comparison(
        self, query_builder, pico_without_comparison, mock_expanded_terms
    ):
        """Test that PICO without C uses standard AND logic"""
        with patch.object(query_builder.mesh_service, "expand_framework_data") as mock_expand:
            mock_expand.return_value = {
                "P": mock_expanded_terms("Elderly with depression", "Depression"),
                "I": mock_expanded_terms("Exercise", "Exercise Therapy"),
                "O": mock_expanded_terms("Depression symptoms", "Depressive Disorder"),
            }

            result = await query_builder.build_query_strategy(pico_without_comparison, "PICO")

            comprehensive = result["strategies"]["comprehensive"]

            # Should NOT have Split in formula for non-comparison
            assert "Split" not in comprehensive["formula"]

            # Query should use AND between all concepts
            query = comprehensive["query"]
            # Count AND occurrences (should be more than OR)
            and_count = query.count(" AND ")
            query.count(" OR ")

            # The main structure should be AND-based (within concepts there's OR)
            # But between concepts it should be AND, not OR at top level
            assert and_count > 0, "Should have AND between concepts"

    @pytest.mark.asyncio
    async def test_peo_framework_uses_standard_logic(
        self, query_builder, peo_framework, mock_expanded_terms
    ):
        """Test that PEO framework (no C) uses standard AND logic"""
        with patch.object(query_builder.mesh_service, "expand_framework_data") as mock_expand:
            mock_expand.return_value = {
                "P": mock_expanded_terms("Healthcare workers", "Health Personnel"),
                "E": mock_expanded_terms("COVID exposure", "COVID-19"),
                "O": mock_expanded_terms("Mental health", "Mental Health"),
            }

            result = await query_builder.build_query_strategy(peo_framework, "PEO")

            comprehensive = result["strategies"]["comprehensive"]

            # PEO doesn't have comparison, should use standard logic
            assert "Split" not in comprehensive["formula"]


# ============================================================================
# Direct Comparison Strategy Tests
# ============================================================================


class TestDirectComparisonStrategy:
    """Test Strategy B (Direct/Focused) generation"""

    @pytest.mark.asyncio
    async def test_direct_strategy_requires_both_interventions_for_comparison(
        self, query_builder, pico_with_comparison, mock_expanded_terms
    ):
        """Test that direct strategy for comparison requires BOTH I and C"""
        with patch.object(query_builder.mesh_service, "expand_framework_data") as mock_expand:
            mock_expand.return_value = {
                "P": mock_expanded_terms("Adults with GAD", "Anxiety Disorders"),
                "I": mock_expanded_terms("CBT", "Cognitive Behavioral Therapy"),
                "C": mock_expanded_terms("SSRIs", "Serotonin Uptake Inhibitors"),
                "O": mock_expanded_terms("Anxiety reduction", "Anxiety"),
            }

            result = await query_builder.build_query_strategy(pico_with_comparison, "PICO")

            direct = result["strategies"]["direct"]

            # Should be named "Direct Comparison" for comparison questions
            assert "Direct Comparison" in direct["name"] or "Head-to-Head" in direct["name"]

            # Formula should mention both interventions
            assert "AND" in direct["query"]

            # Use cases should mention comparison data
            use_cases_text = " ".join(direct["use_cases"])
            assert any(
                kw in use_cases_text.lower() for kw in ["comparison", "head-to-head", "comparative"]
            )


# ============================================================================
# Clinical Filtered Strategy Tests
# ============================================================================


class TestClinicalFilteredStrategy:
    """Test Strategy C (Clinical Filtered) generation"""

    @pytest.mark.asyncio
    async def test_clinical_strategy_applies_hedge(
        self, query_builder, pico_with_comparison, mock_expanded_terms
    ):
        """Test that clinical strategy applies validated hedge"""
        with patch.object(query_builder.mesh_service, "expand_framework_data") as mock_expand:
            mock_expand.return_value = {
                "P": mock_expanded_terms("Adults", "Adult"),
                "I": mock_expanded_terms("CBT", "Cognitive Behavioral Therapy"),
                "C": mock_expanded_terms("Medication", "Pharmaceutical Preparations"),
                "O": mock_expanded_terms("Outcomes", "Treatment Outcome"),
            }

            result = await query_builder.build_query_strategy(pico_with_comparison, "PICO")

            clinical = result["strategies"]["clinical"]

            # Should have hedge applied
            assert (
                clinical.get("hedge_applied") is not None
                or "RCT" in clinical["query"]
                or "randomized" in clinical["query"].lower()
            )

            # Should have animal exclusion filter
            assert "animals" in clinical["query"].lower()

    @pytest.mark.asyncio
    async def test_clinical_strategy_excludes_animals(
        self, query_builder, pico_without_comparison, mock_expanded_terms
    ):
        """Test that clinical strategy excludes animal studies"""
        with patch.object(query_builder.mesh_service, "expand_framework_data") as mock_expand:
            mock_expand.return_value = {
                "P": mock_expanded_terms("Patients", "Patients"),
                "I": mock_expanded_terms("Treatment", "Therapeutics"),
                "O": mock_expanded_terms("Outcomes", "Treatment Outcome"),
            }

            result = await query_builder.build_query_strategy(pico_without_comparison, "PICO")

            clinical = result["strategies"]["clinical"]

            # Should have animal exclusion
            assert "NOT (animals" in clinical["query"] or "NOT animals" in clinical["query"]


# ============================================================================
# Report Generation Tests
# ============================================================================


class TestReportGeneration:
    """Test report intro and formatted report generation"""

    @pytest.mark.asyncio
    async def test_report_intro_mentions_split_for_comparison(
        self, query_builder, pico_with_comparison, mock_expanded_terms
    ):
        """Test that report intro explains split query for comparison questions"""
        with patch.object(query_builder.mesh_service, "expand_framework_data") as mock_expand:
            mock_expand.return_value = {
                "P": mock_expanded_terms("Adults", "Adult"),
                "I": mock_expanded_terms("CBT", "Cognitive Behavioral Therapy"),
                "C": mock_expanded_terms("Medication", "Pharmaceutical Preparations"),
                "O": mock_expanded_terms("Outcomes", "Treatment Outcome"),
            }

            result = await query_builder.build_query_strategy(pico_with_comparison, "PICO")

            intro = result["report_intro"]

            # Should mention split logic
            assert "Split" in intro or "(P AND I AND O) OR (P AND C AND O)" in intro

    @pytest.mark.asyncio
    async def test_concepts_include_mesh_details(
        self, query_builder, pico_without_comparison, mock_expanded_terms
    ):
        """Test that concepts include MeSH term details"""
        with patch.object(query_builder.mesh_service, "expand_framework_data") as mock_expand:
            mock_expand.return_value = {
                "P": mock_expanded_terms("Elderly", "Aged"),
                "I": mock_expanded_terms("Exercise", "Exercise Therapy"),
                "O": mock_expanded_terms("Depression", "Depressive Disorder"),
            }

            result = await query_builder.build_query_strategy(pico_without_comparison, "PICO")

            concepts = result["concepts"]

            # Should have concepts for each framework component
            assert len(concepts) == 3

            # Each concept should have expected keys
            for concept in concepts:
                assert "key" in concept
                assert "label" in concept
                assert "original_value" in concept
                assert "mesh_terms" in concept
                assert "free_text_terms" in concept


# ============================================================================
# Toolbox Tests
# ============================================================================


class TestToolbox:
    """Test toolbox filter generation"""

    @pytest.mark.asyncio
    async def test_toolbox_has_required_categories(
        self, query_builder, pico_without_comparison, mock_expanded_terms
    ):
        """Test that toolbox includes all required filter categories"""
        with patch.object(query_builder.mesh_service, "expand_framework_data") as mock_expand:
            mock_expand.return_value = {
                "P": mock_expanded_terms("Patients", "Patients"),
                "I": mock_expanded_terms("Treatment", "Therapeutics"),
                "O": mock_expanded_terms("Outcomes", "Treatment Outcome"),
            }

            result = await query_builder.build_query_strategy(pico_without_comparison, "PICO")

            toolbox = result["toolbox"]

            # Extract categories
            categories = {item["category"] for item in toolbox}

            # Should have key categories
            expected_categories = {"Age", "Article Type", "Date", "Language", "Study Design"}
            for expected in expected_categories:
                assert expected in categories, f"Missing category: {expected}"

    @pytest.mark.asyncio
    async def test_toolbox_filters_have_valid_queries(
        self, query_builder, pico_without_comparison, mock_expanded_terms
    ):
        """Test that toolbox filters have valid PubMed query syntax"""
        with patch.object(query_builder.mesh_service, "expand_framework_data") as mock_expand:
            mock_expand.return_value = {
                "P": mock_expanded_terms("Patients", "Patients"),
                "I": mock_expanded_terms("Treatment", "Therapeutics"),
                "O": mock_expanded_terms("Outcomes", "Treatment Outcome"),
            }

            result = await query_builder.build_query_strategy(pico_without_comparison, "PICO")

            toolbox = result["toolbox"]

            for filter_item in toolbox:
                query = filter_item["query"]
                # Should start with AND or NOT (for appending to main query)
                assert query.strip().startswith("AND") or query.strip().startswith("NOT"), (
                    f"Filter query should start with AND/NOT: {query}"
                )


# ============================================================================
# Legacy Compatibility Tests
# ============================================================================


class TestLegacyCompatibility:
    """Test that V2 response includes legacy fields"""

    @pytest.mark.asyncio
    async def test_response_includes_legacy_queries_dict(
        self, query_builder, pico_without_comparison, mock_expanded_terms
    ):
        """Test that response includes legacy 'queries' dict"""
        with patch.object(query_builder.mesh_service, "expand_framework_data") as mock_expand:
            mock_expand.return_value = {
                "P": mock_expanded_terms("Patients", "Patients"),
                "I": mock_expanded_terms("Treatment", "Therapeutics"),
                "O": mock_expanded_terms("Outcomes", "Treatment Outcome"),
            }

            result = await query_builder.build_query_strategy(pico_without_comparison, "PICO")

            # Should have legacy queries dict
            assert "queries" in result
            queries = result["queries"]
            assert "broad" in queries
            assert "focused" in queries
            assert "clinical_filtered" in queries

    @pytest.mark.asyncio
    async def test_response_includes_message_field(
        self, query_builder, pico_without_comparison, mock_expanded_terms
    ):
        """Test that response includes legacy 'message' field"""
        with patch.object(query_builder.mesh_service, "expand_framework_data") as mock_expand:
            mock_expand.return_value = {
                "P": mock_expanded_terms("Patients", "Patients"),
                "I": mock_expanded_terms("Treatment", "Therapeutics"),
                "O": mock_expanded_terms("Outcomes", "Treatment Outcome"),
            }

            result = await query_builder.build_query_strategy(pico_without_comparison, "PICO")

            # Should have message field
            assert "message" in result
            assert isinstance(result["message"], str)


# ============================================================================
# Edge Cases
# ============================================================================


class TestEdgeCases:
    """Test edge cases and error handling"""

    @pytest.mark.asyncio
    async def test_empty_comparison_not_treated_as_comparison_question(
        self, query_builder, mock_expanded_terms
    ):
        """Test that empty C value doesn't trigger split logic"""
        framework_data = {
            "P": "Patients",
            "I": "Treatment",
            "C": "",  # Empty comparison
            "O": "Outcomes",
        }

        with patch.object(query_builder.mesh_service, "expand_framework_data") as mock_expand:
            mock_expand.return_value = {
                "P": mock_expanded_terms("Patients", "Patients"),
                "I": mock_expanded_terms("Treatment", "Therapeutics"),
                "C": mock_expanded_terms("", None),  # Empty
                "O": mock_expanded_terms("Outcomes", "Treatment Outcome"),
            }

            result = await query_builder.build_query_strategy(framework_data, "PICO")

            comprehensive = result["strategies"]["comprehensive"]

            # Should NOT use split logic for empty comparison
            assert "Split" not in comprehensive["formula"]

    @pytest.mark.asyncio
    async def test_handles_missing_mesh_terms_gracefully(self, query_builder):
        """Test that query building works even when MeSH lookup fails"""
        framework_data = {
            "P": "Some obscure population",
            "I": "Novel treatment XYZ123",
            "O": "Unusual outcome measure",
        }

        with patch.object(query_builder.mesh_service, "expand_framework_data") as mock_expand:
            # Return empty ExpandedTerms (no MeSH matches)
            mock_expand.return_value = {
                "P": ExpandedTerms(original_term="Some obscure population"),
                "I": ExpandedTerms(original_term="Novel treatment XYZ123"),
                "O": ExpandedTerms(original_term="Unusual outcome measure"),
            }

            result = await query_builder.build_query_strategy(framework_data, "PICO")

            # Should still generate queries using free-text fallback
            assert result["strategies"]["comprehensive"]["query"]
            assert result["strategies"]["direct"]["query"]
            assert result["strategies"]["clinical"]["query"]
