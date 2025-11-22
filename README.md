# MedAI Hub

**AI-Powered Systematic Literature Review Platform**

A production-ready SaaS platform for medical researchers conducting systematic literature reviews. MedAI Hub streamlines the entire review process from research question formulation to abstract screening using AI assistance.

## Overview

MedAI Hub provides three integrated tools for systematic reviews:

1. **Define Tool**: Research question formulator with AI chat and dynamic framework forms
2. **Query Tool**: PubMed boolean search query generator
3. **Review Tool**: MEDLINE file parser and AI-powered abstract screening

## Technology Stack

### Frontend
- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Shadcn/UI** components

### Backend
- **FastAPI** (Python)
- **Google Gemini AI** (via LangChain)
- **Supabase** (PostgreSQL)

### AI
- **Model**: Google Gemini 1.5 Pro & Flash
- **Framework**: LangChain
- **No OpenAI dependency** ✅

## Features

### 🔬 Research Frameworks
Support for multiple research question frameworks:
- PICO (Population, Intervention, Comparison, Outcome)
- CoCoPop (Condition, Context, Population)
- PEO (Population, Exposure, Outcome)
- SPIDER, SPICE, ECLIPSE, FINER

### 🤖 AI-Powered Features
- Interactive chat for research question formulation
- Automatic extraction of framework components
- PubMed query generation with MeSH terms
- Batch abstract screening with reasoning

### 📊 Dynamic Forms
Forms automatically adapt to the selected research framework, rendering fields dynamically based on backend schema definitions.

### 📁 Project Management
Organize all your systematic reviews by project. Each tool operates within project context for seamless workflow.

### 📄 MEDLINE Parser
Advanced parser for PubMed MEDLINE format:
- Handles multi-line abstracts
- Extracts metadata (authors, journals, keywords)
- Bulk import and processing

## Project Structure

```
MedAI Hub/
├── backend/                 # FastAPI Backend
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/     # API endpoints
│   │   │   └── models/     # Pydantic schemas
│   │   ├── core/           # Configuration
│   │   └── services/       # Business logic
│   │       ├── ai_service.py
│   │       ├── database.py
│   │       └── medline_parser.py
│   ├── main.py
│   ├── requirements.txt
│   └── README.md
│
├── frontend/                # Next.js Frontend
│   ├── app/                # App Router pages
│   │   ├── define/        # Define tool
│   │   ├── query/         # Query tool
│   │   ├── review/        # Review tool
│   │   └── projects/      # Project management
│   ├── components/
│   │   ├── ui/            # Shadcn/UI components
│   │   └── sidebar/       # Navigation
│   ├── lib/
│   │   ├── api.ts         # API client
│   │   └── utils.ts
│   ├── package.json
│   └── README.md
│
├── schema.sql              # Database schema
└── README.md              # This file
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
# In Supabase SQL Editor, run:
cat schema.sql
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add:
# - GOOGLE_API_KEY
# - SUPABASE_URL
# - SUPABASE_KEY

# Run server
python main.py
```

Backend will run at: http://localhost:8000

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Run development server
npm run dev
```

Frontend will run at: http://localhost:3000

## Usage

### 1. Create a Project
Navigate to "Projects" and create a new systematic review project.

### 2. Define Your Research Question
Use the Define tool to:
- Select your research framework (PICO, CoCoPop, etc.)
- Chat with AI to formulate your question
- See the form auto-populate as you chat

### 3. Generate PubMed Queries
The Query tool converts your framework data into optimized PubMed search strings.

### 4. Screen Abstracts
Upload MEDLINE files and use AI to batch analyze abstracts with include/exclude decisions.

## API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

## Architecture Highlights

### Split Screen Interface
The Define tool features a unique split-screen design:
- **Left**: Dynamic form that adapts to framework type
- **Right**: Real-time AI chat interface
- **Auto-sync**: Chat extracts data to populate form fields

### Dynamic Schema System
Framework schemas are defined in the backend and consumed by the frontend:
```python
# Backend defines schema
FRAMEWORK_SCHEMAS = {
    "PICO": {
        "fields": [
            {"key": "P", "label": "Population", ...},
            {"key": "I", "label": "Intervention", ...},
            ...
        ]
    }
}
```

Frontend blindly renders whatever fields are provided, making it easy to add new frameworks.

### AI Integration
Uses Google Gemini with two models:
- **gemini-1.5-pro**: Heavy lifting (batch analysis, complex reasoning)
- **gemini-1.5-flash**: Speed (chat, quick extractions)

## Environment Variables

### Backend (.env)
```env
GOOGLE_API_KEY=your_google_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_key
DEBUG=False
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Development

### Backend Development
```bash
# Run with auto-reload
uvicorn main:app --reload

# Run tests
pytest
```

### Frontend Development
```bash
# Development mode
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## Production Deployment

### Backend
- Deploy to AWS, GCP, or Heroku
- Use production ASGI server (uvicorn with workers)
- Enable Supabase Row Level Security
- Set up proper CORS origins

### Frontend
- Deploy to Vercel (recommended for Next.js)
- Or use Docker for containerized deployment
- Set production API URL

## Contributing

This is a production-ready scaffold. To extend:

1. **Add Framework**: Update `FRAMEWORK_SCHEMAS` in `backend/app/api/models/schemas.py`
2. **Add Route**: Create new route in `backend/app/api/routes/`
3. **Add Page**: Create new page in `frontend/app/`
4. **Add UI Component**: Use Shadcn/UI: `npx shadcn-ui@latest add [component]`

## License

MIT License - feel free to use for your research projects.

## Support

For issues or questions:
- Backend API: Check `/api/docs` for endpoint documentation
- Frontend: See `frontend/README.md`
- Database: See `schema.sql` for schema reference

## Acknowledgments

- Built with FastAPI, Next.js, and Google Gemini
- UI components from Shadcn/UI
- Icons from Lucide

---

**Version**: 1.0.0
**Status**: Production Ready ✅
