"""
MedAI Hub - MEDLINE File Parser
Parses PubMed MEDLINE format (.txt) files into structured abstracts
"""

import re

import chardet


class MedlineAbstract:
    """Represents a single MEDLINE abstract"""

    def __init__(self):
        self.pmid: str | None = None
        self.title: str | None = None
        self.abstract: str | None = None
        self.authors: str | None = None
        self.journal: str | None = None
        self.publication_date: str | None = None
        self.publication_types: list[str] = []
        self.language: str | None = None
        self.keywords: list[str] = []
        self.metadata: dict[str, str] = {}

    def to_dict(self) -> dict:
        """Convert to dictionary for database storage"""
        return {
            "pmid": self.pmid,
            "title": self.title,
            "abstract": self.abstract,
            "authors": self.authors,
            "journal": self.journal,
            "publication_date": self.publication_date,
            "publication_types": self.publication_types,
            "language": self.language,
            "keywords": self.keywords,
            "metadata": self.metadata,
        }


class MedlineParser:
    """
    Parser for PubMed MEDLINE format files

    MEDLINE Format Rules:
    - Abstracts are separated by "PMID- " entries
    - Multi-line fields are indented with 6 spaces
    - Field tags are 4 characters followed by "- " (e.g., "TI  - ", "AB  - ")
    """

    # Common MEDLINE field tags
    TAG_PMID = "PMID"
    TAG_TITLE = "TI"
    TAG_ABSTRACT = "AB"
    TAG_AUTHORS = "AU"
    TAG_JOURNAL = "TA"
    TAG_PUBLICATION_DATE = "DP"
    TAG_KEYWORDS = "OT"
    TAG_MESH = "MH"

    def __init__(self):
        self.abstracts: list[MedlineAbstract] = []

    def parse_file(self, file_path: str) -> list[MedlineAbstract]:
        """
        Parse a MEDLINE format file with automatic encoding detection.

        Uses chardet to detect file encoding for better compatibility
        with files from different systems (UTF-8, Latin-1, Windows-1252, etc.)
        """
        # Detect encoding
        with open(file_path, "rb") as f:
            raw_data = f.read(10000)  # Read first 10KB for detection

        detection = chardet.detect(raw_data)
        encoding = detection["encoding"] or "utf-8"

        # Use fallback for low confidence detections
        if detection["confidence"] < 0.7:
            encoding = "latin-1"  # Safe fallback that handles most Western encodings

        # Read file with detected encoding
        with open(file_path, encoding=encoding, errors="replace") as f:
            content = f.read()

        # Normalize line endings
        content = content.replace("\r\n", "\n")

        return self.parse_content(content)

    def parse_content(self, content: str) -> list[MedlineAbstract]:
        """Parse MEDLINE content string"""
        # Split by PMID entries
        # Pattern: "PMID- " at start of line
        entries = re.split(r"\n(?=PMID- )", content.strip())

        abstracts = []
        for entry in entries:
            if not entry.strip():
                continue

            abstract = self._parse_entry(entry)
            if abstract and abstract.pmid:  # Only add if valid PMID exists
                abstracts.append(abstract)

        self.abstracts = abstracts
        return abstracts

    def _parse_entry(self, entry: str) -> MedlineAbstract | None:
        """Parse a single MEDLINE entry"""
        abstract = MedlineAbstract()
        lines = entry.split("\n")

        current_tag = None
        current_value = []

        for line in lines:
            # Check if line starts with a tag (4 chars + "- ")
            tag_match = re.match(r"^([A-Z]{2,4})\s*-\s*(.*)$", line)

            if tag_match:
                # Save previous tag's value
                if current_tag:
                    self._set_field(abstract, current_tag, "\n".join(current_value))

                # Start new tag
                current_tag = tag_match.group(1)
                current_value = [tag_match.group(2)]
            elif line.startswith("      ") and current_tag:
                # Continuation line (6 spaces indentation)
                current_value.append(line.strip())
            elif current_tag:
                # Some continuation lines might not have exact 6 spaces
                # but are clearly continuations
                stripped = line.strip()
                if stripped:
                    current_value.append(stripped)

        # Save last tag
        if current_tag:
            self._set_field(abstract, current_tag, "\n".join(current_value))

        return abstract

    def _set_field(self, abstract: MedlineAbstract, tag: str, value: str):
        """Set the appropriate field based on tag"""
        value = value.strip()

        if tag == self.TAG_PMID:
            abstract.pmid = value
        elif tag == self.TAG_TITLE:
            abstract.title = value
        elif tag == self.TAG_ABSTRACT:
            abstract.abstract = value
        elif tag == self.TAG_AUTHORS:
            # Collect all authors
            if abstract.authors:
                abstract.authors += f"; {value}"
            else:
                abstract.authors = value
        elif tag == self.TAG_JOURNAL:
            abstract.journal = value
        elif tag == self.TAG_PUBLICATION_DATE:
            abstract.publication_date = value
        elif tag == "PT":
            # Add to publication_types list
            if value and value not in abstract.publication_types:
                abstract.publication_types.append(value)
        elif tag == "LA":
            # Set language (usually only one, but we'll take the first or append if multiple?)
            # MEDLINE usually has one LA line, but can have multiple. Let's store as a list or single string.
            # Spec says "Check Language (LA vs language)". Let's store as list for safety or single string?
            # Standard MEDLINE has "LA  - eng".
            if abstract.language:
                abstract.language += f"; {value}"
            else:
                abstract.language = value
        elif tag == self.TAG_KEYWORDS or tag == self.TAG_MESH:
            # Add to keywords list
            if value and value not in abstract.keywords:
                abstract.keywords.append(value)
        else:
            # Store unknown tags in metadata
            abstract.metadata[tag] = value

    def get_abstracts_dict(self) -> list[dict]:
        """Get all abstracts as dictionaries"""
        return [abstract.to_dict() for abstract in self.abstracts]

    def get_statistics(self) -> dict:
        """Get parsing statistics"""
        return {
            "total_abstracts": len(self.abstracts),
            "abstracts_with_title": sum(1 for a in self.abstracts if a.title),
            "abstracts_with_abstract": sum(1 for a in self.abstracts if a.abstract),
            "abstracts_with_authors": sum(1 for a in self.abstracts if a.authors),
        }


# Example usage
if __name__ == "__main__":
    # Test with sample MEDLINE data
    sample_medline = """
PMID- 12345678
TI  - Sample medical research article about diabetes treatment.
AB  - This is the abstract of the article. It describes the research methodology
      and findings. The abstract can span multiple lines with 6 spaces
      indentation for continuation lines.
AU  - Smith J
AU  - Johnson K
TA  - Journal of Medical Research
DP  - 2023 Jan 15
OT  - Diabetes
OT  - Treatment

PMID- 87654321
TI  - Another research article about cardiovascular disease.
AB  - This abstract discusses cardiovascular disease prevention strategies.
AU  - Williams R
TA  - Cardiology Today
DP  - 2023 Feb 20
"""

    parser = MedlineParser()
    abstracts = parser.parse_content(sample_medline)

    print(f"Parsed {len(abstracts)} abstracts")
    for abstract in abstracts:
        print(f"\nPMID: {abstract.pmid}")
        print(f"Title: {abstract.title}")
        print(f"Abstract: {abstract.abstract[:100]}..." if abstract.abstract else "")
        print(f"Authors: {abstract.authors}")
