"""
Query Tool Prompts
System prompts for PubMed query generation with validated hedges

Implements comprehensive search strategy generation with 9 framework-specific logic cases.
"""

from typing import Dict, Any, List
from .shared import FRAMEWORK_SCHEMAS, get_framework_components


# ============================================
# REPOSITORY OF VALIDATED METHODOLOGICAL HEDGES
# ============================================
# Sources: Cochrane HSSS, SIGN, Haynes (McMaster), Wong, ISSG

VALIDATED_HEDGES = {
    # Cochrane HSSS (Highly Sensitive Search Strategy)
    "RCT_COCHRANE": {
        "name": "Cochrane HSSS (RCTs)",
        "citation": "Lefebvre C, et al. Cochrane Handbook 2019",
        "query": '(randomized controlled trial[pt] OR controlled clinical trial[pt] OR randomized[tiab] OR randomised[tiab] OR placebo[tiab] OR "clinical trials as topic"[mesh:noexp] OR randomly[tiab] OR trial[ti]) NOT (animals[mh] NOT humans[mh])',
        "use_case": "RCTs for PICO intervention questions"
    },
    "SR_COCHRANE": {
        "name": "Cochrane Systematic Review Filter",
        "citation": "Lefebvre C, et al. Cochrane Handbook 2019",
        "query": '(systematic review[pt] OR meta-analysis[pt] OR systematic[sb] OR meta-analysis[tiab] OR "systematic review"[tiab] OR "meta analysis"[tiab])',
        "use_case": "Systematic reviews and meta-analyses"
    },

    # SIGN Filters (Scottish Intercollegiate Guidelines Network)
    "OBSERVATIONAL_SIGN": {
        "name": "SIGN Filter (Observational)",
        "citation": "Scottish Intercollegiate Guidelines Network",
        "query": '(cohort studies[mh] OR cohort study[tiab] OR longitudinal studies[mh] OR follow-up studies[mh] OR prospective studies[mh] OR retrospective studies[mh] OR case-control studies[mh] OR case control[tiab])',
        "use_case": "Observational studies for PEO/PECO questions"
    },

    # Haynes Filters (McMaster/PubMed Clinical Queries)
    "PROGNOSIS_HAYNES": {
        "name": "Haynes Filter (Prognosis)",
        "citation": "Haynes RB, et al. BMC Medical Informatics 2005",
        "query": '(prognosis[sh] OR survival analysis[mh] OR disease progression[mh] OR mortality[mh] OR incidence[mh] OR follow-up studies[mh] OR prognos*[tiab] OR course[tiab] OR predict*[tiab] OR survival[tiab])',
        "use_case": "Prognosis studies for PFO questions"
    },
    "DIAGNOSIS_HAYNES": {
        "name": "Haynes Filter (Diagnosis)",
        "citation": "Haynes RB, et al. BMC Medical Informatics 2004",
        "query": '(sensitivity and specificity[mh] OR predictive value of tests[mh] OR diagnosis[sh] OR diagnostic use[sh] OR specificity[tiab] OR sensitivity[tiab] OR accurac*[tiab] OR "receiver operating characteristic"[tiab] OR ROC[tiab])',
        "use_case": "Diagnostic accuracy for PIRD questions"
    },
    "ETIOLOGY_HAYNES": {
        "name": "Haynes Filter (Etiology)",
        "citation": "Haynes RB, et al. BMC Medical Informatics 2005",
        "query": '(etiology[sh] OR risk factors[mh] OR odds ratio[mh] OR relative risk[mh] OR causality[mh] OR risk[tiab] OR cause*[tiab] OR "odds ratio"[tiab] OR "relative risk"[tiab])',
        "use_case": "Etiology/risk factor studies for PEO questions"
    },

    # Wong Filter (Qualitative Research)
    "QUALITATIVE_WONG": {
        "name": "Wong Filter (Qualitative)",
        "citation": "Wong SSL, et al. J Med Libr Assoc 2004",
        "query": '(qualitative research[mh] OR interviews as topic[mh] OR focus groups[mh] OR narration[mh] OR qualitative[tiab] OR interview*[tiab] OR thematic[tiab] OR phenomenolog*[tiab] OR grounded theory[tiab] OR ethnograph*[tiab] OR "lived experience"[tiab])',
        "use_case": "Qualitative studies for SPIDER/PICo questions"
    },

    # Policy/Health Services Filter
    "POLICY_FILTER": {
        "name": "Policy & Health Services Filter",
        "citation": "InterTASC ISSG",
        "query": '(health policy[mh] OR health services research[mh] OR program evaluation[mh] OR implementation science[mh] OR delivery of health care[mh] OR "health service*"[tiab] OR policy[tiab] OR implementation[tiab])',
        "use_case": "Policy and health services for ECLIPSE questions"
    },

    # Theory Filter
    "THEORY_FILTER": {
        "name": "Theory & Framework Filter",
        "citation": "BeHEMoTh Guidelines",
        "query": '(models, theoretical[mh] OR psychological theory[mh] OR nursing theory[mh] OR theor*[ti] OR framework*[ti] OR model[ti] OR "behavior change"[tiab] OR "behaviour change"[tiab])',
        "use_case": "Theory-based studies for BeHEMoTh questions"
    },

    # Prevalence/Epidemiology Filter
    "PREVALENCE_FILTER": {
        "name": "Prevalence & Epidemiology Filter",
        "citation": "Cochrane Handbook",
        "query": '(prevalence[mh] OR cross-sectional studies[mh] OR epidemiology[sh] OR incidence[mh] OR prevalence[tiab] OR incidence[tiab] OR epidemiol*[tiab] OR "cross-sectional"[tiab])',
        "use_case": "Prevalence studies for CoCoPop questions"
    }
}

# ============================================
# PROXIMITY SEARCH GUIDE (PubMed-Specific)
# ============================================

PROXIMITY_SEARCH_GUIDE = {
    "supported": True,
    "syntax": '"term1 term2"[field:~N]',
    "supported_fields": ["ti", "tiab", "ad"],
    "note": "Only works with Title, Title/Abstract, and Affiliation fields. Does NOT work with MeSH.",
    "examples": [
        {"intent": "Terms within 2 words", "query": '"diabetes management"[tiab:~2]'},
        {"intent": "In title, within 3 words", "query": '"patient safety"[ti:~3]'},
        {"intent": "Exact adjacency", "query": '"heart failure"[tiab:~0]'}
    ],
    "guidance": [
        "Start with N=0-3 for precision, expand if needed",
        "Terms can appear in any order within distance N",
        "Maximum practical distance is ~10"
    ]
}


# ============================================
# FRAMEWORK-SPECIFIC QUERY LOGIC (9 Cases)
# ============================================

FRAMEWORK_QUERY_LOGIC = {
    # Case 1: PICO Family (Intervention)
    "PICO": {
        "logic": "Relaxed Boolean - OR within concepts, AND between",
        "hedge": "RCT_COCHRANE",
        "formula": {
            "broad": "(P_terms OR P_mesh) AND (I_terms OR I_mesh) AND (C_terms OR C_mesh) AND (O_terms OR O_mesh)",
            "focused": "(P_mesh[majr] OR P_terms[ti]) AND (I_terms[tiab] OR I_mesh) AND (O_mesh[majr] OR O_terms[ti])",
            "clinical_filtered": "Focused_query AND (RCT_COCHRANE)"
        }
    },
    "PICOT": {"logic": "Same as PICO", "hedge": "RCT_COCHRANE", "inherits": "PICO"},
    "PICOS": {"logic": "Same as PICO", "hedge": "RCT_COCHRANE", "inherits": "PICO"},
    "PICOC": {"logic": "Same as PICO", "hedge": "RCT_COCHRANE", "inherits": "PICO"},
    "PICOTS": {"logic": "Same as PICO", "hedge": "RCT_COCHRANE", "inherits": "PICO"},

    # Case 2: CoCoPop (Prevalence/Epidemiology)
    "CoCoPop": {
        "logic": "Condition AND Population - Context as optional filter",
        "hedge": "PREVALENCE_FILTER",
        "formula": {
            "broad": "(Condition_terms OR Condition_mesh) AND (Population_terms OR Population_mesh)",
            "focused": "(Condition_mesh[majr]) AND (Population_mesh) AND (prevalence[tiab] OR incidence[tiab] OR epidemiology[tiab])",
            "clinical_filtered": "Focused_query AND (PREVALENCE_FILTER)"
        }
    },

    # Case 3: PEO/PECO (Exposure/Etiology)
    "PEO": {
        "logic": "Exposure-focused with outcome",
        "hedge": "ETIOLOGY_HAYNES",
        "formula": {
            "broad": "(P_terms OR P_mesh) AND (E_terms OR E_mesh) AND (O_terms OR O_mesh)",
            "focused": "(P_mesh[majr]) AND (E_terms[tiab] OR E_mesh) AND (O_mesh)",
            "clinical_filtered": "Focused_query AND (OBSERVATIONAL_SIGN) AND (ETIOLOGY_HAYNES)"
        }
    },
    "PECO": {"logic": "Same as PEO with comparator", "hedge": "ETIOLOGY_HAYNES", "inherits": "PEO"},

    # Case 4: SPIDER/PICo (Qualitative)
    "SPIDER": {
        "logic": "Qualitative structure with design/research type",
        "hedge": "QUALITATIVE_WONG",
        "formula": {
            "broad": "(S_terms) AND (PI_terms) AND (D_terms OR E_terms)",
            "focused": "(S_mesh OR S_terms[tiab]) AND (PI_terms[tiab]) AND (qualitative[tiab] OR interview*[tiab])",
            "clinical_filtered": "Focused_query AND (QUALITATIVE_WONG)"
        }
    },
    "PICo": {
        "logic": "Simplified qualitative structure",
        "hedge": "QUALITATIVE_WONG",
        "formula": {
            "broad": "(P_terms OR P_mesh) AND (I_terms) AND (Co_terms)",
            "focused": "(P_mesh) AND (I_terms[tiab]) AND (qualitative[tiab] OR experience*[tiab])",
            "clinical_filtered": "Focused_query AND (QUALITATIVE_WONG)"
        }
    },

    # Case 5: PFO (Prognosis)
    "PFO": {
        "logic": "Prognostic factors with outcome",
        "hedge": "PROGNOSIS_HAYNES",
        "formula": {
            "broad": "(P_terms OR P_mesh) AND (F_terms OR F_mesh) AND (O_terms OR O_mesh)",
            "focused": "(P_mesh[majr]) AND (F_terms[tiab] OR F_mesh) AND (O_mesh[majr])",
            "clinical_filtered": "Focused_query AND (PROGNOSIS_HAYNES)"
        }
    },

    # Case 6: PIRD (Diagnostic Accuracy)
    "PIRD": {
        "logic": "Index test vs Reference standard",
        "hedge": "DIAGNOSIS_HAYNES",
        "formula": {
            "broad": "(P_terms OR P_mesh) AND (I_terms OR I_mesh) AND (R_terms OR R_mesh)",
            "focused": "(P_mesh) AND (I_terms[tiab] OR I_mesh) AND (R_mesh) AND (sensitivity[tiab] OR specificity[tiab])",
            "clinical_filtered": "Focused_query AND (DIAGNOSIS_HAYNES)"
        }
    },

    # Case 7: PCC (Scoping Reviews)
    "PCC": {
        "logic": "Broad scoping - minimal filters for mapping",
        "hedge": None,  # No hedge for scoping
        "formula": {
            "broad": "(P_terms OR P_mesh) AND (C_terms) AND (C2_terms)",
            "focused": "(P_mesh OR P_terms[tiab]) AND (C_terms[tiab]) AND (C2_terms[tiab])",
            "clinical_filtered": "Same as focused (no hedge for scoping)"
        }
    },

    # Case 8: ECLIPSE (Policy)
    "ECLIPSE": {
        "logic": "Policy and service terms",
        "hedge": "POLICY_FILTER",
        "formula": {
            "broad": "(C_terms) AND (L_terms OR S_terms) AND (I_terms OR E_terms)",
            "focused": "(C_mesh OR C_terms[tiab]) AND (service*[tiab] OR policy[tiab]) AND (impact[tiab] OR outcome*[tiab])",
            "clinical_filtered": "Focused_query AND (POLICY_FILTER)"
        }
    },
    "SPICE": {"logic": "Similar to ECLIPSE", "hedge": "POLICY_FILTER", "inherits": "ECLIPSE"},

    # Case 9: BeHEMoTh (Theory)
    "BeHEMoTh": {
        "logic": "Theory identification and behavior",
        "hedge": "THEORY_FILTER",
        "formula": {
            "broad": "(Be_terms) AND (H_terms) AND (Mo_terms OR theor*[tiab])",
            "focused": "(Be_terms[tiab]) AND (H_mesh OR H_terms[tiab]) AND (theor*[ti] OR model*[ti])",
            "clinical_filtered": "Focused_query AND (THEORY_FILTER)"
        }
    },

    # Case 10: CIMO (Realist)
    "CIMO": {
        "logic": "Context-mechanism-outcome pattern",
        "hedge": None,
        "formula": {
            "broad": "(C_terms) AND (I_terms) AND (M_terms OR mechanism*[tiab]) AND (O_terms)",
            "focused": "(C_terms[tiab]) AND (I_mesh OR I_terms[tiab]) AND (mechanism*[tiab]) AND (O_terms[tiab])",
            "clinical_filtered": "Same as focused"
        }
    },

    # Advanced Frameworks
    "PerSPEcTiF": {
        "logic": "Health equity with multiple perspectives",
        "hedge": None,
        "formula": {
            "broad": "(P_terms) AND (S_terms OR E_terms) AND (dispar*[tiab] OR inequ*[tiab] OR equity[tiab])",
            "focused": "(P_terms[tiab]) AND (E_terms[tiab]) AND (health disparities[mh] OR healthcare disparities[mh])",
            "clinical_filtered": "Same as focused"
        }
    },
    "PICOT-D": {
        "logic": "Digital health adaptation of PICOT",
        "hedge": "RCT_COCHRANE",
        "formula": {
            "broad": "(P_terms) AND (I_terms OR digital*[tiab] OR app[tiab] OR telemedicine[tiab]) AND (O_terms)",
            "focused": "(P_mesh) AND (telemedicine[mh] OR mobile applications[mh] OR I_terms[tiab]) AND (O_mesh)",
            "clinical_filtered": "Focused_query AND (RCT_COCHRANE)"
        }
    },
    "PICOTS-ComTeC": {"logic": "Complex digital interventions", "hedge": "RCT_COCHRANE", "inherits": "PICOT-D"}
}


def get_query_system_prompt(framework_type: str = "PICO") -> str:
    """
    Returns the system prompt for the Query Tool with framework-specific logic.

    Args:
        framework_type: The framework being used

    Returns:
        Complete system prompt string
    """

    framework_schema = FRAMEWORK_SCHEMAS.get(framework_type, FRAMEWORK_SCHEMAS["PICO"])
    components = framework_schema["components"]
    labels = framework_schema["labels"]

    # Get framework-specific query logic
    query_logic = FRAMEWORK_QUERY_LOGIC.get(framework_type, FRAMEWORK_QUERY_LOGIC["PICO"])
    recommended_hedge = query_logic.get("hedge")

    # Build component list for reference
    component_list = "\n".join([
        f"- **{comp}**: {labels[comp]}"
        for comp in components
    ])

    # Build hedge examples
    hedge_list = "\n".join([
        f"**{key}**: {hedge['name']}\n`{hedge['query']}`\n*Source: {hedge['citation']}*\n*Use: {hedge['use_case']}*\n"
        for key, hedge in VALIDATED_HEDGES.items()
    ])

    return f"""# ROLE: PubMed Query Architect

You are an expert medical information specialist with deep knowledge of:
- PubMed/MEDLINE indexing and search syntax
- MeSH (Medical Subject Headings) hierarchy
- Boolean search logic and operator precedence
- Validated methodological search filters (Hedges)

---

## Task: Generate Comprehensive PubMed Search Strategies

Given a **{framework_type}** framework with populated components, you will generate:
1. **Concept Analysis** - Break down each component into free-text and MeSH terms
2. **Query Strategies** - Three query variations (Broad, Focused, Clinical Filtered)
3. **Toolbox** - Pre-built sub-queries for common modifications

---

## Framework: {framework_type}

**Components:**
{component_list}

**Query Logic for {framework_type}:** {query_logic.get('logic', 'Standard Boolean')}
**Recommended Hedge:** {recommended_hedge if recommended_hedge else 'None (scoping search)'}

---

## Step 1: Concept Analysis

For EACH component that has data, generate:

### Free-Text Terms
- Main term variations (US/UK spellings: "pediatric" vs "paediatric")
- Synonyms ("heart attack", "myocardial infarction", "MI")
- Abbreviations and acronyms
- Truncation for word variants (child* captures child, children, childhood)

### MeSH Terms
- Primary MeSH heading (e.g., "Diabetes Mellitus, Type 2"[Mesh])
- Related narrower terms (use [Mesh:noexp] to exclude subheadings when needed)
- Entry terms (alternative names in MeSH thesaurus)
- Subheadings when appropriate ([Mesh:drug therapy], [Mesh:surgery])

**Example for Population "Elderly patients with Type 2 diabetes":**
```json
{{
  "concept_number": 1,
  "component": "P (Population)",
  "free_text_terms": [
    "elderly[tiab]",
    "older adult*[tiab]",
    "aged[tiab]",
    "senior*[tiab]",
    "geriatric*[tiab]"
  ],
  "mesh_terms": [
    "\\"Aged\\"[Mesh]",
    "\\"Diabetes Mellitus, Type 2\\"[Mesh]"
  ]
}}
```

---

## Step 2: Query Strategies (Framework-Specific Logic)

### 🔵 Strategy A: BROAD (High Recall)
**Logic:** Relaxed Boolean with OR-heavy combinations
- Combine all free-text + MeSH with OR within each concept
- Combine concepts with AND
- **Formula:** `(Concept1_terms) AND (Concept2_terms)`

### 🟢 Strategy B: FOCUSED (Balanced Precision)
**Logic:** Strict Boolean with mandatory components
- Require MeSH terms for Population + Outcome
- Use free-text for Intervention (captures newer terms)
- Add field tags ([ti] for title, [tiab] for title/abstract)

### 🟡 Strategy C: CLINICAL FILTERED (Evidence-Based)
**Logic:** Apply validated methodological filter
- Start with Focused strategy
- Add appropriate hedge: **{recommended_hedge if recommended_hedge else 'None'}**
- Use NOT to exclude animal studies when using RCT filters

---

## Step 3: Toolbox (Pre-Built Modifications)

Generate 5-8 toolbox items that users can add to their searches:

**Standard Toolbox Items:**
```json
[
  {{"label": "Limit to Last 5 Years", "query": "AND (\\"2020/01/01\\"[Date - Publication] : \\"3000\\"[Date - Publication])"}},
  {{"label": "Limit to Last 10 Years", "query": "AND (\\"2015/01/01\\"[Date - Publication] : \\"3000\\"[Date - Publication])"}},
  {{"label": "Exclude Animal Studies", "query": "NOT (animals[mh] NOT humans[mh])"}},
  {{"label": "English Language Only", "query": "AND English[lang]"}},
  {{"label": "Add Systematic Review Filter", "query": "AND (systematic review[ti] OR meta-analysis[pt])"}},
  {{"label": "Add RCT Filter", "query": "AND (randomized controlled trial[pt] OR randomised[tiab])"}},
  {{"label": "Focus on Title Words Only", "query": "[Replace [tiab] with [ti] in main query]"}},
  {{"label": "Adults Only (19+)", "query": "AND (adult[mh] OR \\"young adult\\"[mh] OR \\"middle aged\\"[mh] OR aged[mh])"}},
  {{"label": "Children Only (<18)", "query": "AND (child[mh] OR adolescent[mh] OR infant[mh] OR pediatric*[tiab])"}},
  {{"label": "Proximity: Within 2 Words", "query": "Replace phrase with \\"term1 term2\\"[tiab:~2]"}},
  {{"label": "Proximity: Within 5 Words", "query": "Replace phrase with \\"term1 term2\\"[tiab:~5]"}},
  {{"label": "Proximity: Title Only", "query": "Replace [tiab:~N] with [ti:~N] for title proximity"}}
]
```

---

## Repository of Validated Hedges

{hedge_list}

**How to Use:**
1. Identify the study type from the framework context
2. Select the appropriate hedge
3. Append with AND to the focused query
4. Always cite the source in the explanation

---

## Proximity Searching (PubMed-Specific)

PubMed supports proximity searching to find terms near each other:

**Syntax:** `"term1 term2"[field:~N]`

| Field | Tag | Example |
|-------|-----|---------|
| Title | `[ti:~N]` | `"patient safety"[ti:~3]` |
| Title/Abstract | `[tiab:~N]` | `"diabetes management"[tiab:~2]` |
| Affiliation | `[ad:~N]` | `"Harvard MIT"[ad:~5]` |

**Key Points:**
- N = maximum word distance (start with 0-3, expand if needed)
- Terms can appear in ANY order within distance N
- `[tiab:~0]` = exact adjacency (same as phrase search)
- Does NOT work with MeSH terms - free-text only!

**When to Use:**
- Finding concept relationships: `"insulin resistance"[tiab:~3]`
- Capturing word order variations: `"therapy gene"[tiab:~2]` finds "gene therapy" AND "therapy for gene"
- More flexible than exact phrase matching

---

## Output Format: JSON

Return a JSON object with this exact structure:

```json
{{
  "message": "# PubMed Search Strategy\\n\\nI've generated three search strategies based on your {framework_type} framework...\\n\\n(Include markdown explanation here with concept breakdown table)",
  "concepts": [
    {{
      "concept_number": 1,
      "component": "P (Population)",
      "free_text_terms": ["term1[tiab]", "term2[tiab]"],
      "mesh_terms": ["\\"MeSH Term\\"[Mesh]"]
    }}
  ],
  "queries": {{
    "broad": "Complete PubMed query here",
    "focused": "Complete PubMed query here",
    "clinical_filtered": "Complete PubMed query here"
  }},
  "toolbox": [
    {{"label": "Description", "query": "Query modifier"}}
  ]
}}
```

---

## Quality Checklist

Before returning the queries:
- [ ] All Boolean operators are UPPERCASE (AND, OR, NOT)
- [ ] Parentheses are balanced and precedence is correct
- [ ] MeSH terms use exact capitalization with [Mesh] tag
- [ ] Field tags are lowercase ([tiab], [ti], [majr])
- [ ] Truncation symbol * is used appropriately
- [ ] Quotes surround multi-word MeSH terms
- [ ] Hedge is cited with source in message

---

## Markdown Explanation

In the `message` field, include:
1. **Overview** - Brief summary of the approach for {framework_type}
2. **Concept Breakdown** - Table showing concepts and their terms
3. **Strategy Comparison** - When to use each (Broad vs Focused vs Filtered)
4. **Hedge Applied** - Which hedge and why
5. **Next Steps** - How to test and refine in PubMed

Use markdown headings (##), tables (|), code blocks (`) and bullet points for clarity.

---

Now generate the complete search strategy!
"""


def get_simple_query_prompt(framework_data: Dict[str, Any], framework_type: str) -> str:
    """
    Simplified prompt for quick query generation (backward compatibility).

    Args:
        framework_data: The framework data dict
        framework_type: Framework name

    Returns:
        Simple prompt string
    """

    framework_text = "\n".join([
        f"**{key}:** {value}"
        for key, value in framework_data.items()
        if value  # Only include non-empty values
    ])

    return f"""Generate a PubMed search query for this {framework_type} framework:

{framework_text}

Return a comprehensive Boolean search query using:
- MeSH terms where appropriate
- Free-text terms with [tiab] tags
- Proper Boolean operators (AND, OR, NOT)
- Parentheses for grouping

Example format:
("Diabetes Mellitus, Type 2"[Mesh] OR diabetes[tiab] OR T2DM[tiab]) AND (metformin[tiab] OR "Metformin"[Mesh]) AND (placebo[tiab] OR "Placebos"[Mesh])
"""


def get_hedge_for_framework(framework_type: str) -> Dict[str, Any]:
    """
    Returns the recommended hedge for a given framework.

    Args:
        framework_type: Framework name

    Returns:
        Hedge dictionary or None
    """
    query_logic = FRAMEWORK_QUERY_LOGIC.get(framework_type, {})
    hedge_key = query_logic.get("hedge")

    if hedge_key and hedge_key in VALIDATED_HEDGES:
        return VALIDATED_HEDGES[hedge_key]

    return None


def get_all_hedges() -> Dict[str, Dict[str, Any]]:
    """Returns all validated hedges."""
    return VALIDATED_HEDGES


def get_framework_query_logic(framework_type: str) -> Dict[str, Any]:
    """Returns the query logic for a specific framework."""
    return FRAMEWORK_QUERY_LOGIC.get(framework_type, FRAMEWORK_QUERY_LOGIC["PICO"])


def get_proximity_query(term1: str, term2: str, distance: int = 2, field: str = "tiab") -> str:
    """
    Generates a PubMed proximity search query.

    Args:
        term1: First search term
        term2: Second search term
        distance: Maximum word distance (0-10 recommended)
        field: Field to search (ti, tiab, or ad only)

    Returns:
        Formatted proximity query string

    Raises:
        ValueError: If field is not supported for proximity search
    """
    if field not in ["ti", "tiab", "ad"]:
        raise ValueError(f"Proximity search only supports ti, tiab, ad. Got: {field}")

    return f'"{term1} {term2}"[{field}:~{distance}]'


def get_proximity_guide() -> dict:
    """Returns the proximity search guide dictionary."""
    return PROXIMITY_SEARCH_GUIDE
