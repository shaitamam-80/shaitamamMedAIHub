"""
MeSH XML Import Script
Parses desc2025.xml and imports MeSH terms to Supabase

Usage:
    python scripts/import_mesh.py --file path/to/desc2025.gz
"""

import gzip
import argparse
import asyncio
import sys
from pathlib import Path
from xml.etree import ElementTree as ET
from typing import Generator, Dict, List, Any
from dataclasses import dataclass, asdict
import json

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings
from supabase import create_client, Client


@dataclass
class MeSHDescriptor:
    """Represents a MeSH Descriptor from XML"""
    descriptor_ui: str           # D000001
    descriptor_name: str         # Calcimycin
    entry_terms: List[str]       # Synonyms
    tree_numbers: List[str]      # Hierarchy codes
    scope_note: str              # Definition

    def to_db_record(self) -> Dict[str, Any]:
        """Convert to database record format"""
        return {
            "descriptor_ui": self.descriptor_ui,
            "descriptor_name": self.descriptor_name,
            "entry_terms": self.entry_terms,
            "tree_numbers": self.tree_numbers,
            "scope_note": self.scope_note[:2000] if self.scope_note else None
        }


def parse_mesh_xml(file_path: Path, limit: int = None) -> Generator[MeSHDescriptor, None, None]:
    """
    Parse MeSH XML file using iterative parsing (memory efficient).

    Args:
        file_path: Path to desc2025.xml or desc2025.gz
        limit: Optional limit for testing

    Yields:
        MeSHDescriptor objects
    """
    count = 0

    # Check if file is actually gzipped by reading first bytes
    with open(file_path, 'rb') as f:
        magic = f.read(2)

    is_gzipped = magic == b'\x1f\x8b'  # Gzip magic number

    if is_gzipped:
        print("  Detected gzipped file")
        file_handle = gzip.open(file_path, 'rb')
    else:
        print("  Detected XML file (not gzipped)")
        file_handle = open(file_path, 'rb')

    try:
        # Use iterparse for memory efficiency
        context = ET.iterparse(file_handle, events=('end',))

        for event, elem in context:
            if elem.tag == 'DescriptorRecord':
                try:
                    descriptor = parse_descriptor_record(elem)
                    if descriptor:
                        yield descriptor
                        count += 1

                        if count % 1000 == 0:
                            print(f"  Parsed {count} descriptors...")

                        if limit and count >= limit:
                            break
                finally:
                    # Clear element to free memory
                    elem.clear()

    finally:
        file_handle.close()

    print(f"Total parsed: {count} descriptors")


def parse_descriptor_record(elem: ET.Element) -> MeSHDescriptor:
    """
    Parse a single DescriptorRecord XML element.

    XML Structure:
    <DescriptorRecord>
        <DescriptorUI>D000001</DescriptorUI>
        <DescriptorName><String>Calcimycin</String></DescriptorName>
        <TreeNumberList><TreeNumber>D03.438.221.173</TreeNumber></TreeNumberList>
        <ConceptList>
            <Concept>
                <ScopeNote>An antibiotic...</ScopeNote>
                <TermList>
                    <Term><String>A-23187</String></Term>
                    <Term><String>A23187</String></Term>
                </TermList>
            </Concept>
        </ConceptList>
    </DescriptorRecord>
    """
    try:
        # Get DescriptorUI
        ui_elem = elem.find('DescriptorUI')
        descriptor_ui = ui_elem.text if ui_elem is not None else None

        if not descriptor_ui:
            return None

        # Get DescriptorName
        name_elem = elem.find('DescriptorName/String')
        descriptor_name = name_elem.text if name_elem is not None else ""

        if not descriptor_name:
            return None

        # Get TreeNumbers
        tree_numbers = []
        for tree_elem in elem.findall('TreeNumberList/TreeNumber'):
            if tree_elem.text:
                tree_numbers.append(tree_elem.text)

        # Get Entry Terms (synonyms) and Scope Note from Concepts
        entry_terms = []
        scope_note = ""

        for concept in elem.findall('ConceptList/Concept'):
            # Get scope note from first concept that has one
            if not scope_note:
                scope_elem = concept.find('ScopeNote')
                if scope_elem is not None and scope_elem.text:
                    scope_note = scope_elem.text

            # Get all terms (entry terms / synonyms)
            for term in concept.findall('TermList/Term'):
                term_string = term.find('String')
                if term_string is not None and term_string.text:
                    term_text = term_string.text
                    # Don't include the main descriptor name as an entry term
                    if term_text != descriptor_name and term_text not in entry_terms:
                        entry_terms.append(term_text)

        return MeSHDescriptor(
            descriptor_ui=descriptor_ui,
            descriptor_name=descriptor_name,
            entry_terms=entry_terms[:50],  # Limit to 50 synonyms
            tree_numbers=tree_numbers,
            scope_note=scope_note
        )

    except Exception as e:
        print(f"Error parsing descriptor: {e}")
        return None


def batch_insert(supabase: Client, records: List[Dict], batch_size: int = 500):
    """
    Insert records in batches with upsert.

    Args:
        supabase: Supabase client
        records: List of records to insert
        batch_size: Number of records per batch
    """
    total = len(records)
    inserted = 0

    for i in range(0, total, batch_size):
        batch = records[i:i + batch_size]

        try:
            result = supabase.table('mesh_terms').upsert(
                batch,
                on_conflict='descriptor_ui'
            ).execute()

            inserted += len(batch)
            print(f"  Inserted {inserted}/{total} records...")

        except Exception as e:
            print(f"Error inserting batch {i}-{i+batch_size}: {e}")
            # Try one by one
            for record in batch:
                try:
                    supabase.table('mesh_terms').upsert(
                        record,
                        on_conflict='descriptor_ui'
                    ).execute()
                    inserted += 1
                except Exception as e2:
                    print(f"  Failed to insert {record['descriptor_ui']}: {e2}")

    return inserted


def main():
    parser = argparse.ArgumentParser(description='Import MeSH XML to Supabase')
    parser.add_argument('--file', '-f', required=True, help='Path to desc2025.xml or desc2025.gz')
    parser.add_argument('--limit', '-l', type=int, help='Limit number of records (for testing)')
    parser.add_argument('--dry-run', action='store_true', help='Parse only, do not insert')
    parser.add_argument('--output-json', '-o', help='Output parsed data to JSON file')

    args = parser.parse_args()

    file_path = Path(args.file)
    if not file_path.exists():
        print(f"Error: File not found: {file_path}")
        sys.exit(1)

    print(f"MeSH Import Script")
    print(f"=" * 50)
    print(f"File: {file_path}")
    print(f"Limit: {args.limit or 'None'}")
    print(f"Dry run: {args.dry_run}")
    print()

    # Parse XML
    print("Step 1: Parsing MeSH XML...")
    records = []

    for descriptor in parse_mesh_xml(file_path, limit=args.limit):
        records.append(descriptor.to_db_record())

    print(f"\nParsed {len(records)} descriptors")

    # Sample output
    if records:
        print("\nSample record:")
        sample = records[0]
        print(f"  UI: {sample['descriptor_ui']}")
        print(f"  Name: {sample['descriptor_name']}")
        print(f"  Entry Terms: {len(sample['entry_terms'])} terms")
        if sample['entry_terms']:
            print(f"    First 3: {sample['entry_terms'][:3]}")
        print(f"  Tree Numbers: {sample['tree_numbers']}")

    # Output to JSON if requested
    if args.output_json:
        print(f"\nWriting to {args.output_json}...")
        with open(args.output_json, 'w', encoding='utf-8') as f:
            json.dump(records, f, ensure_ascii=False, indent=2)
        print(f"Written {len(records)} records to JSON")

    # Insert to database
    if not args.dry_run and not args.output_json:
        print("\nStep 2: Inserting to Supabase...")

        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
            print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
            sys.exit(1)

        supabase = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY
        )

        inserted = batch_insert(supabase, records)
        print(f"\nDone! Inserted {inserted} records to mesh_terms table")

    elif args.dry_run:
        print("\nDry run complete. No data inserted.")


if __name__ == '__main__':
    main()
