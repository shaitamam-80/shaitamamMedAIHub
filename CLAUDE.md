# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MedAI Hub** is an AI-powered systematic literature review platform for medical researchers. It uses FastAPI (Python) backend with Google Gemini AI and Next.js 15 (TypeScript) frontend, backed by Supabase PostgreSQL.

## Development Commands

### Backend (FastAPI)
```bash
# Navigate to backend
cd backend

# Activate virtual environment
.\venv\Scripts\Activate.ps1  # Windows PowerShell
# source venv/bin/activate    # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Run development server (with auto-reload)
python main.py

# Run tests
pytest

# Check installed packages
pip list
```

**Backend runs at:** http://localhost:8000
**API Documentation:** http://localhost:8000/api/docs

### Frontend (Next.js)
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Type checking
npx tsc --noEmit
```

**Frontend runs at:** http://localhost:3000

### Database (Supabase)
- Run `schema.sql` in Supabase SQL Editor to create all tables
- Tables: projects, files, abstracts, chat_messages, analysis_runs, query_strings
- All use UUID primary keys with CASCADE delete on project removal

## Architecture

### Three-Tool System
1. **Define Tool**: Research question formulation using AI chat with dynamic framework forms (PICO, CoCoPop, PEO, SPIDER, SPICE, ECLIPSE, FINER)
2. **Query Tool**: PubMed boolean search query generator from framework data
3. **Review Tool**: MEDLINE file parser with AI-powered abstract screening

### Key Backend Architecture

**Service Layer Pattern:**
- `ai_service` (singleton): All Gemini AI interactions via LangChain
- `db_service` (singleton): All Supabase database operations
- Routes call services, never direct DB/AI access

**AI Models:**
- `gemini-1.5-pro`: Heavy lifting (batch analysis, complex reasoning)
- `gemini-1.5-flash`: Speed (chat, quick extractions)

**Background Tasks:**
- File parsing: `parse_medline_file()` updates file status (uploaded → processing → completed/error)
- Batch analysis: `run_batch_analysis()` processes abstracts in configurable batches (default: 10)

### Key Frontend Architecture

**Define Page Split Screen:**
- Left (50%): Dynamic framework form that auto-populates from AI chat
- Right (50%): Real-time AI chat interface
- Forms render dynamically based on `FRAMEWORK_SCHEMAS` from backend

**State Management:**
- React hooks (useState, useEffect) only
- No global state library
- API client singleton (`lib/api.ts`)

## Important Patterns

### Dynamic Framework System
- Backend defines all framework schemas in `app/api/models/schemas.py::FRAMEWORK_SCHEMAS`
- Each framework has: name, description, fields[] with (key, label, description)
- Frontend blindly renders whatever backend provides
- AI extraction prompts customize per framework type
- To add new framework: update FRAMEWORK_SCHEMAS + add extraction prompt in `ai_service.py`

### JSON Extraction Pattern
AI responses use structured extraction:
```python
# Prompt includes: "Return ONLY valid JSON, no additional text"
# Parser looks for {...} or [...] in response
# Graceful degradation: returns empty dict/list on parse failure
```

### API Error Handling
```python
# Routes use HTTPException with proper status codes
raise HTTPException(status_code=404, detail="Project not found")
raise HTTPException(status_code=400, detail="Invalid file type")
```

### Background Task Pattern
```python
# Long operations run in background
background_tasks.add_task(parse_medline_file, file_id, file_path)
# Tasks update status in database to track progress
```

## File Structure Highlights

### Backend Critical Files
- `main.py`: App initialization, CORS, route registration
- `app/core/config.py`: Settings with Pydantic, loads from .env
- `app/api/models/schemas.py`: All Pydantic models + FRAMEWORK_SCHEMAS
- `app/services/ai_service.py`: Gemini AI integration (chat, extraction, query generation, batch analysis)
- `app/services/database.py`: Supabase client wrapper with all CRUD operations
- `app/services/medline_parser.py`: Parses PubMed MEDLINE format (handles multi-line abstracts)

### Frontend Critical Files
- `app/define/page.tsx`: Core feature - split screen with dynamic form + AI chat
- `lib/api.ts`: Centralized API client for all backend calls
- `lib/utils.ts`: `cn()` utility for Tailwind class merging
- `components/sidebar/app-sidebar.tsx`: Persistent navigation

## Environment Setup

### Backend `.env` (required)
```env
GOOGLE_API_KEY=your_google_api_key          # From https://aistudio.google.com/apikey
SUPABASE_URL=https://xxx.supabase.co         # From Supabase dashboard
SUPABASE_KEY=eyJ...                          # Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY=eyJ...             # Optional: for admin operations
DEBUG=True                                   # Enable auto-reload
MAX_UPLOAD_SIZE=10485760                     # 10MB default
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Common Development Tasks

### Adding a New Framework
1. Add to `FRAMEWORK_SCHEMAS` in `backend/app/api/models/schemas.py`
2. Add extraction prompt in `ai_service._build_extraction_prompt()`
3. Frontend auto-renders new framework (no changes needed)

### Adding API Endpoint
1. Create route in `backend/app/api/routes/`
2. Define Pydantic models in `schemas.py`
3. Register router in `main.py` with `.include_router()`
4. Add database methods in `database.py` if needed
5. Add frontend method in `lib/api.ts`

### Adding UI Component
```bash
npx shadcn-ui@latest add [component-name]
```

### Testing AI Service Locally
```python
from app.services.ai_service import ai_service
from app.core.config import settings

# Test chat
response = await ai_service.chat_for_define(
    message="Study diabetes in adults",
    conversation_history=[],
    framework_type="PICO"
)

# Test extraction
data = await ai_service.extract_framework_data(
    conversation=[{"role": "user", "content": "..."}],
    framework_type="PICO"
)
```

## API Endpoints Reference

```
POST   /api/v1/projects              Create project
GET    /api/v1/projects              List all projects
GET    /api/v1/projects/{id}         Get project
PATCH  /api/v1/projects/{id}         Update project

GET    /api/v1/define/frameworks     Get all framework schemas
POST   /api/v1/define/chat           Chat (extracts + saves framework data)
GET    /api/v1/define/conversation/{id}  Get chat history

POST   /api/v1/query/generate        Generate PubMed query
GET    /api/v1/query/history/{id}    Get query history

POST   /api/v1/review/upload         Upload MEDLINE file (triggers background parse)
GET    /api/v1/review/abstracts/{id} Get abstracts (optional ?status=pending)
POST   /api/v1/review/analyze        Start batch AI screening (background)
PATCH  /api/v1/review/abstracts/{id} Update decision

GET    /                             Health check
GET    /health                       Health check
```

## Database Schema Notes

- All tables use UUID primary keys with `uuid_generate_v4()`
- Foreign keys have `ON DELETE CASCADE` (deleting project deletes all related data)
- `projects.framework_data` is JSONB for flexible schema
- `abstracts.pmid` has UNIQUE constraint
- Indexes on project_id, pmid, status, created_at for performance
- Trigger auto-updates `projects.updated_at` on any change

## MEDLINE Parser Details

**Supported Tags:**
- `PMID` - PubMed ID (required)
- `TI` - Title
- `AB` - Abstract (multi-line, 6-space continuations)
- `AU` - Authors (multiple, concatenated with "; ")
- `TA` - Journal
- `DP` - Publication Date
- `OT` / `MH` - Keywords/MeSH terms (added to keywords array)
- Unknown tags → stored in metadata JSONB

**Parser splits on:** `\nPMID- ` pattern
**Continuation lines:** Start with 6+ spaces

## Known Limitations

- No user authentication (RLS commented out in schema)
- No rate limiting on API endpoints
- File uploads limited to 10MB by default
- Batch analysis processes synchronously (can timeout on large batches)
- Frontend lacks error boundaries
- No WebSocket for real-time analysis progress

## Production Considerations

Before deploying:
1. Set `DEBUG=False` in backend .env
2. Update `BACKEND_CORS_ORIGINS` with production domain
3. Enable Supabase Row Level Security (uncomment in schema.sql)
4. Use production ASGI server: `uvicorn main:app --workers 4`
5. Deploy frontend to Vercel (recommended for Next.js)
6. Set up proper logging and monitoring
7. Add rate limiting middleware
8. Configure file storage (current: local filesystem)

## Troubleshooting

**Backend won't start:**
- Check .env file exists with all required keys
- Verify Python 3.11+ installed
- Check Supabase URL/keys are correct

**Frontend build errors:**
- Ensure `lib/utils.ts` and `lib/api.ts` exist
- Check all Shadcn components installed
- Run `npm install` to ensure dependencies

**AI extraction fails:**
- Gemini may return malformed JSON - parser handles gracefully
- Check GOOGLE_API_KEY is valid and has quota
- Review AI prompts in `ai_service.py`

**Database errors:**
- Verify schema.sql was run in Supabase
- Check Supabase project is not paused
- Verify SUPABASE_URL matches project URL exactly
