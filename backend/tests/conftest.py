"""
MedAI Hub - Test Configuration and Fixtures

IMPORTANT: Environment variables must be set BEFORE importing any app modules.
This is because pydantic-settings loads settings at module import time.
"""

import os
import sys
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

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
            "outcome": "HbA1c levels",
        },
        "user_id": sample_user_id,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
    }


@pytest.fixture
def sample_medline_content():
    """Sample MEDLINE format content for parser testing"""
    return """PMID- 12345678
TI  - Effects of metformin on glycemic control in type 2 diabetes patients.
AB  - BACKGROUND: Metformin is a first-line treatment for type 2 diabetes.
      This study evaluates its effectiveness in glycemic control.
      METHODS: We conducted a randomized controlled trial with 200 participants.
      RESULTS: Metformin significantly reduced HbA1c levels compared to placebo.
      CONCLUSION: Metformin is effective for glycemic control.
AU  - Smith J
AU  - Johnson K
AU  - Williams R
TA  - Journal of Diabetes Research
DP  - 2023 Mar 15
OT  - Diabetes
OT  - Metformin
OT  - Glycemic Control
MH  - Diabetes Mellitus, Type 2
MH  - Metformin/therapeutic use

PMID- 87654321
TI  - Cardiovascular outcomes in diabetes patients treated with SGLT2 inhibitors.
AB  - This meta-analysis examines cardiovascular outcomes in patients using SGLT2
      inhibitors for diabetes management. Results suggest improved cardiac health.
AU  - Brown A
AU  - Davis M
TA  - Cardiology Today
DP  - 2023 Jun 20
OT  - Cardiovascular
OT  - SGLT2 inhibitors

PMID- 11223344
TI  - Long-term effects of lifestyle interventions in prediabetes.
AB  - A 10-year follow-up study examining lifestyle intervention effects on
      diabetes prevention in high-risk individuals.
AU  - Garcia P
TA  - Preventive Medicine Journal
DP  - 2023 Sep 01
"""


@pytest.fixture
def sample_medline_single_entry():
    """Single MEDLINE entry for simple tests"""
    return """PMID- 99999999
TI  - Simple test article title
AB  - This is a simple test abstract for unit testing purposes.
AU  - Test Author
TA  - Test Journal
DP  - 2024 Jan 01
"""


@pytest.fixture
def sample_chat_messages():
    """Sample chat conversation history"""
    return [
        {"role": "user", "content": "I want to study diabetes treatment with metformin"},
        {
            "role": "assistant",
            "content": "I understand you want to research diabetes treatment. Let me help you define your research question using the PICO framework.",
        },
        {"role": "user", "content": "Yes, specifically in type 2 diabetes adults"},
    ]


@pytest.fixture
def sample_abstract_data(sample_project_id):
    """Sample abstract data"""
    return {
        "id": str(uuid4()),
        "project_id": str(sample_project_id),
        "file_id": str(uuid4()),
        "pmid": "12345678",
        "title": "Effects of metformin on glycemic control",
        "abstract_text": "This study evaluates metformin effectiveness...",
        "authors": "Smith J; Johnson K",
        "journal": "Journal of Diabetes Research",
        "publication_date": "2023 Mar 15",
        "keywords": ["Diabetes", "Metformin"],
        "status": "pending",
        "created_at": datetime.now().isoformat(),
    }


# ============================================================================
# Mock Fixtures
# ============================================================================


@pytest.fixture
def mock_db_service():
    """Mock database service"""
    mock = MagicMock()

    # Setup async methods
    mock.create_project = AsyncMock()
    mock.get_project = AsyncMock()
    mock.update_project = AsyncMock()
    mock.list_projects = AsyncMock()
    mock.create_file = AsyncMock()
    mock.get_file = AsyncMock()
    mock.get_files_by_project = AsyncMock()
    mock.save_message = AsyncMock()
    mock.get_conversation = AsyncMock()
    mock.clear_conversation = AsyncMock()
    mock.create_abstract = AsyncMock()
    mock.get_abstract = AsyncMock()
    mock.bulk_create_abstracts = AsyncMock()
    mock.get_abstracts_by_project = AsyncMock()
    mock.update_abstract_decision = AsyncMock()
    mock.create_analysis_run = AsyncMock()
    mock.update_analysis_run = AsyncMock()
    mock.get_analysis_runs_by_project = AsyncMock()
    mock.save_query_string = AsyncMock()
    mock.get_query_strings_by_project = AsyncMock()

    return mock


@pytest.fixture
def mock_ai_service():
    """Mock AI service"""
    mock = MagicMock()

    mock.chat_for_define = AsyncMock(
        return_value={
            "message": "I'll help you define your research question.",
            "extracted_fields": {"population": "Adults with diabetes"},
        }
    )

    mock.extract_framework_data = AsyncMock(
        return_value={
            "population": "Adults with diabetes",
            "intervention": "Metformin",
            "comparison": "Placebo",
            "outcome": "HbA1c levels",
        }
    )

    mock.generate_query = AsyncMock(
        return_value={
            "message": "Query generated successfully",
            "concepts": [],
            "queries": {
                "broad": "(diabetes) AND (metformin)",
                "focused": "(diabetes[MeSH]) AND (metformin[MeSH])",
                "clinical_filtered": "(diabetes) AND (metformin) AND (clinical trial)",
            },
            "toolbox": [],
        }
    )

    mock.analyze_abstract = AsyncMock(
        return_value={"decision": "include", "reasoning": "Relevant to research question"}
    )

    return mock


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


# ============================================================================
# FastAPI Test Client Fixture
# ============================================================================


@pytest.fixture
def mock_current_user(sample_user_id):
    """Mock authenticated user"""
    from app.core.auth import UserPayload

    return UserPayload(id=sample_user_id, email="test@example.com")


@pytest.fixture
def app_with_mocks(mock_db_service, mock_ai_service, mock_current_user):
    """Create FastAPI app with mocked dependencies"""
    from app.core.auth import get_current_user
    from main import app

    # Override dependencies
    def override_get_current_user():
        return mock_current_user

    app.dependency_overrides[get_current_user] = override_get_current_user

    return app


@pytest.fixture
def test_client(app_with_mocks):
    """Test client with mocked dependencies"""
    from fastapi.testclient import TestClient

    return TestClient(app_with_mocks)


# ============================================================================
# Additional Fixtures (QA Agent additions)
# ============================================================================


@pytest.fixture
def client():
    """Simple test client without dependency overrides"""
    from fastapi.testclient import TestClient

    from main import app

    return TestClient(app)


@pytest.fixture
def mock_auth_user():
    """Mock auth user for testing"""
    return {"id": "test-user-id", "email": "test@example.com"}


@pytest.fixture
def auth_headers():
    """Auth headers for API requests"""
    return {"Authorization": "Bearer test-token"}


# ============================================================================
# Utility Functions
# ============================================================================


def create_temp_medline_file(tmp_path, content: str, filename: str = "test.txt"):
    """Create a temporary MEDLINE file for testing"""
    file_path = tmp_path / filename
    file_path.write_text(content, encoding="utf-8")
    return str(file_path)
