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
│   │   │   └── schemas.py      # Pydantic models + FRAMEWORK_SCHEMAS
│   │   └── routes/
│   │       ├── projects.py     # CRUD for projects
│   │       ├── define.py       # Chat + framework extraction
│   │       ├── query.py        # Query generation
│   │       └── review.py       # File upload + screening
│   ├── core/
│   │   ├── config.py           # Settings from .env
│   │   ├── auth.py             # Supabase JWT validation
│   │   └── prompts/
│   │       └── shared.py       # AI prompts + framework schemas
│   └── services/
│       ├── ai_service.py       # Gemini AI (singleton)
│       ├── database.py         # Supabase client (singleton)
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

### 2025-11-30

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
| Schemas | `backend/app/api/models/schemas.py` |
| Framework prompts | `backend/app/core/prompts/shared.py` |
| Dockerfile | `backend/Dockerfile` |
| API Client | `frontend/lib/api.ts` |
| Supabase Client | `frontend/lib/supabase.ts` |
| Auth Context | `frontend/contexts/auth-context.tsx` |
| Define Page | `frontend/app/define/page.tsx` |
| DB Schema | `docs/schema.sql` |
| RLS Policies | `docs/rls_policies.sql` |
