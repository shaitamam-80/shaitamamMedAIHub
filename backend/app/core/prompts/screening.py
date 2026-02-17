"""
MedAI Hub - Screening Prompts
==============================

System prompts and constants for the abstract screening node.
Distilled from pubmed-screening/SKILL.md.
"""

# -- Deterministic: Review type → screening method ---------------------------

REVIEW_TYPE_SCREENING_METHOD = {
    "systematic_intervention":  "two_stage",   # Title/abstract → Full-text
    "systematic_prevalence":    "two_stage",
    "systematic_prognosis":     "two_stage",
    "systematic_diagnostic":    "two_stage",
    "systematic_qualitative":   "two_stage",
    "scoping":                  "single_stage",  # AI-only with broader inclusion
}

# Framework → default inclusion dimensions
FRAMEWORK_CRITERIA_MAP = {
    "PICO":    {"dimensions": ["population", "intervention", "comparator", "outcome"], "optional": ["study_design", "language", "date_range"]},
    "PICOT":   {"dimensions": ["population", "intervention", "comparator", "outcome", "timeframe"], "optional": ["study_design", "language"]},
    "PICOS":   {"dimensions": ["population", "intervention", "comparator", "outcome", "study_design"], "optional": ["language", "date_range"]},
    "CoCoPop": {"dimensions": ["condition", "context", "population"], "optional": ["study_design", "language", "date_range"]},
    "PFO":     {"dimensions": ["population", "prognostic_factor", "outcome"], "optional": ["study_design", "language"]},
    "PEO":     {"dimensions": ["population", "exposure", "outcome"], "optional": ["study_design", "language"]},
    "PECO":    {"dimensions": ["population", "exposure", "comparator", "outcome"], "optional": ["study_design", "language"]},
    "PIRD":    {"dimensions": ["population", "index_test", "reference_test", "diagnosis"], "optional": ["language"]},
    "SPIDER":  {"dimensions": ["sample", "phenomenon", "design", "evaluation", "research_type"], "optional": ["language"]},
    "PICo":    {"dimensions": ["population", "interest", "context"], "optional": ["language"]},
    "PCC":     {"dimensions": ["population", "concept", "context"], "optional": ["language"]},
}

# Common exclusion reasons (deterministic rule-engine checks)
RULE_ENGINE_EXCLUSIONS = [
    {"code": "NOT_HUMAN", "label": "Non-human study", "keywords": ["mice", "rats", "murine", "canine", "bovine", "porcine", "in vitro", "cell line", "animal model"]},
    {"code": "WRONG_TYPE", "label": "Wrong publication type", "publication_types": ["Letter", "Editorial", "Comment", "Erratum", "Retracted Publication", "News", "Biography"]},
    {"code": "NON_ENGLISH", "label": "Non-English language", "check": "language_field"},
    {"code": "PROTOCOL_ONLY", "label": "Protocol without results", "keywords": ["study protocol", "protocol for a", "protocol of a"]},
    {"code": "REVIEW_ARTICLE", "label": "Review/meta-analysis (not primary study)", "publication_types": ["Review", "Systematic Review", "Meta-Analysis"]},
]

# Decision labels
DECISION_LABELS = {
    "include": {"en": "Include", "he": "לכלול"},
    "exclude": {"en": "Exclude", "he": "להוציא"},
    "maybe":   {"en": "Maybe/Uncertain", "he": "אולי/לא ברור"},
}


# -- LLM System Prompt -------------------------------------------------------

SCREENING_SYSTEM_PROMPT = """You are an **Abstract Screening Assistant** for systematic reviews. You help researchers screen articles for inclusion based on predefined eligibility criteria.

## RULES
1. **You are a screening tool, not a subject expert.** Apply the criteria objectively.
2. **Every INCLUDE decision MUST have a verbatim quote** from the abstract (1-2 sentences) supporting the decision.
3. **Human review is mandatory** — always emphasize this. You provide first-pass recommendations.
4. **Borderline cases → MAYBE.** Do not force include/exclude when uncertain.
5. Respond in the user's language (Hebrew or English). Keep technical terms (RCT, PMID, MeSH) in English.

## SCREENING PROCESS

### Phase 1: Criteria Setup
Before screening any articles:
1. Review the research question and framework components
2. Present the eligibility criteria (inclusion + exclusion) for user confirmation
3. Show which rule-engine exclusions will be applied automatically

### Phase 2: Automated Pre-filtering (Rule Engine)
These are applied BEFORE AI screening — instant, deterministic:
- Non-human studies (keyword detection)
- Wrong publication types (Letters, Editorials, Comments, etc.)
- Non-English articles (when language restriction applies)
- Protocols without results
- Review articles (when searching for primary studies only)

### Phase 3: AI Screening (Title/Abstract)
For each remaining article, evaluate against ALL criteria dimensions:
1. Check each dimension: population match? intervention match? outcome match?
2. Provide per-criterion verdict: ✅ match / ❌ no match / ⚠️ unclear
3. Make overall decision: INCLUDE / EXCLUDE / MAYBE
4. For INCLUDE: provide supporting quote
5. For EXCLUDE: state the primary exclusion reason

### Phase 4: Results Summary
Present results as:
- Total screened: N
- Included: N (list PMIDs)
- Excluded: N (breakdown by reason)
- Maybe/Uncertain: N (list PMIDs — need human review)
- Accuracy disclaimer: "This is a first-pass AI screening. Human expert review is mandatory."

## OUTPUT FORMAT FOR EACH ARTICLE
```
**PMID: [number]** | [First Author] ([Year])
Title: [title]

Criteria evaluation:
- [Dimension 1]: ✅/❌/⚠️ [brief reasoning]
- [Dimension 2]: ✅/❌/⚠️ [brief reasoning]
...

Decision: **INCLUDE** / **EXCLUDE** / **MAYBE**
Reason: [primary reason]
Quote: "[verbatim quote from abstract]" (for INCLUDE only)
```

## STAGE COMPLETION
The screening stage is complete when:
- All articles have been screened (or a batch is done)
- Results summary is presented
- User has reviewed and confirmed the decisions
- MAYBE articles have been resolved (or flagged for full-text review)
"""


def get_screening_context(
    framework_type: str,
    framework_data: dict,
    review_type: str,
    eligibility_criteria: dict | None = None,
    articles_count: int = 0,
) -> str:
    """Build context section from prior artifacts for the screening prompt."""
    lines = ["\n\n[SCREENING CONTEXT]"]

    lines.append(f"Framework: {framework_type}")
    lines.append(f"Review type: {review_type}")

    method = REVIEW_TYPE_SCREENING_METHOD.get(review_type, "two_stage")
    lines.append(f"Screening method: {method}")

    if framework_data:
        lines.append("\nFramework components:")
        for key, value in framework_data.items():
            lines.append(f"  - {key}: {value}")

    criteria_config = FRAMEWORK_CRITERIA_MAP.get(framework_type, {})
    if criteria_config:
        lines.append(f"\nRequired dimensions: {', '.join(criteria_config.get('dimensions', []))}")
        lines.append(f"Optional dimensions: {', '.join(criteria_config.get('optional', []))}")

    if eligibility_criteria:
        lines.append("\n[ELIGIBILITY CRITERIA FROM PROTOCOL]")
        if eligibility_criteria.get("inclusion"):
            lines.append("Inclusion:")
            for c in eligibility_criteria["inclusion"]:
                lines.append(f"  + {c}")
        if eligibility_criteria.get("exclusion"):
            lines.append("Exclusion:")
            for c in eligibility_criteria["exclusion"]:
                lines.append(f"  - {c}")

    if articles_count:
        lines.append(f"\nArticles to screen: {articles_count}")

    return "\n".join(lines)
