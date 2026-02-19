# MedAI Hub

**AI-Powered Systematic Literature Review Platform**

A platform for medical researchers to formulate research questions, build protocols, screen studies, extract data, assess risk of bias, perform meta-analysis, and generate manuscripts — all powered by AI and structured systematic review methodology.

## Overview

MedAI Hub guides researchers through the full systematic review workflow using AI assistance, structured frameworks (PICO, SPIDER, PEO, and 14+ more), and a LangGraph-powered orchestration engine. From initial research question to publication-ready manuscript.

## Technology Stack

### Backend

- **FastAPI** (Python 3.11)
- **Google Gemini AI** (via LangChain)
- **LangGraph** (state machine orchestration)
- **Supabase** (PostgreSQL + Auth)
- **sr-skills** (private systematic review methodology package)

### Frontend

- **Next.js 16** (App Router + Turbopack)
- **React 19** + **TypeScript 5.9**
- **Tailwind CSS 4** + **Shadcn/UI**
- **Zustand** (state management)
- **next-intl** (EN/HE bilingual support)

## Features

### Systematic Review Workflow (LangGraph)

7-stage orchestrated pipeline:

1. **Research Question** — Framework-based formulation (PICO, CoCoPop, SPIDER, etc.)
2. **Protocol** — PROSPERO-ready protocol building
3. **Search** — PubMed query construction
4. **Screening** — Abstract/full-text screening
5. **Data Extraction** — Structured data extraction from papers
6. **Synthesis** — Meta-analysis + GRADE assessment
7. **Reporting** — Manuscript generation

### AI Skills (12 Modules)

Each skill provides specialized prompts and methodology:

| Skill | Purpose |
|-------|---------|
| research-question | Framework selection + question formulation |
| protocol-builder | PROSPERO protocol generation |
| pubmed-query | Boolean search query construction |
| pubmed-screening | Abstract screening with criteria |
| data-extraction | Cochrane/JBI template extraction |
| risk-of-bias | RoB 2.0, ROBINS-I, NOS, JBI checklists |
| meta-analysis | Forest plots, heterogeneity, subgroups |
| grade-assessment | GRADE certainty of evidence |
| manuscript-writer | PRISMA 2020 compliant manuscripts |
| article-appraisal | Critical appraisal of clinical papers |
| find-journal | Journal selection recommendations |
| systematic-review | Full workflow orchestration |

### Research Frameworks (17+)

- **PICO Family**: PICO, PICOT, PICOS, PICOC, PICOTS
- **JBI Standards**: CoCoPop, PEO, PECO, PFO, PIRD, PCC, PICo
- **Qualitative**: SPIDER, SPICE
- **Policy/Complex**: ECLIPSE, CIMO
- **Specialized**: BeHEMoTh, PerSPEcTiF, PICOT-D, PICOTS-ComTeC

### Additional Features

- Full-text availability checking (PMC, Unpaywall, CORE, Semantic Scholar, EZproxy)
- SSE streaming chat with skill-based prompts
- FINER assessment for research feasibility
- Hebrew/English bilingual interface
- Project management with stage tracking

## Project Structure

```text
MedAI Hub/
├── backend/
│   ├── main.py                     # FastAPI entry point
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── app/
│   │   ├── api/
│   │   │   ├── models/             # Pydantic schemas + frameworks
│   │   │   └── routes/
│   │   │       ├── projects.py     # Project CRUD
│   │   │       ├── define.py       # Define tool v2 (chat)
│   │   │       ├── define_v3.py    # Define tool v3 (wizard)
│   │   │       ├── review.py       # LangGraph SR orchestrator
│   │   │       ├── chat.py         # SSE streaming chat
│   │   │       └── fulltext.py     # Full-text OA checker
│   │   ├── core/
│   │   │   ├── config.py           # Settings from .env
│   │   │   ├── auth.py             # Supabase JWT validation
│   │   │   ├── logging_config.py   # Structured JSON logging
│   │   │   └── skills/             # 12 skill prompt directories
│   │   ├── services/
│   │   │   ├── database.py         # Supabase CRUD
│   │   │   ├── checkpointer.py     # LangGraph state persistence
│   │   │   └── skill_loader.py     # Dynamic skill loading
│   │   └── graph/                  # LangGraph workflow
│   │       ├── state.py            # ReviewState TypedDict
│   │       ├── workflow.py         # Graph builder + routing
│   │       └── nodes/              # 7 stage node implementations
│
├── frontend/
│   ├── package.json
│   ├── src/
│   │   ├── app/                    # Next.js App Router
│   │   │   ├── layout.tsx          # Root layout
│   │   │   ├── landing/            # Public landing page
│   │   │   ├── (auth)/             # Login / Register
│   │   │   └── (dashboard)/        # Protected dashboard
│   │   │       ├── page.tsx        # Dashboard home
│   │   │       ├── projects/       # Project management
│   │   │       ├── tools/          # Tool pages (dynamic)
│   │   │       └── settings/       # User settings
│   │   ├── components/
│   │   │   ├── chat/               # Chat interface + streaming
│   │   │   ├── dashboard/          # Project cards + progress
│   │   │   ├── layout/             # Sidebar + TopBar
│   │   │   ├── stages/             # SR stage visualizations
│   │   │   ├── tools/              # Tool cards + headers
│   │   │   └── ui/                 # Shadcn/UI (60+ components)
│   │   └── lib/
│   │       ├── api/                # Backend API client
│   │       ├── supabase/           # Client + server + middleware
│   │       └── utils/              # Helpers (cn, stage-config)
│
└── docs/
    ├── schema.sql                  # Database schema
    ├── rls_policies.sql            # Row Level Security
    └── FRAMEWORK_CONFIGS.md        # Framework definitions
```

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Supabase account
- Google Gemini API key

### 1. Database Setup

Create a Supabase project and run the SQL schema:

```bash
# In Supabase SQL Editor, run docs/schema.sql
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1  # Windows
# source .venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Install sr-skills (private package - editable mode)
pip install -e "path/to/sr-skills"

# Configure environment
cp .env.example .env
# Edit .env with your keys

# Run server
python main.py
```

Backend runs at: `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit with your Supabase keys

# Run development server
npm run dev
```

Frontend runs at: `http://localhost:3000`

## Environment Variables

### Backend (.env)

```env
GOOGLE_API_KEY=your_google_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://...            # Optional: direct PG connection
NCBI_API_KEY=your_ncbi_key              # Optional: PubMed API
PUBMED_EMAIL=your_email                  # Optional: Unpaywall
CORE_API_KEY=your_core_key              # Optional: CORE.ac.uk
DEBUG=True
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## API Documentation

When running in DEBUG mode, visit:

- **Swagger UI**: `http://localhost:8000/api/docs`
- **ReDoc**: `http://localhost:8000/api/redoc`

## Deployment

- **Backend**: Railway (via Dockerfile)
- **Frontend**: Vercel
- **Live URL**: <https://shaitamam.com>
- **API**: <https://api.shaitamam.com>

## License

MIT License

---

**Version**: 3.0.0 - Systematic Review Platform
