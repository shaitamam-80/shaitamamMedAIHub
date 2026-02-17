"""
MedAI Hub - Reporting Prompts
================================

System prompts for the Reporting stage (manuscript writing).
Distilled from manuscript-writer/SKILL.md.

What goes to code (deterministic):
    - PRISMA sections structure
    - Journal format constraints
    - GRADE language mapping
    - Review type → checklist mapping

What stays for LLM (semantic):
    - Actual manuscript writing
    - Section content generation
    - PRISMA checklist completion
    - Cover letter writing
"""

from typing import Dict, List


# ============================================================================
# PRISMA 2020 Section Structure
# ============================================================================

MANUSCRIPT_SECTIONS: List[Dict[str, str]] = [
    {"id": "title", "name": "Title", "prisma_items": "1", "recommended_order": 6},
    {"id": "abstract", "name": "Abstract", "prisma_items": "2", "recommended_order": 7},
    {"id": "introduction", "name": "Introduction", "prisma_items": "3-4", "recommended_order": 3},
    {"id": "methods", "name": "Methods", "prisma_items": "5-15", "recommended_order": 1},
    {"id": "results", "name": "Results", "prisma_items": "16-23", "recommended_order": 2},
    {"id": "discussion", "name": "Discussion", "prisma_items": "24-26", "recommended_order": 4},
    {"id": "conclusions", "name": "Conclusions", "prisma_items": "26", "recommended_order": 5},
    {"id": "declarations", "name": "Declarations", "prisma_items": "27-30", "recommended_order": 8},
]

# Recommended writing order (methods first, abstract last)
WRITING_ORDER = ["methods", "results", "introduction", "discussion", "conclusions", "title", "abstract", "declarations"]


# ============================================================================
# Journal Formatting Constraints
# ============================================================================

JOURNAL_FORMATS: Dict[str, Dict[str, any]] = {
    "JAMA": {"word_limit": 3500, "abstract_limit": 350, "abstract_type": "structured", "tables": 5, "figures": 5, "references": 50},
    "BMJ": {"word_limit": 4000, "abstract_limit": 300, "abstract_type": "structured", "tables": 5, "figures": 4, "references": 40},
    "Lancet": {"word_limit": 4500, "abstract_limit": 300, "abstract_type": "unstructured", "tables": 5, "figures": 5, "references": 50},
    "Cochrane": {"word_limit": None, "abstract_limit": 750, "abstract_type": "structured", "tables": None, "figures": None, "references": None},
    "PLOS ONE": {"word_limit": None, "abstract_limit": 300, "abstract_type": "unstructured", "tables": None, "figures": None, "references": None},
}


# ============================================================================
# GRADE Language Mapping (Deterministic)
# ============================================================================

GRADE_LANGUAGE: Dict[str, Dict[str, str]] = {
    "High": {"verb": "results in", "qualifier": "is associated with"},
    "Moderate": {"verb": "likely results in", "qualifier": "probably"},
    "Low": {"verb": "may result in", "qualifier": "may be associated with"},
    "Very Low": {"verb": "we are uncertain whether", "qualifier": "we are uncertain whether"},
}


# ============================================================================
# Review Type → Checklist Mapping
# ============================================================================

REVIEW_TYPE_CHECKLIST: Dict[str, str] = {
    "systematic_intervention": "PRISMA 2020",
    "systematic_prevalence": "PRISMA 2020",
    "systematic_prognosis": "PRISMA 2020",
    "systematic_diagnostic": "PRISMA-DTA",
    "systematic_qualitative": "ENTREQ",
    "scoping": "PRISMA-ScR",
}


# ============================================================================
# Pre-Writing Checklist
# ============================================================================

PRE_WRITING_CHECKLIST = [
    {"id": "prospero", "label": "PROSPERO registration ID available", "required": True},
    {"id": "search_dates", "label": "Search dates documented", "required": True},
    {"id": "prisma_flow", "label": "PRISMA flow numbers complete", "required": True},
    {"id": "study_chars", "label": "Study characteristics extracted", "required": True},
    {"id": "rob", "label": "RoB assessments complete", "required": True},
    {"id": "synthesis", "label": "Synthesis results available", "required": True},
    {"id": "grade", "label": "GRADE assessments complete", "required": False},
]


# ============================================================================
# LLM System Prompt
# ============================================================================

REPORTING_SYSTEM_PROMPT = """You are a **Systematic Review Manuscript Writer** following PRISMA 2020 guidelines. You write publication-ready manuscripts from completed review data.

## CRITICAL RULES
1. **ONLY write from provided data** — never invent results or citations
2. **Follow PRISMA 2020** — every section must comply with PRISMA structure
3. **Maintain objectivity** — report findings, not recommendations
4. **Use GRADE language** — match certainty level to language strength
5. **Adapt to review type** — intervention, prevalence, diagnostic, scoping

## MANDATORY DISCLAIMER
At the beginning of every writing session:
> **Important:** I write the manuscript based on data from previous stages. I do not invent data or results. Every claim must be backed by source data.

## MANUSCRIPT WRITING PROCESS

### Step 1: Data Verification
Before writing, verify available data from prior stages:
- Research question and framework
- Protocol and PROSPERO ID
- Search strategy and dates
- Screening results (PRISMA flow numbers)
- Extraction data
- RoB assessments
- Synthesis/meta-analysis results
- GRADE assessments

### Step 2: Write Sections (Recommended Order)
1. **Methods** → 2. **Results** → 3. **Introduction** → 4. **Discussion** → 5. **Conclusions** → 6. **Title** → 7. **Abstract** → 8. **Declarations**

### Step 3: Per-Section Output
For each section:
- Write the section following PRISMA structure
- Note PRISMA items addressed
- Flag missing data that needs author input
- Track word count

## PRISMA 2020 STRUCTURE

### Methods (7 subsections)
1. Protocol and Registration — PROSPERO ID, amendments
2. Eligibility Criteria — structured by PICO(S)
3. Information Sources — databases, platforms, dates
4. Search Strategy — development, supplementary reference
5. Selection Process — software, screening stages
6. Data Collection Process — form, piloting
7. Synthesis Methods — effect measures, model, heterogeneity

### Results (6 subsections)
1. Study Selection — PRISMA flow, exclusion reasons
2. Study Characteristics — Table 1
3. Risk of Bias — traffic light figure, summary
4. Synthesis Results — per outcome with effect estimates
5. Publication Bias — funnel plot (if ≥10 studies)
6. Certainty of Evidence — SoF table, GRADE

### Discussion (5 paragraphs)
1. Summary of evidence
2. Comparison with previous reviews
3. Strengths
4. Limitations
5. Implications (practice + research)

## WRITING STYLE
- Active voice preferred; passive acceptable in Methods
- Past tense for Methods/Results; present for Discussion
- Numbers: spell 1-9, numerals 10+, always with units
- GRADE language:
  - High: "results in"
  - Moderate: "likely results in"
  - Low: "may result in"
  - Very Low: "we are uncertain whether"

## STAGE COMPLETION
The reporting stage is complete when:
- All manuscript sections are written
- PRISMA checklist is generated
- All data has source references
- Word count is within target range
"""


def get_reporting_context(
    review_type: str = "systematic_intervention",
    target_journal: str = "",
    sections_written: list = None,
    has_prospero: bool = False,
    prisma_flow: dict = None,
    included_count: int = 0,
) -> str:
    """Build context for the reporting prompt."""
    lines = ["\n\n[REPORTING CONTEXT]"]

    checklist = REVIEW_TYPE_CHECKLIST.get(review_type, "PRISMA 2020")
    lines.append(f"Review type: {review_type}")
    lines.append(f"Checklist: {checklist}")

    if target_journal:
        fmt = JOURNAL_FORMATS.get(target_journal)
        if fmt:
            lines.append(f"\nTarget journal: {target_journal}")
            if fmt["word_limit"]:
                lines.append(f"Word limit: {fmt['word_limit']}")
            lines.append(f"Abstract: {fmt['abstract_limit']} words ({fmt['abstract_type']})")

    if has_prospero:
        lines.append("PROSPERO: Registered")

    if prisma_flow:
        lines.append("\n[PRISMA FLOW DATA]")
        for key, val in prisma_flow.items():
            lines.append(f"  {key}: {val}")

    if included_count:
        lines.append(f"Included studies: {included_count}")

    if sections_written:
        lines.append(f"\nSections already written: {', '.join(sections_written)}")
        remaining = [s for s in WRITING_ORDER if s not in sections_written]
        if remaining:
            lines.append(f"Remaining: {', '.join(remaining)}")

    return "\n".join(lines)
