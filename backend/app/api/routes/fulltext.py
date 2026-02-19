"""
MedAI Hub - Full-Text Availability API Routes
Checks Open Access availability for articles by PMID or DOI.
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status, Depends
from pydantic import BaseModel, Field

from app.core.auth import get_current_user, UserPayload
from app.core.config import settings
from sr_skills.fulltext import FullTextService

# Create service instance wired to app config
fulltext_service = FullTextService(
    ncbi_api_key=settings.NCBI_API_KEY,
    pubmed_email=settings.PUBMED_EMAIL,
    core_api_key=settings.CORE_API_KEY,
    ezproxy_prefix=settings.EZPROXY_PREFIX,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/fulltext", tags=["fulltext"])


# -- Request/Response models -------------------------------------------------

class FullTextCheckRequest(BaseModel):
    pmids: list[str] = Field(default=[], description="PubMed IDs to check")
    doi: Optional[str] = Field(default=None, description="DOI to check (if no PMID)")
    sources: str = Field(default="all", description="Comma-separated sources: pmc,unpaywall,core,s2,proxy or 'all'")


class AvailabilityResult(BaseModel):
    pmid: str = ""
    doi: str = ""
    title: str = ""
    available: bool = False
    source: str = "none"
    pdf_url: str = ""
    oa_status: str = "unknown"
    format: str = ""
    note: str = ""


class FullTextCheckResponse(BaseModel):
    results: list[AvailabilityResult]
    summary: dict


# -- Routes ------------------------------------------------------------------

@router.post("/check", response_model=FullTextCheckResponse)
async def check_fulltext_availability(
    request: FullTextCheckRequest,
    current_user: UserPayload = Depends(get_current_user),
):
    """Check full-text availability for one or more articles."""
    try:
        if not request.pmids and not request.doi:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Provide at least one PMID or a DOI.",
            )

        if len(request.pmids) > 50:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum 50 PMIDs per request.",
            )

        results = []

        if request.pmids:
            batch = await fulltext_service.batch_check(
                pmids=request.pmids,
                sources=request.sources,
            )
            results.extend(batch)
        elif request.doi:
            single = await fulltext_service.check_availability(
                doi=request.doi,
                sources=request.sources,
            )
            results.append(single)

        result_dicts = [r.to_dict() for r in results]

        available_count = sum(1 for r in results if r.available)
        source_counts = {}
        for r in results:
            src = r.source
            source_counts[src] = source_counts.get(src, 0) + 1

        return FullTextCheckResponse(
            results=[AvailabilityResult(**d) for d in result_dicts],
            summary={
                "total": len(results),
                "available": available_count,
                "not_available": len(results) - available_count,
                "sources": source_counts,
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error checking full-text availability: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while checking full-text availability.",
        )
