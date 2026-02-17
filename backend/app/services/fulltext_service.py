"""
MedAI Hub - Full-Text Availability Service
==========================================

Async port of the MCP fetch_fulltext.py script.
Checks multiple Open Access sources for article full-text availability.

Sources (checked in priority order):
    1. PMC OA Web Service (most reliable, free)
    2. Unpaywall (broad coverage, requires email)
    3. CORE.ac.uk (institutional repositories)
    4. Semantic Scholar (aggregated OA links)
    5. EZproxy / Institutional proxy (library subscription)
"""

import asyncio
import json
import logging
import re
import urllib.parse
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# -- API Endpoints -----------------------------------------------------------

EUTILS_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
PMC_OA_BASE = "https://www.ncbi.nlm.nih.gov/pmc/utils/oa/oa.fcgi"
UNPAYWALL_BASE = "https://api.unpaywall.org/v2"
CORE_API_BASE = "https://api.core.ac.uk/v3"
S2_API_BASE = "https://api.semanticscholar.org/graph/v1"

USER_AGENT = "MedAI-Hub-FullText/1.0"


# -- Source result types -----------------------------------------------------

class SourceResult:
    """Result from a single source check."""

    __slots__ = ("available", "pdf_url", "format", "oa_status",
                 "host_type", "source_name", "note", "error")

    def __init__(
        self,
        available: bool = False,
        pdf_url: str = "",
        format: str = "pdf",
        oa_status: str = "",
        host_type: str = "",
        source_name: str = "",
        note: str = "",
        error: str = "",
    ):
        self.available = available
        self.pdf_url = pdf_url
        self.format = format
        self.oa_status = oa_status
        self.host_type = host_type
        self.source_name = source_name
        self.note = note
        self.error = error


class ArticleAvailability:
    """Combined result for an article across all sources."""

    __slots__ = ("pmid", "doi", "title", "available", "source",
                 "pdf_url", "oa_status", "format", "note", "metadata", "error")

    def __init__(self, pmid: str = "", doi: str = ""):
        self.pmid = pmid
        self.doi = doi
        self.title = ""
        self.available = False
        self.source = "none"
        self.pdf_url = ""
        self.oa_status = "unknown"
        self.format = ""
        self.note = ""
        self.metadata: dict = {}
        self.error = ""

    def to_dict(self) -> dict:
        return {
            "pmid": self.pmid,
            "doi": self.doi,
            "title": self.title,
            "available": self.available,
            "source": self.source,
            "pdf_url": self.pdf_url,
            "oa_status": self.oa_status,
            "format": self.format,
            "note": self.note,
        }


# -- Service -----------------------------------------------------------------

class FullTextService:
    """Async service for checking full-text availability across OA sources."""

    def __init__(self):
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=httpx.Timeout(30.0),
                headers={"User-Agent": USER_AGENT},
                follow_redirects=True,
            )
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    # -- NCBI helpers --------------------------------------------------------

    def _ncbi_params(self) -> dict:
        params = {}
        if settings.NCBI_API_KEY:
            params["api_key"] = settings.NCBI_API_KEY
        if settings.PUBMED_EMAIL:
            params["email"] = settings.PUBMED_EMAIL
        return params

    @property
    def _request_delay(self) -> float:
        return 0.1 if settings.NCBI_API_KEY else 0.34

    # -- Step 1: PMID -> metadata --------------------------------------------

    async def pmid_to_metadata(self, pmid: str) -> dict:
        """Get DOI, PMC ID, and basic metadata for a PMID via esummary."""
        client = await self._get_client()
        params = {"db": "pubmed", "id": pmid, "retmode": "json", **self._ncbi_params()}
        url = f"{EUTILS_BASE}/esummary.fcgi?{urllib.parse.urlencode(params)}"

        try:
            await asyncio.sleep(self._request_delay)
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()

            result = data.get("result", {})
            article = result.get(pmid, {})

            doi = ""
            pmc_id = ""
            for aid in article.get("articleids", []):
                if aid.get("idtype") == "doi":
                    doi = aid.get("value", "")
                elif aid.get("idtype") == "pmc":
                    pmc_id = aid.get("value", "")

            return {
                "pmid": pmid,
                "doi": doi,
                "pmc_id": pmc_id,
                "title": article.get("title", ""),
                "authors": article.get("sortfirstauthor", ""),
                "year": article.get("pubdate", "")[:4],
                "journal": article.get("fulljournalname", ""),
            }
        except Exception as e:
            logger.warning(f"Failed to fetch metadata for PMID {pmid}: {e}")
            return {"pmid": pmid, "error": str(e)}

    # -- Source 1: PMC OA ----------------------------------------------------

    async def check_pmc_oa(self, pmid: str = "", pmc_id: str = "") -> SourceResult:
        """Check PMC OA Web Service for free full-text."""
        if not pmid and not pmc_id:
            return SourceResult()

        client = await self._get_client()
        identifier = pmc_id or pmid
        url = f"{PMC_OA_BASE}?id={identifier}"

        try:
            await asyncio.sleep(0.5)
            resp = await client.get(url)
            resp.raise_for_status()
            raw = resp.text

            links = re.findall(r'<link\s+([^>]+)/>', raw)
            pdf_url = ""
            tgz_url = ""

            for link_attrs in links:
                fmt_match = re.search(r'format="([^"]+)"', link_attrs)
                href_match = re.search(r'href="([^"]+)"', link_attrs)
                if not fmt_match or not href_match:
                    continue
                fmt = fmt_match.group(1)
                href = href_match.group(1)

                if href.startswith("ftp://ftp.ncbi.nlm.nih.gov/"):
                    href = href.replace(
                        "ftp://ftp.ncbi.nlm.nih.gov/",
                        "https://ftp.ncbi.nlm.nih.gov/",
                    )

                if fmt == "pdf":
                    pdf_url = href
                elif fmt == "tgz":
                    tgz_url = href

            if pdf_url:
                return SourceResult(available=True, pdf_url=pdf_url, format="pdf", oa_status="gold")
            if tgz_url:
                return SourceResult(available=True, pdf_url=tgz_url, format="tgz", oa_status="gold")

        except Exception as e:
            logger.debug(f"PMC OA check failed for {identifier}: {e}")

        return SourceResult()

    # -- Source 2: Unpaywall -------------------------------------------------

    async def check_unpaywall(self, doi: str) -> SourceResult:
        """Check Unpaywall for OA availability via DOI."""
        if not doi:
            return SourceResult()

        email = settings.PUBMED_EMAIL
        if not email:
            return SourceResult(error="PUBMED_EMAIL not configured for Unpaywall")

        client = await self._get_client()
        doi_clean = self._clean_doi(doi)
        url = (
            f"{UNPAYWALL_BASE}/{urllib.parse.quote(doi_clean, safe='')}"
            f"?email={urllib.parse.quote(email)}"
        )

        try:
            await asyncio.sleep(0.5)
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()

            oa_status = data.get("oa_status", "closed")
            best_oa = data.get("best_oa_location")

            if best_oa and best_oa.get("url_for_pdf"):
                return SourceResult(
                    available=True,
                    pdf_url=best_oa["url_for_pdf"],
                    oa_status=oa_status,
                    host_type=best_oa.get("host_type", ""),
                )
            elif best_oa and best_oa.get("url_for_landing_page"):
                return SourceResult(
                    available=True,
                    pdf_url=best_oa["url_for_landing_page"],
                    format="landing_page",
                    oa_status=oa_status,
                    host_type=best_oa.get("host_type", ""),
                )

        except Exception as e:
            logger.debug(f"Unpaywall check failed for DOI {doi}: {e}")

        return SourceResult()

    # -- Source 3: CORE.ac.uk ------------------------------------------------

    async def check_core(self, doi: str = "", title: str = "") -> SourceResult:
        """Check CORE.ac.uk for full-text in institutional repositories."""
        if not doi and not title:
            return SourceResult()

        client = await self._get_client()
        headers = {}
        if settings.CORE_API_KEY:
            headers["Authorization"] = f"Bearer {settings.CORE_API_KEY}"

        if doi:
            doi_clean = self._clean_doi(doi)
            search_url = (
                f"{CORE_API_BASE}/search/works"
                f"?q=doi%3A%22{urllib.parse.quote(doi_clean, safe='')}%22&limit=1"
            )
        else:
            title_clean = title.strip().replace('"', '')
            search_url = (
                f"{CORE_API_BASE}/search/works"
                f"?q=title%3A%22{urllib.parse.quote(title_clean, safe='')}%22&limit=1"
            )

        try:
            await asyncio.sleep(0.5)
            resp = await client.get(search_url, headers=headers)
            resp.raise_for_status()
            data = resp.json()

            results_list = data.get("results", [])
            if results_list:
                work = results_list[0]
                download_url = work.get("downloadUrl", "")
                if not download_url:
                    for link in work.get("links", []):
                        if link.get("type") in ("download", "pdf"):
                            download_url = link.get("url", "")
                            break

                if download_url:
                    return SourceResult(
                        available=True,
                        pdf_url=download_url,
                        oa_status="green",
                        source_name=work.get("dataProvider", {}).get("name", "CORE"),
                    )

        except Exception as e:
            logger.debug(f"CORE check failed for DOI={doi} title={title[:50] if title else ''}: {e}")

        return SourceResult()

    # -- Source 4: Semantic Scholar -------------------------------------------

    async def check_semantic_scholar(self, doi: str = "", pmid: str = "") -> SourceResult:
        """Check Semantic Scholar for OA PDF links."""
        if not doi and not pmid:
            return SourceResult()

        client = await self._get_client()

        if doi:
            paper_id = f"DOI:{self._clean_doi(doi)}"
        else:
            paper_id = f"PMID:{pmid}"

        url = (
            f"{S2_API_BASE}/paper/{urllib.parse.quote(paper_id, safe=':')}"
            f"?fields=isOpenAccess,openAccessPdf"
        )

        try:
            await asyncio.sleep(1.0)  # S2 has strict rate limits
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()

            if data.get("isOpenAccess"):
                oa_pdf = data.get("openAccessPdf")
                if oa_pdf and oa_pdf.get("url"):
                    return SourceResult(
                        available=True,
                        pdf_url=oa_pdf["url"],
                        oa_status="green",
                    )

        except Exception as e:
            logger.debug(f"Semantic Scholar check failed for {paper_id}: {e}")

        return SourceResult()

    # -- Source 5: EZproxy ---------------------------------------------------

    def build_proxy_url(self, doi: str) -> SourceResult:
        """Build an institutional proxy URL for paywalled articles."""
        prefix = settings.EZPROXY_PREFIX
        if not prefix or not doi:
            return SourceResult()

        doi_clean = self._clean_doi(doi)
        doi_url = f"https://doi.org/{doi_clean}"

        if prefix.endswith("="):
            proxy_url = f"{prefix}{urllib.parse.quote(doi_url, safe='')}"
        elif prefix.endswith("/"):
            proxy_url = f"{prefix}{doi_clean}"
        else:
            proxy_url = f"{prefix}={urllib.parse.quote(doi_url, safe='')}"

        return SourceResult(
            available=True,
            pdf_url=proxy_url,
            format="proxy",
            oa_status="subscription",
            note="Requires active university VPN or network connection",
        )

    # -- Combined check ------------------------------------------------------

    async def check_availability(
        self,
        pmid: str = "",
        doi: str = "",
        sources: str = "all",
    ) -> ArticleAvailability:
        """
        Check all sources for full-text availability in priority order.

        Args:
            pmid: PubMed ID
            doi: DOI (used if no PMID, or as fallback)
            sources: Comma-separated source list or "all"

        Returns:
            ArticleAvailability with the best source found.
        """
        result = ArticleAvailability(pmid=pmid, doi=doi)
        enabled = self._parse_sources(sources)

        # Step 1: Get metadata from PMID
        pmc_id = ""
        if pmid:
            meta = await self.pmid_to_metadata(pmid)
            result.metadata = meta
            result.title = meta.get("title", "")
            if not doi:
                doi = meta.get("doi", "")
                result.doi = doi
            pmc_id = meta.get("pmc_id", "")

        # Source 1: PMC
        if "pmc" in enabled and (pmid or pmc_id):
            sr = await self.check_pmc_oa(pmid=pmid, pmc_id=pmc_id)
            if sr.available:
                self._apply_source(result, sr, "pmc")
                return result

        # Source 2: Unpaywall
        if "unpaywall" in enabled and doi:
            sr = await self.check_unpaywall(doi)
            if sr.available:
                self._apply_source(result, sr, "unpaywall")
                return result

        # Source 3: CORE
        if "core" in enabled:
            sr = await self.check_core(doi=doi, title=result.title)
            if sr.available:
                self._apply_source(result, sr, "core")
                return result

        # Source 4: Semantic Scholar
        if "s2" in enabled:
            sr = await self.check_semantic_scholar(doi=doi, pmid=pmid)
            if sr.available:
                self._apply_source(result, sr, "s2")
                return result

        # Source 5: EZproxy
        if "proxy" in enabled and doi:
            sr = self.build_proxy_url(doi)
            if sr.available:
                self._apply_source(result, sr, "proxy")
                return result

        return result

    async def batch_check(
        self,
        pmids: list[str],
        sources: str = "all",
    ) -> list[ArticleAvailability]:
        """Check availability for a list of PMIDs sequentially (respects rate limits)."""
        results = []
        for pmid in pmids:
            r = await self.check_availability(pmid=pmid, sources=sources)
            results.append(r)
        return results

    # -- Helpers -------------------------------------------------------------

    @staticmethod
    def _clean_doi(doi: str) -> str:
        doi = doi.strip()
        if doi.startswith("http"):
            doi = re.sub(r"https?://doi\.org/", "", doi)
        return doi

    @staticmethod
    def _parse_sources(sources: str) -> set[str]:
        if sources == "all":
            return {"pmc", "unpaywall", "core", "s2", "proxy"}
        return {s.strip() for s in sources.split(",") if s.strip()}

    @staticmethod
    def _apply_source(result: ArticleAvailability, sr: SourceResult, source_name: str):
        result.available = True
        result.source = source_name
        result.pdf_url = sr.pdf_url
        result.oa_status = sr.oa_status
        result.format = sr.format
        result.note = sr.note


# Global instance
fulltext_service = FullTextService()
