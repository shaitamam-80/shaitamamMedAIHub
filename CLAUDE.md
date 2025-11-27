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

### Database
- Run `docs/schema.sql` in Supabase SQL Editor
- Tables: projects, files, abstracts, chat_messages, analysis_runs, query_strings

---

## Architecture

### Three-Tool System
1. **Define Tool** (`/define`): AI chat to formulate research questions using frameworks (PICO, CoCoPop, PEO, SPIDER, SPICE, ECLIPSE, FINER)
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

## API Endpoints

```
Auth Required for all /api/v1/* endpoints

POST   /api/v1/projects              Create project
GET    /api/v1/projects              List user's projects
GET    /api/v1/projects/{id}         Get project
PATCH  /api/v1/projects/{id}         Update project
DELETE /api/v1/projects/{id}         Delete project (CASCADE)

GET    /api/v1/define/frameworks     Get framework schemas
POST   /api/v1/define/chat           Chat with AI
GET    /api/v1/define/conversation/{id}  Get chat history

POST   /api/v1/query/generate        Generate PubMed query
GET    /api/v1/query/history/{id}    Get query history

POST   /api/v1/review/upload         Upload MEDLINE file
GET    /api/v1/review/abstracts/{id} Get abstracts
POST   /api/v1/review/analyze        Start AI screening
PATCH  /api/v1/review/abstracts/{id} Update decision

GET    /                             Health check
GET    /health                       Health check
```

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

## Database Schema

6 tables with CASCADE delete:
- `projects` - Research projects (user_id, name, framework_type, framework_data)
- `files` - Uploaded MEDLINE files
- `abstracts` - Parsed abstracts with AI decisions
- `chat_messages` - Define tool conversation history
- `query_strings` - Generated search queries
- `analysis_runs` - Batch analysis tracking

Key indexes: `user_id`, `project_id`, `created_at`, `pmid`

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

---

## Deployment

### Railway (Backend)
- Auto-deploys from `main` branch
- Uses `railway.json` + `nixpacks.toml`
- Environment variables in Railway dashboard

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

### 2024-11-27
- Fixed Supabase connection (service role key had extra space)
- Removed debug endpoint `/debug/config`
- Cleaned up old PRD files and design artifacts
- Added test files structure

### Schema Changes
- `ProjectResponse.id` and `user_id` changed from UUID to str (Supabase compatibility)
- `framework_data` relaxed to `Any` type for legacy data support

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
| API Client | `frontend/lib/api.ts` |
| Supabase Client | `frontend/lib/supabase.ts` |
| Auth Context | `frontend/contexts/auth-context.tsx` |
| Define Page | `frontend/app/define/page.tsx` |
| DB Schema | `docs/schema.sql` |
