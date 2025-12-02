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
        Fetch full MeSH record details including synonyms using efetch.

        The efetch endpoint with rettype=full returns complete MeSH records
        including Entry Terms (synonyms) which esummary does not provide.
        Note: NCBI MeSH efetch returns plain text format, not XML.

        Args:
            mesh_uids: List of MeSH UIDs from search

        Returns:
            List of MeSHTerm objects with full details including entry terms
        """
        if not mesh_uids:
            return []

        try:
            # Use efetch to get full MeSH records (returns plain text, not XML)
            efetch_url = f"{self.base_url}/efetch.fcgi"
            params = self._add_auth_params({
                "db": "mesh",
                "id": ",".join(mesh_uids),
                "rettype": "full"
            })

            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.get(efetch_url, params=params)
                response.raise_for_status()

            # Parse text response (NCBI MeSH returns plain text format)
            results = self._parse_mesh_text(response.text)

            if results:
                logger.info(f"Found {len(results)} MeSH terms with {sum(len(r.entry_terms) for r in results)} entry terms total")

            return results

        except Exception as e:
            logger.warning(f"MeSH efetch failed for UIDs {mesh_uids}: {e}")
            # Fallback to esummary if efetch fails
            return await self._fetch_mesh_summary(mesh_uids)

    def _parse_mesh_text(self, text: str) -> List[MeSHTerm]:
        """
        Parse NCBI MeSH efetch plain text response.

        The text format for MeSH records is structured as:
        N: Descriptor Name
        Description text...
        Tree Number(s): ...
        Entry Terms:
            term1
            term2
            ...
        """
        results = []
        import re

        # Split by record number pattern (e.g., "1: ", "2: ", etc.)
        records = re.split(r'\n(?=\d+:\s)', text)

        for record in records:
            record = record.strip()
            if not record:
                continue

            try:
                lines = record.split('\n')
                if not lines:
                    continue

                # First line is "N: Descriptor Name"
                first_line = lines[0]
                match = re.match(r'^(\d+):\s*(.+)$', first_line)
                if not match:
                    continue

                descriptor_name = match.group(2).strip()

                # Extract tree numbers
                tree_numbers = []
                entry_terms = []
                scope_note = ""
                in_entry_terms = False
                description_lines = []

                for i, line in enumerate(lines[1:], 1):
                    stripped = line.strip()

                    if stripped.startswith('Tree Number(s):'):
                        # Parse tree numbers
                        tree_part = stripped.replace('Tree Number(s):', '').strip()
                        tree_numbers = [t.strip() for t in tree_part.split(',') if t.strip()]
                        in_entry_terms = False
                    elif stripped == 'Entry Terms:':
                        in_entry_terms = True
                    elif stripped.startswith('Previous Indexing:') or stripped.startswith('See Also:'):
                        in_entry_terms = False
                    elif stripped.startswith('Subheadings:'):
                        in_entry_terms = False
                    elif stripped.startswith('All MeSH Categories'):
                        in_entry_terms = False
                        break
                    elif in_entry_terms and stripped:
                        # Entry terms are indented
                        entry_terms.append(stripped)
                    elif not in_entry_terms and stripped and not stripped.startswith('Year introduced:') and not stripped.startswith('Date introduced:'):
                        # Description text (before Entry Terms section)
                        if not tree_numbers and not entry_terms:
                            description_lines.append(stripped)

                # Build scope note from description lines (first few lines after name)
                scope_note = ' '.join(description_lines[:3])[:500]

                # Generate a UID from tree numbers or use a placeholder
                descriptor_ui = ""
                if tree_numbers:
                    # Use first tree number as base for UI
                    descriptor_ui = f"D{tree_numbers[0].replace('.', '')[:6]}"

                results.append(MeSHTerm(
                    descriptor_ui=descriptor_ui,
                    descriptor_name=descriptor_name,
                    entry_terms=entry_terms[:15],  # Limit to 15 synonyms
                    tree_numbers=tree_numbers,
                    scope_note=scope_note
                ))

                logger.debug(f"Parsed MeSH term: {descriptor_name} with {len(entry_terms)} entry terms")

            except Exception as record_error:
                logger.debug(f"Error parsing MeSH record: {record_error}")
                continue

        return results

    def _parse_mesh_xml(self, xml_text: str) -> List[MeSHTerm]:
        """
        Parse MeSH XML response to extract descriptors and entry terms.
        (Kept for backwards compatibility but not actively used since NCBI returns text)

        The XML structure for MeSH records contains:
        - DescriptorRecord > DescriptorUI (the UID)
        - DescriptorRecord > DescriptorName > String (the main term)
        - DescriptorRecord > ConceptList > Concept > TermList > Term > String (entry terms)
        """
        results = []

        try:
            # MeSH XML can have different root elements depending on response
            # Wrap in a root element if needed
            if not xml_text.strip().startswith('<?xml'):
                xml_text = f'<?xml version="1.0"?><root>{xml_text}</root>'

            root = ElementTree.fromstring(xml_text)

            # Look for DescriptorRecord elements (may be nested differently)
            descriptor_records = root.findall('.//DescriptorRecord')
            if not descriptor_records:
                # Try alternate path
                descriptor_records = root.findall('.//DescriptorRecordSet/DescriptorRecord')

            for record in descriptor_records:
                try:
                    # Get descriptor UI
                    ui_elem = record.find('.//DescriptorUI')
                    ui = ui_elem.text if ui_elem is not None else ""

                    # Get descriptor name
                    name_elem = record.find('.//DescriptorName/String')
                    name = name_elem.text if name_elem is not None else ""

                    if not name:
                        continue

                    # Get entry terms (synonyms) from all concepts
                    entry_terms = []
                    term_elements = record.findall('.//ConceptList/Concept/TermList/Term/String')
                    for term_elem in term_elements:
                        if term_elem.text and term_elem.text != name:
                            entry_terms.append(term_elem.text)

                    # Get tree numbers
                    tree_numbers = []
                    tree_elements = record.findall('.//TreeNumberList/TreeNumber')
                    for tree_elem in tree_elements:
                        if tree_elem.text:
                            tree_numbers.append(tree_elem.text)

                    # Get scope note
                    scope_elem = record.find('.//ScopeNote')
                    scope_note = scope_elem.text if scope_elem is not None else ""

                    results.append(MeSHTerm(
                        descriptor_ui=ui,
                        descriptor_name=name,
                        entry_terms=entry_terms[:15],  # Limit to 15 synonyms
                        tree_numbers=tree_numbers,
                        scope_note=scope_note[:500] if scope_note else ""  # Truncate long notes
                    ))

                except Exception as record_error:
                    logger.debug(f"Error parsing MeSH record: {record_error}")
                    continue

        except ElementTree.ParseError as parse_error:
            logger.warning(f"XML parse error: {parse_error}")
            # Try to extract basic info from text
            results = self._parse_mesh_text_fallback(xml_text)

        return results

    def _parse_mesh_text_fallback(self, text: str) -> List[MeSHTerm]:
        """
        Fallback parser for when XML parsing fails.
        Extracts basic MeSH info from text output.
        """
        results = []
        import re

        # Try to find descriptor patterns in text
        # Pattern: "Descriptor Name" followed by entry terms
        lines = text.split('\n')

        current_name = None
        current_ui = None
        current_entries = []

        for line in lines:
            line = line.strip()

            # Look for main heading
            if line.startswith('MH - ') or line.startswith('ENTRY - '):
                if line.startswith('MH - '):
                    if current_name:
                        # Save previous
                        results.append(MeSHTerm(
                            descriptor_ui=current_ui or "",
                            descriptor_name=current_name,
                            entry_terms=current_entries[:15]
                        ))
                    current_name = line[5:].strip()
                    current_entries = []
                elif line.startswith('ENTRY - ') and current_name:
                    current_entries.append(line[8:].strip())

            elif line.startswith('UI - '):
                current_ui = line[5:].strip()

        # Don't forget last one
        if current_name:
            results.append(MeSHTerm(
                descriptor_ui=current_ui or "",
                descriptor_name=current_name,
                entry_terms=current_entries[:15]
            ))

        return results

    async def _fetch_mesh_summary(self, mesh_uids: List[str]) -> List[MeSHTerm]:
        """
        Fallback method using esummary when efetch fails.
        Returns MeSH terms without entry terms.
        """
        try:
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

                ds_mesh_term = record.get("ds_meshterms", [])
                name = ds_mesh_term[0] if ds_mesh_term else record.get("title", "")

                results.append(MeSHTerm(
                    descriptor_ui=f"D{uid}" if not str(uid).startswith("D") else str(uid),
                    descriptor_name=name,
                    entry_terms=[],
                    tree_numbers=[],
                    scope_note=record.get("ds_scopenote", "")
                ))

            return results

        except Exception as e:
            logger.warning(f"MeSH summary fallback failed: {e}")
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
            # Fetch full MeSH details including entry terms
            mesh_terms = await self.fetch_mesh_details(mesh_uids[:3])  # Top 3 matches
            result.mesh_terms = mesh_terms

            # Extract entry terms from all matches
            all_entry_terms = []
            for mesh_term in mesh_terms:
                all_entry_terms.extend(mesh_term.entry_terms)

            # Deduplicate and limit
            result.entry_terms = list(dict.fromkeys(all_entry_terms))[:10]

            logger.info(f"Term '{clean_term}' -> {len(mesh_terms)} MeSH terms, {len(result.entry_terms)} synonyms")
        else:
            logger.info(f"No MeSH match for '{clean_term}'")

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

        # Original term (quoted for phrase searching)
        variations.append(f'"{term}"')

        # With truncation for word variants
        words = term.split()
        if len(words) == 1 and len(term) > 4:
            # Single word - add truncation
            variations.append(f"{term}*")

        # Handle common abbreviations and variations
        # Add the term without quotes for broader matching
        if len(words) > 1:
            variations.append(term)

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

        logger.info(f"Expanding {len(items_to_expand)} framework components via MeSH API")

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
