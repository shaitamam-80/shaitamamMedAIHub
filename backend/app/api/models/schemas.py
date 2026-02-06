"""
MedAI Hub - Pydantic Models and Schemas
Defines data validation models for API requests and responses

NOTE: Framework schemas are now defined locally after removal of prompts module
during migration to LangGraph architecture.
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID

# Import typed framework models
from .frameworks import (
    PICOData,
    PICOTData,
    PEOData,
    SPIDERData,
    CoCoPoPData,
    GenericFrameworkData,
    FrameworkDataUnion,
    framework_to_dict,
    detect_framework_type,
)


# ============================================================================
# Research Framework Models (Dynamic)
# ============================================================================

class FrameworkData(BaseModel):
    """
    Dynamic framework data - can contain any structure
    Examples:
    - PICO: {"P": "...", "I": "...", "C": "...", "O": "..."}
    - CoCoPop: {"Condition": "...", "Context": "...", "Population": "..."}
    - PEO: {"P": "...", "E": "...", "O": "..."}
    """

    data: Dict[str, str] = Field(
        default_factory=dict, description="Dynamic key-value pairs based on framework"
    )

    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "data": {
                        "P": "Elderly patients with diabetes",
                        "I": "Metformin treatment",
                        "C": "Placebo",
                        "O": "Blood glucose levels",
                    }
                }
            ]
        }

# ============================================================================
# Project Models (aligned with Supabase projects table)
# ============================================================================

class ProjectCreate(BaseModel):
    """Create a new project. Fields match Supabase projects table columns."""
    title: str = Field(..., min_length=1, max_length=255, examples=["Exercise Interventions for Depression in Elderly"])
    description: Optional[str] = Field(None, examples=["A systematic review investigating exercise interventions for elderly patients with depression"])
    review_type: str = Field(
        ...,
        description="Review type: systematic_intervention, systematic_prevalence, systematic_prognosis, systematic_diagnostic, systematic_qualitative, scoping",
        examples=["systematic_intervention"]
    )
    framework: str = Field(
        default="PICO",
        description="Research framework: PICO, PICOT, PICOS, CoCoPop, PFO, PEO, PECO, PIRD, PICo, SPIDER, PCC, SPICE, ECLIPSE, CMO, PerSPEcTiF, BeHEMoTh",
        examples=["PICO"]
    )

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Exercise Interventions for Depression in Elderly",
                "description": "Investigating the effectiveness of exercise programs in treating depression in elderly populations",
                "review_type": "systematic_intervention",
                "framework": "PICO"
            }
        }


class ProjectUpdate(BaseModel):
    """Update project fields. Only provided fields will be updated."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    current_stage: Optional[str] = None
    progress_percentage: Optional[int] = Field(None, ge=0, le=100)
    status: Optional[str] = None


class ProjectResponse(BaseModel):
    """Project response matching Supabase projects table."""
    id: str
    owner_id: Optional[str] = None
    title: str
    slug: str
    description: Optional[str] = None
    review_type: str
    framework: str
    current_stage: str = Field(default="idea", description="Current workflow stage")
    progress_percentage: int = Field(default=0, description="Overall progress 0-100")
    status: str = Field(default="active", description="Project status")
    prospero_id: Optional[str] = None
    total_records_found: int = 0
    total_screened: int = 0
    total_included: int = 0
    total_excluded: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Chat Models (for Define Tool)
# ============================================================================

class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str


class ChatRequest(BaseModel):
    project_id: UUID
    message: str = Field(..., examples=["I want to study the effects of exercise on depression in elderly patients"])
    framework_type: Optional[str] = Field(default="PICO", examples=["PICO"])
    language: Optional[str] = Field(default="en", examples=["en"], pattern="^(en|he)$")

    class Config:
        json_schema_extra = {
            "example": {
                "project_id": "123e4567-e89b-12d3-a456-426614174000",
                "message": "I want to investigate whether exercise programs reduce depression symptoms in elderly patients compared to standard care",
                "framework_type": "PICO",
                "language": "en"
            }
        }


class FinerScore(BaseModel):
    """Single FINER component score"""
    score: str = Field(..., pattern="^(high|medium|low)$")
    reason: str


class FinerAssessment(BaseModel):
    """FINER research question quality assessment"""
    F: Optional[FinerScore] = Field(None, description="Feasible - Can this study be conducted?")
    I: Optional[FinerScore] = Field(None, description="Interesting - Is this engaging to researchers?")
    N: Optional[FinerScore] = Field(None, description="Novel - Does this add new knowledge?")
    E: Optional[FinerScore] = Field(None, description="Ethical - Can this be conducted ethically?")
    R: Optional[FinerScore] = Field(None, description="Relevant - Will results matter?")
    overall: Optional[str] = Field(None, pattern="^(proceed|revise|reconsider)$")
    overall_score: Optional[int] = Field(None, ge=0, le=100, description="Numeric score 0-100")
    recommendation: Optional[str] = Field(None, pattern="^(proceed|revise|reconsider)$")
    suggestions: Optional[List[str]] = None


class FormulatedQuestion(BaseModel):
    """A formulated research question with FINER assessment"""
    type: str = Field(..., description="Question type: broad, focused, or alternative")
    hebrew: Optional[str] = Field(None, description="Hebrew version of the question")
    english: str = Field(..., description="English version of the question")
    finer_assessment: Optional[FinerAssessment] = None


class ChatResponse(BaseModel):
    message: str
    framework_data: Optional[Dict[str, Any]] = None
    extracted_fields: Optional[Dict[str, str]] = None
    finer_assessment: Optional[FinerAssessment] = None
    formulated_questions: Optional[List[FormulatedQuestion]] = Field(
        None,
        description="Formulated questions with automatic FINER assessment"
    )


class FinerAssessmentRequest(BaseModel):
    """Request for FINER assessment of a research question"""
    project_id: UUID
    research_question: str = Field(..., min_length=10, description="The research question to evaluate")
    framework_type: Optional[str] = "PICO"
    framework_data: Optional[Dict[str, Any]] = None
    language: Optional[str] = "en"  # "en" or "he"


class FinerAssessmentResponse(BaseModel):
    """Response containing FINER assessment results"""
    F: FinerScore = Field(..., description="Feasible - Can this study be conducted?")
    I: FinerScore = Field(..., description="Interesting - Is this engaging to researchers?")
    N: FinerScore = Field(..., description="Novel - Does this add new knowledge?")
    E: FinerScore = Field(..., description="Ethical - Can this be conducted ethically?")
    R: FinerScore = Field(..., description="Relevant - Will results matter?")
    overall: str = Field(..., pattern="^(proceed|revise|reconsider)$")
    suggestions: List[str] = Field(default_factory=list)
    research_question: str
    framework_type: str


# ============================================================================
# Define Tool v3.0 - Wizard Models
# ============================================================================

class DetectFrameworkRequest(BaseModel):
    """Request to detect appropriate framework from user input"""
    project_id: UUID
    user_input: str = Field(..., min_length=10, description="Natural language research question or idea")
    language: str = Field(default="en", pattern="^(en|he)$", description="Language: 'en' or 'he'")
    chat_history: Optional[List[ChatMessage]] = Field(
        default_factory=list,
        description="Previous conversation context for clarification"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "project_id": "123e4567-e89b-12d3-a456-426614174000",
                "user_input": "I want to study whether exercise helps elderly people with depression",
                "language": "en",
                "chat_history": []
            }
        }


class AlternativeFramework(BaseModel):
    """Alternative framework option with explanation"""
    type: str = Field(..., description="Framework type (e.g., PICO, PICOT)")
    reason: str = Field(..., description="Why this framework could also work")


class DetectFrameworkResponse(BaseModel):
    """Response from framework detection"""
    framework_type: Optional[str] = Field(None, description="Detected framework type, or null if clarification needed")
    confidence: str = Field(..., pattern="^(high|medium|low)$", description="AI confidence in detection")
    reasoning: str = Field(..., description="Explanation of why this framework was selected")
    clarification_needed: bool = Field(default=False, description="Whether follow-up questions are needed")
    clarification_question: Optional[str] = Field(None, description="The clarification question to ask")
    alternative_frameworks: Optional[List[AlternativeFramework]] = Field(
        default_factory=list,
        description="Other frameworks that could work"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "framework_type": "PICO",
                "confidence": "high",
                "reasoning": "You mentioned comparing exercise to standard care for depression, which is a therapy effectiveness question. PICO is designed specifically for these comparisons.",
                "clarification_needed": False,
                "clarification_question": None,
                "alternative_frameworks": [
                    {
                        "type": "PICOT",
                        "reason": "If timing of outcome measurement is critical, PICOT adds explicit time component"
                    }
                ]
            }
        }


class ClarifyFrameworkRequest(BaseModel):
    """Request to provide clarification answer"""
    project_id: UUID
    answer: str = Field(..., description="User's answer to clarification question")
    language: str = Field(default="en", pattern="^(en|he)$")
    chat_history: List[ChatMessage] = Field(..., description="Full conversation history including clarification question")


class ClarifyFrameworkResponse(BaseModel):
    """Response after clarification"""
    framework_type: str = Field(..., description="Final detected framework type")
    confidence: str = Field(..., pattern="^(high|medium|low)$")
    reasoning: str = Field(..., description="Explanation based on clarification answer")
    needs_more_clarification: bool = Field(default=False, description="Whether additional clarification is needed")
    clarification_question: Optional[str] = None


class GeneratedQuestion(BaseModel):
    """Single generated research question with metadata"""
    type: str = Field(..., pattern="^(narrow|broad|clinical)$", description="Question specificity level")
    text: str = Field(..., description="The actual question text")
    explanation: str = Field(..., description="Why this formulation (1-2 sentences)")
    use_case: str = Field(..., description="When to use this version")


class QuestionsFinerAssessment(BaseModel):
    """FINER assessment for generated questions (qualitative only)"""
    F: FinerScore = Field(..., description="Feasible - Can this study be conducted?")
    I: FinerScore = Field(..., description="Interesting - Is this engaging to researchers?")
    N: FinerScore = Field(..., description="Novel - Does this add new knowledge?")
    E: FinerScore = Field(..., description="Ethical - Can this be conducted ethically?")
    R: FinerScore = Field(..., description="Relevant - Will results matter?")
    recommendation: str = Field(..., pattern="^(proceed|revise|reconsider)$", description="Overall recommendation")
    reasoning: str = Field(..., description="Holistic judgment explanation (NOT formula-based)")
    suggestions: List[str] = Field(..., description="Specific, actionable improvement suggestions")


class GenerateQuestionsRequest(BaseModel):
    """Request to generate three question formulations"""
    project_id: UUID
    framework_type: str = Field(..., description="Selected framework type")
    framework_data: Dict[str, str] = Field(..., description="Extracted framework components")
    language: str = Field(default="en", pattern="^(en|he)$")

    class Config:
        json_schema_extra = {
            "example": {
                "project_id": "123e4567-e89b-12d3-a456-426614174000",
                "framework_type": "PICO",
                "framework_data": {
                    "P": "Elderly patients (≥65 years) with major depressive disorder",
                    "I": "Structured aerobic exercise (30 min, 3×/week)",
                    "C": "Standard antidepressant therapy",
                    "O": "Depression severity (PHQ-9 scores)"
                },
                "language": "en"
            }
        }


class GenerateQuestionsResponse(BaseModel):
    """Response with three generated questions and FINER assessment"""
    questions: Dict[str, GeneratedQuestion] = Field(
        ...,
        description="Three question formulations: narrow, broad, clinical"
    )
    finer_assessment: QuestionsFinerAssessment = Field(
        ...,
        description="Qualitative FINER assessment (high/medium/low only)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "questions": {
                    "narrow": {
                        "type": "narrow",
                        "text": "In elderly patients (≥65 years) with major depressive disorder (DSM-5 criteria), does structured aerobic exercise (≥30 minutes, 3×/week for 12 weeks) compared to standard antidepressant therapy reduce depression severity as measured by PHQ-9 scores?",
                        "explanation": "This formulation is specific enough for a systematic review, includes measurable parameters, and can guide a precise literature search.",
                        "use_case": "Systematic review, meta-analysis, RCT protocol development"
                    },
                    "broad": {
                        "type": "broad",
                        "text": "Does physical activity improve depression outcomes in older adults?",
                        "explanation": "This allows exploring various types of physical activity, different depression measures, and diverse older adult populations.",
                        "use_case": "Scoping review, exploring research landscape, identifying gaps"
                    },
                    "clinical": {
                        "type": "clinical",
                        "text": "Is regular exercise effective for reducing depression symptoms in elderly primary care patients?",
                        "explanation": "This is practical for clinicians, focuses on a common setting, and addresses a clinically relevant outcome.",
                        "use_case": "Clinical practice guidelines, shared decision-making, patient education"
                    }
                },
                "finer_assessment": {
                    "F": {
                        "score": "high",
                        "reason": "Highly feasible. Elderly patients with depression are commonly seen in primary care. Exercise interventions are inexpensive and widely available."
                    },
                    "I": {
                        "score": "high",
                        "reason": "Addresses a significant clinical problem. Depression in elderly is highly prevalent and often undertreated."
                    },
                    "N": {
                        "score": "medium",
                        "reason": "While exercise for depression has been studied, there are gaps specific to elderly populations in community settings."
                    },
                    "E": {
                        "score": "high",
                        "reason": "No significant ethical concerns. Exercise is low-risk for most elderly individuals with appropriate screening."
                    },
                    "R": {
                        "score": "high",
                        "reason": "Highly relevant to current healthcare priorities. WHO and NIH emphasize depression in aging populations."
                    },
                    "recommendation": "proceed",
                    "reasoning": "This research question demonstrates strong potential across all FINER dimensions. It addresses an important clinical need with a feasible, ethical, and novel approach.",
                    "suggestions": [
                        "Consider specifying exercise type (aerobic vs. resistance) for more precise search strategy",
                        "Define whether 'elderly' means 65+, 70+, or 75+ to improve sample homogeneity",
                        "Specify primary outcome timepoint (e.g., depression scores at 12 weeks post-intervention)"
                    ]
                }
            }
        }


# ============================================================================
# Framework Schema Definitions (Embedded after prompts module removal)
# ============================================================================

# Core framework schemas (migrated from app.core.prompts.shared)
_RAW_FRAMEWORK_SCHEMAS = {
    "PICO": {
        "name": "PICO",
        "description": "Population, Intervention, Comparison, Outcome",
        "components": ["P", "I", "C", "O"],
        "labels": {
            "P": "Population",
            "I": "Intervention",
            "C": "Comparison",
            "O": "Outcome"
        }
    },
    "PICOT": {
        "name": "PICOT",
        "description": "Population, Intervention, Comparison, Outcome, Timeframe",
        "components": ["P", "I", "C", "O", "T"],
        "labels": {
            "P": "Population",
            "I": "Intervention",
            "C": "Comparison",
            "O": "Outcome",
            "T": "Timeframe"
        }
    },
    "CoCoPop": {
        "name": "CoCoPop",
        "description": "Condition, Context, Population",
        "components": ["Condition", "Context", "Population"],
        "labels": {
            "Condition": "Health Condition",
            "Context": "Context/Setting",
            "Population": "Target Population"
        }
    },
    "PEO": {
        "name": "PEO",
        "description": "Population, Exposure, Outcome",
        "components": ["P", "E", "O"],
        "labels": {
            "P": "Population",
            "E": "Exposure",
            "O": "Outcome"
        }
    },
    "PECO": {
        "name": "PECO",
        "description": "Population, Exposure, Comparator, Outcome",
        "components": ["P", "E", "C", "O"],
        "labels": {
            "P": "Population",
            "E": "Exposure",
            "C": "Comparator",
            "O": "Outcome"
        }
    },
    "PFO": {
        "name": "PFO",
        "description": "Population, Factor, Outcome",
        "components": ["P", "F", "O"],
        "labels": {
            "P": "Population",
            "F": "Prognostic Factor",
            "O": "Outcome"
        }
    },
    "PIRD": {
        "name": "PIRD",
        "description": "Population, Index test, Reference test, Diagnosis",
        "components": ["P", "I", "R", "D"],
        "labels": {
            "P": "Population",
            "I": "Index Test",
            "R": "Reference Standard",
            "D": "Target Diagnosis"
        }
    },
    "SPIDER": {
        "name": "SPIDER",
        "description": "Sample, Phenomenon of Interest, Design, Evaluation, Research type",
        "components": ["S", "PI", "D", "E", "R"],
        "labels": {
            "S": "Sample",
            "PI": "Phenomenon of Interest",
            "D": "Design",
            "E": "Evaluation",
            "R": "Research Type"
        }
    },
    "SPICE": {
        "name": "SPICE",
        "description": "Setting, Perspective, Intervention, Comparison, Evaluation",
        "components": ["S", "P", "I", "C", "E"],
        "labels": {
            "S": "Setting",
            "P": "Perspective",
            "I": "Intervention",
            "C": "Comparison",
            "E": "Evaluation"
        }
    },
    "ECLIPSE": {
        "name": "ECLIPSE",
        "description": "Expectation, Client group, Location, Impact, Professionals, Service",
        "components": ["E", "C", "L", "I", "P", "S"],
        "labels": {
            "E": "Expectation",
            "C": "Client Group",
            "L": "Location",
            "I": "Impact",
            "P": "Professionals",
            "S": "Service"
        }
    },
    "CIMO": {
        "name": "CIMO",
        "description": "Context, Intervention, Mechanism, Outcome",
        "components": ["C", "I", "M", "O"],
        "labels": {
            "C": "Context",
            "I": "Intervention",
            "M": "Mechanism",
            "O": "Outcome"
        }
    },
    "PCC": {
        "name": "PCC",
        "description": "Population, Concept, Context (Scoping reviews)",
        "components": ["P", "C", "C2"],
        "labels": {
            "P": "Population",
            "C": "Concept",
            "C2": "Context"
        }
    },
    "PICo": {
        "name": "PICo",
        "description": "Population, Interest, Context (Qualitative - JBI)",
        "components": ["P", "I", "Co"],
        "labels": {
            "P": "Population",
            "I": "Phenomena of Interest",
            "Co": "Context"
        }
    },
    "BeHEMoTh": {
        "name": "BeHEMoTh",
        "description": "Behavior, Health context, Exclusions, Models/Theories",
        "components": ["Be", "H", "E", "Mo"],
        "labels": {
            "Be": "Behavior of Interest",
            "H": "Health Context",
            "E": "Exclusions",
            "Mo": "Models or Theories"
        }
    },
    "PerSPEcTiF": {
        "name": "PerSPEcTiF",
        "description": "Perspective, Setting, Phenomenon, Environment, Comparison, Time, Findings",
        "components": ["Per", "S", "P", "E", "c", "Ti", "F"],
        "labels": {
            "Per": "Perspective",
            "S": "Setting",
            "P": "Phenomenon/Problem",
            "E": "Environment",
            "c": "Comparison (optional)",
            "Ti": "Time/Timing",
            "F": "Findings"
        }
    },
    "PICOT-D": {
        "name": "PICOT-D",
        "description": "Population, Intervention, Comparison, Outcome, Time, Digital context",
        "components": ["P", "I", "C", "O", "T", "D"],
        "labels": {
            "P": "Population",
            "I": "Digital Intervention",
            "C": "Comparison",
            "O": "Outcome",
            "T": "Timeframe",
            "D": "Digital Context"
        }
    },
    "PICOS": {
        "name": "PICOS",
        "description": "Population, Intervention, Comparison, Outcome, Study design",
        "components": ["P", "I", "C", "O", "S"],
        "labels": {
            "P": "Population",
            "I": "Intervention",
            "C": "Comparison",
            "O": "Outcome",
            "S": "Study Design"
        }
    }
}


def _convert_to_api_format() -> Dict[str, Any]:
    """
    Convert raw framework schemas to API response format.

    Output format (API):
        {"PICO": {"name": "PICO", "description": "...", "fields": [{"key": "P", "label": "Population", "description": "..."}]}}
    """
    api_schemas = {}
    for name, schema in _RAW_FRAMEWORK_SCHEMAS.items():
        fields = []
        components = schema.get("components", [])
        labels = schema.get("labels", {})

        for comp in components:
            label = labels.get(comp, comp)
            fields.append({
                "key": comp,
                "label": label,
                "description": f"What is the {label.lower()}?"
            })

        api_schemas[name] = {
            "name": name,
            "description": schema.get("description", ""),
            "fields": fields
        }

    return api_schemas

# Build API-formatted schemas
FRAMEWORK_SCHEMAS = _convert_to_api_format()


class FrameworkSchemaResponse(BaseModel):
    """Response containing framework schema definitions"""

    frameworks: Dict[str, Any] = Field(default_factory=_convert_to_api_format)


# ============================================================================
# Re-export typed framework models for convenience
# Usage: from app.api.models.schemas import PICOData, framework_to_dict
# ============================================================================
__all__ = [
    # Typed framework models
    "PICOData",
    "PICOTData",
    "PEOData",
    "SPIDERData",
    "CoCoPoPData",
    "GenericFrameworkData",
    "FrameworkDataUnion",
    "framework_to_dict",
    "detect_framework_type",
    # Project models
    "ProjectCreate",
    "ProjectUpdate",
    "ProjectResponse",
    # Chat/Define models
    "ChatMessage",
    "ChatRequest",
    "ChatResponse",
    "FinerScore",
    "FinerAssessment",
    "FinerAssessmentRequest",
    "FinerAssessmentResponse",
    "FormulatedQuestion",
    # Schema definitions
    "FrameworkData",
    "FrameworkSchemaResponse",
    "FRAMEWORK_SCHEMAS",
    # Define Tool v3.0 models
    "DetectFrameworkRequest",
    "DetectFrameworkResponse",
    "AlternativeFramework",
    "ClarifyFrameworkRequest",
    "ClarifyFrameworkResponse",
    "GenerateQuestionsRequest",
    "GenerateQuestionsResponse",
    "GeneratedQuestion",
    "QuestionsFinerAssessment",
]
