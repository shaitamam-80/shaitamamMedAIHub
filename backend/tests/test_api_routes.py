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
        response = unauthenticated_client.get("/api/v1/projects/")
        assert response.status_code == 401

    def test_unauthenticated_request_define(self, unauthenticated_client):
        """Test that unauthenticated requests to define chat are rejected"""
        response = unauthenticated_client.post("/api/v1/define/chat", json={})
        # Either 401 (unauthorized) or 422 (validation) is acceptable
        assert response.status_code in [401, 422]


# ============================================================================
# Request Validation Tests
# ============================================================================

class TestRequestValidation:
    """Tests for request validation"""

    def test_create_project_missing_name(self, app_client):
        """Test creating project without required name"""
        project_data = {"description": "No name provided"}

        response = app_client.post("/api/v1/projects/", json=project_data)

        assert response.status_code == 422  # Validation error

    def test_create_project_empty_name(self, app_client):
        """Test creating project with empty name"""
        project_data = {"name": "", "description": "Empty name"}

        response = app_client.post("/api/v1/projects/", json=project_data)

        assert response.status_code == 422  # Validation error

    def test_invalid_project_id_format(self, app_client):
        """Test invalid UUID format is rejected"""
        response = app_client.get("/api/v1/projects/invalid-uuid-format")

        assert response.status_code == 422  # Validation error

    def test_chat_missing_project_id(self, app_client):
        """Test chat request without project_id"""
        response = app_client.post("/api/v1/define/chat", json={
            "message": "test"
        })

        assert response.status_code == 422

    def test_chat_missing_message(self, app_client):
        """Test chat request without message"""
        from uuid import uuid4
        response = app_client.post("/api/v1/define/chat", json={
            "project_id": str(uuid4())
        })

        assert response.status_code == 422


# ============================================================================
# Framework Schema Tests
# ============================================================================

class TestFrameworkSchemas:
    """Tests for framework schema endpoint"""

    def test_get_frameworks(self, app_client):
        """Test getting available frameworks"""
        response = app_client.get("/api/v1/define/frameworks")

        assert response.status_code == 200
        data = response.json()
        assert "frameworks" in data

        # Should have known frameworks
        frameworks = data["frameworks"]
        assert "PICO" in frameworks
        assert "CoCoPop" in frameworks

    def test_framework_schema_structure(self, app_client):
        """Test that framework schemas have correct structure"""
        response = app_client.get("/api/v1/define/frameworks")
        data = response.json()

        pico = data["frameworks"]["PICO"]
        assert "name" in pico
        assert "description" in pico
        assert "fields" in pico
        assert isinstance(pico["fields"], list)


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
        response = app_client.post("/api/v1/projects/", json={})

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
        # GET projects list should work (returns 401 or data)
        response = app_client.get("/api/v1/projects/")
        # Should not be 404
        assert response.status_code != 404

    def test_define_routes_exist(self, app_client):
        """Test that define routes are registered"""
        response = app_client.get("/api/v1/define/frameworks")
        assert response.status_code == 200

    def test_query_routes_exist(self, app_client):
        """Test that query routes are registered"""
        from uuid import uuid4
        response = app_client.get(f"/api/v1/query/history/{uuid4()}")
        # Should not be 404 (might be 403 or 500 due to db issues)
        assert response.status_code != 404

    def test_review_routes_exist(self, app_client):
        """Test that review routes are registered"""
        from uuid import uuid4
        response = app_client.get(f"/api/v1/review/abstracts/{uuid4()}")
        # Should not be 404
        assert response.status_code != 404
