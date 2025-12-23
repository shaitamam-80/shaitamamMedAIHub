"""
Integration test for Smart Screener AI Layer B
Tests the complete pipeline: Rule Engine -> AI Analysis
"""

import asyncio

import pytest

from app.core.prompts.screening import get_criteria_text_for_prompt, get_screening_prompt
from app.services.ai_service import ai_service


class TestScreeningIntegration:
    """Test AI Layer B integration"""

    @pytest.mark.asyncio
    async def test_analyze_abstract_gems_included(self):
        """Test AI analysis for a study that should be included"""
        # Mock RCT abstract that matches PICO criteria
        abstract = """
        Background: Exercise has shown promise for treating depression in elderly populations.

        Methods: We conducted a randomized controlled trial with 120 adults aged 65 and older
        diagnosed with major depressive disorder. Participants were randomly assigned to either
        a 12-week supervised exercise program (aerobic exercise 3x/week) or standard care.

        Results: The exercise group showed significant improvement in depression symptoms
        measured by HAM-D scores (p<0.001) compared to control group.

        Conclusions: Supervised exercise is an effective intervention for depression in elderly adults.
        """

        title = (
            "Efficacy of Exercise for Depression in Elderly Adults: A Randomized Controlled Trial"
        )

        framework_data = {
            "P": "Elderly adults with depression",
            "I": "Exercise intervention",
            "C": "Standard care",
            "O": "Depression symptoms",
            "framework_type": "PICO",
        }

        criteria_codes = ["P1", "S2", "I1"]  # Adults, RCTs, Intervention mentioned

        result = await ai_service.analyze_abstract_gems(
            abstract_text=abstract,
            title=title,
            framework_data=framework_data,
            criteria_codes=criteria_codes,
            review_type="systematic",
        )

        # Assertions
        assert result["status"] in ["included", "excluded", "unclear"]
        assert len(result["reason"]) > 0
        assert result["study_type"] in [
            "RCT",
            "Cohort",
            "Case-Control",
            "Cross-sectional",
            "Case Report",
            "Review",
            "Meta-analysis",
            "Qualitative",
            "Other",
        ]
        assert 0.0 <= result["confidence"] <= 1.0
        assert isinstance(result["evidence_quote"], str)

        # For this clear RCT matching criteria, we expect "included"
        # But we allow "unclear" too since AI can be conservative
        assert result["status"] in ["included", "unclear"]
        print(f"\n✓ AI Decision: {result['status']}")
        print(f"  Reason: {result['reason']}")
        print(f"  Study Type: {result['study_type']}")
        print(f"  Confidence: {result['confidence']}")
        print(f"  Evidence: {result['evidence_quote'][:100]}...")

    @pytest.mark.asyncio
    async def test_analyze_abstract_gems_excluded(self):
        """Test AI analysis for a study that should be excluded"""
        # Animal study abstract (should be excluded)
        abstract = """
        We investigated the effects of exercise on depression-like behaviors in mice.
        Male C57BL/6 mice were subjected to chronic stress and then assigned to either
        running wheel exercise or sedentary control groups. After 4 weeks, behavioral
        tests showed reduced anxiety-like behavior in the exercise group.
        """

        title = "Exercise reduces depression-like behaviors in chronically stressed mice"

        framework_data = {
            "P": "Elderly adults with depression",
            "I": "Exercise intervention",
            "C": "Standard care",
            "O": "Depression symptoms",
            "framework_type": "PICO",
        }

        criteria_codes = ["P1", "S2", "S-Ex1"]  # Adults, RCTs, Exclude animals

        result = await ai_service.analyze_abstract_gems(
            abstract_text=abstract,
            title=title,
            framework_data=framework_data,
            criteria_codes=criteria_codes,
            review_type="systematic",
        )

        # Should be excluded (animal study)
        assert result["status"] in ["excluded", "unclear"]
        print(f"\n✓ AI Decision: {result['status']}")
        print(f"  Reason: {result['reason']}")

    @pytest.mark.asyncio
    async def test_analyze_abstract_gems_unclear(self):
        """Test AI analysis for an ambiguous study"""
        # Ambiguous abstract (unclear population)
        abstract = """
        This review examines the role of physical activity in mental health.
        Various studies have shown mixed results regarding efficacy.
        """

        title = "Physical activity and mental health: A review"

        framework_data = {
            "P": "Elderly adults with depression",
            "I": "Exercise intervention",
            "C": "Standard care",
            "O": "Depression symptoms",
            "framework_type": "PICO",
        }

        criteria_codes = ["P1", "S2"]

        result = await ai_service.analyze_abstract_gems(
            abstract_text=abstract,
            title=title,
            framework_data=framework_data,
            criteria_codes=criteria_codes,
            review_type="systematic",
        )

        # Should be unclear (insufficient information)
        assert result["status"] == "unclear"
        print(f"\n✓ AI Decision: {result['status']}")
        print(f"  Reason: {result['reason']}")

    def test_get_criteria_text_for_prompt(self):
        """Test criteria code to text conversion"""
        codes = ["P1", "S2", "S-Ex1", "S-Ex2"]
        text = get_criteria_text_for_prompt(codes)

        assert "Adults (18+)" in text
        assert "RCTs Only" in text
        assert "EXCLUDE:" in text
        assert "Animal" in text or "animal" in text
        print(f"\n✓ Criteria Text:\n{text}")

    def test_get_screening_prompt(self):
        """Test prompt generation"""
        abstract = "Test abstract text"
        title = "Test Title"
        framework_data = {"P": "Adults", "I": "Exercise", "O": "Health"}
        criteria_text = "- INCLUDE: Adults (18+)\n- EXCLUDE: Animal studies"

        prompt = get_screening_prompt(
            abstract_text=abstract,
            title=title,
            framework_data=framework_data,
            framework_type="PICO",
            criteria_text=criteria_text,
            review_type="systematic",
        )

        assert "Test abstract text" in prompt
        assert "Test Title" in prompt
        assert "Adults" in prompt
        assert "SYSTEMATIC REVIEW" in prompt
        assert "STRICT" in prompt
        print(f"\n✓ Prompt length: {len(prompt)} chars")

    @pytest.mark.asyncio
    async def test_missing_abstract_fallback(self):
        """Test graceful handling of missing abstract"""
        result = await ai_service.analyze_abstract_gems(
            abstract_text="",
            title="",
            framework_data={},
            criteria_codes=[],
            review_type="systematic",
        )

        assert result["status"] == "unclear"
        assert "Missing" in result["reason"]
        assert result["confidence"] == 0.0
        print(f"\n✓ Missing data handling: {result['reason']}")


# Manual test function for CLI testing
async def manual_test():
    """Manual test for CLI validation"""
    print("\n" + "=" * 70)
    print("SMART SCREENER AI LAYER B - MANUAL INTEGRATION TEST")
    print("=" * 70)

    # Test case: RCT matching PICO criteria
    abstract = """
    This randomized controlled trial evaluated cognitive behavioral therapy
    in 100 adults diagnosed with generalized anxiety disorder. Participants
    were randomly assigned to either 12 weeks of CBT or standard care with
    medication. Results showed significant reduction in GAD-7 scores in the
    CBT group (p<0.001) compared to control.
    """

    title = "CBT for Generalized Anxiety Disorder: An RCT"

    framework_data = {
        "P": "Adults with generalized anxiety disorder",
        "I": "Cognitive behavioral therapy",
        "C": "Standard care",
        "O": "Anxiety symptoms",
        "framework_type": "PICO",
    }

    criteria_codes = ["P1", "S2", "I1", "I2"]

    print("\nFramework Context:")
    for key, value in framework_data.items():
        print(f"  {key}: {value}")

    print("\nCriteria Codes:", criteria_codes)

    print("\nRunning AI Analysis...")
    result = await ai_service.analyze_abstract_gems(
        abstract_text=abstract,
        title=title,
        framework_data=framework_data,
        criteria_codes=criteria_codes,
        review_type="systematic",
    )

    print("\n" + "-" * 70)
    print("AI DECISION:")
    print("-" * 70)
    print(f"Status:      {result['status'].upper()}")
    print(f"Study Type:  {result['study_type']}")
    print(f"Confidence:  {result['confidence']:.2f}")
    print(f"Reason:      {result['reason']}")
    print(f"Evidence:    {result['evidence_quote'][:150]}...")
    print("=" * 70)


if __name__ == "__main__":
    # Run manual test
    asyncio.run(manual_test())
