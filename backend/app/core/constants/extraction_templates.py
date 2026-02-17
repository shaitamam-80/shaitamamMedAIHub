"""
MedAI Hub - Extraction Templates
==================================

Structured extraction templates for different study designs.
Each template defines fields to extract, organized by section.

Templates:
    A — RCTs / Intervention Studies
    B — Prevalence / Cross-Sectional (CoCoPop)
    C — Cohort / Case-Control (Prognosis/Etiology)
    D — Qualitative Studies

Source: data-extraction/SKILL.md extraction template specifications.
"""

from typing import Dict, List, Any


# ============================================================================
# Field Definition Type
# ============================================================================
# Each field has: key, label, section, required, field_type

FieldDef = Dict[str, Any]
TemplateDef = Dict[str, Any]


# ============================================================================
# Template A: RCTs (Intervention Reviews)
# ============================================================================

TEMPLATE_A: TemplateDef = {
    "id": "template_a",
    "name": "RCT / Intervention Study",
    "name_he": "ניסוי מבוקר אקראי / מחקר התערבות",
    "applies_to": ["rct", "quasi_experimental"],
    "sections": [
        {
            "name": "Administrative",
            "fields": [
                {"key": "study_id", "label": "Study ID", "required": True, "type": "text"},
                {"key": "citation", "label": "Full Citation", "required": True, "type": "text"},
                {"key": "country", "label": "Country", "required": True, "type": "text"},
                {"key": "setting", "label": "Setting", "required": True, "type": "text"},
                {"key": "centers", "label": "Number of Centers", "required": False, "type": "number"},
                {"key": "trial_registration", "label": "Trial Registration ID", "required": False, "type": "text"},
                {"key": "funding", "label": "Funding Source", "required": True, "type": "text"},
                {"key": "coi", "label": "Conflicts of Interest", "required": True, "type": "text"},
            ],
        },
        {
            "name": "Methods",
            "fields": [
                {"key": "design", "label": "Study Design (parallel/crossover/cluster/factorial)", "required": True, "type": "select", "options": ["parallel", "crossover", "cluster", "factorial"]},
                {"key": "randomization_method", "label": "Randomization Method", "required": True, "type": "text"},
                {"key": "allocation_concealment", "label": "Allocation Concealment", "required": True, "type": "text"},
                {"key": "blinding_participants", "label": "Blinding - Participants", "required": True, "type": "select", "options": ["yes", "no", "unclear"]},
                {"key": "blinding_personnel", "label": "Blinding - Personnel", "required": True, "type": "select", "options": ["yes", "no", "unclear"]},
                {"key": "blinding_assessors", "label": "Blinding - Outcome Assessors", "required": True, "type": "select", "options": ["yes", "no", "unclear"]},
                {"key": "itt_analysis", "label": "ITT Analysis", "required": True, "type": "select", "options": ["yes", "no", "unclear"]},
            ],
        },
        {
            "name": "Participants",
            "fields": [
                {"key": "n_randomized_intervention", "label": "N Randomized (Intervention)", "required": True, "type": "number"},
                {"key": "n_randomized_control", "label": "N Randomized (Control)", "required": True, "type": "number"},
                {"key": "n_analyzed_intervention", "label": "N Analyzed (Intervention)", "required": True, "type": "number"},
                {"key": "n_analyzed_control", "label": "N Analyzed (Control)", "required": True, "type": "number"},
                {"key": "age", "label": "Age (mean/SD or median/IQR)", "required": True, "type": "text"},
                {"key": "sex_distribution", "label": "Sex Distribution (%F)", "required": True, "type": "text"},
                {"key": "disease_duration", "label": "Disease Duration", "required": False, "type": "text"},
                {"key": "inclusion_criteria", "label": "Inclusion Criteria", "required": True, "type": "text"},
                {"key": "exclusion_criteria", "label": "Exclusion Criteria", "required": True, "type": "text"},
            ],
        },
        {
            "name": "Intervention",
            "fields": [
                {"key": "intervention_name", "label": "Intervention Name", "required": True, "type": "text"},
                {"key": "intervention_type", "label": "Intervention Type", "required": True, "type": "text"},
                {"key": "dose", "label": "Dose", "required": False, "type": "text"},
                {"key": "frequency", "label": "Frequency", "required": False, "type": "text"},
                {"key": "duration", "label": "Duration", "required": True, "type": "text"},
                {"key": "delivery_method", "label": "Delivery Method", "required": False, "type": "text"},
                {"key": "provider", "label": "Provider", "required": False, "type": "text"},
                {"key": "control_type", "label": "Control Type (placebo/active/usual care/waitlist)", "required": True, "type": "text"},
                {"key": "control_details", "label": "Control Details", "required": True, "type": "text"},
            ],
        },
        {
            "name": "Outcomes",
            "fields": [
                {"key": "primary_outcome_name", "label": "Primary Outcome Name", "required": True, "type": "text"},
                {"key": "primary_outcome_definition", "label": "Primary Outcome Definition", "required": True, "type": "text"},
                {"key": "primary_outcome_tool", "label": "Primary Outcome Measurement Tool", "required": False, "type": "text"},
                {"key": "primary_outcome_timepoint", "label": "Primary Outcome Time Point", "required": True, "type": "text"},
                {"key": "primary_outcome_unit", "label": "Primary Outcome Unit", "required": False, "type": "text"},
                {"key": "secondary_outcomes", "label": "Secondary Outcomes", "required": False, "type": "text"},
            ],
        },
        {
            "name": "Results",
            "fields": [
                {"key": "intervention_result", "label": "Intervention Group (N/mean/SD or events/total)", "required": True, "type": "text"},
                {"key": "control_result", "label": "Control Group (N/mean/SD or events/total)", "required": True, "type": "text"},
                {"key": "effect_estimate", "label": "Effect Estimate (MD/SMD/RR/OR/HR)", "required": True, "type": "text"},
                {"key": "ci", "label": "95% CI", "required": True, "type": "text"},
                {"key": "p_value", "label": "P-value", "required": False, "type": "text"},
                {"key": "adverse_events", "label": "Adverse Events", "required": False, "type": "text"},
            ],
        },
    ],
}


# ============================================================================
# Template B: Prevalence / Cross-Sectional (CoCoPop)
# ============================================================================

TEMPLATE_B: TemplateDef = {
    "id": "template_b",
    "name": "Prevalence / Cross-Sectional Study",
    "name_he": "מחקר שכיחות / מחקר חתך",
    "applies_to": ["cross_sectional"],
    "sections": [
        {
            "name": "Administrative",
            "fields": [
                {"key": "study_id", "label": "Study ID", "required": True, "type": "text"},
                {"key": "citation", "label": "Full Citation", "required": True, "type": "text"},
                {"key": "country", "label": "Country", "required": True, "type": "text"},
                {"key": "region", "label": "Region/Setting", "required": True, "type": "text"},
                {"key": "funding", "label": "Funding Source", "required": False, "type": "text"},
            ],
        },
        {
            "name": "Methods",
            "fields": [
                {"key": "design", "label": "Study Design", "required": True, "type": "text"},
                {"key": "data_collection_period", "label": "Data Collection Period", "required": True, "type": "text"},
                {"key": "sampling_method", "label": "Sampling Method", "required": True, "type": "text"},
            ],
        },
        {
            "name": "Population",
            "fields": [
                {"key": "target_population", "label": "Target Population", "required": True, "type": "text"},
                {"key": "sample_size", "label": "Sample Size", "required": True, "type": "number"},
                {"key": "response_rate", "label": "Response Rate (%)", "required": True, "type": "text"},
                {"key": "age", "label": "Age Distribution", "required": True, "type": "text"},
                {"key": "sex_distribution", "label": "Sex Distribution", "required": True, "type": "text"},
            ],
        },
        {
            "name": "Condition",
            "fields": [
                {"key": "condition_definition", "label": "Condition Definition", "required": True, "type": "text"},
                {"key": "diagnostic_criteria", "label": "Diagnostic Criteria/Tool", "required": True, "type": "text"},
                {"key": "who_diagnosed", "label": "Who Diagnosed", "required": True, "type": "text"},
            ],
        },
        {
            "name": "Results",
            "fields": [
                {"key": "numerator", "label": "Numerator (cases)", "required": True, "type": "number"},
                {"key": "denominator", "label": "Denominator (total)", "required": True, "type": "number"},
                {"key": "prevalence_pct", "label": "Prevalence (%)", "required": True, "type": "text"},
                {"key": "prevalence_ci", "label": "95% CI", "required": True, "type": "text"},
                {"key": "subgroup_prevalence", "label": "Subgroup Prevalence (if reported)", "required": False, "type": "text"},
            ],
        },
    ],
}


# ============================================================================
# Template C: Cohort / Case-Control (Prognosis/Etiology)
# ============================================================================

TEMPLATE_C: TemplateDef = {
    "id": "template_c",
    "name": "Cohort / Case-Control Study",
    "name_he": "מחקר עוקבה / מקרה-ביקורת",
    "applies_to": ["cohort", "case_control"],
    "sections": [
        {
            "name": "Administrative",
            "fields": [
                {"key": "study_id", "label": "Study ID", "required": True, "type": "text"},
                {"key": "citation", "label": "Full Citation", "required": True, "type": "text"},
                {"key": "country", "label": "Country", "required": True, "type": "text"},
                {"key": "setting", "label": "Setting", "required": True, "type": "text"},
                {"key": "funding", "label": "Funding Source", "required": False, "type": "text"},
            ],
        },
        {
            "name": "Methods",
            "fields": [
                {"key": "cohort_type", "label": "Cohort Type (prospective/retrospective)", "required": True, "type": "select", "options": ["prospective", "retrospective"]},
                {"key": "data_source", "label": "Data Source", "required": True, "type": "text"},
                {"key": "enrollment_period", "label": "Enrollment Period", "required": True, "type": "text"},
                {"key": "follow_up_duration", "label": "Follow-up Duration", "required": True, "type": "text"},
            ],
        },
        {
            "name": "Participants",
            "fields": [
                {"key": "n_enrolled_exposed", "label": "N Enrolled (Exposed)", "required": True, "type": "number"},
                {"key": "n_enrolled_unexposed", "label": "N Enrolled (Unexposed)", "required": True, "type": "number"},
                {"key": "n_analyzed_exposed", "label": "N Analyzed (Exposed)", "required": True, "type": "number"},
                {"key": "n_analyzed_unexposed", "label": "N Analyzed (Unexposed)", "required": True, "type": "number"},
                {"key": "lost_to_followup", "label": "Lost to Follow-up (%)", "required": True, "type": "text"},
                {"key": "demographics", "label": "Demographics (age, sex)", "required": True, "type": "text"},
            ],
        },
        {
            "name": "Exposure / Prognostic Factor",
            "fields": [
                {"key": "exposure_name", "label": "Exposure/Prognostic Factor", "required": True, "type": "text"},
                {"key": "exposure_definition", "label": "Exposure Definition", "required": True, "type": "text"},
                {"key": "exposure_measurement", "label": "How Measured", "required": True, "type": "text"},
            ],
        },
        {
            "name": "Outcome",
            "fields": [
                {"key": "outcome_definition", "label": "Outcome Definition", "required": True, "type": "text"},
                {"key": "outcome_ascertainment", "label": "Outcome Ascertainment Method", "required": True, "type": "text"},
            ],
        },
        {
            "name": "Results",
            "fields": [
                {"key": "events_exposed", "label": "Events (Exposed)", "required": True, "type": "number"},
                {"key": "events_unexposed", "label": "Events (Unexposed)", "required": True, "type": "number"},
                {"key": "incidence_rates", "label": "Incidence Rates", "required": False, "type": "text"},
                {"key": "crude_estimate", "label": "Crude Effect Estimate (HR/RR/OR + CI)", "required": True, "type": "text"},
                {"key": "adjusted_estimate", "label": "Adjusted Effect Estimate (HR/RR/OR + CI)", "required": True, "type": "text"},
                {"key": "adjustment_factors", "label": "Adjustment Factors", "required": True, "type": "text"},
                {"key": "adjustment_method", "label": "Adjustment Method", "required": False, "type": "text"},
            ],
        },
    ],
}


# ============================================================================
# Template D: Qualitative Studies
# ============================================================================

TEMPLATE_D: TemplateDef = {
    "id": "template_d",
    "name": "Qualitative Study",
    "name_he": "מחקר איכותני",
    "applies_to": ["qualitative"],
    "sections": [
        {
            "name": "Administrative",
            "fields": [
                {"key": "study_id", "label": "Study ID", "required": True, "type": "text"},
                {"key": "citation", "label": "Full Citation", "required": True, "type": "text"},
                {"key": "country", "label": "Country", "required": True, "type": "text"},
                {"key": "setting", "label": "Setting", "required": True, "type": "text"},
            ],
        },
        {
            "name": "Methods",
            "fields": [
                {"key": "methodology", "label": "Methodology (phenomenology/grounded theory/ethnography/thematic)", "required": True, "type": "text"},
                {"key": "theoretical_framework", "label": "Theoretical Framework", "required": False, "type": "text"},
            ],
        },
        {
            "name": "Participants",
            "fields": [
                {"key": "sample_size", "label": "Sample Size", "required": True, "type": "number"},
                {"key": "sampling_method", "label": "Sampling Method", "required": True, "type": "text"},
                {"key": "participant_characteristics", "label": "Participant Characteristics", "required": True, "type": "text"},
            ],
        },
        {
            "name": "Data Collection",
            "fields": [
                {"key": "collection_method", "label": "Data Collection Method (interviews/focus groups/observation)", "required": True, "type": "text"},
                {"key": "interview_type", "label": "Interview Type", "required": False, "type": "text"},
                {"key": "interview_duration", "label": "Interview Duration", "required": False, "type": "text"},
                {"key": "saturation", "label": "Saturation Addressed", "required": True, "type": "select", "options": ["yes", "no", "unclear"]},
            ],
        },
        {
            "name": "Findings",
            "fields": [
                {"key": "findings", "label": "Key Findings with Participant Quotes", "required": True, "type": "text"},
                {"key": "credibility_level", "label": "Credibility Level (Unequivocal/Credible/Unsupported)", "required": True, "type": "text"},
            ],
        },
        {
            "name": "Ethics & Reflexivity",
            "fields": [
                {"key": "reflexivity", "label": "Reflexivity Statement", "required": False, "type": "text"},
                {"key": "ethics_approval", "label": "Ethics Approval", "required": True, "type": "text"},
            ],
        },
    ],
}


# ============================================================================
# Template Registry
# ============================================================================

TEMPLATES: Dict[str, TemplateDef] = {
    "template_a": TEMPLATE_A,
    "template_b": TEMPLATE_B,
    "template_c": TEMPLATE_C,
    "template_d": TEMPLATE_D,
}


def get_template(template_id: str) -> TemplateDef | None:
    """Get an extraction template by ID."""
    return TEMPLATES.get(template_id)


def get_template_for_design(study_design: str) -> TemplateDef | None:
    """Get the appropriate extraction template for a study design."""
    from app.core.constants.study_designs import DESIGN_TO_TEMPLATE
    template_id = DESIGN_TO_TEMPLATE.get(study_design)
    if template_id:
        return TEMPLATES.get(template_id)
    return None


def get_required_fields(template_id: str) -> List[str]:
    """Get list of required field keys for a template."""
    template = TEMPLATES.get(template_id)
    if not template:
        return []
    fields = []
    for section in template["sections"]:
        for field in section["fields"]:
            if field.get("required"):
                fields.append(field["key"])
    return fields


def get_all_field_keys(template_id: str) -> List[str]:
    """Get list of all field keys for a template."""
    template = TEMPLATES.get(template_id)
    if not template:
        return []
    fields = []
    for section in template["sections"]:
        for field in section["fields"]:
            fields.append(field["key"])
    return fields
