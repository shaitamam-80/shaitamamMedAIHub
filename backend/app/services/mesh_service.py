"""
MedAI Hub - MeSH Service
Handles MeSH term lookup and expansion using NCBI E-utilities API

This service provides:
- MeSH term validation and lookup
- Synonym extraction (Entry Terms)
- Term expansion for query building
- Caching for performance
"""

import httpx
import logging
import asyncio
from typing import Dict, List, Optional, Any
from xml.etree import ElementTree
from functools import lru_cache
from dataclasses import dataclass, field
from app.core.config import settings

logger = logging.getLogger(__name__)

# NCBI E-utilities base URL
EUTILS_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"


@dataclass
class MeSHTerm:
    """Represents a MeSH descriptor with its metadata"""
    descriptor_ui: str  # Unique ID (e.g., D003920)
    descriptor_name: str  # Main term (e.g., "Diabetes Mellitus")
    entry_terms: List[str] = field(default_factory=list)  # Synonyms
    tree_numbers: List[str] = field(default_factory=list)  # Hierarchy
    scope_note: str = ""  # Definition

    def to_mesh_query(self, explosion: str = "default") -> str:
        """
        Convert to PubMed MeSH query syntax

        Args:
            explosion: 'default' (with explosion), 'noexp' (no explosion), 'majr' (major topic)

        Returns:
            PubMed query string
        """
        if explosion == "noexp":
            return f'"{self.descriptor_name}"[Mesh:noexp]'
        elif explosion == "majr":
            return f'"{self.descriptor_name}"[Majr]'
        else:
            return f'"{self.descriptor_name}"[Mesh]'


@dataclass
class ExpandedTerms:
    """Result of term expansion - all search variants"""
    original_term: str
    mesh_terms: List[MeSHTerm] = field(default_factory=list)
    free_text_terms: List[str] = field(default_factory=list)
    entry_terms: List[str] = field(default_factory=list)  # From MeSH synonyms

    def to_broad_query(self) -> str:
        """Generate OR-combined query for high sensitivity"""
        parts = []

        # Add MeSH terms (with explosion)
        for mesh in self.mesh_terms:
            parts.append(mesh.to_mesh_query("default"))

        # Add free-text terms
        for term in self.free_text_terms:
            parts.append(f'{term}[tiab]')

        # Add entry terms (synonyms)
        for term in self.entry_terms[:5]:  # Limit to top 5
            parts.append(f'{term}[tiab]')

        # Fallback: if no MeSH/synonyms found, use original term
        if not parts and self.original_term:
            parts.append(f'"{self.original_term}"[tiab]')

        if not parts:
            return ""

        return "(" + " OR ".join(parts) + ")"

    def to_focused_query(self) -> str:
        """Generate focused query for high precision"""
        parts = []

        # Add MeSH terms with [majr] for major topic
        for mesh in self.mesh_terms[:1]:  # Only best match
            parts.append(mesh.to_mesh_query("majr"))

        # Add original term in title
        parts.append(f'{self.original_term}[ti]')

        if not parts:
            return ""

        return "(" + " OR ".join(parts) + ")"


class MeSHService:
    """
    Service for MeSH term lookup and expansion using NCBI E-utilities.

    Uses the MeSH database to:
    1. Validate if a term exists as a MeSH descriptor
    2. Get official MeSH term name
    3. Extract Entry Terms (synonyms)
    4. Get tree hierarchy for broader/narrower terms
    """

    def __init__(self):
        self.base_url = EUTILS_BASE_URL
        self.api_key = settings.NCBI_API_KEY
        self.email = settings.NCBI_EMAIL
        self._cache: Dict[str, ExpandedTerms] = {}

    def _add_auth_params(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Add API key and email to request params"""
        if self.api_key:
            params["api_key"] = self.api_key
        params["email"] = self.email
        params["tool"] = "MedAIHub"
        return params

    async def search_mesh(self, term: str, max_results: int = 5) -> List[str]:
        """
        Search MeSH database for matching descriptor IDs.

        Args:
            term: Search term
            max_results: Maximum number of results

        Returns:
            List of MeSH descriptor UIDs
        """
        try:
            esearch_url = f"{self.base_url}/esearch.fcgi"
            params = self._add_auth_params({
                "db": "mesh",
                "term": term,
                "retmax": max_results,
                "retmode": "json"
            })

            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(esearch_url, params=params)
                response.raise_for_status()
                data = response.json()

            result = data.get("esearchresult", {})
            return result.get("idlist", [])

        except Exception as e:
            logger.warning(f"MeSH search failed for '{term}': {e}")
            return []

    async def fetch_mesh_details(self, mesh_uids: List[str]) -> List[MeSHTerm]:
        """
        Fetch full MeSH record details including synonyms.

        Args:
            mesh_uids: List of MeSH UIDs from search

        Returns:
            List of MeSHTerm objects with full details
        """
        if not mesh_uids:
            return []

        try:
            # Use esummary instead of efetch - it returns proper JSON format
            # efetch for MeSH returns plain text which is hard to parse
            esummary_url = f"{self.base_url}/esummary.fcgi"
            params = self._add_auth_params({
                "db": "mesh",
                "id": ",".join(mesh_uids),
                "retmode": "json"
            })

            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(esummary_url, params=params)
                response.raise_for_status()

            data = response.json()
            results = []

            result_data = data.get("result", {})
            uid_list = result_data.get("uids", mesh_uids)

            for uid in uid_list:
                record = result_data.get(str(uid), {})
                if not record:
                    continue

                # Extract descriptor name from summary
                ds_mesh_term = record.get("ds_meshterms", [])
                name = ds_mesh_term[0] if ds_mesh_term else record.get("title", "")

                # esummary doesn't provide entry terms, but we can still use
                # the descriptor name for query building
                results.append(MeSHTerm(
                    descriptor_ui=f"D{uid}" if not str(uid).startswith("D") else str(uid),
                    descriptor_name=name,
                    entry_terms=[],  # Not available in esummary
                    tree_numbers=[],  # Not available in esummary
                    scope_note=record.get("ds_scopenote", "")
                ))

            return results

        except Exception as e:
            logger.warning(f"MeSH fetch failed for UIDs {mesh_uids}: {e}")
            return []

    async def expand_term(self, term: str) -> ExpandedTerms:
        """
        Expand a single term to MeSH + free-text variants.

        This is the main method for query building. It:
        1. Searches MeSH for matching descriptors
        2. Extracts entry terms (synonyms) from MeSH
        3. Generates free-text variations

        Args:
            term: Medical term to expand

        Returns:
            ExpandedTerms object with all query variants
        """
        # Check cache first
        cache_key = term.lower().strip()
        if cache_key in self._cache:
            logger.debug(f"Cache hit for term: {term}")
            return self._cache[cache_key]

        result = ExpandedTerms(original_term=term)

        # Clean the term for searching
        clean_term = term.strip()
        if not clean_term:
            return result

        # Search MeSH database
        mesh_uids = await self.search_mesh(clean_term)

        if mesh_uids:
            # Fetch full MeSH details
            mesh_terms = await self.fetch_mesh_details(mesh_uids[:3])  # Top 3 matches
            result.mesh_terms = mesh_terms

            # Extract entry terms from best match
            if mesh_terms:
                result.entry_terms = mesh_terms[0].entry_terms[:10]  # Top 10 synonyms

        # Generate free-text variations
        result.free_text_terms = self._generate_free_text(clean_term)

        # Cache the result
        self._cache[cache_key] = result

        return result

    def _generate_free_text(self, term: str) -> List[str]:
        """
        Generate free-text search variations for a term.

        Args:
            term: Original term

        Returns:
            List of free-text variations
        """
        variations = []

        # Original term
        variations.append(term)

        # With truncation for word variants
        words = term.split()
        if len(words) == 1 and len(term) > 4:
            # Single word - add truncation
            variations.append(f"{term}*")

        # Handle common abbreviations in medical terms
        # (Could be expanded based on domain knowledge)

        return variations

    async def expand_framework_data(
        self,
        framework_data: Dict[str, str],
        framework_type: str
    ) -> Dict[str, ExpandedTerms]:
        """
        Expand all terms in framework data concurrently.

        Args:
            framework_data: Dict of framework components (P, I, C, O, etc.)
            framework_type: Type of framework (PICO, PEO, etc.)

        Returns:
            Dict mapping component keys to ExpandedTerms
        """
        results = {}

        # Filter out empty values and special keys
        items_to_expand = {
            key: value for key, value in framework_data.items()
            if value and key.lower() not in ['research_question', 'framework_type']
        }

        if not items_to_expand:
            return results

        # Expand all terms concurrently
        tasks = [
            self.expand_term(value)
            for value in items_to_expand.values()
        ]

        expanded_list = await asyncio.gather(*tasks)

        # Map back to keys
        for key, expanded in zip(items_to_expand.keys(), expanded_list):
            results[key] = expanded

        return results

    def clear_cache(self):
        """Clear the term expansion cache"""
        self._cache.clear()
        logger.info("MeSH cache cleared")


# Global singleton instance
mesh_service = MeSHService()
