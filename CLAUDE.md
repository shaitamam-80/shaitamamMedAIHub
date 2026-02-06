# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MedAI Hub** is an AI-powered research question formulation platform for medical researchers. It helps researchers define and refine research questions using structured frameworks (PICO, PEO, SPIDER, etc.) with AI assistance.

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

### Define Tool

The **Define Tool** (`/define`) helps researchers formulate research questions using AI chat:

- Supports 20+ research frameworks (PICO, CoCoPop, PEO, SPIDER, SPICE, ECLIPSE, etc.)
- AI extracts framework components from natural conversation
- FINER assessment evaluates question quality (Feasible, Interesting, Novel, Ethical, Relevant)

### Define Tool v3.0 - Wizard Architecture

**Status**: In development (replacing chat-based interface)

Define Tool v3.0 introduces a **wizard-based** interface with split-screen live preview, replacing the free-form chat approach.

#### Key Features

- **Wizard Pattern**: Progressive disclosure through 6 structured steps
- **Split-Screen Layout**: Input panel (left) + Live Preview panel (right, 40% width)
- **All 17+ Frameworks**: Production-ready support from launch (no MVP)
- **Clarification-Based Detection**: Interactive questions instead of keyword matching
- **Qualitative FINER**: High/medium/low scores with reasoning (no artificial numeric scores)
- **Three Question Types**: Narrow (PubMed-ready), Broad (exploratory), Clinical (practical)

#### Wizard Steps

1. **Welcome** - Language selection (EN/HE) and introduction
2. **Framework** - Clarification-based framework selection
3. **Components** - Extract framework components with real-time validation
4. **FINER** - Qualitative assessment with improvement suggestions
5. **Questions** - Generate three question formulations
6. **Review** - Final review and save to project

#### Framework Detection Strategy

```typescript
// v3.0 Approach: Clarification-based (NO keyword matching)
// 1. Ask user INTENT questions
// 2. Present framework options based on answers
// 3. If ambiguous → ASK, don't guess
// 4. No default to PICO
```

**Example Flow:**

```
AI: "What type of research question are you exploring?"
   → Therapy/treatment effectiveness
   → Risk factors or causes
   → Patient experiences
   → Prevalence/frequency
   → Prognosis/outcomes

User selects: "Risk factors"
AI: → Suggests PECO (exposure-based)
```

#### FINER Assessment Philosophy

**Qualitative Only** - No numeric scores, no formulas:

```typescript
interface FinerDimension {
  score: "high" | "medium" | "low";  // Qualitative level
  reason: string;                     // 2-3 sentence explanation
}

// Recommendation based on holistic judgment, NOT arithmetic
recommendation: "proceed" | "revise" | "reconsider"
```

**Why qualitative?**

- Removes false precision (100/66/33 points are arbitrary)
- Focuses on reasoning over scoring
- Aligns with actual research review processes

#### Split-Screen Layout

```
┌─────────────────────────────────┬──────────────────────┐
│ Input Panel (60%)               │ Preview Panel (40%)  │
├─────────────────────────────────┼──────────────────────┤
│ Step Progress Indicator         │ Framework Summary    │
│                                 │                      │
│ [Active Step Content]           │ Components Preview   │
│ - Framework selection           │ ✓ P: ...             │
│ - Component inputs              │ ✓ I: ...             │
│ - FINER review                  │ ○ C: (optional)      │
│                                 │ ✓ O: ...             │
│ [Navigation: Back | Next]       │                      │
│                                 │ FINER Assessment     │
│                                 │ F: High - ...        │
│                                 │                      │
│                                 │ Generated Questions  │
│                                 │ (shown in step 5)    │
└─────────────────────────────────┴──────────────────────┘
```

#### Type System

All types defined in `frontend/lib/types/wizard.types.ts`:

- **WizardState** - Complete wizard state machine
- **FrameworkComponent** - Dynamic component with validation
- **FinerAssessment** - Qualitative FINER with reasoning
- **GeneratedQuestions** - Three question formulations
- **WizardAction** - Reducer actions for state management

#### Supported Frameworks (17+)

**PICO Family (5)**: PICO, PICOT, PICOS, PICOC, PICOTS
**JBI Standards (7)**: CoCoPop, PEO, PECO, PFO, PIRD, PCC, PICo
**Qualitative (2)**: SPIDER, SPICE
**Policy/Complex (2)**: ECLIPSE, CIMO
**Specialized (4)**: BeHEMoTh, PerSPEcTiF, PICOT-D, PICOTS-ComTeC

#### Design System

Tailwind configuration with Clinical Blue palette:

```typescript
// Wizard-specific colors
wizard: {
  primary: "hsl(210, 100%, 50%)",        // Clinical Blue
  step: {
    active: "hsl(210, 100%, 50%)",       // Current step
    complete: "hsl(142, 71%, 45%)",      // Completed
    pending: "hsl(0, 0%, 70%)",          // Pending
  }
}

// Wizard spacing
spacing: {
  "wizard-panel": "40%",          // Preview panel width
  "wizard-gap": "1.5rem",         // Gap between panels
  "step-indicator": "2.5rem",     // Progress indicator
}
```

#### API Changes (v3.0)

New endpoints for wizard flow:

```
POST /api/v1/define/detect-framework    # Clarification-based detection
POST /api/v1/define/extract-components  # Extract from conversation
POST /api/v1/define/generate-questions  # Generate 3 formulations
POST /api/v1/define/validate-component  # Real-time validation
```

#### Migration Strategy

- Build v3.0 on feature branch
- In-place replacement of `/define` route (NOT parallel routes)
- Migrate existing projects via data migration script
- Feature flag for gradual rollout

#### Key Differences from v2.0

| Aspect | v2.0 (Current) | v3.0 (Wizard) |
| -------- | --------------- | --------------- |
| **Interface** | Free-form chat | Structured wizard |
| **Framework Detection** | Keyword matching | Clarification questions |
| **FINER Scoring** | Numeric (100/66/33) | Qualitative (high/med/low) |
| **Preview** | Final step only | Real-time split-screen |
| **Navigation** | Linear chat | Step-based with back/next |
| **Question Output** | Single version | Three formulations |

#### File References (v3.0)

| Purpose | File |
|---------|------|
| Wizard Types | `frontend/lib/types/wizard.types.ts` |
| Wizard Component | `frontend/components/define/wizard.tsx` |
| Step Components | `frontend/components/define/steps/*.tsx` |
| Preview Panel | `frontend/components/define/preview-panel.tsx` |
| Design Tokens | `frontend/tailwind.config.ts` |
| Framework Configs | `docs/FRAMEWORK_CONFIGS.md` |
| Implementation Plan | `docs/define-tool-v3-implementation-plan.md` |
| Detection Prompts | `backend/app/core/prompts/define_v3_detect.py` |
| Generation Prompts | `backend/app/core/prompts/define_v3_generate.py` |

---

### Backend Structure

```
backend/
├── main.py                     # FastAPI app, CORS, routes
├── app/
│   ├── api/
│   │   ├── models/
│   │   │   ├── schemas.py      # Pydantic models + FRAMEWORK_SCHEMAS
│   │   │   └── frameworks.py   # Typed framework models (PICO, PEO, etc.)
│   │   └── routes/
│   │       ├── projects.py     # CRUD for projects
│   │       └── define.py       # Chat + framework extraction
│   ├── core/
│   │   ├── config.py           # Settings from .env
│   │   ├── auth.py             # Supabase JWT validation
│   │   └── prompts/
│   │       ├── shared.py       # Framework schemas
│   │       └── define.py       # AI prompts for Define tool
│   └── services/
│       ├── ai_service.py       # Gemini AI (singleton)
│       └── database.py         # Supabase client (singleton)
```

### Frontend Structure

```
frontend/
├── app/
│   ├── page.tsx               # Home page
│   ├── layout.tsx             # Root layout with sidebar
│   ├── define/page.tsx        # Define tool (chat + form)
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
    ├── api/                   # API client modules
    ├── supabase.ts            # Supabase client (singleton)
    └── utils.ts               # Tailwind cn() utility
```

---

## Key Patterns

### Authentication Flow

1. User logs in via Supabase Auth (email/password or OAuth)
2. Frontend stores JWT in Supabase session
3. API client interceptor adds `Authorization: Bearer {token}` to all requests
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

### Define Tool

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/define/frameworks` | Get framework schemas |
| POST | `/api/v1/define/chat` | Chat with AI |
| GET | `/api/v1/define/conversation/{id}` | Get chat history |
| DELETE | `/api/v1/define/conversation/{id}` | Clear chat history |
| POST | `/api/v1/define/finer-assessment` | Evaluate research question |

**Chat Request:**

```json
{
  "project_id": "uuid",
  "message": "I want to study exercise for depression in elderly",
  "framework_type": "PICO",
  "language": "en"
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
    "F": {"score": "high", "reason": "..."},
    "I": {"score": "high", "reason": "..."},
    "N": {"score": "medium", "reason": "..."},
    "E": {"score": "high", "reason": "..."},
    "R": {"score": "high", "reason": "..."},
    "overall": "proceed",
    "suggestions": ["Consider specifying exercise type"]
  }
}
```

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

#### chat_messages

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | FK → projects |
| role | VARCHAR(20) | user/assistant/system |
| content | TEXT | Message |
| created_at | TIMESTAMPTZ | Auto |

### Indexes

```sql
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_chat_messages_project_id ON chat_messages(project_id);
```

### Cascade Deletes

All FK use `ON DELETE CASCADE` - deleting project removes all related data.

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

---

## Common Tasks

### Add New Framework

1. Add to `FRAMEWORK_SCHEMAS` in `backend/app/core/prompts/shared.py`
2. Frontend auto-renders (no changes needed)

### Add API Endpoint

1. Create route in `backend/app/api/routes/`
2. Add Pydantic models in `schemas.py`
3. Register in `main.py`
4. Add method in `frontend/lib/api/`

### Add UI Component

```bash
npx shadcn-ui@latest add [component]
```

### Reset Database

```sql
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- Then run docs/schema.sql
```

---

## Deployment

### Railway (Backend)

- Auto-deploys from `develop` branch
- Uses `Dockerfile` in `/backend` directory
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
3. Test connection: `GET /health`

### Auth Issues

1. Check Supabase Auth settings
2. Verify redirect URLs in Supabase dashboard
3. Check browser console for CORS errors

### AI Not Responding

1. Check `GOOGLE_API_KEY` quota
2. Gemini may return malformed JSON - check logs
3. Rate limiting may kick in on heavy usage

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
| Framework Models | `backend/app/api/models/frameworks.py` |
| Framework prompts | `backend/app/core/prompts/shared.py` |
| Define prompts | `backend/app/core/prompts/define.py` |
| Dockerfile | `backend/Dockerfile` |
| API Client | `frontend/lib/api/` |
| Supabase Client | `frontend/lib/supabase.ts` |
| Auth Context | `frontend/contexts/auth-context.tsx` |
| Define Page | `frontend/app/define/page.tsx` |
| DB Schema | `docs/schema.sql` |
| RLS Policies | `docs/rls_policies.sql` |
