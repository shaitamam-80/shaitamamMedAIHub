"""
MedAI Hub - Search Strategy Prompts
====================================

System prompts and constants for the PubMed search query builder node.
Distilled from pubmed-query/SKILL.md into deterministic structures + LLM prompts.
"""

# -- Deterministic mappings (no LLM needed) ----------------------------------

# Framework → which components become concept blocks in the query
FRAMEWORK_CONCEPT_BLOCKS = {
    "PICO":    ["P", "I", "C", "O"],
    "PICOT":   ["P", "I", "C", "O"],
    "PICOS":   ["P", "I", "C", "O"],
    "CoCoPop": ["Co", "Context", "Pop"],
    "PFO":     ["P", "F", "O"],
    "PEO":     ["P", "E", "O"],
    "PECO":    ["P", "E", "C", "O"],
    "PIRD":    ["P", "I", "R", "D"],
    "PICo":    ["P", "I", "Co"],
    "SPIDER":  ["S", "PI", "D", "E", "R"],
    "PCC":     ["P", "C", "Context"],
}

# Question type → recommended clinical query filter
CLINICAL_FILTERS = {
    "effectiveness":  {
        "broad": '(randomized controlled trial[pt] OR controlled clinical trial[pt] OR clinical trial[pt] OR "clinical trials as topic"[mesh] OR random*[tiab])',
        "narrow": '(randomized controlled trial[pt] OR "randomized controlled trials as topic"[mesh])',
    },
    "prevalence": {
        "broad": '(prevalence[mesh] OR prevalence[tiab] OR "cross-sectional studies"[mesh] OR cross-sectional[tiab] OR epidemiology[sh] OR incidence[mesh] OR incidence[tiab])',
        "narrow": '(prevalence[mesh] OR "cross-sectional studies"[mesh])',
    },
    "prognosis": {
        "broad": '(prognosis[mesh] OR prognosis[tiab] OR "cohort studies"[mesh] OR cohort[tiab] OR "follow-up studies"[mesh] OR longitudinal[tiab] OR prospective[tiab])',
        "narrow": '(prognosis[mesh] OR "cohort studies"[mesh])',
    },
    "etiology": {
        "broad": '("risk factors"[mesh] OR "risk factors"[tiab] OR "odds ratio"[tiab] OR "relative risk"[tiab] OR "cohort studies"[mesh] OR "case-control studies"[mesh])',
        "narrow": '("cohort studies"[mesh] OR "case-control studies"[mesh])',
    },
    "diagnostic": {
        "broad": '(sensitivity[tiab] OR specificity[tiab] OR "diagnostic accuracy"[tiab] OR "predictive value"[tiab] OR ROC[tiab] OR "likelihood ratio"[tiab])',
        "narrow": '("sensitivity and specificity"[mesh] OR "diagnostic accuracy"[tiab])',
    },
    "qualitative": {
        "broad": '(qualitative[tiab] OR "qualitative research"[mesh] OR interview*[tiab] OR "focus groups"[mesh] OR "grounded theory"[tiab] OR thematic[tiab] OR phenomenolog*[tiab])',
        "narrow": '("qualitative research"[mesh] OR qualitative[ti])',
    },
    "scoping": {},  # Scoping reviews typically don't use methodology filters
}

# Strategy labels and descriptions
STRATEGY_DEFINITIONS = {
    "broad": "High sensitivity — captures most relevant articles but with more noise. Use Outcome block only if concept is distinctive.",
    "focused": "Balanced sensitivity/specificity — good starting point. Uses all applicable concept blocks.",
    "precision": "High specificity — fewer results, mostly relevant. Uses narrow filters and precise MeSH terms.",
}


# -- LLM System Prompt -------------------------------------------------------

SEARCH_SYSTEM_PROMPT = """You are a **PubMed Search Query Builder** for systematic reviews. You translate structured research questions into precise, executable PubMed Boolean queries.

## RULES
1. **NEVER answer the clinical question** — only build the search query.
2. **ALL queries must be valid PubMed syntax** — field tags, Boolean operators, proper parentheses.
3. **Use MeSH terms verified via the mesh_enrich tool** — never hallucinate MeSH descriptors.
4. If the user writes in Hebrew, respond in Hebrew but **ALL queries must be in English**.

## QUERY BUILDING PROCESS

### For each concept block:
1. Start with **MeSH Terms** `[MeSH Terms]` — the controlled vocabulary (verified only).
2. Add **Free-text synonyms** `[tiab]` — plurals, abbreviations, British/American spelling, lay terms.
3. Combine within block using **OR**.

### Between concept blocks:
- Use **AND** between different concepts (P AND I AND O).
- Outcome block is OPTIONAL — omit if it might reduce sensitivity excessively.

### Query format:
```
-- Block 1: Population
(MeSH_term[MeSH Terms] OR synonym1[tiab] OR synonym2[tiab])

AND

-- Block 2: Intervention/Exposure
(MeSH_term[MeSH Terms] OR synonym1[tiab] OR synonym2[tiab])

AND

-- Block 3: Outcome (optional)
(MeSH_term[MeSH Terms] OR synonym1[tiab] OR synonym2[tiab])

AND

-- Block 4: Study design filter (when applicable)
(filter_terms)
```

## TERM EXPANSION CHECKLIST
For each concept, ensure you include:
- Singular/plural forms
- American/British spelling (randomised/randomized)
- Abbreviations (DM, T2DM for diabetes)
- Lay terms ("heart attack" for myocardial infarction)
- Related concepts ("exercise" → "physical activity")

## THREE STRATEGIES
Generate 3 query variants:
1. **Broad** — High sensitivity. Fewer blocks, broader MeSH explosions, no outcome filter.
2. **Focused** — Balanced. All concept blocks with clinical filter.
3. **Precision** — High specificity. Narrow MeSH, narrow filter, all blocks.

## OUTPUT FORMAT
For each strategy, output:
```
### Strategy: [Broad/Focused/Precision]
**Estimated sensitivity:** [High/Medium/Low]
**Concept blocks used:** [list]

[The complete PubMed query — ready to copy-paste]
```

## STAGE COMPLETION
The search stage is complete when:
- At least one query strategy is validated (runs without syntax errors)
- The user has reviewed the results count
- The user confirms the search is comprehensive enough
"""


def get_search_context(
    framework_type: str,
    framework_data: dict,
    question_narrow: str = "",
    question_broad: str = "",
) -> str:
    """Build context section from prior artifacts for the search prompt."""
    lines = []

    lines.append(f"\n\n[RESEARCH QUESTION CONTEXT]")
    lines.append(f"Framework: {framework_type}")

    if framework_data:
        lines.append("Components:")
        for key, value in framework_data.items():
            lines.append(f"  - {key}: {value}")

    if question_narrow:
        lines.append(f"\nFocused question: {question_narrow}")
    if question_broad:
        lines.append(f"Broad question: {question_broad}")

    concept_keys = FRAMEWORK_CONCEPT_BLOCKS.get(framework_type, list(framework_data.keys()))
    lines.append(f"\nConcept blocks to use: {', '.join(concept_keys)}")

    return "\n".join(lines)
