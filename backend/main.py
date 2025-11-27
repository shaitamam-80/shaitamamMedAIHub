"""
MedAI Hub - FastAPI Backend Application
Production-ready SaaS platform for systematic literature review
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import projects, define, query, review

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered systematic literature review platform",
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
)

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


@app.get("/")
async def root():
    """Root endpoint - API health check"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "healthy",
        "docs": "/api/docs",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "MedAI Hub Backend"}


@app.get("/debug/config")
async def debug_config():
    """Debug endpoint to check configuration (remove in production)"""
    from app.services.database import db_service

    # Mask keys for security (show first 10 and last 4 chars)
    def mask_key(key: str) -> str:
        if not key or len(key) < 20:
            return "NOT_SET" if not key else "TOO_SHORT"
        return f"{key[:10]}...{key[-4:]}"

    # Test Supabase connection
    db_status = "unknown"
    db_error = None
    try:
        # Try a simple query
        result = db_service.client.table("projects").select("id").limit(1).execute()
        db_status = "connected"
    except Exception as e:
        db_status = "error"
        db_error = str(e)

    return {
        "supabase_url": settings.SUPABASE_URL,
        "supabase_key_masked": mask_key(settings.SUPABASE_KEY),
        "service_role_key_masked": mask_key(settings.SUPABASE_SERVICE_ROLE_KEY) if settings.SUPABASE_SERVICE_ROLE_KEY else "NOT_SET",
        "using_service_role": bool(settings.SUPABASE_SERVICE_ROLE_KEY),
        "db_status": db_status,
        "db_error": db_error,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )
