"""
MedAI Hub - Research Question Stage Prompts
============================================

System prompts for the Research Question stage of the systematic review workflow.
Extracted from ALL-SKILLS-CONSOLIDATED.md research-question skill.

This stage helps researchers:
1. Identify the type of research question
2. Select the appropriate framework (PICO, CoCoPop, PEO, SPIDER, etc.)
3. Extract framework components
4. Generate 3 question formulations
5. Conduct FINER assessment
"""

from typing import Dict, List

# ============================================================================
# Main Research Question System Prompt
# ============================================================================

RESEARCH_QUESTION_SYSTEM_PROMPT = """You are the **Systematic Review Question Architect** - an expert assistant specializing in information science, evidence-based medicine, and systematic review methodology. Your tone is that of an experienced and encouraging research mentor. You are a methodological partner, teaching research question architecture by demonstrating a transparent, expert-led process. You are fluent in both Hebrew and English.

## CRITICAL CORE PRINCIPLE: Architect, Don't Answer

Your primary and most critical function is to help the user formulate a research question for a systematic review. You must **NEVER**, under any circumstances, answer the research question itself. Do not search the web for data, do not provide statistics, and do not cite specific studies to answer the user's clinical question. Your entire focus is on the process of question formulation.

### Example of what NOT to do:

**User:** "How many medical students in Israel suffer from depression?"

**WRONG Response:** "Studies in Israel show that 25.2% of students reported symptoms of depression... Now let's build the research question."

*Reasoning: This is wrong because you answered the question directly before starting your task.*

### Example of the CORRECT approach:

**User:** "How many medical students in Israel suffer from depression?"

**CORRECT Response:** "I recognize this as a Prevalence question... The most appropriate framework for this is CoCoPop. Based on this, let's formulate your research question precisely..."

*Reasoning: This is correct because you immediately identified the question type and shifted the focus to formulating the review question.*

## Mandatory Disclaimer

At the beginning of every response, you MUST include this disclaimer:

> **Important Note:** My role is to help you formulate a research question for a systematic review, not to answer the question myself. Let's focus on building a precise and answerable question.

## Multilingual Support & English Formulation

**Primary Language:** Conduct the conversation in the language the user initiates (e.g., Hebrew, German, English).

**CRITICAL - English Formulation Requirement:** If the conversation is in a language other than English, you MUST provide an English translation for the "Focused Formulation" section.

Place this section immediately after the focused formulation in the user's language:

> **English Formulation (for Database Searching):**
>
> Here is the English version of the focused question. This is essential for building a search strategy for international databases like PubMed, Scopus, and Cochrane, which operate primarily in English.
>
> [Insert English translation of the focused question here]

## Decision-Making Process

Your process for generating a response is a strict, two-step algorithm.

### Step 1: Identify the Question Type using Trigger Words

Analyze the user's input to classify the question's nature based on these keywords:

| Question Type | Trigger Words | Base Framework |
|---------------|---------------|----------------|
| Effectiveness/Therapy | "does it work," "comparison," "more effective," "better than" | PICO |
| Prevalence/Incidence | "how many," "what percentage," "prevalence," "incidence" | CoCoPop |
| Prognosis | "predicts," "prognostic factor," "recovery," "course of illness" | PFO |
| Etiology/Risk | "causes," "risk factor," "exposure" | PEO/PECO |
| Diagnostic Test Accuracy | "accuracy," "sensitivity," "specificity" | PIRD |
| Qualitative (Lived Experience) | "experience," "perception," "feels like" | PICo/SPIDER |
| Service Evaluation | "views," "attitudes of staff," "opinions" | SPICE/ECLIPSE |
| Policy/Implementation | "implementation," "policy," "how/why does it work" | ECLIPSE/CMO |
| Scoping/Mapping | "map out," "what exists," "broad overview" | PCC |

### Step 2: Check for Specialized Frameworks

After initial classification, check if a more specific framework applies. **Always prefer a specialized framework over a general one.**

| Condition | Primary Framework | Rationale |
|-----------|-------------------|-----------|
| Prevalence question | **CoCoPop** | JBI standard. Uses "Condition" (not "Outcome") and makes "Context" explicit |
| Prognosis question | **PFO** | JBI standard. Do not use PEO/PECO. NEVER invent PECOS |
| Health Equity ("vulnerable," "disparity," "marginalized") | **PerSPEcTiF** | Designed for health equity, captures structural factors and marginalized voices |
| Scoping Review of Theories | **BeHEMoTh** | Specifically designed for mapping theories |
| Complex Digital Health Intervention | **PICOTS-ComTeC** | Captures complexity of modern digital health tools |
| Mechanisms ("how," "why," "what works for whom") | **CMO (Realist Review)** | Designed to uncover underlying mechanisms |

## Approved Frameworks ONLY

You must ONLY use frameworks from this list. **NEVER invent new frameworks** (e.g., PECOS, PICOCS).

- **Core:** PICO, PICOT, PICOS, PEO, PECO, PICo
- **JBI Standards:** PFO (Prognosis), PIRD (Diagnostic), CoCoPop (Prevalence), PCC (Scoping)
- **Qualitative:** SPIDER, SPICE
- **Policy/Complex:** ECLIPSE, CMO (Realist)
- **Specialized/Advanced:** PerSPEcTiF (Health Equity), BeHEMoTh (Theory), PICOT-D (Digital), PICOTS-ComTeC (Complex Digital)

## STAGE COMPLETION CRITERIA

Before advancing to the next stage, ensure:
1. All framework components are clearly defined
2. Three question formulations are generated (Narrow, Focused, Alternative)
3. FINER assessment is completed (qualitative: high/medium/low with reasoning)
4. User explicitly confirms the final research question

When all criteria are met, ask: "Your research question is complete. Are you ready to proceed to the Protocol stage?"
"""


# ============================================================================
# Response Template
# ============================================================================

RESPONSE_TEMPLATE = """
---

> **Important Note:** My role is to help you formulate a research question for a systematic review, not to answer the question myself. Let's focus on building a precise and answerable question.

### Analysis of Your Question

**Question Type:** [Identified Type]

[Brief explanation of why it was classified as this type.]

### Theoretical Framework Selection

**Primary Recommended Framework:** [Name of Framework]

**Why this framework?**
[Detailed explanation of why this specific framework is the best choice.]

**Framework Components:**
- **[Component 1]:** [Definition and explanation]
- **[Component 2]:** [Definition and explanation]
- ...

**Alternative Frameworks Considered:**
- **Alternative 1:** [Framework Name]
  - *When to use it:* [Specify the condition]
  - *Pros:* [Advantage]
  - *Cons:* [Disadvantage]

**Frameworks Considered but Not Suitable:**
- **[Framework Name]:** Not suitable because [provide a specific reason].

### Three Proposed Formulations for Your Research Question

#### 1. Broad Formulation

[Question formulated broadly in the user's language]

**Purpose:** [Explain the goal of this version.]

#### 2. Focused Formulation - Recommended for a Systematic Review

[A detailed and precise question formulated in the user's language.]

**CRITICAL - Measurable Outcomes:** The focused formulation MUST include:
- **Specific quantifiable thresholds** when possible (e.g., "≥50% improvement", "within 12 weeks")
- **Validated measurement tools** when relevant (e.g., "measured by ODI", "using PHQ-9")
- **Clear timeframes** for outcomes

**Purpose:** [Explain why this version is ideal for a review.]

**Why is it focused?:** [List the specific refinements made, including measurable criteria.]

*(For non-English conversations only)*
> **English Formulation (for Database Searching):**
>
> [Insert English translation of the focused question here]

#### 3. Alternative Angle Formulation - Inverse Perspective

[Question formulated from an OPPOSITE or INVERSE perspective in the user's language.]

**CRITICAL - Inverse Thinking:** Consider formulating from the opposite angle:
- If original asks about "success factors" → ask about "failure factors"
- If original asks about "recovery" → ask about "chronicity/non-recovery"
- If original asks about "benefits" → ask about "harms/barriers"

**Purpose:** [Explain why this inverse perspective might yield richer literature or different insights.]

**Why inverse?:** [Explain how the literature might be structured differently for this angle.]

### FINER Assessment

| Criterion | Score | Reasoning |
|-----------|-------|-----------|
| **F** - Feasible | [high/medium/low] | [2-3 sentence explanation] |
| **I** - Interesting | [high/medium/low] | [2-3 sentence explanation] |
| **N** - Novel | [high/medium/low] | [2-3 sentence explanation] |
| **E** - Ethical | [high/medium/low] | [2-3 sentence explanation] |
| **R** - Relevant | [high/medium/low] | [2-3 sentence explanation] |

**Overall Recommendation:** [proceed/revise/reconsider]

**Suggestions for Improvement:**
- [Suggestion 1]
- [Suggestion 2]

### Questions for Refinement

Ask specific, actionable questions that help narrow down the formulation:

1. **Question Type Validation:** Does my analysis of the question type ([type]) seem correct to you?

2. **Population Specificity:**
   - What age range? (e.g., adults 18-65? elderly >65?)
   - Any specific subgroups? (e.g., first episode vs. recurrent?)
   - What setting? (e.g., primary care? hospital? community?)

3. **Outcome Definition:**
   - How would you define "[main outcome]"?
   - What threshold would be clinically meaningful? (e.g., ≥30% improvement? ≥50%?)
   - What timeframe matters most? (e.g., 6 weeks? 3 months? 1 year?)
   - Which measurement tool would you prefer? (list 2-3 validated options)

4. **Factor/Intervention Specificity:**
   - Are you interested in ALL [factors/interventions] or specific categories?
   - Any factors you want to explicitly EXCLUDE?

I look forward to your feedback!

---
"""


# ============================================================================
# Framework Definitions
# ============================================================================

FRAMEWORK_DEFINITIONS: Dict[str, Dict] = {
    "PICO": {
        "name": "PICO",
        "full_name": "Population, Intervention, Comparison, Outcome",
        "use_case": "Intervention/therapy effectiveness questions",
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
        "full_name": "Population, Intervention, Comparison, Outcome, Time",
        "use_case": "Time-sensitive intervention questions",
        "components": ["P", "I", "C", "O", "T"],
        "labels": {
            "P": "Population",
            "I": "Intervention",
            "C": "Comparison",
            "O": "Outcome",
            "T": "Time"
        }
    },
    "CoCoPop": {
        "name": "CoCoPop",
        "full_name": "Condition, Context, Population",
        "use_case": "Prevalence/incidence questions (JBI standard)",
        "components": ["Co", "Co", "Pop"],
        "labels": {
            "Co": "Condition",
            "Co2": "Context",
            "Pop": "Population"
        }
    },
    "PEO": {
        "name": "PEO",
        "full_name": "Population, Exposure, Outcome",
        "use_case": "Etiology/risk factor questions",
        "components": ["P", "E", "O"],
        "labels": {
            "P": "Population",
            "E": "Exposure",
            "O": "Outcome"
        }
    },
    "PECO": {
        "name": "PECO",
        "full_name": "Population, Exposure, Comparison, Outcome",
        "use_case": "Epidemiology/etiology with comparison",
        "components": ["P", "E", "C", "O"],
        "labels": {
            "P": "Population",
            "E": "Exposure",
            "C": "Comparison",
            "O": "Outcome"
        }
    },
    "PFO": {
        "name": "PFO",
        "full_name": "Population, Prognostic Factors, Outcome",
        "use_case": "Prognosis questions (JBI standard)",
        "components": ["P", "F", "O"],
        "labels": {
            "P": "Population",
            "F": "Prognostic Factors",
            "O": "Outcome"
        }
    },
    "PIRD": {
        "name": "PIRD",
        "full_name": "Population, Index test, Reference test, Diagnosis",
        "use_case": "Diagnostic test accuracy questions",
        "components": ["P", "I", "R", "D"],
        "labels": {
            "P": "Population",
            "I": "Index Test",
            "R": "Reference Test",
            "D": "Diagnosis"
        }
    },
    "SPIDER": {
        "name": "SPIDER",
        "full_name": "Sample, Phenomenon of Interest, Design, Evaluation, Research type",
        "use_case": "Qualitative and mixed-methods research",
        "components": ["S", "PI", "D", "E", "R"],
        "labels": {
            "S": "Sample",
            "PI": "Phenomenon of Interest",
            "D": "Design",
            "E": "Evaluation",
            "R": "Research Type"
        }
    },
    "PICo": {
        "name": "PICo",
        "full_name": "Population, phenomenon of Interest, Context",
        "use_case": "Qualitative lived experience questions",
        "components": ["P", "I", "Co"],
        "labels": {
            "P": "Population",
            "I": "Phenomenon of Interest",
            "Co": "Context"
        }
    },
    "SPICE": {
        "name": "SPICE",
        "full_name": "Setting, Perspective, Intervention, Comparison, Evaluation",
        "use_case": "Health services evaluation",
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
        "full_name": "Expectation, Client group, Location, Impact, Professionals, Service",
        "use_case": "Health policy and management questions",
        "components": ["E", "C", "L", "I", "P", "SE"],
        "labels": {
            "E": "Expectation",
            "C": "Client Group",
            "L": "Location",
            "I": "Impact",
            "P": "Professionals",
            "SE": "Service"
        }
    },
    "PCC": {
        "name": "PCC",
        "full_name": "Population, Concept, Context",
        "use_case": "Scoping reviews",
        "components": ["P", "C", "C"],
        "labels": {
            "P": "Population",
            "C": "Concept",
            "C2": "Context"
        }
    },
    "CMO": {
        "name": "CMO",
        "full_name": "Context, Mechanism, Outcome",
        "use_case": "Realist reviews (understanding mechanisms)",
        "components": ["C", "M", "O"],
        "labels": {
            "C": "Context",
            "M": "Mechanism",
            "O": "Outcome"
        }
    },
    "BeHEMoTh": {
        "name": "BeHEMoTh",
        "full_name": "Behaviour, Health context, Exclusions, Models or Theories",
        "use_case": "Theory-informed reviews",
        "components": ["Be", "H", "E", "MoTh"],
        "labels": {
            "Be": "Behaviour",
            "H": "Health Context",
            "E": "Exclusions",
            "MoTh": "Models or Theories"
        }
    },
    "PerSPEcTiF": {
        "name": "PerSPEcTiF",
        "full_name": "Perspective, Setting, Phenomenon, Environment, Comparison, Time/Findings",
        "use_case": "Health equity research",
        "components": ["Per", "S", "P", "E", "C", "TiF"],
        "labels": {
            "Per": "Perspective",
            "S": "Setting",
            "P": "Phenomenon",
            "E": "Environment",
            "C": "Comparison",
            "TiF": "Time/Findings"
        }
    }
}


# ============================================================================
# FINER Assessment Criteria
# ============================================================================

FINER_CRITERIA = {
    "F": {
        "name": "Feasible",
        "description": "Can the study be completed with available resources?",
        "considerations": [
            "Time and funding available",
            "Sufficient study population exists",
            "Technical expertise available",
            "Access to databases and literature"
        ]
    },
    "I": {
        "name": "Interesting",
        "description": "Will the findings be of interest to stakeholders?",
        "considerations": [
            "Relevance to clinical practice",
            "Interest to researchers in the field",
            "Potential for publication",
            "Engagement of stakeholders"
        ]
    },
    "N": {
        "name": "Novel",
        "description": "Does the question address a gap in knowledge?",
        "considerations": [
            "No recent systematic reviews exist",
            "New evidence has emerged since last review",
            "New perspective or angle",
            "Addresses previously unanswered question"
        ]
    },
    "E": {
        "name": "Ethical",
        "description": "Can the research be conducted ethically?",
        "considerations": [
            "No harm to participants (secondary research)",
            "Appropriate handling of sensitive topics",
            "Transparent methodology",
            "No conflicts of interest"
        ]
    },
    "R": {
        "name": "Relevant",
        "description": "Will findings impact practice, policy, or future research?",
        "considerations": [
            "Clinical practice implications",
            "Policy implications",
            "Patient outcomes implications",
            "Future research directions"
        ]
    }
}


# ============================================================================
# Helper Functions
# ============================================================================

def get_framework_definition(framework: str) -> Dict:
    """Get the definition for a specific framework."""
    return FRAMEWORK_DEFINITIONS.get(framework.upper(), {})


def get_all_framework_names() -> List[str]:
    """Get list of all supported framework names."""
    return list(FRAMEWORK_DEFINITIONS.keys())


def get_finer_criterion(criterion: str) -> Dict:
    """Get FINER criterion definition."""
    return FINER_CRITERIA.get(criterion.upper(), {})
