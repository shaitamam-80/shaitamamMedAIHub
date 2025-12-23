"""
MedAI Hub - MeSH Service
Handles MeSH term lookup and expansion using local Supabase database

This service provides:
- MeSH term validation and lookup from local database
- Synonym extraction (Entry Terms)
- Term expansion for query building
- Fallback to NCBI API if local lookup fails
"""

import asyncio
import logging
from dataclasses import dataclass, field
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# NCBI E-utilities base URL (fallback)
EUTILS_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"


def normalize_term_for_dedup(term: str) -> str:
    """
    Normalize a term for duplicate detection by sorting words alphabetically.

    This detects word-order permutations like:
    - "Anxiety Disorder, Generalized" vs "Generalized Anxiety Disorder"
    - "Daily Living Activities" vs "Activities of Daily Living"

    Returns:
        Normalized string with words sorted alphabetically (lowercase)
    """
    # Remove punctuation and split into words
    clean = term.lower().replace(",", " ").replace("-", " ").replace("'", "")
    words = [w.strip() for w in clean.split() if w.strip()]
    return " ".join(sorted(words))


def filter_permutation_duplicates(terms: list[str], existing_normalized: set = None) -> list[str]:
    """
    Filter out terms that are word-order permutations of each other.

    Keeps only the first occurrence of each unique word combination.
    """
    if existing_normalized is None:
        existing_normalized = set()

    filtered = []
    seen = set(existing_normalized)

    for term in terms:
        normalized = normalize_term_for_dedup(term)
        if normalized not in seen:
            filtered.append(term)
            seen.add(normalized)

    return filtered


@dataclass
class MeSHTerm:
    """Represents a MeSH descriptor with its metadata"""

    descriptor_ui: str  # Unique ID (e.g., D003920)
    descriptor_name: str  # Main term (e.g., "Diabetes Mellitus")
    entry_terms: list[str] = field(default_factory=list)  # Synonyms
    tree_numbers: list[str] = field(default_factory=list)  # Hierarchy
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
    mesh_terms: list[MeSHTerm] = field(default_factory=list)
    free_text_terms: list[str] = field(default_factory=list)
    entry_terms: list[str] = field(default_factory=list)  # From MeSH synonyms

    def to_broad_query(self) -> str:
        """
        Generate optimized OR-combined query block for high sensitivity.

        Features:
        - Deduplication via seen_terms set
        - Proper quoting for multi-word phrases
        - Priority: MeSH > Free Text > Entry Terms
        """
        parts = []
        seen_terms: set = set()

        # 1. MeSH Terms (Highest Priority)
        for mesh in self.mesh_terms:
            parts.append(mesh.to_mesh_query("default"))
            seen_terms.add(mesh.descriptor_name.lower())

        # 2. Free Text Terms (Title/Abstract)
        for term in self.free_text_terms:
            clean_term = term.strip()

            # If term has internal field tags (like [tiab:~3]), add as is
            if "[" in clean_term and "]" in clean_term:
                parts.append(clean_term)
                continue

            # Check duplication against MeSH
            term_lower = clean_term.replace('"', "").lower()
            if term_lower in seen_terms:
                continue

            # Quote multi-word phrases that aren't already quoted
            if " " in clean_term and not clean_term.startswith('"'):
                parts.append(f'"{clean_term}"[tiab]')
            else:
                parts.append(f"{clean_term}[tiab]")

            seen_terms.add(term_lower)

        # 3. Entry Terms (Synonyms) - filter permutations and limit to 4
        # Build normalized set of existing terms to filter against
        existing_normalized = set()
        for mesh in self.mesh_terms:
            existing_normalized.add(normalize_term_for_dedup(mesh.descriptor_name))
        for term in self.free_text_terms:
            clean = term.strip().replace('"', "")
            if "[" not in clean:
                existing_normalized.add(normalize_term_for_dedup(clean))

        # Filter out word-order permutations
        filtered_entries = filter_permutation_duplicates(self.entry_terms, existing_normalized)

        count = 0
        for term in filtered_entries:
            if count >= 4:  # Reduced from 8 to 4
                break

            clean_term = term.strip()
            term_lower = clean_term.lower()

            if term_lower not in seen_terms:
                # Quote multi-word phrases
                if " " in clean_term:
                    parts.append(f'"{clean_term}"[tiab]')
                else:
                    parts.append(f"{clean_term}[tiab]")
                seen_terms.add(term_lower)
                count += 1

        # Fallback: if no MeSH/synonyms found, use original term
        # BUT only if it's short enough (not a sentence)
        if not parts and self.original_term:
            words = self.original_term.split()
            if len(words) <= 5:
                # Short enough to be a valid search term
                parts.append(f'"{self.original_term}"[tiab]')
            else:
                # Too long - this is likely a sentence, skip it
                logger.warning(
                    f"Skipping long original term in fallback ({len(words)} words): "
                    f"'{self.original_term[:50]}...'"
                )

        if not parts:
            return ""

        return "(" + " OR ".join(parts) + ")"

    def to_focused_query(self) -> str:
        """
        Generate focused query for higher precision (but still usable).

        Uses [Mesh] instead of [Majr] and [tiab] instead of [ti] to avoid
        returning 0 results. [Majr] and [ti] are too restrictive.
        """
        parts = []

        # Add MeSH terms with [Mesh] (not [Majr] - too restrictive)
        for mesh in self.mesh_terms[:1]:  # Only best match
            parts.append(mesh.to_mesh_query("default"))

        # Add original term in title/abstract (not just title - too restrictive)
        if " " in self.original_term:
            parts.append(f'"{self.original_term}"[tiab]')
        else:
            parts.append(f"{self.original_term}[tiab]")

        if not parts:
            return ""

        return "(" + " OR ".join(parts) + ")"

    def to_dict(self) -> dict[str, Any]:
        """
        Convert to dictionary for cache serialization.

        Returns:
            Dict representation that can be JSON serialized and restored
        """
        return {
            "original_term": self.original_term,
            "mesh_terms": [
                {
                    "descriptor_ui": m.descriptor_ui,
                    "descriptor_name": m.descriptor_name,
                    "entry_terms": m.entry_terms,
                    "tree_numbers": m.tree_numbers,
                    "scope_note": m.scope_note,
                }
                for m in self.mesh_terms
            ],
            "free_text_terms": self.free_text_terms,
            "entry_terms": self.entry_terms,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "ExpandedTerms":
        """
        Restore ExpandedTerms from cached dict.

        Args:
            data: Dict from cache

        Returns:
            ExpandedTerms instance
        """
        mesh_terms = [
            MeSHTerm(
                descriptor_ui=m.get("descriptor_ui", ""),
                descriptor_name=m.get("descriptor_name", ""),
                entry_terms=m.get("entry_terms", []),
                tree_numbers=m.get("tree_numbers", []),
                scope_note=m.get("scope_note", ""),
            )
            for m in data.get("mesh_terms", [])
        ]

        return cls(
            original_term=data.get("original_term", ""),
            mesh_terms=mesh_terms,
            free_text_terms=data.get("free_text_terms", []),
            entry_terms=data.get("entry_terms", []),
        )


class MeSHService:
    """
    Service for MeSH term lookup and expansion.

    Primary lookup: Local Supabase database (mesh_terms table)
    Fallback: NCBI E-utilities API

    The local database contains ~31,000 MeSH descriptors with:
    - descriptor_name: Official MeSH term
    - entry_terms: Synonyms for the term
    - tree_numbers: Hierarchy codes
    - scope_note: Definition
    """

    def __init__(self):
        self.base_url = EUTILS_BASE_URL
        self.api_key = settings.NCBI_API_KEY
        self.email = settings.NCBI_EMAIL
        self._supabase = None

    def _get_supabase(self):
        """Lazy initialization of Supabase client"""
        if self._supabase is None:
            from supabase import create_client

            self._supabase = create_client(
                settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY
            )
        return self._supabase

    async def search_local(self, term: str, max_results: int = 5) -> list[MeSHTerm]:
        """
        Search MeSH terms in local Supabase database.

        Search strategy:
        1. Exact match on descriptor_name (case-insensitive)
        2. Exact match in entry_terms array (case-insensitive)

        Args:
            term: Search term
            max_results: Maximum number of results

        Returns:
            List of MeSHTerm objects
        """
        clean_term = term.strip().lower()
        if not clean_term:
            return []

        try:
            supabase = self._get_supabase()
            results = []

            # Strategy 1: Exact match on descriptor_name (case-insensitive)
            response = (
                supabase.table("mesh_terms")
                .select("*")
                .ilike("descriptor_name", clean_term)
                .limit(max_results)
                .execute()
            )

            if response.data:
                for row in response.data:
                    results.append(self._row_to_mesh_term(row))
                logger.info(f"Found {len(results)} exact matches for '{term}'")
                return results

            # Strategy 2: Search in entry_terms array
            # PostgreSQL: Check if any entry term matches (case-insensitive)
            # Using raw SQL via RPC for array search
            response = supabase.rpc(
                "search_mesh_entry_terms", {"search_term": clean_term, "max_results": max_results}
            ).execute()

            if response.data:
                for row in response.data:
                    results.append(self._row_to_mesh_term(row))
                logger.info(f"Found {len(results)} entry term matches for '{term}'")
                return results

            # Strategy 3: Partial match on descriptor_name
            response = (
                supabase.table("mesh_terms")
                .select("*")
                .ilike("descriptor_name", f"%{clean_term}%")
                .limit(max_results)
                .execute()
            )

            if response.data:
                for row in response.data:
                    results.append(self._row_to_mesh_term(row))
                logger.info(f"Found {len(results)} partial matches for '{term}'")
                return results

            logger.info(f"No local MeSH match for '{term}'")
            return []

        except Exception as e:
            logger.warning(f"Local MeSH search failed for '{term}': {e}")
            return []

    def _row_to_mesh_term(self, row: dict[str, Any]) -> MeSHTerm:
        """Convert database row to MeSHTerm object"""
        return MeSHTerm(
            descriptor_ui=row.get("descriptor_ui", ""),
            descriptor_name=row.get("descriptor_name", ""),
            entry_terms=row.get("entry_terms", []) or [],
            tree_numbers=row.get("tree_numbers", []) or [],
            scope_note=row.get("scope_note", "") or "",
        )

    async def search_mesh_api(self, term: str, max_results: int = 5) -> list[MeSHTerm]:
        """
        Fallback: Search MeSH using NCBI E-utilities API.

        Args:
            term: Search term
            max_results: Maximum number of results

        Returns:
            List of MeSHTerm objects
        """
        try:
            # First, search for matching UIDs
            esearch_url = f"{self.base_url}/esearch.fcgi"
            params = {"db": "mesh", "term": term, "retmax": max_results, "retmode": "json"}
            if self.api_key:
                params["api_key"] = self.api_key
            params["email"] = self.email
            params["tool"] = "MedAIHub"

            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(esearch_url, params=params)
                response.raise_for_status()
                data = response.json()

            mesh_uids = data.get("esearchresult", {}).get("idlist", [])

            if not mesh_uids:
                return []

            # Fetch details for found UIDs
            esummary_url = f"{self.base_url}/esummary.fcgi"
            params = {"db": "mesh", "id": ",".join(mesh_uids), "retmode": "json"}
            if self.api_key:
                params["api_key"] = self.api_key
            params["email"] = self.email

            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(esummary_url, params=params)
                response.raise_for_status()

            data = response.json()
            results = []

            result_data = data.get("result", {})
            for uid in mesh_uids:
                record = result_data.get(str(uid), {})
                if not record:
                    continue

                ds_mesh_term = record.get("ds_meshterms", [])
                name = ds_mesh_term[0] if ds_mesh_term else record.get("title", "")

                if name:
                    results.append(
                        MeSHTerm(
                            descriptor_ui=f"D{uid}" if not str(uid).startswith("D") else str(uid),
                            descriptor_name=name,
                            entry_terms=[],
                            tree_numbers=[],
                            scope_note=record.get("ds_scopenote", ""),
                        )
                    )

            logger.info(f"NCBI API found {len(results)} matches for '{term}'")
            return results

        except Exception as e:
            logger.warning(f"NCBI MeSH API search failed for '{term}': {e}")
            return []

    async def expand_term(self, term: str) -> ExpandedTerms:
        """
        Expand a single term to MeSH + free-text variants.

        This is the main method for query building. It:
        1. Checks if term is generic (skip MeSH if so - avoids noise)
        2. Checks for drug class → specific drug name expansion
        3. Searches local database first
        4. Falls back to NCBI API if not found locally
        5. Extracts entry terms (synonyms) from MeSH
        6. Generates free-text variations

        Args:
            term: Medical term to expand

        Returns:
            ExpandedTerms object with all query variants
        """
        from app.core.search_config import GENERIC_TERMS_NO_MESH

        result = ExpandedTerms(original_term=term)

        clean_term = term.strip()
        if not clean_term:
            return result

        # Check if term is generic (like "efficacy", "outcome", etc.)
        # These bring too much noise from MeSH (e.g., "Vaccine Efficacy")
        term_lower = clean_term.lower()
        is_generic = term_lower in GENERIC_TERMS_NO_MESH

        if is_generic:
            logger.info(f"Generic term '{clean_term}' - skipping MeSH, using [tiab] only")
            # Only use free-text search for generic terms
            result.free_text_terms = self._generate_free_text(clean_term)
            return result

        # Check if term is a drug class that should expand to specific drug names
        drug_names = self._expand_drug_class(clean_term)

        # Try local database first
        mesh_terms = await self.search_local(clean_term, max_results=3)

        # Fallback to NCBI API if no local results
        if not mesh_terms:
            logger.info(f"No local match for '{clean_term}', trying NCBI API...")
            mesh_terms = await self.search_mesh_api(clean_term, max_results=3)

        if mesh_terms:
            result.mesh_terms = mesh_terms

            # Extract entry terms from all matches
            all_entry_terms = []
            for mesh_term in mesh_terms:
                all_entry_terms.extend(mesh_term.entry_terms)

            # Step 1: Simple deduplication
            unique_entries = list(dict.fromkeys(all_entry_terms))

            # Step 2: Filter out word-order permutations of MeSH descriptor names
            mesh_normalized = {normalize_term_for_dedup(m.descriptor_name) for m in mesh_terms}
            filtered_entries = filter_permutation_duplicates(unique_entries, mesh_normalized)

            # Step 3: Limit to 6 (final limit of 4 happens in to_broad_query)
            result.entry_terms = filtered_entries[:6]

            logger.info(
                f"Term '{clean_term}' -> {len(mesh_terms)} MeSH, "
                f"{len(result.entry_terms)} synonyms (from {len(all_entry_terms)})"
            )
        else:
            logger.info(f"No MeSH match for '{clean_term}'")

        # Generate free-text variations
        result.free_text_terms = self._generate_free_text(clean_term)

        # Add specific drug names if this is a drug class
        if drug_names:
            logger.info(f"Drug class '{clean_term}' expanded to: {drug_names}")
            # Add drug names to free_text_terms (they'll get [tiab] tag)
            for drug in drug_names:
                if drug not in result.free_text_terms:
                    result.free_text_terms.append(drug)

        return result

    def _expand_drug_class(self, term: str) -> list[str]:
        """
        Check if term is a drug class and return specific drug names.

        Clinical trials often mention specific drug names (e.g., "Escitalopram")
        rather than class names (e.g., "SSRIs"), so this improves recall.

        Args:
            term: Term to check

        Returns:
            List of specific drug names, or empty list if not a drug class
        """
        from app.core.search_config import DRUG_CLASS_EXPANSIONS

        # Check exact match (case-insensitive)
        term_lower = term.lower().strip()
        if term_lower in DRUG_CLASS_EXPANSIONS:
            return DRUG_CLASS_EXPANSIONS[term_lower]

        # Check if term contains any drug class keywords
        for drug_class, drugs in DRUG_CLASS_EXPANSIONS.items():
            if drug_class in term_lower:
                return drugs

        return []

    # US/UK spelling variants mapping for common medical terms
    US_UK_SPELLINGS = {
        # -ize/-ise
        "randomized": "randomised",
        "randomize": "randomise",
        "hospitalized": "hospitalised",
        "hospitalize": "hospitalise",
        "standardized": "standardised",
        "standardize": "standardise",
        "characterized": "characterised",
        "characterize": "characterise",
        "analyzed": "analysed",
        "analyze": "analyse",
        "utilized": "utilised",
        "utilize": "utilise",
        "optimized": "optimised",
        "optimize": "optimise",
        # -or/-our
        "behavior": "behaviour",
        "behavioral": "behavioural",
        "tumor": "tumour",
        "color": "colour",
        "favor": "favour",
        "favorable": "favourable",
        "labor": "labour",
        "honor": "honour",
        "neighbor": "neighbour",
        # -er/-re
        "center": "centre",
        "fiber": "fibre",
        "meter": "metre",
        "liter": "litre",
        # -emia/-aemia
        "anemia": "anaemia",
        "anemic": "anaemic",
        "leukemia": "leukaemia",
        "septicemia": "septicaemia",
        "hypoglycemia": "hypoglycaemia",
        "hyperglycemia": "hyperglycaemia",
        # -ology/-ology (mostly same, but some variants)
        "gynecology": "gynaecology",
        "gynecological": "gynaecological",
        "pediatric": "paediatric",
        "pediatrics": "paediatrics",
        "orthopedic": "orthopaedic",
        "orthopedics": "orthopaedics",
        "fetus": "foetus",
        "fetal": "foetal",
        "estrogen": "oestrogen",
        "edema": "oedema",
        "diarrhea": "diarrhoea",
        "esophagus": "oesophagus",
        "esophageal": "oesophageal",
        # Other common variants
        "aging": "ageing",
        "program": "programme",
        "catalog": "catalogue",
        "dialog": "dialogue",
        "artifact": "artefact",
        "enrollment": "enrolment",
        "counseling": "counselling",
        "modeling": "modelling",
        "labeled": "labelled",
        "traveled": "travelled",
    }

    # Maximum words allowed for a term to be used as a quoted phrase search
    # Longer terms are likely natural language sentences that won't match anything
    MAX_PHRASE_WORDS = 5

    def _generate_free_text(self, term: str) -> list[str]:
        """
        Generate free-text search variations for a term.

        Includes:
        - Quoted phrase for exact matching (max 5 words)
        - Truncation for word variants
        - US/UK spelling variants
        - Proximity search for multi-word terms (2-3 words)

        GUARDRAIL: Terms longer than 5 words are rejected as they are likely
        natural language sentences that failed decomposition and won't match
        any PubMed articles.

        Args:
            term: Original term

        Returns:
            List of free-text variations (empty if term is too long)
        """
        variations = []
        words = term.split()

        # GUARDRAIL: Reject long sentences (> 5 words)
        # These are likely failed decompositions that won't match anything in PubMed
        if len(words) > self.MAX_PHRASE_WORDS:
            logger.warning(
                f"Term too long ({len(words)} words), skipping free-text: '{term[:50]}...'"
            )
            return []

        # Original term (quoted for phrase searching)
        variations.append(f'"{term}"')

        # With truncation for word variants
        if len(words) == 1 and len(term) > 4:
            # Single word - add truncation
            variations.append(f"{term}*")

        # Handle common abbreviations and variations
        # Add the term without quotes for broader matching
        if len(words) > 1:
            variations.append(term)

        # Add proximity search for multi-word terms (2-3 words)
        # This finds terms appearing near each other in any order
        # Syntax: "term1 term2"[tiab:~N] where N is max word distance
        if 2 <= len(words) <= 3:
            # Use distance of 2 for 2-word phrases, 3 for 3-word phrases
            distance = len(words)
            variations.append(f'"{term}"[tiab:~{distance}]')

        # Add US/UK spelling variants (with deduplication)
        term_lower = term.lower()
        seen_variants = set()
        for us_spelling, uk_spelling in self.US_UK_SPELLINGS.items():
            if us_spelling in term_lower:
                # Replace US with UK spelling
                uk_variant = term_lower.replace(us_spelling, uk_spelling)
                if uk_variant != term_lower and uk_variant not in seen_variants:
                    variations.append(f'"{uk_variant}"')
                    seen_variants.add(uk_variant)
            elif uk_spelling in term_lower:
                # Replace UK with US spelling
                us_variant = term_lower.replace(uk_spelling, us_spelling)
                if us_variant != term_lower and us_variant not in seen_variants:
                    variations.append(f'"{us_variant}"')
                    seen_variants.add(us_variant)

        return variations

    async def expand_framework_data(
        self, framework_data: dict[str, str], framework_type: str
    ) -> dict[str, ExpandedTerms]:
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
            key: value
            for key, value in framework_data.items()
            if value and key.lower() not in ["research_question", "framework_type"]
        }

        if not items_to_expand:
            return results

        logger.info(f"Expanding {len(items_to_expand)} framework components")

        # Expand all terms concurrently
        tasks = [self.expand_term(value) for value in items_to_expand.values()]

        expanded_list = await asyncio.gather(*tasks)

        # Map back to keys
        for key, expanded in zip(items_to_expand.keys(), expanded_list, strict=False):
            results[key] = expanded

        return results

    async def get_mesh_by_ui(self, descriptor_ui: str) -> MeSHTerm | None:
        """
        Get a specific MeSH term by its descriptor UI.

        Args:
            descriptor_ui: MeSH descriptor UI (e.g., D000001)

        Returns:
            MeSHTerm object or None
        """
        try:
            supabase = self._get_supabase()
            response = (
                supabase.table("mesh_terms")
                .select("*")
                .eq("descriptor_ui", descriptor_ui)
                .limit(1)
                .execute()
            )

            if response.data:
                return self._row_to_mesh_term(response.data[0])
            return None

        except Exception as e:
            logger.warning(f"Failed to get MeSH term {descriptor_ui}: {e}")
            return None

    async def get_stats(self) -> dict[str, Any]:
        """Get statistics about the local MeSH database"""
        try:
            supabase = self._get_supabase()
            response = supabase.table("mesh_terms").select("descriptor_ui", count="exact").execute()

            return {"total_terms": response.count or 0, "source": "local_supabase"}
        except Exception as e:
            logger.warning(f"Failed to get MeSH stats: {e}")
            return {"total_terms": 0, "source": "unknown", "error": str(e)}


# Global singleton instance
mesh_service = MeSHService()
