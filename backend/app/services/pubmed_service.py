"""
MedAI Hub - PubMed Service
Handles PubMed E-utilities API interactions for query execution
"""

import httpx
import logging
from typing import Dict, Any, List, Optional
from xml.etree import ElementTree

logger = logging.getLogger(__name__)

# PubMed E-utilities base URL
EUTILS_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"


class PubMedService:
    """Service for PubMed API operations"""

    def __init__(self):
        self.base_url = EUTILS_BASE_URL
        # Optional: Add API key for higher rate limits
        # self.api_key = settings.NCBI_API_KEY

    async def search(
        self,
        query: str,
        max_results: int = 20,
        sort: str = "relevance"
    ) -> Dict[str, Any]:
        """
        Execute a PubMed search query and return results.

        Args:
            query: PubMed boolean search query
            max_results: Maximum number of results to return (default 20)
            sort: Sort order - "relevance" or "date"

        Returns:
            Dict with count, pmids, and article summaries
        """
        try:
            # Step 1: ESearch - Get PMIDs matching the query
            esearch_url = f"{self.base_url}/esearch.fcgi"
            esearch_params = {
                "db": "pubmed",
                "term": query,
                "retmax": max_results,
                "retmode": "json",
                "sort": "pub+date" if sort == "date" else "relevance",
                "usehistory": "y"
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                esearch_response = await client.get(esearch_url, params=esearch_params)
                esearch_response.raise_for_status()
                esearch_data = esearch_response.json()

            esearch_result = esearch_data.get("esearchresult", {})
            total_count = int(esearch_result.get("count", 0))
            pmids = esearch_result.get("idlist", [])

            if not pmids:
                return {
                    "count": total_count,
                    "returned": 0,
                    "articles": [],
                    "query": query
                }

            # Step 2: ESummary - Get article details
            esummary_url = f"{self.base_url}/esummary.fcgi"
            esummary_params = {
                "db": "pubmed",
                "id": ",".join(pmids),
                "retmode": "json"
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                esummary_response = await client.get(esummary_url, params=esummary_params)
                esummary_response.raise_for_status()
                esummary_data = esummary_response.json()

            # Parse article summaries
            articles = []
            result = esummary_data.get("result", {})

            for pmid in pmids:
                article_data = result.get(pmid, {})
                if article_data and isinstance(article_data, dict):
                    # Extract authors
                    authors = article_data.get("authors", [])
                    author_names = []
                    if authors:
                        for author in authors[:3]:  # First 3 authors
                            author_names.append(author.get("name", ""))
                        if len(authors) > 3:
                            author_names.append("et al.")

                    articles.append({
                        "pmid": pmid,
                        "title": article_data.get("title", "No title"),
                        "authors": ", ".join(author_names) if author_names else "Unknown",
                        "journal": article_data.get("fulljournalname", article_data.get("source", "Unknown")),
                        "pubdate": article_data.get("pubdate", "Unknown"),
                        "doi": article_data.get("elocationid", ""),
                        "pubtype": article_data.get("pubtype", []),
                    })

            return {
                "count": total_count,
                "returned": len(articles),
                "articles": articles,
                "query": query
            }

        except httpx.TimeoutException:
            logger.error("PubMed API timeout")
            raise Exception("PubMed search timed out. Please try again.")
        except httpx.HTTPStatusError as e:
            logger.error(f"PubMed API HTTP error: {e}")
            raise Exception(f"PubMed API error: {e.response.status_code}")
        except Exception as e:
            logger.exception(f"PubMed search error: {e}")
            raise Exception(f"Failed to search PubMed: {str(e)}")

    async def get_abstract(self, pmid: str) -> Optional[Dict[str, Any]]:
        """
        Fetch full abstract for a specific PMID.

        Args:
            pmid: PubMed ID

        Returns:
            Dict with full article details including abstract
        """
        try:
            efetch_url = f"{self.base_url}/efetch.fcgi"
            efetch_params = {
                "db": "pubmed",
                "id": pmid,
                "retmode": "xml"
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(efetch_url, params=efetch_params)
                response.raise_for_status()

            # Parse XML response
            root = ElementTree.fromstring(response.content)
            article = root.find(".//PubmedArticle")

            if article is None:
                return None

            # Extract abstract text
            abstract_elem = article.find(".//Abstract/AbstractText")
            abstract_text = ""
            if abstract_elem is not None:
                # Handle structured abstracts
                abstract_parts = article.findall(".//Abstract/AbstractText")
                if len(abstract_parts) > 1:
                    parts = []
                    for part in abstract_parts:
                        label = part.get("Label", "")
                        text = part.text or ""
                        if label:
                            parts.append(f"{label}: {text}")
                        else:
                            parts.append(text)
                    abstract_text = " ".join(parts)
                else:
                    abstract_text = abstract_elem.text or ""

            # Extract title
            title_elem = article.find(".//ArticleTitle")
            title = title_elem.text if title_elem is not None else ""

            # Extract authors
            authors = []
            author_list = article.findall(".//Author")
            for author in author_list[:5]:
                last_name = author.find("LastName")
                fore_name = author.find("ForeName")
                if last_name is not None:
                    name = last_name.text or ""
                    if fore_name is not None:
                        name = f"{fore_name.text} {name}"
                    authors.append(name)

            # Extract journal
            journal_elem = article.find(".//Journal/Title")
            journal = journal_elem.text if journal_elem is not None else ""

            # Extract publication date
            pub_date = article.find(".//PubDate")
            year = pub_date.find("Year").text if pub_date is not None and pub_date.find("Year") is not None else ""

            # Extract keywords
            keywords = []
            keyword_list = article.findall(".//Keyword")
            for kw in keyword_list:
                if kw.text:
                    keywords.append(kw.text)

            return {
                "pmid": pmid,
                "title": title,
                "abstract": abstract_text,
                "authors": ", ".join(authors),
                "journal": journal,
                "year": year,
                "keywords": keywords
            }

        except Exception as e:
            logger.exception(f"Error fetching abstract for PMID {pmid}: {e}")
            return None

    async def validate_query(self, query: str) -> Dict[str, Any]:
        """
        Validate a PubMed query syntax and return count without fetching results.

        Args:
            query: PubMed boolean search query

        Returns:
            Dict with validation status and count
        """
        try:
            esearch_url = f"{self.base_url}/esearch.fcgi"
            esearch_params = {
                "db": "pubmed",
                "term": query,
                "retmax": 0,  # Don't return any results
                "retmode": "json"
            }

            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(esearch_url, params=esearch_params)
                response.raise_for_status()
                data = response.json()

            result = data.get("esearchresult", {})

            # Check for query translation (indicates valid query)
            query_translation = result.get("querytranslation", "")
            error_list = result.get("errorlist", {})

            return {
                "valid": not bool(error_list),
                "count": int(result.get("count", 0)),
                "query_translation": query_translation,
                "errors": error_list.get("phrasesnotfound", []) if error_list else []
            }

        except Exception as e:
            logger.exception(f"Error validating query: {e}")
            return {
                "valid": False,
                "count": 0,
                "query_translation": "",
                "errors": [str(e)]
            }


# Global instance
pubmed_service = PubMedService()
