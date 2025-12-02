# MedAI Hub - System Architecture Documentation

> AI-Powered Systematic Literature Review Platform for Medical Researchers

## Table of Contents

1. [System Overview](#1-system-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Backend Architecture](#3-backend-architecture)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Database Schema](#5-database-schema)
6. [Authentication Flow](#6-authentication-flow)
7. [Tool-Specific Data Flows](#7-tool-specific-data-flows)
8. [External Services Integration](#8-external-services-integration)
9. [Deployment Architecture](#9-deployment-architecture)

---

## 1. System Overview

MedAI Hub is a three-tool platform that streamlines systematic literature reviews:

| Tool | Purpose | Key Features |
|------|---------|--------------|
| **Define** | Research question formulation | AI chat, framework extraction, FINER assessment |
| **Query** | PubMed query generation | MeSH expansion, boolean queries, validation |
| **Review** | Abstract screening | MEDLINE parsing, batch AI screening, human override |

### Tech Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│  Next.js 15 + TypeScript + Tailwind CSS + Shadcn UI             │
│  Deployed on: Vercel (shaitamam.com)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS (REST API)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND                                   │
│  FastAPI (Python 3.11) + LangChain + Google Gemini AI           │
│  Deployed on: Railway (api.shaitamam.com)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│    Supabase     │ │  Google Gemini  │ │   NCBI APIs     │
│   PostgreSQL    │ │   AI Studio     │ │ PubMed + MeSH   │
│     + Auth      │ │                 │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## 2. High-Level Architecture

```mermaid
flowchart TB
    subgraph Client["🖥️ Client Layer"]
        Browser["Web Browser"]
        NextJS["Next.js 15 Frontend"]
    end

    subgraph API["🔧 API Layer"]
        FastAPI["FastAPI Backend"]
        CORS["CORS Middleware"]
        RateLimit["Rate Limiter"]
        Auth["JWT Auth"]
    end

    subgraph Services["⚙️ Service Layer"]
        AIService["AI Service\n(Gemini)"]
        DBService["Database Service\n(Supabase)"]
        PubMedService["PubMed Service"]
        QueryBuilder["Query Builder\n(MeSH)"]
        MedlineParser["MEDLINE Parser"]
    end

    subgraph External["🌐 External Services"]
        Supabase["Supabase\nPostgreSQL + Auth"]
        Gemini["Google Gemini\nAI Studio"]
        NCBI["NCBI APIs\nPubMed + MeSH"]
    end

    Browser --> NextJS
    NextJS -->|REST API| CORS
    CORS --> RateLimit
    RateLimit --> Auth
    Auth --> FastAPI

    FastAPI --> AIService
    FastAPI --> DBService
    FastAPI --> PubMedService
    FastAPI --> QueryBuilder
    FastAPI --> MedlineParser

    AIService --> Gemini
    DBService --> Supabase
    PubMedService --> NCBI
    QueryBuilder --> NCBI
```

---

## 3. Backend Architecture

### 3.1 Module Structure

```mermaid
flowchart LR
    subgraph Entry["Entry Point"]
        Main["main.py"]
    end

    subgraph Core["Core"]
        Config["config.py\nSettings"]
        AuthMod["auth.py\nJWT Validation"]
        Prompts["prompts/shared.py\nFramework Schemas"]
    end

    subgraph Routes["API Routes"]
        Projects["projects.py"]
        Define["define.py"]
        Query["query.py"]
        Review["review.py"]
    end

    subgraph Models["Models"]
        Schemas["schemas.py\nPydantic Models"]
    end

    subgraph Services["Services"]
        AISvc["ai_service.py"]
        DBSvc["database.py"]
        PubMedSvc["pubmed_service.py"]
        QueryBld["query_builder.py"]
        MeshSvc["mesh_service.py"]
        MedlinePrs["medline_parser.py"]
    end

    Main --> Core
    Main --> Routes
    Routes --> Models
    Routes --> Services
    Services --> Core
```

### 3.2 Service Layer Pattern

```mermaid
classDiagram
    class AIService {
        -model: ChatGoogleGenerativeAI
        -semaphore: Semaphore(5)
        +chat_for_define() ChatResponse
        +extract_framework_data() dict
        +assess_finer() FinerAssessment
        +translate_framework_to_english() dict
        +generate_pubmed_query() str
        +analyze_abstract_batch() list
    }

    class DatabaseService {
        -client: SupabaseClient
        +create_project() Project
        +get_project() Project
        +list_projects() list
        +save_chat_message() Message
        +save_query() QueryString
        +bulk_insert_abstracts() list
        +update_abstract_decision() Abstract
    }

    class PubMedService {
        -api_key: str
        -email: str
        +search() SearchResult
        +get_abstract() Abstract
        +export_results() bytes
    }

    class QueryBuilderService {
        +build_query_strategy() QueryStrategy
        +expand_concept() ConceptBlock
        -get_mesh_terms() list
    }

    class MedlineParser {
        +parse() list~MedlineAbstract~
        -detect_encoding() str
        -parse_record() dict
    }

    AIService ..> Gemini : uses
    DatabaseService ..> Supabase : uses
    PubMedService ..> NCBI : uses
    QueryBuilderService ..> MeSH : uses
```

### 3.3 API Endpoints

```mermaid
flowchart LR
    subgraph Auth["🔐 Auth Required"]
        subgraph ProjectsAPI["Projects"]
            P1["POST /projects"]
            P2["GET /projects"]
            P3["GET /projects/{id}"]
            P4["PATCH /projects/{id}"]
            P5["DELETE /projects/{id}"]
        end

        subgraph DefineAPI["Define Tool"]
            D1["GET /define/frameworks"]
            D2["POST /define/chat"]
            D3["GET /define/conversation/{id}"]
            D4["DELETE /define/conversation/{id}"]
            D5["POST /define/finer-assessment"]
        end

        subgraph QueryAPI["Query Tool"]
            Q1["POST /query/generate"]
            Q2["GET /query/history/{id}"]
            Q3["POST /query/execute"]
            Q4["POST /query/validate"]
            Q5["POST /query/export"]
        end

        subgraph ReviewAPI["Review Tool"]
            R1["POST /review/upload"]
            R2["GET /review/abstracts/{id}"]
            R3["POST /review/analyze"]
            R4["PATCH /review/abstracts/{id}"]
        end
    end

    subgraph Public["🌐 Public"]
        Health["GET /health"]
    end
```

---

## 4. Frontend Architecture

### 4.1 Component Structure

```mermaid
flowchart TB
    subgraph Root["Root Layout"]
        Layout["layout.tsx"]
        AuthProvider["AuthProvider"]
        ErrorBoundary["ErrorBoundary"]
    end

    subgraph Navigation["Navigation"]
        Sidebar["AppSidebar\n(Desktop)"]
        MobileNav["MobileNav\n(Mobile)"]
    end

    subgraph Pages["Pages"]
        Home["page.tsx\n(Home)"]
        DefinePage["define/page.tsx"]
        QueryPage["query/page.tsx"]
        ReviewPage["review/page.tsx"]
        ProjectsPage["projects/page.tsx"]
    end

    subgraph AuthPages["Auth Pages"]
        Login["auth/login/page.tsx"]
        Register["auth/register/page.tsx"]
        Callback["auth/callback/route.ts"]
    end

    subgraph Lib["Libraries"]
        API["lib/api.ts\nAxios Client"]
        Supabase["lib/supabase.ts"]
        Utils["lib/utils.ts"]
    end

    subgraph Context["Contexts"]
        AuthCtx["AuthContext"]
    end

    Layout --> AuthProvider
    Layout --> Navigation
    AuthProvider --> Pages
    AuthProvider --> AuthPages
    Pages --> Lib
    AuthPages --> Lib
    Lib --> Context
```

### 4.2 State Management Flow

```mermaid
flowchart LR
    subgraph Browser["Browser"]
        LocalStorage["Local Storage\n(Supabase Session)"]
    end

    subgraph AuthContext["Auth Context"]
        User["user"]
        Session["session"]
        Loading["loading"]
    end

    subgraph PageState["Page State (useState)"]
        Projects["projects[]"]
        Messages["messages[]"]
        FrameworkData["frameworkData"]
        Abstracts["abstracts[]"]
    end

    subgraph APIClient["API Client"]
        Interceptor["Auth Interceptor"]
        Methods["API Methods"]
    end

    LocalStorage -->|"getSession()"| AuthContext
    AuthContext -->|"Bearer token"| Interceptor
    Interceptor --> Methods
    Methods -->|"response"| PageState
    PageState -->|"render"| Browser
```

---

## 5. Database Schema

### 5.1 Entity Relationship Diagram

```mermaid
erDiagram
    projects ||--o{ files : "has"
    projects ||--o{ abstracts : "has"
    projects ||--o{ chat_messages : "has"
    projects ||--o{ query_strings : "has"
    projects ||--o{ analysis_runs : "has"
    projects ||--o| screening_criteria : "has"
    files ||--o{ abstracts : "contains"

    projects {
        uuid id PK
        varchar name
        text description
        varchar framework_type
        jsonb framework_data
        uuid user_id FK
        timestamptz created_at
        timestamptz updated_at
    }

    files {
        uuid id PK
        uuid project_id FK
        varchar filename
        text file_path
        bigint file_size
        varchar file_type
        varchar status
        timestamptz uploaded_at
        jsonb metadata
    }

    abstracts {
        uuid id PK
        uuid project_id FK
        uuid file_id FK
        varchar pmid UK
        text title
        text abstract
        text authors
        varchar journal
        date publication_date
        text_array keywords
        varchar status
        varchar decision
        text ai_reasoning
        varchar human_decision
        timestamptz screened_at
        jsonb metadata
    }

    chat_messages {
        uuid id PK
        uuid project_id FK
        varchar role
        text content
        timestamptz created_at
        jsonb metadata
    }

    query_strings {
        uuid id PK
        uuid project_id FK
        text query_text
        varchar query_type
        timestamptz created_at
        jsonb metadata
    }

    analysis_runs {
        uuid id PK
        uuid project_id FK
        varchar tool
        varchar status
        timestamptz started_at
        timestamptz completed_at
        jsonb results
        text error_message
        jsonb config
    }

    screening_criteria {
        uuid id PK
        uuid project_id FK
        varchar review_mode
        jsonb population_criteria
        jsonb intervention_criteria
        jsonb comparator_criteria
        jsonb outcome_criteria
        jsonb study_design_criteria
        int total_screened
        int rule_excluded
        int ai_included
        int ai_excluded
        int ai_maybe
        int human_validated
    }
```

### 5.2 Table Relationships

```mermaid
flowchart TB
    subgraph Core["Core Entity"]
        Projects["projects\n(user_id, framework_type)"]
    end

    subgraph DefineData["Define Tool Data"]
        ChatMessages["chat_messages\n(role, content)"]
    end

    subgraph QueryData["Query Tool Data"]
        QueryStrings["query_strings\n(query_text, query_type)"]
    end

    subgraph ReviewData["Review Tool Data"]
        Files["files\n(filename, status)"]
        Abstracts["abstracts\n(pmid, decision)"]
        ScreeningCriteria["screening_criteria\n(PICOS criteria)"]
    end

    subgraph Analytics["Analytics"]
        AnalysisRuns["analysis_runs\n(tool, status, results)"]
    end

    Projects -->|"1:N CASCADE"| ChatMessages
    Projects -->|"1:N CASCADE"| QueryStrings
    Projects -->|"1:N CASCADE"| Files
    Projects -->|"1:N CASCADE"| Abstracts
    Projects -->|"1:1 CASCADE"| ScreeningCriteria
    Projects -->|"1:N CASCADE"| AnalysisRuns
    Files -->|"1:N CASCADE"| Abstracts
```

---

## 6. Authentication Flow

### 6.1 Login Sequence

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Next.js Frontend
    participant Supabase as Supabase Auth
    participant Backend as FastAPI Backend
    participant DB as Supabase DB

    User->>Frontend: Enter credentials
    Frontend->>Supabase: signInWithPassword()
    Supabase-->>Frontend: JWT access_token
    Frontend->>Frontend: Store in session

    User->>Frontend: Access protected page
    Frontend->>Frontend: axios interceptor
    Frontend->>Frontend: getSession()
    Frontend->>Backend: GET /api/v1/projects
    Note right of Frontend: Authorization: Bearer {token}

    Backend->>Supabase: GET /auth/v1/user
    Note right of Backend: Validate JWT
    Supabase-->>Backend: User data (id, email)
    Backend->>DB: SELECT * FROM projects WHERE user_id = ?
    DB-->>Backend: Projects list
    Backend-->>Frontend: JSON response
    Frontend-->>User: Display projects
```

### 6.2 Auth Components

```mermaid
flowchart TB
    subgraph Frontend["Frontend"]
        AuthContext["AuthContext\n(Provider + Hook)"]
        AxiosInterceptor["Axios Interceptor\n(Auto-inject token)"]
        ProtectedRoute["Protected Route\n(Redirect if not auth)"]
    end

    subgraph Backend["Backend"]
        GetCurrentUser["get_current_user()\n(FastAPI Dependency)"]
        HTTPBearer["HTTPBearer\n(Security Scheme)"]
    end

    subgraph Supabase["Supabase"]
        AuthAPI["Auth API\n(/auth/v1/user)"]
        Session["Session Store"]
    end

    AuthContext -->|"manages"| Session
    AxiosInterceptor -->|"reads"| AuthContext
    AxiosInterceptor -->|"injects token"| GetCurrentUser
    GetCurrentUser -->|"validates"| AuthAPI
    ProtectedRoute -->|"checks"| AuthContext
```

---

## 7. Tool-Specific Data Flows

### 7.1 Define Tool Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Define Page
    participant API as FastAPI
    participant AI as Gemini AI
    participant DB as Supabase

    User->>Frontend: Type message
    Frontend->>API: POST /define/chat
    Note right of Frontend: {project_id, message, framework_type}

    API->>DB: Save user message
    API->>DB: Get conversation history
    DB-->>API: Last 50 messages

    API->>AI: chat_for_define()
    Note right of API: System prompt + history + user message
    AI-->>API: {chat_response, framework_data, finer_assessment}

    API->>DB: Save AI response
    API->>DB: Update project.framework_data
    API-->>Frontend: ChatResponse

    Frontend->>Frontend: Update UI
    Frontend-->>User: Display AI response + extracted data

    opt FINER Assessment Ready
        Frontend->>Frontend: Show FINER dialog
        User->>Frontend: View assessment
    end
```

### 7.2 Query Tool Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Query Page
    participant API as FastAPI
    participant QueryBld as Query Builder
    participant MeSH as MeSH API
    participant AI as Gemini AI
    participant PubMed as PubMed API
    participant DB as Supabase

    User->>Frontend: Click "Generate Query"
    Frontend->>API: POST /query/generate
    Note right of Frontend: {project_id, framework_data}

    API->>AI: translate_framework_to_english()
    AI-->>API: Translated fields

    API->>QueryBld: build_query_strategy()

    loop For each concept (P, I, C, O)
        QueryBld->>MeSH: expand_term()
        MeSH-->>QueryBld: MeSH descriptors + synonyms
    end

    QueryBld-->>API: {concepts, queries, toolbox}

    alt MeSH API Failed
        API->>AI: generate_pubmed_query()
        AI-->>API: Boolean query (fallback)
    end

    API->>DB: Save query_string
    API-->>Frontend: QueryGenerateResponse

    Frontend-->>User: Display 3 query strategies

    User->>Frontend: Click "Execute"
    Frontend->>API: POST /query/execute
    API->>PubMed: ESearch + ESummary
    PubMed-->>API: Results
    API-->>Frontend: Search results
    Frontend-->>User: Display results
```

### 7.3 Review Tool Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Review Page
    participant API as FastAPI
    participant Parser as MEDLINE Parser
    participant AI as Gemini AI
    participant DB as Supabase

    User->>Frontend: Upload MEDLINE file
    Frontend->>API: POST /review/upload
    Note right of Frontend: multipart/form-data

    API->>API: Validate file (type, size, content)
    API->>API: Save to uploads/
    API->>DB: Create file record (status: processing)

    API-->>Frontend: {file_id, status: processing}

    API->>Parser: Background: parse_medline_file()
    Parser->>Parser: Detect encoding
    Parser->>Parser: Parse PMID, title, abstract, etc.
    Parser->>DB: Bulk insert abstracts
    Parser->>DB: Update file status: completed

    Frontend->>API: GET /review/abstracts/{project_id}
    API->>DB: SELECT abstracts
    DB-->>API: Abstracts list
    API-->>Frontend: PaginatedAbstractsResponse
    Frontend-->>User: Display abstracts

    User->>Frontend: Click "Run AI Screening"
    Frontend->>API: POST /review/analyze
    API->>DB: Create analysis_run (status: running)

    API->>AI: Background: analyze_abstract_batch()
    loop For each batch of 10
        AI->>AI: Screen against PICOS criteria
        AI-->>DB: Update decisions
    end
    AI->>DB: Update analysis_run (status: completed)

    Frontend->>API: Poll status
    API-->>Frontend: Updated abstracts
    Frontend-->>User: Show AI decisions

    User->>Frontend: Override decision
    Frontend->>API: PATCH /review/abstracts/{id}
    API->>DB: Update human_decision
    API-->>Frontend: Updated abstract
```

---

## 8. External Services Integration

### 8.1 Service Dependencies

```mermaid
flowchart LR
    subgraph Backend["FastAPI Backend"]
        AISvc["AI Service"]
        DBSvc["DB Service"]
        PubMedSvc["PubMed Service"]
        QueryBld["Query Builder"]
    end

    subgraph Google["Google Cloud"]
        Gemini["Gemini AI\n(2.5 Flash / Pro)"]
    end

    subgraph Supabase["Supabase"]
        Postgres["PostgreSQL\n(Database)"]
        Auth["Auth Service\n(JWT)"]
    end

    subgraph NCBI["NCBI"]
        PubMed["PubMed\nE-utilities"]
        MeSH["MeSH API\n(Term Expansion)"]
    end

    AISvc -->|"LangChain"| Gemini
    DBSvc -->|"supabase-py"| Postgres
    DBSvc -->|"JWT validation"| Auth
    PubMedSvc -->|"ESearch/ESummary"| PubMed
    QueryBld -->|"Term lookup"| MeSH
```

### 8.2 API Rate Limits & Timeouts

```mermaid
flowchart TB
    subgraph Gemini["Gemini AI"]
        GeminiLimit["Concurrency: 5 (semaphore)\nDefault timeout: 30s\nQuery timeout: 25s\nTranslation timeout: 10s"]
    end

    subgraph PubMed["PubMed API"]
        PubMedLimit["With API key: 10 req/sec\nWithout key: 3 req/sec\nEmail required"]
    end

    subgraph Backend["Backend Rate Limiting"]
        ChatLimit["/define/chat: 10/min"]
        QueryLimit["/query/generate: 20/min"]
    end
```

---

## 9. Deployment Architecture

### 9.1 Production Environment

```mermaid
flowchart TB
    subgraph Users["Users"]
        Browser["Web Browser"]
    end

    subgraph Vercel["Vercel (Frontend)"]
        NextJS["Next.js 15\nshaitamam.com"]
    end

    subgraph Railway["Railway (Backend)"]
        Docker["Docker Container\nFastAPI"]
        Dockerfile["Dockerfile"]
    end

    subgraph Supabase["Supabase Cloud"]
        Postgres["PostgreSQL"]
        Auth["Auth Service"]
    end

    subgraph Google["Google Cloud"]
        Gemini["Gemini AI API"]
    end

    subgraph NCBI["NCBI"]
        PubMed["PubMed API"]
    end

    Browser -->|"HTTPS"| NextJS
    NextJS -->|"api.shaitamam.com"| Docker
    Docker --> Postgres
    Docker --> Auth
    Docker --> Gemini
    Docker --> PubMed
```

### 9.2 Environment Variables

```mermaid
flowchart LR
    subgraph Backend["Backend (.env)"]
        BE1["GOOGLE_API_KEY"]
        BE2["SUPABASE_URL"]
        BE3["SUPABASE_KEY"]
        BE4["SUPABASE_SERVICE_ROLE_KEY"]
        BE5["NCBI_API_KEY"]
        BE6["NCBI_EMAIL"]
        BE7["DEBUG"]
    end

    subgraph Frontend["Frontend (.env.local)"]
        FE1["NEXT_PUBLIC_API_URL"]
        FE2["NEXT_PUBLIC_SUPABASE_URL"]
        FE3["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
    end

    BE1 --> Gemini["Gemini AI"]
    BE2 --> Supabase["Supabase"]
    BE3 --> Supabase
    BE4 --> Supabase
    BE5 --> NCBI["NCBI APIs"]
    BE6 --> NCBI

    FE1 --> Backend["Backend API"]
    FE2 --> SupabaseClient["Supabase Client"]
    FE3 --> SupabaseClient
```

---

## Appendix: Framework Types Supported

| Framework | Use Case | Components |
|-----------|----------|------------|
| PICO | Clinical interventions | Population, Intervention, Comparison, Outcome |
| PICOT | Time-sensitive studies | + Time |
| PICOS | Study design focus | + Study Design |
| PICOC | Context matters | + Context |
| PICOTS | Comprehensive RCTs | + Time + Setting |
| CoCoPop | Prevalence studies | Condition, Context, Population |
| PEO | Qualitative research | Population, Exposure, Outcome |
| PECO | Environmental exposures | + Comparison |
| PCC | Scoping reviews | Population, Concept, Context |
| PICo | Qualitative JBI | Population, Interest, Context |
| SPIDER | Qualitative synthesis | Sample, Phenomenon, Design, Evaluation, Research type |
| SPICE | Policy evaluation | Setting, Perspective, Intervention, Comparison, Evaluation |
| ECLIPSE | Health policy | Expectation, Client, Location, Impact, Professionals, Service |
| CIMO | Management research | Context, Intervention, Mechanism, Outcome |
| BeHEMoTh | Theory frameworks | Behavior, Health condition, Exclusions, Models, Theories |
| PerSPEcTiF | Complex interventions | Perspective, Setting, Phenomenon, Environment, Timing, Findings |
