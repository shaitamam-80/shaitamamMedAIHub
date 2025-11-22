# MedAI Hub - Backend API

FastAPI backend for the MedAI Hub systematic literature review platform.

## Features

- **Define Tool**: AI-powered research question formulation using frameworks (PICO, CoCoPop, PEO, etc.)
- **Query Tool**: PubMed search query generation from framework data
- **Review Tool**: MEDLINE file parsing and AI-powered abstract screening

## Tech Stack

- **Framework**: FastAPI
- **AI**: Google Gemini (via LangChain)
- **Database**: Supabase (PostgreSQL)
- **Python**: 3.11+

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `GOOGLE_API_KEY`: Your Google Gemini API key
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase anon/public key

### 3. Database Setup

Run the SQL schema in your Supabase SQL editor:

```bash
# The schema.sql file is in the project root
```

### 4. Run the Server

```bash
# Development mode (with auto-reload)
python main.py

# Or using uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- API: http://localhost:8000
- Docs: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

## API Endpoints

### Projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects` - List projects
- `GET /api/v1/projects/{id}` - Get project
- `PATCH /api/v1/projects/{id}` - Update project

### Define Tool
- `GET /api/v1/define/frameworks` - Get framework schemas
- `POST /api/v1/define/chat` - Chat for research question formulation
- `GET /api/v1/define/conversation/{project_id}` - Get conversation history

### Query Tool
- `POST /api/v1/query/generate` - Generate PubMed query
- `GET /api/v1/query/history/{project_id}` - Get query history

### Review Tool
- `POST /api/v1/review/upload` - Upload MEDLINE file
- `GET /api/v1/review/abstracts/{project_id}` - Get abstracts
- `POST /api/v1/review/analyze` - Run AI screening
- `PATCH /api/v1/review/abstracts/{id}` - Update decision

## Project Structure

```
backend/
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
├── .env.example           # Environment variables template
│
├── app/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── projects.py   # Project CRUD
│   │   │   ├── define.py     # Define tool
│   │   │   ├── query.py      # Query tool
│   │   │   └── review.py     # Review tool
│   │   └── models/
│   │       └── schemas.py    # Pydantic models
│   │
│   ├── core/
│   │   └── config.py         # Configuration
│   │
│   └── services/
│       ├── ai_service.py     # Google Gemini AI
│       ├── database.py       # Supabase operations
│       └── medline_parser.py # MEDLINE file parser
│
└── uploads/               # Uploaded files (auto-created)
```

## Development

### Testing

```bash
pytest
```

### Code Style

```bash
# Format code
black .

# Lint
flake8 .
```

## Production Deployment

For production deployment:

1. Set `DEBUG=False` in `.env`
2. Use a production ASGI server (uvicorn with workers)
3. Set up proper CORS origins
4. Enable Supabase Row Level Security
5. Use environment variables for all secrets

Example production command:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```
