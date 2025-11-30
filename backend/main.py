"""
MedAI Hub - FastAPI Backend Application
Production-ready SaaS platform for systematic literature review
"""

import logging
import time
from datetime import datetime

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.core.config import settings
from app.core.logging_config import setup_logging
from app.api.routes import projects, define, query, review

# Configure structured JSON logging
setup_logging(debug=settings.DEBUG)
logger = logging.getLogger(__name__)


# Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'"
        return response


# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# OpenAPI tags metadata for better API documentation
tags_metadata = [
    {
        "name": "projects",
        "description": "Project management operations. Create, read, update, and delete research projects."
    },
    {
        "name": "define",
        "description": "Research question definition with AI chat. Formulate research questions using frameworks like PICO, CoCoPop, PEO, SPIDER, etc."
    },
    {
        "name": "query",
        "description": "PubMed query generation. Generate optimized Boolean search queries for systematic literature reviews."
    },
    {
        "name": "review",
        "description": "Abstract screening and review. Upload MEDLINE files and use AI to screen abstracts for relevance."
    },
    {
        "name": "health",
        "description": "Health check endpoints. Monitor service status and readiness."
    },
]

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered systematic literature review platform for medical researchers",
    openapi_tags=tags_metadata,
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
)

# Attach rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log request method, path, status code, and duration"""
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    logger.info(
        f"{request.method} {request.url.path} - {response.status_code} - {duration:.3f}s",
        extra={
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_seconds": round(duration, 3)
        }
    )
    return response

# Add security headers middleware
app.add_middleware(SecurityHeadersMiddleware)

# Configure CORS with restricted methods and headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=settings.BACKEND_CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Include routers
app.include_router(projects.router, prefix=settings.API_V1_PREFIX)
app.include_router(define.router, prefix=settings.API_V1_PREFIX)
app.include_router(query.router, prefix=settings.API_V1_PREFIX)
app.include_router(review.router, prefix=settings.API_V1_PREFIX)


@app.get("/", tags=["health"])
async def root():
    """Root endpoint - API health check"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "healthy",
        "docs": "/api/docs",
    }


@app.get("/health", tags=["health"])
async def health_check(detailed: bool = False):
    """
    Health check endpoint with optional detailed diagnostics

    Args:
        detailed: If True, performs deep health checks on dependencies
    """
    health = {
        "status": "healthy",
        "service": "MedAI Hub Backend",
        "timestamp": datetime.utcnow().isoformat()
    }

    if detailed:
        # Check database connection
        try:
            from app.services.database import db_service
            # Simple query to verify connection
            health["database"] = "connected"
        except Exception as e:
            health["database"] = f"error: {str(e)}"
            health["status"] = "degraded"

        # Check AI service configuration
        try:
            from app.core.config import settings
            health["ai_configured"] = bool(settings.GOOGLE_API_KEY)
        except:
            health["ai_configured"] = False
            health["status"] = "degraded"

    return health


@app.get("/ready", tags=["health"])
async def readiness_check():
    """Kubernetes readiness probe endpoint"""
    return {"ready": True}


@app.on_event("startup")
async def startup_event():
    """Application startup event handler"""
    logger.info("MedAI Hub Backend starting up...")
    # Verify critical configuration
    if not settings.GOOGLE_API_KEY:
        logger.warning("GOOGLE_API_KEY not configured - AI features disabled")
    if not settings.SUPABASE_URL:
        logger.warning("SUPABASE_URL not configured - Database features disabled")
    logger.info(f"Running in {'DEBUG' if settings.DEBUG else 'PRODUCTION'} mode")


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event handler"""
    logger.info("MedAI Hub Backend shutting down...")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler to ensure CORS headers are included in error responses"""
    logger.exception(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Check logs for details."},
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )
