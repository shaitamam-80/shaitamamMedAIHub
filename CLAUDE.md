# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MedAI Hub** is an AI-powered systematic literature review platform for medical researchers. It helps researchers formulate research questions, generate PubMed search queries, and screen abstracts using AI.

### Tech Stack

- **Backend**: FastAPI (Python 3.11) + Google Gemini AI (via LangChain)
- **Frontend**: Next.js 15 (TypeScript) + Tailwind CSS + Shadcn UI
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth (JWT)
- **Deployment**: Railway (backend) + Vercel (frontend)

### Live URLs

- **Frontend**: https://shaitamam.com
- **Backend API**: https://api.shaitamam.com
- **API Docs**: https://api.shaitamam.com/api/docs (DEBUG mode only)

---

## Development Commands

### Backend (FastAPI)

```bash
cd backend
.\venv\Scripts\Activate.ps1  # Windows
# source venv/bin/activate   # Mac/Linux

pip install -r requirements.txt
python main.py               # Runs on http://localhost:8000
pytest                       # Run tests
```

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev                  # Runs on http://localhost:3000
npm run build               # Production build
npx tsc --noEmit            # Type check
```

### Database Setup

1. Go to Supabase Dashboard → SQL Editor
2. Run `docs/schema.sql` to create tables
3. (Optional) Run `docs/rls_policies.sql` to enable Row Level Security

---

## Architecture

### Three-Tool System

1. **Define Tool** (`/define`): AI chat to formulate research questions using frameworks (PICO, CoCoPop, PEO, SPIDER, SPICE, ECLIPSE, FINER, PFO, PICOT, PICOC)
2. **Query Tool** (`/query`): Generates PubMed boolean search queries from framework data
3. **Review Tool** (`/review`): Upload MEDLINE files, AI screens abstracts for relevance

### Backend Structure

```
backend/
├── main.py                     # FastAPI app, CORS, routes
├── app/
│   ├── api/
│   │   ├── models/
│   │   │   ├── schemas.py      # Pydantic models + FRAMEWORK_SCHEMAS
│   │   │   └── frameworks.py   # Typed framework models (PICO, PEO, SPIDER, etc.)
│   │   └── routes/
│   │       ├── projects.py     # CRUD for projects
│   │       ├── define.py       # Chat + framework extraction
│   │       ├── query.py        # Query generation
│   │       └── review.py       # File upload + screening
│   ├── core/
│   │   ├── config.py           # Settings from .env + cache config
│   │   ├── auth.py             # Supabase JWT validation
│   │   └── prompts/
│   │       └── shared.py       # AI prompts + framework schemas
│   └── services/
│       ├── ai_service.py       # Gemini AI (singleton)
│       ├── database.py         # Supabase client (singleton)
│       ├── cache_service.py    # Memory/Redis cache (singleton)
│       ├── mesh_service.py     # MeSH term lookup + caching
│       └── medline_parser.py   # MEDLINE file parser
```

### Frontend Structure

```
frontend/
├── app/
│   ├── page.tsx               # Home page
│   ├── layout.tsx             # Root layout with sidebar
│   ├── define/page.tsx        # Define tool (chat + form)
│   ├── query/page.tsx         # Query generator
│   ├── review/page.tsx        # Abstract screening
│   ├── projects/page.tsx      # Project management
│   └── auth/
│       ├── login/page.tsx     # Login form
│       └── callback/route.ts  # OAuth callback
├── components/
│   ├── sidebar/               # Navigation sidebar
│   └── ui/                    # Shadcn components
├── contexts/
│   └── auth-context.tsx       # Auth state provider
└── lib/
    ├── api.ts                 # Axios client with auth interceptor
    ├── supabase.ts            # Supabase client (singleton)
    └── utils.ts               # Tailwind cn() utility
```

---

## Key Patterns

### Authentication Flow

1. User logs in via Supabase Auth (email/password or OAuth)
2. Frontend stores JWT in Supabase session
3. `api.ts` interceptor adds `Authorization: Bearer {token}` to all requests
4. Backend `auth.py` validates JWT with Supabase `/auth/v1/user` endpoint
5. Protected routes use `Depends(get_current_user)`

### Service Layer Pattern

- `ai_service` (singleton): All Gemini AI calls
- `db_service` (singleton): All Supabase operations
- `cache_service` (singleton): MeSH term caching (Memory/Redis)
- `mesh_service` (singleton): NCBI MeSH API lookups
- Routes never access DB/AI directly

### Dynamic Framework System

```python
# Backend defines schemas in app/core/prompts/shared.py
FRAMEWORK_SCHEMAS = {
    "PICO": {"components": ["P","I","C","O"], "labels": {...}},
    ...
}
# Frontend renders whatever backend provides - no hardcoding
```

### API Client (Frontend)

```typescript
// lib/api.ts - Axios with auto auth
const client = axios.create({ baseURL: API_URL });
client.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) {
    config.headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  return config;
});
```

---

## API Reference

### Authentication

All `/api/v1/*` endpoints require JWT token:

```
Authorization: Bearer <token>
```

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/projects` | Create project |
| GET | `/api/v1/projects` | List user's projects |
| GET | `/api/v1/projects/{id}` | Get project |
| PATCH | `/api/v1/projects/{id}` | Update project |
| DELETE | `/api/v1/projects/{id}` | Delete project (CASCADE) |

**Create Project Request:**

```json
{
  "name": "My Research Project",
  "description": "Optional description",
  "framework_type": "PICO"
}
```

### Define Tool

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/define/frameworks` | Get framework schemas |
| POST | `/api/v1/define/chat` | Chat with AI |
| GET | `/api/v1/define/conversation/{id}` | Get chat history |

**Chat Request:**

```json
{
  "project_id": "uuid",
  "message": "I want to study exercise for depression in elderly",
  "framework_type": "PICO"
}
```

**Chat Response:**

```json
{
  "message": "I understand you want to study...",
  "framework_data": {
    "P": "Elderly patients with depression",
    "I": "Exercise",
    "C": "Standard care",
    "O": "Depression symptoms"
  },
  "finer_assessment": {
    "F": {"score": "high", "reason": "Large elderly population available for recruitment"},
    "I": {"score": "high", "reason": "Depression in elderly is a major public health concern"},
    "N": {"score": "medium", "reason": "Adds to existing evidence on exercise interventions"},
    "E": {"score": "high", "reason": "Low-risk intervention with minimal ethical concerns"},
    "R": {"score": "high", "reason": "Results could inform clinical guidelines"},
    "overall": "proceed",
    "suggestions": ["Consider specifying exercise type (aerobic, resistance, etc.)"]
  }
}
```

### Query Tool

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/query/generate` | Generate PubMed query |
| GET | `/api/v1/query/history/{id}` | Get query history |

### Review Tool

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/review/upload` | Upload MEDLINE file (multipart/form-data) |
| GET | `/api/v1/review/files/{id}` | Get uploaded files |
| GET | `/api/v1/review/abstracts/{id}` | Get abstracts (?status=pending) |
| POST | `/api/v1/review/analyze` | Start AI screening |
| PATCH | `/api/v1/review/abstracts/{id}` | Update decision |

### Error Responses

```json
{
  "detail": "Error message here"
}
```

| Code | Description |
|------|-------------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Server Error |

---

## Database Schema

### Entity Relationship

```
projects (1) ──┬── (N) files ──── (N) abstracts
               ├── (N) chat_messages
               ├── (N) query_strings
               └── (N) analysis_runs
```

### Tables

#### projects

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Project name |
| description | TEXT | Optional |
| framework_type | VARCHAR(50) | PICO, CoCoPop, PEO, etc. |
| framework_data | JSONB | Dynamic fields |
| user_id | UUID | Owner |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Auto-trigger |

#### files

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | FK → projects |
| filename | VARCHAR(255) | Original name |
| file_path | TEXT | Storage path |
| file_size | BIGINT | Bytes |
| file_type | VARCHAR(50) | MEDLINE, CSV |
| status | VARCHAR(50) | uploaded/processing/completed/error |
| uploaded_at | TIMESTAMPTZ | Auto |

#### abstracts

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | FK → projects |
| file_id | UUID | FK → files |
| pmid | VARCHAR(20) | PubMed ID (unique) |
| title | TEXT | Article title |
| abstract | TEXT | Abstract text |
| authors | TEXT | Author list |
| journal | VARCHAR(255) | Journal name |
| publication_date | DATE | Pub date |
| keywords | TEXT[] | Array |
| status | VARCHAR(20) | pending/included/excluded/maybe |
| decision | VARCHAR(20) | AI decision |
| ai_reasoning | TEXT | AI explanation |
| human_decision | VARCHAR(20) | Override |
| screened_at | TIMESTAMPTZ | When screened |
| metadata | JSONB | Extra MEDLINE fields |

#### chat_messages

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | FK → projects |
| role | VARCHAR(20) | user/assistant/system |
| content | TEXT | Message |
| created_at | TIMESTAMPTZ | Auto |

#### query_strings

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | FK → projects |
| query_text | TEXT | Boolean query |
| query_type | VARCHAR(50) | boolean/mesh/advanced |
| created_at | TIMESTAMPTZ | Auto |

#### analysis_runs

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | FK → projects |
| tool | VARCHAR(20) | DEFINE/QUERY/REVIEW |
| status | VARCHAR(50) | pending/running/completed/failed |
| started_at | TIMESTAMPTZ | Start |
| completed_at | TIMESTAMPTZ | End |
| results | JSONB | Results |
| error_message | TEXT | Error if failed |

### Indexes

```sql
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_abstracts_project_id ON abstracts(project_id);
CREATE INDEX idx_abstracts_pmid ON abstracts(pmid);
CREATE INDEX idx_abstracts_status ON abstracts(status);
```

### Cascade Deletes

All FK use `ON DELETE CASCADE` - deleting project removes all related data.

### Row Level Security (Optional)

Run `docs/rls_policies.sql` to enable user-level data isolation. Backend uses `service_role` key which bypasses RLS.

---

## Environment Variables

### Backend `.env`

```env
GOOGLE_API_KEY=your_key           # From aistudio.google.com
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...               # Anon key
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Service role (bypasses RLS)
DEBUG=True                        # Enable /api/docs

# Cache Settings (optional)
REDIS_URL=                        # e.g., redis://localhost:6379 (uses memory cache if empty)
CACHE_TTL_DAYS=30                 # MeSH term cache TTL
CACHE_MAX_SIZE=10000              # Max in-memory cache entries

# NCBI Settings (optional)
NCBI_API_KEY=                     # From ncbi.nlm.nih.gov/account/settings
NCBI_EMAIL=your@email.com         # Required by NCBI for identification
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Production (Railway)

```env
GOOGLE_API_KEY=...
SUPABASE_URL=https://yronyapjuaswetrmotuk.supabase.co
SUPABASE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...     # Must start with "eyJ" (no spaces!)
DEBUG=False
```

---

## Common Tasks

### Add New Framework

1. Add to `FRAMEWORK_SCHEMAS` in `backend/app/core/prompts/shared.py`
2. Frontend auto-renders (no changes needed)

### Add API Endpoint

1. Create route in `backend/app/api/routes/`
2. Add Pydantic models in `schemas.py`
3. Register in `main.py`
4. Add method in `lib/api.ts`

### Add UI Component

```bash
npx shadcn-ui@latest add [component]
```

### Reset Database

```sql
-- Drop all tables
DROP TABLE IF EXISTS query_strings CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS abstracts CASCADE;
DROP TABLE IF EXISTS analysis_runs CASCADE;
DROP TABLE IF EXISTS files CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- Then run docs/schema.sql
```

---

## Deployment

### Railway (Backend)

- Auto-deploys from `main` branch
- Uses `Dockerfile` in `/backend` directory
- Environment variables in Railway dashboard
- Builder: Dockerfile (not Railpack/Nixpacks)

### Vercel (Frontend)

- Auto-deploys from `main` branch
- Environment variables in Vercel dashboard
- Domain: shaitamam.com

---

## Troubleshooting

### 500 Error on API

1. Check Railway logs for actual error
2. Verify `SUPABASE_SERVICE_ROLE_KEY` has no extra spaces
3. Test connection: `GET /health`

### Auth Issues

1. Check Supabase Auth settings
2. Verify redirect URLs in Supabase dashboard
3. Check browser console for CORS errors

### AI Not Responding

1. Check `GOOGLE_API_KEY` quota
2. Gemini may return malformed JSON - check logs
3. Rate limiting may kick in on heavy usage

### Database Errors

1. Verify `docs/schema.sql` was run
2. Check Supabase project is not paused
3. Service role key must match exactly

---

## Recent Changes Log

### 2025-12-02 (Session 2) - Infrastructure: Caching, Type Safety, Testing

#### Persistent Caching System

New `backend/app/services/cache_service.py`:

- **Cache Interface Pattern**: Abstract `CacheInterface` with pluggable implementations
- **MemoryCache (default)**: LRU-like eviction, TTL support, no dependencies
- **RedisCache**: Auto-enabled when `REDIS_URL` is set, scalable for production
- **30-day TTL**: MeSH terms update annually, safe to cache for extended periods

```python
# Automatic selection based on environment
from app.services.cache_service import get_cache, mesh_cache_key

cache = get_cache()  # Returns MemoryCache or RedisCache
key = mesh_cache_key("diabetes mellitus")
await cache.set(key, data, ttl=timedelta(days=30))
```

#### Typed Framework Models

New `backend/app/api/models/frameworks.py`:

- **Pydantic models**: `PICOData`, `PEOData`, `SPIDERData`, `PICOTData`, `CoCoPoPData`, `GenericFrameworkData`
- **Key normalization**: `@model_validator` converts full-word keys (e.g., "population" → "P")
- **Type union**: `FrameworkDataUnion` for type-safe framework handling

```python
from app.api.models.schemas import PICOData, framework_to_dict

# Accepts both formats
pico = PICOData(population="Adults", intervention="Exercise", outcome="Health")
pico = PICOData(P="Adults", I="Exercise", O="Health")

# Always outputs single-letter keys
dict_data = framework_to_dict(pico)  # {"P": "Adults", "I": "Exercise", "O": "Health"}
```

#### MeSH Service Caching Integration

Updated `backend/app/services/mesh_service.py`:

- **Serialization**: Added `to_dict()`/`from_dict()` to `ExpandedTerms` dataclass
- **Cache integration**: Uses `cache_service` for persistent MeSH term storage
- **Graceful degradation**: Cache errors are logged but don't break the service
- **Statistics**: New `get_cache_stats()` method for monitoring

#### Configuration Updates

Updated `backend/app/core/config.py`:

```python
REDIS_URL: Optional[str] = None      # Auto-enables Redis cache
CACHE_TTL_DAYS: int = 30             # MeSH term TTL
CACHE_MAX_SIZE: int = 10000          # Memory cache max entries
```

#### Comprehensive Testing

New test files:

| File | Coverage |
|------|----------|
| `test_cache_service.py` | MemoryCache, key generation, factory, integration |
| `test_mesh_service.py` | Error paths (timeout, network, HTTP), caching, expansion |
| `test_ai_service.py` | Error paths (timeout, quota, Hebrew), fallback mechanisms |

Test results: **172 passed, 1 skipped**

**Files Created/Modified**:

- `backend/app/api/models/frameworks.py` (NEW)
- `backend/app/services/cache_service.py` (NEW)
- `backend/app/services/mesh_service.py` (UPDATED - cache integration)
- `backend/app/api/models/schemas.py` (UPDATED - imports)
- `backend/app/core/config.py` (UPDATED - cache settings)
- `backend/requirements.txt` (UPDATED - redis dependency)
- `backend/tests/test_cache_service.py` (NEW)
- `backend/tests/test_mesh_service.py` (NEW)
- `backend/tests/test_ai_service.py` (UPDATED - error path tests)
- `backend/tests/test_database_service.py` (FIXED - property access)

---

### 2025-12-02 (Session 1) - Query Tool V2: Advanced Query Engine

#### Split Query Logic for Comparison Questions

**Problem**: Standard AND logic `(P AND I AND C AND O)` misses studies that only mention one intervention.

**Solution**: Implemented Split Query Logic for PICO comparison questions:

```text
(P AND I AND O) OR (P AND C AND O)
```

This captures:

- Studies comparing Intervention vs Comparator directly
- Studies of Intervention alone
- Studies of Comparator alone

**Implementation** (`backend/app/services/query_builder.py`):

1. **Detection**: Checks if framework has populated C (Comparison) component
2. **Strategy A (Comprehensive)**: Uses split structure `(P AND I AND O) OR (P AND C AND O)`
3. **Strategy B (Direct Comparison)**: Uses full AND `P AND I AND C AND O` for head-to-head studies
4. **Strategy C (Clinical Filtered)**: Focused + validated hedge + animal exclusion

**Example Output** (for GAD/CBT vs SSRIs question):

```text
(
  ("Anxiety Disorders"[Mesh] OR "generalized anxiety"[tiab] OR GAD[tiab])
  AND
  ("Cognitive Behavioral Therapy"[Mesh] OR CBT[tiab])
  AND
  ("Treatment Outcome"[Mesh] OR "anxiety symptoms"[tiab])
)
OR
(
  ("Anxiety Disorders"[Mesh] OR "generalized anxiety"[tiab] OR GAD[tiab])
  AND
  ("Serotonin Uptake Inhibitors"[Mesh] OR SSRI*[tiab] OR benzodiazepine*[tiab])
  AND
  ("Treatment Outcome"[Mesh] OR "anxiety symptoms"[tiab])
)
```

#### MeSH Expansion Service

New `backend/app/services/mesh_service.py`:

- **MeSH Lookup**: NCBI E-utilities API for term validation
- **Entry Terms**: Extracts synonyms from MeSH thesaurus
- **Query Variants**:
  - `[Mesh]` - With explosion (includes narrower terms)
  - `[Majr]` - Major topic only
  - `[tiab]` - Title/abstract free-text
- **Fallback**: Uses original term in quotes if MeSH lookup fails

#### Query Builder Service

New `backend/app/services/query_builder.py`:

- **Programmatic query building** (no AI needed for basic queries)
- **Three strategies**: Comprehensive, Direct/Focused, Clinical Filtered
- **15+ Toolbox Filters**: Age, Article Type, Date, Language, Study Design
- **Framework-specific logic**: 20+ frameworks supported (PICO, PEO, SPIDER, etc.)

#### Validated Methodological Hedges

`backend/app/core/prompts/query.py` includes:

| Hedge | Use Case | Source |
|-------|----------|--------|
| RCT_COCHRANE | Intervention questions | Cochrane HSSS |
| OBSERVATIONAL_SIGN | Exposure/etiology | SIGN |
| PROGNOSIS_HAYNES | Prognosis questions | McMaster |
| DIAGNOSIS_HAYNES | Diagnostic accuracy | McMaster |
| QUALITATIVE_WONG | Qualitative research | Wong Filter |
| PREVALENCE_FILTER | Epidemiology | Cochrane |

#### API Response V2

`QueryGenerateResponseV2` structure:

```typescript
{
  report_intro: string;           // Markdown intro with methodology
  concepts: ConceptAnalysisV2[];  // MeSH + free-text for each component
  strategies: {
    comprehensive: QueryStrategy; // High sensitivity (split for comparison)
    direct: QueryStrategy;        // High precision (head-to-head)
    clinical: QueryStrategy;      // With hedge + animal exclusion
  };
  toolbox: ToolboxFilter[];       // 15+ pre-built filters
  formatted_report: string;       // Complete markdown report

  // Legacy compatibility
  queries: { broad, focused, clinical_filtered };
  message: string;

  // Transparency
  translation_status?: TranslationStatus;
  warnings: QueryWarning[];
}
```

#### Frontend Components

New components in `frontend/components/query/`:

- `StrategyCard.tsx` - Displays strategy with formula, query, expected yield
- `ConceptTable.tsx` - MeSH terms and free-text analysis table
- `ToolboxAccordion.tsx` - Expandable filter categories
- `ResultsPagination.tsx` - Search result pagination

#### Tests Added

New `backend/tests/test_query_builder.py`:

- Split Query Logic tests (14 tests total)
- Direct Comparison strategy tests
- Clinical Filtered strategy tests
- Toolbox generation tests
- Legacy compatibility tests
- Edge case handling

**Files Modified**:

- `backend/app/services/query_builder.py` - Split Query implementation
- `backend/app/services/mesh_service.py` - Fallback for empty MeSH
- `backend/tests/test_query_builder.py` - New test file

---

### 2025-11-30 (Session 2) - Query Tool Hebrew Translation Fix

#### Branch Reorganization

- Renamed branches to human-readable names: `develop` (development) and `main` (production)
- Deleted old auto-generated branch names (`claude/code-review-senior-*`, `claude/scaffold-medai-hub-*`)
- Set GitHub default branch to `develop`
- Updated Railway deployment to use `develop` branch

#### Query Tool - Hebrew to English Translation

**Problem**: Framework data (P, I, C, O) was displaying in Hebrew in the Query Tool, but PubMed requires English queries.

**Solution**: Implemented multi-layer Hebrew translation and validation:

1. **Batch Translation** (`_translate_framework_data`):
   - Translates all Hebrew fields in ONE API call for performance
   - Explicit instruction: "Do NOT include any Hebrew characters"
   - Falls back to field-by-field translation if batch fails

2. **Single Field Translation** (`_force_translate_single`):
   - Dedicated method for stubborn Hebrew fields
   - Used as fallback when batch translation misses fields
   - 10-second timeout per field

3. **Final Query Validation**:
   - Checks generated queries for Hebrew characters
   - If Hebrew detected, auto-generates clean English fallback query
   - Logs error for debugging

**Files Modified**:

- `backend/app/services/ai_service.py` - Translation methods and validation
- `backend/app/api/routes/query.py` - Added translation call in `get_research_questions`

#### Performance Optimizations

- Reduced retry attempts from 3 to 2 for faster failure
- Added 25-second timeout for query generation
- Added 10-second timeout for single field translation
- Batch translation (one API call instead of 4)

#### Fallback Query Generation

Added `_generate_fallback_query()` method that creates proper PubMed queries when AI fails:

- Maps framework keys to population, intervention, comparison, outcome roles
- Generates Boolean queries with proper `[tiab]` tags
- Used automatically on timeout, parse error, or Hebrew detection

### 2025-11-30 (Session 1)

- Fixed Railway deployment (switched from Railpack to Dockerfile)
- Added lazy initialization for `ai_service` and `db_service` to avoid build-time env var issues
- Added default empty values for required env vars (`GOOGLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`) for Docker build
- Updated database constraint to support additional frameworks: PFO, PICOT, PICOC
- Removed temporary debug endpoint `/debug/env`
- Removed Research Framework selection from project creation form (AI auto-detects framework type)
- **Added FINER Assessment**: AI now evaluates research questions using FINER criteria (Feasible, Interesting, Novel, Ethical, Relevant) when a complete question is formulated

### 2024-11-27

- Fixed Supabase connection (service role key had extra space)
- Removed debug endpoint `/debug/config`
- Cleaned up old PRD files and design artifacts
- Consolidated all docs into CLAUDE.md
- Added test files structure

### Schema Changes

- `ProjectResponse.id` and `user_id` changed from UUID to str (Supabase compatibility)
- `framework_data` relaxed to `Any` type for legacy data support
- `valid_framework_type` constraint updated to include: PICO, CoCoPop, PEO, SPIDER, SPICE, ECLIPSE, FINER, PFO, PICOT, PICOC

---

## File Reference

| Purpose | File |
|---------|------|
| Main entry | `backend/main.py` |
| Settings | `backend/app/core/config.py` |
| Auth | `backend/app/core/auth.py` |
| AI Service | `backend/app/services/ai_service.py` |
| DB Service | `backend/app/services/database.py` |
| Cache Service | `backend/app/services/cache_service.py` |
| Query Builder | `backend/app/services/query_builder.py` |
| MeSH Service | `backend/app/services/mesh_service.py` |
| PubMed Service | `backend/app/services/pubmed_service.py` |
| Schemas | `backend/app/api/models/schemas.py` |
| Framework Models | `backend/app/api/models/frameworks.py` |
| Framework prompts | `backend/app/core/prompts/shared.py` |
| Query prompts | `backend/app/core/prompts/query.py` |
| Dockerfile | `backend/Dockerfile` |
| API Client | `frontend/lib/api.ts` |
| Supabase Client | `frontend/lib/supabase.ts` |
| Auth Context | `frontend/contexts/auth-context.tsx` |
| Define Page | `frontend/app/define/page.tsx` |
| Query Page | `frontend/app/query/page.tsx` |
| Query Components | `frontend/components/query/` |
| DB Schema | `docs/schema.sql` |
| RLS Policies | `docs/rls_policies.sql` |
