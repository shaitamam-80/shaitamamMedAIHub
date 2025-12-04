"""
Tests for MeSH Service

Tests MeSH term lookup, expansion, and caching integration.
Includes error path testing for API failures, timeouts, and malformed responses.
"""

import pytest
from datetime import timedelta
from unittest.mock import patch, AsyncMock, MagicMock
import httpx

from app.services.mesh_service import (
    MeSHService,
    MeSHTerm,
    ExpandedTerms,
    mesh_service,
)


# ============================================================================
# MeSHTerm Tests
# ============================================================================

class TestMeSHTerm:
    """Tests for MeSHTerm dataclass"""

    def test_to_mesh_query_default(self):
        """Test default MeSH query generation (with explosion)"""
        term = MeSHTerm(
            descriptor_ui="D003920",
            descriptor_name="Diabetes Mellitus",
            entry_terms=["DM"],
            tree_numbers=["C18.452.394.750"],
            scope_note=""
        )
        query = term.to_mesh_query()
        assert query == '"Diabetes Mellitus"[Mesh]'

    def test_to_mesh_query_noexp(self):
        """Test MeSH query without explosion"""
        term = MeSHTerm(
            descriptor_ui="D003920",
            descriptor_name="Diabetes Mellitus"
        )
        query = term.to_mesh_query("noexp")
        assert query == '"Diabetes Mellitus"[Mesh:noexp]'

    def test_to_mesh_query_majr(self):
        """Test MeSH query as major topic"""
        term = MeSHTerm(
            descriptor_ui="D003920",
            descriptor_name="Diabetes Mellitus"
        )
        query = term.to_mesh_query("majr")
        assert query == '"Diabetes Mellitus"[Majr]'


# ============================================================================
# ExpandedTerms Tests
# ============================================================================

class TestExpandedTerms:
    """Tests for ExpandedTerms dataclass"""

    def test_to_broad_query_with_mesh(self):
        """Test broad query generation with MeSH terms"""
        mesh = MeSHTerm(
            descriptor_ui="D003920",
            descriptor_name="Diabetes Mellitus",
            entry_terms=["DM", "Sugar Disease"]
        )
        expanded = ExpandedTerms(
            original_term="diabetes",
            mesh_terms=[mesh],
            free_text_terms=['"diabetes"'],
            entry_terms=["DM"]
        )

        query = expanded.to_broad_query()

        assert '"Diabetes Mellitus"[Mesh]' in query
        assert '"diabetes"[tiab]' in query
        assert 'DM[tiab]' in query
        assert query.startswith("(")
        assert query.endswith(")")
        assert " OR " in query

    def test_to_broad_query_without_mesh(self):
        """Test broad query generation when no MeSH match"""
        expanded = ExpandedTerms(
            original_term="some rare term",
            mesh_terms=[],
            free_text_terms=[],
            entry_terms=[]
        )

        query = expanded.to_broad_query()

        # Should fall back to original term
        assert '"some rare term"[tiab]' in query

    def test_to_focused_query(self):
        """Test focused query generation"""
        mesh = MeSHTerm(
            descriptor_ui="D003920",
            descriptor_name="Diabetes Mellitus"
        )
        expanded = ExpandedTerms(
            original_term="diabetes",
            mesh_terms=[mesh]
        )

        query = expanded.to_focused_query()

        assert '"Diabetes Mellitus"[Majr]' in query
        assert 'diabetes[ti]' in query

    def test_to_dict_serialization(self):
        """Test serialization to dict"""
        mesh = MeSHTerm(
            descriptor_ui="D003920",
            descriptor_name="Diabetes Mellitus",
            entry_terms=["DM"],
            tree_numbers=["C18"],
            scope_note="A metabolic disease"
        )
        expanded = ExpandedTerms(
            original_term="diabetes",
            mesh_terms=[mesh],
            free_text_terms=['"diabetes"'],
            entry_terms=["DM"]
        )

        data = expanded.to_dict()

        assert data["original_term"] == "diabetes"
        assert len(data["mesh_terms"]) == 1
        assert data["mesh_terms"][0]["descriptor_name"] == "Diabetes Mellitus"
        assert data["free_text_terms"] == ['"diabetes"']

    def test_from_dict_deserialization(self):
        """Test deserialization from dict"""
        data = {
            "original_term": "diabetes",
            "mesh_terms": [
                {
                    "descriptor_ui": "D003920",
                    "descriptor_name": "Diabetes Mellitus",
                    "entry_terms": ["DM"],
                    "tree_numbers": ["C18"],
                    "scope_note": "A metabolic disease"
                }
            ],
            "free_text_terms": ['"diabetes"'],
            "entry_terms": ["DM"]
        }

        expanded = ExpandedTerms.from_dict(data)

        assert expanded.original_term == "diabetes"
        assert len(expanded.mesh_terms) == 1
        assert expanded.mesh_terms[0].descriptor_name == "Diabetes Mellitus"

    def test_roundtrip_serialization(self):
        """Test that to_dict -> from_dict preserves data"""
        mesh = MeSHTerm(
            descriptor_ui="D003920",
            descriptor_name="Diabetes Mellitus",
            entry_terms=["DM", "Sugar Disease"],
            tree_numbers=["C18.452.394.750"],
            scope_note="A metabolic disease"
        )
        original = ExpandedTerms(
            original_term="diabetes mellitus",
            mesh_terms=[mesh],
            free_text_terms=['"diabetes mellitus"', "diabetes*"],
            entry_terms=["DM", "Sugar Disease"]
        )

        # Roundtrip
        data = original.to_dict()
        restored = ExpandedTerms.from_dict(data)

        assert restored.original_term == original.original_term
        assert len(restored.mesh_terms) == len(original.mesh_terms)
        assert restored.mesh_terms[0].descriptor_name == original.mesh_terms[0].descriptor_name
        assert restored.free_text_terms == original.free_text_terms
        assert restored.entry_terms == original.entry_terms


# ============================================================================
# MeSHService Error Path Tests
# ============================================================================

class TestMeSHServiceErrorPaths:
    """Tests for MeSH service error handling"""

    @pytest.fixture
    def service(self):
        """Create a fresh MeSHService for each test"""
        return MeSHService()

    @pytest.mark.asyncio
    async def test_search_mesh_timeout(self, service):
        """Test graceful handling of NCBI API timeout"""
        with patch('httpx.AsyncClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client.get.side_effect = httpx.TimeoutException("Request timed out")
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock()
            mock_client_class.return_value = mock_client

            result = await service.search_mesh("diabetes")

            # Should return empty list, not raise exception
            assert result == []

    @pytest.mark.asyncio
    async def test_search_mesh_network_error(self, service):
        """Test handling of network connection errors"""
        with patch('httpx.AsyncClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client.get.side_effect = httpx.ConnectError("Connection refused")
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock()
            mock_client_class.return_value = mock_client

            result = await service.search_mesh("diabetes")

            assert result == []

    @pytest.mark.asyncio
    async def test_search_mesh_http_error(self, service):
        """Test handling of HTTP errors (e.g., 500, 503)"""
        with patch('httpx.AsyncClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_response = MagicMock()
            mock_response.raise_for_status.side_effect = httpx.HTTPStatusError(
                "Server Error",
                request=MagicMock(),
                response=MagicMock(status_code=500)
            )
            mock_client.get.return_value = mock_response
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock()
            mock_client_class.return_value = mock_client

            result = await service.search_mesh("diabetes")

            assert result == []

    @pytest.mark.asyncio
    async def test_search_mesh_invalid_json(self, service):
        """Test handling of invalid JSON response"""
        with patch('httpx.AsyncClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_response = MagicMock()
            mock_response.raise_for_status = MagicMock()
            mock_response.json.side_effect = ValueError("Invalid JSON")
            mock_client.get.return_value = mock_response
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock()
            mock_client_class.return_value = mock_client

            result = await service.search_mesh("diabetes")

            assert result == []

    @pytest.mark.asyncio
    async def test_fetch_mesh_details_timeout(self, service):
        """Test handling of timeout during detail fetch"""
        with patch('httpx.AsyncClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client.get.side_effect = httpx.TimeoutException("Timeout")
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock()
            mock_client_class.return_value = mock_client

            result = await service.fetch_mesh_details(["12345"])

            assert result == []

    @pytest.mark.asyncio
    async def test_expand_term_empty_string(self, service):
        """Test expansion of empty term"""
        result = await service.expand_term("")

        assert result.original_term == ""
        assert result.mesh_terms == []

    @pytest.mark.asyncio
    async def test_expand_term_whitespace_only(self, service):
        """Test expansion of whitespace-only term"""
        result = await service.expand_term("   ")

        assert result.mesh_terms == []


# ============================================================================
# MeSHService Cache Integration Tests
# ============================================================================

class TestMeSHServiceCaching:
    """Tests for MeSH service cache integration"""

    @pytest.fixture
    def service(self):
        """Create a fresh MeSHService for each test"""
        return MeSHService()

    @pytest.mark.asyncio
    async def test_expand_term_caches_result(self, service):
        """Test that expand_term caches its results"""
        mock_cache = AsyncMock()
        mock_cache.get.return_value = None  # Cache miss
        mock_cache.set.return_value = True
        service._cache_service = mock_cache

        # Mock the NCBI API call
        with patch.object(service, 'search_mesh', return_value=[]) as mock_search:
            await service.expand_term("diabetes")

            # Should have checked cache
            mock_cache.get.assert_called_once()

            # Should have stored result
            mock_cache.set.assert_called_once()

            # TTL should be 30 days
            call_args = mock_cache.set.call_args
            ttl = call_args[1].get('ttl') or call_args[0][2]
            assert ttl == timedelta(days=30)

    @pytest.mark.asyncio
    async def test_expand_term_returns_cached_on_hit(self, service):
        """Test that cached data is returned without API call"""
        cached_data = {
            "original_term": "diabetes",
            "mesh_terms": [
                {
                    "descriptor_ui": "D003920",
                    "descriptor_name": "Diabetes Mellitus",
                    "entry_terms": ["DM"],
                    "tree_numbers": [],
                    "scope_note": ""
                }
            ],
            "free_text_terms": ['"diabetes"'],
            "entry_terms": ["DM"]
        }

        mock_cache = AsyncMock()
        mock_cache.get.return_value = cached_data
        service._cache_service = mock_cache

        with patch.object(service, 'search_mesh') as mock_search:
            result = await service.expand_term("diabetes")

            # Should NOT have called the API
            mock_search.assert_not_called()

            # Should return cached data
            assert result.original_term == "diabetes"
            assert len(result.mesh_terms) == 1
            assert result.mesh_terms[0].descriptor_name == "Diabetes Mellitus"

    @pytest.mark.asyncio
    async def test_expand_term_handles_cache_error_gracefully(self, service):
        """Test that cache errors don't break the service"""
        mock_cache = AsyncMock()
        mock_cache.get.side_effect = Exception("Cache error")
        mock_cache.set.return_value = True
        service._cache_service = mock_cache

        # Should still work even if cache fails
        with patch.object(service, 'search_mesh', return_value=[]):
            # This should not raise an exception
            result = await service.expand_term("diabetes")
            assert result.original_term == "diabetes"


# ============================================================================
# MeSHService Expansion Tests
# ============================================================================

class TestMeSHServiceExpansion:
    """Tests for MeSH term expansion logic"""

    @pytest.fixture
    def service(self):
        """Create a fresh MeSHService for each test"""
        svc = MeSHService()
        # Use a mock cache that always misses
        mock_cache = AsyncMock()
        mock_cache.get.return_value = None
        mock_cache.set.return_value = True
        svc._cache_service = mock_cache
        return svc

    @pytest.mark.asyncio
    async def test_expand_framework_data_concurrent(self, service):
        """Test that framework data is expanded concurrently"""
        framework_data = {
            "P": "adults with diabetes",
            "I": "metformin",
            "C": "placebo",
            "O": "blood glucose"
        }

        with patch.object(service, 'expand_term', new_callable=AsyncMock) as mock_expand:
            mock_expand.return_value = ExpandedTerms(original_term="test")

            await service.expand_framework_data(framework_data, "PICO")

            # Should have been called 4 times (once per component)
            assert mock_expand.call_count == 4

    @pytest.mark.asyncio
    async def test_expand_framework_data_skips_special_keys(self, service):
        """Test that research_question and framework_type are skipped"""
        framework_data = {
            "P": "adults",
            "research_question": "What is the effect?",
            "framework_type": "PICO"
        }

        with patch.object(service, 'expand_term', new_callable=AsyncMock) as mock_expand:
            mock_expand.return_value = ExpandedTerms(original_term="test")

            result = await service.expand_framework_data(framework_data, "PICO")

            # Should only expand "P", not the special keys
            assert mock_expand.call_count == 1
            assert "P" in result
            assert "research_question" not in result
            assert "framework_type" not in result

    @pytest.mark.asyncio
    async def test_expand_framework_data_skips_empty_values(self, service):
        """Test that empty values are skipped"""
        framework_data = {
            "P": "adults",
            "I": "",
            "C": None,
            "O": "outcomes"
        }

        with patch.object(service, 'expand_term', new_callable=AsyncMock) as mock_expand:
            mock_expand.return_value = ExpandedTerms(original_term="test")

            result = await service.expand_framework_data(framework_data, "PICO")

            # Should only expand non-empty values
            assert mock_expand.call_count == 2

    def test_generate_free_text_single_word(self, service):
        """Test free text generation for single words"""
        terms = service._generate_free_text("diabetes")

        assert '"diabetes"' in terms
        assert any("*" in t for t in terms)  # Should have truncation

    def test_generate_free_text_phrase(self, service):
        """Test free text generation for phrases"""
        terms = service._generate_free_text("type 2 diabetes")

        assert '"type 2 diabetes"' in terms
        assert "type 2 diabetes" in terms  # Unquoted version


# ============================================================================
# MeSH Text Parsing Tests
# ============================================================================

class TestMeSHTextParsing:
    """Tests for MeSH response text parsing"""

    @pytest.fixture
    def service(self):
        return MeSHService()

    def test_parse_mesh_text_basic(self, service):
        """Test parsing of basic MeSH text response"""
        text = """1: Diabetes Mellitus
A group of metabolic diseases characterized by hyperglycemia.
Tree Number(s): C18.452.394.750
Entry Terms:
    DM
    Sugar Disease
    Diabetes"""

        results = service._parse_mesh_text(text)

        assert len(results) == 1
        assert results[0].descriptor_name == "Diabetes Mellitus"
        assert "DM" in results[0].entry_terms
        assert "Sugar Disease" in results[0].entry_terms

    def test_parse_mesh_text_multiple_records(self, service):
        """Test parsing multiple MeSH records"""
        text = """1: Diabetes Mellitus
Description here
Tree Number(s): C18.452.394.750
Entry Terms:
    DM

2: Hypertension
Another description
Tree Number(s): C14.907.489
Entry Terms:
    High Blood Pressure"""

        results = service._parse_mesh_text(text)

        assert len(results) == 2
        assert results[0].descriptor_name == "Diabetes Mellitus"
        assert results[1].descriptor_name == "Hypertension"

    def test_parse_mesh_text_empty(self, service):
        """Test parsing empty text"""
        results = service._parse_mesh_text("")
        assert results == []

    def test_parse_mesh_text_no_entry_terms(self, service):
        """Test parsing record without entry terms"""
        text = """1: Some Term
Description only
Tree Number(s): A01.B02"""

        results = service._parse_mesh_text(text)

        assert len(results) == 1
        assert results[0].descriptor_name == "Some Term"
        assert results[0].entry_terms == []
