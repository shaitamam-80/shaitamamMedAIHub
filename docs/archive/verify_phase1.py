"""
Verification Script for Smart Screener Phase 1
Tests: PubMed Fetch -> Parsing -> Rule Engine Logic
"""

import asyncio
import logging
from app.services.pubmed_service import pubmed_service
from app.services.medline_parser import MedlineParser
from app.services.rule_engine import RuleEngine
from app.api.models.screening import CriteriaConfig

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def verify_pipeline():
    print("1. Testing PubMed Fetch (MEDLINE)...")
    # Using a known PMID: 12345678 (Old article) or recent one.
    # Let's use a recent one to test dates.
    # PMID 37340000 (Random recent one? Or fetch a specific query)
    # Let's search for "aspirin headache" and take one.

    search_res = await pubmed_service.search("aspirin headache", max_results=1)
    if not search_res["articles"]:
        print("No articles found to test.")
        return

    pmid = search_res["articles"][0]["pmid"]
    print(f"Testing with PMID: {pmid}")

    medline_txt = await pubmed_service.fetch_details_as_medline([pmid])
    if not medline_txt:
        print("Failed to fetch MEDLINE.")
        return
    print(f"Fetched MEDLINE content ({len(medline_txt)} chars).")

    print("\n2. Testing Parser...")
    parser = MedlineParser()
    abstracts = parser.parse_content(medline_txt)
    if not abstracts:
        print("Failed to parse.")
        return

    abstract = abstracts[0]
    print(f"Parsed PMID: {abstract.pmid}")
    print(f"Title: {abstract.title}")
    print(f"Pub Types: {abstract.publication_types}")
    print(f"Language: {abstract.language}")
    print(f"Year: {abstract.publication_date}")

    print("\n3. Testing Rule Engine...")
    # Config: Recent articles only (last 5 years), English only
    config = CriteriaConfig(
        review_type="systematic",
        date_range_start=2020,
        date_range_end=2030,
        languages=["eng"],
        study_design={
            "exclusion_codes": ["S-Ex2", "S-Ex3"]
        },  # Exclude letters/editorials
    )

    engine = RuleEngine(config)
    status, reason = engine.evaluate(abstract)

    print(f"Decision: {status.upper()}")
    if reason:
        print(f"Reason: {reason}")
    else:
        print("Reason: Passed all rules.")


if __name__ == "__main__":
    asyncio.run(verify_pipeline())
