from app.services.ai_service import AIService


class TestHebrewDetection:
    def setup_method(self):
        self.ai_service = AIService()

    def test_detects_hebrew_characters(self):
        """Test that Hebrew characters are detected"""
        hebrew_text = "מחקר רפואי"
        assert self.ai_service._contains_hebrew(hebrew_text)

    def test_english_only_no_hebrew(self):
        """Test that English text returns False"""
        english_text = "Medical research"
        assert not self.ai_service._contains_hebrew(english_text)

    def test_mixed_text_detects_hebrew(self):
        """Test that mixed text with Hebrew is detected"""
        mixed_text = "The patient חולה needs treatment"
        assert self.ai_service._contains_hebrew(mixed_text)

    def test_empty_string(self):
        """Test empty string returns False"""
        assert not self.ai_service._contains_hebrew("")

    def test_none_input(self):
        """Test None input is handled"""
        assert not self.ai_service._contains_hebrew(None)
