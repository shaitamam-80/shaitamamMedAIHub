"""
Unit Tests for Define Tool v3.0 Endpoints
==========================================

Tests for wizard-based research question formulation:
- Framework detection (clarification-based)
- Framework clarification
- Question generation (narrow/broad/clinical + qualitative FINER)
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from app.api.models.schemas import (
    DetectFrameworkRequest,
    DetectFrameworkResponse,
    ClarifyFrameworkRequest,
    ClarifyFrameworkResponse,
    GenerateQuestionsRequest,
    GenerateQuestionsResponse,
    ChatMessage,
)


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def mock_user():
    """Mock authenticated user"""
    return {
        "id": str(uuid4()),
        "email": "test@example.com"
    }


@pytest.fixture
def mock_project(mock_user):
    """Mock project belonging to user"""
    return {
        "id": str(uuid4()),
        "name": "Test Project",
        "user_id": mock_user["id"],
        "framework_type": None,
        "framework_data": {}
    }


@pytest.fixture
def mock_ai_response_framework_detection():
    """Mock AI response for framework detection"""
    mock_response = MagicMock()
    mock_response.content = """
    {
        "framework_type": "PICO",
        "confidence": "high",
        "reasoning": "You mentioned comparing exercise to standard care for depression, which is a therapy effectiveness question. PICO is designed for these comparisons.",
        "clarification_needed": false,
        "clarification_question": null,
        "alternative_frameworks": [
            {
                "type": "PICOT",
                "reason": "If timing is critical, PICOT adds explicit time component"
            }
        ]
    }
    """
    return mock_response


@pytest.fixture
def mock_ai_response_needs_clarification():
    """Mock AI response requesting clarification"""
    mock_response = MagicMock()
    mock_response.content = """
    {
        "framework_type": null,
        "confidence": "low",
        "reasoning": "Your input is ambiguous. Need clarification on research intent.",
        "clarification_needed": true,
        "clarification_question": "What do you want to know about depression in elderly? a) Treatment effectiveness b) How common it is c) Patient experiences",
        "alternative_frameworks": []
    }
    """
    return mock_response


@pytest.fixture
def mock_ai_response_questions():
    """Mock AI response for question generation"""
    mock_response = MagicMock()
    mock_response.content = """
    {
        "questions": {
            "narrow": {
                "type": "narrow",
                "text": "In elderly patients (≥65 years) with major depressive disorder (DSM-5 criteria), does structured aerobic exercise (≥30 minutes, 3×/week for 12 weeks) compared to standard antidepressant therapy reduce depression severity as measured by PHQ-9 scores?",
                "explanation": "This formulation is specific enough for a systematic review.",
                "use_case": "Systematic review, meta-analysis"
            },
            "broad": {
                "type": "broad",
                "text": "Does physical activity improve depression outcomes in older adults?",
                "explanation": "Allows exploring various types of physical activity.",
                "use_case": "Scoping review"
            },
            "clinical": {
                "type": "clinical",
                "text": "Is regular exercise effective for reducing depression symptoms in elderly primary care patients?",
                "explanation": "Practical for clinicians.",
                "use_case": "Clinical practice guidelines"
            }
        },
        "finer_assessment": {
            "F": {"score": "high", "reason": "Highly feasible. Elderly patients with depression are commonly seen in primary care."},
            "I": {"score": "high", "reason": "Addresses significant clinical problem. Depression in elderly is highly prevalent."},
            "N": {"score": "medium", "reason": "Exercise for depression studied, but gaps exist in elderly populations."},
            "E": {"score": "high", "reason": "No significant ethical concerns. Exercise is low-risk."},
            "R": {"score": "high", "reason": "Highly relevant to healthcare priorities. WHO emphasizes depression in aging."},
            "recommendation": "proceed",
            "reasoning": "Strong potential across FINER dimensions. Addresses important clinical need.",
            "suggestions": [
                "Specify exercise type (aerobic vs. resistance)",
                "Define 'elderly' age threshold (65+, 70+, or 75+)",
                "Specify primary outcome timepoint"
            ]
        }
    }
    """
    return mock_response


# ============================================================================
# Test: Framework Detection Endpoint
# ============================================================================

@pytest.mark.asyncio
@patch('app.services.database.db_service.get_project')
@patch('app.services.ai_service.ai_service._invoke_with_retry')
async def test_detect_framework_success(
    mock_ai_invoke,
    mock_db_get_project,
    mock_project,
    mock_user,
    mock_ai_response_framework_detection
):
    """Test successful framework detection with high confidence"""
    # Setup mocks
    mock_db_get_project.return_value = mock_project
    mock_ai_invoke.return_value = mock_ai_response_framework_detection

    # Import route function
    from app.api.routes.define_v3 import detect_framework

    # Create request
    request = DetectFrameworkRequest(
        project_id=mock_project["id"],
        user_input="I want to study whether exercise helps elderly with depression",
        language="en"
    )

    # Call endpoint
    response = await detect_framework(request, current_user=mock_user)

    # Assertions
    assert isinstance(response, DetectFrameworkResponse)
    assert response.framework_type == "PICO"
    assert response.confidence == "high"
    assert response.clarification_needed is False
    assert len(response.alternative_frameworks) > 0
    assert response.alternative_frameworks[0].type == "PICOT"


@pytest.mark.asyncio
@patch('app.services.database.db_service.get_project')
@patch('app.services.ai_service.ai_service._invoke_with_retry')
async def test_detect_framework_needs_clarification(
    mock_ai_invoke,
    mock_db_get_project,
    mock_project,
    mock_user,
    mock_ai_response_needs_clarification
):
    """Test framework detection requesting clarification"""
    # Setup mocks
    mock_db_get_project.return_value = mock_project
    mock_ai_invoke.return_value = mock_ai_response_needs_clarification

    from app.api.routes.define_v3 import detect_framework

    request = DetectFrameworkRequest(
        project_id=mock_project["id"],
        user_input="I want to study depression in elderly",
        language="en"
    )

    response = await detect_framework(request, current_user=mock_user)

    # Assertions
    assert response.framework_type is None
    assert response.confidence == "low"
    assert response.clarification_needed is True
    assert response.clarification_question is not None
    assert "What do you want to know" in response.clarification_question


@pytest.mark.asyncio
@patch('app.services.database.db_service.get_project')
async def test_detect_framework_unauthorized(
    mock_db_get_project,
    mock_project,
):
    """Test framework detection with unauthorized user"""
    from app.api.routes.define_v3 import detect_framework
    from fastapi import HTTPException

    # Setup: project belongs to different user
    mock_db_get_project.return_value = mock_project
    wrong_user = {"id": str(uuid4()), "email": "wrong@example.com"}

    request = DetectFrameworkRequest(
        project_id=mock_project["id"],
        user_input="Test input",
        language="en"
    )

    # Should raise 403
    with pytest.raises(HTTPException) as exc_info:
        await detect_framework(request, current_user=wrong_user)

    assert exc_info.value.status_code == 403


# ============================================================================
# Test: Generate Questions Endpoint
# ============================================================================

@pytest.mark.asyncio
@patch('app.services.database.db_service.get_project')
@patch('app.services.ai_service.ai_service._invoke_with_retry')
async def test_generate_questions_success(
    mock_ai_invoke,
    mock_db_get_project,
    mock_project,
    mock_user,
    mock_ai_response_questions
):
    """Test successful question generation with FINER assessment"""
    # Setup mocks
    mock_db_get_project.return_value = mock_project
    mock_ai_invoke.return_value = mock_ai_response_questions

    from app.api.routes.define_v3 import generate_questions

    request = GenerateQuestionsRequest(
        project_id=mock_project["id"],
        framework_type="PICO",
        framework_data={
            "P": "Elderly patients with depression",
            "I": "Physical exercise",
            "C": "Standard care",
            "O": "Depression severity"
        },
        language="en"
    )

    response = await generate_questions(request, current_user=mock_user)

    # Assertions
    assert isinstance(response, GenerateQuestionsResponse)

    # Check all three questions generated
    assert "narrow" in response.questions
    assert "broad" in response.questions
    assert "clinical" in response.questions

    # Check narrow question
    narrow = response.questions["narrow"]
    assert narrow.type == "narrow"
    assert "elderly patients" in narrow.text.lower()
    assert "systematic review" in narrow.use_case.lower()

    # Check FINER assessment
    finer = response.finer_assessment
    assert finer.F.score == "high"
    assert finer.recommendation == "proceed"
    assert len(finer.suggestions) > 0


@pytest.mark.asyncio
@patch('app.services.database.db_service.get_project')
@patch('app.services.ai_service.ai_service._invoke_with_retry')
async def test_generate_questions_qualitative_finer_only(
    mock_ai_invoke,
    mock_db_get_project,
    mock_project,
    mock_user,
    mock_ai_response_questions
):
    """Test that FINER assessment is qualitative (high/medium/low) with NO numeric scores"""
    mock_db_get_project.return_value = mock_project
    mock_ai_invoke.return_value = mock_ai_response_questions

    from app.api.routes.define_v3 import generate_questions

    request = GenerateQuestionsRequest(
        project_id=mock_project["id"],
        framework_type="PICO",
        framework_data={"P": "Test", "I": "Test", "C": "Test", "O": "Test"},
        language="en"
    )

    response = await generate_questions(request, current_user=mock_user)

    # Verify FINER scores are qualitative
    finer = response.finer_assessment
    valid_scores = {"high", "medium", "low"}

    assert finer.F.score in valid_scores
    assert finer.I.score in valid_scores
    assert finer.N.score in valid_scores
    assert finer.E.score in valid_scores
    assert finer.R.score in valid_scores

    # Verify recommendation is qualitative
    assert finer.recommendation in {"proceed", "revise", "reconsider"}

    # Verify reasoning is present (holistic judgment)
    assert len(finer.reasoning) > 10  # Should be substantial text


# ============================================================================
# Test: Request Validation
# ============================================================================

def test_detect_framework_request_validation():
    """Test Pydantic validation for DetectFrameworkRequest"""
    from pydantic import ValidationError

    # Valid request
    valid_request = DetectFrameworkRequest(
        project_id=str(uuid4()),
        user_input="Valid input text that is long enough",
        language="en"
    )
    assert valid_request.language == "en"

    # Invalid language
    with pytest.raises(ValidationError):
        DetectFrameworkRequest(
            project_id=str(uuid4()),
            user_input="Test input",
            language="invalid"  # Must be 'en' or 'he'
        )

    # Input too short
    with pytest.raises(ValidationError):
        DetectFrameworkRequest(
            project_id=str(uuid4()),
            user_input="short",  # Min length 10
            language="en"
        )


def test_generate_questions_request_validation():
    """Test Pydantic validation for GenerateQuestionsRequest"""
    from pydantic import ValidationError

    # Valid request
    valid_request = GenerateQuestionsRequest(
        project_id=str(uuid4()),
        framework_type="PICO",
        framework_data={"P": "Test", "I": "Test", "C": "Test", "O": "Test"},
        language="en"
    )
    assert valid_request.framework_type == "PICO"

    # Invalid language
    with pytest.raises(ValidationError):
        GenerateQuestionsRequest(
            project_id=str(uuid4()),
            framework_type="PICO",
            framework_data={},
            language="fr"  # Only 'en' or 'he'
        )


# ============================================================================
# Integration Test Markers
# ============================================================================

@pytest.mark.integration
@pytest.mark.skip(reason="Requires real AI service and database")
async def test_full_wizard_flow_integration():
    """
    Integration test for full wizard flow:
    1. Detect framework from user input
    2. (Optional) Clarify framework
    3. Generate three questions with FINER

    This test is skipped by default. Run with: pytest -m integration
    """
    # TODO: Implement when integration test environment is set up
    pass
