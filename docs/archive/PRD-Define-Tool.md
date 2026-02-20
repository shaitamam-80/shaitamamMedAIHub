# PRD: Define Tool - Research Question Formulation Module

**Version:** 2.0
**Status:** Draft
**Author:** Product Management
**Date:** 2026-01-28
**Project:** MedAI Hub - Systematic Literature Review Platform

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Context](#2-product-context)
3. [Current State Analysis](#3-current-state-analysis)
4. [Technical Architecture](#4-technical-architecture)
5. [Data Models & Schemas](#5-data-models--schemas)
6. [API Specifications](#6-api-specifications)
7. [User Flows](#7-user-flows)
8. [Feature Inventory](#8-feature-inventory)
9. [Framework System](#9-framework-system)
10. [FINER Assessment System](#10-finer-assessment-system)
11. [Internationalization (i18n)](#11-internationalization-i18n)
12. [Integration Points](#12-integration-points)
13. [Known Limitations](#13-known-limitations)
14. [Module Boundaries](#14-module-boundaries)
15. [File Reference](#15-file-reference)

---

## 1. Executive Summary

### 1.1 Purpose

The **Define Tool** is the first module in the MedAI Hub systematic literature review pipeline. Its primary function is to help medical researchers formulate well-structured research questions using evidence-based frameworks (PICO, CoCoPop, SPIDER, etc.).

### 1.2 Core Value Proposition

- **AI-Guided Formulation**: Conversational AI helps researchers articulate their research questions
- **Framework Auto-Detection**: AI automatically identifies the best-fit framework based on question type
- **Quality Assessment**: Automatic FINER evaluation ensures research questions are Feasible, Interesting, Novel, Ethical, and Relevant
- **Bilingual Support**: Full Hebrew and English support with proper RTL/LTR handling

### 1.3 Module Position in Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        MedAI Hub Pipeline                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────┐      ┌─────────┐      ┌──────────┐      ┌─────────┐      │
│   │ DEFINE  │ ───► │  QUERY  │ ───► │ SCREENING│ ───► │ REVIEW  │      │
│   │  Tool   │      │  Tool   │      │   Tool   │      │  Tool   │      │
│   └─────────┘      └─────────┘      └──────────┘      └─────────┘      │
│       ▲                                                                 │
│       │                                                                 │
│   YOU ARE HERE                                                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.4 Key Metrics (Current)

| Metric | Value |
|--------|-------|
| Supported Frameworks | 17+ |
| Languages | 2 (EN, HE) |
| Rate Limit | 10 req/min |
| API Timeout | 30 seconds |
| Max Conversation Length | 50 messages |

---

## 2. Product Context

### 2.1 Target Users

**Primary:** Medical researchers conducting systematic literature reviews
- Academic researchers
- Clinical researchers
- PhD/Master's students
- Evidence synthesis teams

**User Skill Levels:**
- May not be familiar with PICO/research frameworks
- May write in Hebrew (need English output for PubMed)
- Need guidance on formulating answerable research questions

### 2.2 User Problem Statement

> "I have a research idea but don't know how to structure it into a proper systematic review question. I don't know which framework (PICO, CoCoPop, etc.) is appropriate for my question type."

### 2.3 Solution

The Define Tool provides an AI-powered conversational interface that:
1. Listens to the researcher's natural description of their research interest
2. Identifies the appropriate framework based on question type
3. Extracts structured components (Population, Intervention, etc.)
4. Formulates multiple versions of the research question
5. Evaluates question quality using FINER criteria
6. Outputs structured data ready for the Query Tool

---

## 3. Current State Analysis

### 3.1 Existing Functionality

| Feature | Status | Notes |
|---------|--------|-------|
| AI Chat Interface | ✅ Implemented | Gemini Flash model |
| Framework Detection | ✅ Implemented | 17+ frameworks |
| Component Extraction | ✅ Implemented | Dynamic JSONB storage |
| FINER Assessment | ✅ Implemented | Auto + standalone |
| Hebrew Support | ✅ Implemented | RTL, bilingual output |
| Conversation History | ✅ Implemented | Persisted in DB |
| Protocol Export | ✅ Implemented | .txt format |
| Manual Editing | ✅ Implemented | In protocol dialog |
| Project Integration | ✅ Implemented | Per-project conversations |

### 3.2 Current Tech Stack

| Layer | Technology |
|-------|------------|
| Backend Framework | FastAPI (Python 3.11) |
| AI Model | Google Gemini Flash |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (JWT) |
| Frontend Framework | Next.js 15 (TypeScript) |
| UI Library | Shadcn UI + Tailwind CSS |
| API Client | Axios |

### 3.3 Current Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Next.js)                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────────┐  │
│  │  Define Page     │    │  ChatMessage     │    │  FinerCardV2         │  │
│  │  (page.tsx)      │    │  Component       │    │  Component           │  │
│  │                  │    │                  │    │                      │  │
│  │  - State Mgmt    │    │  - RTL/LTR       │    │  - Score Display     │  │
│  │  - Chat Flow     │    │  - Markdown      │    │  - Criteria Bars     │  │
│  │  - Project Sel   │    │  - Hebrew Detect │    │  - Question Card     │  │
│  └────────┬─────────┘    └──────────────────┘    └──────────────────────┘  │
│           │                                                                │
│           ▼                                                                │
│  ┌──────────────────┐                                                      │
│  │  API Client      │ ◄─────── Axios with JWT interceptor                  │
│  │  (lib/api.ts)    │                                                      │
│  └────────┬─────────┘                                                      │
│           │                                                                │
└───────────┼────────────────────────────────────────────────────────────────┘
            │ HTTPS
            ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND (FastAPI)                             │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────────┐  │
│  │  Define Routes   │    │  AI Service      │    │  Database Service    │  │
│  │  (/define/*)     │    │                  │    │                      │  │
│  │                  │    │  - chat_for_     │    │  - save_message()    │  │
│  │  - /chat         │───►│    define()      │    │  - get_conversation()│  │
│  │  - /frameworks   │    │  - Gemini API    │    │  - update_project()  │  │
│  │  - /conversation │    │  - JSON extract  │    │                      │  │
│  │  - /finer        │    │                  │    │                      │  │
│  └──────────────────┘    └────────┬─────────┘    └──────────┬───────────┘  │
│                                   │                         │              │
│                                   ▼                         ▼              │
│                          ┌──────────────┐           ┌──────────────┐       │
│                          │  Gemini API  │           │   Supabase   │       │
│                          │  (Google)    │           │   (PostgreSQL)│      │
│                          └──────────────┘           └──────────────┘       │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Technical Architecture

### 4.1 Backend Components

#### 4.1.1 Routes Layer (`/backend/app/api/routes/define.py`)

**Endpoints:**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/define/frameworks` | Get all framework schemas | No |
| POST | `/api/v1/define/chat` | Send message, get AI response | Yes |
| GET | `/api/v1/define/conversation/{project_id}` | Get chat history | Yes |
| DELETE | `/api/v1/define/conversation/{project_id}` | Clear chat history | Yes |
| POST | `/api/v1/define/finer-assessment` | Standalone FINER evaluation | Yes |

#### 4.1.2 Service Layer

**AI Service (`ai_service.py`):**
- Singleton pattern
- Handles all Gemini API communication
- Rate limiting via semaphore (5 concurrent calls)
- JSON extraction from AI responses
- Timeout handling (30 seconds)
- Retry logic (2 attempts)

**Database Service (`database.py`):**
- Singleton pattern
- All Supabase operations
- Message persistence
- Project updates

#### 4.1.3 Prompt Engineering (`/backend/app/core/prompts/define.py`)

The system prompt defines the AI as a "Systematic Review Question Architect" with:
- Expert knowledge in information science and evidence-based medicine
- Triage process for framework selection
- JSON output format specification
- Bilingual response handling

### 4.2 Frontend Components

#### 4.2.1 Page Component (`/frontend/app/define/page.tsx`)

**State Management:**
```typescript
// Core state
const [projects, setProjects] = useState<Project[]>([]);
const [selectedProjectId, setSelectedProjectId] = useState<string>("");
const [messages, setMessages] = useState<ChatMessage[]>([]);
const [frameworkData, setFrameworkData] = useState<Record<string, string>>({});
const [preferredLanguage, setPreferredLanguage] = useState<"he" | "en" | null>(null);

// UI state
const [isLoading, setIsLoading] = useState(false);
const [showProtocol, setShowProtocol] = useState(false);

// Framework state
const [frameworks, setFrameworks] = useState<Record<string, FrameworkSchema>>({});
const [selectedFramework, setSelectedFramework] = useState<string>("PICO");

// FINER state
const [formulatedQuestionsMap, setFormulatedQuestionsMap] = useState<Record<number, FormulatedQuestion[]>>({});
```

#### 4.2.2 Child Components

| Component | Purpose |
|-----------|---------|
| `ChatMessage.tsx` | Renders individual chat bubbles with RTL/LTR support |
| `FinerCardV2.tsx` | Displays FINER assessment cards with scores |
| `LanguageSelector.tsx` | Initial language selection dialog |

### 4.3 Data Flow

```
1. User types message
         ↓
2. Frontend validates input
         ↓
3. POST /api/v1/define/chat
   {project_id, message, framework_type, language}
         ↓
4. Backend saves user message to chat_messages table
         ↓
5. Backend loads conversation history (last 50 messages)
         ↓
6. AI Service builds prompt:
   - System prompt (define.py)
   - Conversation history
   - User's new message
         ↓
7. Gemini API processes and returns JSON:
   {
     chat_response: "...",
     framework_data: {...},
     formulated_questions: [...],
     finer_assessment: {...}
   }
         ↓
8. Backend extracts JSON, saves AI response
         ↓
9. Backend updates project.framework_data
         ↓
10. Response returned to frontend
          ↓
11. Frontend updates state:
    - Add message to messages[]
    - Update frameworkData
    - Store formulated questions
          ↓
12. UI renders:
    - Chat bubble with AI response
    - FINER cards (if formulated questions present)
    - Updated protocol indicator
```

---

## 5. Data Models & Schemas

### 5.1 Database Schema

#### projects Table
```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    framework_type VARCHAR(50) DEFAULT 'PICO',
    framework_data JSONB DEFAULT '{}',
    user_id UUID NOT NULL,
    current_step VARCHAR(50) DEFAULT 'DEFINE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_framework_type CHECK (
        framework_type IN (
            'PICO', 'CoCoPop', 'PEO', 'SPIDER', 'SPICE',
            'ECLIPSE', 'FINER', 'PFO', 'PICOT', 'PICOC',
            'PICOS', 'PICOTS', 'PECO', 'PIRD', 'PCC',
            'PICo', 'CIMO', 'BeHEMoTh', 'PerSPEcTiF'
        )
    )
);
```

#### chat_messages Table
```sql
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_project_id ON chat_messages(project_id);
```

### 5.2 Pydantic Models (Backend)

#### Request Models
```python
class ChatRequest(BaseModel):
    project_id: UUID
    message: str
    framework_type: str = "PICO"
    language: str = "en"  # "en" or "he"

class FinerAssessmentRequest(BaseModel):
    project_id: UUID
    research_question: str
    framework_type: str
    framework_data: Dict[str, str]
    language: str = "en"
```

#### Response Models
```python
class ChatResponse(BaseModel):
    message: str
    framework_data: Optional[Dict[str, str]] = None
    extracted_fields: Optional[List[str]] = None
    finer_assessment: Optional[FinerAssessment] = None
    formulated_questions: Optional[List[FormulatedQuestion]] = None

class FinerScore(BaseModel):
    score: str  # "high", "medium", "low"
    reason: str

class FinerAssessment(BaseModel):
    F: FinerScore  # Feasible
    I: FinerScore  # Interesting
    N: FinerScore  # Novel
    E: FinerScore  # Ethical
    R: FinerScore  # Relevant
    overall_score: int  # 0-100
    recommendation: str  # "proceed", "revise", "reconsider"
    suggestions: Optional[List[str]] = None

class FormulatedQuestion(BaseModel):
    type: str  # "broad", "focused", "alternative"
    hebrew: Optional[str] = None
    english: str
    finer_assessment: Optional[FinerAssessment] = None
```

### 5.3 TypeScript Types (Frontend)

```typescript
interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at?: string;
}

interface FinerScore {
  score: 'high' | 'medium' | 'low';
  reason: string;
}

interface FinerAssessment {
  F: FinerScore;
  I: FinerScore;
  N: FinerScore;
  E: FinerScore;
  R: FinerScore;
  overall_score: number;
  recommendation: 'proceed' | 'revise' | 'reconsider';
  suggestions?: string[];
}

interface FormulatedQuestion {
  type: 'broad' | 'focused' | 'alternative';
  hebrew?: string;
  english: string;
  finer_assessment?: FinerAssessment;
}

interface ChatResponse {
  message: string;
  framework_data?: Record<string, string>;
  extracted_fields?: string[];
  finer_assessment?: FinerAssessment;
  formulated_questions?: FormulatedQuestion[];
}

interface FrameworkSchema {
  name: string;
  description: string;
  fields: {
    key: string;
    label: string;
    description?: string;
  }[];
}
```

---

## 6. API Specifications

### 6.1 GET /api/v1/define/frameworks

**Description:** Returns all available research framework schemas.

**Authentication:** Not required

**Response:**
```json
{
  "frameworks": {
    "PICO": {
      "name": "PICO",
      "description": "Population, Intervention, Comparison, Outcome",
      "fields": [
        {"key": "P", "label": "Population", "description": "Who is the patient/problem?"},
        {"key": "I", "label": "Intervention", "description": "What is the intervention?"},
        {"key": "C", "label": "Comparison", "description": "What is it compared to?"},
        {"key": "O", "label": "Outcome", "description": "What is the desired outcome?"}
      ]
    },
    "CoCoPop": {...},
    ...
  }
}
```

### 6.2 POST /api/v1/define/chat

**Description:** Send a chat message and receive AI response with framework extraction.

**Authentication:** Required (Bearer token)

**Rate Limit:** 10 requests/minute

**Request:**
```json
{
  "project_id": "uuid-string",
  "message": "I want to study whether exercise helps depression in elderly patients",
  "framework_type": "PICO",
  "language": "en"
}
```

**Response:**
```json
{
  "message": "I understand you're interested in studying the effectiveness of exercise...",
  "framework_data": {
    "P": "Elderly patients with depression",
    "I": "Exercise intervention",
    "C": "Standard care or no intervention",
    "O": "Depression symptoms and severity"
  },
  "extracted_fields": ["P", "I", "C", "O"],
  "formulated_questions": [
    {
      "type": "broad",
      "english": "What is the effect of exercise on depression in elderly patients?",
      "hebrew": "מהי השפעת הפעילות הגופנית על דיכאון בקרב קשישים?",
      "finer_assessment": {
        "F": {"score": "high", "reason": "Large elderly population available"},
        "I": {"score": "high", "reason": "Depression is a major health concern"},
        "N": {"score": "medium", "reason": "Adds to growing evidence base"},
        "E": {"score": "high", "reason": "Low-risk intervention"},
        "R": {"score": "high", "reason": "Could inform clinical guidelines"},
        "overall_score": 85,
        "recommendation": "proceed",
        "suggestions": ["Consider specifying exercise type"]
      }
    },
    {
      "type": "focused",
      "english": "In elderly patients (≥65 years) with major depressive disorder, does a structured aerobic exercise program compared to usual care reduce depression severity as measured by PHQ-9 scores?",
      "hebrew": "בקרב מטופלים קשישים (מעל גיל 65) עם הפרעת דיכאון מג'ורית, האם תוכנית פעילות אירובית מובנית בהשוואה לטיפול רגיל מפחיתה את חומרת הדיכאון כפי שנמדד בציון PHQ-9?",
      "finer_assessment": {...}
    }
  ]
}
```

**Error Responses:**

| Code | Description |
|------|-------------|
| 400 | Invalid request body |
| 401 | Missing or invalid token |
| 403 | User doesn't own project |
| 404 | Project not found |
| 429 | Rate limit exceeded |
| 500 | AI service error |

### 6.3 GET /api/v1/define/conversation/{project_id}

**Description:** Retrieve conversation history for a project.

**Authentication:** Required

**Response:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "I want to study exercise for depression",
      "created_at": "2026-01-28T10:30:00Z"
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "I understand you're interested in...",
      "created_at": "2026-01-28T10:30:05Z"
    }
  ]
}
```

### 6.4 DELETE /api/v1/define/conversation/{project_id}

**Description:** Clear all messages for a project.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Conversation cleared"
}
```

### 6.5 POST /api/v1/define/finer-assessment

**Description:** Standalone FINER assessment for any research question.

**Authentication:** Required

**Request:**
```json
{
  "project_id": "uuid",
  "research_question": "Does exercise reduce depression in elderly?",
  "framework_type": "PICO",
  "framework_data": {
    "P": "Elderly patients",
    "I": "Exercise",
    "C": "No exercise",
    "O": "Depression"
  },
  "language": "en"
}
```

**Response:**
```json
{
  "finer_assessment": {
    "F": {"score": "high", "reason": "..."},
    "I": {"score": "high", "reason": "..."},
    "N": {"score": "medium", "reason": "..."},
    "E": {"score": "high", "reason": "..."},
    "R": {"score": "high", "reason": "..."},
    "overall_score": 85,
    "recommendation": "proceed",
    "suggestions": ["..."]
  }
}
```

---

## 7. User Flows

### 7.1 Primary Flow: Research Question Formulation

```
┌─────────────────────────────────────────────────────────────────────┐
│                    RESEARCH QUESTION FORMULATION                    │
└─────────────────────────────────────────────────────────────────────┘

     ┌──────────────┐
     │    START     │
     └──────┬───────┘
            │
            ▼
     ┌──────────────┐
     │ Select/Create│
     │   Project    │
     └──────┬───────┘
            │
            ▼
     ┌──────────────┐        ┌──────────────┐
     │   Language   │───────►│   English    │
     │   Selection  │        │   or Hebrew  │
     └──────┬───────┘        └──────┬───────┘
            │                       │
            ◄───────────────────────┘
            │
            ▼
     ┌──────────────┐
     │  Describe    │
     │  Research    │◄───────────────────┐
     │  Interest    │                    │
     └──────┬───────┘                    │
            │                            │
            ▼                            │
     ┌──────────────┐                    │
     │   AI Triage  │                    │
     │  (Framework  │                    │
     │  Detection)  │                    │
     └──────┬───────┘                    │
            │                            │
            ▼                            │
     ┌──────────────┐        ┌──────────────┐
     │  AI Extracts │        │  Missing     │
     │  Components  │───────►│  Components? │───Yes──►│ AI Asks     │
     └──────┬───────┘        └──────┬───────┘        │ Clarifying  │
            │                       │                │ Questions   │
            │                       No               └──────┬──────┘
            │                       │                       │
            │                       ▼                       │
            │               ┌──────────────┐                │
            │               │ AI Formulates│                │
            │               │  Questions   │                │
            │               │ (3 versions) │                │
            │               └──────┬───────┘                │
            │                      │                        │
            │                      ▼                        │
            │               ┌──────────────┐                │
            │               │    FINER     │                │
            │               │  Assessment  │                │
            │               └──────┬───────┘                │
            │                      │                        │
            │                      ▼                        │
            │               ┌──────────────┐                │
            └──────────────►│   Display    │◄───────────────┘
                            │   Results    │
                            └──────┬───────┘
                                   │
                                   ▼
                            ┌──────────────┐
                            │  Satisfied?  │───No───► (Continue Chat)
                            └──────┬───────┘
                                   │
                                   Yes
                                   │
                                   ▼
                            ┌──────────────┐
                            │ View/Export  │
                            │   Protocol   │
                            └──────┬───────┘
                                   │
                                   ▼
                            ┌──────────────┐
                            │   Proceed    │
                            │  to Query    │
                            │    Tool      │
                            └──────────────┘
```

### 7.2 Secondary Flow: Framework Change

```
User in active conversation
         │
         ▼
AI suggests different framework
         │
         ▼
User opens Protocol Dialog
         │
         ▼
User changes framework dropdown
         │
         ▼
AI re-extracts with new framework
         │
         ▼
Continue conversation
```

### 7.3 Secondary Flow: Manual Edit

```
User views Protocol Dialog
         │
         ▼
User edits component value
         │
         ▼
Save changes to project
         │
         ▼
Optional: Export as .txt
```

---

## 8. Feature Inventory

### 8.1 Core Features

| Feature | Description | Status |
|---------|-------------|--------|
| AI Chat Interface | Conversational interface for question formulation | ✅ |
| Framework Auto-Detection | AI identifies best framework from question type | ✅ |
| Component Extraction | AI extracts P, I, C, O etc. from conversation | ✅ |
| Multiple Formulations | 3 versions: Broad, Focused, Alternative | ✅ |
| FINER Assessment | Quality evaluation with scores and suggestions | ✅ |
| Conversation History | Persisted per-project chat history | ✅ |
| Protocol Dialog | View and edit extracted components | ✅ |
| Protocol Export | Download as .txt file | ✅ |
| Language Selection | Choose EN or HE at conversation start | ✅ |
| RTL Support | Proper Hebrew text direction | ✅ |
| Project Integration | Conversations tied to projects | ✅ |

### 8.2 UI Features

| Feature | Description | Status |
|---------|-------------|--------|
| Responsive Chat Layout | Full-height chat with auto-scroll | ✅ |
| Message Bubbles | User/AI message differentiation | ✅ |
| Loading Indicators | Visual feedback during AI processing | ✅ |
| FINER Cards | Visual score cards next to messages | ✅ |
| Score Color Coding | Green (high), Yellow (medium), Red (low) | ✅ |
| Markdown Rendering | Rich text in AI responses | ✅ |
| Keyboard Shortcuts | Enter to send, Shift+Enter for newline | ✅ |

### 8.3 Backend Features

| Feature | Description | Status |
|---------|-------------|--------|
| JWT Authentication | Secure API access | ✅ |
| Rate Limiting | 10 req/min per user | ✅ |
| Timeout Handling | 30-second timeout with fallback | ✅ |
| Retry Logic | 2 retries on API quota errors | ✅ |
| JSON Extraction | Robust parsing from AI responses | ✅ |
| Concurrent Request Limiting | Max 5 simultaneous Gemini calls | ✅ |

---

## 9. Framework System

### 9.1 Supported Frameworks (17+)

#### Intervention/Effectiveness Questions

| Framework | Components | Use Case |
|-----------|------------|----------|
| PICO | P, I, C, O | Standard intervention effectiveness |
| PICOT | P, I, C, O, T | Time-sensitive interventions |
| PICOS | P, I, C, O, S | When study design matters |
| PICOC | P, I, C, O, Context | Setting-dependent questions |
| PICOTS | P, I, C, O, T, S | Comprehensive intervention |
| PICOT-D | P, I, C, O, T, D | Digital health interventions |
| PICOTS-ComTeC | P, I, C, O, T, S, Com, Tec | Complex digital interventions |

#### Epidemiology/Prevalence Questions

| Framework | Components | Use Case |
|-----------|------------|----------|
| CoCoPop | Condition, Context, Population | Prevalence, incidence studies |

#### Etiology/Risk Factor Questions

| Framework | Components | Use Case |
|-----------|------------|----------|
| PEO | P, E, O | Exposure and outcomes |
| PECO | P, E, C, O | Comparative exposure studies |

#### Prognosis Questions

| Framework | Components | Use Case |
|-----------|------------|----------|
| PFO | P, F, O | Prognostic factor studies |

#### Diagnostic Questions

| Framework | Components | Use Case |
|-----------|------------|----------|
| PIRD | P, I, R, D | Diagnostic accuracy studies |

#### Qualitative Questions

| Framework | Components | Use Case |
|-----------|------------|----------|
| PICo | P, I, Co | Qualitative (JBI standard) |
| SPIDER | S, P, D, E, R | Qualitative/mixed methods |
| SPICE | S, P, I, C, E | Health services evaluation |

#### Scoping Reviews

| Framework | Components | Use Case |
|-----------|------------|----------|
| PCC | P, C, Context | Scoping review questions |

#### Policy/Complex Questions

| Framework | Components | Use Case |
|-----------|------------|----------|
| ECLIPSE | E, C, L, I, P, SE | Policy and service questions |
| CIMO | C, I, M, O | Realist reviews |

#### Specialized

| Framework | Components | Use Case |
|-----------|------------|----------|
| BeHEMoTh | B, H, E, M | Theory-based reviews |
| PerSPEcTiF | All components | Health equity reviews |

### 9.2 Framework Schema Structure

```python
FRAMEWORK_SCHEMAS = {
    "PICO": {
        "name": "PICO",
        "description": "Population, Intervention, Comparison, Outcome",
        "use_case": "Intervention effectiveness questions",
        "components": ["P", "I", "C", "O"],
        "labels": {
            "P": "Population",
            "I": "Intervention",
            "C": "Comparison",
            "O": "Outcome"
        },
        "trigger_words": [
            "effectiveness", "efficacy", "does it work",
            "better than", "compared to", "treatment"
        ],
        "field_descriptions": {
            "P": "Who is the patient/population? Consider age, gender, condition, setting.",
            "I": "What is the intervention/exposure being studied?",
            "C": "What is it being compared to? (placebo, standard care, alternative)",
            "O": "What outcomes are being measured? (primary and secondary)"
        }
    },
    ...
}
```

### 9.3 Framework Detection Algorithm

The AI uses a triage process:

1. **Step 1: Diagnose Question Type**
   - Keywords → Question type → Framework candidates

2. **Step 2: Check for Specialized Needs**
   - Health equity → PerSPEcTiF
   - Digital health → PICOT-D or PICOTS-ComTeC
   - Theory-based → BeHEMoTh

3. **Step 3: Select and Explain**
   - Present choice with rationale
   - Offer to switch if user disagrees

**Decision Tree (Simplified):**
```
"Does X work?" ──────────► PICO family
"How common is X?" ──────► CoCoPop
"What causes X?" ─────────► PEO/PECO
"What predicts X?" ───────► PFO
"How accurate is test?" ──► PIRD
"What is the experience?" ► PICo/SPIDER
"What is known about X?" ─► PCC (scoping)
```

---

## 10. FINER Assessment System

### 10.1 FINER Criteria

| Criterion | Question | Evaluation Focus |
|-----------|----------|------------------|
| **F**easible | Can this study be realistically conducted? | Resources, time, access, sample size |
| **I**nteresting | Is this genuinely interesting? | Scientific curiosity, clinical impact |
| **N**ovel | Does this add new knowledge? | Gaps in literature, new angles |
| **E**thical | Can this be conducted ethically? | Risk/benefit, consent, vulnerable populations |
| **R**elevant | Will results matter? | Clinical practice, policy, guidelines |

### 10.2 Scoring System

**Per-Criterion Scores:**
- `high` → 100 points
- `medium` → 50 points
- `low` → 0 points

**Overall Score Calculation:**
```
overall_score = (F + I + N + E + R) / 5
```

**Recommendation Thresholds:**
- `overall_score >= 75` → "proceed"
- `overall_score >= 50 && < 75` → "revise"
- `overall_score < 50` → "reconsider"

### 10.3 FINER Card Display

```
┌─────────────────────────────────────────┐
│ ██████████████████████████████  85/100  │ ← Overall score bar
├─────────────────────────────────────────┤
│ 📊 Focused Question                     │ ← Question type
├─────────────────────────────────────────┤
│ In elderly patients (≥65 years) with    │
│ major depressive disorder, does a       │
│ structured aerobic exercise program...  │ ← Question text
├─────────────────────────────────────────┤
│ ▸ עברית: בקרב מטופלים קשישים...         │ ← Hebrew translation
├─────────────────────────────────────────┤
│ [F][I][N][E][R]                         │ ← Mini indicators
│  🟢 🟢 🟡 🟢 🟢                            │   (green/yellow/red)
└─────────────────────────────────────────┘
```

---

## 11. Internationalization (i18n)

### 11.1 Supported Languages

| Language | Code | Direction | Status |
|----------|------|-----------|--------|
| English | `en` | LTR | ✅ Full support |
| Hebrew | `he` | RTL | ✅ Full support |

### 11.2 Language Behavior

**English Mode (`language: "en"`):**
- AI responds entirely in English
- No Hebrew translations provided
- LTR text direction

**Hebrew Mode (`language: "he"`):**
- AI responds entirely in Hebrew
- Formulated questions include BOTH Hebrew AND English translations
- English translations required for PubMed queries
- RTL text direction in chat
- UI elements remain in English (labels, buttons)

### 11.3 RTL Implementation Requirements

**CSS Requirements:**
```css
/* Hebrew message bubbles */
[dir="rtl"] .message-content {
  text-align: right;
  direction: rtl;
}

/* Mixed content handling */
.mixed-content {
  unicode-bidi: plaintext;
}
```

**React Component Pattern:**
```tsx
const isHebrew = detectHebrew(content);
return (
  <div
    dir={isHebrew ? "rtl" : "ltr"}
    className={cn(
      "message-bubble",
      isHebrew && "text-right"
    )}
  >
    {content}
  </div>
);
```

### 11.4 Hebrew Detection

```typescript
function containsHebrew(text: string): boolean {
  const hebrewRange = /[\u0590-\u05FF]/;
  return hebrewRange.test(text);
}
```

### 11.5 Translation Requirements

**CRITICAL:** All formulated research questions MUST be available in English for:
1. PubMed query generation (Query Tool)
2. International publication standards
3. Cross-border collaboration

Even when user works in Hebrew:
- Framework data extraction can be in Hebrew
- But final formulated questions MUST have English version
- AI automatically translates Hebrew → English

---

## 12. Integration Points

### 12.1 Current Integrations

| Service | Purpose | Configuration |
|---------|---------|---------------|
| Supabase Auth | User authentication | JWT tokens |
| Supabase PostgreSQL | Data persistence | Service role key |
| Google Gemini | AI chat and extraction | API key |

### 12.2 Internal Module Integration

**Define → Query Tool:**
- Framework data flows to Query Tool
- Project ID links the modules
- Current: Manual navigation (no auto-population)
- Future: Seamless data handoff

**Define → Project Dashboard:**
- Project status shows "Define" step
- Framework data visible in project view

### 12.3 Future Integration Candidates

| Integration | Purpose | Priority |
|-------------|---------|----------|
| OpenAI GPT-4 | Alternative LLM option | Medium |
| Claude API | Alternative LLM option | Medium |
| Semantic Scholar | Literature context | Low |
| PROSPERO | Protocol registration | Low |
| Export to PRISMA | Protocol documentation | Medium |

---

## 13. Known Limitations

### 13.1 Functional Limitations

| Limitation | Impact | Workaround |
|------------|--------|------------|
| No custom frameworks | Users limited to 17 pre-defined | Request addition |
| Single language per conversation | Can't mix EN/HE mid-chat | Start new conversation |
| No real-time collaboration | Single user per project | Share project ID |
| Manual handoff to Query Tool | Extra user step | Navigate manually |
| No version history | Can't revert framework data | Manual tracking |

### 13.2 Technical Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| 30-second timeout | Long responses may fail | Retry logic |
| 10 req/min rate limit | Heavy use blocked | Queue requests |
| 50 message limit | Long conversations truncated | Clear history |
| JSON parsing failures | Occasional AI format errors | Robust extraction |
| Gemini availability | Service outages | Error handling |

### 13.3 UX Limitations

| Limitation | Impact | Improvement Needed |
|------------|--------|-------------------|
| No typing indicator | User unsure if AI processing | Add animation |
| No message reactions | Can't mark helpful responses | Add feedback |
| No branch conversations | Linear only | Add branching |
| No undo | Can't revert edits | Add history |

---

## 14. Module Boundaries

### 14.1 Define Tool Responsibilities

**IN SCOPE:**
- Research question formulation
- Framework selection and guidance
- Component extraction
- FINER assessment
- Conversation management
- Protocol viewing and editing

**OUT OF SCOPE:**
- Search query generation (→ Query Tool)
- PubMed searching (→ Query Tool)
- Abstract screening (→ Screening Tool)
- Full-text review (→ Review Tool)
- Statistical analysis

### 14.2 Data Handoff to Query Tool

**Data Passed:**
```json
{
  "project_id": "uuid",
  "framework_type": "PICO",
  "framework_data": {
    "P": "Elderly patients with depression",
    "I": "Exercise intervention",
    "C": "Standard care",
    "O": "Depression severity"
  },
  "formulated_question": "In elderly patients with depression..."
}
```

**Query Tool Uses:**
- Framework components → MeSH term lookup
- Free-text terms → Boolean query building
- Question context → Query optimization

### 14.3 Module Independence

The Define Tool MUST:
- Function independently (no Query Tool dependency)
- Persist all data to database
- Provide complete API for data access
- Allow export without other modules

---

## 15. File Reference

### 15.1 Backend Files

| File | Purpose |
|------|---------|
| `/backend/app/api/routes/define.py` | API endpoints |
| `/backend/app/api/models/schemas.py` | Pydantic models |
| `/backend/app/api/models/frameworks.py` | Typed framework models |
| `/backend/app/core/prompts/define.py` | AI system prompts |
| `/backend/app/core/prompts/shared.py` | Framework schemas |
| `/backend/app/services/ai_service.py` | Gemini integration |
| `/backend/app/services/database.py` | Supabase operations |
| `/backend/app/core/config.py` | Configuration |
| `/backend/app/core/auth.py` | JWT validation |

### 15.2 Frontend Files

| File | Purpose |
|------|---------|
| `/frontend/app/define/page.tsx` | Main page component |
| `/frontend/app/define/components/ChatMessage.tsx` | Message rendering |
| `/frontend/app/define/components/FinerCardV2.tsx` | FINER display |
| `/frontend/app/define/components/LanguageSelector.tsx` | Language dialog |
| `/frontend/lib/api.ts` | API client |
| `/frontend/lib/supabase.ts` | Supabase client |

### 15.3 Database

| File | Purpose |
|------|---------|
| `/docs/schema.sql` | Table definitions |
| `/docs/rls_policies.sql` | Row-level security |

---

## Appendix A: AI Prompt Template

```
You are the Systematic Review Question Architect...

[Full prompt in /backend/app/core/prompts/define.py]
```

## Appendix B: Example Conversations

### B.1 English Conversation

**User:** I want to study whether meditation helps anxiety in college students

**AI:** I can see you're interested in studying the effectiveness of meditation for anxiety in college students. This is an **intervention effectiveness** question, which means PICO is the appropriate framework.

Let me extract the components I can identify:

**Framework: PICO**
- **P (Population):** College students with anxiety
- **I (Intervention):** Meditation
- **C (Comparison):** Not specified yet
- **O (Outcome):** Anxiety levels

I notice the Comparison is missing. What would you like to compare meditation against? Options might include:
- No intervention (waitlist control)
- Standard care (counseling)
- Another intervention (e.g., exercise, medication)

### B.2 Hebrew Conversation

**User:** אני רוצה לחקור האם פעילות גופנית עוזרת לדיכאון בקרב קשישים

**AI:** אני רואה שאתה מעוניין לחקור את יעילות הפעילות הגופנית לטיפול בדיכאון בקרב אוכלוסייה מבוגרת. זוהי שאלה של **יעילות התערבות**, ולכן מסגרת PICO היא המתאימה ביותר.

הנה המרכיבים שזיהיתי:

**מסגרת: PICO**
- **P (אוכלוסייה):** קשישים עם דיכאון
- **I (התערבות):** פעילות גופנית
- **C (השוואה):** טרם הוגדר
- **O (תוצאה):** תסמיני דיכאון

**שאלה מנוסחת:**
- **עברית:** האם פעילות גופנית מפחיתה תסמיני דיכאון בקרב קשישים בהשוואה לטיפול רגיל?
- **English:** Does physical activity reduce depression symptoms in elderly patients compared to standard care?

---

## Appendix C: Error Codes

| Error Code | Message | Resolution |
|------------|---------|------------|
| DEFINE_001 | Project not found | Verify project_id |
| DEFINE_002 | User not authorized | Check JWT token |
| DEFINE_003 | AI service timeout | Retry request |
| DEFINE_004 | Rate limit exceeded | Wait 60 seconds |
| DEFINE_005 | Invalid framework type | Use supported framework |
| DEFINE_006 | JSON parse error | Report to support |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-27 | Team | Initial implementation |
| 1.1 | 2025-11-30 | Team | Hebrew translation fixes |
| 1.2 | 2025-12-02 | Team | FINER assessment, caching |
| 1.3 | 2025-12-07 | Team | UI refresh, FinerCardV2 |
| 2.0 | 2026-01-28 | PM | Complete PRD documentation |

---

*End of Document*
