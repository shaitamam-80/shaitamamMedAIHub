"""
MedAI Hub - Query Tool API Routes
Handles PubMed search query generation and execution
"""

import logging
from uuid import UUID
from typing import Optional, List
import asyncio
from datetime import datetime
import csv
import io

from fastapi import APIRouter, HTTPException, status, Depends, Query, Request
from fastapi.responses import StreamingResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from pydantic import BaseModel, Field
from app.api.models.schemas import QueryGenerateRequest, QueryGenerateResponse
from app.services.database import db_service
from app.services.ai_service import ai_service
from app.services.pubmed_service import pubmed_service
from app.services.query_builder import query_builder
from app.services.mesh_service import mesh_service
from app.core.auth import get_current_user, UserPayload
from app.core.exceptions import TranslationError, ValidationError, DatabaseError, convert_to_http_exception

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/query", tags=["query"])
limiter = Limiter(key_func=get_remote_address)


# ============================================================================
# Additional Pydantic Models for New Endpoints
# ============================================================================

class PubMedSearchRequest(BaseModel):
    """Request to execute a PubMed search"""
    query: str = Field(..., min_length=3, description="PubMed search query")
    max_results: int = Field(default=20, ge=1, le=100, description="Max results per page")
    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    sort: str = Field(default="relevance", pattern="^(relevance|date)$")


class PubMedArticle(BaseModel):
    """Summary of a PubMed article"""
    pmid: str
    title: str
    authors: str
    journal: str
    pubdate: str
    doi: Optional[str] = None
    pubtype: Optional[List[str]] = None


class PubMedSearchResponse(BaseModel):
    """Response from PubMed search with pagination"""
    count: int = Field(..., description="Total matching articles")
    returned: int = Field(..., description="Number of articles in this page")
    page: int = Field(..., description="Current page number")
    total_pages: int = Field(..., description="Total pages available")
    articles: List[PubMedArticle]
    query: str


class QueryValidationResponse(BaseModel):
    """Response from query validation"""
    valid: bool
    count: int
    query_translation: str
    errors: List[str]


class ResearchQuestionRequest(BaseModel):
    """Request to generate query from a research question"""
    project_id: UUID
    research_question: str = Field(..., min_length=10, description="Research question text")
    framework_type: Optional[str] = None


class MedlineExportRequest(BaseModel):
    """Request to export search results"""
    query: str = Field(..., description="PubMed query to export")
    pmids: Optional[List[str]] = Field(default=None, description="Specific PMIDs to export (if None, export from query)")
    max_results: int = Field(default=100, ge=1, le=500, description="Max articles to export")
    format: str = Field(default="medline", pattern="^(medline|csv)$", description="Export format")


class ConceptTerm(BaseModel):
    """A single term (MeSH or free-text) for a concept"""
    term: str
    source: str = Field(..., description="'mesh', 'entry_term', or 'ai_generated'")
    selected: bool = True


class ConceptAnalysisItem(BaseModel):
    """Analysis of a single framework component"""
    key: str = Field(..., description="Component key (P, I, C, O, etc.)")
    label: str = Field(..., description="Full label (Population, Intervention, etc.)")
    original_value: str = Field(..., description="User's original input")
    mesh_terms: List[ConceptTerm] = Field(default_factory=list)
    free_text_terms: List[ConceptTerm] = Field(default_factory=list)


class ConceptAnalysisResponse(BaseModel):
    """Response from concept analysis endpoint"""
    project_id: str
    framework_type: str
    concepts: List[ConceptAnalysisItem]


# ============================================================================
# Existing Endpoints (Updated)
# ============================================================================

@router.post("/generate")
@limiter.limit("20/minute")
async def generate_query(
    http_request: Request,
    request: QueryGenerateRequest,
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Generate PubMed boolean search query from framework data

    Uses programmatic query building with MeSH expansion from NCBI API.
    Translates Hebrew to English if needed using AI.
    """
    try:
        # Verify project exists
        project = await db_service.get_project(request.project_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        # Verify ownership
        if project.get("user_id") and project["user_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
            )

        # Use project's framework data if not provided
        framework_data = request.framework_data
        if not framework_data:
            framework_data = project.get("framework_data", {})

        if not framework_data:
            raise ValidationError("No framework data available. Please complete the Define tool first.")

        # Get framework_type from project
        framework_type = project.get("framework_type", "PICO")

        # Step 1: Translate Hebrew to English if needed (fast, ~5 seconds)
        try:
            english_framework_data = await ai_service.translate_framework_to_english(framework_data)
            logger.info(f"Framework data translated for project {request.project_id}")
        except Exception as translate_error:
            logger.warning(f"Translation failed, using original data: {translate_error}")
            english_framework_data = framework_data

        # Step 2: Build query using programmatic MeSH expansion (no AI, ~5 seconds)
        method_used = "query_builder"
        try:
            result = await query_builder.build_query_strategy(
                english_framework_data, framework_type
            )

            # Validate result has strategies
            if not result.get("strategies") or not result["strategies"].get("comprehensive"):
                raise ValueError("Query Builder returned empty strategies")

            logger.info(f"Query built successfully for project {request.project_id}")

        except Exception as build_error:
            # Use SIMPLE programmatic fallback (no external API calls)
            logger.warning(f"Query Builder failed ({type(build_error).__name__}: {build_error}), using simple fallback")
            method_used = "simple_fallback"

            # Generate simple Boolean query without external APIs
            fallback_query = ai_service.generate_simple_fallback_query(
                english_framework_data, framework_type
            )

            # Build complete response structure
            result = ai_service.build_fallback_response(
                fallback_query, framework_type, english_framework_data,
                reason=f"MeSH API/Builder failed: {type(build_error).__name__}"
            )

        # Save the focused query to database (primary query)
        focused_query = result.get("queries", {}).get("focused", "")
        try:
            await db_service.save_query_string(
                {
                    "project_id": str(request.project_id),
                    "query_text": focused_query,
                    "query_type": request.query_type,
                }
            )
        except Exception as db_error:
            logger.error(f"Failed to save query string: {db_error}")
            raise DatabaseError("Failed to save generated query to database")

        # Create analysis run record
        try:
            await db_service.create_analysis_run(
                {
                    "project_id": str(request.project_id),
                    "tool": "QUERY",
                    "status": "completed",
                    "results": result,
                    "config": {
                        "framework_data": english_framework_data,
                        "framework_type": framework_type,
                        "method": "mesh_expansion"  # Track which method was used
                    },
                }
            )
        except Exception as db_error:
            logger.warning(f"Failed to create analysis run: {db_error}")
            # Non-critical - continue anyway

        # Return full V2 response (not filtered by Pydantic model)
        result["framework_type"] = framework_type
        result["framework_data"] = english_framework_data
        return result

    except HTTPException:
        raise
    except (TranslationError, ValidationError, DatabaseError) as e:
        raise convert_to_http_exception(e)
    except Exception as e:
        logger.exception(f"Unexpected error generating query for project {request.project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while generating the query.",
        )


@router.get("/history/{project_id}")
async def get_query_history(
    project_id: UUID,
    current_user: UserPayload = Depends(get_current_user)
):
    """Get all generated queries for a project"""
    try:
        # Verify project ownership
        project = await db_service.get_project(project_id)
        if project and project.get("user_id") and project["user_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
            )

        queries = await db_service.get_query_strings_by_project(project_id)
        return {"queries": queries}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting query history for project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving query history.",
        )


# ============================================================================
# New Endpoint: Concept Analysis
# ============================================================================

@router.get("/analyze-concepts/{project_id}", response_model=ConceptAnalysisResponse)
async def analyze_concepts(
    project_id: UUID,
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Analyze framework components and generate concept table for query building.

    This endpoint:
    1. Fetches project's framework data
    2. Decomposes composite phrases into individual MeSH-searchable concepts (AI-powered)
    3. Looks up MeSH terms from local database for each decomposed concept
    4. Generates AI-powered free-text suggestions
    5. Returns structured concept analysis for UI display

    The response can be used to build the Concept Analysis table
    where users can edit/select terms before generating queries.
    """
    try:
        # Verify project exists and user has access
        project = await db_service.get_project(project_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )

        if project.get("user_id") and project["user_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        framework_data = project.get("framework_data", {})
        framework_type = project.get("framework_type", "PICO")

        if not framework_data:
            raise ValidationError("No framework data available. Please complete the Define tool first.")

        # Step 1: Translate Hebrew to English if needed
        try:
            english_framework_data = await ai_service.translate_framework_to_english(framework_data)
        except Exception as e:
            logger.warning(f"Translation failed, using original: {e}")
            english_framework_data = framework_data

        # Step 2: Decompose composite phrases into individual MeSH-searchable concepts
        # Example: "Adults with generalized anxiety disorder" -> ["Adults", "Generalized Anxiety Disorder"]
        decomposed_concepts = await ai_service.decompose_to_mesh_concepts(
            english_framework_data, framework_type
        )
        logger.info(f"Decomposed concepts: {decomposed_concepts}")

        # Step 3: Get MeSH terms from local database for EACH decomposed concept
        # This is the key change - instead of searching "Adults with GAD" as one phrase,
        # we search "Adults" and "Generalized Anxiety Disorder" separately
        all_mesh_results = {}
        for key, decomposed_terms in decomposed_concepts.items():
            key_mesh_terms = []
            key_entry_terms = []

            for term in decomposed_terms:
                # Search MeSH for each individual term
                mesh_data = await mesh_service.expand_term(term)
                if mesh_data and mesh_data.mesh_terms:
                    for mt in mesh_data.mesh_terms:
                        if mt.descriptor_name not in [m.descriptor_name for m in key_mesh_terms]:
                            key_mesh_terms.append(mt)
                    # Collect entry terms (limit to avoid duplication)
                    for entry in mesh_data.entry_terms[:3]:
                        if entry not in key_entry_terms:
                            key_entry_terms.append(entry)

            all_mesh_results[key] = {
                "mesh_terms": key_mesh_terms,
                "entry_terms": key_entry_terms,
                "decomposed_terms": decomposed_terms
            }

        # Step 4: Generate AI free-text terms (parallel call)
        ai_terms = await ai_service.generate_free_text_terms(
            english_framework_data, framework_type
        )

        # Step 5: Build response with labels
        from app.core.prompts.shared import FRAMEWORK_SCHEMAS
        schema = FRAMEWORK_SCHEMAS.get(framework_type, FRAMEWORK_SCHEMAS["PICO"])
        component_labels = schema.get("labels", {})

        concepts = []
        for key, value in english_framework_data.items():
            if not value or key.lower() in ['research_question', 'framework_type']:
                continue

            # Get MeSH data for this component (from decomposed search)
            mesh_data = all_mesh_results.get(key, {})
            mesh_terms_list = mesh_data.get("mesh_terms", [])
            entry_terms_list = mesh_data.get("entry_terms", [])
            decomposed_terms = mesh_data.get("decomposed_terms", [])

            # Build mesh_terms list
            mesh_terms = []
            for mt in mesh_terms_list:
                mesh_terms.append(ConceptTerm(
                    term=mt.descriptor_name,
                    source="mesh",
                    selected=True
                ))
            # Add entry terms
            for entry in entry_terms_list[:5]:
                mesh_terms.append(ConceptTerm(
                    term=entry,
                    source="entry_term",
                    selected=False
                ))

            # Build free_text_terms list
            free_text_terms = []
            # Add decomposed terms as free-text (these are the AI-parsed concepts)
            for term in decomposed_terms:
                # Don't add if it's already a MeSH term
                if not any(mt.term.lower() == term.lower() for mt in mesh_terms):
                    free_text_terms.append(ConceptTerm(
                        term=term,
                        source="mesh_derived",
                        selected=True
                    ))

            # From AI-generated terms
            ai_key_terms = ai_terms.get(key, [])
            for term in ai_key_terms:
                # Avoid duplicates
                if not any(ft.term.lower() == term.lower() for ft in free_text_terms):
                    free_text_terms.append(ConceptTerm(
                        term=term,
                        source="ai_generated",
                        selected=True
                    ))

            concepts.append(ConceptAnalysisItem(
                key=key,
                label=component_labels.get(key, key),
                original_value=value,
                mesh_terms=mesh_terms,
                free_text_terms=free_text_terms
            ))

        # Sort concepts by PICO order
        from app.core.search_config import PICO_PRIORITY
        concepts.sort(key=lambda c: PICO_PRIORITY.get(c.key.upper(), 99))

        return ConceptAnalysisResponse(
            project_id=str(project_id),
            framework_type=framework_type,
            concepts=concepts
        )

    except HTTPException:
        raise
    except (TranslationError, ValidationError, DatabaseError) as e:
        raise convert_to_http_exception(e)
    except Exception as e:
        logger.exception(f"Error analyzing concepts for project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while analyzing concepts."
        )


# ============================================================================
# New Endpoints: PubMed Search Execution
# ============================================================================

@router.post("/execute", response_model=PubMedSearchResponse)
async def execute_pubmed_search(
    request: PubMedSearchRequest,
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Execute a PubMed search query and return paginated results.

    This allows running queries directly from the app without
    leaving to PubMed's website.
    """
    try:
        # Calculate offset for pagination
        offset = (request.page - 1) * request.max_results

        result = await pubmed_service.search(
            query=request.query,
            max_results=request.max_results,
            sort=request.sort,
            retstart=offset
        )

        # Calculate total pages
        total_count = result["count"]
        total_pages = (total_count + request.max_results - 1) // request.max_results

        return PubMedSearchResponse(
            count=total_count,
            returned=result["returned"],
            page=request.page,
            total_pages=total_pages,
            articles=[PubMedArticle(**article) for article in result["articles"]],
            query=result["query"]
        )

    except Exception as e:
        logger.exception(f"Error executing PubMed search: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/validate", response_model=QueryValidationResponse)
async def validate_query(
    request: PubMedSearchRequest,
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Validate a PubMed query syntax and return the result count.

    Useful for checking query syntax before executing a full search.
    """
    try:
        result = await pubmed_service.validate_query(request.query)
        return QueryValidationResponse(**result)

    except Exception as e:
        logger.exception(f"Error validating query: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/abstract/{pmid}")
async def get_abstract(
    pmid: str,
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Fetch full abstract for a specific PubMed article.

    Args:
        pmid: PubMed ID of the article
    """
    try:
        result = await pubmed_service.get_abstract(pmid)

        if result is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Article with PMID {pmid} not found"
            )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error fetching abstract for PMID {pmid}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ============================================================================
# New Endpoint: Get Research Questions from Project
# ============================================================================

@router.get("/research-questions/{project_id}")
async def get_research_questions(
    project_id: UUID,
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Get research questions extracted from a project's Define chat.

    Returns framework data and any formulated questions found
    in the conversation history.
    """
    try:
        # Verify project ownership
        project = await db_service.get_project(project_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )

        if project.get("user_id") and project["user_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Get conversation history
        conversation = await db_service.get_conversation(project_id)

        # Extract research questions from assistant messages
        questions = []
        import re

        def is_english(text: str) -> bool:
            """Check if text is primarily English (ASCII letters)"""
            # Count English letters vs Hebrew letters
            english_chars = sum(1 for c in text if c.isascii() and c.isalpha())
            total_letters = sum(1 for c in text if c.isalpha())
            if total_letters == 0:
                return False
            return (english_chars / total_letters) > 0.7

        for msg in conversation:
            if msg.get("role") == "assistant":
                content = msg.get("content", "")

                # Look for quoted questions
                patterns = [
                    r'"([^"]+\?)"',  # Standard quotes ending with ?
                    r'"([^"]+\?)"',  # Hebrew quotes ending with ?
                ]

                for pattern in patterns:
                    matches = re.findall(pattern, content)
                    for match in matches:
                        # Only include English questions (PubMed doesn't support Hebrew)
                        if len(match) >= 30 and is_english(match):
                            if match not in questions:
                                questions.append(match)

        # Translate framework_data to English (PubMed requires English)
        english_framework_data = await ai_service._translate_framework_data(
            project.get("framework_data", {})
        )

        # Validate no Hebrew remains after translation
        if ai_service._contains_hebrew(str(english_framework_data)):
            logger.warning(f"Hebrew detected after translation for project {project_id}")
            # Don't fail, but log - the existing validation below will handle it

        # CRITICAL: Validate no Hebrew remains after translation
        def contains_hebrew(text: str) -> bool:
            """Check if text contains Hebrew characters"""
            if not isinstance(text, str):
                return False
            return any('\u0590' <= char <= '\u05FF' for char in text)

        # Check all framework data fields for Hebrew
        hebrew_fields = [
            key for key, value in english_framework_data.items()
            if isinstance(value, str) and contains_hebrew(value)
        ]

        if hebrew_fields:
            # Translation failed - raise clear error
            raise TranslationError(
                f"Translation failed: Hebrew characters remain in fields {', '.join(hebrew_fields)}. Please try again or ensure all text is in English."
            )

        return {
            "project_id": str(project_id),
            "project_name": project.get("name", ""),
            "framework_type": project.get("framework_type", "PICO"),
            "framework_data": english_framework_data,
            "research_questions": questions[:5]  # Max 5 questions
        }

    except HTTPException:
        raise
    except (TranslationError, ValidationError, DatabaseError) as e:
        raise convert_to_http_exception(e)
    except Exception as e:
        logger.exception(f"Error getting research questions for project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving research questions.",
        )


@router.post("/generate-from-question", response_model=QueryGenerateResponse)
async def generate_query_from_question(
    request: ResearchQuestionRequest,
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Generate PubMed query from a specific research question.

    Uses programmatic Query Builder (with MeSH expansion) as PRIMARY method,
    falls back to AI-based generation only if MeSH API fails.

    This ensures Split Query Logic (P AND I AND O) OR (P AND C AND O) is used
    for comparison questions.
    """
    try:
        # Verify project exists
        project = await db_service.get_project(request.project_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )

        # Verify ownership
        if project.get("user_id") and project["user_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Get framework data from project
        framework_data = project.get("framework_data", {})
        framework_type = request.framework_type or project.get("framework_type", "PICO")

        # Step 1: Translate Hebrew to English if needed (PubMed requires English)
        try:
            english_framework_data = await ai_service.translate_framework_to_english(framework_data)
            logger.info(f"Framework data translated for project {request.project_id}")
        except Exception as translate_error:
            logger.warning(f"Translation failed, using original data: {translate_error}")
            english_framework_data = framework_data

        # Step 2: Use Query Builder (programmatic) as PRIMARY method
        # This ensures Split Query Logic is applied for comparison questions
        method_used = "query_builder"
        try:
            result = await query_builder.build_query_strategy(
                english_framework_data, framework_type
            )

            # Validate result has strategies
            if not result.get("strategies") or not result["strategies"].get("comprehensive"):
                raise ValueError("Query Builder returned empty strategies")

            logger.info(f"Query built successfully using Query Builder for project {request.project_id}")

            # Add research question to result metadata
            result["research_question"] = request.research_question

        except Exception as build_error:
            # Step 3: Use SIMPLE programmatic fallback (no external API calls)
            # This avoids the AI fallback which can fail with JSON parsing errors
            logger.warning(f"Query Builder failed ({type(build_error).__name__}: {build_error}), using simple fallback")
            method_used = "simple_fallback"

            # Generate simple Boolean query without external APIs
            fallback_query = ai_service.generate_simple_fallback_query(
                english_framework_data, framework_type
            )

            # Build complete V2 response structure
            result = ai_service.build_fallback_response(
                fallback_query, framework_type, english_framework_data,
                reason=f"MeSH API/Builder failed: {type(build_error).__name__}"
            )

            # Add research question to result
            result["research_question"] = request.research_question

        # Save the focused query to database
        focused_query = result.get("queries", {}).get("focused", "")
        try:
            await db_service.save_query_string(
                {
                    "project_id": str(request.project_id),
                    "query_text": focused_query,
                    "query_type": "boolean",
                }
            )
        except Exception as db_error:
            logger.error(f"Failed to save query string: {db_error}")
            # Non-critical - continue anyway

        # Create analysis run record
        try:
            await db_service.create_analysis_run(
                {
                    "project_id": str(request.project_id),
                    "tool": "QUERY",
                    "status": "completed",
                    "results": result,
                    "config": {
                        "framework_data": english_framework_data,
                        "framework_type": framework_type,
                        "research_question": request.research_question,
                        "method": method_used
                    },
                }
            )
        except Exception as db_error:
            logger.warning(f"Failed to create analysis run: {db_error}")
            # Non-critical - continue anyway

        # Return full V2 response (not filtered by Pydantic model)
        result["framework_type"] = framework_type
        result["framework_data"] = english_framework_data
        return result

    except HTTPException:
        raise
    except (TranslationError, ValidationError, DatabaseError) as e:
        raise convert_to_http_exception(e)
    except Exception as e:
        logger.exception(f"Error generating query from question: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while generating the query.",
        )


# ============================================================================
# Helper Functions for MEDLINE Export
# ============================================================================

def format_as_medline(articles: List[dict]) -> str:
    """Format articles as MEDLINE text"""
    output = []

    for article in articles:
        lines = []

        # PMID
        if article.get("pmid"):
            lines.append(f"PMID- {article['pmid']}")

        # Title (may be multi-line)
        if article.get("title"):
            title = article["title"]
            lines.append(f"TI  - {title}")

        # Abstract (multi-line with 6-space continuation)
        if article.get("abstract"):
            abstract = article["abstract"]
            # Split into lines of ~80 chars
            words = abstract.split()
            current_line = "AB  - "
            for word in words:
                if len(current_line) + len(word) + 1 > 80:
                    lines.append(current_line.rstrip())
                    current_line = "      " + word + " "  # 6-space continuation
                else:
                    current_line += word + " "
            if current_line.strip():
                lines.append(current_line.rstrip())

        # Authors
        if article.get("authors"):
            authors = article["authors"]
            if isinstance(authors, str):
                # Split by comma or semicolon
                author_list = [a.strip() for a in authors.replace(";", ",").split(",")]
            else:
                author_list = authors
            for author in author_list[:10]:  # Limit to 10 authors
                if author:
                    lines.append(f"AU  - {author}")

        # Journal
        if article.get("journal"):
            lines.append(f"JT  - {article['journal']}")

        # Publication date
        if article.get("pubdate"):
            lines.append(f"DP  - {article['pubdate']}")

        # Publication types
        if article.get("pubtype"):
            for pt in article["pubtype"]:
                lines.append(f"PT  - {pt}")

        # DOI
        if article.get("doi"):
            lines.append(f"LID - {article['doi']} [doi]")

        # Language
        lines.append("LA  - eng")

        # Source (citation)
        if article.get("journal") and article.get("pubdate"):
            so = f"{article['journal']}. {article['pubdate']}"
            if article.get("doi"):
                so += f". doi: {article['doi']}"
            lines.append(f"SO  - {so}")

        output.append("\n".join(lines))

    # Join articles with blank line separator
    return "\n\n".join(output)


def format_as_csv(articles: List[dict]) -> str:
    """Format articles as CSV"""
    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow(["PMID", "Title", "Authors", "Journal", "Year", "DOI", "Abstract"])

    # Data
    for article in articles:
        writer.writerow([
            article.get("pmid", ""),
            article.get("title", ""),
            article.get("authors", ""),
            article.get("journal", ""),
            article.get("pubdate", ""),
            article.get("doi", ""),
            article.get("abstract", "")[:500] if article.get("abstract") else ""  # Truncate abstract
        ])

    return output.getvalue()


# ============================================================================
# New Endpoint: MEDLINE Export
# ============================================================================

@router.post("/export")
async def export_results(
    request: MedlineExportRequest,
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Export search results in MEDLINE or CSV format.
    Returns a downloadable file.
    """
    try:
        # Fetch articles
        if request.pmids:
            # Export specific articles by PMID
            articles = await pubmed_service.fetch_by_pmids(request.pmids)
        else:
            # Export from query
            result = await pubmed_service.search(
                query=request.query,
                max_results=request.max_results,
                sort="relevance"
            )
            articles = result.get("articles", [])

        if not articles:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No articles found to export"
            )

        # Generate file content based on format
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

        if request.format == "medline":
            content = format_as_medline(articles)
            media_type = "text/plain"
            filename = f"pubmed_export_{timestamp}.txt"
        else:  # csv
            content = format_as_csv(articles)
            media_type = "text/csv"
            filename = f"pubmed_export_{timestamp}.csv"

        return StreamingResponse(
            iter([content.encode('utf-8')]),
            media_type=media_type,
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error exporting results: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
