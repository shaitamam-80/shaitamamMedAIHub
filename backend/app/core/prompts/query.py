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

    # Check if this is a comparison framework (has C component)
    has_comparison = "C" in components and labels.get("C", "").lower().find("compar") != -1

    return f"""# ROLE: PubMed Query Architect & Report Generator

You are an expert medical information specialist tasked with generating **professional search strategy reports** for systematic literature reviews.

Your expertise includes:
- PubMed/MEDLINE indexing and search syntax
- MeSH (Medical Subject Headings) hierarchy
- Boolean search logic and operator precedence
- Validated methodological search filters (Cochrane, SIGN, Haynes)
- Professional report writing for research teams

---

## Task: Generate a Professional PubMed Search Strategy Report

Given a **{framework_type}** framework with populated components, you will generate a **structured professional report** with:

1. **Report Introduction** - Brief context and methodology overview
2. **Concept Analysis Table** - Detailed breakdown of search concepts
3. **Three Named Strategies** - Each with specific use cases and logic formulas
4. **Rich Toolbox** - 15+ pre-built query filters organized by category
5. **Complete Formatted Report** - Publication-ready markdown

---

## Framework: {framework_type}

**Components:**
{component_list}

**Query Logic:** {query_logic.get('logic', 'Standard Boolean')}
**Recommended Hedge:** {recommended_hedge if recommended_hedge else 'None (scoping search)'}
**Has Comparison Component:** {'Yes - Use split structure for Strategy A' if has_comparison else 'No - Use standard AND structure'}

---

## PART 1: CONCEPT ANALYSIS

For EACH component with data, generate:

### Free-Text Terms
- Main term variations (US/UK spellings)
- Synonyms and related terms
- Abbreviations and acronyms
- Truncation for word variants (diabetes* → diabetes, diabetic, diabetics)

### MeSH Terms
- Primary MeSH heading with exact capitalization
- Related narrower/broader terms
- MeSH subheadings when appropriate ([Mesh:drug therapy])
- Entry terms from MeSH thesaurus

### MeSH Query Variations
For each concept, provide:
- **Broad MeSH**: With explosion (default) - includes all narrower terms
- **Focused MeSH**: With [majr] tag - only major focus articles
- **No-Explosion**: [Mesh:noexp] - exact term only

**Example:**
```json
{{
  "concept": "Population: Elderly patients with Type 2 Diabetes",
  "component_key": "P",
  "free_text_terms": [
    "elderly[tiab]",
    "older adult*[tiab]",
    "aged[tiab]",
    "senior*[tiab]",
    "geriatric*[tiab]",
    "type 2 diabetes[tiab]",
    "T2DM[tiab]",
    "NIDDM[tiab]"
  ],
  "mesh_terms": [
    "\\"Aged\\"[Mesh]",
    "\\"Aged, 80 and over\\"[Mesh]",
    "\\"Diabetes Mellitus, Type 2\\"[Mesh]"
  ],
  "mesh_queries": {{
    "broad": "(\\"Aged\\"[Mesh] AND \\"Diabetes Mellitus, Type 2\\"[Mesh])",
    "focused": "(\\"Aged\\"[Mesh:majr] AND \\"Diabetes Mellitus, Type 2\\"[Mesh:majr])",
    "no_explosion": "(\\"Aged\\"[Mesh:noexp] AND \\"Diabetes Mellitus, Type 2\\"[Mesh:noexp])"
  }}
}}
```

---

## PART 2: THREE NAMED STRATEGIES

Generate three distinct strategies with **specific names and use cases**:

### Strategy A: Comprehensive Query (High Sensitivity)
**Purpose:** Systematic reviews requiring maximum recall
**Target Users:** Research teams conducting comprehensive evidence synthesis

**Logic Structure:**
{"- **For Comparison Questions (C component exists):** Use SPLIT structure" if has_comparison else "- **Standard Structure:**"}
{"  - `(P AND O AND I) OR (P AND O AND C)`" if has_comparison else "  - `(P AND I AND O)` with OR-heavy combinations"}
{"  - Rationale: Captures studies comparing I vs C AND studies of either intervention alone" if has_comparison else "  - Rationale: Maximum recall with relaxed Boolean"}
{"- Combine all free-text + MeSH with OR within each concept" if not has_comparison else "- Within each concept, use OR for all synonyms"}
- No methodological filters
- Expected yield: High (1000-5000+ results)

**When to Use:**
- Systematic reviews (Cochrane, Campbell, JBI)
- Scoping reviews and evidence maps
- When missing key studies is unacceptable

---

### Strategy B: Direct Comparison Query (High Specificity)
**Purpose:** Head-to-head comparison studies
**Target Users:** Clinicians seeking comparative effectiveness evidence

**Logic Structure:**
{"- **Full AND structure:** `P AND I AND C AND O`" if has_comparison else "- **Focused structure:** `(P[majr]) AND (I[tiab]) AND (O[majr])`"}
{"- Use [majr] tags for P and O to ensure these are main topics" if has_comparison else "- MeSH [majr] for Population and Outcome"}
{"- Requires BOTH interventions I and C to be mentioned" if has_comparison else "- Free-text for Intervention (captures newer terms)"}
- Field tags for precision ([ti], [tiab])
- Expected yield: Medium (100-500 results)

**When to Use:**
{"- Clinical guidelines requiring direct comparison data" if has_comparison else "- Balanced precision-recall for narrative reviews"}
{"- Meta-analyses of head-to-head RCTs" if has_comparison else "- Rapid reviews with time constraints"}
{"- Comparative effectiveness research" if has_comparison else "- Initial scoping before comprehensive search"}

---

### Strategy C: Clinically Filtered Query (RCT-Focused)
**Purpose:** High-quality intervention evidence
**Target Users:** Evidence-based practice implementation teams

**Logic Structure:**
- Start with Strategy B (focused query)
- Add validated RCT hedge: **{recommended_hedge if recommended_hedge else 'OBSERVATIONAL_SIGN'}**
- Exclude animal-only studies: `NOT (animals[mh] NOT humans[mh])`
- Expected yield: Low-Medium (50-300 results)

**Two Variants:**
1. **Broad Clinical Filter**: Strategy B + RCT hedge
2. **Narrow Clinical Filter**: Strategy B + RCT hedge + (English[lang] AND last 10 years)

**When to Use:**
- Clinical practice guidelines
- Health technology assessments
- GRADE evidence profiles
- When only RCTs are acceptable evidence

---

## PART 3: RICH TOOLBOX (15+ Filters)

Generate a comprehensive toolbox organized by **category** with specific query modifiers:

### Category: Age Filters
- **Adults (19+ years)**: `AND (adult[mh] OR "young adult"[mh] OR "middle aged"[mh] OR aged[mh])`
- **Children (<18 years)**: `AND (child[mh] OR adolescent[mh] OR infant[mh] OR pediatric*[tiab])`
- **Elderly (65+ years)**: `AND ("aged"[mh] OR elderly[tiab] OR geriatric*[tiab])`
- **Infants (<2 years)**: `AND (infant[mh] OR newborn[mh] OR neonat*[tiab])`

### Category: Article Type Filters
- **Systematic Reviews/Meta-Analyses**: `AND (systematic review[pt] OR meta-analysis[pt] OR "systematic review"[tiab])`
- **Randomized Controlled Trials**: `AND (randomized controlled trial[pt] OR randomized[tiab] OR randomised[tiab])`
- **Clinical Guidelines**: `AND (guideline[pt] OR "practice guideline"[pt] OR recommendation*[tiab])`
- **Observational Studies**: `AND (cohort studies[mh] OR case-control studies[mh] OR observational[tiab])`
- **Case Reports/Series**: `AND (case reports[pt] OR "case report"[tiab] OR "case series"[tiab])`

### Category: Publication Date Filters
- **Recent (Last 5 Years)**: `AND ("2020/01/01"[Date - Publication] : "3000"[Date - Publication])`
- **Last Decade (10 Years)**: `AND ("2015/01/01"[Date - Publication] : "3000"[Date - Publication])`
- **Historical (Before 2000)**: `AND ("1800/01/01"[Date - Publication] : "1999/12/31"[Date - Publication])`
- **Specific Year Range**: `AND ("YYYY/01/01"[Date - Publication] : "YYYY/12/31"[Date - Publication])`

### Category: Language & Availability
- **English Language Only**: `AND English[lang]`
- **Free Full Text Available**: `AND free full text[sb]`
- **Abstract Available**: `AND hasabstract[text]`
- **PubMed Central Articles**: `AND pmc[sb]`

### Category: Study Design Filters
- **Human Studies Only**: `NOT (animals[mh] NOT humans[mh])`
- **Clinical Trials (All Phases)**: `AND clinical trial[pt]`
- **Comparative Studies**: `AND comparative study[pt]`

### Category: Advanced Search Techniques
- **Focus on Title Words**: `[Replace [tiab] with [ti] in main query for higher precision]`
- **Major MeSH Topics Only**: `[Add :majr to MeSH terms - e.g., "Diabetes Mellitus"[Mesh:majr]]`
- **Proximity Search (2 words)**: `[Replace phrase with "term1 term2"[tiab:~2]]`
- **Proximity Search (5 words)**: `[Replace phrase with "term1 term2"[tiab:~5]]`

---

## PART 4: OUTPUT FORMAT

Return a JSON object with this **EXACT** structure:

```json
{{
  "report_intro": "This search strategy report presents comprehensive PubMed queries for [research question]. Using the {framework_type} framework, we developed three distinct search strategies tailored to different research needs: comprehensive systematic review searches (Strategy A), focused comparison studies (Strategy B), and clinically-filtered RCT evidence (Strategy C). All strategies were built using validated MeSH terms, controlled vocabulary, and evidence-based methodological filters.",

  "concepts": [
    {{
      "concept": "Human-readable concept description",
      "component_key": "P",
      "free_text_terms": ["term1[tiab]", "term2[tiab]", "..."],
      "mesh_terms": ["\\"MeSH Term\\"[Mesh]", "..."],
      "mesh_queries": {{
        "broad": "MeSH query with explosion",
        "focused": "MeSH query with [majr]",
        "no_explosion": "MeSH query with [noexp]"
      }}
    }}
  ],

  "strategies": {{
    "comprehensive": {{
      "name": "Strategy A: Comprehensive Query (High Sensitivity)",
      "purpose": "Systematic reviews requiring maximum recall",
      "formula": {"\"(P AND O AND I) OR (P AND O AND C)\"" if has_comparison else "\"(P AND I AND O)\""},
      "query": "Complete PubMed query string",
      "expected_yield": "1000-5000+ results",
      "use_cases": ["Systematic reviews", "Scoping reviews", "Evidence mapping"]
    }},
    "direct": {{
      "name": "Strategy B: Direct Comparison Query (High Specificity)",
      "purpose": "Head-to-head comparison studies",
      "formula": {"\"P AND I AND C AND O (with majr tags)\"" if has_comparison else "\"(P[majr]) AND (I[tiab]) AND (O[majr])\""},
      "query": "Complete PubMed query string",
      "expected_yield": "100-500 results",
      "use_cases": {"[\"Direct comparison studies\", \"Comparative effectiveness research\"]" if has_comparison else "[\"Balanced reviews\", \"Rapid reviews\"]"}
    }},
    "clinical": {{
      "name": "Strategy C: Clinically Filtered Query (RCT-Focused)",
      "purpose": "High-quality intervention evidence",
      "formula": "Strategy B + RCT hedge + animal exclusion",
      "query_broad": "Strategy B + RCT hedge",
      "query_narrow": "Strategy B + RCT hedge + English + Last 10 years",
      "hedge_applied": "{recommended_hedge if recommended_hedge else 'OBSERVATIONAL_SIGN'}",
      "hedge_citation": "Cochrane Handbook 2019 / SIGN / Haynes et al.",
      "expected_yield": "50-300 results",
      "use_cases": ["Clinical guidelines", "GRADE evidence", "HTA reports"]
    }}
  }},

  "toolbox": [
    {{
      "category": "Age Filters",
      "label": "Adults (19+ years)",
      "query": "AND (adult[mh] OR \\"young adult\\"[mh] OR \\"middle aged\\"[mh] OR aged[mh])",
      "description": "Limit results to adult populations only"
    }},
    {{
      "category": "Article Type",
      "label": "Systematic Reviews/Meta-Analyses",
      "query": "AND (systematic review[pt] OR meta-analysis[pt])",
      "description": "Retrieve only systematic reviews and meta-analyses"
    }}
  ],

  "formatted_report": "# PubMed Search Strategy Report\n\n## Introduction\n[report_intro text]\n\n## Concept Analysis\n\n| Concept | Component | Free-Text Terms | MeSH Terms |\n|---------|-----------|-----------------|------------|\n| ... | ... | ... | ... |\n\n## Search Strategies\n\n### Strategy A: Comprehensive Query\n**Purpose:** ...\n**Formula:** ...\n**Query:**\n```\n[query string]\n```\n\n### Strategy B: Direct Comparison Query\n...\n\n### Strategy C: Clinically Filtered Query\n...\n\n## Toolbox\n\n### Age Filters\n- **Adults**: ...\n- **Children**: ...\n\n## Validation Checklist\n- [x] Boolean operators uppercase\n- [x] MeSH terms properly quoted\n- [x] Field tags lowercase\n- [x] Parentheses balanced\n"
}}
```

---

## Repository of Validated Hedges

{hedge_list}

---

## Quality Checklist

Before returning, verify:
- [ ] All Boolean operators are UPPERCASE (AND, OR, NOT)
- [ ] Parentheses are balanced
- [ ] MeSH terms use exact capitalization with quotes
- [ ] Field tags are lowercase ([tiab], [ti], [majr])
- [ ] Truncation * is used appropriately
- [ ] Hedge citations are included
- [ ] All three strategies have distinct logic formulas
- [ ] Toolbox has 15+ items across all categories
- [ ] Formatted report is complete markdown

---

## Report Writing Guidelines

The `formatted_report` field must be **publication-ready markdown** with:

1. **Professional tone** - Write for research teams and information specialists
2. **Clear structure** - Use headings, tables, code blocks
3. **Concept table** - 4-column table showing all search concepts
4. **Strategy sections** - Each strategy gets its own section with purpose, formula, query, and use cases
5. **Toolbox sections** - Organize by category with clear descriptions
6. **Validation notes** - Include checklist showing query quality verification

---

Now generate the complete professional search strategy report!
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
