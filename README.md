# MedAI Hub

**AI-Powered Research Question Formulation Platform**

A platform for medical researchers to formulate precise, structured research questions using AI assistance and proven research frameworks.

## Overview

MedAI Hub helps researchers transform vague research ideas into well-structured research questions using frameworks like PICO, SPIDER, PEO, and more. The AI assistant guides you through the question formulation process and provides FINER assessment for research feasibility.

## Technology Stack

### Frontend
- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Shadcn/UI** components

### Backend
- **FastAPI** (Python)
- **Google Gemini AI** (via LangChain)
- **Supabase** (PostgreSQL + Auth)

## Features

### Research Frameworks
Support for multiple research question frameworks:
- **PICO** - Population, Intervention, Comparison, Outcome
- **CoCoPop** - Condition, Context, Population
- **PEO** - Population, Exposure, Outcome
- **SPIDER** - Sample, Phenomenon of Interest, Design, Evaluation, Research type
- **SPICE** - Setting, Perspective, Intervention, Comparison, Evaluation
- **ECLIPSE** - Expectation, Client, Location, Impact, Professionals, Service
- **FINER** - Feasibility, Interesting, Novel, Ethical, Relevant
- And more...

### AI-Powered Features
- Interactive chat for research question formulation
- Automatic extraction of framework components
- FINER assessment for research feasibility
- Hebrew/English bilingual support

### Project Management
Organize your research projects with full CRUD operations and conversation history.

## Project Structure

```
MedAI Hub/
├── backend/                 # FastAPI Backend
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/     # API endpoints (projects, define)
│   │   │   └── models/     # Pydantic schemas
│   │   ├── core/           # Configuration, auth, prompts
│   │   └── services/       # Business logic (ai_service, database)
│   ├── main.py
│   └── requirements.txt
│
├── frontend/                # Next.js Frontend
│   ├── app/                # App Router pages
│   │   ├── define/        # Define tool (research questions)
│   │   └── projects/      # Project management
│   ├── components/
│   │   ├── ui/            # Shadcn/UI components
│   │   └── sidebar/       # Navigation
│   ├── lib/
│   │   └── api/           # API client modules
│   └── package.json
│
├── docs/
│   └── schema.sql         # Database schema
│
└── README.md
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
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your keys

# Run server
python main.py
```

Backend runs at: http://localhost:8000

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

Frontend runs at: http://localhost:3000

## Usage

1. **Create a Project** - Start a new research project
2. **Define Your Question** - Chat with AI to formulate your research question
3. **Select Framework** - Choose PICO, SPIDER, PEO, or other frameworks
4. **Get FINER Assessment** - AI evaluates feasibility, novelty, and relevance

## Environment Variables

### Backend (.env)
```env
GOOGLE_API_KEY=your_google_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
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
- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

## Deployment

- **Backend**: Railway (via Dockerfile)
- **Frontend**: Vercel
- **Live URL**: https://shaitamam.com

## License

MIT License

---

**Version**: 2.0.0 - Define Tool Only
