# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MedAI Hub** is an AI-powered systematic literature review platform for medical researchers. It supports the full SR workflow — from research question formulation through protocol building, screening, data extraction, risk of bias assessment, meta-analysis, GRADE assessment, and manuscript generation — using LangGraph orchestration and 12 specialized AI skill modules.

### Tech Stack

- **Backend**: FastAPI (Python 3.11) + Google Gemini AI (via LangChain) + LangGraph
- **Frontend**: Next.js 16 (TypeScript) + Tailwind CSS 4 + Shadcn/UI + Zustand
- **Database**: Supabase PostgreSQL (13 tables, RLS enabled)
- **Auth**: Supabase Auth (JWT)
- **SR Methodology**: sr-skills (private editable package — constants, prompts, fulltext service)
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
.\.venv\Scripts\Activate.ps1  # Windows
# source .venv/bin/activate   # Mac/Linux

pip install -r requirements.txt
pip install -e "C:/Users/shait/OneDrive/Desktop/Systematic Review Hub/sr-skills"  # One-time
python main.py               # Runs on http://localhost:8000
pytest                       # Run tests
```

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev                  # Runs on http://localhost:3000 (Turbopack)
npm run build               # Production build
npx tsc --noEmit            # Type check
```

### Database Setup

Schema is managed via migration files in `supabase/migrations/`:

1. `000_cleanup_old_schema.sql` — Drops legacy tables
2. `001_initial_schema.sql` — Core tables (profiles, projects, stages, conversations, messages, artifacts, shares, uploads) + RLS
3. `002_search_and_articles.sql` — Pipeline tables (search_runs, articles, screening_decisions, extractions, rob_assessments) + counter triggers + RLS

Run migrations in order via Supabase Dashboard SQL Editor.

> **Note**: `docs/schema.sql` is a simplified legacy subset (2 tables only). The real schema lives in `supabase/migrations/`.

---

## Architecture

### LangGraph Systematic Review Workflow

The core of MedAI Hub is a **LangGraph state machine** that orchestrates 7 sequential stages:

```text
START → orchestrator → [route_by_stage] → stage_node → END
```

**Stages:**

1. `research_question` — Framework selection + component extraction (PICO, CoCoPop, SPIDER, etc.)
2. `protocol` — PROSPERO-ready protocol building
3. `search` — PubMed query construction
4. `screening` — Abstract/full-text screening
5. `extraction` — Data extraction from papers
6. `synthesis` — Meta-analysis + GRADE assessment
7. `reporting` — Manuscript generation

**State** is managed via `ReviewState` TypedDict with message accumulation, artifact storage per stage, error tracking, and persistent checkpointing (PostgreSQL or in-memory fallback).

### sr-skills (Private Methodology Package)

All systematic review methodology lives in a private `sr-skills` Python package, installed as an editable dependency. **LangGraph nodes import from `sr_skills.*`** — NOT from `app/core/`.

- `sr_skills/constants/` — Deterministic logic (study designs, RoB tools, GRADE, meta-analysis, extraction templates)
- `sr_skills/prompts/` — System prompts + context builders for all 7 stages + orchestrator
- `sr_skills/fulltext/` — Async full-text availability service (PMC, Unpaywall, CORE, S2)
- `sr_skills/scripts/` — Canonical Python scripts (mesh_enrich, validate_query, fetch_fulltext)

**Import pattern in nodes:**

```python
from sr_skills.constants.rob_tools import select_rob_tool, get_domains_for_tool
from sr_skills.prompts.risk_of_bias import ROB_SYSTEM_PROMPT, get_rob_context
```

### Skills System (Chat Route)

12 skill directories under `backend/app/core/skills/`, each containing SKILL.md prompt files loaded dynamically by `skill_loader.py`. These are used by the **SSE streaming chat route** (`chat.py`) for standalone tools like article-appraisal and find-journal.

```text
article-appraisal, data-extraction, find-journal, grade-assessment,
manuscript-writer, meta-analysis, protocol-builder, pubmed-query,
pubmed-screening, research-question, risk-of-bias, systematic-review
```

> **Important distinction**: `core/skills/` feeds the chat SSE route. `sr_skills.*` feeds the LangGraph nodes. They serve different purposes.

---

### Backend Structure

```text
backend/
├── main.py                     # FastAPI app, CORS, middleware, routes
├── requirements.txt
├── Dockerfile                  # Includes sr-skills copy + install step
├── app/
│   ├── api/
│   │   ├── models/
│   │   │   ├── schemas.py      # Pydantic models + FRAMEWORK_SCHEMAS
│   │   │   └── frameworks.py   # Typed framework models (PICO, PEO, etc.)
│   │   └── routes/
│   │       ├── projects.py     # CRUD for projects
│   │       ├── define.py       # Define Tool v2 (chat + framework extraction)
│   │       ├── define_v3.py    # Define Tool v3 (wizard - migration in progress)
│   │       ├── review.py       # LangGraph SR orchestrator
│   │       ├── chat.py         # SSE streaming chat (skill-based)
│   │       └── fulltext.py     # Full-text OA checker (uses sr_skills.fulltext)
│   ├── core/
│   │   ├── config.py           # Settings from .env
│   │   ├── auth.py             # Supabase JWT validation
│   │   ├── exceptions.py       # Custom exceptions
│   │   ├── logging_config.py   # Structured JSON logging
│   │   └── skills/             # 12 SKILL.md prompt dirs (for chat route only)
│   ├── services/
│   │   ├── database.py         # Supabase CRUD operations
│   │   ├── checkpointer.py     # LangGraph state persistence (PG/memory)
│   │   └── skill_loader.py     # Dynamic skill loading (for chat route)
│   └── graph/                  # LangGraph workflow engine
│       ├── __init__.py         # Exports all nodes
│       ├── state.py            # ReviewState TypedDict + artifact types
│       ├── workflow.py         # Graph builder + routing logic
│       └── nodes/              # Stage node implementations (import from sr_skills)
│           ├── __init__.py     # Exports all 8 nodes
│           ├── research_question.py
│           ├── protocol.py
│           ├── search.py
│           ├── screening.py
│           ├── extraction.py
│           ├── risk_of_bias.py
│           ├── synthesis.py
│           └── reporting.py
```

### Frontend Structure

```text
frontend/
├── package.json               # sr-portal (Next.js 16 + React 19)
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css        # Global styles (Tailwind 4)
│   │   ├── landing/           # Public landing page
│   │   │   ├── page.tsx
│   │   │   └── LandingNav.tsx
│   │   ├── (auth)/            # Grouped auth routes
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── auth/
│   │   │   └── callback/route.ts  # OAuth callback
│   │   └── (dashboard)/       # Protected dashboard
│   │       ├── layout.tsx     # Dashboard layout with sidebar
│   │       ├── page.tsx       # Dashboard home
│   │       ├── settings/page.tsx
│   │       ├── projects/
│   │       │   ├── [projectId]/
│   │       │   │   ├── layout.tsx
│   │       │   │   ├── page.tsx
│   │       │   │   └── stages/[stageSlug]/page.tsx
│   │       │   └── new/page.tsx
│   │       └── tools/
│   │           └── [toolSlug]/page.tsx  # Dynamic tool pages
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppSidebar.tsx     # Main navigation sidebar
│   │   │   ├── TopBar.tsx
│   │   │   └── LanguageToggle.tsx
│   │   ├── chat/
│   │   │   ├── ChatInterface.tsx  # Main chat component
│   │   │   ├── ChatMessage.tsx    # Renders data blocks (extraction, rob, grade, etc.)
│   │   │   ├── ChatInput.tsx
│   │   │   ├── StreamingMessage.tsx  # SSE streaming
│   │   │   └── ArtifactCard.tsx
│   │   ├── dashboard/
│   │   │   ├── ProjectCard.tsx
│   │   │   └── StageProgress.tsx
│   │   ├── project/
│   │   │   └── ProjectSidebar.tsx
│   │   ├── stages/            # SR stage visualizations
│   │   │   ├── ExtractionTable.tsx
│   │   │   ├── GradeBadge.tsx
│   │   │   ├── ManuscriptSection.tsx
│   │   │   ├── PrismaFlowDiagram.tsx
│   │   │   ├── RobSummaryTable.tsx
│   │   │   ├── RobTrafficLight.tsx
│   │   │   └── SummaryOfFindings.tsx
│   │   ├── tools/
│   │   │   ├── ToolCard.tsx
│   │   │   ├── ToolRow.tsx
│   │   │   └── ToolPageHeader.tsx
│   │   ├── shared/
│   │   │   └── EmptyState.tsx
│   │   └── ui/                # Shadcn/UI (60+ components)
│   ├── lib/
│   │   ├── api/
│   │   │   └── backend-client.ts  # API client wrapper
│   │   ├── supabase/
│   │   │   ├── client.ts     # Client-side Supabase
│   │   │   ├── server.ts     # Server-side Supabase
│   │   │   └── middleware.ts  # Auth middleware
│   │   ├── utils/
│   │   │   ├── cn.ts         # Tailwind class merger
│   │   │   └── stage-config.ts
│   │   └── utils.ts
│   ├── hooks/
│   │   └── use-mobile.ts
│   └── middleware.ts          # Next.js middleware (auth guard)
```

---

## Key Patterns

### Authentication Flow

1. User logs in via Supabase Auth (email/password or OAuth)
2. Frontend stores JWT in Supabase session (SSR-compatible via `@supabase/ssr`)
3. API client adds `Authorization: Bearer {token}` to all requests
4. Backend `auth.py` validates JWT with Supabase `/auth/v1/user` endpoint
5. Protected routes use `Depends(get_current_user)`

### Service Layer Pattern

- `database.py` (singleton): All Supabase CRUD operations
- `checkpointer.py`: LangGraph state persistence (PostgreSQL with in-memory fallback)
- `skill_loader.py`: Dynamic loading of skill prompts from `core/skills/` (chat route only)
- Routes never access DB/AI directly — always through services
- Fulltext service instantiated from `sr_skills.fulltext.FullTextService` in route

### LangGraph Workflow Pattern

```python
# Graph: START → orchestrator → route_by_stage → [stage_node] → END
# State: ReviewState TypedDict with message accumulation
# Persistence: PostgreSQL checkpointer (or MemorySaver fallback)
# Routing: Conditional edges based on current_stage
# Imports: All nodes import methodology from sr_skills.*
```

### Dynamic Framework System

```python
# Backend defines schemas in app/api/models/schemas.py
FRAMEWORK_SCHEMAS = {
    "PICO": {"components": ["P","I","C","O"], "labels": {...}},
    ...
}
# Frontend renders whatever backend provides - no hardcoding
```

### Data Block Protocol (ChatMessage)

`ChatMessage.tsx` parses ` ```data:<type>` fenced blocks from AI responses and renders specialized components:

| Block Type | Component |
|-----------|-----------|
| `data:extraction` | ExtractionTable |
| `data:rob-traffic` | RobTrafficLight |
| `data:rob-summary` | RobSummaryTable |
| `data:sof` | SummaryOfFindings |
| `data:grade` | GradeBadge |
| `data:prisma-flow` | PrismaFlowDiagram |
| `data:manuscript-section` | ManuscriptSection |

---

## API Reference

### Authentication

All `/api/v1/*` endpoints require JWT token:

```text
Authorization: Bearer <token>
```

### Route Groups

| Tag | Prefix | Description |
| --- | ------ | ----------- |
| projects | `/api/v1/projects` | Project CRUD |
| define | `/api/v1/define` | Research question chat (v2) |
| define-v3 | `/api/v1/define` | Wizard-based formulation (v3, migration in progress) |
| review | `/api/v1/review` | LangGraph SR orchestrator |
| chat | `/api/v1/chat` | SSE streaming chat (skill-based) |
| fulltext | `/api/v1/fulltext` | Open Access full-text checker |
| health | `/`, `/health`, `/ready` | Health checks |

### Projects

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST | `/api/v1/projects` | Create project |
| GET | `/api/v1/projects` | List user's projects |
| GET | `/api/v1/projects/{id}` | Get project |
| PATCH | `/api/v1/projects/{id}` | Update project |
| DELETE | `/api/v1/projects/{id}` | Delete project (CASCADE) |

### Define Tool

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/api/v1/define/frameworks` | Get framework schemas |
| POST | `/api/v1/define/chat` | Chat with AI |
| GET | `/api/v1/define/conversation/{id}` | Get chat history |
| DELETE | `/api/v1/define/conversation/{id}` | Clear chat history |
| POST | `/api/v1/define/finer-assessment` | Evaluate research question |

### Error Responses

```json
{
  "detail": "Error message here"
}
```

| Code | Description |
| ---- | ----------- |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Server Error |

---

## Database Schema

Schema is defined in `supabase/migrations/` (run in order).

### Tables (13 total)

#### Migration 001 — Core tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (extends auth.users) — name, institution, language, role |
| `projects` | SR projects — title, review_type, framework, current_stage, progress, PRISMA counters |
| `project_stages` | 10 stages per project (auto-created) — status, skill_name, metrics, checklist |
| `conversations` | Chat sessions — linked to project/stage or standalone tool |
| `messages` | Chat messages — role, content, artifacts_generated, model_used |
| `artifacts` | Generated files — markdown, CSV, R scripts, DOCX, etc. |
| `project_shares` | Collaboration — share projects with email, access_level |
| `uploaded_files` | File uploads — MEDLINE exports, PDFs, etc. |

#### Migration 002 — Pipeline tables

| Table | Purpose |
|-------|---------|
| `search_runs` | PubMed search queries — query_string, strategy, results_count, mesh_terms |
| `articles` | Imported articles — PMID, title, abstract, authors, screening_status, fulltext |
| `screening_decisions` | Screening log — decided_by (AI/human), decision, confidence, criteria_match |
| `extractions` | Extracted data — study_design, template, population/intervention/outcomes as JSONB |
| `rob_assessments` | Risk of Bias — rob_tool, domains, overall_judgment, direction_of_bias |

### Key Design Patterns

- **UUID primary keys** everywhere (`gen_random_uuid()`)
- **JSONB** for flexible structured data (framework_data, outcomes, domains)
- **RLS enabled** on all tables — access via project ownership or shares
- **Counter triggers** — `total_records_found`, `total_screened`, `total_included`, `total_excluded` auto-updated
- **Auto-create stages** — trigger creates 10 project_stages on project INSERT
- **CASCADE deletes** — deleting project removes all related data

---

## Environment Variables

### Backend `.env`

```env
GOOGLE_API_KEY=your_key           # From aistudio.google.com
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...               # Anon key
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Service role (bypasses RLS)
DATABASE_URL=postgresql://...     # Optional: direct PG for checkpointer
NCBI_API_KEY=your_key             # Optional: PubMed (10 req/sec vs 3)
PUBMED_EMAIL=your_email           # Optional: Unpaywall + NCBI E-utils
CORE_API_KEY=your_key             # Optional: CORE.ac.uk full-text
EZPROXY_PREFIX=https://...        # Optional: institutional proxy
DEBUG=True                        # Enable /api/docs
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## Common Tasks

### Add SR Methodology (constants/prompts)

Edit in the **sr-skills** private package (Systematic Review Hub repo):
- Constants: `sr-skills/sr_skills/constants/`
- Prompts: `sr-skills/sr_skills/prompts/`
- Changes auto-reflect via editable install (no reinstall needed)

### Add Chat Skill Prompt

1. Create directory under `backend/app/core/skills/your-skill/`
2. Add SKILL.md prompt file
3. `skill_loader.py` auto-discovers it on startup

### Add API Endpoint

1. Create route in `backend/app/api/routes/`
2. Add Pydantic models in `schemas.py`
3. Register in `main.py` (`app.include_router(...)`)
4. Add method in `frontend/src/lib/api/`

### Add UI Component

```bash
cd frontend
npx shadcn@latest add [component]
```

### Add LangGraph Stage Node

1. Create node in `backend/app/graph/nodes/`
2. Add constants + prompts in sr-skills package
3. Add stage to `ReviewStage` in `state.py`
4. Register routing in `workflow.py`
5. Export in `nodes/__init__.py`

---

## Deployment

### Railway (Backend)

- Auto-deploys from `develop` branch
- Uses `Dockerfile` in `/backend` directory
- sr-skills bundled in Docker image (`COPY sr-skills/` + `pip install`)
- Environment variables in Railway dashboard

### Vercel (Frontend)

- Auto-deploys from `develop` branch
- Environment variables in Vercel dashboard
- Domain: shaitamam.com

---

## Troubleshooting

### 500 Error on API

1. Check Railway logs for actual error
2. Verify `SUPABASE_SERVICE_ROLE_KEY` has no extra spaces
3. Test connection: `GET /health?detailed=true`

### Auth Issues

1. Check Supabase Auth settings
2. Verify redirect URLs in Supabase dashboard
3. Check browser console for CORS errors

### AI Not Responding

1. Check `GOOGLE_API_KEY` quota
2. Gemini model: `gemini-2.5-flash` (configured in `config.py`)
3. Rate limiting may kick in on heavy usage

### LangGraph Checkpointer Fails

1. Check `DATABASE_URL` env var (needs direct PostgreSQL connection)
2. Falls back to in-memory `MemorySaver` automatically
3. Check startup logs for checkpointer status

### sr-skills Import Errors

1. Verify installed: `pip show sr-skills`
2. Reinstall: `pip install -e "C:/Users/shait/OneDrive/Desktop/Systematic Review Hub/sr-skills"`
3. Check the private repo has the `sr-skills/` directory

---

## File Reference

| Purpose | File |
| ------- | ---- |
| Main entry | `backend/main.py` |
| Settings | `backend/app/core/config.py` |
| Auth | `backend/app/core/auth.py` |
| DB Service | `backend/app/services/database.py` |
| Skill Loader | `backend/app/services/skill_loader.py` |
| Checkpointer | `backend/app/services/checkpointer.py` |
| Graph State | `backend/app/graph/state.py` |
| Graph Workflow | `backend/app/graph/workflow.py` |
| Graph Nodes | `backend/app/graph/nodes/` |
| Chat Skills | `backend/app/core/skills/` |
| Schemas | `backend/app/api/models/schemas.py` |
| Framework Models | `backend/app/api/models/frameworks.py` |
| Define Routes | `backend/app/api/routes/define.py` |
| Review Routes | `backend/app/api/routes/review.py` |
| Chat Routes | `backend/app/api/routes/chat.py` |
| Fulltext Routes | `backend/app/api/routes/fulltext.py` |
| Dockerfile | `backend/Dockerfile` |
| DB Migrations | `supabase/migrations/` |
| API Client | `frontend/src/lib/api/backend-client.ts` |
| Supabase Client | `frontend/src/lib/supabase/client.ts` |
| Supabase Server | `frontend/src/lib/supabase/server.ts` |
| Auth Middleware | `frontend/src/lib/supabase/middleware.ts` |
| Dashboard | `frontend/src/app/(dashboard)/page.tsx` |
| Landing Page | `frontend/src/app/landing/page.tsx` |
| Chat Interface | `frontend/src/components/chat/ChatInterface.tsx` |
| App Sidebar | `frontend/src/components/layout/AppSidebar.tsx` |
| Stage Components | `frontend/src/components/stages/` |
