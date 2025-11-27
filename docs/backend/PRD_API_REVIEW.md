# PRD: Review API (File Upload & AI Screening)

## General Information

| Field | Value |
|-------|-------|
| **Module Name** | Review API |
| **Path** | `/api/v1/review/*` |
| **File** | `backend/app/api/routes/review.py` |
| **Priority** | P0 - Critical |
| **Status** | Implemented (v1.0), Major Update for v2.0 |
| **Version** | 2.0 |

---

## 1. Overview

### 1.1 Module Purpose

The Review API handles MEDLINE file uploads, abstract parsing, and AI-powered screening. It processes PubMed export files, stores abstracts, and uses Google Gemini to make include/exclude decisions based on research criteria.

### 1.2 Business Value

- Automated MEDLINE file parsing
- AI-assisted abstract screening
- Batch processing for large datasets
- Human decision override capability
- Multi-format export (CSV, RIS, NBIB)

---

## 2. API Endpoints

### EP-REV-001: Upload MEDLINE File

| Field | Value |
|-------|-------|
| **Method** | POST |
| **Path** | `/api/v1/review/upload` |
| **Auth** | Required |
| **Content-Type** | `multipart/form-data` |
| **Request** | `file` + `project_id` |
| **Response** | `FileUploadResponse` |

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_id` | string | Yes | Project UUID |
| `file` | file | Yes | MEDLINE format file (.txt, .medline) |

#### Response Schema

```python
class FileUploadResponse(BaseModel):
    id: UUID
    filename: str
    file_size: int
    status: str  # "processing"
    uploaded_at: datetime
```

#### Response Example

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "pubmed_results.txt",
  "file_size": 524288,
  "status": "processing",
  "uploaded_at": "2024-12-15T10:30:00Z"
}
```

#### Processing Flow

```
┌─────────────────────┐
│   File Upload       │
│   (multipart)       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Validate File Type  │  .txt, .medline, .csv
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Check File Size     │  Max 10MB
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Save to Disk        │  uploads/{timestamp}_{filename}
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Create DB Record    │  files table (status: uploaded)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Background Task     │  parse_medline_file()
│ (async)             │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Return Response     │  status: "processing"
└─────────────────────┘
```

#### Background Parsing

```python
async def parse_medline_file(file_path, project_id, file_id):
    """
    1. Update file status → "processing"
    2. Parse MEDLINE with MedlineParser
    3. Bulk insert abstracts to database
    4. Update file status → "completed"
    5. Store metadata: {total_abstracts: N}
    """
```

---

### EP-REV-002: Get Abstracts

| Field | Value |
|-------|-------|
| **Method** | GET |
| **Path** | `/api/v1/review/abstracts/{project_id}` |
| **Auth** | Required |
| **Query Params** | `filter_status` (optional) |
| **Response** | `List[AbstractResponse]` |

#### Query Parameters

| Parameter | Values | Description |
|-----------|--------|-------------|
| `filter_status` | `pending`, `include`, `exclude`, `maybe` | Filter by status |

#### Response Schema

```python
class AbstractResponse(BaseModel):
    id: UUID
    project_id: UUID
    pmid: str
    title: Optional[str]
    abstract: Optional[str]
    authors: Optional[str]
    journal: Optional[str]
    publication_date: Optional[str]
    keywords: Optional[List[str]]
    status: str
    decision: Optional[str]
    ai_reasoning: Optional[str]
    human_decision: Optional[str]
    screened_at: Optional[datetime]
    created_at: datetime
    metadata: Optional[Dict[str, Any]]
```

#### Response Example

```json
[
  {
    "id": "uuid",
    "project_id": "uuid",
    "pmid": "12345678",
    "title": "Metformin in Elderly Diabetic Patients",
    "abstract": "Background: Type 2 diabetes is common in elderly...",
    "authors": "Smith J; Doe A; Johnson B",
    "journal": "Diabetes Care",
    "publication_date": "2024 Jan",
    "keywords": ["diabetes", "metformin", "elderly"],
    "status": "include",
    "decision": "include",
    "ai_reasoning": "Relevant: RCT of metformin in elderly T2DM patients measuring HbA1c outcomes. Matches PICO criteria.",
    "human_decision": null,
    "screened_at": "2024-12-15T11:00:00Z",
    "created_at": "2024-12-15T10:30:00Z",
    "metadata": {
      "MH": ["Diabetes Mellitus, Type 2", "Metformin"],
      "PT": "Randomized Controlled Trial"
    }
  }
]
```

---

### EP-REV-003: Start Batch Analysis

| Field | Value |
|-------|-------|
| **Method** | POST |
| **Path** | `/api/v1/review/analyze` |
| **Auth** | Required |
| **Request** | `BatchAnalysisRequest` |
| **Response** | `BatchAnalysisResponse` |

#### Request Schema

```python
class BatchAnalysisRequest(BaseModel):
    project_id: UUID
    file_id: UUID
    criteria: Optional[Dict[str, Any]] = None  # Override framework_data
    batch_size: int = Field(default=10, ge=1, le=50)
```

#### Response Schema

```python
class BatchAnalysisResponse(BaseModel):
    analysis_run_id: UUID
    total_abstracts: int
    processed: int
    status: str  # "running"
```

#### Processing Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Batch Analysis Pipeline                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐       ┌─────────────┐       ┌─────────────┐       │
│  │   Request   │ ────▶ │  Create     │ ────▶ │  Get        │       │
│  │   Received  │       │  Analysis   │       │  Pending    │       │
│  │             │       │  Run        │       │  Abstracts  │       │
│  └─────────────┘       └─────────────┘       └─────────────┘       │
│                                                      │               │
│                                                      ▼               │
│                         ┌──────────────────────────────────────┐    │
│                         │        Background Task                │    │
│                         │        run_batch_analysis()           │    │
│                         └──────────────────────────────────────┘    │
│                                        │                             │
│                 ┌──────────────────────┼──────────────────────┐     │
│                 │                      │                      │     │
│                 ▼                      ▼                      ▼     │
│         ┌─────────────┐        ┌─────────────┐        ┌─────────┐  │
│         │  Batch 1    │        │  Batch 2    │        │ Batch N │  │
│         │  (10 abs)   │        │  (10 abs)   │        │ (N abs) │  │
│         └──────┬──────┘        └──────┬──────┘        └────┬────┘  │
│                │                      │                     │       │
│                ▼                      ▼                     ▼       │
│         ┌─────────────┐        ┌─────────────┐        ┌─────────┐  │
│         │  AI Analyze │        │  AI Analyze │        │ AI      │  │
│         │  Gemini Pro │        │  Gemini Pro │        │ Analyze │  │
│         └──────┬──────┘        └──────┬──────┘        └────┬────┘  │
│                │                      │                     │       │
│                ▼                      ▼                     ▼       │
│         ┌─────────────┐        ┌─────────────┐        ┌─────────┐  │
│         │  Update DB  │        │  Update DB  │        │ Update  │  │
│         │  Decisions  │        │  Decisions  │        │ DB      │  │
│         └─────────────┘        └─────────────┘        └─────────┘  │
│                                                                      │
│                              Final: Update analysis_run              │
│                              status → "completed"                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

### EP-REV-004: Update Abstract Decision

| Field | Value |
|-------|-------|
| **Method** | PATCH |
| **Path** | `/api/v1/review/abstracts/{abstract_id}` |
| **Auth** | Required |
| **Request** | `AbstractUpdateDecision` |
| **Response** | `AbstractResponse` |

#### Request Schema

```python
class AbstractUpdateDecision(BaseModel):
    decision: str = Field(..., pattern="^(include|exclude|maybe)$")
    human_decision: Optional[str] = Field(None, pattern="^(include|exclude)$")
```

#### Business Logic

- `human_decision` takes precedence over `decision`
- Updates `status` to match decision
- Stores in separate field from AI decision

---

### EP-REV-005: Export Results (v2.0 - New)

| Field | Value |
|-------|-------|
| **Method** | GET |
| **Path** | `/api/v1/review/export/{project_id}` |
| **Auth** | Required |
| **Query Params** | `format`, `status`, `include_ai_data` |
| **Response** | File download |
| **Status** | To Be Implemented |

#### Query Parameters

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `format` | `csv`, `ris`, `nbib` | `csv` | Export format |
| `status` | `all`, `include`, `exclude`, `maybe` | `all` | Filter by status |
| `include_ai_data` | `true`, `false` | `true` | Include AI reasoning |

#### Export Formats

##### CSV Format

```csv
PMID,Title,Authors,Journal,Year,Status,AI_Decision,AI_Reasoning,Human_Decision
12345678,"Metformin Study...","Smith J; Doe A",Diabetes Care,2024,include,include,"Relevant RCT...",
```

##### RIS Format (EndNote/Zotero)

```text
TY  - JOUR
TI  - Metformin in Elderly Diabetic Patients
AU  - Smith, John
AU  - Doe, Amanda
PY  - 2024
JO  - Diabetes Care
AB  - Background: Type 2 diabetes is common in elderly...
KW  - diabetes
KW  - metformin
N1  - MedAI Hub Decision: Include
N1  - AI Reasoning: Relevant RCT of metformin...
ER  -
```

##### NBIB Format (PubMed MEDLINE)

```text
PMID- 12345678
TI  - Metformin in Elderly Diabetic Patients
AB  - Background: Type 2 diabetes is common in elderly...
AU  - Smith J
AU  - Doe A
TA  - Diabetes Care
DP  - 2024 Jan
```

---

## 3. MEDLINE Parser

### 3.1 Supported Tags

| Tag | Field | Multi-line |
|-----|-------|------------|
| `PMID` | PubMed ID | No |
| `TI` | Title | Yes |
| `AB` | Abstract | Yes |
| `AU` | Authors (multiple) | No |
| `TA` | Journal | No |
| `DP` | Publication Date | No |
| `MH` | MeSH Terms | No |
| `OT` | Keywords | No |
| `PT` | Publication Type | No |

### 3.2 Parser Rules

```python
# Continuation lines: 6+ spaces at start
# Example:
# AB  - This is the start of an abstract
#       that continues on multiple lines
#       until the next tag.
```

### 3.3 Parser Output

```python
@dataclass
class ParsedAbstract:
    pmid: str
    title: Optional[str]
    abstract: Optional[str]
    authors: Optional[str]  # "; " separated
    journal: Optional[str]
    publication_date: Optional[str]
    keywords: List[str]
    metadata: Dict[str, Any]  # All other tags
```

---

## 4. AI Screening Logic

### 4.1 Screening Prompt

```python
prompt = f"""You are screening research abstracts for a systematic review.

INCLUSION CRITERIA:
{json.dumps(criteria)}

For each abstract below, determine if it should be INCLUDED or EXCLUDED.
Provide brief reasoning for your decision.

Abstracts:
1. PMID: 12345678
   Title: ...
   Abstract: ...

Return as JSON array:
[
  {"pmid": "12345678", "decision": "include", "reasoning": "..."}
]
"""
```

### 4.2 Decision Values

| Decision | Meaning | When Used |
|----------|---------|-----------|
| `include` | Relevant to research question | Meets criteria |
| `exclude` | Not relevant | Doesn't meet criteria |
| `maybe` | Uncertain | Needs human review |

### 4.3 Decision Priority

```
human_decision > ai_decision > pending
```

---

## 5. Business Rules

### BR-REV-001: File Validation

- Only `.txt`, `.medline`, `.csv` extensions allowed
- Maximum file size: 10MB
- File sanitized to prevent path traversal

### BR-REV-001b: File Encoding Handling (v2.0 - Critical)

**Problem:** Files exported from PubMed, EndNote, or older systems may use different character encodings (UTF-8, Latin-1/ISO-8859-1, Windows-1252). Incorrect encoding detection causes parsing failures or garbled text.

#### Required Implementation

```python
import chardet

def detect_and_decode_file(file_path: str) -> str:
    """
    Detect file encoding and return decoded content.

    Tries encodings in order:
    1. UTF-8 (most common, PubMed default)
    2. Detected encoding via chardet
    3. Latin-1 fallback (never fails)
    """
    with open(file_path, 'rb') as f:
        raw_content = f.read()

    # Try UTF-8 first (fastest, most common)
    try:
        return raw_content.decode('utf-8')
    except UnicodeDecodeError:
        pass

    # Detect encoding
    detected = chardet.detect(raw_content)
    encoding = detected.get('encoding', 'latin-1')
    confidence = detected.get('confidence', 0)

    # Use detected encoding if confident
    if confidence > 0.7:
        try:
            return raw_content.decode(encoding)
        except (UnicodeDecodeError, LookupError):
            pass

    # Fallback to Latin-1 (never fails, maps bytes 1:1)
    return raw_content.decode('latin-1')
```

#### Common Encodings by Source

| Source | Common Encoding | Notes |
|--------|-----------------|-------|
| PubMed (modern) | UTF-8 | Default since ~2015 |
| PubMed (old exports) | Latin-1 | Pre-2015 files |
| EndNote | Windows-1252 | Windows Latin |
| Zotero | UTF-8 | Always UTF-8 |
| Manual .txt files | Varies | User-dependent |

#### Parser Update Required

```python
# backend/app/services/medline_parser.py

class MedlineParser:
    def parse_file(self, file_path: str) -> List[ParsedAbstract]:
        # Detect and decode with encoding handling
        content = detect_and_decode_file(file_path)

        # Normalize line endings
        content = content.replace('\r\n', '\n').replace('\r', '\n')

        # Continue with parsing...
```

#### Configuration

```python
# backend/app/core/config.py

class Settings(BaseSettings):
    # File Encoding
    FILE_ENCODING_DETECTION: bool = True
    FILE_ENCODING_FALLBACK: str = "latin-1"
    FILE_ENCODING_MIN_CONFIDENCE: float = 0.7
```

#### Dependencies

```
# requirements.txt
chardet>=5.0.0
```

### BR-REV-002: Unique PMID

- PMID has UNIQUE constraint in database
- Duplicate PMIDs skipped during import
- Same abstract can be in multiple projects

### BR-REV-003: Background Processing

- File parsing runs in background task
- Batch analysis runs in background task
- Status tracked in `files.status` and `analysis_runs.status`

### BR-REV-004: Human Override

- `human_decision` always takes precedence
- AI decision preserved for comparison
- Both decisions visible in UI

### BR-REV-005: Metadata Preservation (v2.0)

- All MEDLINE tags stored in `metadata` JSONB
- Full metadata exported in RIS/NBIB
- Round-trip: MEDLINE → MedAI Hub → RIS → EndNote

### BR-REV-006: Export Format Rules (v2.0)

- CSV includes all fields + AI reasoning
- RIS uses standard tags for EndNote/Zotero
- NBIB preserves original MEDLINE format
- Decision added as note field

---

## 6. Data Models

### 6.1 File Entity

```sql
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(50),  -- 'MEDLINE', 'CSV', 'PDF'
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'uploaded',  -- 'uploaded', 'processing', 'completed', 'error'
    metadata JSONB
);
```

### 6.2 Abstract Entity

```sql
CREATE TABLE abstracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    pmid VARCHAR(20) UNIQUE NOT NULL,
    title TEXT,
    abstract TEXT,
    authors TEXT,
    journal VARCHAR(255),
    publication_date DATE,
    keywords TEXT[],
    status VARCHAR(20) DEFAULT 'pending',
    decision VARCHAR(20),
    ai_reasoning TEXT,
    human_decision VARCHAR(20),
    screened_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 6.3 Analysis Run Entity

```sql
CREATE TABLE analysis_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tool VARCHAR(20) NOT NULL,  -- 'REVIEW'
    status VARCHAR(50) DEFAULT 'pending',  -- 'running', 'completed', 'failed'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    results JSONB,
    error_message TEXT,
    config JSONB
);
```

---

## 7. Error Handling

### 7.1 Error Codes

| Code | Condition | Message |
|------|-----------|---------|
| 400 | Invalid file type | "Invalid file type" |
| 413 | File too large | "File exceeds maximum size" |
| 404 | Project/Abstract not found | "Not found" |
| 403 | Access denied | "Access denied" |
| 500 | Parse/Analysis failed | "Error occurred" |

### 7.2 File Status States

```
uploaded → processing → completed
                    ↘ error
```

### 7.3 Analysis Status States

```
pending → running → completed
                 ↘ failed
```

---

## 8. Development Tasks

### 8.1 Implemented (v1.0)

- [x] File upload endpoint
- [x] Background file parsing
- [x] MEDLINE parser
- [x] Get abstracts endpoint
- [x] Batch analysis endpoint
- [x] Update decision endpoint
- [x] Status filtering

### 8.2 Tasks v2.0 (High Priority)

- [ ] **REV-API-T001**: Implement CSV export
- [ ] **REV-API-T002**: Implement RIS export (EndNote/Zotero)
- [ ] **REV-API-T003**: Implement NBIB export (MEDLINE)
- [ ] **REV-API-T004**: Add export endpoint with format param
- [ ] **REV-API-T005**: Preserve full metadata for export
- [ ] **REV-API-T006**: Add RIS field mapping

### 8.2b Tasks v2.0 (Critical - File Encoding)

- [ ] **REV-API-T020**: Add chardet dependency for encoding detection
- [ ] **REV-API-T021**: Implement detect_and_decode_file() function
- [ ] **REV-API-T022**: Update MedlineParser to use encoding detection
- [ ] **REV-API-T023**: Add encoding configuration to Settings
- [ ] **REV-API-T024**: Add tests for UTF-8, Latin-1, Windows-1252 files

### 8.3 Tasks for Later

- [ ] **REV-API-T010**: Add WebSocket for progress updates
- [ ] **REV-API-T011**: Add bulk decision update
- [ ] **REV-API-T012**: Add keyword search in abstracts
- [ ] **REV-API-T013**: Add PRISMA diagram data
- [ ] **REV-API-T014**: Add duplicate detection

---

## 9. Testing Requirements

### 9.1 Unit Tests

| Test | Description |
|------|-------------|
| `test_upload_valid_file` | MEDLINE file uploads successfully |
| `test_upload_invalid_type` | Rejects non-MEDLINE files |
| `test_upload_too_large` | Rejects files > 10MB |
| `test_parse_medline` | Parser extracts all fields |
| `test_batch_analysis` | AI decisions saved correctly |

### 9.2 Export Tests

| Test | Description |
|------|-------------|
| `test_export_csv` | CSV format correct |
| `test_export_ris` | RIS imports into EndNote |
| `test_export_nbib` | NBIB valid MEDLINE format |
| `test_export_filtered` | Status filter works |

---

## 10. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12 | Initial implementation |
| 2.0 | 2024-12 | Export formats (CSV, RIS, NBIB), File encoding detection |
