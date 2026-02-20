"""
MedAI Hub - API Routes Tests
Tests for FastAPI endpoint structure and validation
"""

import pytest
from fastapi.testclient import TestClient


# ============================================================================
# Test Fixtures
# ============================================================================

@pytest.fixture
def mock_user():
    """Mock authenticated user"""
    from app.core.auth import UserPayload
    return UserPayload(id="test-user-123", email="test@example.com")


@pytest.fixture
def mock_auth(mock_user):
    """Create mock for authentication"""
    async def override_get_current_user():
        return mock_user
    return override_get_current_user


@pytest.fixture
def app_client(mock_auth):
    """Create test client with mocked auth"""
    from main import app
    from app.core.auth import get_current_user

    app.dependency_overrides[get_current_user] = mock_auth
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture
def unauthenticated_client():
    """Create test client without auth"""
    from main import app
    app.dependency_overrides.clear()
    return TestClient(app)


# ============================================================================
# Health Check Tests
# ============================================================================

class TestHealthEndpoints:
    """Tests for health check endpoints"""

    def test_health_check(self, app_client):
        """Test basic health check endpoint"""
        response = app_client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "service" in data

    def test_root_endpoint(self, app_client):
        """Test root endpoint"""
        response = app_client.get("/")

        assert response.status_code == 200


# ============================================================================
# Authentication Tests
# ============================================================================

class TestAuthentication:
    """Tests for authentication requirements"""

    def test_unauthenticated_request_projects(self, unauthenticated_client):
        """Test that unauthenticated requests to projects are rejected"""
        response = unauthenticated_client.get("/api/v1/projects")
        # Should be 401 or 500 (Supabase connection error in test env)
        assert response.status_code in (401, 500)


# ============================================================================
# Request Validation Tests
# ============================================================================

class TestRequestValidation:
    """Tests for request validation"""

    def test_create_project_missing_title(self, app_client):
        """Test creating project without required title"""
        project_data = {"description": "No title provided"}

        response = app_client.post("/api/v1/projects", json=project_data)

        assert response.status_code == 422  # Validation error

    def test_create_project_empty_title(self, app_client):
        """Test creating project with empty title"""
        project_data = {"title": "", "description": "Empty title"}

        response = app_client.post("/api/v1/projects", json=project_data)

        assert response.status_code == 422  # Validation error

    def test_invalid_project_id_format(self, app_client):
        """Test invalid UUID format is rejected"""
        response = app_client.get("/api/v1/projects/invalid-uuid-format")

        assert response.status_code == 422  # Validation error


# ============================================================================
# Response Format Tests
# ============================================================================

class TestResponseFormats:
    """Tests for API response formats"""

    def test_health_response_format(self, app_client):
        """Test health endpoint response format"""
        response = app_client.get("/health")
        data = response.json()

        assert "status" in data
        assert "service" in data
        assert data["status"] == "healthy"

    def test_validation_error_format(self, app_client):
        """Test validation error response format"""
        response = app_client.post("/api/v1/projects", json={})

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data


# ============================================================================
# API Route Registration Tests
# ============================================================================

class TestAPIRouteRegistration:
    """Tests to verify API routes are registered"""

    def test_projects_routes_exist(self, app_client):
        """Test that project routes are registered"""
        response = app_client.get("/api/v1/projects")
        assert response.status_code != 404

    def test_review_routes_exist(self, app_client):
        """Test that review routes are registered"""
        response = app_client.get("/api/v1/review/stages")
        assert response.status_code != 404

    def test_chat_routes_exist(self, app_client):
        """Test that chat routes are registered"""
        response = app_client.post("/api/v1/chat", json={
            "message": "test",
            "skillName": "research-question",
        })
        # Should not be 404 (might be 422 for missing fields)
        assert response.status_code != 404
