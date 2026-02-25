"""
MedAI Hub - OpenAlex Search Route
===================================

Provides search endpoints for the OpenAlex academic database (260M+ works).
Returns normalized articles matching the same schema as PubMed articles,
so downstream stages (screening, extraction, etc.) work identically.

Endpoints:
    POST /api/v1/openalex/search — Search OpenAlex with cursor-based pagination
"""

import logging
from typing import Any, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.config import settings
from sr_skills.services.openalex import OpenAlexService, OpenAlexSearchResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/openalex", tags=["openalex"])

# ============================================================================
# Singleton Service Instance
# ============================================================================

_openalex_service: OpenAlexService | None = None


def get_openalex_service() -> OpenAlexService:
    """Get or create the singleton OpenAlex service instance."""
    global _openalex_service
    if _openalex_service is None:
        _openalex_service = OpenAlexService(
            api_key=settings.OPENALEX_API_KEY,
            email=settings.OPENALEX_EMAIL,
        )
    return _openalex_service


# ============================================================================
# Request / Response Models
# ============================================================================

class OpenAlexSearchRequest(BaseModel):
    """Request body for OpenAlex search."""
    query: str = Field(
        ...,
        min_length=1,
        description="Search query (supports Boolean AND/OR/NOT)",
        examples=["machine learning AND education"],
    )
    filters: Optional[dict[str, str]] = Field(
        default=None,
        description="Additional OpenAlex filters (e.g., from_publication_date, to_publication_date, type, is_oa)",
        examples=[{"from_publication_date": "2020-01-01"}],
    )
    cursor: str = Field(
        default="*",
        description="Pagination cursor. Use '*' for first page, then pass meta.next_cursor from previous response.",
    )
    per_page: int = Field(
        default=25,
        ge=1,
        le=200,
        description="Results per page (max 200)",
    )


class SearchMetaResponse(BaseModel):
    """Pagination metadata."""
    count: int = Field(description="Total results matching the query")
    per_page: int = Field(description="Results in this page")
    next_cursor: Optional[str] = Field(description="Cursor for next page, null if no more results")


class OpenAlexSearchResponseModel(BaseModel):
    """Response from OpenAlex search."""
    results: list[dict[str, Any]] = Field(description="Normalized article objects")
    meta: SearchMetaResponse


# ============================================================================
# Endpoints
# ============================================================================

@router.post("/search", response_model=OpenAlexSearchResponseModel)
async def search_openalex(request: OpenAlexSearchRequest):
    """
    Search OpenAlex for academic works.

    Returns normalized articles with the same schema as PubMed articles,
    including reconstructed abstracts from inverted index format.

    Uses cursor-based pagination — pass `meta.next_cursor` from the response
    as `cursor` in the next request to fetch the next page.
    """
    service = get_openalex_service()

    try:
        response: OpenAlexSearchResponse = await service.search_works(
            query=request.query,
            filters=request.filters,
            per_page=request.per_page,
            cursor=request.cursor,
        )

        return OpenAlexSearchResponseModel(
            results=response.results,
            meta=SearchMetaResponse(
                count=response.meta.count,
                per_page=response.meta.per_page,
                next_cursor=response.meta.next_cursor,
            ),
        )

    except Exception as e:
        logger.error(f"OpenAlex search failed: {e}")
        raise HTTPException(
            status_code=502,
            detail=f"OpenAlex search failed: {str(e)}",
        )
