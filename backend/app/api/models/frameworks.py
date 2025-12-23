"""
MedAI Hub - Framework-specific Pydantic Models

Type-safe models for the most common research frameworks.
Covers PICO, PEO, SPIDER with explicit typing, plus GenericFramework for others.

Usage:
    from app.api.models.frameworks import PICOData, FrameworkDataUnion

    # API endpoint can accept any framework type
    def generate_query(data: FrameworkDataUnion): ...
"""

from typing import Any, Union

from pydantic import BaseModel, Field, model_validator


class PICOData(BaseModel):
    """
    PICO Framework - For intervention/therapy questions.

    Example: "In adults with type 2 diabetes (P), does metformin (I)
    compared to lifestyle changes (C) reduce HbA1c levels (O)?"
    """

    P: str = Field(..., min_length=1, description="Population/Problem - Who are you studying?")
    I: str = Field(..., min_length=1, description="Intervention - What treatment/exposure?")
    C: str | None = Field(None, description="Comparison - Alternative to intervention")
    O: str = Field(..., min_length=1, description="Outcome - What are you measuring?")
    research_question: str | None = Field(None, description="Formulated research question")

    @model_validator(mode="before")
    @classmethod
    def normalize_keys(cls, data: Any) -> Any:
        """Convert full-word keys to single letters for consistency."""
        if not isinstance(data, dict):
            return data

        key_map = {
            "population": "P",
            "problem": "P",
            "patient": "P",
            "participants": "P",
            "intervention": "I",
            "treatment": "I",
            "comparison": "C",
            "comparator": "C",
            "control": "C",
            "outcome": "O",
            "outcomes": "O",
        }

        normalized = {}
        for k, v in data.items():
            # Normalize key: check lowercase version in map
            new_key = key_map.get(k.lower(), k) if isinstance(k, str) else k
            normalized[new_key] = v

        return normalized

    def to_dict(self) -> dict[str, str]:
        """Convert to dict for legacy code compatibility."""
        result = {"P": self.P, "I": self.I, "O": self.O}
        if self.C:
            result["C"] = self.C
        return result


class PEOData(BaseModel):
    """
    PEO Framework - For exposure/etiology questions.

    Example: "In healthcare workers (P), does shift work (E)
    increase the risk of cardiovascular disease (O)?"
    """

    P: str = Field(..., min_length=1, description="Population - Who are you studying?")
    E: str = Field(..., min_length=1, description="Exposure - What exposure/risk factor?")
    O: str = Field(..., min_length=1, description="Outcome - What health outcome?")
    research_question: str | None = Field(None, description="Formulated research question")

    @model_validator(mode="before")
    @classmethod
    def normalize_keys(cls, data: Any) -> Any:
        """Convert full-word keys to single letters."""
        if not isinstance(data, dict):
            return data

        key_map = {
            "population": "P",
            "patient": "P",
            "participants": "P",
            "exposure": "E",
            "outcome": "O",
            "outcomes": "O",
        }

        normalized = {}
        for k, v in data.items():
            new_key = key_map.get(k.lower(), k) if isinstance(k, str) else k
            normalized[new_key] = v

        return normalized

    def to_dict(self) -> dict[str, str]:
        """Convert to dict for legacy code compatibility."""
        return {"P": self.P, "E": self.E, "O": self.O}


class SPIDERData(BaseModel):
    """
    SPIDER Framework - For qualitative and mixed-methods research.

    Example: "How do nurses (S) experience burnout (PI) as explored through
    interviews (D) measuring job satisfaction (E) in qualitative studies (R)?"
    """

    S: str = Field(..., min_length=1, description="Sample - Who is being studied?")
    PI: str = Field(
        ..., min_length=1, description="Phenomenon of Interest - What is being studied?"
    )
    D: str = Field(..., min_length=1, description="Design - What research design?")
    E: str = Field(..., min_length=1, description="Evaluation - How is it measured?")
    R: str = Field(..., min_length=1, description="Research type - Qualitative/quantitative/mixed?")
    research_question: str | None = Field(None, description="Formulated research question")

    @model_validator(mode="before")
    @classmethod
    def normalize_keys(cls, data: Any) -> Any:
        """Convert full-word keys to abbreviations."""
        if not isinstance(data, dict):
            return data

        key_map = {
            "sample": "S",
            "phenomenon": "PI",
            "phenomenon_of_interest": "PI",
            "phenomenonofinterest": "PI",
            "design": "D",
            "evaluation": "E",
            "research": "R",
            "research_type": "R",
            "researchtype": "R",
        }

        normalized = {}
        for k, v in data.items():
            new_key = key_map.get(k.lower().replace(" ", "_"), k) if isinstance(k, str) else k
            normalized[new_key] = v

        return normalized

    def to_dict(self) -> dict[str, str]:
        """Convert to dict for legacy code compatibility."""
        return {"S": self.S, "PI": self.PI, "D": self.D, "E": self.E, "R": self.R}


class PICOTData(BaseModel):
    """
    PICOT Framework - PICO with Time element.

    Example: "In adults with hypertension (P), does exercise (I) compared to
    medication (C) reduce blood pressure (O) over 6 months (T)?"
    """

    P: str = Field(..., min_length=1, description="Population/Problem")
    I: str = Field(..., min_length=1, description="Intervention")
    C: str | None = Field(None, description="Comparison")
    O: str = Field(..., min_length=1, description="Outcome")
    T: str = Field(..., min_length=1, description="Time/Timeframe")
    research_question: str | None = Field(None, description="Formulated research question")

    @model_validator(mode="before")
    @classmethod
    def normalize_keys(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data

        key_map = {
            "population": "P",
            "problem": "P",
            "intervention": "I",
            "comparison": "C",
            "comparator": "C",
            "control": "C",
            "outcome": "O",
            "time": "T",
            "timeframe": "T",
            "duration": "T",
        }

        normalized = {}
        for k, v in data.items():
            new_key = key_map.get(k.lower(), k) if isinstance(k, str) else k
            normalized[new_key] = v

        return normalized

    def to_dict(self) -> dict[str, str]:
        result = {"P": self.P, "I": self.I, "O": self.O, "T": self.T}
        if self.C:
            result["C"] = self.C
        return result


class CoCoPoPData(BaseModel):
    """
    CoCoPop Framework - For prevalence/incidence studies.

    Example: "What is the prevalence (Co) of depression (Co)
    in elderly nursing home residents (Pop)?"
    """

    Co: str = Field(..., min_length=1, description="Condition - Health condition of interest")
    Context: str = Field(..., min_length=1, description="Context - Setting or circumstances")
    Pop: str = Field(..., min_length=1, description="Population - Target population")
    research_question: str | None = Field(None, description="Formulated research question")

    @model_validator(mode="before")
    @classmethod
    def normalize_keys(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data

        key_map = {"condition": "Co", "context": "Context", "population": "Pop"}

        normalized = {}
        for k, v in data.items():
            new_key = key_map.get(k.lower(), k) if isinstance(k, str) else k
            normalized[new_key] = v

        return normalized

    def to_dict(self) -> dict[str, str]:
        return {"Co": self.Co, "Context": self.Context, "Pop": self.Pop}


class GenericFrameworkData(BaseModel):
    """
    Generic framework for less common types (ECLIPSE, SPICE, etc.).

    Accepts any key-value pairs and validates that components are non-empty.
    """

    components: dict[str, str] = Field(..., description="Framework components as key-value pairs")
    framework_type: str | None = Field(
        None, description="Framework type name (e.g., 'ECLIPSE', 'SPICE')"
    )
    research_question: str | None = Field(None, description="Formulated research question")

    @model_validator(mode="before")
    @classmethod
    def flatten_if_needed(cls, data: Any) -> Any:
        """
        Handle both nested and flat structures.

        Nested: {"components": {"P": "...", "I": "..."}, "framework_type": "PICO"}
        Flat: {"P": "...", "I": "...", "framework_type": "PICO"}
        """
        if not isinstance(data, dict):
            return data

        # Already has components - return as-is
        if "components" in data:
            return data

        # Flat structure - extract components
        framework_type = data.pop("framework_type", None)
        research_question = data.pop("research_question", None)

        # Remaining keys are components
        components = {k: v for k, v in data.items() if v}  # Filter empty values

        return {
            "components": components,
            "framework_type": framework_type,
            "research_question": research_question,
        }

    @model_validator(mode="after")
    def validate_non_empty_components(self) -> "GenericFrameworkData":
        """Ensure at least one component exists."""
        if not self.components:
            raise ValueError("At least one framework component is required")
        return self

    def to_dict(self) -> dict[str, str]:
        """Convert to dict for legacy code compatibility."""
        return self.components.copy()


# Union type for API endpoints - ordered by specificity (most specific first)
FrameworkDataUnion = Union[
    PICOData, PICOTData, PEOData, SPIDERData, CoCoPoPData, GenericFrameworkData
]


def framework_to_dict(data: FrameworkDataUnion) -> dict[str, str]:
    """
    Convert any framework model to a plain dict.

    Used for legacy code compatibility where Dict[str, Any] is expected.

    Args:
        data: Any framework model instance

    Returns:
        Dict with framework components
    """
    if hasattr(data, "to_dict"):
        return data.to_dict()
    elif isinstance(data, GenericFrameworkData):
        return data.components
    else:
        # Fallback for unexpected types
        return data.model_dump(exclude_none=True, exclude={"research_question", "framework_type"})


def detect_framework_type(data: dict[str, Any]) -> str:
    """
    Detect framework type from data keys.

    Args:
        data: Dict with framework component keys

    Returns:
        Framework type string (e.g., 'PICO', 'PEO', 'SPIDER')
    """
    keys = {k.upper() for k in data if k not in ("research_question", "framework_type")}

    # Check for specific patterns
    if {"S", "PI", "D", "E", "R"} <= keys:
        return "SPIDER"
    elif {"CO", "CONTEXT", "POP"} <= keys:
        return "CoCoPop"
    elif "E" in keys and "I" not in keys and {"P", "O"} <= keys:
        return "PEO"
    elif "T" in keys and {"P", "I", "O"} <= keys:
        return "PICOT"
    elif {"P", "I", "O"} <= keys:
        return "PICO"
    else:
        return "Generic"
