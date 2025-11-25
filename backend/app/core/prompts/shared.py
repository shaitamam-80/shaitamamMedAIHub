"""
Shared framework utilities and schemas
Used by both Define and Query tools
"""

from typing import Dict, List, Any

# Complete Framework Schema Definitions (12 frameworks)
FRAMEWORK_SCHEMAS = {
    "PICO": {
        "name": "PICO",
        "description": "Population, Intervention, Comparison, Outcome",
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
        "description": "Population, Intervention, Comparison, Outcome, Timeframe",
        "components": ["P", "I", "C", "O", "T"],
        "labels": {
            "P": "Population",
            "I": "Intervention",
            "C": "Comparison",
            "O": "Outcome",
            "T": "Timeframe"
        }
    },
    "CoCoPop": {
        "name": "CoCoPop",
        "description": "Condition, Context, Population",
        "components": ["Condition", "Context", "Population"],
        "labels": {
            "Condition": "Health Condition",
            "Context": "Context/Setting",
            "Population": "Target Population"
        }
    },
    "PEO": {
        "name": "PEO",
        "description": "Population, Exposure, Outcome",
        "components": ["P", "E", "O"],
        "labels": {
            "P": "Population",
            "E": "Exposure",
            "O": "Outcome"
        }
    },
    "PECO": {
        "name": "PECO",
        "description": "Population, Exposure, Comparator, Outcome",
        "components": ["P", "E", "C", "O"],
        "labels": {
            "P": "Population",
            "E": "Exposure",
            "C": "Comparator",
            "O": "Outcome"
        }
    },
    "PFO": {
        "name": "PFO",
        "description": "Population, Factor, Outcome",
        "components": ["P", "F", "O"],
        "labels": {
            "P": "Population",
            "F": "Prognostic Factor",
            "O": "Outcome"
        }
    },
    "PIRD": {
        "name": "PIRD",
        "description": "Population, Index test, Reference test, Diagnosis",
        "components": ["P", "I", "R", "D"],
        "labels": {
            "P": "Population",
            "I": "Index Test",
            "R": "Reference Standard",
            "D": "Target Diagnosis"
        }
    },
    "SPIDER": {
        "name": "SPIDER",
        "description": "Sample, Phenomenon of Interest, Design, Evaluation, Research type",
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
        "description": "Population, Interest, Context (Qualitative)",
        "components": ["P", "I", "Co"],
        "labels": {
            "P": "Population",
            "I": "Phenomena of Interest",
            "Co": "Context"
        }
    },
    "SPICE": {
        "name": "SPICE",
        "description": "Setting, Perspective, Intervention, Comparison, Evaluation",
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
        "description": "Expectation, Client group, Location, Impact, Professionals, Service",
        "components": ["E", "C", "L", "I", "P", "S"],
        "labels": {
            "E": "Expectation",
            "C": "Client Group",
            "L": "Location",
            "I": "Impact",
            "P": "Professionals",
            "S": "Service"
        }
    },
    "PCC": {
        "name": "PCC",
        "description": "Population, Concept, Context (Scoping reviews)",
        "components": ["P", "C", "C2"],
        "labels": {
            "P": "Population",
            "C": "Concept",
            "C2": "Context"
        }
    },
    "BeHEMoTh": {
        "name": "BeHEMoTh",
        "description": "Behavior, Health context, Exclusions, Models/Theories",
        "components": ["Be", "H", "E", "Mo"],
        "labels": {
            "Be": "Behavior of Interest",
            "H": "Health Context",
            "E": "Exclusions",
            "Mo": "Models or Theories"
        }
    },
    "CIMO": {
        "name": "CIMO",
        "description": "Context, Intervention, Mechanism, Outcome",
        "components": ["C", "I", "M", "O"],
        "labels": {
            "C": "Context",
            "I": "Intervention",
            "M": "Mechanism",
            "O": "Outcome"
        }
    }
}


def get_framework_components(framework_type: str) -> List[str]:
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


def get_framework_labels(framework_type: str) -> Dict[str, str]:
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


def format_framework_data(framework_type: str, data: Dict[str, Any]) -> str:
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
