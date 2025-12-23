"""
MedAI Hub - MEDLINE Parser Tests
Tests for the MEDLINE file parser functionality
"""

from app.services.medline_parser import MedlineAbstract, MedlineParser


class TestMedlineAbstract:
    """Tests for MedlineAbstract class"""

    def test_init_default_values(self):
        """Test MedlineAbstract initializes with correct defaults"""
        abstract = MedlineAbstract()

        assert abstract.pmid is None
        assert abstract.title is None
        assert abstract.abstract is None
        assert abstract.authors is None
        assert abstract.journal is None
        assert abstract.publication_date is None
        assert abstract.keywords == []
        assert abstract.metadata == {}

    def test_to_dict(self):
        """Test conversion to dictionary"""
        abstract = MedlineAbstract()
        abstract.pmid = "12345678"
        abstract.title = "Test Title"
        abstract.abstract = "Test Abstract"
        abstract.authors = "Smith J; Johnson K"
        abstract.journal = "Test Journal"
        abstract.publication_date = "2023 Jan"
        abstract.keywords = ["keyword1", "keyword2"]
        abstract.metadata = {"custom_field": "value"}

        result = abstract.to_dict()

        assert result["pmid"] == "12345678"
        assert result["title"] == "Test Title"
        assert result["abstract"] == "Test Abstract"
        assert result["authors"] == "Smith J; Johnson K"
        assert result["journal"] == "Test Journal"
        assert result["publication_date"] == "2023 Jan"
        assert result["keywords"] == ["keyword1", "keyword2"]
        assert result["metadata"] == {"custom_field": "value"}


class TestMedlineParser:
    """Tests for MedlineParser class"""

    def test_init(self):
        """Test parser initializes empty"""
        parser = MedlineParser()
        assert parser.abstracts == []

    def test_parse_single_entry(self, sample_medline_single_entry):
        """Test parsing a single MEDLINE entry"""
        parser = MedlineParser()
        abstracts = parser.parse_content(sample_medline_single_entry)

        assert len(abstracts) == 1
        assert abstracts[0].pmid == "99999999"
        assert abstracts[0].title == "Simple test article title"
        assert "simple test abstract" in abstracts[0].abstract.lower()
        assert abstracts[0].authors == "Test Author"
        assert abstracts[0].journal == "Test Journal"
        assert abstracts[0].publication_date == "2024 Jan 01"

    def test_parse_multiple_entries(self, sample_medline_content):
        """Test parsing multiple MEDLINE entries"""
        parser = MedlineParser()
        abstracts = parser.parse_content(sample_medline_content)

        assert len(abstracts) == 3
        assert abstracts[0].pmid == "12345678"
        assert abstracts[1].pmid == "87654321"
        assert abstracts[2].pmid == "11223344"

    def test_parse_multiline_abstract(self, sample_medline_content):
        """Test parsing multi-line abstracts with continuation"""
        parser = MedlineParser()
        abstracts = parser.parse_content(sample_medline_content)

        # First abstract has multi-line content
        first_abstract = abstracts[0]
        assert "BACKGROUND:" in first_abstract.abstract
        assert "METHODS:" in first_abstract.abstract
        assert "RESULTS:" in first_abstract.abstract
        assert "CONCLUSION:" in first_abstract.abstract

    def test_parse_multiple_authors(self, sample_medline_content):
        """Test parsing multiple authors"""
        parser = MedlineParser()
        abstracts = parser.parse_content(sample_medline_content)

        # First entry has 3 authors
        first_abstract = abstracts[0]
        assert "Smith J" in first_abstract.authors
        assert "Johnson K" in first_abstract.authors
        assert "Williams R" in first_abstract.authors
        assert first_abstract.authors.count(";") == 2  # 3 authors = 2 semicolons

    def test_parse_keywords_ot_tag(self, sample_medline_content):
        """Test parsing OT (Other Terms) keywords"""
        parser = MedlineParser()
        abstracts = parser.parse_content(sample_medline_content)

        first_abstract = abstracts[0]
        assert "Diabetes" in first_abstract.keywords
        assert "Metformin" in first_abstract.keywords
        assert "Glycemic Control" in first_abstract.keywords

    def test_parse_mesh_terms(self, sample_medline_content):
        """Test parsing MH (MeSH) terms"""
        parser = MedlineParser()
        abstracts = parser.parse_content(sample_medline_content)

        first_abstract = abstracts[0]
        assert "Diabetes Mellitus, Type 2" in first_abstract.keywords
        assert "Metformin/therapeutic use" in first_abstract.keywords

    def test_no_duplicate_keywords(self):
        """Test keywords are not duplicated"""
        content = """PMID- 11111111
TI  - Test Article
OT  - Keyword1
OT  - Keyword1
OT  - Keyword2
"""
        parser = MedlineParser()
        abstracts = parser.parse_content(content)

        # Should only have 2 unique keywords
        assert len(abstracts[0].keywords) == 2

    def test_empty_content(self):
        """Test parsing empty content"""
        parser = MedlineParser()
        abstracts = parser.parse_content("")

        assert abstracts == []

    def test_invalid_content_no_pmid(self):
        """Test parsing content without valid PMID"""
        content = """TI  - Title without PMID
AB  - This entry has no PMID and should be skipped
"""
        parser = MedlineParser()
        abstracts = parser.parse_content(content)

        assert abstracts == []

    def test_whitespace_handling(self):
        """Test handling of whitespace in content"""
        content = """PMID- 12345678
TI  -   Title with extra spaces
AB  -   Abstract with spaces
"""
        parser = MedlineParser()
        abstracts = parser.parse_content(content)

        assert len(abstracts) == 1
        # Values should be stripped
        assert abstracts[0].title == "Title with extra spaces"
        assert abstracts[0].abstract == "Abstract with spaces"

    def test_unknown_tags_stored_in_metadata(self):
        """Test that unknown tags are stored in metadata"""
        content = """PMID- 12345678
TI  - Test Title
XX  - Unknown field value
YY  - Another unknown field
"""
        parser = MedlineParser()
        abstracts = parser.parse_content(content)

        assert len(abstracts) == 1
        assert "XX" in abstracts[0].metadata
        assert abstracts[0].metadata["XX"] == "Unknown field value"
        assert "YY" in abstracts[0].metadata

    def test_parse_file(self, tmp_path, sample_medline_content):
        """Test parsing from a file"""
        # Create temporary file
        file_path = tmp_path / "test_medline.txt"
        file_path.write_text(sample_medline_content, encoding="utf-8")

        parser = MedlineParser()
        abstracts = parser.parse_file(str(file_path))

        assert len(abstracts) == 3

    def test_get_abstracts_dict(self, sample_medline_content):
        """Test getting abstracts as list of dictionaries"""
        parser = MedlineParser()
        parser.parse_content(sample_medline_content)
        abstracts_dict = parser.get_abstracts_dict()

        assert len(abstracts_dict) == 3
        assert all(isinstance(a, dict) for a in abstracts_dict)
        assert abstracts_dict[0]["pmid"] == "12345678"

    def test_get_statistics(self, sample_medline_content):
        """Test getting parsing statistics"""
        parser = MedlineParser()
        parser.parse_content(sample_medline_content)
        stats = parser.get_statistics()

        assert stats["total_abstracts"] == 3
        assert stats["abstracts_with_title"] == 3
        assert stats["abstracts_with_abstract"] == 3
        assert stats["abstracts_with_authors"] == 3

    def test_statistics_partial_data(self):
        """Test statistics with partial data"""
        content = """PMID- 11111111
TI  - Title Only Entry

PMID- 22222222
AB  - Abstract Only Entry
"""
        parser = MedlineParser()
        parser.parse_content(content)
        stats = parser.get_statistics()

        assert stats["total_abstracts"] == 2
        assert stats["abstracts_with_title"] == 1
        assert stats["abstracts_with_abstract"] == 1


class TestMedlineParserEdgeCases:
    """Edge case tests for MEDLINE parser"""

    def test_unicode_characters(self):
        """Test handling of unicode characters"""
        content = """PMID- 12345678
TI  - מחקר על סוכרת בישראל
AB  - תקציר המחקר בעברית
AU  - כהן א
"""
        parser = MedlineParser()
        abstracts = parser.parse_content(content)

        assert len(abstracts) == 1
        assert "סוכרת" in abstracts[0].title
        assert "בעברית" in abstracts[0].abstract

    def test_special_characters(self):
        """Test handling of special characters"""
        content = """PMID- 12345678
TI  - Study of α-glucosidase & β-cells (10% improvement)
AB  - Results showed p<0.05 significance [95% CI: 1.2-2.4]
"""
        parser = MedlineParser()
        abstracts = parser.parse_content(content)

        assert len(abstracts) == 1
        assert "α-glucosidase" in abstracts[0].title
        assert "p<0.05" in abstracts[0].abstract

    def test_very_long_abstract(self):
        """Test handling of very long abstracts"""
        long_text = "This is a sentence. " * 500
        content = f"""PMID- 12345678
TI  - Test Long Abstract
AB  - {long_text}
"""
        parser = MedlineParser()
        abstracts = parser.parse_content(content)

        assert len(abstracts) == 1
        assert len(abstracts[0].abstract) > 1000

    def test_continuation_lines_mixed_indent(self):
        """Test continuation lines with various indentation"""
        content = """PMID- 12345678
TI  - Title
AB  - First line of abstract
      Second line with 6 spaces
        Third line with 8 spaces
    Fourth line with 4 spaces
"""
        parser = MedlineParser()
        abstracts = parser.parse_content(content)

        assert len(abstracts) == 1
        # All continuation lines should be captured
        assert "First line" in abstracts[0].abstract
        assert "Second line" in abstracts[0].abstract

    def test_empty_field_values(self):
        """Test handling of empty field values"""
        content = """PMID- 12345678
TI  -
AB  - Actual abstract content
"""
        parser = MedlineParser()
        abstracts = parser.parse_content(content)

        assert len(abstracts) == 1
        assert abstracts[0].title == ""
        assert abstracts[0].abstract == "Actual abstract content"

    def test_multiple_spaces_in_tag(self):
        """Test tag parsing with variable spacing"""
        content = """PMID- 12345678
TI  - Title with proper spacing
TA  -  Journal with extra space
DP  -2023 Jan (no space after dash)
"""
        parser = MedlineParser()
        abstracts = parser.parse_content(content)

        assert len(abstracts) == 1
        assert abstracts[0].title == "Title with proper spacing"
        assert abstracts[0].journal == "Journal with extra space"

    def test_real_world_medline_format(self):
        """Test with realistic MEDLINE format from PubMed export"""
        content = """
PMID- 38234567
OWN - NLM
STAT- MEDLINE
DCOM- 20231215
LR  - 20231220
IS  - 1234-5678 (Electronic)
IS  - 0123-4567 (Print)
VI  - 45
IP  - 12
DP  - 2023 Dec
TI  - Comprehensive systematic review of diabetes management strategies in
      elderly patients: A meta-analysis of randomized controlled trials.
PG  - 1234-1250
LID - 10.1234/jdr.2023.12345 [doi]
AB  - OBJECTIVE: To evaluate the effectiveness of various diabetes management
      strategies in elderly patients (age ≥65 years).
      METHODS: We searched PubMed, Cochrane Library, and Embase for randomized
      controlled trials published between 2010-2023.
      RESULTS: A total of 45 studies involving 12,500 participants were included.
      Metformin monotherapy showed significant HbA1c reduction (MD: -0.8%, 95% CI:
      -1.0 to -0.6).
      CONCLUSION: Individualized treatment approaches are recommended for elderly
      diabetic patients.
CI  - Copyright © 2023 The Authors. Published by Elsevier Inc.
FAU - Anderson, James R
AU  - Anderson JR
AD  - Department of Internal Medicine, University Medical Center.
FAU - Smith, Sarah K
AU  - Smith SK
AD  - Division of Endocrinology, City Hospital.
LA  - eng
PT  - Journal Article
PT  - Meta-Analysis
PT  - Systematic Review
PL  - United States
TA  - J Diabetes Res
JT  - Journal of diabetes research
JID - 101234567
MH  - Aged
MH  - Diabetes Mellitus, Type 2/*therapy
MH  - Metformin/therapeutic use
MH  - Randomized Controlled Trials as Topic
OT  - Diabetes
OT  - Elderly
OT  - Meta-analysis
OT  - Systematic review
EDAT- 2023/12/15 06:00
MHDA- 2023/12/20 06:00
CRDT- 2023/12/15 05:30
PHST- 2023/12/15 06:00 [pubmed]
PHST- 2023/12/20 06:00 [medline]
PHST- 2023/12/15 05:30 [entrez]
AID - S1234-5678(23)12345-6 [pii]
AID - 10.1234/jdr.2023.12345 [doi]
PST - ppublish
SO  - J Diabetes Res. 2023 Dec;45(12):1234-1250. doi: 10.1234/jdr.2023.12345.
"""
        parser = MedlineParser()
        abstracts = parser.parse_content(content)

        assert len(abstracts) == 1
        abstract = abstracts[0]
        assert abstract.pmid == "38234567"
        assert "systematic review" in abstract.title.lower()
        assert "OBJECTIVE:" in abstract.abstract
        assert "METHODS:" in abstract.abstract
        assert "RESULTS:" in abstract.abstract
        assert "CONCLUSION:" in abstract.abstract
        assert "Anderson JR" in abstract.authors
        assert "Smith SK" in abstract.authors
        assert abstract.journal == "J Diabetes Res"
        assert abstract.publication_date == "2023 Dec"
        assert "Diabetes" in abstract.keywords
        assert "Elderly" in abstract.keywords
        assert "Meta-analysis" in abstract.keywords
