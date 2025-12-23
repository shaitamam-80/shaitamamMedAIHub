"""
Shared framework utilities and schemas
Used by both Define and Query tools

Version: 2025.01
Last Updated: 2025-01-25
"""

from typing import Any

# Framework Version Info
FRAMEWORK_VERSION = "2025.01"
FRAMEWORK_LAST_UPDATED = "2025-01-25"

# Complete Framework Schema Definitions (17+ frameworks)
FRAMEWORK_SCHEMAS = {
    # ============================================
    # CORE PICO FAMILY (Intervention Studies)
    # ============================================
    "PICO": {
        "name": "PICO",
        "description": "Population, Intervention, Comparison, Outcome",
        "use_case": "Intervention effectiveness questions - 'Does X work better than Y?'",
        "components": ["P", "I", "C", "O"],
        "labels": {"P": "Population", "I": "Intervention", "C": "Comparison", "O": "Outcome"},
        "trigger_words": [
            "effectiveness",
            "efficacy",
            "does it work",
            "better than",
            "compared to",
            "treatment",
        ],
    },
    "PICOT": {
        "name": "PICOT",
        "description": "Population, Intervention, Comparison, Outcome, Timeframe",
        "use_case": "Time-sensitive intervention questions - 'Over what period?'",
        "components": ["P", "I", "C", "O", "T"],
        "labels": {
            "P": "Population",
            "I": "Intervention",
            "C": "Comparison",
            "O": "Outcome",
            "T": "Timeframe",
        },
        "trigger_words": ["over time", "duration", "follow-up", "weeks", "months", "years"],
    },
    "PICOS": {
        "name": "PICOS",
        "description": "Population, Intervention, Comparison, Outcome, Study design",
        "use_case": "When study design matters - systematic reviews",
        "components": ["P", "I", "C", "O", "S"],
        "labels": {
            "P": "Population",
            "I": "Intervention",
            "C": "Comparison",
            "O": "Outcome",
            "S": "Study Design",
        },
        "trigger_words": ["RCT only", "systematic review", "meta-analysis", "study type"],
    },
    "PICOC": {
        "name": "PICOC",
        "description": "Population, Intervention, Comparison, Outcome, Context",
        "use_case": "Context-dependent interventions - 'In what setting?'",
        "components": ["P", "I", "C", "O", "Cx"],
        "labels": {
            "P": "Population",
            "I": "Intervention",
            "C": "Comparison",
            "O": "Outcome",
            "Cx": "Context",
        },
        "trigger_words": ["in hospital", "community", "primary care", "setting", "context"],
    },
    "PICOTS": {
        "name": "PICOTS",
        "description": "Population, Intervention, Comparison, Outcome, Timeframe, Setting",
        "use_case": "Comprehensive intervention questions with time and setting",
        "components": ["P", "I", "C", "O", "T", "S"],
        "labels": {
            "P": "Population",
            "I": "Intervention",
            "C": "Comparison",
            "O": "Outcome",
            "T": "Timeframe",
            "S": "Setting",
        },
        "trigger_words": ["comprehensive", "detailed", "all factors"],
    },
    # ============================================
    # JBI STANDARDS (Joanna Briggs Institute)
    # ============================================
    "CoCoPop": {
        "name": "CoCoPop",
        "description": "Condition, Context, Population",
        "use_case": "Prevalence and epidemiology questions - 'How many have X?'",
        "components": ["Condition", "Context", "Population"],
        "labels": {
            "Condition": "Health Condition",
            "Context": "Context/Setting",
            "Population": "Target Population",
        },
        "trigger_words": [
            "prevalence",
            "incidence",
            "how many",
            "percentage",
            "rate of",
            "epidemiology",
        ],
    },
    "PEO": {
        "name": "PEO",
        "description": "Population, Exposure, Outcome",
        "use_case": "Exposure/etiology questions - 'Does X cause Y?'",
        "components": ["P", "E", "O"],
        "labels": {"P": "Population", "E": "Exposure", "O": "Outcome"},
        "trigger_words": [
            "exposure",
            "risk factor",
            "causes",
            "etiology",
            "association",
            "correlation",
        ],
    },
    "PECO": {
        "name": "PECO",
        "description": "Population, Exposure, Comparator, Outcome",
        "use_case": "Comparative exposure questions with control group",
        "components": ["P", "E", "C", "O"],
        "labels": {"P": "Population", "E": "Exposure", "C": "Comparator", "O": "Outcome"},
        "trigger_words": ["exposed vs unexposed", "risk comparison", "case-control"],
    },
    "PFO": {
        "name": "PFO",
        "description": "Population, Factor, Outcome",
        "use_case": "Prognosis questions - 'What predicts outcome Y?'",
        "components": ["P", "F", "O"],
        "labels": {"P": "Population", "F": "Prognostic Factor", "O": "Outcome"},
        "trigger_words": [
            "prognosis",
            "predicts",
            "recovery",
            "survival",
            "disease course",
            "prognostic",
        ],
    },
    "PIRD": {
        "name": "PIRD",
        "description": "Population, Index test, Reference test, Diagnosis",
        "use_case": "Diagnostic accuracy questions - 'How accurate is test X?'",
        "components": ["P", "I", "R", "D"],
        "labels": {
            "P": "Population",
            "I": "Index Test",
            "R": "Reference Standard",
            "D": "Target Diagnosis",
        },
        "trigger_words": [
            "diagnostic",
            "accuracy",
            "sensitivity",
            "specificity",
            "test",
            "screening",
        ],
    },
    "PCC": {
        "name": "PCC",
        "description": "Population, Concept, Context (Scoping reviews)",
        "use_case": "Scoping reviews - 'What is known about X?'",
        "components": ["P", "C", "C2"],
        "labels": {"P": "Population", "C": "Concept", "C2": "Context"},
        "trigger_words": ["scoping", "mapping", "what exists", "what is known", "broad overview"],
    },
    "PICo": {
        "name": "PICo",
        "description": "Population, Interest, Context (Qualitative - JBI)",
        "use_case": "Qualitative questions - 'What is the experience of X?'",
        "components": ["P", "I", "Co"],
        "labels": {"P": "Population", "I": "Phenomena of Interest", "Co": "Context"},
        "trigger_words": ["experience", "perception", "meaning", "lived experience", "qualitative"],
    },
    # ============================================
    # QUALITATIVE FRAMEWORKS
    # ============================================
    "SPIDER": {
        "name": "SPIDER",
        "description": "Sample, Phenomenon of Interest, Design, Evaluation, Research type",
        "use_case": "Mixed-methods and qualitative research questions",
        "components": ["S", "PI", "D", "E", "R"],
        "labels": {
            "S": "Sample",
            "PI": "Phenomenon of Interest",
            "D": "Design",
            "E": "Evaluation",
            "R": "Research Type",
        },
        "trigger_words": [
            "qualitative",
            "mixed methods",
            "interviews",
            "focus groups",
            "phenomenology",
        ],
    },
    "SPICE": {
        "name": "SPICE",
        "description": "Setting, Perspective, Intervention, Comparison, Evaluation",
        "use_case": "Health services evaluation - 'Does this service work?'",
        "components": ["S", "P", "I", "C", "E"],
        "labels": {
            "S": "Setting",
            "P": "Perspective",
            "I": "Intervention",
            "C": "Comparison",
            "E": "Evaluation",
        },
        "trigger_words": ["service evaluation", "program evaluation", "health service", "policy"],
    },
    # ============================================
    # POLICY/COMPLEX INTERVENTIONS
    # ============================================
    "ECLIPSE": {
        "name": "ECLIPSE",
        "description": "Expectation, Client group, Location, Impact, Professionals, Service",
        "use_case": "Health policy and management questions",
        "components": ["E", "C", "L", "I", "P", "S"],
        "labels": {
            "E": "Expectation",
            "C": "Client Group",
            "L": "Location",
            "I": "Impact",
            "P": "Professionals",
            "S": "Service",
        },
        "trigger_words": [
            "policy",
            "management",
            "health service",
            "organization",
            "implementation",
        ],
    },
    "CIMO": {
        "name": "CIMO",
        "description": "Context, Intervention, Mechanism, Outcome",
        "use_case": "Realist reviews - 'What works, for whom, in what circumstances?'",
        "components": ["C", "I", "M", "O"],
        "labels": {"C": "Context", "I": "Intervention", "M": "Mechanism", "O": "Outcome"},
        "trigger_words": [
            "realist",
            "mechanism",
            "how does it work",
            "what works",
            "context-mechanism-outcome",
        ],
    },
    # ============================================
    # SPECIALIZED/ADVANCED FRAMEWORKS
    # ============================================
    "BeHEMoTh": {
        "name": "BeHEMoTh",
        "description": "Behavior, Health context, Exclusions, Models/Theories",
        "use_case": "Theory-based reviews - 'What theories explain X?'",
        "components": ["Be", "H", "E", "Mo"],
        "labels": {
            "Be": "Behavior of Interest",
            "H": "Health Context",
            "E": "Exclusions",
            "Mo": "Models or Theories",
        },
        "trigger_words": ["theory", "model", "framework", "behavior change", "theoretical"],
    },
    "PerSPEcTiF": {
        "name": "PerSPEcTiF",
        "description": "Perspective, Setting, Phenomenon, Environment, Comparison, Time, Findings",
        "use_case": "Health equity questions - 'Are there disparities in X?'",
        "components": ["Per", "S", "P", "E", "c", "Ti", "F"],
        "labels": {
            "Per": "Perspective",
            "S": "Setting",
            "P": "Phenomenon/Problem",
            "E": "Environment",
            "c": "Comparison (optional)",
            "Ti": "Time/Timing",
            "F": "Findings",
        },
        "trigger_words": [
            "equity",
            "disparity",
            "inequality",
            "access",
            "social determinants",
            "underserved",
        ],
    },
    "PICOT-D": {
        "name": "PICOT-D",
        "description": "Population, Intervention, Comparison, Outcome, Time, Digital context",
        "use_case": "Digital health interventions - apps, telemedicine, eHealth",
        "components": ["P", "I", "C", "O", "T", "D"],
        "labels": {
            "P": "Population",
            "I": "Digital Intervention",
            "C": "Comparison",
            "O": "Outcome",
            "T": "Timeframe",
            "D": "Digital Context",
        },
        "trigger_words": [
            "digital",
            "app",
            "telemedicine",
            "eHealth",
            "mHealth",
            "online",
            "virtual",
        ],
    },
    "PICOTS-ComTeC": {
        "name": "PICOTS-ComTeC",
        "description": "PICOTS + Complexity, Technology, Context",
        "use_case": "Complex digital health interventions",
        "components": ["P", "I", "C", "O", "T", "S", "Com", "Te", "Cx"],
        "labels": {
            "P": "Population",
            "I": "Intervention",
            "C": "Comparison",
            "O": "Outcome",
            "T": "Timeframe",
            "S": "Setting",
            "Com": "Complexity",
            "Te": "Technology",
            "Cx": "Context",
        },
        "trigger_words": ["complex intervention", "multi-component", "digital health system"],
    },
}

# Quick Reference Card (Cheat Sheet)
FRAMEWORK_CHEAT_SHEET = """
| Question Type | Trigger Words | Framework | Key Components |
|--------------|---------------|-----------|----------------|
| Effectiveness | "does it work", "better than" | PICO | P-I-C-O |
| Prevalence | "how many", "percentage" | CoCoPop | Co-Co-Pop |
| Risk/Etiology | "causes", "risk factor" | PEO | P-E-O |
| Qualitative | "experience", "perception" | SPIDER/PICo | S-PI-D-E-R |
| Prognosis | "predicts", "recovery" | PFO | P-F-O |
| Diagnostic | "accuracy", "sensitivity" | PIRD | P-I-R-D |
| Scoping | "map out", "what exists" | PCC | P-C-C |
| Policy | "implementation", "service" | ECLIPSE | E-C-L-I-P-SE |
| Theory | "theoretical", "model" | BeHEMoTh | Be-H-E-Mo |
| Digital Health | "app", "telemedicine" | PICOT-D | P-I-C-O-T-D |
| Health Equity | "disparity", "inequality" | PerSPEcTiF | Per-S-P-E-c-Ti-F |
"""

# FINER Assessment Schema - Research Question Quality Evaluation
FINER_ASSESSMENT_SCHEMA = {
    "name": "FINER",
    "description": "Research Question Quality Assessment Framework",
    "use_case": "Evaluate whether a research question is well-formulated and worth pursuing",
    "components": {
        "F": {
            "name": "Feasible",
            "description": "Can this study be realistically conducted?",
            "criteria": [
                "Adequate number of subjects available",
                "Technical expertise and resources available",
                "Affordable in time and money",
                "Manageable in scope",
            ],
        },
        "I": {
            "name": "Interesting",
            "description": "Is this question genuinely interesting to the researcher and field?",
            "criteria": [
                "Researcher is genuinely curious about the answer",
                "Findings would be engaging to the scientific community",
                "Results could influence clinical practice or policy",
            ],
        },
        "N": {
            "name": "Novel",
            "description": "Does this study add something new?",
            "criteria": [
                "Confirms, refutes, or extends previous findings",
                "Provides new methodology or approach",
                "Studies new population or setting",
                "Not duplicating existing well-established evidence",
            ],
        },
        "E": {
            "name": "Ethical",
            "description": "Can this study be conducted ethically?",
            "criteria": [
                "Risks to subjects are acceptable and minimized",
                "Benefits outweigh risks",
                "Informed consent is obtainable",
                "Vulnerable populations are protected",
            ],
        },
        "R": {
            "name": "Relevant",
            "description": "Will the results matter?",
            "criteria": [
                "Results will advance scientific knowledge",
                "Findings could influence clinical practice",
                "Results could guide health policy",
            ],
        },
    },
}

# Cross-Type Questions Guidance
CROSS_TYPE_GUIDANCE = """
When a question spans multiple types (e.g., "prevalence AND effectiveness"):
1. Identify the PRIMARY intent - what is the main goal?
2. Suggest splitting into 2 separate questions for clarity
3. Use combined framework only if truly inseparable
4. Document the hybrid approach if used

Example: "How common is diabetes in elderly, and does metformin help?"
→ Question 1 (CoCoPop): Prevalence of diabetes in elderly
→ Question 2 (PICO): Effectiveness of metformin in elderly diabetics
"""

# User Resistance Handling
USER_RESISTANCE_RESPONSES = {
    "want_pico_anyway": "I understand you're comfortable with PICO. Let me show you how {framework} might capture your question more precisely, but I can also help adapt PICO if you prefer.",
    "too_complex": "Let me simplify. The core question is: {simplified}. We can start there and add detail as needed.",
    "dont_understand_framework": "Think of {framework} like a recipe template. Just as recipes have ingredients and steps, research questions have components like who you're studying and what you're measuring.",
}

# Hebrew-Specific Guidelines
HEBREW_GUIDELINES = {
    "mesh_hebrew": "Use English MeSH terms for searches, but I'll translate concepts for you in Hebrew",
    "israeli_databases": ["IMAJ (Israel Medical Association Journal)", "Harefuah", "INSS"],
    "translation_note": "Always provide an English version for PubMed searches, even when discussing in Hebrew",
    "right_to_left": "Framework components will be displayed in a format suitable for RTL text",
}

# Insufficient Information Responses
INSUFFICIENT_INFO_RESPONSES = {
    "no_population": "אני צריך להבין מי האוכלוסייה שאתה חוקר. האם תוכל לתאר את קבוצת היעד?",
    "no_outcome": "מה התוצאה או התוצר שאתה מעוניין למדוד?",
    "too_vague": "השאלה שלך רחבה. האם אתה מתמקד ב-{option_a} או ב-{option_b}?",
    "mixed_intent": "אני רואה כאן מספר שאלות. בוא נטפל בהן אחת אחת.",
    "no_population_en": "I need to understand WHO you're studying. Can you describe the target population?",
    "no_outcome_en": "What outcome or result are you interested in measuring?",
    "too_vague_en": "Your question is broad. Are you focusing on {option_a} or {option_b}?",
    "mixed_intent_en": "I see multiple questions here. Let's tackle them one at a time.",
}


def get_framework_components(framework_type: str) -> list[str]:
    """
    Returns the list of components for a given framework.

    Args:
        framework_type: Framework name (e.g., "PICO", "CoCoPop")

    Returns:
        List of component keys (e.g., ["P", "I", "C", "O"])
    """
    if framework_type not in FRAMEWORK_SCHEMAS:
        # Default to PICO if unknown
        return FRAMEWORK_SCHEMAS["PICO"]["components"]

    return FRAMEWORK_SCHEMAS[framework_type]["components"]


def get_framework_labels(framework_type: str) -> dict[str, str]:
    """
    Returns the component labels for a given framework.

    Args:
        framework_type: Framework name

    Returns:
        Dict mapping component keys to human-readable labels
    """
    if framework_type not in FRAMEWORK_SCHEMAS:
        return FRAMEWORK_SCHEMAS["PICO"]["labels"]

    return FRAMEWORK_SCHEMAS[framework_type]["labels"]


def get_framework_use_case(framework_type: str) -> str:
    """
    Returns the use case description for a framework.

    Args:
        framework_type: Framework name

    Returns:
        Use case string
    """
    if framework_type not in FRAMEWORK_SCHEMAS:
        return FRAMEWORK_SCHEMAS["PICO"].get("use_case", "")

    return FRAMEWORK_SCHEMAS[framework_type].get("use_case", "")


def get_framework_trigger_words(framework_type: str) -> list[str]:
    """
    Returns trigger words that suggest this framework.

    Args:
        framework_type: Framework name

    Returns:
        List of trigger words
    """
    if framework_type not in FRAMEWORK_SCHEMAS:
        return []

    return FRAMEWORK_SCHEMAS[framework_type].get("trigger_words", [])


def format_framework_data(framework_type: str, data: dict[str, Any]) -> str:
    """
    Formats framework data as a readable string.

    Args:
        framework_type: Framework name
        data: Framework data dictionary

    Returns:
        Formatted string representation
    """
    labels = get_framework_labels(framework_type)
    lines = []

    for key, value in data.items():
        label = labels.get(key, key)
        lines.append(f"**{label}:** {value}")

    return "\n".join(lines)


def suggest_framework_from_text(text: str) -> str:
    """
    Analyzes text and suggests the most appropriate framework.

    Args:
        text: User's research question or description

    Returns:
        Suggested framework name
    """
    text_lower = text.lower()

    # Check each framework's trigger words
    best_match = "PICO"
    best_score = 0

    for framework_name, schema in FRAMEWORK_SCHEMAS.items():
        trigger_words = schema.get("trigger_words", [])
        score = sum(1 for word in trigger_words if word in text_lower)

        if score > best_score:
            best_score = score
            best_match = framework_name

    return best_match


def validate_custom_framework(framework: dict[str, Any]) -> bool:
    """
    Validates a user-defined custom framework.

    Args:
        framework: Custom framework definition

    Returns:
        True if valid, False otherwise
    """
    required_fields = ["name", "components", "use_case", "labels"]
    return all(f in framework for f in required_fields)


def get_all_framework_names() -> list[str]:
    """Returns list of all available framework names."""
    return list(FRAMEWORK_SCHEMAS.keys())


def get_framework_count() -> int:
    """Returns the total number of frameworks."""
    return len(FRAMEWORK_SCHEMAS)
