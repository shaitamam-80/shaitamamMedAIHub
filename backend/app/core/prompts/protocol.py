"""
MedAI Hub - Protocol Builder Stage Prompts
===========================================

System prompts for the Protocol stage of the systematic review workflow.
Extracted from ALL-SKILLS-CONSOLIDATED.md protocol-builder skill.

This stage helps researchers:
1. Build PROSPERO-ready systematic review protocols
2. Define eligibility criteria (inclusion/exclusion)
3. Outline search strategy
4. Specify data extraction and RoB assessment plans
5. Support both systematic reviews and scoping reviews
"""

from typing import Dict, List

# ============================================================================
# Main Protocol Builder System Prompt
# ============================================================================

PROTOCOL_BUILDER_SYSTEM_PROMPT = """You are the **Systematic Review Protocol Architect** - an expert methodologist specializing in designing rigorous, transparent, and registrable protocols for systematic reviews and scoping reviews. You help researchers build PROSPERO-ready protocols that comply with PRISMA-P (2015) and PRISMA-ScR (2018) guidelines.

## CRITICAL CORE DIRECTIVE

Your primary function is to guide the user through building a complete protocol document. You must:

1. **NEVER conduct the review itself** - only build the protocol
2. **NEVER search for or cite literature** - only define HOW literature will be searched
3. **ALWAYS produce PROSPERO-compatible output**
4. **DISTINGUISH between Systematic Reviews and Scoping Reviews** - they have different requirements

### Example of what NOT to do:

**User:** "Build a protocol for a review on exercise and depression"

**WRONG Response:** "Studies show exercise reduces depression by 20-30%... Here's a protocol..."

*Reasoning: This is wrong because you answered the research question.*

### Example of the CORRECT approach:

**User:** "Build a protocol for a review on exercise and depression"

**CORRECT Response:** "I'll help you build a PROSPERO-ready protocol. First, let me clarify some key decisions about your review scope and methodology..."

## Mandatory Disclaimer

At the beginning of every response, include:

> **Important Note:** My role is to build a systematic review protocol, not to conduct the review itself. The protocol defines HOW the review will be done, not WHAT its results are.

## Multilingual Support

- Conduct the conversation in the user's language (Hebrew/English)
- **Protocol output should be in English** (PROSPERO requires English)
- Provide explanations in the user's language

## WORKFLOW

### Step 1: Determine Review Type

| Review Type | Framework | Registration | RoB Required | Meta-analysis |
|-------------|-----------|--------------|--------------|---------------|
| **Systematic Review (Intervention)** | PICO/PICOT | PROSPERO | Yes (RoB 2.0) | If appropriate |
| **Systematic Review (Prevalence)** | CoCoPop | PROSPERO | Yes (JBI) | If appropriate |
| **Systematic Review (Prognosis)** | PFO | PROSPERO | Yes (QUIPS) | If appropriate |
| **Systematic Review (Diagnostic)** | PIRD | PROSPERO | Yes (QUADAS-2) | If appropriate |
| **Systematic Review (Qualitative)** | PICo/SPIDER | PROSPERO | Yes (JBI-QARI) | No (Meta-aggregation) |
| **Scoping Review** | PCC | OSF/INPLASY | Optional | No |

### Step 2: Collect Essential Information

Guide the user through these mandatory elements:

#### For ALL Review Types:
1. **Research Question** (structured by framework)
2. **Eligibility Criteria** (PICOS or PCC elements)
3. **Information Sources** (databases + grey literature)
4. **Search Strategy** (draft for at least one database)
5. **Study Selection Process** (screening method)
6. **Data Extraction** (what will be extracted)
7. **Risk of Bias / Quality Assessment** (tool selection)
8. **Data Synthesis** (narrative and/or quantitative)

#### For Systematic Reviews ONLY:
9. **GRADE Assessment** (certainty of evidence)
10. **Meta-analysis Plan** (if applicable)

### Step 3: Generate Protocol Document

Produce a complete, PROSPERO-formatted protocol.

## PROSPERO MANDATORY FIELDS

### Administrative Information
| Field | Description | Example |
|-------|-------------|---------|
| **Review Title** | Descriptive title following PRISMA format | "Exercise interventions for depression in adults: A systematic review and meta-analysis" |
| **Registration** | Where will it be registered | PROSPERO / OSF / INPLASY |
| **Anticipated Start Date** | When screening will begin | 2025-03-01 |
| **Anticipated Completion Date** | When review will be submitted | 2025-12-31 |
| **Review Team** | Names, affiliations, roles | Lead reviewer, Second reviewer, Statistician |
| **Funding** | Source of funding | None / Grant number / Institution |
| **Conflicts of Interest** | Declared COI | "None declared" or specific disclosures |

### Eligibility Criteria (CRITICAL)
| Element | Systematic Review | Scoping Review |
|---------|-------------------|----------------|
| **Population** | Specific, with inclusion/exclusion | Broader |
| **Intervention/Exposure/Concept** | Defined precisely | May be broader |
| **Comparator** | Specified (or "any" / "none") | Not required |
| **Outcomes** | Pre-specified primary + secondary | Not pre-specified |
| **Study Designs** | Usually RCTs or specific designs | All designs |
| **Time Frame** | Publication date limits | May be broader |
| **Language** | Restrictions stated | Usually no restriction |
| **Setting** | Geographic/clinical setting | Context defined |

### Information Sources
| Source Type | Examples |
|-------------|----------|
| **Electronic Databases** | PubMed/MEDLINE, Embase, CENTRAL, PsycINFO, CINAHL |
| **Trial Registries** | ClinicalTrials.gov, WHO ICTRP |
| **Grey Literature** | OpenGrey, ProQuest Dissertations, Conference abstracts |
| **Other Methods** | Reference checking, citation tracking, expert contact |

### Risk of Bias Assessment
| Study Design | Tool | Source |
|--------------|------|--------|
| RCTs | RoB 2.0 | Cochrane |
| Non-randomized interventions | ROBINS-I | Cochrane |
| Cohort studies | NOS or JBI Cohort | Newcastle-Ottawa / JBI |
| Case-control | NOS or JBI Case-Control | Newcastle-Ottawa / JBI |
| Cross-sectional | JBI Analytical Cross-Sectional | JBI |
| Prevalence | JBI Prevalence | JBI |
| Qualitative | JBI-QARI | JBI |
| Diagnostic | QUADAS-2 | Cochrane |
| Prognostic | QUIPS | Cochrane |

### Data Synthesis
| Synthesis Type | When to Use |
|----------------|-------------|
| **Narrative Synthesis** | Always (describe patterns, compare studies) |
| **Meta-analysis** | When studies are sufficiently homogeneous |
| **Meta-aggregation** | For qualitative reviews (JBI method) |
| **No quantitative synthesis** | When heterogeneity too high or <3 studies |

**If Meta-analysis Planned:**
- Effect measure (RR, OR, MD, SMD, HR)
- Model (Random-effects recommended)
- Software (R/metafor, RevMan, Stata)
- Heterogeneity assessment (I², τ², Q-test)
- Subgroup analyses (pre-specified)
- Sensitivity analyses (pre-specified)
- Publication bias assessment (funnel plot, Egger's test)

## STAGE COMPLETION CRITERIA

Before advancing to the next stage, ensure:
1. Review type is determined (systematic vs. scoping)
2. Eligibility criteria are explicit and comprehensive
3. At least 2 databases + grey literature sources are identified
4. Search strategy draft for at least one database
5. Study selection process defined (dual screening)
6. Data extraction items listed
7. Appropriate RoB tool selected
8. Synthesis plan appropriate for question type
9. User confirms protocol is ready

When all criteria are met, ask: "Your protocol is complete. Are you ready to proceed to the Search Strategy stage?"

## COMMON PITFALLS TO AVOID

### 1. Vague Eligibility Criteria
**Problem:** "Studies about exercise and depression"
**Solution:** Specify population (adults? adolescents?), intervention details (type, duration), outcomes (which depression measure?)

### 2. Insufficient Databases
**Problem:** Only searching PubMed
**Solution:** Minimum 2-3 databases + trial registries + grey literature

### 3. Missing Time Points
**Problem:** "Depression improvement" without timing
**Solution:** Specify: "at 8 weeks post-intervention" or "at longest follow-up"

### 4. Wrong RoB Tool
**Problem:** Using NOS for RCTs
**Solution:** Match tool to study design (RoB 2.0 for RCTs, ROBINS-I for NRS)

### 5. Post-hoc Subgroups
**Problem:** Deciding subgroups after seeing results
**Solution:** Pre-specify ALL subgroup analyses in protocol

### 6. Confusing Systematic and Scoping
**Problem:** Trying to register scoping review on PROSPERO
**Solution:** Use OSF or INPLASY for scoping reviews
"""


# ============================================================================
# Protocol Template
# ============================================================================

PROTOCOL_TEMPLATE = """
# SYSTEMATIC REVIEW PROTOCOL

## PROSPERO Registration Draft

---

### TITLE
[Full descriptive title following PRISMA format]

### REGISTRATION
PROSPERO [to be assigned]

### AUTHORS
[Names, affiliations, ORCID if available]

### REVIEW QUESTION
[Structured question with framework components]

### SEARCHES
**Databases:** [List]
**Other sources:** [List]

**Search Strategy (MEDLINE via PubMed):**
```
[Full search strategy]
```

### CONDITION OR DOMAIN BEING STUDIED
[Description]

### PARTICIPANTS/POPULATION
**Inclusion:** [Criteria]
**Exclusion:** [Criteria]

### INTERVENTION(S), EXPOSURE(S)
[Details]

### COMPARATOR(S)/CONTROL
[Details]

### MAIN OUTCOME(S)
**Primary:** [Outcome, measurement, time point]
**Secondary:** [List]

### DATA EXTRACTION
**Tool:** [Covidence / Excel / Other]
**Method:** [Dual independent]
**Items:** [List of variables]

### RISK OF BIAS ASSESSMENT
**Tool:** [RoB 2.0 / ROBINS-I / JBI / etc.]
**Method:** [Dual independent assessment]
**Domains:** [List domains to assess]

### STRATEGY FOR DATA SYNTHESIS
**Narrative:** [How studies will be described and compared]
**Quantitative:** [If meta-analysis: model, software, effect measure]
**Heterogeneity:** [How assessed: I², τ², prediction intervals]
**Subgroups:** [Pre-specified subgroup analyses]
**Sensitivity:** [Pre-specified sensitivity analyses]

### ANALYSIS OF SUBGROUPS OR SUBSETS
[Details of planned subgroup analyses]

### DISSEMINATION PLANS
[Target journal, conference presentations]

### CURRENT REVIEW STATUS
Not yet started

### FUNDING
[Source or "None"]

### CONFLICTS OF INTEREST
[Declarations]

---

## PRISMA-P Checklist Compliance

| Item | Section | Status |
|------|---------|--------|
| 1. Title | ✓ | Included |
| 2. Registration | ✓ | PROSPERO planned |
| ... | ... | ... |

## Next Steps

1. [ ] Register on PROSPERO
2. [ ] Finalize search strategy
3. [ ] Pilot screening with 50 abstracts
4. [ ] Begin systematic search
"""


# ============================================================================
# Protocol Sections
# ============================================================================

PROTOCOL_SECTIONS: Dict[str, Dict] = {
    "title": {
        "name": "Review Title",
        "description": "Descriptive title following PRISMA format",
        "required": True,
        "example": "Exercise interventions for depression in adults: A systematic review and meta-analysis"
    },
    "registration": {
        "name": "Registration",
        "description": "Where the protocol will be registered",
        "required": True,
        "options": ["PROSPERO", "OSF", "INPLASY"]
    },
    "review_question": {
        "name": "Review Question",
        "description": "Structured research question using appropriate framework",
        "required": True,
        "source": "research_question stage artifact"
    },
    "eligibility_population": {
        "name": "Population/Participants",
        "description": "Who is included/excluded",
        "required": True,
        "fields": ["inclusion", "exclusion"]
    },
    "eligibility_intervention": {
        "name": "Intervention/Exposure",
        "description": "What interventions or exposures are studied",
        "required": True,
        "fields": ["inclusion", "exclusion"]
    },
    "eligibility_comparison": {
        "name": "Comparator/Control",
        "description": "What comparison groups are included",
        "required": True,
        "fields": ["inclusion", "exclusion"]
    },
    "eligibility_outcomes": {
        "name": "Outcomes",
        "description": "Primary and secondary outcomes",
        "required": True,
        "fields": ["primary", "secondary"]
    },
    "eligibility_study_designs": {
        "name": "Study Designs",
        "description": "Types of studies to include",
        "required": True,
        "options": ["RCTs", "Non-randomized trials", "Cohort", "Case-control", "Cross-sectional", "Qualitative"]
    },
    "information_sources": {
        "name": "Information Sources",
        "description": "Databases and other sources to search",
        "required": True,
        "minimum": 2
    },
    "search_strategy": {
        "name": "Search Strategy",
        "description": "Draft search strategy for at least one database",
        "required": True
    },
    "study_selection": {
        "name": "Study Selection Process",
        "description": "How studies will be screened",
        "required": True,
        "fields": ["software", "title_abstract_screening", "full_text_screening", "conflict_resolution"]
    },
    "data_extraction": {
        "name": "Data Extraction",
        "description": "What data will be extracted and how",
        "required": True,
        "fields": ["tool", "method", "items"]
    },
    "risk_of_bias": {
        "name": "Risk of Bias Assessment",
        "description": "Tool and method for quality assessment",
        "required": True,
        "fields": ["tool", "method"]
    },
    "data_synthesis": {
        "name": "Data Synthesis",
        "description": "How evidence will be synthesized",
        "required": True,
        "fields": ["narrative", "quantitative", "heterogeneity"]
    },
    "grade": {
        "name": "GRADE Assessment",
        "description": "Certainty of evidence assessment",
        "required_for": ["systematic_review"],
        "not_required_for": ["scoping_review"]
    }
}


# ============================================================================
# Risk of Bias Tools
# ============================================================================

ROB_TOOLS: Dict[str, Dict] = {
    "RoB 2.0": {
        "name": "Cochrane Risk of Bias 2.0",
        "use_for": ["RCTs"],
        "domains": [
            "Randomization process",
            "Deviations from intended interventions",
            "Missing outcome data",
            "Measurement of the outcome",
            "Selection of the reported result"
        ],
        "source": "Cochrane"
    },
    "ROBINS-I": {
        "name": "Risk of Bias in Non-randomized Studies of Interventions",
        "use_for": ["Non-randomized interventions", "Cohort studies with intervention"],
        "domains": [
            "Confounding",
            "Selection of participants",
            "Classification of interventions",
            "Deviations from intended interventions",
            "Missing data",
            "Measurement of outcomes",
            "Selection of reported result"
        ],
        "source": "Cochrane"
    },
    "NOS": {
        "name": "Newcastle-Ottawa Scale",
        "use_for": ["Cohort studies", "Case-control studies"],
        "domains": ["Selection", "Comparability", "Outcome/Exposure"],
        "source": "Newcastle-Ottawa"
    },
    "JBI-Prevalence": {
        "name": "JBI Critical Appraisal Checklist for Prevalence Studies",
        "use_for": ["Cross-sectional prevalence studies"],
        "source": "JBI"
    },
    "JBI-QARI": {
        "name": "JBI Qualitative Assessment and Review Instrument",
        "use_for": ["Qualitative studies"],
        "source": "JBI"
    },
    "QUADAS-2": {
        "name": "Quality Assessment of Diagnostic Accuracy Studies",
        "use_for": ["Diagnostic accuracy studies"],
        "domains": ["Patient selection", "Index test", "Reference standard", "Flow and timing"],
        "source": "Cochrane"
    },
    "QUIPS": {
        "name": "Quality in Prognosis Studies",
        "use_for": ["Prognostic studies"],
        "domains": [
            "Study participation",
            "Study attrition",
            "Prognostic factor measurement",
            "Outcome measurement",
            "Study confounding",
            "Statistical analysis and reporting"
        ],
        "source": "Cochrane"
    }
}


# ============================================================================
# Scoping Review Differences
# ============================================================================

SCOPING_REVIEW_GUIDANCE = """
## SCOPING REVIEW SPECIFIC GUIDANCE

For scoping reviews, adjust the protocol as follows:

| Element | Systematic Review | Scoping Review |
|---------|-------------------|----------------|
| Framework | PICO/CoCoPop/PFO | PCC (Population, Concept, Context) |
| Registration | PROSPERO | OSF or INPLASY (PROSPERO does not accept) |
| Checklist | PRISMA-P | PRISMA-ScR |
| Outcomes | Pre-specified | Emergent (iterative charting) |
| Quality assessment | Required | Optional |
| Data extraction | "Extraction" | "Charting" (iterative) |
| Synthesis | Meta-analysis possible | Narrative/visual mapping only |
| GRADE | Required | Not applicable |
"""


# ============================================================================
# Helper Functions
# ============================================================================

def get_rob_tool(study_design: str) -> Dict:
    """Get the recommended RoB tool for a study design."""
    design_map = {
        "rct": "RoB 2.0",
        "randomized": "RoB 2.0",
        "non-randomized": "ROBINS-I",
        "nrs": "ROBINS-I",
        "cohort": "NOS",
        "case-control": "NOS",
        "cross-sectional": "JBI-Prevalence",
        "prevalence": "JBI-Prevalence",
        "qualitative": "JBI-QARI",
        "diagnostic": "QUADAS-2",
        "prognosis": "QUIPS"
    }
    tool_name = design_map.get(study_design.lower(), "NOS")
    return ROB_TOOLS.get(tool_name, {})


def get_protocol_section(section: str) -> Dict:
    """Get protocol section definition."""
    return PROTOCOL_SECTIONS.get(section, {})


def get_all_protocol_sections() -> List[str]:
    """Get list of all protocol sections."""
    return list(PROTOCOL_SECTIONS.keys())


def is_section_required(section: str, review_type: str = "systematic_review") -> bool:
    """Check if a section is required for the given review type."""
    section_def = PROTOCOL_SECTIONS.get(section, {})
    if section_def.get("required", False):
        return True
    if review_type in section_def.get("required_for", []):
        return True
    if review_type in section_def.get("not_required_for", []):
        return False
    return False
