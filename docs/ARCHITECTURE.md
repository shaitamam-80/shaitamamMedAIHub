# MedAI Hub - Architecture Overview

## System Overview

MedAI Hub is an AI-powered systematic literature review platform designed for medical researchers. The platform consists of three main tools that assist researchers throughout their review process.

## Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **AI Integration**: Google Gemini via LangChain
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with JWT validation

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Library**: Shadcn/ui + Tailwind CSS
- **State Management**: React hooks (useState, useEffect)
- **Authentication**: @supabase/ssr

## Three-Tool System

### 1. Define Tool
Research question formulation using AI-assisted chat with dynamic framework forms.

**Supported Frameworks:**
- PICO (Population, Intervention, Comparison, Outcome)
- CoCoPop (Context, Condition, Population)
- PEO (Population, Exposure, Outcome)
- SPIDER (Sample, Phenomenon of Interest, Design, Evaluation, Research type)
- SPICE (Setting, Perspective, Intervention, Comparison, Evaluation)
- ECLIPSE (Expectation, Client group, Location, Impact, Professionals, Service)
- FINER (Feasible, Interesting, Novel, Ethical, Relevant)

**Architecture:**
```
User Input → AI Chat → Framework Data Extraction → Form Auto-population
```

### 2. Query Tool
PubMed boolean search query generator from framework data.

**Architecture:**
```
Framework Data → AI Query Generation → Boolean Query String → Copy to PubMed
```

### 3. Review Tool
MEDLINE file parser with AI-powered abstract screening.

**Architecture:**
```
MEDLINE Upload → Background Parsing → Abstract Storage → Batch AI Analysis → Decision Output
```

## Backend Architecture

### Service Layer Pattern
```
Routes → Services → Database/AI
```

- **Routes**: HTTP request handling, validation, response formatting
- **Services**: Business logic, AI interactions, database operations
- **Database**: Supabase client wrapper with CRUD operations

### Key Services

#### AI Service (`ai_service.py`)
- Singleton pattern for resource efficiency
- Manages all Gemini AI interactions
- Model selection:
  - `gemini-1.5-pro`: Complex reasoning, batch analysis
  - `gemini-1.5-flash`: Quick responses, chat interactions

#### Database Service (`database.py`)
- Supabase client wrapper
- All CRUD operations
- User-scoped queries with ownership verification

#### MEDLINE Parser (`medline_parser.py`)
- Parses PubMed MEDLINE format
- Handles multi-line abstracts
- Extracts: PMID, title, abstract, authors, journal, date, keywords

### Authentication Flow
```
Frontend Request → JWT Token Header → Backend Auth Middleware → Supabase Validation → User Payload
```

## Frontend Architecture

### Page Structure
```
app/
├── auth/
│   ├── login/
│   ├── register/
│   └── callback/
├── define/
├── query/
├── review/
└── projects/
```

### Define Page Split Screen
- **Left Panel (50%)**: Dynamic framework form
- **Right Panel (50%)**: Real-time AI chat interface

### Authentication Context
- Wraps entire application
- Provides user state, sign in/out methods
- Handles session persistence via cookies

### API Client
- Centralized in `lib/api.ts`
- Automatically attaches JWT tokens
- Handles error responses

## Data Flow

### Project Creation
```
1. User creates project → POST /api/v1/projects
2. Backend validates JWT → Extracts user_id
3. Project created with user_id → Returns project data
4. Frontend updates UI
```

### Define Flow
```
1. User selects framework type
2. User chats with AI assistant
3. AI extracts framework data from conversation
4. Form auto-populates with extracted data
5. User can manually edit form fields
6. Data saved to project.framework_data
```

### Review Flow
```
1. User uploads MEDLINE file
2. Background task parses file
3. Abstracts stored in database
4. User triggers batch analysis
5. AI screens abstracts against criteria
6. Decisions stored with reasoning
```

## Security

### Frontend
- Protected routes via Next.js middleware
- Session stored in HTTP-only cookies
- CSRF protection via Supabase

### Backend
- JWT validation on all protected routes
- User ownership verification
- Row Level Security (RLS) at database level

### Database
- RLS policies ensure user isolation
- Service role key for admin operations
- All queries filtered by user_id

## Directory Structure

```
medai-hub/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── models/      # Pydantic schemas
│   │   │   └── routes/      # API endpoints
│   │   ├── core/            # Config, auth
│   │   └── services/        # Business logic
│   ├── uploads/             # File storage
│   └── main.py              # App entry point
├── frontend/
│   ├── app/                 # Next.js pages
│   ├── components/          # React components
│   ├── contexts/            # React contexts
│   └── lib/                 # Utilities
└── docs/                    # Documentation
```
