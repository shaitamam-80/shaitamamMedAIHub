"""
MedAI Hub - Test Configuration and Fixtures

IMPORTANT: Environment variables must be set BEFORE importing any app modules.
This is because pydantic-settings loads settings at module import time.
"""

import pytest
from unittest.mock import MagicMock
from uuid import uuid4
from datetime import datetime
import os
import sys

# Set environment variables BEFORE any app imports
# This prevents pydantic-settings validation errors
os.environ.setdefault("GOOGLE_API_KEY", "test-google-api-key-12345")
os.environ.setdefault("SUPABASE_URL", "https://test-project.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "test-supabase-anon-key-12345")
os.environ.setdefault("DEBUG", "True")

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# ============================================================================
# Sample Data Fixtures
# ============================================================================

@pytest.fixture
def sample_project_id():
    """Generate a sample UUID for project"""
    return uuid4()


@pytest.fixture
def sample_user_id():
    """Generate a sample user ID"""
    return "test-user-123"


@pytest.fixture
def sample_project_data(sample_project_id, sample_user_id):
    """Sample project data for testing"""
    return {
        "id": str(sample_project_id),
        "name": "Test Research Project",
        "description": "A test project for systematic review",
        "framework_type": "PICO",
        "framework_data": {
            "population": "Adults with diabetes",
            "intervention": "Metformin",
            "comparison": "Placebo",
            "outcome": "HbA1c levels"
        },
        "user_id": sample_user_id,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }


# ============================================================================
# Mock Fixtures
# ============================================================================

@pytest.fixture
def mock_supabase_client():
    """Mock Supabase client - chainable mock"""
    mock = MagicMock()
    mock.table = MagicMock(return_value=mock)
    mock.insert = MagicMock(return_value=mock)
    mock.select = MagicMock(return_value=mock)
    mock.update = MagicMock(return_value=mock)
    mock.delete = MagicMock(return_value=mock)
    mock.eq = MagicMock(return_value=mock)
    mock.order = MagicMock(return_value=mock)
    mock.limit = MagicMock(return_value=mock)
    mock.execute = MagicMock(return_value=MagicMock(data=[]))
    return mock


@pytest.fixture
def mock_auth_user():
    """Mock auth user for testing"""
    return {
        "id": "test-user-id",
        "email": "test@example.com"
    }


# ============================================================================
# FastAPI Test Client Fixture
# ============================================================================

@pytest.fixture
def client():
    """Test client without dependency overrides"""
    from fastapi.testclient import TestClient
    from main import app
    return TestClient(app)
