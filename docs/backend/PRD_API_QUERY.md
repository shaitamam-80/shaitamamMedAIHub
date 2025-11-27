# PRD: Query API (PubMed Search Generation)

## General Information

| Field | Value |
|-------|-------|
| **Module Name** | Query API |
| **Path** | `/api/v1/query/*` |
| **File** | `backend/app/api/routes/query.py` |
| **Priority** | P0 - Critical |
| **Status** | Implemented (v1.0), Major Update for v2.0 |
| **Version** | 2.0 |

---

## 1. Overview

### 1.1 Module Purpose

The Query API generates optimized PubMed search queries from structured framework data. It produces three search strategies (Broad, Focused, Clinical Filtered) using AI and validated methodological filters (Hedges).

### 1.2 Business Value

- AI-generated PubMed search strategies
- Validated methodological filters (Cochrane, SIGN, Haynes)
- Framework-specific query logic
- Proximity search support
- Export-ready query strings

---

## 2. API Endpoints

### EP-QRY-001: Generate Query

| Field | Value |
|-------|-------|
| **Method** | POST |
| **Path** | `/api/v1/query/generate` |
| **Auth** | Required |
| **Request** | `QueryGenerateRequest` |
| **Response** | `QueryGenerateResponse` |

#### Request Schema

```python
class QueryGenerateRequest(BaseModel):
    project_id: UUID
    framework_data: Dict[str, Any]
    query_type: str = Field(default="boolean", pattern="^(boolean|mesh|advanced)$")
    # v2.0 additions
    proximity_settings: Optional[Dict[str, int]] = None  # Term proximity distances
    selected_hedge: Optional[str] = None                  # Override default hedge
```

#### Response Schema

```python
class ConceptAnalysis(BaseModel):
    concept_number: int
    component: str
    free_text_terms: List[str]
    mesh_terms: List[str]

class QueryStrategies(BaseModel):
    broad: str          # High recall query
    focused: str        # Balanced precision query
    clinical_filtered: str  # With validated hedge

class ToolboxItem(BaseModel):
    label: str
    query: str

class QueryGenerateResponse(BaseModel):
    message: str                      # Markdown explanation
    concepts: List[ConceptAnalysis]   # Term breakdown
    queries: QueryStrategies          # Three strategies
    toolbox: Optional[List[ToolboxItem]]  # Modifiers
    framework_type: str
    framework_data: Dict[str, Any]
```

#### Response Example

```json
{
  "message": "# PubMed Search Strategy\n\nI've generated three search strategies based on your PICO framework...\n\n## Concept Breakdown\n\n| Concept | Terms |\n|---------|-------|\n| Population | elderly[tiab], aged[tiab], \"Aged\"[Mesh] |\n...",
  "concepts": [
    {
      "concept_number": 1,
      "component": "P (Population)",
      "free_text_terms": ["elderly[tiab]", "older adult*[tiab]", "aged[tiab]"],
      "mesh_terms": ["\"Aged\"[Mesh]", "\"Diabetes Mellitus, Type 2\"[Mesh]"]
    },
    {
      "concept_number": 2,
      "component": "I (Intervention)",
      "free_text_terms": ["metformin[tiab]", "glucophage[tiab]"],
      "mesh_terms": ["\"Metformin\"[Mesh]"]
    }
  ],
  "queries": {
    "broad": "(elderly[tiab] OR aged[tiab] OR \"Aged\"[Mesh]) AND (\"Diabetes Mellitus, Type 2\"[Mesh] OR diabete*[tiab]) AND (metformin[tiab] OR \"Metformin\"[Mesh]) AND (placebo[tiab] OR \"Placebos\"[Mesh]) AND (HbA1c[tiab] OR glycemic[tiab])",
    "focused": "(\"Aged\"[Mesh] AND \"Diabetes Mellitus, Type 2\"[Mesh]) AND (metformin[tiab] OR \"Metformin\"[Mesh]) AND (HbA1c[ti] OR \"Glycated Hemoglobin A\"[Mesh])",
    "clinical_filtered": "(\"Aged\"[Mesh] AND \"Diabetes Mellitus, Type 2\"[Mesh]) AND (metformin[tiab] OR \"Metformin\"[Mesh]) AND (HbA1c[ti]) AND (randomized controlled trial[pt] OR randomised[tiab] OR placebo[tiab]) NOT (animals[mh] NOT humans[mh])"
  },
  "toolbox": [
    {"label": "Limit to Last 5 Years", "query": "AND (\"2020/01/01\"[Date - Publication] : \"3000\"[Date - Publication])"},
    {"label": "English Only", "query": "AND English[lang]"},
    {"label": "Add RCT Filter", "query": "AND (randomized controlled trial[pt])"},
    {"label": "Proximity: Within 3 Words", "query": "Replace phrase with \"term1 term2\"[tiab:~3]"}
  ],
  "framework_type": "PICO",
  "framework_data": {
    "P": "elderly adults with type 2 diabetes",
    "I": "metformin",
    "C": "placebo",
    "O": "HbA1c levels"
  }
}
```

---

### EP-QRY-002: Get Query History

| Field | Value |
|-------|-------|
| **Method** | GET |
| **Path** | `/api/v1/query/history/{project_id}` |
| **Auth** | Required |
| **Response** | `{ queries: List[QueryString] }` |

#### Response Example

```json
{
  "queries": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "query_text": "(elderly[tiab] OR...",
      "query_type": "boolean",
      "created_at": "2024-12-15T10:30:00Z"
    }
  ]
}
```

---

## 3. Query Generation Logic (v2.0)

### 3.1 Three-Strategy Approach

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Query Strategies                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  🔵 BROAD (High Recall)                                             │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ • All free-text terms + MeSH with OR                           │ │
│  │ • Loose field tags ([tiab])                                    │ │
│  │ • No filters applied                                           │ │
│  │ • Use for: Scoping, comprehensive reviews                      │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  🟢 FOCUSED (Balanced Precision)                                    │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ • MeSH terms for Population + Outcome                          │ │
│  │ • Free-text for Intervention (captures newer terms)            │ │
│  │ • Strict field tags ([ti], [majr])                             │ │
│  │ • Use for: Targeted searches, known topics                     │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  🟡 CLINICAL FILTERED (Evidence-Based)                              │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ • Focused query + Validated Hedge filter                       │ │
│  │ • Framework-specific hedge selection                           │ │
│  │ • Study design restrictions                                    │ │
│  │ • Use for: Clinical guidelines, systematic reviews             │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Framework-to-Hedge Mapping (v2.0)

| Framework | Recommended Hedge | Source |
|-----------|-------------------|--------|
| PICO, PICOT, PICOS | RCT_COCHRANE | Cochrane HSSS |
| CoCoPop | PREVALENCE_FILTER | Cochrane |
| PEO, PECO | ETIOLOGY_HAYNES + OBSERVATIONAL_SIGN | Haynes, SIGN |
| PFO | PROGNOSIS_HAYNES | Haynes |
| PIRD | DIAGNOSIS_HAYNES | Haynes |
| SPIDER, PICo | QUALITATIVE_WONG | Wong |
| ECLIPSE, SPICE | POLICY_FILTER | InterTASC |
| BeHEMoTh | THEORY_FILTER | BeHEMoTh |
| PCC, CIMO | None (scoping) | - |

### 3.3 Validated Hedges Library (v2.0)

```python
VALIDATED_HEDGES = {
    "RCT_COCHRANE": {
        "name": "Cochrane HSSS (RCTs)",
        "citation": "Lefebvre C, et al. Cochrane Handbook 2019",
        "query": "(randomized controlled trial[pt] OR controlled clinical trial[pt] OR randomized[tiab] OR randomised[tiab] OR placebo[tiab] OR \"clinical trials as topic\"[mesh:noexp] OR randomly[tiab] OR trial[ti]) NOT (animals[mh] NOT humans[mh])"
    },
    "QUALITATIVE_WONG": {
        "name": "Wong Filter (Qualitative)",
        "citation": "Wong SSL, et al. J Med Libr Assoc 2004",
        "query": "(qualitative research[mh] OR interviews as topic[mh] OR focus groups[mh] OR qualitative[tiab] OR interview*[tiab] OR phenomenolog*[tiab])"
    },
    "OBSERVATIONAL_SIGN": {
        "name": "SIGN Filter (Observational)",
        "citation": "Scottish Intercollegiate Guidelines Network",
        "query": "(cohort studies[mh] OR longitudinal studies[mh] OR case-control studies[mh])"
    },
    "PROGNOSIS_HAYNES": {
        "name": "Haynes Filter (Prognosis)",
        "citation": "Haynes RB, et al. BMC Medical Informatics 2005",
        "query": "(prognosis[sh] OR survival analysis[mh] OR predict*[tiab])"
    },
    "DIAGNOSIS_HAYNES": {
        "name": "Haynes Filter (Diagnosis)",
        "citation": "Haynes RB, et al. BMC Medical Informatics 2004",
        "query": "(sensitivity and specificity[mh] OR predictive value of tests[mh])"
    }
}
```

### 3.4 Proximity Search Support (v2.0)

PubMed supports proximity searching to find terms near each other:

#### Syntax

```
"term1 term2"[field:~N]
```

#### Supported Fields

| Field | Tag | Example |
|-------|-----|---------|
| Title | `[ti:~N]` | `"patient safety"[ti:~3]` |
| Title/Abstract | `[tiab:~N]` | `"diabetes management"[tiab:~2]` |
| Affiliation | `[ad:~N]` | `"Harvard MIT"[ad:~5]` |

#### Distance Guidelines

| Distance | Use Case |
|----------|----------|
| `~0` | Exact adjacency (phrase search) |
| `~2-3` | Close relationship (default) |
| `~5` | Moderate relationship |
| `~10` | Loose relationship |

**Note**: Proximity does NOT work with MeSH terms - free-text only!

---

## 4. Business Rules

### BR-QRY-001: Project Ownership

- User must own the project to generate queries
- Verified via `user_id` comparison

### BR-QRY-002: Framework Data Required

- Cannot generate query without `framework_data`
- Uses project's data if not provided in request
- Returns 400 if no data available

### BR-QRY-003: Query Persistence

- Focused query saved to `query_strings` table
- Analysis run created with full results
- Historical queries accessible via history endpoint

### BR-QRY-004: Hedge Selection (v2.0)

- Default hedge based on framework type
- User can override with `selected_hedge` parameter
- Hedge citation included in response message

### BR-QRY-005: Proximity Integration (v2.0)

- Toolbox includes proximity modifiers
- User can specify `proximity_settings` in request
- AI suggests proximity for multi-word concepts

---

## 5. AI Integration

### 5.1 System Prompt Structure

```python
# backend/app/core/prompts/query.py

def get_query_system_prompt(framework_type: str) -> str:
    """
    Returns system prompt for Query generation.

    Includes:
    - Role definition (PubMed Query Architect)
    - Framework components and labels
    - Query logic formula for framework
    - Hedge repository with citations
    - Proximity search guide
    - JSON output format
    - Quality checklist
    """
```

### 5.2 Prompt Components

1. **Concept Analysis Instructions**: How to break down terms
2. **MeSH Term Guidelines**: Proper formatting and tags
3. **Boolean Logic Rules**: AND/OR/NOT precedence
4. **Hedge Library**: Full list with citations
5. **Toolbox Items**: Standard query modifiers
6. **Output Format**: JSON structure specification

---

## 6. Data Models

### 6.1 Query String Entity

```sql
-- Database table: query_strings
CREATE TABLE query_strings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    query_type VARCHAR(50),  -- 'boolean', 'mesh', 'advanced'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB           -- Full AI response, hedge used, etc.
);
```

### 6.2 Analysis Run Entity

```sql
-- Analysis run for query generation
{
    "project_id": "uuid",
    "tool": "QUERY",
    "status": "completed",
    "results": {
        "message": "...",
        "concepts": [...],
        "queries": {...},
        "toolbox": [...]
    },
    "config": {
        "framework_data": {...},
        "framework_type": "PICO",
        "selected_hedge": "RCT_COCHRANE"
    }
}
```

---

## 7. Error Handling

### 7.1 Error Codes

| Code | Condition | Message |
|------|-----------|---------|
| 400 | No framework data | "No framework data available" |
| 404 | Project not found | "Project not found" |
| 403 | Access denied | "Access denied" |
| 500 | AI generation failed | "Error generating query" |

### 7.2 AI Fallback

If AI response parsing fails:

```python
return {
    "message": "Failed to generate query strategy. Please try again.",
    "concepts": [],
    "queries": {"broad": "", "focused": "", "clinical_filtered": ""},
    "toolbox": [],
    "framework_type": framework_type,
    "framework_data": framework_data
}
```

---

## 8. Development Tasks

### 8.1 Implemented (v1.0)

- [x] Query generation endpoint
- [x] Query history endpoint
- [x] AI-powered term expansion
- [x] Three-strategy output
- [x] Query persistence

### 8.2 Tasks v2.0 (High Priority)

- [ ] **QRY-API-T001**: Implement validated hedges library
- [ ] **QRY-API-T002**: Add framework-to-hedge mapping
- [ ] **QRY-API-T003**: Add proximity search syntax support
- [ ] **QRY-API-T004**: Add `proximity_settings` parameter
- [ ] **QRY-API-T005**: Add `selected_hedge` parameter
- [ ] **QRY-API-T006**: Include hedge citations in response
- [ ] **QRY-API-T007**: Add toolbox with proximity modifiers

### 8.3 Tasks for Later

- [ ] **QRY-API-T010**: Add query versioning (track changes)
- [ ] **QRY-API-T011**: Add PubMed API integration (test query)
- [ ] **QRY-API-T012**: Add query validation endpoint
- [ ] **QRY-API-T013**: Add Ovid/Cochrane syntax conversion
- [ ] **QRY-API-T014**: Add query comparison (A/B testing)

---

## 9. Testing Requirements

### 9.1 Unit Tests

| Test | Description |
|------|-------------|
| `test_generate_query_pico` | PICO framework generates valid query |
| `test_generate_query_cocopop` | CoCoPop with prevalence hedge |
| `test_generate_query_spider` | Qualitative with Wong filter |
| `test_hedge_selection` | Correct hedge per framework |
| `test_proximity_syntax` | Valid proximity query format |

### 9.2 Integration Tests

| Test | Description |
|------|-------------|
| `test_query_from_define_data` | Uses project's framework_data |
| `test_query_history` | Queries saved and retrievable |

---

## 10. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12 | Initial implementation |
| 2.0 | 2024-12 | Hedges library, proximity search, framework mapping |
