import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock

class TestHealthEndpoints:
    def test_health_check_basic(self, client):
        """Test basic health check returns 200"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

    def test_health_check_detailed(self, client):
        """Test detailed health check"""
        response = client.get("/health?detailed=true")
        assert response.status_code == 200
        data = response.json()
        assert "database" in data or "ai_configured" in data

    def test_readiness_probe(self, client):
        """Test readiness endpoint"""
        response = client.get("/ready")
        assert response.status_code == 200
        assert response.json()["ready"] == True

class TestProjectsEndpoints:
    @patch('app.core.auth.get_current_user')
    @patch('app.services.database.db_service')
    def test_get_projects_authenticated(self, mock_db, mock_auth, client, mock_auth_user):
        """Test getting projects with auth"""
        mock_auth.return_value = mock_auth_user
        mock_db.list_projects = AsyncMock(return_value=[])

        response = client.get("/api/v1/projects", headers={"Authorization": "Bearer test"})
        # Should not return 401
        assert response.status_code != 401

    def test_get_projects_unauthenticated(self, client):
        """Test getting projects without auth returns 401"""
        response = client.get("/api/v1/projects")
        assert response.status_code == 401
