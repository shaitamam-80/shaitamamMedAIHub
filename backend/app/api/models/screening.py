"""
MedAI Hub - Screening Models
Pydantic models for the Smart Screener module.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

# ----------------------------------------------------------------------------
# Criteria Configuration
# ----------------------------------------------------------------------------


class PopulationCriteria(BaseModel):
    codes: list[str] = Field(
        default_factory=list, description="Selected population codes (e.g., 'P1')"
    )
    custom_text: str | None = Field(None, description="Free text description for custom population")


class StudyDesignCriteria(BaseModel):
    inclusion_codes: list[str] = Field(
        default_factory=list, description="Codes to include (e.g., 'S2')"
    )
    exclusion_codes: list[str] = Field(
        default_factory=list, description="Codes to exclude (e.g., 'S-Ex1')"
    )


class CriteriaConfig(BaseModel):
    """
    Configuration for a screening run.
    Snapshot of settings used to filter articles.
    """

    review_type: str = Field(..., description="systematic, scoping, or quick")
    date_range_start: int | None = Field(None, description="Start year (e.g. 2015)")
    date_range_end: int | None = Field(None, description="End year (e.g. 2025)")
    languages: list[str] = Field(default=["eng"], description="Allowed languages")

    population: PopulationCriteria = Field(default_factory=PopulationCriteria)
    study_design: StudyDesignCriteria = Field(default_factory=StudyDesignCriteria)

    # Custom free-text criteria for AI to consider
    custom_inclusion: str | None = None
    custom_exclusion: str | None = None


class ScreeningCriteriaCreate(BaseModel):
    project_id: UUID
    review_type: str
    filters: CriteriaConfig


class ScreeningCriteriaResponse(ScreeningCriteriaCreate):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# ----------------------------------------------------------------------------
# Article Decisions
# ----------------------------------------------------------------------------


class ArticleDecisionCreate(BaseModel):
    project_id: UUID
    pmid: str
    title: str | None = None

    # Decision
    source: str = Field(..., description="rule_engine, ai_model, human_override")
    status: str = Field(..., description="included, excluded, unclear")
    reason: str | None = None

    # AI Metadata
    evidence_quote: str | None = None
    study_type_classification: str | None = None


class ArticleDecisionUpdate(BaseModel):
    human_override_status: str | None = None
    human_notes: str | None = None


class ArticleDecisionResponse(ArticleDecisionCreate):
    human_override_status: str | None = None
    human_notes: str | None = None
    updated_at: datetime

    class Config:
        from_attributes = True
