# Define Tool - MedAI Hub
## Complete Technical Documentation

**Version:** 2.1
**Last Updated:** December 2025
**Author:** MedAI Hub Development Team

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Backend Implementation](#3-backend-implementation)
   - [API Routes](#31-api-routes)
   - [AI Service](#32-ai-service)
   - [Prompts System](#33-prompts-system)
   - [Database Operations](#34-database-operations)
4. [Frontend Implementation](#4-frontend-implementation)
   - [Define Page](#41-define-page)
   - [Components](#42-components)
5. [Frameworks System](#5-frameworks-system)
6. [FINER Assessment](#6-finer-assessment)
7. [Data Flow](#7-data-flow)
8. [API Reference](#8-api-reference)
9. [Database Schema](#9-database-schema)
10. [Localization (i18n)](#10-localization-i18n)

---

## 1. Overview

### Purpose

The **Define Tool** is the first step in the MedAI Hub systematic review workflow. It helps researchers:

1. **Formulate research questions** through conversational AI guidance
2. **Identify the appropriate framework** (PICO, CoCoPop, PEO, SPIDER, etc.)
3. **Extract framework components** from natural language
4. **Evaluate question quality** using FINER criteria
5. **Generate multiple question formulations** (Broad, Focused, Alternative)

### Key Features

- **AI-Powered Chat Interface** - Conversational approach to question formulation
- **Smart Framework Detection** - AI suggests the most appropriate framework
- **Automatic Component Extraction** - Parses user input to populate framework fields
- **FINER Assessment** - Real-time quality evaluation of research questions
- **Bilingual Support** - Full Hebrew (RTL) and English support
- **Research Protocol Export** - Export completed protocols as text files

### Role in Systematic Review Workflow

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│ DEFINE  │ ──► │  QUERY  │ ──► │ REVIEW  │
│  Tool   │     │  Tool   │     │  Tool   │
└─────────┘     └─────────┘     └─────────┘
     │
     ▼
 Framework       PubMed        Abstract
   Data     ──►  Queries   ──► Screening
```

---

## 2. Architecture

### System Components

```
┌────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js 15)                       │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────────┐ │
│  │ Define Page │  │ Chat Message │  │ FINER Cards │ Lang Selector│ │
│  │  page.tsx   │  │  Component   │  │  FinerCardV2 │             │ │
│  └─────────────┘  └──────────────┘  └────────────────────────────┘ │
│            │                │                      │                │
│            └────────────────┼──────────────────────┘                │
│                             ▼                                       │
│                    ┌─────────────────┐                             │
│                    │   API Client    │                             │
│                    │   (lib/api.ts)  │                             │
│                    └─────────────────┘                             │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼  HTTP/REST
┌────────────────────────────────────────────────────────────────────┐
│                         BACKEND (FastAPI)                          │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    Define Router                             │  │
│  │              /api/v1/define/*                                │  │
│  │  • GET  /frameworks                                          │  │
│  │  • POST /chat                                                │  │
│  │  • GET  /conversation/{project_id}                           │  │
│  │  • DELETE /conversation/{project_id}                         │  │
│  │  • POST /finer-assessment                                    │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                             │                                      │
│              ┌──────────────┼──────────────┐                      │
│              ▼              ▼              ▼                      │
│       ┌───────────┐  ┌───────────┐  ┌───────────┐                │
│       │ AI Service│  │ DB Service│  │  Prompts  │                │
│       │  (Gemini) │  │ (Supabase)│  │  System   │                │
│       └───────────┘  └───────────┘  └───────────┘                │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                               │
│  ┌─────────────────┐              ┌─────────────────┐             │
│  │  Google Gemini  │              │    Supabase     │             │
│  │   (LangChain)   │              │   PostgreSQL    │             │
│  └─────────────────┘              └─────────────────┘             │
└────────────────────────────────────────────────────────────────────┘
```

### File Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── models/
│   │   │   ├── schemas.py          # Pydantic models (ChatRequest, ChatResponse, etc.)
│   │   │   └── frameworks.py       # Typed framework models (PICOData, etc.)
│   │   └── routes/
│   │       └── define.py           # API endpoints
│   ├── core/
│   │   ├── auth.py                 # JWT validation
│   │   └── prompts/
│   │       ├── shared.py           # FRAMEWORK_SCHEMAS, utilities
│   │       └── define.py           # System prompts for Define Tool
│   └── services/
│       ├── ai_service.py           # Gemini AI interactions
│       └── database.py             # Supabase operations

frontend/
├── app/
│   └── define/
│       ├── page.tsx                # Main Define page
│       └── components/
│           ├── ChatMessage.tsx     # Chat bubble component
│           ├── FinerCardV2.tsx     # FINER score cards
│           ├── FinerScoreCard.tsx  # Individual FINER scores
│           └── LanguageSelector.tsx # Language selection modal
├── lib/
│   └── api.ts                      # API client with types
```

---

## 3. Backend Implementation

### 3.1 API Routes

**File:** `backend/app/api/routes/define.py`

#### `GET /api/v1/define/frameworks`

Returns all available research framework schemas.

**Response:**
```json
{
  "frameworks": {
    "PICO": {
      "name": "PICO",
      "description": "Population, Intervention, Comparison, Outcome",
      "fields": [
        {"key": "P", "label": "Population", "description": "Who is the patient or population?"},
        {"key": "I", "label": "Intervention", "description": "What is the intervention?"},
        {"key": "C", "label": "Comparison", "description": "What is the comparison?"},
        {"key": "O", "label": "Outcome", "description": "What is the outcome?"}
      ]
    },
    "CoCoPop": {...},
    "PEO": {...}
    // ... 17+ frameworks total
  }
}
```

#### `POST /api/v1/define/chat`

Main chat endpoint for research question formulation.

**Request:**
```json
{
  "project_id": "uuid",
  "message": "I want to study the effects of exercise on depression",
  "framework_type": "PICO",
  "language": "en"  // or "he" for Hebrew
}
```

**Response:**
```json
{
  "message": "AI response in markdown format...",
  "framework_data": {
    "P": "Adults with depression",
    "I": "Exercise programs",
    "C": "Standard care",
    "O": "Depression symptoms"
  },
  "extracted_fields": {
    "P": "Adults with depression",
    "I": "Exercise programs"
  },
  "finer_assessment": {
    "F": {"score": "high", "reason": "..."},
    "I": {"score": "high", "reason": "..."},
    "N": {"score": "medium", "reason": "..."},
    "E": {"score": "high", "reason": "..."},
    "R": {"score": "high", "reason": "..."},
    "overall": "proceed"
  },
  "formulated_questions": [
    {
      "type": "broad",
      "hebrew": "מהי השפעת הפעילות הגופנית על דיכאון?",
      "english": "What is the effect of exercise on depression?",
      "finer_assessment": {...}
    },
    {
      "type": "focused",
      "hebrew": "...",
      "english": "In adults with clinical depression, does structured aerobic exercise compared to standard care improve depressive symptoms?",
      "finer_assessment": {...}
    }
  ]
}
```

**Workflow:**

1. Verify project exists and user has access
2. Save user message to `chat_messages` table
3. Retrieve conversation history
4. Call `ai_service.chat_for_define()` with:
   - User message
   - Conversation history
   - Framework type
   - Language preference
5. Parse AI response (hybrid JSON format)
6. Save assistant response to database
7. Update project `framework_data` if extracted
8. Return response with formulated questions

**Rate Limiting:** 10 requests per minute per IP

#### `GET /api/v1/define/conversation/{project_id}`

Retrieves full conversation history for a project.

**Response:**
```json
{
  "messages": [
    {"role": "user", "content": "I want to study..."},
    {"role": "assistant", "content": "I understand..."}
  ]
}
```

#### `DELETE /api/v1/define/conversation/{project_id}`

Clears all chat history for a project.

**Response:**
```json
{
  "status": "cleared",
  "project_id": "uuid"
}
```

#### `POST /api/v1/define/finer-assessment`

Standalone FINER evaluation endpoint.

**Request:**
```json
{
  "project_id": "uuid",
  "research_question": "In adults with depression, does exercise reduce symptoms?",
  "framework_type": "PICO",
  "framework_data": {"P": "...", "I": "...", "C": "...", "O": "..."},
  "language": "en"
}
```

**Response:**
```json
{
  "F": {"score": "high", "reason": "Adequate population available..."},
  "I": {"score": "high", "reason": "Timely and clinically relevant..."},
  "N": {"score": "medium", "reason": "Extends existing literature..."},
  "E": {"score": "high", "reason": "Low-risk intervention..."},
  "R": {"score": "high", "reason": "Could inform clinical guidelines..."},
  "overall": "proceed",
  "suggestions": ["Consider specifying exercise type"],
  "research_question": "...",
  "framework_type": "PICO"
}
```

---

### 3.2 AI Service

**File:** `backend/app/services/ai_service.py`

The `AIService` class is a singleton that handles all interactions with Google Gemini.

#### Key Methods

```python
class AIService:
    def __init__(self):
        self._semaphore = asyncio.Semaphore(5)  # Rate limiting
        self._gemini_pro = None   # Lazy init
        self._gemini_flash = None # Lazy init

    async def chat_for_define(
        self,
        message: str,
        conversation_history: List[Dict[str, str]],
        framework_type: str,
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Main method for Define Tool chat.

        Returns dict with:
        - chat_response: AI message (markdown)
        - framework_data: Extracted components
        - formulated_questions: Question variants with FINER
        - finer_assessment: Overall assessment
        """

    async def assess_finer(
        self,
        research_question: str,
        framework_type: str,
        framework_data: Dict[str, Any],
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Standalone FINER evaluation.
        """

    async def extract_framework_data(
        self,
        conversation: List[Dict[str, str]],
        framework_type: str
    ) -> Dict[str, Any]:
        """
        Extract framework components from conversation.
        """
```

#### Retry Logic

```python
@retry(
    stop=stop_after_attempt(2),
    wait=wait_exponential(multiplier=1, min=1, max=5),
    retry=retry_if_exception_type(ResourceExhausted)
)
async def _invoke_with_retry(self, model, messages, timeout_seconds: int = 30):
    """Rate-limited, timeout-protected AI invocation."""
```

#### JSON Extraction

```python
def _extract_json(self, text: str, find_object: bool = True) -> Optional[Dict]:
    """
    Robustly extracts JSON from AI responses.
    Handles:
    - Clean JSON
    - JSON embedded in markdown code blocks
    - Partial/malformed JSON
    """
```

---

### 3.3 Prompts System

**File:** `backend/app/core/prompts/define.py`

The prompts system implements the **"Systematic Review Question Architect"** methodology.

#### System Prompt Structure

```python
def get_define_system_prompt(
    framework_type: str = "PICO",
    include_knowledge_base: bool = True,
    language: str = "en"
) -> str:
```

**Key Sections:**

1. **Role Definition (PERSONA)**
   ```
   You are the "Systematic Review Question Architect."
   Expert in information science, evidence-based medicine,
   and systematic review methodology.
   ```

2. **Core Algorithm**
   - Step 1: DIAGNOSE question type (Triage)
   - Step 2: CHECK for specialized frameworks
   - Step 3: SELECT & EXPLAIN framework choice
   - Step 4: EXTRACT & REFINE components

3. **Visual Decision Tree**
   ```
   START → What is the research goal?
   │
   ├─ QUANTITATIVE (Measure something)
   │  ├─ Compare effectiveness → PICO/PICOT
   │  ├─ Investigate risk factors → PEO/PECO
   │  ├─ Test diagnostic accuracy → PIRD
   │  └─ Measure prevalence → CoCoPop
   │
   ├─ QUALITATIVE (Understand experiences)
   │  ├─ Explore lived experiences → PICo/SPIDER
   │  └─ Evaluate health services → SPICE/ECLIPSE
   │
   └─ EVIDENCE SYNTHESIS
      ├─ Map literature → PCC
      └─ Understand mechanisms → CIMO
   ```

4. **Output Format (Hybrid JSON)**
   ```json
   {
     "chat_response": "Markdown formatted AI response...",
     "framework_data": {"P": "...", "I": "...", ...},
     "formulated_questions": [
       {
         "type": "broad|focused|alternative",
         "hebrew": "Hebrew version",
         "english": "English version",
         "finer_assessment": {...}
       }
     ]
   }
   ```

5. **Language-Specific Instructions**
   - Hebrew: Full RTL support, English translations for PubMed
   - English: No Hebrew in responses

#### Extraction Prompt

```python
def get_extraction_prompt(
    conversation_history: List[Dict[str, str]],
    framework_type: str
) -> str:
    """Returns prompt for extracting framework data from conversation."""
```

#### FINER Assessment Prompt

```python
def get_finer_assessment_prompt(
    research_question: str,
    framework_type: str,
    framework_data: Dict[str, Any],
    language: str = "en"
) -> str:
    """Returns prompt for FINER evaluation."""
```

---

### 3.4 Database Operations

**File:** `backend/app/services/database.py`

#### Chat Messages

```python
async def save_message(self, message_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Save chat message to database.

    message_data: {
        "project_id": "uuid",
        "role": "user|assistant|system",
        "content": "message text"
    }
    """

async def get_conversation(
    self, project_id: UUID, limit: int = 50
) -> List[Dict[str, Any]]:
    """Get conversation history, ordered by created_at ASC."""

async def clear_conversation(self, project_id: UUID) -> bool:
    """Delete all messages for a project."""
```

#### Project Updates

```python
async def update_project(
    self, project_id: UUID, update_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Update project with framework_data.

    update_data: {
        "framework_type": "PICO",
        "framework_data": {"P": "...", ...}
    }
    """
```

---

## 4. Frontend Implementation

### 4.1 Define Page

**File:** `frontend/app/define/page.tsx`

#### State Management

```typescript
// Core state
const [projects, setProjects] = useState<Project[]>([]);
const [selectedProjectId, setSelectedProjectId] = useState<string>("");
const [messages, setMessages] = useState<ChatMessage[]>([]);
const [inputMessage, setInputMessage] = useState("");
const [isLoading, setIsLoading] = useState(false);

// Framework state
const [frameworks, setFrameworks] = useState<Record<string, FrameworkSchema>>({});
const [selectedFramework, setSelectedFramework] = useState<string>("PICO");
const [frameworkData, setFrameworkData] = useState<Record<string, string>>({});

// UI state
const [preferredLanguage, setPreferredLanguage] = useState<"he" | "en" | null>(null);
const [showProtocol, setShowProtocol] = useState(false);
const [formulatedQuestionsMap, setFormulatedQuestionsMap] = useState<
  Record<number, FormulatedQuestion[]>
>({});
```

#### Key Functions

```typescript
// Load projects and frameworks on mount
useEffect(() => {
  loadProjects();
  loadFrameworks();
}, []);

// Auto-scroll to bottom
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);

// Send message
const handleSendMessage = async () => {
  // 1. Add user message to UI immediately
  // 2. Call API
  // 3. Add AI response
  // 4. Update framework data if extracted
  // 5. Auto-detect framework suggestions
};

// Export protocol
const handleExportProtocol = () => {
  // Generate markdown with:
  // - Project name
  // - Framework type
  // - All framework fields
  // - Conversation history
};

// Clear chat history
const handleClearHistory = async () => {
  // Confirm with user
  // Call API to delete
  // Reset local state
};
```

#### UI Structure

```
┌──────────────────────────────────────────────────────────────┐
│ HEADER                                                        │
│ ┌────────┐ ┌─────────────────┐ ┌──────────────┐ ┌───────────┐│
│ │Sparkles│ │Project Selector │ │Protocol Btn  │ │Clear Btn  ││
│ │ Icon   │ │   Dropdown      │ │(shows count) │ │           ││
│ └────────┘ └─────────────────┘ └──────────────┘ └───────────┘│
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ MAIN CONTENT (scrollable)                                     │
│                                                               │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Language Selector (shown if no messages & no language)   │ │
│ │    ┌─────────┐  ┌─────────┐                              │ │
│ │    │  עברית  │  │ English │                              │ │
│ │    └─────────┘  └─────────┘                              │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Initial Greeting (after language selection)              │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Chat Messages                                            │ │
│ │   [User Message Bubble]                                  │ │
│ │                          [AI Response + FINER Cards]     │ │
│ │   [User Message]                                         │ │
│ │                          [AI Response]                   │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Loading Indicator (when waiting for AI)                  │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ INPUT AREA (fixed at bottom)                                  │
│ ┌──────────────────────────────────────────────────┐ ┌─────┐ │
│ │ Textarea                                          │ │Send │ │
│ │ "Tell me about your research..."                  │ │ Btn │ │
│ └──────────────────────────────────────────────────┘ └─────┘ │
└──────────────────────────────────────────────────────────────┘
```

#### Protocol Dialog

```typescript
<Dialog open={showProtocol} onOpenChange={setShowProtocol}>
  <DialogContent>
    {/* Framework selector dropdown */}
    {/* For each framework field: */}
    {/*   - Label with key */}
    {/*   - Badge (Extracted/Empty) */}
    {/*   - Editable textarea */}
    {/* Actions: Save, Export */}
  </DialogContent>
</Dialog>
```

---

### 4.2 Components

#### ChatMessage Component

**File:** `frontend/app/define/components/ChatMessage.tsx`

```typescript
interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
  preferredLanguage: 'he' | 'en' | null;
  cards?: FormulatedQuestion[];  // FINER cards for this message
}

export function ChatMessage({ content, role, preferredLanguage, cards }: ChatMessageProps) {
  // If message has FINER cards → Side-by-Side Layout
  // Otherwise → Standard Chat Bubble Layout
}
```

**Layout Modes:**

1. **Standard Layout** (no cards):
   ```
   Hebrew: User on RIGHT, AI on LEFT
   English: User on LEFT, AI on RIGHT
   ```

2. **Side-by-Side Layout** (with FINER cards):
   ```
   ┌───────────────────────────────────────────────────┐
   │  FINER Cards (1/3)  │  AI Message Bubble (2/3)   │
   │  ┌────────────────┐ │  ┌───────────────────────┐ │
   │  │ Broad Question │ │  │ Full AI analysis      │ │
   │  │ Score: 85      │ │  │ with markdown         │ │
   │  └────────────────┘ │  │ formatting            │ │
   │  ┌────────────────┐ │  └───────────────────────┘ │
   │  │Focused Question│ │                            │
   │  │ Score: 92 ⭐   │ │                            │
   │  └────────────────┘ │                            │
   └───────────────────────────────────────────────────┘
   ```

**Message Parsing:**

```typescript
export const parseAssistantMessage = (content: string): string => {
  // Handles:
  // 1. Clean text (most common after backend fix)
  // 2. Full JSON object with chat_response
  // 3. Partial/malformed JSON (legacy messages)
  // 4. JSON fragments

  // Returns clean markdown text for rendering
};
```

#### FinerCardV2 Component

**File:** `frontend/app/define/components/FinerCardV2.tsx`

```typescript
interface FinerCardV2Props {
  question: FormulatedQuestion;
  language: 'he' | 'en';
}

export function FinerCardV2({ question, language }: FinerCardV2Props) {
  // Displays:
  // - Score bar (green 80+, yellow <80)
  // - Question type label (Broad/Focused/Alternative)
  // - Hebrew question (if Hebrew mode)
  // - English question
  // - FINER breakdown indicators (F-I-N-E-R mini bars)
}
```

**Visual Elements:**

```
┌─────────────────────────────────────────┐
│ ▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇ (score bar)│
│ ┌─────┐                            92   │
│ │ ⭐  │  FINER Score                    │
│ └─────┘                                 │
│                                         │
│ Focused                                 │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ מה שכיחות הדיכאון בקרב סטודנטים... │ │ (Hebrew - purple border)
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ What is the prevalence of...        │ │ (English - blue border)
│ └─────────────────────────────────────┘ │
│                                         │
│  F    I    N    E    R                  │
│  ▇▇▇  ▇▇▇  ▇▇   ▇▇▇  ▇▇▇               │ (FINER breakdown)
└─────────────────────────────────────────┘
```

#### FinerCardsColumn Component

```typescript
export function FinerCardsColumn({ questions, language }: FinerCardsColumnProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div>FINER Suggestions</div>

      {/* Cards */}
      {questions.map((q, idx) => (
        <FinerCardV2 key={idx} question={q} language={language} />
      ))}
    </div>
  );
}
```

#### LanguageSelector Component

**File:** `frontend/app/define/components/LanguageSelector.tsx`

```typescript
interface LanguageSelectorProps {
  onSelect: (language: 'en' | 'he') => void;
}

export function LanguageSelector({ onSelect }: LanguageSelectorProps) {
  // Modal card with:
  // - Welcome message
  // - Two language buttons (Hebrew flag, US flag)
}
```

---

## 5. Frameworks System

### 5.1 Framework Schema Structure

**File:** `backend/app/core/prompts/shared.py`

```python
FRAMEWORK_SCHEMAS = {
    "PICO": {
        "name": "PICO",
        "description": "Population, Intervention, Comparison, Outcome",
        "use_case": "Intervention effectiveness questions - 'Does X work better than Y?'",
        "components": ["P", "I", "C", "O"],
        "labels": {
            "P": "Population",
            "I": "Intervention",
            "C": "Comparison",
            "O": "Outcome"
        },
        "trigger_words": ["effectiveness", "efficacy", "does it work", "better than"]
    },
    # ... 17+ more frameworks
}
```

### 5.2 Available Frameworks

| Framework | Components | Use Case | Trigger Words |
|-----------|------------|----------|---------------|
| **PICO** | P-I-C-O | Intervention effectiveness | "does it work", "better than" |
| **PICOT** | P-I-C-O-T | Time-sensitive interventions | "over time", "duration" |
| **PICOS** | P-I-C-O-S | Study design matters | "RCT only", "meta-analysis" |
| **PICOC** | P-I-C-O-Cx | Context-dependent | "in hospital", "setting" |
| **CoCoPop** | Co-C-Pop | Prevalence/incidence | "how many", "percentage" |
| **PEO** | P-E-O | Exposure/etiology | "risk factor", "causes" |
| **PECO** | P-E-C-O | Comparative exposure | "exposed vs unexposed" |
| **PFO** | P-F-O | Prognosis | "predicts", "survival" |
| **PIRD** | P-I-R-D | Diagnostic accuracy | "sensitivity", "specificity" |
| **PCC** | P-C-C2 | Scoping reviews | "what exists", "mapping" |
| **PICo** | P-I-Co | Qualitative (JBI) | "experience", "perception" |
| **SPIDER** | S-PI-D-E-R | Mixed-methods | "interviews", "focus groups" |
| **SPICE** | S-P-I-C-E | Service evaluation | "program evaluation" |
| **ECLIPSE** | E-C-L-I-P-S | Health policy | "management", "implementation" |
| **CIMO** | C-I-M-O | Realist reviews | "mechanism", "what works" |
| **BeHEMoTh** | Be-H-E-Mo | Theory-based | "theoretical", "model" |
| **PerSPEcTiF** | Per-S-P-E-c-Ti-F | Health equity | "disparity", "inequality" |
| **PICOT-D** | P-I-C-O-T-D | Digital health | "app", "telemedicine" |

### 5.3 Framework Auto-Detection

```python
def suggest_framework_from_text(text: str) -> str:
    """
    Analyzes text and suggests appropriate framework.

    Process:
    1. Convert text to lowercase
    2. For each framework, count trigger word matches
    3. Return framework with highest match count
    4. Default to PICO if no matches
    """
```

---

## 6. FINER Assessment

### 6.1 FINER Criteria

| Criterion | Description | Key Questions |
|-----------|-------------|---------------|
| **F** - Feasible | Can study be realistically conducted? | Subject availability? Resources? Time? Budget? |
| **I** - Interesting | Is question genuinely engaging? | Researcher curiosity? Community interest? |
| **N** - Novel | Does it add something new? | Confirms/refutes/extends? New methods? |
| **E** - Ethical | Can be conducted ethically? | Risks minimized? Consent obtainable? |
| **R** - Relevant | Will results matter? | Advances knowledge? Influences practice? |

### 6.2 Scoring System

```typescript
type FinerScore = "high" | "medium" | "low";

// Numeric conversion for overall_score calculation
// high = 100, medium = 66, low = 33
// overall_score = average of F, I, N, E, R scores

// Recommendation thresholds
// overall_score >= 75 → "proceed"
// overall_score >= 50 → "revise"
// overall_score < 50 → "reconsider"
```

### 6.3 FINER Integration

FINER is automatically calculated:

1. **During Chat** - When AI generates formulated questions
2. **On-Demand** - Via `/finer-assessment` endpoint
3. **Display** - In FinerCardV2 components with visual indicators

---

## 7. Data Flow

### 7.1 Chat Flow Sequence

```
┌──────────┐     ┌──────────┐     ┌───────────┐     ┌──────────┐
│  User    │     │ Frontend │     │  Backend  │     │ Gemini   │
│          │     │          │     │           │     │    AI    │
└────┬─────┘     └────┬─────┘     └─────┬─────┘     └────┬─────┘
     │                │                 │                │
     │ Type message   │                 │                │
     │───────────────>│                 │                │
     │                │                 │                │
     │                │ POST /chat      │                │
     │                │────────────────>│                │
     │                │                 │                │
     │                │                 │ Save user msg  │
     │                │                 │───────┐        │
     │                │                 │<──────┘        │
     │                │                 │                │
     │                │                 │ Get history    │
     │                │                 │───────┐        │
     │                │                 │<──────┘        │
     │                │                 │                │
     │                │                 │ Generate       │
     │                │                 │───────────────>│
     │                │                 │                │
     │                │                 │ JSON Response  │
     │                │                 │<───────────────│
     │                │                 │                │
     │                │                 │ Parse JSON     │
     │                │                 │ Save AI msg    │
     │                │                 │ Update project │
     │                │                 │───────┐        │
     │                │                 │<──────┘        │
     │                │                 │                │
     │                │ ChatResponse    │                │
     │                │<────────────────│                │
     │                │                 │                │
     │ Display msg    │                 │                │
     │ + FINER cards  │                 │                │
     │<───────────────│                 │                │
     │                │                 │                │
```

### 7.2 Data Transformation

```
User Input (natural language)
        │
        ▼
┌───────────────────────────┐
│   AI Processing           │
│   - Framework detection   │
│   - Component extraction  │
│   - FINER assessment      │
│   - Question formulation  │
└───────────────────────────┘
        │
        ▼
Hybrid JSON Response
{
  "chat_response": "markdown...",
  "framework_data": {...},
  "formulated_questions": [...]
}
        │
        ▼
┌───────────────────────────┐
│   Frontend Processing     │
│   - Parse JSON            │
│   - Render markdown       │
│   - Display FINER cards   │
│   - Update protocol panel │
└───────────────────────────┘
```

---

## 8. API Reference

### 8.1 Type Definitions

**Pydantic Models (Backend):**

```python
class ChatRequest(BaseModel):
    project_id: UUID
    message: str
    framework_type: Optional[str] = "PICO"
    language: Optional[str] = "en"  # "en" or "he"

class FinerScore(BaseModel):
    score: str  # "high" | "medium" | "low"
    reason: str

class FinerAssessment(BaseModel):
    F: Optional[FinerScore]
    I: Optional[FinerScore]
    N: Optional[FinerScore]
    E: Optional[FinerScore]
    R: Optional[FinerScore]
    overall: Optional[str]  # "proceed" | "revise" | "reconsider"
    overall_score: Optional[int]  # 0-100
    suggestions: Optional[List[str]]

class FormulatedQuestion(BaseModel):
    type: str  # "broad" | "focused" | "alternative"
    hebrew: Optional[str]
    english: str
    finer_assessment: Optional[FinerAssessment]

class ChatResponse(BaseModel):
    message: str
    framework_data: Optional[Dict[str, Any]]
    extracted_fields: Optional[Dict[str, str]]
    finer_assessment: Optional[FinerAssessment]
    formulated_questions: Optional[List[FormulatedQuestion]]
```

**TypeScript Types (Frontend):**

```typescript
interface FinerScore {
  score: "high" | "medium" | "low";
  reason: string;
}

interface FinerAssessment {
  F: FinerScore;
  I: FinerScore;
  N: FinerScore;
  E: FinerScore;
  R: FinerScore;
  overall?: "proceed" | "revise" | "reconsider";
  overall_score?: number;
  recommendation?: "proceed" | "revise" | "reconsider";
  suggestions?: string[];
}

interface FormulatedQuestion {
  type: "broad" | "focused" | "alternative";
  hebrew?: string;
  english: string;
  finer_assessment?: FinerAssessment;
}

interface ChatResponse {
  message: string;
  framework_data?: Record<string, string>;
  extracted_fields?: Record<string, string>;
  finer_assessment?: FinerAssessment;
  formulated_questions?: FormulatedQuestion[];
}
```

### 8.2 Error Codes

| Code | Description | Cause |
|------|-------------|-------|
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | User doesn't own project |
| 404 | Not Found | Project doesn't exist |
| 422 | Validation Error | Pydantic validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | AI timeout, parse error |

---

## 9. Database Schema

### 9.1 Projects Table

```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    framework_type VARCHAR(50),
    framework_data JSONB,
    user_id UUID REFERENCES auth.users(id),
    current_step VARCHAR(20) DEFAULT 'DEFINE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Constraint for valid framework types
ALTER TABLE projects ADD CONSTRAINT valid_framework_type
CHECK (framework_type IN (
    'PICO', 'PICOT', 'PICOS', 'PICOC', 'PICOTS',
    'CoCoPop', 'PEO', 'PECO', 'PFO', 'PIRD', 'PCC', 'PICo',
    'SPIDER', 'SPICE', 'ECLIPSE', 'CIMO', 'BeHEMoTh',
    'PerSPEcTiF', 'PICOT-D', 'PICOTS-ComTeC'
));
```

### 9.2 Chat Messages Table

```sql
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_project ON chat_messages(project_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);
```

### 9.3 Framework Data Structure

```json
// PICO
{
  "P": "Adults aged 65+ with clinical depression",
  "I": "Structured aerobic exercise programs (3x/week)",
  "C": "Standard care or no intervention",
  "O": "Depression symptoms (PHQ-9), quality of life"
}

// CoCoPop
{
  "Condition": "Depression / depressive symptoms",
  "Context": "Medical schools in Israel",
  "Population": "Medical students (all years)"
}

// SPIDER
{
  "S": "Healthcare professionals in ICU",
  "PI": "Experience of moral distress",
  "D": "Phenomenological interviews",
  "E": "Themes and patterns",
  "R": "Qualitative"
}
```

---

## 10. Localization (i18n)

### 10.1 Language Support

| Feature | Hebrew (he) | English (en) |
|---------|-------------|--------------|
| UI Direction | RTL | LTR |
| Chat Alignment | User=Right, AI=Left | User=Left, AI=Right |
| AI Responses | Hebrew with English translations | English only |
| Framework Labels | Hebrew | English |
| FINER Cards | Hebrew + English | English only |

### 10.2 Hebrew Mode Specifics

**System Prompt Instructions:**
```
## 🇮🇱 HEBREW INSTRUCTIONS (הנחיות בעברית)
השיחה כולה מתנהלת בעברית.

### ⚠️ CRITICAL: ENGLISH TRANSLATION REQUIREMENT
בכל פעם שאתה מציג ניסוח לשאלת המחקר, חובה להוסיף תרגום לאנגלית!

Format:
1. Hebrew Formulation: "..."
   **🔤 English Translation:** "[exact English translation]"
```

**Reason:** PubMed/Scopus searches require English queries.

### 10.3 RTL Styling

```tsx
// Text direction
<div dir={isHebrew ? 'rtl' : 'ltr'}>

// Flex direction
<div className={`flex ${isHebrew ? 'flex-row-reverse' : 'flex-row'}`}>

// Text alignment
<div className={`${isHebrew ? 'text-right' : 'text-left'}`}>

// Send button icon rotation
<Send className={`${isHebrew ? 'rotate-180' : ''}`} />
```

---

## Appendix A: Quick Reference Card

### Framework Selection Cheat Sheet

| Question Type | Trigger Words | Framework |
|--------------|---------------|-----------|
| Effectiveness | "does it work" | PICO |
| Prevalence | "how many" | CoCoPop |
| Risk/Etiology | "causes" | PEO |
| Qualitative | "experience" | SPIDER |
| Prognosis | "predicts" | PFO |
| Diagnostic | "accuracy" | PIRD |
| Scoping | "what exists" | PCC |
| Policy | "implementation" | ECLIPSE |
| Theory | "theoretical" | BeHEMoTh |
| Digital Health | "app" | PICOT-D |
| Health Equity | "disparity" | PerSPEcTiF |

### FINER Quick Reference

| Score | Color | Meaning |
|-------|-------|---------|
| High | Green | Ready to proceed |
| Medium | Yellow | Consider refinement |
| Low | Red | Needs revision |

| Overall | Threshold | Action |
|---------|-----------|--------|
| Proceed | ≥75 | Ready for systematic review |
| Revise | 50-74 | Minor adjustments needed |
| Reconsider | <50 | Significant rework required |

---

## Appendix B: Configuration

### Environment Variables

```env
# Backend
GOOGLE_API_KEY=your_gemini_api_key
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Rate Limits

| Endpoint | Limit |
|----------|-------|
| POST /chat | 10/minute |
| Other | No limit |

### AI Model Settings

```python
# config.py
GEMINI_PRO_MODEL = "gemini-1.5-pro"
GEMINI_FLASH_MODEL = "gemini-1.5-flash"
TEMPERATURE = 0.7
MAX_TOKENS = 4096
```

---

*End of Documentation*
