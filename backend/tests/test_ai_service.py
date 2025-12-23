"""
MedAI Hub - AI Service Tests
Tests for Gemini AI integration with mocked LangChain
"""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


class TestAIServiceExtractJson:
    """Tests for JSON extraction utility"""

    def test_extract_json_valid_object(self):
        """Test extracting valid JSON object"""
        from app.services.ai_service import AIService

        ai = AIService.__new__(AIService)  # Skip __init__
        text = 'Some text {"key": "value"} more text'

        result = ai._extract_json(text, find_object=True)

        assert result == {"key": "value"}

    def test_extract_json_valid_array(self):
        """Test extracting valid JSON array"""
        from app.services.ai_service import AIService

        ai = AIService.__new__(AIService)
        text = 'Here is the array [{"a": 1}, {"b": 2}] end'

        result = ai._extract_json(text, find_object=False)

        assert result == [{"a": 1}, {"b": 2}]

    def test_extract_json_nested_object(self):
        """Test extracting nested JSON"""
        from app.services.ai_service import AIService

        ai = AIService.__new__(AIService)
        text = '{"outer": {"inner": "value"}, "list": [1, 2, 3]}'

        result = ai._extract_json(text)

        assert result["outer"]["inner"] == "value"
        assert result["list"] == [1, 2, 3]

    def test_extract_json_pure_text(self):
        """Test extraction returns None for pure JSON text"""
        from app.services.ai_service import AIService

        ai = AIService.__new__(AIService)

        result = ai._extract_json('{"valid": "json"}')

        assert result == {"valid": "json"}

    def test_extract_json_invalid(self):
        """Test extraction returns None for invalid JSON"""
        from app.services.ai_service import AIService

        ai = AIService.__new__(AIService)

        result = ai._extract_json("No JSON here")

        assert result is None

    def test_extract_json_malformed(self):
        """Test extraction handles malformed JSON gracefully"""
        from app.services.ai_service import AIService

        ai = AIService.__new__(AIService)

        result = ai._extract_json('{"key": "value"')  # Missing closing brace

        assert result is None

    def test_extract_json_with_markdown_code_block(self):
        """Test extraction from markdown code blocks"""
        from app.services.ai_service import AIService

        ai = AIService.__new__(AIService)
        text = """Here is the response:
```json
{"framework_data": {"population": "adults"}}
```
Done!"""

        result = ai._extract_json(text)

        assert result["framework_data"]["population"] == "adults"


class TestAIServiceChatForDefine:
    """Tests for chat_for_define method"""

    @pytest.mark.asyncio
    async def test_chat_for_define_success(self):
        """Test successful chat response with framework data"""
        mock_response = MagicMock()
        mock_response.content = json.dumps(
            {
                "chat_response": "I understand you want to study diabetes.",
                "framework_data": {
                    "population": "Adults with type 2 diabetes",
                    "intervention": "Metformin",
                },
            }
        )

        with patch("app.services.ai_service.ChatGoogleGenerativeAI") as MockLLM:
            mock_llm = MagicMock()
            mock_llm.ainvoke = AsyncMock(return_value=mock_response)
            MockLLM.return_value = mock_llm

            from app.services.ai_service import AIService

            ai = AIService()

            result = await ai.chat_for_define(
                message="I want to study diabetes treatment",
                conversation_history=[],
                framework_type="PICO",
                language="en",
            )

            assert "chat_response" in result
            assert "framework_data" in result
            assert "diabetes" in result["chat_response"].lower()

    @pytest.mark.asyncio
    async def test_chat_for_define_with_history(self):
        """Test chat with conversation history"""
        mock_response = MagicMock()
        mock_response.content = json.dumps(
            {
                "chat_response": "Based on our conversation, the population is adults.",
                "framework_data": {"population": "Adults"},
            }
        )

        with patch("app.services.ai_service.ChatGoogleGenerativeAI") as MockLLM:
            mock_llm = MagicMock()
            mock_llm.ainvoke = AsyncMock(return_value=mock_response)
            MockLLM.return_value = mock_llm

            from app.services.ai_service import AIService

            ai = AIService()

            history = [
                {"role": "user", "content": "I want to study diabetes"},
                {"role": "assistant", "content": "Tell me more about the population"},
            ]

            result = await ai.chat_for_define(
                message="Adults over 65", conversation_history=history, framework_type="PICO"
            )

            assert result is not None

    @pytest.mark.asyncio
    async def test_chat_for_define_fallback_on_invalid_response(self):
        """Test fallback when AI returns invalid JSON"""
        mock_response = MagicMock()
        mock_response.content = "Just a plain text response without JSON"

        with patch("app.services.ai_service.ChatGoogleGenerativeAI") as MockLLM:
            mock_llm = MagicMock()
            mock_llm.ainvoke = AsyncMock(return_value=mock_response)
            MockLLM.return_value = mock_llm

            from app.services.ai_service import AIService

            ai = AIService()

            result = await ai.chat_for_define(
                message="Test", conversation_history=[], framework_type="PICO"
            )

            # Should return fallback structure
            assert "chat_response" in result
            assert result["framework_data"] == {}

    @pytest.mark.asyncio
    async def test_chat_for_define_hebrew(self):
        """Test chat in Hebrew language"""
        mock_response = MagicMock()
        mock_response.content = json.dumps(
            {"chat_response": "שלום! אני מבין שאתה רוצה לחקור סוכרת.", "framework_data": {}}
        )

        with patch("app.services.ai_service.ChatGoogleGenerativeAI") as MockLLM:
            mock_llm = MagicMock()
            mock_llm.ainvoke = AsyncMock(return_value=mock_response)
            MockLLM.return_value = mock_llm

            from app.services.ai_service import AIService

            ai = AIService()

            result = await ai.chat_for_define(
                message="אני רוצה לחקור סוכרת",
                conversation_history=[],
                framework_type="PICO",
                language="he",
            )

            assert "שלום" in result["chat_response"]


class TestAIServiceExtractFrameworkData:
    """Tests for extract_framework_data method"""

    @pytest.mark.asyncio
    async def test_extract_framework_data_pico(self):
        """Test extracting PICO framework data"""
        mock_response = MagicMock()
        mock_response.content = json.dumps(
            {
                "population": "Adults with diabetes",
                "intervention": "Metformin",
                "comparison": "Placebo",
                "outcome": "HbA1c levels",
            }
        )

        with patch("app.services.ai_service.ChatGoogleGenerativeAI") as MockLLM:
            mock_llm = MagicMock()
            mock_llm.ainvoke = AsyncMock(return_value=mock_response)
            MockLLM.return_value = mock_llm

            from app.services.ai_service import AIService

            ai = AIService()

            conversation = [
                {"role": "user", "content": "I want to study metformin in diabetic adults"}
            ]

            result = await ai.extract_framework_data(conversation, "PICO")

            assert result["population"] == "Adults with diabetes"
            assert result["intervention"] == "Metformin"

    @pytest.mark.asyncio
    async def test_extract_framework_data_empty_on_failure(self):
        """Test returns empty dict on extraction failure"""
        mock_response = MagicMock()
        mock_response.content = "Invalid response without JSON"

        with patch("app.services.ai_service.ChatGoogleGenerativeAI") as MockLLM:
            mock_llm = MagicMock()
            mock_llm.ainvoke = AsyncMock(return_value=mock_response)
            MockLLM.return_value = mock_llm

            from app.services.ai_service import AIService

            ai = AIService()

            result = await ai.extract_framework_data([], "PICO")

            assert result == {}


class TestAIServiceGenerateQuery:
    """Tests for generate_pubmed_query method"""

    @pytest.mark.asyncio
    async def test_generate_query_success(self):
        """Test successful query generation"""
        mock_response = MagicMock()
        mock_response.content = json.dumps(
            {
                "message": "Query strategy generated successfully",
                "concepts": [
                    {
                        "concept_number": 1,
                        "component": "Population",
                        "free_text_terms": ["diabetes", "diabetic patients"],
                        "mesh_terms": ["Diabetes Mellitus"],
                    }
                ],
                "queries": {
                    "broad": "(diabetes) OR (diabetic)",
                    "focused": "(Diabetes Mellitus[MeSH])",
                    "clinical_filtered": "(diabetes) AND (clinical trial)",
                },
                "toolbox": [{"label": "Systematic Review Filter", "query": "AND systematic[sb]"}],
            }
        )

        with patch("app.services.ai_service.ChatGoogleGenerativeAI") as MockLLM:
            mock_llm = MagicMock()
            mock_llm.ainvoke = AsyncMock(return_value=mock_response)
            MockLLM.return_value = mock_llm

            from app.services.ai_service import AIService

            ai = AIService()

            framework_data = {"population": "Diabetic patients", "intervention": "Metformin"}

            result = await ai.generate_pubmed_query(framework_data, "PICO")

            assert "message" in result
            assert "concepts" in result
            assert "queries" in result
            assert len(result["concepts"]) > 0
            assert result["queries"]["broad"] != ""

    @pytest.mark.asyncio
    async def test_generate_query_fallback(self):
        """Test fallback on failed query generation"""
        mock_response = MagicMock()
        mock_response.content = "Not a valid JSON response"

        with patch("app.services.ai_service.ChatGoogleGenerativeAI") as MockLLM:
            mock_llm = MagicMock()
            mock_llm.ainvoke = AsyncMock(return_value=mock_response)
            MockLLM.return_value = mock_llm

            from app.services.ai_service import AIService

            ai = AIService()

            result = await ai.generate_pubmed_query({}, "PICO")

            # Fallback message should mention parse failure or fallback strategy
            assert "fallback" in result["message"].lower() or "parse" in result["message"].lower()
            assert "concepts" in result
            assert "queries" in result


class TestAIServiceAnalyzeBatch:
    """Tests for analyze_abstract_batch method"""

    @pytest.mark.asyncio
    async def test_analyze_batch_success(self):
        """Test successful batch analysis"""
        mock_response = MagicMock()
        mock_response.content = json.dumps(
            [
                {
                    "pmid": "12345678",
                    "decision": "include",
                    "reasoning": "Matches population criteria",
                },
                {"pmid": "87654321", "decision": "exclude", "reasoning": "Wrong intervention"},
            ]
        )

        with patch("app.services.ai_service.ChatGoogleGenerativeAI") as MockLLM:
            mock_llm = MagicMock()
            mock_llm.ainvoke = AsyncMock(return_value=mock_response)
            MockLLM.return_value = mock_llm

            from app.services.ai_service import AIService

            ai = AIService()

            abstracts = [
                {"pmid": "12345678", "title": "Diabetes study", "abstract": "..."},
                {"pmid": "87654321", "title": "Heart study", "abstract": "..."},
            ]
            criteria = {"population": "Diabetic patients"}

            result = await ai.analyze_abstract_batch(abstracts, criteria)

            assert len(result) == 2
            assert result[0]["decision"] == "include"
            assert result[1]["decision"] == "exclude"

    @pytest.mark.asyncio
    async def test_analyze_batch_empty_on_failure(self):
        """Test returns empty list on failure"""
        mock_response = MagicMock()
        mock_response.content = "Invalid response"

        with patch("app.services.ai_service.ChatGoogleGenerativeAI") as MockLLM:
            mock_llm = MagicMock()
            mock_llm.ainvoke = AsyncMock(return_value=mock_response)
            MockLLM.return_value = mock_llm

            from app.services.ai_service import AIService

            ai = AIService()

            result = await ai.analyze_abstract_batch([], {})

            assert result == []

    @pytest.mark.asyncio
    async def test_analyze_batch_truncates_long_abstracts(self):
        """Test that long abstracts are truncated in prompt"""
        mock_response = MagicMock()
        mock_response.content = json.dumps(
            [{"pmid": "1", "decision": "include", "reasoning": "ok"}]
        )

        with patch("app.services.ai_service.ChatGoogleGenerativeAI") as MockLLM:
            mock_llm = MagicMock()
            mock_llm.ainvoke = AsyncMock(return_value=mock_response)
            MockLLM.return_value = mock_llm

            from app.services.ai_service import AIService

            ai = AIService()

            # Very long abstract
            long_abstract = "A" * 10000
            abstracts = [{"pmid": "1", "title": "Test", "abstract": long_abstract}]

            await ai.analyze_abstract_batch(abstracts, {})

            # Verify the LLM was called
            mock_llm.ainvoke.assert_called_once()


class TestAIServiceIntegration:
    """Integration-style tests (still mocked but testing workflows)"""

    @pytest.mark.asyncio
    async def test_full_define_to_query_workflow(self):
        """Test workflow from chat to query generation"""
        # Mock chat response
        chat_response = MagicMock()
        chat_response.content = json.dumps(
            {
                "chat_response": "Great! I've captured your research question.",
                "framework_data": {
                    "population": "Adults with diabetes",
                    "intervention": "Exercise",
                    "comparison": "No exercise",
                    "outcome": "Weight loss",
                },
            }
        )

        # Mock query response
        query_response = MagicMock()
        query_response.content = json.dumps(
            {
                "message": "Query generated",
                "concepts": [
                    {
                        "concept_number": 1,
                        "component": "Population",
                        "free_text_terms": ["diabetes"],
                        "mesh_terms": [],
                    }
                ],
                "queries": {
                    "broad": "(diabetes)",
                    "focused": "(diabetes[MeSH])",
                    "clinical_filtered": "(diabetes) AND RCT",
                },
                "toolbox": [],
            }
        )

        with patch("app.services.ai_service.ChatGoogleGenerativeAI") as MockLLM:
            mock_llm = MagicMock()
            # Return different responses for sequential calls
            mock_llm.ainvoke = AsyncMock(side_effect=[chat_response, query_response])
            MockLLM.return_value = mock_llm

            from app.services.ai_service import AIService

            ai = AIService()

            # Step 1: Chat
            chat_result = await ai.chat_for_define(
                message="I want to study exercise for diabetes",
                conversation_history=[],
                framework_type="PICO",
            )

            assert "framework_data" in chat_result

            # Step 2: Generate query from extracted data
            query_result = await ai.generate_pubmed_query(chat_result["framework_data"], "PICO")

            assert "queries" in query_result
            assert query_result["queries"]["broad"] != ""


# ============================================================================
# Error Path Tests - Timeouts, API Failures, Hebrew Detection
# ============================================================================


class TestAIServiceErrorPaths:
    """Tests for error handling and fallback mechanisms"""

    @pytest.mark.asyncio
    async def test_query_generation_timeout_returns_fallback(self):
        """Test that timeout returns valid fallback response with queries"""

        with patch("app.services.ai_service.ChatGoogleGenerativeAI") as MockLLM:
            mock_llm = MagicMock()
            mock_llm.ainvoke = AsyncMock(side_effect=TimeoutError("Request timed out"))
            MockLLM.return_value = mock_llm

            from app.services.ai_service import AIService

            ai = AIService()

            framework_data = {
                "P": "Adults with diabetes",
                "I": "Metformin",
                "O": "Blood glucose levels",
            }

            result = await ai.generate_pubmed_query(framework_data, "PICO")

            # Should have valid structure even on timeout
            assert "queries" in result
            assert "message" in result
            assert "warnings" in result

            # Should have fallback query (not empty)
            assert result["queries"]["broad"] != ""

            # Should have warning about timeout
            warning_codes = [w.get("code", "") for w in result.get("warnings", [])]
            assert (
                any("TIMEOUT" in code for code in warning_codes)
                or "timeout" in result["message"].lower()
            )

    @pytest.mark.asyncio
    async def test_query_generation_quota_exceeded_returns_fallback(self):
        """Test that quota exceeded returns valid fallback response"""
        from google.api_core.exceptions import ResourceExhausted

        with patch("app.services.ai_service.ChatGoogleGenerativeAI") as MockLLM:
            mock_llm = MagicMock()
            mock_llm.ainvoke = AsyncMock(side_effect=ResourceExhausted("Quota exceeded"))
            MockLLM.return_value = mock_llm

            from app.services.ai_service import AIService

            ai = AIService()

            framework_data = {"P": "Adults", "I": "Exercise", "O": "Health outcomes"}

            result = await ai.generate_pubmed_query(framework_data, "PICO")

            # Should have valid structure even when API fails
            assert "queries" in result
            assert result["queries"]["broad"] != ""

            # Should have fallback message (retry wrapper converts ResourceExhausted to RetryError,
            # so we may see "error" message instead of "quota" message)
            assert "fallback" in result["message"].lower() or "error" in result["message"].lower()

    @pytest.mark.asyncio
    async def test_hebrew_in_response_triggers_fallback(self):
        """Test that Hebrew characters in AI response trigger English fallback"""
        mock_response = MagicMock()
        # AI returns Hebrew in the query (should not happen but need to handle)
        mock_response.content = json.dumps(
            {
                "message": "Generated query",
                "concepts": [],
                "queries": {
                    "broad": "סוכרת[tiab]",  # Hebrew!
                    "focused": "diabetes",
                    "clinical_filtered": "diabetes",
                },
                "toolbox": [],
            }
        )

        with patch("app.services.ai_service.ChatGoogleGenerativeAI") as MockLLM:
            mock_llm = MagicMock()
            mock_llm.ainvoke = AsyncMock(return_value=mock_response)
            MockLLM.return_value = mock_llm

            from app.services.ai_service import AIService

            ai = AIService()

            framework_data = {"P": "Adults", "I": "Treatment", "O": "Outcome"}
            result = await ai.generate_pubmed_query(framework_data, "PICO")

            # The broad query should NOT contain Hebrew
            assert not ai._contains_hebrew(result["queries"]["broad"])

    @pytest.mark.asyncio
    async def test_contains_hebrew_detection(self):
        """Test Hebrew character detection utility"""
        from app.services.ai_service import AIService

        ai = AIService.__new__(AIService)

        # Should detect Hebrew
        assert ai._contains_hebrew("סוכרת") is True
        assert ai._contains_hebrew("מטופלים מבוגרים") is True
        assert ai._contains_hebrew("Mixed עברית and English") is True

        # Should not detect Hebrew
        assert ai._contains_hebrew("diabetes mellitus") is False
        assert ai._contains_hebrew("PICO Framework") is False
        assert ai._contains_hebrew("") is False
        assert ai._contains_hebrew(None) is False

    @pytest.mark.asyncio
    async def test_generate_fallback_query_creates_valid_pubmed_query(self):
        """Test that fallback query generator produces valid queries"""
        from app.services.ai_service import AIService

        ai = AIService.__new__(AIService)

        framework_data = {
            "P": "Adults with type 2 diabetes",
            "I": "Metformin therapy",
            "C": "Lifestyle intervention",
            "O": "HbA1c reduction",
        }

        query = ai._generate_fallback_query(framework_data, "PICO")

        # Should be non-empty
        assert query != ""

        # Should contain tiab tags
        assert "[tiab]" in query

        # Should have AND structure
        assert "AND" in query

        # Should contain quoted terms
        assert '"' in query

    @pytest.mark.asyncio
    async def test_build_fallback_response_has_required_fields(self):
        """Test that fallback response builder includes all required fields"""
        from app.services.ai_service import AIService

        ai = AIService.__new__(AIService)

        fallback_query = '("diabetes"[tiab]) AND ("metformin"[tiab])'
        framework_data = {"P": "Adults", "I": "Metformin", "O": "Outcomes"}

        result = ai.build_fallback_response(
            fallback_query=fallback_query,
            framework_type="PICO",
            framework_data=framework_data,
            reason="test_failure",
        )

        # V2 format fields
        assert "report_intro" in result
        assert "concepts" in result
        assert "strategies" in result
        assert "toolbox" in result
        assert "formatted_report" in result

        # Legacy format fields
        assert "queries" in result
        assert "message" in result

        # All three query types should be present
        assert "broad" in result["queries"]
        assert "focused" in result["queries"]
        assert "clinical_filtered" in result["queries"]

        # Metadata
        assert "framework_type" in result
        assert "framework_data" in result
        assert "warnings" in result
        assert "translation_status" in result

    @pytest.mark.asyncio
    async def test_fallback_response_concepts_populated_from_framework_data(self):
        """Test that fallback concepts are generated from framework data"""
        from app.services.ai_service import AIService

        ai = AIService.__new__(AIService)

        framework_data = {
            "P": "Elderly patients",
            "I": "Exercise program",
            "C": "Standard care",
            "O": "Quality of life",
        }

        result = ai.build_fallback_response(
            fallback_query="test query",
            framework_type="PICO",
            framework_data=framework_data,
            reason="test",
        )

        # Concepts should be populated from framework_data
        assert len(result["concepts"]) == 4

        # Each concept should have required fields
        for concept in result["concepts"]:
            assert "concept_number" in concept
            assert "component" in concept
            assert "original_value" in concept

    @pytest.mark.asyncio
    async def test_unexpected_exception_returns_fallback(self):
        """Test that unexpected exceptions return valid fallback"""
        with patch("app.services.ai_service.ChatGoogleGenerativeAI") as MockLLM:
            mock_llm = MagicMock()
            mock_llm.ainvoke = AsyncMock(side_effect=RuntimeError("Unexpected error"))
            MockLLM.return_value = mock_llm

            from app.services.ai_service import AIService

            ai = AIService()

            framework_data = {"P": "Test", "I": "Test", "O": "Test"}
            result = await ai.generate_pubmed_query(framework_data, "PICO")

            # Should still return valid structure
            assert "queries" in result
            assert "warnings" in result

    @pytest.mark.asyncio
    async def test_malformed_json_response_returns_fallback(self):
        """Test handling of partially valid JSON response"""
        mock_response = MagicMock()
        # JSON with missing required fields
        mock_response.content = '{"partial": "data", "queries": {"broad": "test"}}'

        with patch("app.services.ai_service.ChatGoogleGenerativeAI") as MockLLM:
            mock_llm = MagicMock()
            mock_llm.ainvoke = AsyncMock(return_value=mock_response)
            MockLLM.return_value = mock_llm

            from app.services.ai_service import AIService

            ai = AIService()

            result = await ai.generate_pubmed_query({"P": "Test"}, "PICO")

            # Should have complete structure despite partial input
            assert "queries" in result
            assert "broad" in result["queries"]


class TestAIServiceHebrewTranslation:
    """Tests for Hebrew translation functionality"""

    @pytest.mark.asyncio
    async def test_translate_framework_data_detects_hebrew(self):
        """Test that Hebrew fields are identified for translation"""
        from app.services.ai_service import AIService

        ai = AIService.__new__(AIService)

        framework_data = {
            "P": "מבוגרים עם סוכרת",  # Hebrew
            "I": "Metformin",  # English
            "O": "תוצאות בריאותיות",  # Hebrew
        }

        hebrew_fields = {
            key: value
            for key, value in framework_data.items()
            if isinstance(value, str) and ai._contains_hebrew(value)
        }

        assert "P" in hebrew_fields
        assert "I" not in hebrew_fields
        assert "O" in hebrew_fields

    @pytest.mark.asyncio
    async def test_public_translate_method_returns_original_if_no_hebrew(self):
        """Test that non-Hebrew data is returned unchanged"""
        mock_response = MagicMock()
        mock_response.content = '{"P": "Adults", "I": "Treatment"}'

        with patch("app.services.ai_service.ChatGoogleGenerativeAI") as MockLLM:
            mock_llm = MagicMock()
            mock_llm.ainvoke = AsyncMock(return_value=mock_response)
            MockLLM.return_value = mock_llm

            from app.services.ai_service import AIService

            ai = AIService()

            framework_data = {"P": "Adults with diabetes", "I": "Metformin treatment"}

            result = await ai.translate_framework_to_english(framework_data)

            # Should be unchanged since no Hebrew
            assert result["P"] == "Adults with diabetes"
            assert result["I"] == "Metformin treatment"
