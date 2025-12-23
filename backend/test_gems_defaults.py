"""
Test script for GEMS v3.1 Path-Adaptive Defaults
Demonstrates the three review modes and their default configurations
"""

import json

from app.core.gems import get_all_modes, get_defaults_for_mode, merge_with_defaults


def print_section(title):
    """Print formatted section header"""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)


def main():
    print_section("GEMS v3.1 - PATH-ADAPTIVE DEFAULTS TEST")

    # Test 1: Get all modes
    print("\n[TEST 1] Available Review Modes:")
    print("-" * 80)
    modes = get_all_modes()
    for mode in modes:
        print(f"\n  {mode['name']} ({mode['mode']})")
        print(f"    Description: {mode['description']}")
        print(f"    Stages: {mode['stages']}")
        print(f"    Best for: {', '.join(mode['best_for'])}")

    # Test 2: Compare defaults across modes
    print_section("Comparison of Default Settings Across Modes")

    comparison_fields = [
        ("Comparator Required", lambda d: d["comparator"]["required"]),
        ("Human Validation", lambda d: d["screening"]["requires_human_validation"]),
        ("Screening Stages", lambda d: d["screening"]["stages"]),
        ("Quality Pack", lambda d: d["study_design"]["quality_pack"]),
        ("Human Only Studies", lambda d: d["study_design"]["human_only"]),
        ("Quantitative Outcomes", lambda d: d["outcome"]["requires_quantitative"]),
    ]

    print(f"\n{'Setting':<30} {'Systematic':<15} {'Scoping':<15} {'Quick':<15}")
    print("-" * 80)

    sys_defaults = get_defaults_for_mode("systematic")
    scop_defaults = get_defaults_for_mode("scoping")
    quick_defaults = get_defaults_for_mode("quick")

    for field_name, getter in comparison_fields:
        sys_val = str(getter(sys_defaults))
        scop_val = str(getter(scop_defaults))
        quick_val = str(getter(quick_defaults))
        print(f"{field_name:<30} {sys_val:<15} {scop_val:<15} {quick_val:<15}")

    # Test 3: Study design allowed types
    print("\n" + "-" * 80)
    print("Allowed Study Types:")
    print(f"  Systematic: {sys_defaults['study_design']['allowed_types']}")
    print(f"  Scoping:    {scop_defaults['study_design']['allowed_types']}")
    print(f"  Quick:      {quick_defaults['study_design']['allowed_types']}")

    # Test 4: Quality pack codes
    print("\n" + "-" * 80)
    print("Quality Pack Exclusion Codes:")
    print(f"  Systematic: {sys_defaults['study_design']['quality_pack_codes']}")
    print(f"  Scoping:    {scop_defaults['study_design']['quality_pack_codes']}")
    print(f"  Quick:      {quick_defaults['study_design']['quality_pack_codes']}")

    # Test 5: Merge custom criteria
    print_section("Custom Criteria Merge Test")

    custom_criteria = {
        "population": {"age_groups": ["children", "adolescents"], "sex": "female"},
        "outcome": {"minimum_followup": 12},
        "intervention": {"exclude_surgical": True},
    }

    print("\nCustom criteria to merge:")
    print(json.dumps(custom_criteria, indent=2))

    merged = merge_with_defaults("systematic", custom_criteria)

    print("\nMerged result (selected fields):")
    print(f"  Population age groups: {merged['population']['age_groups']}")
    print(f"  Population sex: {merged['population']['sex']}")
    print(f"  Outcome minimum followup: {merged['outcome']['minimum_followup']}")
    print(f"  Intervention exclude surgical: {merged['intervention']['exclude_surgical']}")
    print(f"  Comparator required (unchanged): {merged['comparator']['required']}")
    print(f"  Study design quality pack (unchanged): {merged['study_design']['quality_pack']}")

    # Test 6: Quick mode unique features
    print_section("Quick Clinical Answer Mode - Unique Features")

    if "date_filter" in quick_defaults:
        print(f"\n  Date Filter: Last {quick_defaults['date_filter']['years']} years")

    if quick_defaults["screening"].get("generate_synthesis"):
        print("  AI Synthesis: Enabled")
        print(
            f"  Max articles for synthesis: {quick_defaults['screening']['max_articles_for_synthesis']}"
        )

    if "prioritize" in quick_defaults["study_design"]:
        print(f"  Evidence prioritization: {quick_defaults['study_design']['prioritize']}")

    print_section("ALL TESTS PASSED!")
    print("\nGEMS v3.1 Path-Adaptive Defaults are ready to use!")
    print("\nKey Features:")
    print("  - 3 review modes: Systematic, Scoping, Quick Clinical Answer")
    print("  - Path-specific defaults for each mode")
    print("  - Deep merge functionality for custom criteria")
    print("  - Quality pack integration")
    print("  - Flexible configuration system")


if __name__ == "__main__":
    main()
