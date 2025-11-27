# MedAI Hub - Backend Documentation

## Overview

This folder contains the Product Requirements Documents (PRD) for the backend services of MedAI Hub - an AI-powered systematic literature review platform.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FastAPI Backend                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         API Routes Layer                             │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────┐    │    │
│  │  │ projects  │  │  define   │  │   query   │  │    review     │    │    │
│  │  │   CRUD    │  │   Chat    │  │  Generate │  │ Upload+Screen │    │    │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         Services Layer                               │    │
│  │  ┌──────────────────────────┐  ┌──────────────────────────────┐    │    │
│  │  │       ai_service         │  │       db_service             │    │    │
│  │  │  ┌──────────────────┐   │  │  ┌──────────────────────┐   │    │    │
│  │  │  │  Google Gemini   │   │  │  │   Supabase Client    │   │    │    │
│  │  │  │  (via LangChain) │   │  │  │   (PostgreSQL)       │   │    │    │
│  │  │  └──────────────────┘   │  │  └──────────────────────┘   │    │    │
│  │  └──────────────────────────┘  └──────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         Support Modules                              │    │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────┐   │    │
│  │  │    config     │  │    prompts    │  │   medline_parser      │   │    │
│  │  │  (Settings)   │  │  (AI Prompts) │  │  (File Parsing)       │   │    │
│  │  └───────────────┘  └───────────────┘  └───────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         External Services                                    │
│  ┌────────────────────────┐          ┌────────────────────────┐            │
│  │   Supabase PostgreSQL  │          │     Google Gemini AI   │            │
│  │   - projects           │          │     - gemini-2.5-flash │            │
│  │   - files              │          │     - Chat             │            │
│  │   - abstracts          │          │     - Extraction       │            │
│  │   - chat_messages      │          │     - Batch Analysis   │            │
│  │   - query_strings      │          │                        │            │
│  │   - analysis_runs      │          │                        │            │
│  └────────────────────────┘          └────────────────────────┘            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PRD Documents

| Document | Description | Priority |
|----------|-------------|----------|
| [API Projects](PRD_API_PROJECTS.md) | Project CRUD endpoints | P0 |
| [API Define](PRD_API_DEFINE.md) | Chat and framework extraction | P0 |
| [API Query](PRD_API_QUERY.md) | PubMed query generation | P0 |
| [API Review](PRD_API_REVIEW.md) | File upload and screening | P0 |
| [Services](PRD_SERVICES.md) | AI and Database services | P0 |
| [Database Schema](PRD_DATABASE.md) | Tables and relationships | P0 |

---

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | FastAPI | 0.100+ |
| Language | Python | 3.11+ |
| AI | Google Gemini | gemini-2.5-flash |
| AI SDK | LangChain | latest |
| Database | PostgreSQL (Supabase) | 15+ |
| Auth | Supabase Auth | - |
| Validation | Pydantic | v2 |

---

## API Endpoints Summary

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| **Projects** ||||
| POST | `/api/v1/projects/` | Create project | Yes |
| GET | `/api/v1/projects/` | List projects | Yes |
| GET | `/api/v1/projects/{id}` | Get project | Yes |
| PATCH | `/api/v1/projects/{id}` | Update project | Yes |
| DELETE | `/api/v1/projects/{id}` | Delete project | Yes |
| **Define** ||||
| GET | `/api/v1/define/frameworks` | Get framework schemas | No |
| POST | `/api/v1/define/chat` | Chat with AI | Yes |
| GET | `/api/v1/define/conversation/{id}` | Get chat history | Yes |
| DELETE | `/api/v1/define/conversation/{id}` | Clear chat | Yes |
| **Query** ||||
| POST | `/api/v1/query/generate` | Generate PubMed query | Yes |
| GET | `/api/v1/query/history/{id}` | Get query history | Yes |
| **Review** ||||
| POST | `/api/v1/review/upload` | Upload MEDLINE file | Yes |
| GET | `/api/v1/review/abstracts/{id}` | Get abstracts | Yes |
| POST | `/api/v1/review/analyze` | Start batch analysis | Yes |
| PATCH | `/api/v1/review/abstracts/{id}` | Update decision | Yes |
| GET | `/api/v1/review/export/{id}` | Export results | Yes |

---

## Development Tasks Summary

### P0 - Critical

| ID | Task | Module |
|----|------|--------|
| BE-T001 | Implement project DELETE with cascade | Projects API |
| BE-T002 | Add Hebrew→English translation in AI | Define API |
| BE-T003 | Implement RIS/NBIB export | Review API |
| BE-T004 | Add Proximity Search support | Query API |
| BE-T005 | Implement Hedge filters library | Query API |

### P1 - High Priority

| ID | Task | Module |
|----|------|--------|
| BE-T010 | Add rate limiting | All APIs |
| BE-T011 | Implement WebSocket for progress | Review API |
| BE-T012 | Add batch processing queue | Review API |
| BE-T013 | Implement query versioning | Query API |

### P2 - Medium Priority

| ID | Task | Module |
|----|------|--------|
| BE-T020 | Add audit logging | All APIs |
| BE-T021 | Implement file storage (S3) | Review API |
| BE-T022 | Add API caching layer | All APIs |

---

## File Structure

```
backend/
├── main.py                          # Application entry point
├── app/
│   ├── __init__.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py           # Pydantic models
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── projects.py          # /api/v1/projects/*
│   │       ├── define.py            # /api/v1/define/*
│   │       ├── query.py             # /api/v1/query/*
│   │       └── review.py            # /api/v1/review/*
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py                # Settings and environment
│   │   ├── auth.py                  # Authentication
│   │   └── prompts/
│   │       ├── __init__.py
│   │       ├── shared.py            # Framework schemas
│   │       ├── define.py            # Define tool prompts
│   │       └── query.py             # Query tool prompts
│   └── services/
│       ├── __init__.py
│       ├── ai_service.py            # Google Gemini integration
│       ├── database.py              # Supabase operations
│       └── medline_parser.py        # MEDLINE file parser
├── uploads/                         # Uploaded files directory
├── requirements.txt
└── .env                             # Environment variables
```

---

## Environment Configuration

### Required Variables

```env
# Google Gemini AI
GOOGLE_API_KEY=your_google_api_key

# Supabase Database
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Optional: for admin operations

# Application
DEBUG=True
```

### Optional Variables

```env
# AI Settings
GEMINI_PRO_MODEL=gemini-2.5-flash
GEMINI_FLASH_MODEL=gemini-2.5-flash
MAX_TOKENS=8192
TEMPERATURE=0.7
BATCH_SIZE=10

# File Upload
MAX_UPLOAD_SIZE=10485760  # 10MB
UPLOAD_DIR=uploads
ALLOWED_EXTENSIONS=.txt,.medline,.csv

# CORS
BACKEND_CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12 | Initial documentation |
| 2.0 | 2024-12 | Added Proximity, Hedges, Export formats |
