"""
MedAI Hub - Data Extraction Prompts
=====================================

System prompts and statistical conversion utilities for the extraction node.
Distilled from data-extraction/SKILL.md.

What goes to code (deterministic):
    - Study design detection → study_designs.py
    - Template selection → extraction_templates.py
    - Statistical conversions → formulas below
    - Data quality flags → constants below

What stays for LLM (semantic):
    - Data extraction from abstract/fulltext → structured output
    - Outcome measure identification
    - Context-aware field filling
"""

import math
from typing import Dict, Optional, Tuple


# ============================================================================
# Data Quality Flags
# ============================================================================

DATA_QUALITY_FLAGS = {
    "CALCULATED": {"label": "Value calculated, not reported", "action": "Document formula"},
    "IMPUTED": {"label": "Value imputed from other studies", "action": "Document source"},
    "ESTIMATED": {"label": "Value read from graph", "action": "Document method"},
    "UNCLEAR": {"label": "Reported but ambiguous", "action": "Contact authors"},
    "NR": {"label": "Not reported", "action": "Mark as missing"},
    "INCONSISTENT": {"label": "Values don't match across tables/text", "action": "Flag for verification"},
    "ITT!=PP": {"label": "ITT and per-protocol numbers differ", "action": "Extract both"},
}


# ============================================================================
# Statistical Conversion Functions (Deterministic)
# ============================================================================

def se_to_sd(se: float, n: int) -> Tuple[float, str]:
    """Convert Standard Error to Standard Deviation.
    SD = SE × sqrt(N)
    """
    sd = se * math.sqrt(n)
    return round(sd, 4), "SD = SE × √N"


def ci_to_sd(lower: float, upper: float, n: int) -> Tuple[float, str]:
    """Convert 95% CI to Standard Deviation.
    SD = sqrt(N) × (Upper − Lower) / 3.92
    """
    sd = math.sqrt(n) * (upper - lower) / 3.92
    return round(sd, 4), "SD = √N × (Upper − Lower) / 3.92"


def iqr_to_sd(iqr: float) -> Tuple[float, str]:
    """Convert Interquartile Range to Standard Deviation (approximation).
    SD ≈ IQR / 1.35
    """
    sd = iqr / 1.35
    return round(sd, 4), "SD ≈ IQR / 1.35"


def range_to_sd(range_val: float, n: int) -> Tuple[float, str]:
    """Convert Range to Standard Deviation (approximation).
    N < 70: SD ≈ Range / 4
    N ≥ 70: SD ≈ Range / 6
    """
    if n < 70:
        sd = range_val / 4
        formula = "SD ≈ Range / 4 (N < 70)"
    else:
        sd = range_val / 6
        formula = "SD ≈ Range / 6 (N ≥ 70)"
    return round(sd, 4), formula


def median_to_mean_simple(median: float) -> Tuple[float, str]:
    """Approximate Mean from Median (assuming normal distribution).
    Mean ≈ Median
    """
    return median, "Mean ≈ Median (normal distribution)"


def quartiles_to_mean(q1: float, median: float, q3: float) -> Tuple[float, str]:
    """Approximate Mean from Q1, Median, Q3.
    Mean ≈ (Q1 + Median + Q3) / 3
    """
    mean = (q1 + median + q3) / 3
    return round(mean, 4), "Mean ≈ (Q1 + Median + Q3) / 3"


def or_to_rr(odds_ratio: float, baseline_risk: float) -> Tuple[float, str]:
    """Convert Odds Ratio to Relative Risk.
    RR = OR / (1 − P0 + P0 × OR), where P0 = baseline risk
    For rare outcomes (<10%): RR ≈ OR
    """
    if baseline_risk < 0.10:
        return odds_ratio, "RR ≈ OR (rare outcome < 10%)"
    rr = odds_ratio / (1 - baseline_risk + baseline_risk * odds_ratio)
    return round(rr, 4), "RR = OR / (1 − P0 + P0 × OR)"


def log_or_se(a: int, b: int, c: int, d: int) -> Tuple[float, float, str]:
    """Calculate log(OR) and SE(log OR) from 2×2 table cells.
    log(OR) = ln(a*d / b*c)
    SE(log OR) = sqrt(1/a + 1/b + 1/c + 1/d)
    """
    if any(x == 0 for x in [a, b, c, d]):
        # Apply 0.5 continuity correction
        a, b, c, d = a + 0.5, b + 0.5, c + 0.5, d + 0.5

    log_or = math.log((a * d) / (b * c))
    se = math.sqrt(1/a + 1/b + 1/c + 1/d)
    formula = "log(OR) = ln(ad/bc); SE = √(1/a + 1/b + 1/c + 1/d)"
    return round(log_or, 4), round(se, 4), formula


# Conversion registry for programmatic access
STAT_CONVERSIONS = {
    "se_to_sd": {"func": se_to_sd, "have": "SE", "need": "SD", "params": ["se", "n"]},
    "ci_to_sd": {"func": ci_to_sd, "have": "95% CI", "need": "SD", "params": ["lower", "upper", "n"]},
    "iqr_to_sd": {"func": iqr_to_sd, "have": "IQR", "need": "SD", "params": ["iqr"]},
    "range_to_sd": {"func": range_to_sd, "have": "Range", "need": "SD", "params": ["range_val", "n"]},
    "median_to_mean": {"func": median_to_mean_simple, "have": "Median", "need": "Mean", "params": ["median"]},
    "quartiles_to_mean": {"func": quartiles_to_mean, "have": "Q1/Median/Q3", "need": "Mean", "params": ["q1", "median", "q3"]},
    "or_to_rr": {"func": or_to_rr, "have": "OR", "need": "RR", "params": ["odds_ratio", "baseline_risk"]},
}


# ============================================================================
# Common Extraction Pitfalls (for LLM context)
# ============================================================================

EXTRACTION_PITFALLS = [
    "Wrong N: Use analyzed N (not randomized N) that matches reported outcome data",
    "Mixing ITT and Per-Protocol: Consistently extract ITT; note when using PP",
    "Ignoring Clustering: Use adjusted N or extract design effect/ICC for cluster RCTs",
    "SD vs SE Confusion: SE is usually much smaller than SD; check carefully",
    "Change Score vs Final Value: Extract consistently; note which type per study",
    "Multiple Time Points: Extract all pre-specified time points; note primary",
]


# ============================================================================
# LLM System Prompt
# ============================================================================

EXTRACTION_SYSTEM_PROMPT = """You are a **Data Extraction Assistant** for systematic reviews. You help researchers extract structured data from clinical studies following Cochrane and JBI standards.

## CRITICAL RULES
1. **Never interpret or synthesize** — only extract and organize data as reported
2. **Never make clinical conclusions** — only report what the study says
3. **Distinguish reported vs. calculated** — mark any calculated/imputed values with [CALCULATED] flag
4. **Flag uncertainty** — mark unclear or problematic data with [UNCLEAR] or [NR]
5. **Maintain traceability** — cite page/table/figure for every data point when available

## DATA QUALITY FLAGS
- **[CALCULATED]** — Value calculated from other reported data. Document formula used.
- **[IMPUTED]** — Value imputed from other studies. Document source.
- **[ESTIMATED]** — Value read from graph. Document method.
- **[UNCLEAR]** — Reported but ambiguous. May need author contact.
- **[NR]** — Not reported. Mark as missing.
- **[INCONSISTENT]** — Values don't match across tables/text. Flag for verification.
- **[ITT!=PP]** — ITT and per-protocol numbers differ. Extract both.

## EXTRACTION PROCESS

### Step 1: Confirm Study Design & Template
Before extracting, confirm:
- Detected study design (and confidence level)
- Selected extraction template
- Any modifications needed based on the specific study

### Step 2: Extract Section by Section
For each section in the template:
1. Fill in each field from the study text
2. Mark required fields that are missing as [NR]
3. Flag any inconsistencies or ambiguities
4. Provide source reference (table/figure/page) when possible

### Step 3: Statistical Data
For numerical results:
- Extract exactly as reported (don't convert unless asked)
- Note whether values are mean/SD, median/IQR, or events/total
- Identify if effect estimates are crude or adjusted
- If conversions are needed, use the statistical formulas provided and flag as [CALCULATED]

### Step 4: Quality Check
After extraction, verify:
- All required fields have values (or [NR] flags)
- Numbers are internally consistent (N analyzed ≤ N enrolled)
- Effect direction is correct (which group is favored)
- No data quality flags need resolution

## COMMON PITFALLS TO WATCH FOR
- **Wrong N**: Use analyzed N (not randomized N) that matches reported outcome data
- **SD vs SE Confusion**: SE is usually much smaller than SD; check carefully
- **Change Score vs Final Value**: Note which type each study reports
- **Multiple Time Points**: Extract all pre-specified time points; note which is primary

## OUTPUT FORMAT
Present extracted data as a structured form following the template fields.
For each field: `Field Label: value [FLAG if applicable] (source: Table X / p. Y)`

## STAGE COMPLETION
The extraction stage is complete when:
- All included studies have been extracted
- All required fields are filled (or flagged as [NR])
- Quality checks have been performed
- Data is ready for risk-of-bias assessment
"""


def get_extraction_context(
    study_design: str,
    design_confidence: float,
    template_id: str,
    template_name: str,
    framework_type: str = "",
    included_count: int = 0,
    extracted_count: int = 0,
) -> str:
    """Build context section for the extraction prompt."""
    lines = ["\n\n[EXTRACTION CONTEXT]"]

    lines.append(f"Detected study design: {study_design} (confidence: {design_confidence:.0%})")
    lines.append(f"Extraction template: {template_name} ({template_id})")

    if framework_type:
        lines.append(f"Review framework: {framework_type}")

    if included_count:
        lines.append(f"\nStudies to extract: {included_count}")
        lines.append(f"Extracted so far: {extracted_count}")
        remaining = included_count - extracted_count
        if remaining > 0:
            lines.append(f"Remaining: {remaining}")

    # Add available conversions reference
    lines.append("\n[AVAILABLE STATISTICAL CONVERSIONS]")
    lines.append("- SE → SD: SD = SE × √N")
    lines.append("- 95% CI → SD: SD = √N × (Upper − Lower) / 3.92")
    lines.append("- IQR → SD: SD ≈ IQR / 1.35")
    lines.append("- Range → SD: SD ≈ Range / 4 (N<70) or Range / 6 (N≥70)")
    lines.append("- Median → Mean: Mean ≈ Median (normal dist.)")
    lines.append("- Q1/Med/Q3 → Mean: Mean ≈ (Q1 + Med + Q3) / 3")
    lines.append("- OR → RR: RR = OR / (1 − P₀ + P₀ × OR)")

    return "\n".join(lines)
