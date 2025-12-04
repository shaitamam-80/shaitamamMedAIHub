# Query Tool V2 - Architecture & Logic Documentation

## Overview

The Query Tool generates optimized PubMed search queries from structured framework data (PICO, PEO, SPIDER, etc.). It uses a multi-layered approach combining MeSH term expansion, free-text variations, and validated methodological hedges.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
│  QueryBuilderScreen.tsx → QueryBlockEditor.tsx → API calls      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend API (FastAPI)                         │
│                  /api/v1/query/analyze-concepts                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      QueryBuilder Service                        │
│              backend/app/services/query_builder.py               │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Strategy A  │  │  Strategy B  │  │  Strategy C  │          │
│  │Comprehensive │  │   Focused    │  │  Clinical    │          │
│  │  (Broad)     │  │ (Precision)  │  │  (Filtered)  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       MeSH Service                               │
│               backend/app/services/mesh_service.py               │
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────────┐            │
│  │ Local DB   │  │ NCBI API   │  │ Cache Service  │            │
│  │ (Supabase) │  │ (Fallback) │  │ (Memory/Redis) │            │
│  └────────────┘  └────────────┘  └────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Files

| File | Purpose |
|------|---------|
| `backend/app/services/query_builder.py` | Main query building logic, strategies |
| `backend/app/services/mesh_service.py` | MeSH term expansion, synonyms |
| `backend/app/core/search_config.py` | Generic terms list, drug class expansions, toolbox filters |
| `backend/app/core/prompts/query.py` | Validated hedges (Cochrane, SIGN, etc.) |
| `backend/app/api/routes/query.py` | API endpoints |

---

## Query Building Pipeline

### Step 1: Framework Data Input
```json
{
  "P": "Adults with generalized anxiety disorder",
  "I": "Cognitive behavioral therapy",
  "C": "SSRIs",
  "O": "Anxiety symptoms reduction"
}
```

### Step 2: Term Expansion (MeSH Service)

For each framework component, the MeSH Service expands terms:

```python
# Example: "Cognitive behavioral therapy"
ExpandedTerms(
    original_term="Cognitive behavioral therapy",
    mesh_terms=[
        MeSHTerm(descriptor_name="Cognitive Behavioral Therapy", ...)
    ],
    entry_terms=["CBT", "Cognitive Therapy", "Behavior Therapy"],
    free_text_terms=['"Cognitive behavioral therapy"', "CBT*"]
)
```

#### Expansion Rules:

1. **Generic Terms Skip MeSH** (defined in `search_config.py`)
   - Terms like "efficacy", "outcome", "safety" skip MeSH lookup
   - Reason: MeSH brings irrelevant results (e.g., "Vaccine Efficacy" for "Efficacy")
   - These use only `[tiab]` free-text search

2. **Drug Class Expansion**
   - "SSRIs" → Fluoxetine, Paroxetine, Sertraline, Citalopram, Escitalopram, Fluvoxamine
   - Clinical trials often use specific drug names, not class names

3. **Long Sentence Guardrail**
   - Terms > 5 words are rejected as likely natural language sentences
   - These won't match anything in PubMed

### Step 3: Concept Block Generation

Each component becomes a `ConceptBlock`:

```python
ConceptBlock(
    key="P",
    label="Population",
    original_terms=["Adults with generalized anxiety disorder"],
    mesh_terms=[...],
    free_text_terms=[...],
    entry_terms=[...]
)
```

#### Query Generation Methods:

**`to_broad_query()`** - High Sensitivity
```
("Anxiety Disorders"[Mesh] OR "generalized anxiety"[tiab] OR GAD[tiab])
```

**`to_focused_query()`** - High Precision
```
"Anxiety Disorders"[Majr]
```

### Step 4: Strategy Assembly

---

## Three Query Strategies

### Strategy A: Comprehensive Search (High Sensitivity)

**Purpose**: Capture maximum relevant studies, minimize false negatives

**Formula**: `P AND (I OR C) AND O`

**Logic**:
- Uses `to_broad_query()` for all components
- Combines I and C with OR (Outcome-OR model)
- Best for systematic reviews where missing studies is unacceptable

**Code** (`query_builder.py:560-579`):
```python
# Combine I and C into single block with OR
intervention_combined = ""
if i_block and c_block:
    intervention_combined = f"({i_block} OR {c_block})"
else:
    intervention_combined = i_block or c_block

# Strategy A: Comprehensive
parts = [p for p in [p_broad, intervention_combined, o_broad] if p]
comprehensive_query = " AND ".join(parts)
```

---

### Strategy B: Focused Search (High Precision)

**Purpose**: Find highly relevant studies, minimize noise

**Formula**:
- Standard: `P[Majr] AND (I OR C)[Majr/Ti] AND O[Mesh/tiab]`
- Comparison: `P[Majr] AND I[tiab] AND C[tiab] AND O[Mesh/tiab]`

**Key Design Decision - O[Mesh/tiab] instead of O[Majr]**:

> **Problem**: Indexers don't always mark Outcomes as Major Topic (`[Majr]`).
> Using `O[Majr]` causes false negatives - studies about outcomes aren't captured.
>
> **Solution**: Always use `o_broad` (which generates `[Mesh]` + `[tiab]`) for Outcomes,
> even in the "focused" strategy.

**Code** (`query_builder.py:581-604`):
```python
# Strategy B: Direct/Focused (High Precision)
# NOTE: Use o_broad (not o_focused) to avoid [majr] restriction on Outcomes
if has_comparison and p_focused and i_focused and c_focused and o_broad:
    focused_query = f"{p_focused} AND {i_focused} AND {c_focused} AND {o_broad}"
    focused_formula = "P[majr] AND I[tiab] AND C[tiab] AND O[Mesh/tiab]"
elif p_focused and intervention_focused_combined and o_broad:
    focused_query = f"{p_focused} AND {intervention_focused_combined} AND {o_broad}"
    focused_formula = "P[Majr] AND (I OR C)[Majr/Ti] AND O[Mesh/tiab]"
```

---

### Strategy C: Clinical Filtered (Validated Hedge)

**Purpose**: High-quality evidence with methodological filter

**Formula**: `Comprehensive + Validated Hedge`

**Key Design Decisions**:

1. **Use Comprehensive as Base (not Focused)**
   > **Problem**: Focused query + Hedge = "double cutting" → zero results
   > The hedge already filters aggressively, so we need broader base.

   ```python
   base_query = comprehensive_query if comprehensive_query else focused_query
   ```

2. **No Duplicate Animal Filter**
   > **Problem**: Cochrane hedge already contains `NOT (animals[mh] NOT humans[mh])`.
   > Adding another causes duplicate filters in output.

   ```python
   if "animals[mh]" not in clinical_query.lower() and "animals[mesh]" not in clinical_query.lower():
       clinical_query += " NOT (animals[Mesh] NOT humans[Mesh])"
   ```

**Validated Hedges** (from `query.py`):

| Hedge | Use Case | Source |
|-------|----------|--------|
| `RCT_COCHRANE` | Intervention questions | Cochrane HSSS |
| `OBSERVATIONAL_SIGN` | Exposure/etiology | SIGN |
| `PROGNOSIS_HAYNES` | Prognosis questions | McMaster |
| `DIAGNOSIS_HAYNES` | Diagnostic accuracy | McMaster |
| `QUALITATIVE_WONG` | Qualitative research | Wong Filter |
| `PREVALENCE_FILTER` | Epidemiology | Cochrane |

---

## MeSH Service Details

### `to_broad_query()` - Deduplication & Quoting

```python
def to_broad_query(self) -> str:
    parts = []
    seen_terms = set()  # Prevent duplicates

    # 1. MeSH Terms (Highest Priority)
    for mesh in self.mesh_terms:
        parts.append(mesh.to_mesh_query("default"))
        seen_terms.add(mesh.descriptor_name.lower())

    # 2. Free Text Terms (skip if already in MeSH)
    for term in self.free_text_terms:
        term_lower = clean_term.replace('"', '').lower()
        if term_lower in seen_terms:
            continue
        # Quote multi-word phrases
        if " " in clean_term and not clean_term.startswith('"'):
            parts.append(f'"{clean_term}"[tiab]')
        else:
            parts.append(f'{clean_term}[tiab]')
        seen_terms.add(term_lower)

    # 3. Entry Terms (max 8)
    # ... similar logic
```

### Generic Terms Configuration

`backend/app/core/search_config.py`:

```python
GENERIC_TERMS_NO_MESH = {
    # Outcome-related
    "efficacy", "effectiveness", "effect", "outcome", "result",
    "improvement", "reduction", "change", "benefit", "impact",

    # Quality/safety
    "safety", "quality", "risk", "adverse", "side effect",

    # Time-related
    "long-term", "short-term", "duration", "follow-up",

    # Comparison
    "comparison", "versus", "compared", "difference",
}
```

### Drug Class Expansions

```python
DRUG_CLASS_EXPANSIONS = {
    "ssri": ["Fluoxetine", "Paroxetine", "Sertraline", "Citalopram", "Escitalopram"],
    "snri": ["Venlafaxine", "Duloxetine", "Desvenlafaxine"],
    "benzodiazepine": ["Diazepam", "Lorazepam", "Alprazolam", "Clonazepam"],
    # ... more classes
}
```

---

## Caching System

### Architecture

```
┌─────────────────┐     ┌─────────────────┐
│  Memory Cache   │ OR  │   Redis Cache   │
│  (Default)      │     │  (Production)   │
└─────────────────┘     └─────────────────┘
         │                      │
         └──────────┬───────────┘
                    │
         ┌──────────▼──────────┐
         │   Cache Interface   │
         │  - get(key)         │
         │  - set(key, value)  │
         │  - delete(key)      │
         └─────────────────────┘
```

**Configuration** (`config.py`):
```python
REDIS_URL: Optional[str] = None      # Auto-enables Redis if set
CACHE_TTL_DAYS: int = 30             # MeSH terms TTL
CACHE_MAX_SIZE: int = 10000          # Memory cache max entries
```

**MeSH Cache Key Format**:
```python
def mesh_cache_key(term: str) -> str:
    return f"mesh:v1:{term.lower().strip()}"
```

---

## API Response Structure

```python
class QueryGenerateResponseV2:
    # Main content
    report_intro: str                    # Markdown intro
    concepts: List[ConceptAnalysisV2]    # MeSH expansion details
    strategies: StrategyCollection       # 3 strategies
    toolbox: List[ToolboxFilter]         # Pre-built filters
    formatted_report: str                # Complete markdown

    # Legacy compatibility
    queries: Dict[str, str]              # broad, focused, clinical_filtered
    message: str                         # Summary message

    # Transparency
    translation_status: TranslationStatus
    warnings: List[QueryWarning]
```

---

## Testing

**Test File**: `backend/tests/test_query_builder.py`

**Test Categories**:
1. Split Query Logic (comparison questions)
2. Direct Comparison Strategy
3. Clinical Filtered Strategy
4. Toolbox generation
5. Legacy compatibility
6. Edge cases

**Run Tests**:
```bash
cd backend
pytest tests/test_query_builder.py -v
```

---

## Key Design Decisions Log

### Decision 1: Outcome-OR Model
**Date**: 2025-12-02

**Problem**: `(P AND I AND O) OR (P AND C AND O)` produces long queries

**Solution**: Use mathematically equivalent `P AND (I OR C) AND O`

**Proof**:
```
(P ∧ I ∧ O) ∨ (P ∧ C ∧ O)
= P ∧ O ∧ (I ∨ C)           // Distributive law
= P AND (I OR C) AND O
```

---

### Decision 2: O[Mesh/tiab] for Focused Strategy
**Date**: 2025-12-04

**Problem**: `O[Majr]` too restrictive - indexers don't always mark outcomes as Major Topic

**Solution**: Use `o_broad` (Mesh + tiab) even in focused strategy

**Impact**: Better recall for outcome-related studies without sacrificing precision

---

### Decision 3: Comprehensive Base for Clinical Filtered
**Date**: 2025-12-04

**Problem**: Focused + Hedge = "double cutting" → near-zero results

**Solution**: Use `comprehensive_query` as base for Clinical Filtered

**Rationale**: Hedge already filters aggressively; broad base needed for reasonable results

---

### Decision 4: Conditional Animal Filter
**Date**: 2025-12-04

**Problem**: Cochrane hedge contains `NOT (animals[mh] NOT humans[mh])`, but code added another

**Solution**: Check if filter already present before adding

```python
if "animals[mh]" not in clinical_query.lower():
    clinical_query += " NOT (animals[Mesh] NOT humans[Mesh])"
```

---

### Decision 5: Generic Terms Skip MeSH
**Date**: 2025-12-03

**Problem**: "Efficacy" returns MeSH term "Vaccine Efficacy" - irrelevant noise

**Solution**: Maintain list of generic terms that use only `[tiab]` search

---

### Decision 6: Long Sentence Guardrail
**Date**: 2025-12-03

**Problem**: Natural language sentences (> 5 words) passed as search terms

**Solution**: Reject terms > 5 words with warning log

```python
if len(words) > self.MAX_PHRASE_WORDS:
    logger.warning(f"Term too long ({len(words)} words)")
    return []
```

---

## Troubleshooting

### Query Returns 0 Results

1. **Check Strategy C**: May be too restrictive. Try Strategy A.
2. **Check MeSH Terms**: Verify terms exist in PubMed MeSH.
3. **Check Hedge**: Some hedges are very restrictive (e.g., RCT only).

### Duplicate Terms in Query

1. **Expected**: `seen_terms` set should prevent this.
2. **Check**: Entry terms may have slight variations.

### Hebrew in Query

1. **Check**: Translation should have converted to English.
2. **Fallback**: Generate clean English query programmatically.

### Long Query (URI too long)

1. **Reduce Entry Terms**: Currently limited to 8.
2. **Use Outcome-OR**: Shorter than Split Logic.
3. **Consider**: PubMed POST search instead of GET.

---

## Future Improvements

1. **Semantic Search**: Use embeddings for concept matching
2. **Query Validation**: Check query syntax before sending to PubMed
3. **Result Count Preview**: Show estimated results per strategy
4. **Export Formats**: RIS, EndNote, CSV export options
5. **Query History**: Save and compare previous queries

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2025-12-02 | Initial V2 with 3 strategies |
| 2.1 | 2025-12-03 | Added generic terms filter, drug class expansion |
| 2.2 | 2025-12-04 | Fixed O[Majr] issue, duplicate animal filter |
