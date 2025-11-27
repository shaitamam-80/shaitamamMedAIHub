# PRD: Backend Services (AI & Database)

## General Information

| Field | Value |
|-------|-------|
| **Module Name** | Backend Services |
| **Files** | `app/services/ai_service.py`, `app/services/database.py` |
| **Priority** | P0 - Critical |
| **Status** | Implemented (v1.0) |
| **Version** | 1.0 |

---

## 1. Overview

### 1.1 Purpose

The Services layer provides a clean abstraction between API routes and external services (Google Gemini AI, Supabase Database). All AI operations and database queries go through these singleton services.

### 1.2 Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         API Routes Layer                             │
│  projects.py │ define.py │ query.py │ review.py                     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Services Layer                               │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐  │
│  │         ai_service          │  │       db_service            │  │
│  │  (Singleton Instance)       │  │  (Singleton Instance)       │  │
│  └──────────────┬──────────────┘  └──────────────┬──────────────┘  │
│                 │                                 │                  │
└─────────────────┼─────────────────────────────────┼──────────────────┘
                  │                                 │
                  ▼                                 ▼
┌─────────────────────────────┐  ┌─────────────────────────────────┐
│      Google Gemini AI       │  │    Supabase PostgreSQL          │
│  - gemini-2.5-flash (Pro)   │  │    - projects                   │
│  - gemini-2.5-flash (Flash) │  │    - files                      │
│  via LangChain              │  │    - abstracts                  │
└─────────────────────────────┘  │    - chat_messages              │
                                 │    - query_strings              │
                                 │    - analysis_runs              │
                                 └─────────────────────────────────┘
```

---

## 2. AI Service

### 2.1 Module Information

| Field | Value |
|-------|-------|
| **File** | `backend/app/services/ai_service.py` |
| **Class** | `AIService` |
| **Instance** | `ai_service` (global singleton) |
| **Provider** | Google Gemini via LangChain |

### 2.2 Model Configuration

| Model | Setting | Usage |
|-------|---------|-------|
| `gemini_pro` | `GEMINI_PRO_MODEL` | Batch analysis, complex reasoning |
| `gemini_flash` | `GEMINI_FLASH_MODEL` | Chat, quick extraction |

#### Current Default Models

```python
# backend/app/core/config.py
GEMINI_PRO_MODEL: str = "gemini-2.5-flash"
GEMINI_FLASH_MODEL: str = "gemini-2.5-flash"
MAX_TOKENS: int = 8192
TEMPERATURE: float = 0.7
```

### 2.3 Methods

#### `chat_for_define()`

```python
async def chat_for_define(
    self,
    message: str,
    conversation_history: List[Dict[str, str]],
    framework_type: str,
    language: str = "en"
) -> Dict[str, Any]:
    """
    Handle chat interaction for the Define tool.

    Args:
        message: User's message
        conversation_history: Previous conversation
        framework_type: PICO, CoCoPop, etc.
        language: "en" or "he"

    Returns:
        {
            "chat_response": "AI response text...",
            "framework_data": {"P": "...", "I": "...", ...}
        }
    """
```

**Process Flow:**

1. Build system prompt with framework schema and language
2. Convert history to LangChain message format
3. Invoke Gemini Flash model
4. Parse hybrid JSON response
5. Return chat response + extracted data

---

#### `extract_framework_data()`

```python
async def extract_framework_data(
    self,
    conversation: List[Dict[str, str]],
    framework_type: str
) -> Dict[str, Any]:
    """
    Extract structured framework data from conversation.

    Args:
        conversation: Full conversation history
        framework_type: Framework name

    Returns:
        Dictionary with extracted framework fields
    """
```

**Use Case:** When explicit extraction needed outside of chat flow.

---

#### `generate_pubmed_query()`

```python
async def generate_pubmed_query(
    self,
    framework_data: Dict[str, Any],
    framework_type: str
) -> Dict[str, Any]:
    """
    Generate comprehensive PubMed search strategy.

    Args:
        framework_data: Extracted framework fields
        framework_type: Framework name

    Returns:
        {
            "message": "Markdown explanation...",
            "concepts": [
                {
                    "concept_number": 1,
                    "component": "P (Population)",
                    "free_text_terms": ["term1[tiab]", ...],
                    "mesh_terms": ["\"MeSH Term\"[Mesh]", ...]
                }
            ],
            "queries": {
                "broad": "Full query...",
                "focused": "Full query...",
                "clinical_filtered": "Full query..."
            },
            "toolbox": [
                {"label": "Limit to 5 Years", "query": "AND..."}
            ],
            "framework_type": "PICO",
            "framework_data": {...}
        }
    """
```

**Process Flow:**

1. Build system prompt with query logic and hedges
2. Format framework data as markdown
3. Invoke Gemini Flash model
4. Parse JSON response with robust extraction
5. Return complete query strategy

---

#### `analyze_abstract_batch()`

```python
async def analyze_abstract_batch(
    self,
    abstracts: List[Dict[str, Any]],
    criteria: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Analyze abstracts for inclusion/exclusion.

    Args:
        abstracts: List of abstracts with pmid, title, abstract
        criteria: Inclusion criteria (from framework_data)

    Returns:
        [
            {
                "pmid": "12345678",
                "decision": "include",
                "reasoning": "Relevant RCT..."
            }
        ]
    """
```

**Process Flow:**

1. Build prompt with criteria and abstract list
2. Invoke Gemini Pro model (better reasoning)
3. Parse JSON array response
4. Return decisions with reasoning

---

### 2.4 Helper Methods

#### `_extract_json()`

```python
def _extract_json(
    self,
    text: str,
    find_object: bool = True
) -> Optional[Dict[str, Any]]:
    """
    Robustly extract JSON from AI response text.

    Args:
        text: Response text that may contain JSON
        find_object: True for {...}, False for [...]

    Returns:
        Parsed JSON or None
    """
```

**Logic:**

1. Find first `{` and last `}` (or `[` / `]`)
2. Extract substring
3. Parse with `json.loads()`
4. Fall back to parsing entire text
5. Return `None` on failure

---

## 3. Database Service

### 3.1 Module Information

| Field | Value |
|-------|-------|
| **File** | `backend/app/services/database.py` |
| **Class** | `DatabaseService` |
| **Instance** | `db_service` (global singleton) |
| **Provider** | Supabase (PostgreSQL) |

### 3.2 Connection Configuration

```python
# Uses service role key for server-side operations
key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY
self.client = create_client(settings.SUPABASE_URL, key)
```

### 3.3 Methods by Entity

#### Projects

```python
async def create_project(project_data: Dict) -> Dict
async def get_project(project_id: UUID) -> Optional[Dict]
async def update_project(project_id: UUID, update_data: Dict) -> Dict
async def list_projects(user_id: str, limit: int = 100) -> List[Dict]
```

#### Files

```python
async def create_file(file_data: Dict) -> Dict
async def get_file(file_id: UUID) -> Optional[Dict]
async def get_files_by_project(project_id: UUID) -> List[Dict]
```

#### Chat Messages

```python
async def save_message(message_data: Dict) -> Dict
async def get_conversation(project_id: UUID, limit: int = 50) -> List[Dict]
async def clear_conversation(project_id: UUID) -> bool
```

#### Abstracts

```python
async def create_abstract(abstract_data: Dict) -> Dict
async def get_abstract(abstract_id: UUID) -> Optional[Dict]
async def bulk_create_abstracts(abstracts_data: List[Dict]) -> List[Dict]
async def get_abstracts_by_project(project_id: UUID, status: str = None) -> List[Dict]
async def update_abstract_decision(abstract_id: UUID, decision_data: Dict) -> Dict
```

#### Analysis Runs

```python
async def create_analysis_run(run_data: Dict) -> Dict
async def update_analysis_run(run_id: UUID, update_data: Dict) -> Dict
async def get_analysis_runs_by_project(project_id: UUID) -> List[Dict]
```

#### Query Strings

```python
async def save_query_string(query_data: Dict) -> Dict
async def get_query_strings_by_project(project_id: UUID) -> List[Dict]
```

---

### 3.4 Query Patterns

#### Select with Filter

```python
response = (
    self.client.table("abstracts")
    .select("*")
    .eq("project_id", str(project_id))
    .eq("status", status)  # Optional
    .order("created_at", desc=False)
    .execute()
)
return response.data or []
```

#### Insert

```python
response = (
    self.client.table("projects")
    .insert(project_data)
    .execute()
)
return response.data[0] if response.data else None
```

#### Update

```python
response = (
    self.client.table("projects")
    .update(update_data)
    .eq("id", str(project_id))
    .execute()
)
return response.data[0] if response.data else None
```

#### Delete

```python
self.client.table("chat_messages").delete().eq(
    "project_id", str(project_id)
).execute()
```

#### Bulk Insert

```python
response = (
    self.client.table("abstracts")
    .insert(abstracts_data)  # List of dicts
    .execute()
)
return response.data or []
```

---

## 4. Prompts Module

### 4.1 Structure

```
backend/app/core/prompts/
├── __init__.py          # Exports all prompts
├── shared.py            # Framework schemas, utilities
├── define.py            # Define tool prompts
└── query.py             # Query tool prompts, hedges
```

### 4.2 Framework Schemas

```python
# backend/app/core/prompts/shared.py

FRAMEWORK_SCHEMAS = {
    "PICO": {
        "name": "PICO",
        "description": "Population, Intervention, Comparison, Outcome",
        "use_case": "Intervention effectiveness questions",
        "components": ["P", "I", "C", "O"],
        "labels": {
            "P": "Population",
            "I": "Intervention",
            "C": "Comparison",
            "O": "Outcome"
        },
        "trigger_words": ["effectiveness", "efficacy", "better than"]
    },
    # ... 17+ frameworks
}
```

### 4.3 Validated Hedges

```python
# backend/app/core/prompts/query.py

VALIDATED_HEDGES = {
    "RCT_COCHRANE": {
        "name": "Cochrane HSSS (RCTs)",
        "citation": "Lefebvre C, et al. Cochrane Handbook 2019",
        "query": "(randomized controlled trial[pt] OR...)",
        "use_case": "RCTs for PICO intervention questions"
    },
    # ... more hedges
}

FRAMEWORK_QUERY_LOGIC = {
    "PICO": {
        "logic": "Relaxed Boolean - OR within concepts, AND between",
        "hedge": "RCT_COCHRANE",
        "formula": {...}
    },
    # ... per-framework logic
}
```

---

## 5. Configuration

### 5.1 Settings Module

```python
# backend/app/core/config.py

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "MedAI Hub"
    DEBUG: bool = False

    # Google Gemini
    GOOGLE_API_KEY: str  # Required
    GEMINI_PRO_MODEL: str = "gemini-2.5-flash"
    GEMINI_FLASH_MODEL: str = "gemini-2.5-flash"

    # Supabase
    SUPABASE_URL: str  # Required
    SUPABASE_KEY: str  # Required
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None

    # AI Settings
    MAX_TOKENS: int = 8192
    TEMPERATURE: float = 0.7
    BATCH_SIZE: int = 10

    # File Upload
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: set = {".txt", ".medline", ".csv"}
    UPLOAD_DIR: str = "uploads"

    class Config:
        env_file = ".env"
```

---

## 6. Rate Limiting & Concurrency (v2.0 - Critical)

### 6.1 Gemini API Rate Limits

**Problem:** When sending large batch analyses (50+ abstracts), concurrent requests to Gemini can trigger `429 Too Many Requests` errors.

#### Google Gemini Rate Limits (Free Tier)

| Model | RPM (Requests Per Minute) | TPM (Tokens Per Minute) |
|-------|---------------------------|-------------------------|
| gemini-2.5-flash | 15 | 1,000,000 |
| gemini-1.5-pro | 2 | 32,000 |

### 6.2 Required Implementation: Semaphore/Queue

```python
import asyncio
from typing import List, Dict, Any

class AIService:
    def __init__(self):
        # Limit concurrent Gemini requests
        self._semaphore = asyncio.Semaphore(5)  # Max 5 concurrent requests
        self._request_delay = 0.5  # Seconds between requests

    async def _rate_limited_request(self, coro):
        """Wrapper to enforce rate limiting."""
        async with self._semaphore:
            result = await coro
            await asyncio.sleep(self._request_delay)
            return result

    async def analyze_abstract_batch(
        self,
        abstracts: List[Dict[str, Any]],
        criteria: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Analyze abstracts with rate limiting.
        """
        # Split into smaller sub-batches if needed
        SUB_BATCH_SIZE = 5  # Max abstracts per API call

        all_results = []
        for i in range(0, len(abstracts), SUB_BATCH_SIZE):
            sub_batch = abstracts[i:i + SUB_BATCH_SIZE]

            # Rate-limited API call
            result = await self._rate_limited_request(
                self._analyze_sub_batch(sub_batch, criteria)
            )
            all_results.extend(result)

        return all_results
```

### 6.3 Retry Logic with Exponential Backoff

```python
import asyncio
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

class AIService:

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        retry=retry_if_exception_type(RateLimitError)
    )
    async def _call_gemini(self, messages):
        """Call Gemini with automatic retry on rate limit."""
        try:
            return await self.gemini_flash.ainvoke(messages)
        except Exception as e:
            if "429" in str(e) or "rate" in str(e).lower():
                raise RateLimitError(str(e))
            raise
```

### 6.4 Configuration Settings

```python
# backend/app/core/config.py

class Settings(BaseSettings):
    # Rate Limiting
    GEMINI_MAX_CONCURRENT: int = 5          # Max parallel requests
    GEMINI_REQUEST_DELAY: float = 0.5       # Seconds between requests
    GEMINI_RETRY_ATTEMPTS: int = 3          # Retry on 429
    GEMINI_RETRY_MIN_WAIT: int = 2          # Min seconds for backoff
    GEMINI_RETRY_MAX_WAIT: int = 30         # Max seconds for backoff
    BATCH_SUB_SIZE: int = 5                 # Abstracts per API call
```

---

## 7. Error Handling

### 7.1 AI Service Errors

| Error | Handling |
|-------|----------|
| JSON parse failure | Return fallback structure |
| API timeout | Propagate to route |
| Rate limit (429) | Retry with exponential backoff |
| Invalid response | Return empty data |

### 7.2 Database Errors

| Error | Handling |
|-------|----------|
| Not found | Return `None` |
| Constraint violation | Propagate exception |
| Connection error | Propagate exception |

---

## 7. Development Tasks

### 7.1 Implemented

- [x] AI Service singleton
- [x] Gemini model integration
- [x] Chat for Define
- [x] Framework extraction
- [x] Query generation
- [x] Batch analysis
- [x] Database service singleton
- [x] All CRUD operations
- [x] Bulk insert support

### 8.2 Tasks v2.0 (Critical - Rate Limiting)

- [ ] **SVC-T006**: Implement asyncio.Semaphore for concurrent request limiting
- [ ] **SVC-T007**: Add exponential backoff retry with tenacity library
- [ ] **SVC-T008**: Split batch analysis into sub-batches of 5
- [ ] **SVC-T009**: Add rate limit configuration to Settings
- [ ] **SVC-T010**: Handle 429 errors gracefully with user feedback

### 8.3 Tasks for Later

- [ ] **SVC-T001**: Add request caching for AI
- [ ] **SVC-T002**: Add connection pooling for DB
- [ ] **SVC-T003**: Add query logging
- [ ] **SVC-T004**: Add metrics collection

---

## 9. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12 | Initial implementation |
| 2.0 | 2024-12 | Added Rate Limiting & Concurrency requirements |
