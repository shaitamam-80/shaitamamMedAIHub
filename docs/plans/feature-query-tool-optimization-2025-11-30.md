# Feature Plan: Query Tool - Professional Report Generation

## Summary
שדרוג מקיף של מודול Query Tool לייצור דוחות חיפוש מקצועיים בפורמט אקדמי, כולל ניתוח מושגים מפורט, אסטרטגיות השוואה מרובות (Comprehensive, Direct Comparison, Clinically Filtered), ו-Toolbox עשיר לפילטרים. הדוח הסופי יהיה ברמה של Information Specialist מקצועי.

---

## Target Output Format (Based on User Example)

### Expected Report Structure:
```
PubMed Query Generation Report
==============================

1. Concept Analysis Table
   ┌────────────┬─────────────────────────────┬────────────────────────────┐
   │ Concept    │ Free-Text Terms             │ MeSH Suggestions           │
   ├────────────┼─────────────────────────────┼────────────────────────────┤
   │ Population │ "term1"[tiab], "term2"[tiab]│ MeSH Term [Mesh]           │
   │ Intervention│ ...                         │ ...                        │
   │ Comparison │ ...                         │ ...                        │
   │ Outcome    │ ...                         │ ...                        │
   └────────────┴─────────────────────────────┴────────────────────────────┘

2. Search Query Strategies (3 strategies with comparison logic)

   Strategy A: Comprehensive Query (High Sensitivity)
   - Goal: Capture all relevant literature
   - Logic: (Population AND Outcome AND Intervention) OR (Population AND Outcome AND Comparison)
   - Query: [Full PubMed query]

   Strategy B: Direct Comparison Query (High Specificity)
   - Goal: Head-to-head comparison studies only
   - Logic: Population AND Outcome AND Intervention AND Comparison
   - Query: [Full PubMed query with [majr] tags]

   Strategy C: Clinically Filtered Query (Methodology-Focused)
   - Goal: RCTs and high-quality evidence
   - Broad variant + Narrow/Specific variant
   - Query: [Full PubMed query with validated hedge]

3. Optional Filters Toolbox
   - Age Filters (Adults, Children, Elderly)
   - Article Type Filters (SR/MA, RCT, Guidelines)
   - Publication Date (Recent 5/10 years)
   - Language (English only)
   - Availability (Free full text)
```

---

## Gap Analysis: Current vs Desired

| Aspect | Current Output | Desired Output |
|--------|---------------|----------------|
| Concept Table | JSON array | Formatted markdown table |
| Query Strategies | 3 simple strategies | 3 named strategies with logic explanation |
| Strategy Names | broad/focused/clinical | Comprehensive/Direct/Clinical Filtered |
| Logic Explanation | None | Full Boolean logic formula shown |
| Comparison Logic | Basic AND | Split structure for individual vs head-to-head |
| Toolbox | 5-8 items | 15+ categorized filters |
| Report Style | Technical JSON | Professional narrative |

---

## Current Problems Analysis

### Critical Issues (P0)
1. **פורמט Output לא מקצועי** - חסר מבנה דוח אקדמי
2. **אין הסבר לוגיקה** - המשתמש לא מבין למה נבחרה אסטרטגיה
3. **תרגום עברית נכשל בשקט** - המשתמש לא יודע אם התרגום הצליח
4. **Toolbox דל** - חסרים פילטרים חשובים

### Quality Issues (P1)
1. **אין אסטרטגיית Split Structure** - לשאלות השוואה
2. **אין Narrow/Specific variant** - ל-Clinical Filter
3. **אין ולידציה של syntax** לפני שליחה ל-PubMed

### Performance Issues (P2)
1. **Rate limiting נמוך מדי** (5 concurrent)
2. **תרגום כל השדות** גם אם חלקם באנגלית

---

## Phase 0: Professional Report Format (HIGHEST PRIORITY)

### Requirement 0.1: Enhanced Report Structure

The AI must generate a **professional report** following this exact structure:

```markdown
# PubMed Query Generation Report

This search strategy is designed to identify literature [describing the research question context].
The queries prioritize [strategy description] using a split structure to ensure both comprehensive
retrieval of individual interventions and specific head-to-head studies are found.

## 1. Concept Analysis

| Concept      | Free-Text Terms                                    | MeSH Suggestions                          |
|--------------|---------------------------------------------------|-------------------------------------------|
| Population   | "term1"[tiab], "term2"[tiab], abbrev[tiab]        | MeSH Term 1, MeSH Term 2                  |
| Intervention | "term1"[tiab], "term2"[tiab]                      | MeSH Term                                 |
| Comparison   | "term1"[tiab], "term2"[tiab], class*[tiab]        | MeSH Term 1, MeSH Term 2, MeSH Term 3     |
| Outcome      | "term1"[tiab], abbrev[tiab], effect*[tiab]        | Treatment Outcome, Quality of Life        |

## 2. Search Query Strategies

### Comparison Strategy Structure

**Strategy A: Comprehensive Query (High Sensitivity)**

**Goal:** To retrieve all literature on each intervention separately. Ideal for systematic reviews.

**Logic:** `(Population AND Outcome AND Intervention) OR (Population AND Outcome AND Comparison)`

**Query:**
[Full formatted PubMed query with proper indentation]

---

**Strategy B: Direct Comparison Query (High Specificity)**

**Goal:** To retrieve only studies that directly compare the interventions.

**Logic:** `Population AND Outcome AND Intervention AND Comparison`
Uses `[majr]` to focus on articles where these are main topics.

**Query:**
[Full formatted PubMed query with [majr] tags]

---

**Strategy C: Clinically Filtered Query (Methodology-Focused)**

**Goal:** To focus on specific study types (RCTs, Therapy studies).

**Query (Broad/Sensitive):**
[Query with clinical filter - broad]

**Query (Narrow/Specific):**
[Query with clinical filter - narrow, RCT-focused]

## 3. Optional Filters Toolbox

You can further refine any query by combining with AND:

### Age Filters
- **Adults:** `( ...query... ) AND ( adult[mh] )`
- **Children (<18):** `( ...query... ) AND ( child[mh] OR adolescent[mh] )`
- **Elderly (65+):** `( ...query... ) AND ( aged[mh] OR "aged, 80 and over"[mh] )`

### Article Type Filters
- **Systematic Reviews/Meta-Analyses:** `AND ( Systematic Review[pt] OR Meta-Analysis[pt] )`
- **Randomized Controlled Trials:** `AND ( Randomized Controlled Trial[pt] )`
- **Clinical Guidelines:** `AND ( Guideline[pt] OR Practice Guideline[pt] )`
- **Observational Studies:** `AND ( Cohort Studies[mh] OR Case-Control Studies[mh] )`

### Publication Date
- **Recent 5 years:** `AND ( "2020"[PDAT] : "2025"[PDAT] )`
- **Recent 10 years:** `AND ( "2015"[PDAT] : "2025"[PDAT] )`

### Language & Availability
- **English only:** `AND ( english[la] )`
- **Free full text:** `AND ( free full text[sb] )`
- **Humans only:** `NOT ( animals[mh] NOT humans[mh] )`
```

### Requirement 0.2: New Response Schema

```python
class QueryStrategy(BaseModel):
    """Single query strategy with full metadata"""
    name: str  # "Comprehensive", "Direct Comparison", "Clinically Filtered"
    goal: str  # Description of what this strategy achieves
    logic: str  # Boolean logic formula shown to user
    sensitivity: str  # "high" | "medium" | "low"
    specificity: str  # "high" | "medium" | "low"
    query: str  # The actual PubMed query
    query_narrow: Optional[str] = None  # For clinical filtered - narrow variant

class ConceptAnalysis(BaseModel):
    """Concept breakdown with terms"""
    concept: str  # "Population", "Intervention", etc.
    component_key: str  # "P", "I", "C", "O"
    free_text_terms: List[str]  # Terms with [tiab] tags
    mesh_terms: List[str]  # MeSH suggestions (display names)
    mesh_queries: List[str]  # MeSH in query format

class ToolboxFilter(BaseModel):
    """Pre-built filter for toolbox"""
    category: str  # "Age", "Article Type", "Date", "Language"
    label: str  # Human-readable label
    query: str  # Query fragment to append

class QueryGenerateResponseV2(BaseModel):
    """Enhanced response with professional report format"""
    # Report header
    report_title: str = "PubMed Query Generation Report"
    report_intro: str  # Context paragraph about the search

    # Concept analysis
    concepts: List[ConceptAnalysis]

    # Three strategies
    strategies: Dict[str, QueryStrategy]  # "comprehensive", "direct", "clinical"

    # Rich toolbox
    toolbox: List[ToolboxFilter]

    # Formatted report (markdown)
    formatted_report: str  # Complete markdown report for display

    # Legacy compatibility
    queries: Dict[str, str]  # broad/focused/clinical_filtered for backward compat
    message: str  # Legacy message field

    # Metadata
    framework_type: str
    framework_data: Dict[str, Any]
    research_question: Optional[str] = None
```

### Requirement 0.3: Updated AI Prompt

The prompt in `backend/app/core/prompts/query.py` must be updated to:

1. **Generate the full report format** as shown above
2. **Include all three strategy types** with proper naming
3. **Show logic formulas** for each strategy
4. **Generate comprehensive toolbox** (15+ filters in categories)
5. **Use split structure** for comparison questions
6. **Include both broad and narrow** variants for clinical filter

### Requirement 0.4: Frontend Display

The frontend must render the report as formatted markdown with:

1. **Concept table** - Styled table with all concepts
2. **Strategy cards** - Expandable cards for each strategy
3. **Copy buttons** - Per-strategy and per-filter
4. **Toolbox accordion** - Grouped by category
5. **PubMed link** - Direct link to execute each strategy

---

## Phase 1: Critical Fixes (P0)

### Requirement 1.1: Translation Status Indicator
- [ ] הוספת שדה `translation_status` ל-response
- [ ] הצגת warning למשתמש אם תרגום נכשל חלקית
- [ ] הוספת `original_framework_data` ל-response לצורך השוואה

### Requirement 1.2: Improve Fallback Query Quality
- [ ] שילוב MeSH terms ב-fallback
- [ ] הוספת logical grouping (AND/OR) חכם יותר
- [ ] שמירת concept analysis גם ב-fallback

### Requirement 1.3: Error Transparency
- [ ] הוספת `warnings` array ל-response
- [ ] הודעות ברורות על מה קרה (timeout/translation failed/fallback used)
- [ ] Log מפורט לדיבאגינג

---

## Phase 2: Quality Improvements (P1)

### Requirement 2.1: Query Syntax Validation
- [ ] Endpoint חדש: `POST /api/v1/query/validate`
- [ ] בדיקת parentheses מאוזנות
- [ ] בדיקת Boolean operators חוקיים
- [ ] בדיקת field tags תקינים

### Requirement 2.2: Result Count Estimation
- [ ] שימוש ב-PubMed esearch עם rettype=count
- [ ] הצגת estimated count לפני הרצה מלאה
- [ ] warning אם query רחבה/צרה מדי

### Requirement 2.3: Hebrew Detection Improvement
- [ ] שימוש בספריית langdetect במקום regex
- [ ] טיפול ב-mixed language text
- [ ] ולידציה בשלב ה-Define (מניעה במקור)

---

## Phase 3: Performance Optimizations (P2)

### Requirement 3.1: Smart Translation
- [ ] בדיקת שפה per-field לפני תרגום
- [ ] תרגום רק של שדות עבריים
- [ ] Cache לתרגומים נפוצים

### Requirement 3.2: Rate Limit Adjustment
- [ ] הגדלת concurrent requests ל-10-15
- [ ] הוספת queue status למשתמש
- [ ] Graceful degradation כש-quota נגמר

### Requirement 3.3: Backend Question Extraction
- [ ] העברת logic מה-frontend לבאקאנד
- [ ] Endpoint משופר: `GET /api/v1/query/research-questions/{project_id}`
- [ ] Caching של extracted questions

---

## Phase 4: UX Enhancements (P3)

### Requirement 4.1: Streaming Status Updates
- [ ] Server-Sent Events (SSE) לעדכוני התקדמות
- [ ] Status: translating → generating → validating → done
- [ ] הצגת התקדמות בזמן אמת בפרונטאנד

### Requirement 4.2: Concept Refinement UI
- [ ] עריכת suggested terms
- [ ] הוספת/הסרת MeSH terms
- [ ] הוספת/הסרת free text terms

---

## Technical Design

### Database Changes
- [ ] **No new tables needed**
- [ ] Modified column: `analysis_runs.results` - add translation_status, warnings
- [ ] No migration script needed (JSONB is flexible)

### Backend Changes

#### New Endpoints
- [ ] `POST /api/v1/query/validate` - Validate query syntax
- [ ] `GET /api/v1/query/estimate/{query}` - Estimate result count

#### Modified Endpoints
- [ ] `POST /api/v1/query/generate` - Add translation_status, warnings, original_data
- [ ] `GET /api/v1/query/research-questions/{project_id}` - Move extraction logic

#### New Schemas
```python
# schemas.py additions
class TranslationStatus(BaseModel):
    success: bool
    fields_translated: List[str]
    fields_failed: List[str]
    method: str  # "batch" | "field_by_field" | "none_needed"

class QueryWarning(BaseModel):
    code: str  # "TRANSLATION_PARTIAL" | "TIMEOUT" | "FALLBACK_USED"
    message: str
    severity: str  # "info" | "warning" | "error"

class QueryGenerateResponse(BaseModel):
    # ... existing fields ...
    translation_status: Optional[TranslationStatus]
    warnings: List[QueryWarning]
    original_framework_data: Optional[Dict[str, Any]]

class QueryValidationResponse(BaseModel):
    valid: bool
    errors: List[str]
    suggestions: List[str]

class QueryEstimateResponse(BaseModel):
    estimated_count: int
    assessment: str  # "too_broad" | "good" | "too_narrow"
    suggestion: Optional[str]
```

#### Service Changes
```python
# ai_service.py modifications
async def generate_pubmed_query():
    # Add translation_status tracking
    # Add warnings collection
    # Return enhanced response

async def _translate_framework_data():
    # Return TranslationStatus instead of just data
    # Track which fields succeeded/failed

def _generate_fallback_query():
    # Include MeSH terms
    # Better concept grouping
    # Return with warnings

# New methods
async def validate_query_syntax(query: str) -> QueryValidationResponse
async def estimate_result_count(query: str) -> QueryEstimateResponse
```

### Frontend Changes

#### Modified Components
- [ ] `frontend/app/query/page.tsx` - Add warnings display, translation status
- [ ] Add new section: Query validation results
- [ ] Add new section: Estimated result count

#### New Components
- [ ] `TranslationStatusBadge` - Shows translation status
- [ ] `QueryWarnings` - Displays list of warnings
- [ ] `ResultEstimate` - Shows expected count with assessment

#### API Client Updates
```typescript
// lib/api.ts additions
validateQuery(query: string): Promise<QueryValidationResponse>
estimateResults(query: string): Promise<QueryEstimateResponse>
```

---

## Implementation Order

| Step | Phase | Description | Dependencies | Parallel |
|------|-------|-------------|--------------|----------|
| 1 | 0 | Add new schemas (QueryStrategy, ConceptAnalysis, ToolboxFilter) | None | Yes |
| 2 | 0 | Update AI prompt in query.py for professional report format | None | Yes |
| 3 | 0 | Update ai_service.generate_pubmed_query() to return new format | Steps 1,2 | No |
| 4 | 0 | Update QueryGenerateResponse schema with V2 fields | Step 1 | No |
| 5 | 0 | Update frontend to render professional report | Steps 3,4 | No |
| 6 | 1 | Add TranslationStatus tracking | None | Yes |
| 7 | 1 | Add QueryWarning schema | None | Yes |
| 8 | 1 | Improve _generate_fallback_query with new format | Step 3 | No |
| 9 | 2 | Add validate_query_syntax endpoint | None | Yes |
| 10 | 2 | Add estimate_result_count endpoint | None | Yes |
| 11 | 2 | Update frontend with validation/estimation UI | Steps 9,10 | No |

### Parallel Execution Plan

```text
┌─────────────────────────────────────────────────────────────┐
│ PHASE 0: Professional Report Format (PRIORITY)              │
├─────────────────────────────────────────────────────────────┤
│ Step 1 (parallel): New schemas                              │
│ Step 2 (parallel): Update AI prompt                         │
│                           │                                 │
│                           ▼                                 │
│ Step 3 (sequential): Update ai_service                      │
│ Step 4 (sequential): Update response schema                 │
│                           │                                 │
│                           ▼                                 │
│ Step 5 (sequential): Update frontend                        │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: Reliability (Can run in parallel)                  │
├─────────────────────────────────────────────────────────────┤
│ Step 6: TranslationStatus                                   │
│ Step 7: QueryWarning                                        │
│ Step 8: Improved fallback                                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: Quality Tools                                      │
├─────────────────────────────────────────────────────────────┤
│ Steps 9-10 (parallel): Validation + Estimation endpoints    │
│ Step 11: Frontend UI                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Testing Plan

### Unit Tests
- [ ] `test_translation_status.py` - Translation status tracking
- [ ] `test_query_warnings.py` - Warning collection
- [ ] `test_fallback_query.py` - Improved fallback generation
- [ ] `test_query_validation.py` - Syntax validation
- [ ] `test_query_estimation.py` - Result count estimation

### Integration Tests
- [ ] Hebrew text → English query flow
- [ ] Timeout → Fallback → Warning flow
- [ ] Full query generation with all enhancements
- [ ] PubMed API integration with new features

### Manual Testing Scenarios
- [ ] Enter Hebrew framework data, verify English query generated
- [ ] Trigger timeout, verify fallback used with warning
- [ ] Generate query, verify validation works
- [ ] Check estimated count matches actual results (±20%)

---

## Rollback Plan

### If Translation Status Fails
- Remove new fields from response
- Frontend gracefully handles missing fields
- Revert to previous behavior

### If Validation Endpoint Fails
- Disable validation in frontend
- Skip validation step
- No impact on query generation

### If Estimation Fails
- Return "unknown" estimate
- Frontend shows "Unable to estimate"
- No impact on query execution

### Full Rollback
```bash
git revert HEAD~{number_of_commits}
# OR
git checkout develop -- backend/app/services/ai_service.py
git checkout develop -- backend/app/api/routes/query.py
git checkout develop -- backend/app/api/models/schemas.py
git checkout develop -- frontend/app/query/page.tsx
```

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Hebrew translation success rate | Unknown (~80%?) | >95% |
| Fallback query quality | Basic AND | MeSH + structured |
| User awareness of issues | 0% | 100% (via warnings) |
| Query validation before PubMed | 0% | 100% |
| Estimated vs actual results | N/A | ±20% accuracy |

---

## Files to Create

| File | Purpose |
|------|---------|
| `frontend/components/query/QueryReport.tsx` | Professional report renderer |
| `frontend/components/query/ConceptTable.tsx` | Concept analysis table |
| `frontend/components/query/StrategyCard.tsx` | Strategy display card |
| `frontend/components/query/ToolboxAccordion.tsx` | Toolbox filters by category |
| `frontend/components/query/TranslationStatusBadge.tsx` | Status display |
| `frontend/components/query/QueryWarnings.tsx` | Warnings display |
| `backend/tests/test_query_report.py` | Report format tests |
| `backend/tests/test_translation_status.py` | Translation status tests |

## Files to Modify

| File | Changes |
|------|---------|
| `backend/app/api/models/schemas.py` | Add QueryStrategy, ConceptAnalysis, ToolboxFilter, QueryGenerateResponseV2 |
| `backend/app/core/prompts/query.py` | Update prompt for professional report format |
| `backend/app/services/ai_service.py` | Update generate_pubmed_query() for new format |
| `backend/app/api/routes/query.py` | Return new response format |
| `frontend/app/query/page.tsx` | Render professional report with new components |
| `frontend/lib/api.ts` | Update types for new response |
| `CLAUDE.md` | Document new query output format |

---

## Estimated Effort

| Phase | Tasks | Complexity | Priority |
|-------|-------|------------|----------|
| Phase 0 | Professional Report Format | High | HIGHEST |
| Phase 1 | Reliability (Translation, Warnings) | Medium | High |
| Phase 2 | Quality Tools (Validation, Estimation) | Medium | Medium |
| Phase 3 | Performance | Low-Medium | Low |
| Phase 4 | UX (Streaming, Concept Edit) | High | Low |

**Recommended Implementation Order:** Phase 0 → Phase 1 → Phase 2 → (Phase 3 & 4 optional)

---

## Quick Summary for Approval

### What We're Building

**מודול Query Tool משודרג** שמייצר דוחות חיפוש מקצועיים כמו Information Specialist:

1. **ניתוח מושגים בטבלה** - Population, Intervention, Comparison, Outcome עם Free-text ו-MeSH
2. **3 אסטרטגיות חיפוש**:
   - **Comprehensive** (High Sensitivity) - לסקירות ספרות
   - **Direct Comparison** (High Specificity) - להשוואות ישירות
   - **Clinically Filtered** (RCT-focused) - למחקרים קליניים
3. **Toolbox עשיר** - 15+ פילטרים מקובצים לפי קטגוריה
4. **שקיפות מלאה** - סטטוס תרגום, התראות, הסברי לוגיקה

### Key Deliverables

```text
INPUT:  שאלת מחקר + Framework Data (PICO)
        ↓
OUTPUT: דוח מקצועי עם 3 שאילתות + טבלת מושגים + Toolbox
```

---

## Approval Checklist

- [ ] פורמט הדוח המקצועי מאושר
- [ ] סדר השלבים מאושר (Phase 0 קודם)
- [ ] תכנון הטסטים מאושר
- [ ] Rollback plan מובן
- [ ] מוכנים להתחיל

**Status: AWAITING APPROVAL**

---

# Part 2: UI/UX Design & Workflow Enhancement

## Current State Analysis

### Pain Points Identified

| Issue | Impact | Priority |
|-------|--------|----------|
| No visual continuity between tools | Users feel lost | High |
| Query page requires re-selection of project | Workflow interruption | High |
| No progress indication across 3 tools | Confusion about status | High |
| Framework data hidden in dialog | Key info not visible | Medium |
| No breadcrumb navigation | Disorientation | Medium |
| Results display is basic list | Hard to scan | Medium |

### Current Workflow (Broken)

```
Define Page ──[Manual Navigation]──> Query Page ──[Manual Selection]──> Review Page
     │                                    │                                  │
     └─ No context passed ───────────────>│<── Must re-select project ──────┘
```

---

## Proposed Workflow (Seamless)

### Visual Flow Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        UNIFIED PROJECT HEADER (Sticky)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  [Logo] MedAI Hub    │  Project: "CBT vs Medications"  │  [Switch Project ▼]│
├─────────────────────────────────────────────────────────────────────────────┤
│                         PROGRESS BREADCRUMB                                 │
│   ● Define (✓)  ────────>  ● Query (In Progress)  ────────>  ○ Review      │
│   Framework filled         Generating queries              Not started      │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                            [CURRENT TOOL CONTENT]
```

### Key UX Improvements

#### 1. Persistent Project Context Bar

```tsx
// Component: ProjectContextBar.tsx
┌──────────────────────────────────────────────────────────────────┐
│  📋 CBT vs Medications for GAD                                   │
│  ├─ Framework: PICO                                              │
│  ├─ Status: Query generation complete                            │
│  └─ Last updated: 2 minutes ago                    [View Details]│
└──────────────────────────────────────────────────────────────────┘
```

#### 2. Step Progress Indicator

```tsx
// Component: WorkflowProgress.tsx
┌──────────────────────────────────────────────────────────────────┐
│   [1]──────────[2]──────────[3]                                  │
│    │            │            │                                   │
│  Define       Query        Review                                │
│  ✓ Done      ● Active     ○ Pending                             │
│                                                                  │
│  "You've completed the research question. Now generate queries." │
└──────────────────────────────────────────────────────────────────┘
```

#### 3. Auto-Navigation After Completion

```
Define Page:
  User completes PICO → AI confirms question
    ↓
  [Continue to Query Tool →] button appears
    ↓
  Click → Auto-selects current project in Query page
    ↓
  Framework data pre-loaded, ready to generate
```

---

## Query Page Redesign

### New Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PROJECT CONTEXT BAR (Sticky)                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ WORKFLOW PROGRESS (Define ✓ → Query ● → Review ○)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ RESEARCH QUESTION (Collapsible, starts expanded)                    │   │
│  │ ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │ │ "Among adults with GAD, what is the effectiveness of CBT       │ │   │
│  │ │  compared to psychotropic medications in reducing anxiety..."   │ │   │
│  │ └─────────────────────────────────────────────────────────────────┘ │   │
│  │ [Edit Question] [Use Different Question ▼]                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ CONCEPT ANALYSIS TABLE (Always visible)                             │   │
│  │ ┌───────────┬──────────────────────────┬─────────────────────────┐  │   │
│  │ │ Concept   │ Free-Text Terms          │ MeSH Terms              │  │   │
│  │ ├───────────┼──────────────────────────┼─────────────────────────┤  │   │
│  │ │ Population│ GAD[tiab], anxiety...    │ Anxiety Disorders[Mesh] │  │   │
│  │ │ Intervent.│ CBT[tiab], cognitive...  │ Cognitive Behavioral... │  │   │
│  │ │ Comparison│ SSRI[tiab], medication...│ Psychotropic Drugs...   │  │   │
│  │ │ Outcome   │ quality of life[tiab]... │ Treatment Outcome...    │  │   │
│  │ └───────────┴──────────────────────────┴─────────────────────────┘  │   │
│  │ [Copy Table] [Export CSV]                                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ SEARCH STRATEGIES (Tab-based, visual cards)                         │   │
│  │                                                                      │   │
│  │ ┌────────────────┬────────────────┬────────────────┐                │   │
│  │ │ Comprehensive  │ Direct Compare │ Clinical Filter│                │   │
│  │ │ [HIGH RECALL]  │ [HIGH PRECISION]│ [RCT FOCUSED] │                │   │
│  │ └────────────────┴────────────────┴────────────────┘                │   │
│  │                                                                      │   │
│  │ ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │ │ Strategy A: Comprehensive Query                                 │ │   │
│  │ │ ────────────────────────────────────────────────────────────── │ │   │
│  │ │ 🎯 Goal: Capture all relevant literature for systematic review  │ │   │
│  │ │                                                                 │ │   │
│  │ │ 📐 Logic:                                                       │ │   │
│  │ │ (Population AND Outcome AND Intervention)                       │ │   │
│  │ │           OR                                                    │ │   │
│  │ │ (Population AND Outcome AND Comparison)                         │ │   │
│  │ │                                                                 │ │   │
│  │ │ 📊 Estimated Results: ~2,450 articles                          │ │   │
│  │ │                                                                 │ │   │
│  │ │ ┌───────────────────────────────────────────────────────────┐  │ │   │
│  │ │ │ (("Generalized Anxiety Disorder"[MeSH] OR "generalized    │  │ │   │
│  │ │ │   anxiety"[tiab]) AND ("Treatment Outcome"[MeSH] OR       │  │ │   │
│  │ │ │   "quality of life"[tiab]) AND (("Cognitive Behavioral    │  │ │   │
│  │ │ │   Therapy"[MeSH] OR CBT[tiab]) OR ("Psychotropic          │  │ │   │
│  │ │ │   Drugs"[MeSH] OR SSRI*[tiab])))                          │  │ │   │
│  │ │ └───────────────────────────────────────────────────────────┘  │ │   │
│  │ │                                                                 │ │   │
│  │ │ [📋 Copy Query] [🔗 Open in PubMed] [▶ Execute Search]         │ │   │
│  │ └─────────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ OPTIONAL FILTERS TOOLBOX (Accordion by category)                    │   │
│  │                                                                      │   │
│  │ ▼ Age Filters                                                       │   │
│  │   ┌─────────────┬─────────────┬─────────────┐                       │   │
│  │   │ Adults (19+)│ Children    │ Elderly 65+ │                       │   │
│  │   │ [+ Add]     │ [+ Add]     │ [+ Add]     │                       │   │
│  │   └─────────────┴─────────────┴─────────────┘                       │   │
│  │                                                                      │   │
│  │ ▶ Article Type Filters                                              │   │
│  │ ▶ Publication Date                                                  │   │
│  │ ▶ Language & Availability                                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ [← Back to Define] [Continue to Review →]                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Design Specifications

### 1. Strategy Card Component

```tsx
// StrategyCard.tsx
interface StrategyCardProps {
  name: string;           // "Comprehensive", "Direct Comparison", "Clinically Filtered"
  badge: string;          // "HIGH RECALL", "HIGH PRECISION", "RCT FOCUSED"
  badgeColor: string;     // "emerald", "blue", "amber"
  goal: string;           // Description
  logic: string;          // Boolean formula
  estimatedResults?: number;
  query: string;          // The actual query
  queryNarrow?: string;   // For clinical filter
  onCopy: () => void;
  onExecute: () => void;
  onOpenPubMed: () => void;
}
```

**Visual Design:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Strategy A: Comprehensive Query              [HIGH RECALL] 🟢  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🎯 Goal                                                        │
│  Retrieve all literature on each intervention separately.       │
│  Ideal for systematic reviews to capture the full landscape.    │
│                                                                 │
│  📐 Logic                                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ (P AND O AND I) OR (P AND O AND C)                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  📊 Estimated: ~2,450 articles                                  │
│                                                                 │
│  Query                                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ (("Generalized Anxiety Disorder"[MeSH] OR "generalized  │    │
│  │   anxiety disorder"[tiab]) AND ...                      │ ↕  │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌──────────┐  ┌─────────────────┐  ┌────────────────────┐     │
│  │ 📋 Copy  │  │ 🔗 Open PubMed │  │ ▶ Execute Search  │     │
│  └──────────┘  └─────────────────┘  └────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Concept Table Component

```tsx
// ConceptTable.tsx
interface ConceptTableProps {
  concepts: Array<{
    name: string;          // "Population"
    key: string;           // "P"
    freeTextTerms: string[];
    meshTerms: string[];
  }>;
  onCopyTable: () => void;
  onExportCSV: () => void;
}
```

**Visual Design:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Concept Analysis                              [Copy] [Export]  │
├───────────────┬────────────────────────┬───────────────────────┤
│ Concept       │ Free-Text Terms        │ MeSH Suggestions      │
├───────────────┼────────────────────────┼───────────────────────┤
│ P Population  │ ┌─────┐ ┌─────────┐    │ ┌───────────────────┐ │
│               │ │GAD  │ │anxiety  │    │ │Anxiety Disorders  │ │
│               │ └─────┘ └─────────┘    │ └───────────────────┘ │
├───────────────┼────────────────────────┼───────────────────────┤
│ I Intervention│ ┌─────┐ ┌──────────┐   │ ┌───────────────────┐ │
│               │ │CBT  │ │cognitive │   │ │Cognitive Behavior │ │
│               │ └─────┘ └──────────┘   │ │Therapy            │ │
│               │                        │ └───────────────────┘ │
├───────────────┼────────────────────────┼───────────────────────┤
│ ...           │ ...                    │ ...                   │
└───────────────┴────────────────────────┴───────────────────────┘
```

### 3. Toolbox Accordion Component

```tsx
// ToolboxAccordion.tsx
interface ToolboxCategory {
  name: string;
  icon: LucideIcon;
  filters: Array<{
    label: string;
    query: string;
    description?: string;
  }>;
}
```

**Visual Design:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Optional Filters Toolbox                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ▼ 👥 Age Filters                                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────┐  │   │
│  │  │ Adults (19+)   │  │ Children (<18) │  │ Elderly    │  │   │
│  │  │ ────────────── │  │ ────────────── │  │ (65+)      │  │   │
│  │  │ adult[mh]      │  │ child[mh] OR   │  │ aged[mh]   │  │   │
│  │  │                │  │ adolescent[mh] │  │            │  │   │
│  │  │ [+ Add to Q]   │  │ [+ Add to Q]   │  │ [+ Add]    │  │   │
│  │  └────────────────┘  └────────────────┘  └────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ▶ 📄 Article Type Filters                                      │
│                                                                 │
│  ▶ 📅 Publication Date                                          │
│                                                                 │
│  ▶ 🌐 Language & Availability                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Workflow Continuity Features

### 1. Cross-Tool Navigation

```tsx
// WorkflowNavigation.tsx
// Appears at bottom of each tool page

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌──────────────────┐              ┌────────────────────────┐   │
│  │ ← Back to Define │              │ Continue to Review →   │   │
│  │   Edit question  │              │ Screen abstracts       │   │
│  └──────────────────┘              └────────────────────────┘   │
│                                                                 │
│  💡 Tip: Your query is saved. You can return anytime to modify. │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Project State Persistence

```typescript
// useProjectContext hook
interface ProjectState {
  projectId: string;
  projectName: string;
  frameworkType: string;
  frameworkData: Record<string, string>;
  currentStep: 'define' | 'query' | 'review';
  defineComplete: boolean;
  queryComplete: boolean;
  reviewComplete: boolean;
  lastActivity: Date;
}

// Stored in localStorage + synced with URL params
// URL: /query?project=abc123
```

### 3. Quick Actions Floating Button

```
┌─────────────────────────────────────────────────────────────────┐
│                                              ┌─────────────────┐│
│                                              │      ⚡        ││
│                                              │  Quick Actions  ││
│                                              └─────────────────┘│
│                                                       │         │
│                                                       ▼         │
│                                         ┌─────────────────────┐ │
│                                         │ Copy Focused Query  │ │
│                                         │ Open in PubMed      │ │
│                                         │ Export Report       │ │
│                                         │ Share Project       │ │
│                                         └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Mobile-First Design

### Mobile Query Page Layout

```
┌─────────────────────────────┐
│ ☰  MedAI Hub      [Project] │
├─────────────────────────────┤
│ Define ✓ → Query ● → Review │
├─────────────────────────────┤
│                             │
│ Research Question      [▼]  │
│ "Among adults with GAD..."  │
│                             │
├─────────────────────────────┤
│                             │
│ ▼ Concept Analysis          │
│ ┌─────────────────────────┐ │
│ │ Swipeable cards         │ │
│ │ ← P | I | C | O →       │ │
│ └─────────────────────────┘ │
│                             │
├─────────────────────────────┤
│                             │
│ Strategy Selection          │
│ ┌───────┬───────┬────────┐  │
│ │Compre-│Direct │Clinical│  │
│ │hensive│Compare│Filter  │  │
│ └───────┴───────┴────────┘  │
│                             │
│ ┌─────────────────────────┐ │
│ │ 🎯 Goal: Capture all... │ │
│ │                         │ │
│ │ Query:                  │ │
│ │ ┌─────────────────────┐ │ │
│ │ │ (("Generalized...   │ │ │
│ │ └─────────────────────┘ │ │
│ │                         │ │
│ │ [Copy] [PubMed] [Run]   │ │
│ └─────────────────────────┘ │
│                             │
├─────────────────────────────┤
│ ▶ Filters Toolbox           │
├─────────────────────────────┤
│                             │
│ [← Define]    [Review →]    │
│                             │
└─────────────────────────────┘
```

### Touch-Friendly Interactions

1. **Swipeable Concept Cards** - Swipe left/right to view P→I→C→O
2. **Long-press to Copy** - Hold on query text to copy
3. **Pull-to-Refresh** - Refresh results
4. **Bottom Sheet** - Toolbox opens as bottom sheet on mobile
5. **Sticky Action Bar** - Execute/Copy buttons always visible

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance

| Feature | Implementation |
|---------|----------------|
| Keyboard Navigation | Tab through all interactive elements |
| Focus Indicators | Visible ring on focus (2px primary color) |
| Screen Reader | ARIA labels on all buttons/icons |
| Color Contrast | 4.5:1 minimum for text |
| Skip Links | "Skip to main content" link |
| Error Messages | Associated with form fields |
| Loading States | Announced to screen readers |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + C` | Copy current strategy query |
| `Ctrl/Cmd + Enter` | Execute search |
| `Ctrl/Cmd + 1/2/3` | Switch strategy tabs |
| `Esc` | Close dialog/modal |
| `Tab` | Navigate between sections |
| `?` | Show keyboard shortcuts dialog |

---

## Animation & Micro-interactions

### Page Transitions

```css
/* Smooth page transitions */
.page-enter {
  opacity: 0;
  transform: translateY(10px);
}
.page-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: all 300ms ease-out;
}
```

### Loading States

```tsx
// Skeleton loading for query generation
┌─────────────────────────────────────────────────────────────────┐
│  ████████████████████████                                       │
│  ████████████                                                   │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ██████████████████████████████████████████████████████   │  │
│  │ ██████████████████████████████                           │  │
│  │ ████████████████████████████████████████████             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Generating your search strategies...                           │
│  [████████████░░░░░░░░░] 60%                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Success/Error Feedback

```tsx
// Toast notifications
✅ "Query copied to clipboard!"
✅ "Search executed - 2,450 results found"
❌ "Failed to generate query. Please try again."
⚠️ "Some Hebrew text detected. Translation applied."
```

---

## Files to Create (UI Components)

| Component | Purpose |
|-----------|---------|
| `components/workflow/ProjectContextBar.tsx` | Persistent project info header |
| `components/workflow/WorkflowProgress.tsx` | 3-step progress indicator |
| `components/workflow/WorkflowNavigation.tsx` | Back/Continue navigation |
| `components/query/ConceptTable.tsx` | Concept analysis table |
| `components/query/StrategyCard.tsx` | Strategy display card |
| `components/query/ToolboxAccordion.tsx` | Categorized filters |
| `components/query/QueryReport.tsx` | Full report renderer |
| `components/query/QuickActions.tsx` | Floating action button |
| `components/ui/skeleton-query.tsx` | Query loading skeleton |
| `hooks/useProjectContext.ts` | Project state management |
| `hooks/useKeyboardShortcuts.ts` | Keyboard shortcut handler |

---

## Design Tokens (Update globals.css)

```css
:root {
  /* Strategy Colors */
  --strategy-comprehensive: 16 185 129;  /* Emerald - High Recall */
  --strategy-direct: 59 130 246;         /* Blue - High Precision */
  --strategy-clinical: 245 158 11;       /* Amber - RCT Focused */

  /* Workflow Colors */
  --step-complete: 34 197 94;            /* Green */
  --step-active: 59 130 246;             /* Blue */
  --step-pending: 148 163 184;           /* Slate */

  /* Animation Durations */
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
}
```

---

## Updated Approval Checklist

- [ ] פורמט הדוח המקצועי מאושר
- [ ] עיצוב UI/UX מאושר
- [ ] זרימת עבודה (Define → Query → Review) מאושרת
- [ ] רכיבי UI חדשים מאושרים
- [ ] עיצוב מובייל מאושר
- [ ] סדר השלבים מאושר
- [ ] מוכנים להתחיל

**Status: AWAITING APPROVAL**

---

# Part 3: Search Results & Review Tool Integration

## Search Results Pagination

### Current State
- Results display shows up to 20 articles in a simple list
- No pagination controls
- User cannot browse beyond initial results
- Count shows total (339) but only 20 displayed

### Pagination Requirements

#### Backend Enhancement: `/api/v1/query/execute`

```python
class PubMedSearchRequest(BaseModel):
    query: str = Field(..., min_length=3)
    max_results: int = Field(default=20, ge=1, le=100)
    page: int = Field(default=1, ge=1)  # NEW: Page number
    sort: str = Field(default="relevance", pattern="^(relevance|date)$")

class PubMedSearchResponse(BaseModel):
    count: int           # Total matching articles
    returned: int        # Articles in this page
    page: int            # Current page number
    total_pages: int     # Total pages available
    articles: List[PubMedArticle]
    query: str
```

#### Frontend Pagination Component

```tsx
// components/query/ResultsPagination.tsx
interface ResultsPaginationProps {
  currentPage: number;
  totalPages: int;
  totalResults: number;
  resultsPerPage: number;
  onPageChange: (page: number) => void;
  onResultsPerPageChange: (count: number) => void;
}
```

**Visual Design:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Search Results                              Showing 21-40 of 339 articles  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 21. Article Title Here                                               │   │
│  │     Authors: Smith J, et al. | Journal: Lancet | 2024               │   │
│  │     [View Abstract] [Add to Review]                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 22. Another Article Title                                            │   │
│  │     ...                                                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ... (18 more articles)                                                     │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │  Results per page: [10 ▼] [20] [50]                               │     │
│  │                                                                    │     │
│  │  [◀ First] [← Prev]   Page 2 of 17   [Next →] [Last ▶]           │     │
│  │                                                                    │     │
│  │  Go to page: [___] [Go]                                           │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Pagination State Management

```tsx
// hooks/useSearchPagination.ts
interface SearchPaginationState {
  results: PubMedArticle[];
  currentPage: number;
  totalPages: number;
  totalResults: number;
  resultsPerPage: number;
  isLoading: boolean;
  selectedArticles: Set<string>;  // PMIDs selected for review
}
```

---

## MEDLINE Export Functionality

### Export Options

1. **Export All Results** - Download all matching articles (up to limit)
2. **Export Current Page** - Download only current page results
3. **Export Selected** - Download only user-selected articles

### MEDLINE File Format Reference

Based on PubMed standard MEDLINE format:

```
PMID- 32286648
TI  - Diagnosis and Management of Obstructive Sleep Apnea: A Review.
AB  - IMPORTANCE: Obstructive sleep apnea (OSA) affects 17% of women and 34% of men in
      the US and has a similar prevalence in other countries. This review provides an
      update on the diagnosis and treatment of OSA.
FAU - Gottlieb, Daniel J
AU  - Gottlieb DJ
JT  - JAMA
DP  - 2020 Apr 14
PT  - Journal Article
PT  - Review
MH  - *Continuous Positive Airway Pressure
MH  - Sleep Apnea, Obstructive/*diagnosis/*therapy
LA  - eng
SO  - JAMA. 2020 Apr 14;323(14):1389-1400.
```

**Key MEDLINE Tags:**
| Tag | Field | Required |
|-----|-------|----------|
| PMID | PubMed ID | ✅ |
| TI | Title | ✅ |
| AB | Abstract | ✅ |
| AU/FAU | Authors | ✅ |
| JT/TA | Journal | ✅ |
| DP | Date Published | ✅ |
| PT | Publication Type | ✅ |
| MH | MeSH Terms | Optional |
| LA | Language | Optional |
| SO | Source (citation) | ✅ |

**Multi-line Handling:**
- Continuation lines start with exactly **6 spaces**
- Must be concatenated during parsing

### Backend Endpoint: `/api/v1/query/export`

```python
class MedlineExportRequest(BaseModel):
    query: str
    pmids: Optional[List[str]] = None  # If None, export all from query
    max_results: int = Field(default=100, ge=1, le=500)
    format: str = Field(default="medline", pattern="^(medline|ris|csv)$")

@router.post("/export")
async def export_results(
    request: MedlineExportRequest,
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Export search results in MEDLINE, RIS, or CSV format.
    Returns a downloadable file.
    """
    if request.pmids:
        # Export specific articles by PMID
        articles = await pubmed_service.fetch_by_pmids(request.pmids)
    else:
        # Export from query
        articles = await pubmed_service.search(
            query=request.query,
            max_results=request.max_results,
            rettype=request.format
        )

    # Generate file content based on format
    if request.format == "medline":
        content = await pubmed_service.format_as_medline(articles)
        media_type = "text/plain"
        filename = f"pubmed_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    elif request.format == "ris":
        content = await pubmed_service.format_as_ris(articles)
        media_type = "application/x-research-info-systems"
        filename = f"pubmed_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.ris"
    else:  # csv
        content = await pubmed_service.format_as_csv(articles)
        media_type = "text/csv"
        filename = f"pubmed_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    return StreamingResponse(
        iter([content]),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
```

### Export UI Component

```tsx
// components/query/ExportDialog.tsx
┌─────────────────────────────────────────────────────────────────┐
│  Export Search Results                                     [X]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Export Scope:                                                  │
│  ○ All results (339 articles)                                   │
│  ○ Current page (20 articles)                                   │
│  ● Selected articles (12 selected)                              │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Export Format:                                                 │
│  ● MEDLINE (.txt) - Compatible with EndNote, Zotero, etc.      │
│  ○ RIS (.ris) - Research Information Systems format             │
│  ○ CSV (.csv) - Spreadsheet format                              │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ⚠️ Note: Maximum 500 articles can be exported at once.         │
│                                                                 │
│  ┌──────────────────────────┐  ┌────────────────────────────┐   │
│  │       Cancel             │  │   📥 Download Export       │   │
│  └──────────────────────────┘  └────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Continue to Review - GEMS Integration

### GEMS System Overview

The Review tool implements the **GEMS (Guided Evidence Mapping & Screening)** system with three modes:

### Review Mode Selection

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Select Review Mode                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  📊 SYSTEMATIC REVIEW                                                │   │
│  │  ──────────────────────────────────────────────────────────────────  │   │
│  │  Two-stage screening for comprehensive systematic reviews.           │   │
│  │                                                                      │   │
│  │  • Stage 1: AI screens titles & abstracts                           │   │
│  │  • Stage 2: Human validates AI decisions                            │   │
│  │  • Full methodology with inter-rater reliability                    │   │
│  │                                                                      │   │
│  │  Best for: Cochrane reviews, meta-analyses                          │   │
│  │                                                 [Select This Mode]   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  🔍 SCOPING REVIEW                                                   │   │
│  │  ──────────────────────────────────────────────────────────────────  │   │
│  │  AI-only screening for rapid evidence mapping.                       │   │
│  │                                                                      │   │
│  │  • AI applies eligibility criteria                                  │   │
│  │  • Provides reasoning for each decision                             │   │
│  │  • Human can override if needed                                     │   │
│  │                                                                      │   │
│  │  Best for: Literature mapping, pilot searches                       │   │
│  │                                                 [Select This Mode]   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ⚡ QUICK CLINICAL ANSWER                                            │   │
│  │  ──────────────────────────────────────────────────────────────────  │   │
│  │  Rapid AI screening with synthesis for clinical questions.          │   │
│  │                                                                      │   │
│  │  • AI screens and synthesizes findings                              │   │
│  │  • Generates summary with key citations                             │   │
│  │  • For clinical decision support                                    │   │
│  │                                                                      │   │
│  │  Best for: Clinical queries, teaching, rapid answers                │   │
│  │                                                 [Select This Mode]   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Transfer: Query → Review

```typescript
// Interface for passing context to Review tool
interface QueryToReviewContext {
  projectId: string;
  query: string;                    // The PubMed query used
  strategyUsed: string;             // "comprehensive" | "direct" | "clinical"
  totalResults: number;             // How many articles found

  // Option 1: Pass PMIDs directly
  pmids?: string[];                 // List of PMIDs to screen

  // Option 2: Pass MEDLINE file reference
  medlineFileId?: string;           // File ID if exported and uploaded

  // Framework context for screening criteria
  frameworkType: string;
  frameworkData: Record<string, string>;
  researchQuestion: string;
}
```

### Backend: Prepare for Review Endpoint

```python
@router.post("/prepare-for-review")
async def prepare_for_review(
    project_id: UUID,
    query: str,
    strategy: str,
    max_results: int = 500,
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Prepare search results for Review tool.
    Fetches articles and stores them in the review queue.
    """
    # Fetch all results (up to limit)
    results = await pubmed_service.search(
        query=query,
        max_results=max_results,
        rettype="xml"  # Full data
    )

    # Store in project's review queue
    for article in results["articles"]:
        await db_service.create_abstract(
            project_id=str(project_id),
            pmid=article["pmid"],
            title=article["title"],
            abstract=article.get("abstract", ""),
            authors=article.get("authors", ""),
            journal=article.get("journal", ""),
            publication_date=article.get("pubdate", ""),
            status="pending"
        )

    return {
        "status": "ready",
        "articles_queued": len(results["articles"]),
        "review_url": f"/review?project={project_id}"
    }
```

### Navigation Flow UI

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Continue to Review                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ✅ Search Complete: 339 articles found                                      │
│                                                                             │
│  What would you like to do next?                                            │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  📥 Export Results                                                   │   │
│  │  Download in MEDLINE format for use in other tools                   │   │
│  │                                           [Export MEDLINE File]      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ── OR ──                                                                   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  🔬 Screen in MedAI Hub                                              │   │
│  │  Use AI to screen titles & abstracts directly in the app             │   │
│  │                                                                      │   │
│  │  Articles to screen: ○ All 339  ○ Selected 12  ○ Top 100            │   │
│  │                                                                      │   │
│  │                                        [Continue to Review Tool →]   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  💡 Tip: The Review tool will use your PICO criteria to screen articles    │
│     based on relevance to your research question.                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Files to Create (Part 3)

| File | Purpose |
|------|---------|
| `frontend/components/query/ResultsPagination.tsx` | Pagination controls |
| `frontend/components/query/ExportDialog.tsx` | Export format selector |
| `frontend/components/query/ContinueToReview.tsx` | Review mode selector |
| `frontend/components/query/ArticleCard.tsx` | Single article display with selection |
| `frontend/components/query/ArticleSelector.tsx` | Multi-select checkbox for articles |
| `frontend/hooks/useSearchPagination.ts` | Pagination state hook |
| `backend/app/services/medline_exporter.py` | MEDLINE/RIS/CSV formatters |

## Files to Modify (Part 3)

| File | Changes |
|------|---------|
| `frontend/app/query/page.tsx` | Add pagination, export, continue to review |
| `frontend/lib/api.ts` | Add export and prepare-review methods |
| `backend/app/api/models/schemas.py` | Add pagination and export schemas |
| `backend/app/api/routes/query.py` | Add export and prepare-for-review endpoints |
| `backend/app/services/pubmed_service.py` | Add pagination support and export formatters |

---

## Implementation Order (Part 3)

| Step | Description | Dependencies |
|------|-------------|--------------|
| 12 | Add pagination to backend PubMed search | None |
| 13 | Create ResultsPagination component | Step 12 |
| 14 | Add article selection state | None |
| 15 | Create ExportDialog component | Step 14 |
| 16 | Add MEDLINE export endpoint | None |
| 17 | Create ContinueToReview component | Step 14 |
| 18 | Add prepare-for-review endpoint | None |
| 19 | Connect Query → Review navigation | Steps 17, 18 |

---

## Complete Implementation Order (All Parts)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ PART 1: Professional Report Format (Steps 1-5)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Add new schemas (QueryStrategy, ConceptAnalysis, ToolboxFilter)          │
│ 2. Update AI prompt for professional report format                           │
│ 3. Update ai_service.generate_pubmed_query() for new format                  │
│ 4. Update QueryGenerateResponse schema                                       │
│ 5. Update frontend to render professional report                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PART 2: UI/UX Components (Steps 6-11)                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 6. Create StrategyCard component                                             │
│ 7. Create ConceptTable component                                             │
│ 8. Create ToolboxAccordion component                                         │
│ 9. Create WorkflowProgress component                                         │
│ 10. Create ProjectContextBar component                                       │
│ 11. Integrate all components into Query page                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PART 3: Results & Review Integration (Steps 12-19)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 12. Add pagination to backend PubMed search                                  │
│ 13. Create ResultsPagination component                                       │
│ 14. Add article selection state                                              │
│ 15. Create ExportDialog component                                            │
│ 16. Add MEDLINE export endpoint                                              │
│ 17. Create ContinueToReview component                                        │
│ 18. Add prepare-for-review endpoint                                          │
│ 19. Connect Query → Review navigation                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Updated Approval Checklist (Complete)

### Part 1: Professional Report Format
- [ ] פורמט הדוח המקצועי מאושר
- [ ] 3 אסטרטגיות חיפוש מאושרות
- [ ] Toolbox עם 15+ פילטרים מאושר

### Part 2: UI/UX Design
- [ ] עיצוב UI/UX מאושר
- [ ] זרימת עבודה (Define → Query → Review) מאושרת
- [ ] רכיבי UI חדשים מאושרים
- [ ] עיצוב מובייל מאושר

### Part 3: Search Results & Review Integration
- [ ] עימוד תוצאות (Pagination) מאושר
- [ ] ייצוא MEDLINE מאושר
- [ ] אינטגרציה עם כלי Review מאושרת
- [ ] 3 מצבי סקירה (GEMS) מאושרים

### General
- [ ] סדר השלבים מאושר
- [ ] מוכנים להתחיל

**Status: PLAN COMPLETE - AWAITING APPROVAL**

---

# Part 4: GEMS Integration & PICOS Builder

## GEMS v3.1 System Overview

GEMS (Guided Evidence Mapping & Screening) is a path-adaptive guidance system for study screening with three core workflows:

### Path Matrix

| Review Type | Goal | Key Study Types | Auto Exclusions |
|-------------|------|-----------------|-----------------|
| **Systematic Review** | Answer specific PICO question | Primary Studies (RCTs, Cohort, Case-Control) | Reviews, Case Reports, Opinions, Animal |
| **Scoping Review** | Map all existing literature | Everything (incl. Reviews, Case Reports) | Duplicates, Retracted only |
| **Quick Clinical Answer** | Rapid strongest evidence | SR, Meta-Analyses, RCTs | Weak evidence, Non-peer reviewed |

### Screening Statistics (Expected Impact)

| Criterion | Avg. Use % | Result Reduction |
|-----------|------------|------------------|
| Human studies only | 95% | 15-25% |
| Animal/in-vitro exclusion | 92% | 10-20% |
| Letter/editorial exclusion | 88% | 5-15% |
| RCTs only | 45% | 50-70% |
| English only | 75% | 10-30% |
| Last 10 years | 60% | 30-50% |

---

## PICOS Framework Builder

### Component Structure

```typescript
interface PICOSCriteria {
  // P - Population
  population: {
    ageGroups: ('adults' | 'children' | 'elderly' | 'all')[];
    sex: 'all' | 'female' | 'male';
    specialConditions?: string[];  // e.g., "pregnant", "HIV+", "transplant"
    exclusions?: string[];  // e.g., "pediatrics", "geriatrics"
  };

  // I - Intervention
  intervention: {
    entity: string;  // Main intervention term
    mustAppearInAbstract: boolean;
    excludeSurgical?: boolean;
  };

  // C - Comparator
  comparator: {
    required: boolean;
    type?: 'placebo' | 'active' | 'standard_care' | 'any';
    entity?: string;  // Comparison term
  };

  // O - Outcome
  outcome: {
    entity?: string;  // Outcome term
    requiresQuantitative: boolean;
    acceptsQualitative: boolean;
    minimumFollowUp?: string;  // e.g., "6 months"
    excludeDiagnostics?: boolean;
  };

  // S - Study Design
  studyDesign: {
    humanOnly: boolean;
    allowedTypes: StudyType[];
    excludeTypes: StudyType[];
    qualityPack: boolean;  // "Basic Quality Pack" exclusions
  };
}

type StudyType =
  | 'rct'
  | 'cohort'
  | 'case_control'
  | 'systematic_review'
  | 'meta_analysis'
  | 'case_report'
  | 'case_series'
  | 'narrative_review'
  | 'editorial'
  | 'letter'
  | 'conference_abstract';
```

### PICOS Builder UI

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PICOS Eligibility Criteria Builder                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Review Mode: [Systematic Review ▼]                                         │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  P - POPULATION                                                    [Edit]   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Age Groups:  [✓] Adults (18+)  [ ] Children  [ ] Elderly  [ ] All  │   │
│  │  Sex:         (●) All  ( ) Female only  ( ) Male only               │   │
│  │                                                                      │   │
│  │  Special Conditions: [Add condition...]                              │   │
│  │  ┌────────────────┐ ┌────────────────┐                              │   │
│  │  │ Diabetes Type 2│ │ × Pregnant    │                              │   │
│  │  └────────────────┘ └────────────────┘                              │   │
│  │                                                                      │   │
│  │  Exclusions:                                                        │   │
│  │  [ ] Exclude Pediatrics  [✓] Exclude Rare Subpopulations            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  I - INTERVENTION                                                  [Edit]   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Main Intervention: [Metformin                               ]      │   │
│  │                                                                      │   │
│  │  [✓] Must appear in title/abstract                                  │   │
│  │  [ ] Exclude surgical interventions                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  C - COMPARATOR                                                    [Edit]   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  [✓] Requires comparison group                                      │   │
│  │                                                                      │   │
│  │  Comparison Type:                                                   │   │
│  │  ( ) Placebo  (●) Active comparator  ( ) Standard of care  ( ) Any  │   │
│  │                                                                      │   │
│  │  Comparator Entity: [Sulfonylureas                           ]      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  O - OUTCOME                                                       [Edit]   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Primary Outcome: [HbA1c reduction                           ]      │   │
│  │                                                                      │   │
│  │  [✓] Requires quantitative reporting (p-values, effect sizes)       │   │
│  │  [ ] Accepts qualitative results                                    │   │
│  │  [✓] Exclude diagnostic accuracy studies                            │   │
│  │                                                                      │   │
│  │  Minimum Follow-up: [3 months ▼]                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  S - STUDY DESIGN                                                  [Edit]   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  [✓] Human studies only (exclude animal/in-vitro)                   │   │
│  │                                                                      │   │
│  │  Include Study Types:                                               │   │
│  │  [✓] RCTs  [✓] Cohort  [ ] Case-Control  [ ] Case Reports          │   │
│  │                                                                      │   │
│  │  ▼ Basic Quality Pack (Auto-Exclusions)                             │   │
│  │    [✓] Letters/Correspondence                                       │   │
│  │    [✓] Editorials/Opinions                                          │   │
│  │    [✓] Non-peer reviewed (Preprints)                                │   │
│  │    [✓] Retracted articles                                           │   │
│  │    [✓] Conference abstracts only                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  ┌──────────────────┐              ┌────────────────────────────────┐      │
│  │ ← Back to Query  │              │  Start Screening with GEMS →   │      │
│  └──────────────────┘              └────────────────────────────────┘      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Criteria Library (Backend)

### Database Schema for Criteria

```python
# New table: screening_criteria
class ScreeningCriteria(BaseModel):
    """Stored eligibility criteria for a project"""
    id: UUID
    project_id: UUID
    review_mode: str  # "systematic" | "scoping" | "quick"

    # PICOS components
    population_criteria: Dict[str, Any]
    intervention_criteria: Dict[str, Any]
    comparator_criteria: Dict[str, Any]
    outcome_criteria: Dict[str, Any]
    study_design_criteria: Dict[str, Any]

    # Metadata
    created_at: datetime
    updated_at: datetime
```

### Criteria Codes Library

```python
# backend/app/core/gems/criteria_library.py

POPULATION_CRITERIA = {
    "P1": {"code": "P1", "label": "Adults (18+)", "query_filter": "adult[mh]"},
    "P2": {"code": "P2", "label": "Children (0-18)", "query_filter": "child[mh] OR adolescent[mh]"},
    "P3": {"code": "P3", "label": "Women only", "query_filter": "female[mh]"},
    "P4": {"code": "P4", "label": "Men only", "query_filter": "male[mh]"},
    "P5": {"code": "P5", "label": "All ages", "query_filter": None},
    "P-Ex1": {"code": "P-Ex1", "label": "Exclude Pediatrics", "exclude": True},
    "P-Ex2": {"code": "P-Ex2", "label": "Exclude Geriatrics", "exclude": True},
    "P-Ex3": {"code": "P-Ex3", "label": "Exclude Pregnant Women", "exclude": True},
}

INTERVENTION_CRITERIA = {
    "I1": {"code": "I1", "label": "Mention Intervention in abstract", "required": True},
    "I2": {"code": "I2", "label": "Mention Outcome in abstract", "required": True},
    "I3": {"code": "I3", "label": "Both entities must appear", "strict": True},
    "I-Ex1": {"code": "I-Ex1", "label": "Exclude Surgical", "exclude": True},
}

COMPARATOR_CRITERIA = {
    "C1": {"code": "C1", "label": "Requires Control Group", "required": True},
    "C2": {"code": "C2", "label": "Requires Placebo", "type": "placebo"},
    "C3": {"code": "C3", "label": "Requires Active Comparator", "type": "active"},
}

OUTCOME_CRITERIA = {
    "O1": {"code": "O1", "label": "Quantitative Reporting", "required": True},
    "O2": {"code": "O2", "label": "Accepts Qualitative", "accepts_qual": True},
    "O3": {"code": "O3", "label": "Minimum Follow-up Required", "min_followup": True},
    "O-Ex1": {"code": "O-Ex1", "label": "Exclude Diagnostics", "exclude": True},
}

STUDY_DESIGN_CRITERIA = {
    "S1": {"code": "S1", "label": "Human Studies Only", "exclude_animal": True},
    "S2": {"code": "S2", "label": "RCTs Only", "types": ["rct"]},
    "S3": {"code": "S3", "label": "Clinical Studies", "types": ["rct", "cohort", "case_control"]},
    "S4": {"code": "S4", "label": "Include Systematic Reviews", "types": ["systematic_review", "meta_analysis"]},
    "S5": {"code": "S5", "label": "Include Case Reports", "types": ["case_report", "case_series"]},
    "S-Ex1": {"code": "S-Ex1", "label": "Exclude Animal/In-vitro", "exclude": True},
    "S-Ex2": {"code": "S-Ex2", "label": "Exclude Letters", "exclude": True},
    "S-Ex3": {"code": "S-Ex3", "label": "Exclude Editorials", "exclude": True},
    "S-Ex4": {"code": "S-Ex4", "label": "Exclude Conference Abstracts", "exclude": True},
    "S-Ex5": {"code": "S-Ex5", "label": "Exclude Narrative Reviews", "exclude": True},
    "S-Ex6a": {"code": "S-Ex6a", "label": "Exclude Case Reports", "exclude": True},
    "S-Ex9": {"code": "S-Ex9", "label": "Exclude Non-Peer Reviewed", "exclude": True},
    "S-Ex10": {"code": "S-Ex10", "label": "Exclude Retracted", "exclude": True},
}

# Basic Quality Pack - Default exclusions
BASIC_QUALITY_PACK = ["S-Ex2", "S-Ex3", "S-Ex9", "S-Ex10", "S-Ex11"]
```

---

## Path-Adaptive Defaults

### Systematic Review Defaults

```python
SYSTEMATIC_REVIEW_DEFAULTS = {
    "review_mode": "systematic",
    "study_design": {
        "humanOnly": True,
        "allowedTypes": ["rct", "cohort", "case_control"],
        "excludeTypes": ["systematic_review", "meta_analysis", "narrative_review",
                        "case_report", "case_series", "editorial", "letter"],
        "qualityPack": True
    },
    "comparator": {
        "required": True
    },
    "outcome": {
        "requiresQuantitative": True
    }
}
```

### Scoping Review Defaults

```python
SCOPING_REVIEW_DEFAULTS = {
    "review_mode": "scoping",
    "study_design": {
        "humanOnly": False,  # May include animal for some scoping reviews
        "allowedTypes": ["all"],  # Include everything
        "excludeTypes": [],  # Only retracted/duplicates
        "qualityPack": False  # Don't auto-exclude
    },
    "comparator": {
        "required": False
    },
    "outcome": {
        "requiresQuantitative": False,
        "acceptsQualitative": True
    }
}
```

### Quick Clinical Answer Defaults

```python
QUICK_ANSWER_DEFAULTS = {
    "review_mode": "quick",
    "study_design": {
        "humanOnly": True,
        "allowedTypes": ["systematic_review", "meta_analysis", "rct"],
        "excludeTypes": ["case_report", "case_series", "editorial", "letter",
                        "narrative_review", "conference_abstract"],
        "qualityPack": True
    },
    "dateFilter": "last_5_years",
    "prioritize": "strongest_evidence"
}
```

---

## GEMS Screening Process Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          GEMS Screening Pipeline                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STAGE 0: Input                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  • Receive articles from Query Tool (PMIDs or MEDLINE file)         │   │
│  │  • Parse and validate MEDLINE format                                 │   │
│  │  • Extract: PMID, Title, Abstract, Authors, PT, MeSH, Language       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│  STAGE 1: Rule-Based Pre-Screening (Automated)                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Apply hard exclusions based on PICOS criteria:                      │   │
│  │  • Publication Type (PT) filtering                                   │   │
│  │  • Language filtering (LA)                                           │   │
│  │  • Date filtering (DP)                                               │   │
│  │  • Basic Quality Pack exclusions                                     │   │
│  │                                                                      │   │
│  │  Output: Excluded articles with reason codes                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│  STAGE 2: AI-Assisted Screening                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  For remaining articles, AI evaluates:                               │   │
│  │  • Population match (P criteria)                                     │   │
│  │  • Intervention relevance (I criteria)                               │   │
│  │  • Comparator presence (C criteria) - if required                    │   │
│  │  • Outcome reporting (O criteria)                                    │   │
│  │                                                                      │   │
│  │  AI Decision: INCLUDE / EXCLUDE / MAYBE                              │   │
│  │  + Reasoning for each decision                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│  STAGE 3: Human Validation (Systematic Review only)                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  • Present AI decisions to human reviewer                            │   │
│  │  • Allow override with reason                                        │   │
│  │  • Calculate inter-rater reliability (AI vs Human)                   │   │
│  │  • Flag conflicts for resolution                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│  STAGE 4: Results & Reporting                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  • PRISMA flow diagram data                                          │   │
│  │  • Included/Excluded counts with reasons                             │   │
│  │  • Export options (MEDLINE, CSV, Excel)                              │   │
│  │  • Quick Answer: AI synthesis of findings                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Backend Endpoints (Part 4)

### Save Screening Criteria

```python
@router.post("/review/criteria")
async def save_screening_criteria(
    project_id: UUID,
    criteria: PICOSCriteria,
    review_mode: str,
    current_user: UserPayload = Depends(get_current_user)
):
    """Save PICOS criteria for a project's screening"""
    return await db_service.save_screening_criteria(
        project_id=str(project_id),
        review_mode=review_mode,
        criteria=criteria.dict()
    )
```

### Get Default Criteria by Mode

```python
@router.get("/review/criteria/defaults/{mode}")
async def get_default_criteria(
    mode: str,  # "systematic" | "scoping" | "quick"
    current_user: UserPayload = Depends(get_current_user)
):
    """Get default PICOS criteria for a review mode"""
    defaults = {
        "systematic": SYSTEMATIC_REVIEW_DEFAULTS,
        "scoping": SCOPING_REVIEW_DEFAULTS,
        "quick": QUICK_ANSWER_DEFAULTS
    }
    return defaults.get(mode, SYSTEMATIC_REVIEW_DEFAULTS)
```

### Start GEMS Screening

```python
@router.post("/review/screen")
async def start_gems_screening(
    project_id: UUID,
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Start GEMS screening process.
    Uses saved criteria for the project.
    """
    # Get project and criteria
    project = await db_service.get_project(project_id)
    criteria = await db_service.get_screening_criteria(project_id)

    # Get pending abstracts
    abstracts = await db_service.get_abstracts(
        project_id=str(project_id),
        status="pending"
    )

    # Stage 1: Rule-based pre-screening
    rule_results = await gems_service.apply_rule_based_screening(
        abstracts=abstracts,
        criteria=criteria
    )

    # Stage 2: AI screening for remaining
    remaining = [a for a in abstracts if a["pmid"] not in rule_results["excluded"]]
    ai_results = await gems_service.apply_ai_screening(
        abstracts=remaining,
        criteria=criteria,
        framework_data=project.get("framework_data", {})
    )

    # Save results
    await db_service.update_screening_results(project_id, {
        "rule_excluded": rule_results,
        "ai_decisions": ai_results
    })

    return {
        "total": len(abstracts),
        "rule_excluded": len(rule_results["excluded"]),
        "ai_screened": len(remaining),
        "ai_included": ai_results["included_count"],
        "ai_excluded": ai_results["excluded_count"],
        "ai_maybe": ai_results["maybe_count"]
    }
```

---

## Files to Create (Part 4)

| File | Purpose |
|------|---------|
| `backend/app/core/gems/criteria_library.py` | PICOS criteria definitions |
| `backend/app/core/gems/defaults.py` | Path-adaptive defaults |
| `backend/app/core/gems/screening.py` | GEMS screening logic |
| `backend/app/services/gems_service.py` | GEMS service (AI + rules) |
| `frontend/components/review/PICOSBuilder.tsx` | PICOS criteria builder UI |
| `frontend/components/review/ReviewModeSelector.tsx` | Mode selection (3 paths) |
| `frontend/components/review/CriteriaSection.tsx` | Single PICOS section component |
| `frontend/components/review/QualityPackToggle.tsx` | Basic Quality Pack toggle |
| `frontend/hooks/usePICOSCriteria.ts` | PICOS state management |

## Files to Modify (Part 4)

| File | Changes |
|------|---------|
| `frontend/app/review/page.tsx` | Add PICOS Builder before screening |
| `backend/app/api/routes/review.py` | Add criteria endpoints |
| `backend/app/api/models/schemas.py` | Add PICOS schemas |
| `docs/schema.sql` | Add screening_criteria table |

---

## Implementation Order (Part 4)

| Step | Description | Dependencies |
|------|-------------|--------------|
| 20 | Create criteria_library.py with all codes | None |
| 21 | Create defaults.py with path defaults | Step 20 |
| 22 | Add screening_criteria table to DB | None |
| 23 | Create gems_service.py | Steps 20, 21 |
| 24 | Add criteria endpoints to review.py | Steps 22, 23 |
| 25 | Create PICOSBuilder component | None |
| 26 | Create ReviewModeSelector component | None |
| 27 | Integrate PICOS Builder into Review page | Steps 25, 26 |
| 28 | Connect frontend to criteria endpoints | Steps 24, 27 |

---

## Complete Implementation Order (All 4 Parts)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ PART 1: Professional Report Format (Steps 1-5)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1-5: Schemas, AI prompt, service, response, frontend                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PART 2: UI/UX Components (Steps 6-11)                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 6-11: StrategyCard, ConceptTable, Toolbox, Workflow, Integration             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PART 3: Results & Review Integration (Steps 12-19)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 12-19: Pagination, Export, ContinueToReview, Navigation                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PART 4: GEMS & PICOS Builder (Steps 20-28)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 20-28: Criteria library, DB, GEMS service, PICOS UI, Integration             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Total Steps: 28**

---

## Final Approval Checklist

### Part 1: Professional Report Format

- [ ] פורמט הדוח המקצועי מאושר
- [ ] 3 אסטרטגיות חיפוש מאושרות
- [ ] Toolbox עם 15+ פילטרים מאושר

### Part 2: UI/UX Design

- [ ] עיצוב UI/UX מאושר
- [ ] זרימת עבודה (Define → Query → Review) מאושרת
- [ ] רכיבי UI חדשים מאושרים
- [ ] עיצוב מובייל מאושר

### Part 3: Search Results & Review Integration

- [ ] עימוד תוצאות (Pagination) מאושר
- [ ] ייצוא MEDLINE מאושר
- [ ] אינטגרציה עם כלי Review מאושרת
- [ ] 3 מצבי סקירה (GEMS) מאושרים

### Part 4: GEMS & PICOS Builder

- [ ] PICOS Builder UI מאושר
- [ ] ספריית קריטריונים (Criteria Library) מאושרת
- [ ] Path-Adaptive Defaults מאושרים
- [ ] GEMS Screening Pipeline מאושר
- [ ] טבלת screening_criteria מאושרת

### General

- [ ] סדר השלבים הכולל (28 צעדים) מאושר
- [ ] מוכנים להתחיל

**Status: FULL PLAN COMPLETE - AWAITING FINAL APPROVAL**
