"""
MedAI Hub - Rule Engine (Layer A)
Fast, deterministic filtering of articles based on metadata (Date, Language, PubType).
"""

import logging

from app.api.models.screening import CriteriaConfig
from app.core.gems.criteria_library import get_criteria_by_code
from app.services.medline_parser import MedlineAbstract

logger = logging.getLogger(__name__)


class RuleEngine:
    """
    Layer A: Deterministic Metadata Filtering.
    """

    def __init__(self, config: CriteriaConfig):
        self.config = config

    def evaluate(self, abstract: MedlineAbstract) -> tuple[str, str | None]:
        """
        Evaluate an abstract against the criteria.
        Returns: (status, reason)
        status: 'pass' (continue to AI) or 'excluded' (stop here)
        reason: Description of why it was excluded
        """

        # 1. Check Year
        if not self._check_year(abstract):
            return (
                "excluded",
                f"Publication Year {abstract.publication_date} outside range {self.config.date_range_start}-{self.config.date_range_end}",
            )

        # 2. Check Language
        if not self._check_language(abstract):
            return (
                "excluded",
                f"Language {abstract.language} not in {self.config.languages}",
            )

        # 3. Check Publication Type (Exclusions)
        exclusion_reason = self._check_pub_type_exclusions(abstract)
        if exclusion_reason:
            return "excluded", exclusion_reason

        return "pass", None

    def _check_year(self, abstract: MedlineAbstract) -> bool:
        """Check if publication year is within range."""
        if not self.config.date_range_start and not self.config.date_range_end:
            return True

        if not abstract.publication_date:
            # If date is missing, be conservative and pass it (let AI decide or flag)
            return True

        # Extract year from DP string (e.g. "2023 Jan 15" -> 2023)
        # Simple extraction: take first 4 digits
        import re

        match = re.search(r"\d{4}", abstract.publication_date)
        if not match:
            return True  # Could not parse, pass it

        year = int(match.group(0))

        if self.config.date_range_start and year < self.config.date_range_start:
            return False
        return not (self.config.date_range_end and year > self.config.date_range_end)

    def _check_language(self, abstract: MedlineAbstract) -> bool:
        """Check if language is allowed."""
        if not self.config.languages:
            return True

        if not abstract.language:
            # Default to English if missing/unknown? Or pass?
            # MEDLINE often omits LA for English in some versions, but usually it's there.
            # Let's pass if missing to be safe.
            return True

        # Abstract language might be "eng; fre"
        langs = [l.strip().lower() for l in abstract.language.split(";")]
        allowed = [l.lower() for l in self.config.languages]

        # If ANY of the article languages is in allowed list, pass
        # e.g. Article is "eng; fre" and allowed is "eng" -> Pass
        return any(lang in allowed for lang in langs)

    def _check_pub_type_exclusions(self, abstract: MedlineAbstract) -> str | None:
        """Check against excluded Publication Types."""
        if not abstract.publication_types:
            return None

        active_exclusions = self.config.study_design.exclusion_codes

        for code in active_exclusions:
            criteria = get_criteria_by_code(code)
            if not criteria or "pub_types" not in criteria:
                continue

            forbidden_types = [pt.lower() for pt in criteria["pub_types"]]

            for article_pt in abstract.publication_types:
                if article_pt.lower() in forbidden_types:
                    return f"Excluded by {criteria['label']} (Type: {article_pt})"

        return None
