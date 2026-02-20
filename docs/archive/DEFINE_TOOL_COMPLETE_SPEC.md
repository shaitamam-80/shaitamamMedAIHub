# DEFINE Tool - Complete Technical Specification

## Overview

The **DEFINE tool** in MedAI Hub is an AI-powered research question formulation assistant that helps medical researchers formulate and refine systematic review research questions using structured frameworks (PICO, PEO, SPIDER, etc.) with AI assistance powered by Google Gemini.

**Current Version:** v2.0 (Chat-based interface)
**Future Version:** v3.0 (Wizard-based interface - in planning/development)

---

## Architecture Overview

### Tech Stack
- **Backend:** FastAPI (Python 3.11) + Google Gemini Flash (via LangChain)
- **Frontend:** Next.js 15 (TypeScript) + Tailwind CSS + Shadcn UI
- **Database:** Supabase PostgreSQL
- **Auth:** Supabase Auth (JWT)
- **AI Model:** Google Gemini Flash (`gemini-1.5-flash-latest`)

### File Structure

```
backend/
├── app/api/routes/
│   ├── define.py                    # v2.0 Chat endpoints (UNDER MIGRATION - 501 status)
│   └── define_v3.py                 # v3.0 Wizard endpoints (UNDER MIGRATION - 501 status)
├── app/core/prompts/
│   ├── shared.py                    # FRAMEWORK_SCHEMAS (17+ frameworks)
│   ├── define.py                    # v2.0 AI system prompts
│   └── research_question.py         # Research Question stage prompts
├── app/services/
│   └── ai_service.py                # Gemini Flash integration
└── app/api/models/
    └── schemas.py                   # Pydantic models (ChatRequest, ChatResponse, etc.)

frontend/
├── app/define/
│   ├── page.tsx                     # v2.0 Chat interface
│   └── components/
│       ├── LanguageSelector.tsx      # Hebrew/English selector
│       ├── ChatMessage.tsx           # Message rendering with markdown + RTL
│       ├── FinerCardV2.tsx           # FINER assessment cards
│       └── FinerScoreCard.tsx        # Individual FINER score display
└── lib/
    └── api.ts                       # API client
```

---

## Current Implementation (v2.0)

### 1. Frontend: Chat-Based Interface

**Location:** `frontend/app/define/page.tsx`

#### Key Features

1. **Language Selection**
   - Hebrew (עברית) / English toggle at conversation start
   - Auto-detects Hebrew characters using regex: `/[\u0590-\u05FF]/`
   - Full RTL support for Hebrew UI (text alignment, chat bubbles, send button rotation)
   - Bilingual greetings, labels, toasts, and prompts

2. **Chat Interface**
   - Free-form conversational AI interaction
   - User sends research idea → AI extracts framework components
   - Real-time framework data extraction and protocol panel update
   - Auto-detects framework suggestions from AI response (pattern matching in response text)
   - Toast notifications for framework switches (e.g., "Framework switched to CoCoPop")

3. **Protocol Panel (Dialog)**
   - Accessible via "Protocol" button in header
   - Shows framework type badge (e.g., "PICO")
   - Editable framework component fields (P, I, C, O, etc.)
   - Extraction status badges (✅ "Extracted" / "חולץ" or ⬜ "Empty" / "ריק")
   - Framework selector dropdown to switch between frameworks
   - Save to project & Export as `.txt` file

4. **FINER Cards Display**
   - Shows formulated questions with FINER assessments in side-by-side layout
   - AI text on one side + FINER cards column on the other
   - 3 question types: Broad (ניסוח רחב), Focused (ניסוח ממוקד), Alternative (זווית חלופית)
   - Color-coded FINER scores (green = high ≥80, yellow = medium, red = low)
   - Mini FINER breakdown bar (F-I-N-E-R) at bottom of each card

#### User Flow

```
1. Select Language (Hebrew/English)
   ↓
2. Describe research idea in free text
   ↓
3. AI responds with:
   - Framework suggestion (e.g., "This is a prevalence question → use CoCoPop")
   - Extracted components (P, I, C, O)
   - Formulated questions (3 versions with FINER)
   ↓
4. User can:
   - Continue refining via chat
   - Edit components in Protocol dialog
   - Save to project
   - Export as .txt file
   - Clear history and start over
```

#### State Management

- `useState` for: messages, framework data, selected framework, language, loading state, protocol dialog, formulated questions map
- `useEffect` for: auto-scroll to bottom, loading projects/frameworks on mount
- `useRef` for: scroll anchor at bottom of chat
- Toast notifications via `react-hot-toast` for user feedback

#### Chat Bubble Layout

- **Hebrew (RTL):** User messages on RIGHT, AI responses on LEFT
- **English (LTR):** User messages on LEFT, AI responses on RIGHT
- Send button icon rotates 180° for Hebrew
- Avatars: Blue circle with User icon (user), Purple circle with Sparkles icon (AI)

#### Side-by-Side Layout (FINER Cards)

When AI returns formulated questions with FINER assessments:

```
┌────────────────────────────┬──────────────────────┐
│ FINER Cards Column (1/3)   │ AI Text Bubble (2/3) │  ← Hebrew mode
│                            │                      │
│ ┌────────────────────┐     │ AI Analysis           │
│ │ FINER Score: 90    │     │                      │
│ │ ניסוח רחב          │     │ [Full markdown       │
│ │ Hebrew question...  │     │  analysis with       │
│ │ English translation │     │  framework details]  │
│ │ F▓ I▓ N▓ E▓ R▓    │     │                      │
│ └────────────────────┘     │                      │
│                            │                      │
│ ┌────────────────────┐     │                      │
│ │ FINER Score: 85    │     │                      │
│ │ ניסוח ממוקד 🌟     │     │                      │
│ │ ...                │     │                      │
│ └────────────────────┘     │                      │
└────────────────────────────┴──────────────────────┘
```

In English mode, the layout is reversed (cards on right, text on left).

---

### 2. Backend: API Endpoints

**Location:** `backend/app/api/routes/define.py`

> **⚠️ NOTE:** All AI-dependent endpoints currently return `501 Not Implemented` due to ongoing migration to SystematicOS LangGraph architecture.

#### Available Endpoints

| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/api/v1/define/frameworks` | GET | ✅ Active | Get all framework schemas |
| `/api/v1/define/chat` | POST | 🚧 Migrating (501) | Chat with AI for question formulation |
| `/api/v1/define/conversation/{project_id}` | GET | ✅ Active | Get conversation history |
| `/api/v1/define/conversation/{project_id}` | DELETE | ✅ Active | Clear conversation history |
| `/api/v1/define/finer-assessment` | POST | 🚧 Migrating (501) | Evaluate question with FINER |

#### Chat Request/Response

**Request:**
```json
{
  "project_id": "uuid",
  "message": "I want to study exercise for depression in elderly",
  "framework_type": "PICO",
  "language": "en"
}
```

**Response:**
```json
{
  "message": "I understand you want to study...",
  "framework_data": {
    "P": "Elderly patients with depression",
    "I": "Exercise",
    "C": "Standard care",
    "O": "Depression symptoms"
  },
  "extracted_fields": { "P": "...", "I": "...", "C": "...", "O": "..." },
  "formulated_questions": [
    {
      "type": "broad",
      "hebrew": "מהי השפעת הפעילות הגופנית...",
      "english": "What is the effect of exercise...",
      "finer_assessment": {
        "F": { "score": "high", "reason": "Large accessible population" },
        "I": { "score": "high", "reason": "Major public health concern" },
        "N": { "score": "medium", "reason": "Adds to existing literature" },
        "E": { "score": "high", "reason": "Minimal ethical concerns" },
        "R": { "score": "high", "reason": "Could inform clinical guidelines" },
        "overall_score": 90,
        "recommendation": "proceed"
      }
    }
  ]
}
```

---

### 3. Supported Frameworks (17+)

**Location:** `backend/app/core/prompts/shared.py`

#### PICO Family (5 frameworks)
| Framework | Components | Use Case |
|-----------|-----------|----------|
| **PICO** | Population, Intervention, Comparison, Outcome | Intervention effectiveness - "Does X work better than Y?" |
| **PICOT** | PICO + Time | Time-sensitive interventions - "Over what period?" |
| **PICOS** | PICO + Study design | When study design matters - systematic reviews |
| **PICOC** | PICO + Context | Context-dependent interventions - "In what setting?" |
| **PICOTS** | PICO + Time + Setting | Comprehensive intervention questions |

#### JBI Standards (7 frameworks)
| Framework | Components | Use Case |
|-----------|-----------|----------|
| **CoCoPop** | Condition, Context, Population | Prevalence/epidemiology - "How many have X?" |
| **PEO** | Population, Exposure, Outcome | Etiology/risk - "Does X cause Y?" |
| **PECO** | PEO + Comparator | Comparative exposure with control group |
| **PFO** | Population, Factor, Outcome | Prognosis - "What predicts outcome Y?" |
| **PIRD** | Population, Index test, Reference test, Diagnosis | Diagnostic accuracy - "How accurate is test X?" |
| **PCC** | Population, Concept, Context | Scoping reviews - "What is known about X?" |
| **PICo** | Population, Interest, Context | Qualitative (JBI) - "What is the experience of X?" |

#### Qualitative (2 frameworks)
| Framework | Components | Use Case |
|-----------|-----------|----------|
| **SPIDER** | Sample, Phenomenon, Design, Evaluation, Research type | Mixed-methods & qualitative research |
| **SPICE** | Setting, Perspective, Intervention, Comparison, Evaluation | Health services evaluation |

#### Policy/Complex (2 frameworks)
| Framework | Components | Use Case |
|-----------|-----------|----------|
| **ECLIPSE** | Expectation, Client, Location, Impact, Professionals, Service | Health policy & management |
| **CIMO** | Context, Intervention, Mechanism, Outcome | Realist reviews - "What works, for whom?" |

#### Specialized/Advanced (4 frameworks)
| Framework | Components | Use Case |
|-----------|-----------|----------|
| **BeHEMoTh** | Behavior, Health context, Exclusions, Models/Theories | Theory-based reviews |
| **PerSPEcTiF** | Perspective, Setting, Phenomenon, Environment, Comparison, Time, Findings | Health equity/disparities |
| **PICOT-D** | PICOT + Digital context | Digital health interventions |
| **PICOTS-ComTeC** | PICOTS + Complexity, Technology, Context | Complex digital health |

#### Framework Selection Decision Tree

```
START → What is the research goal?
│
├─ QUANTITATIVE (Measure something)
│  ├─ Compare effectiveness → PICO / PICOT / PICOS
│  ├─ Investigate risk factors → PEO / PECO
│  ├─ Test diagnostic accuracy → PIRD
│  ├─ Identify prognostic factors → PFO
│  └─ Measure prevalence/incidence → CoCoPop
│
├─ QUALITATIVE (Understand experiences)
│  ├─ Explore lived experiences → PICo / SPIDER
│  ├─ Evaluate health services → SPICE / ECLIPSE
│  └─ Complex interventions/health equity → PerSPEcTiF
│
└─ EVIDENCE SYNTHESIS / POLICY
   ├─ Map literature (scoping review) → PCC
   ├─ Identify theoretical frameworks → BeHEMoTh
   └─ Understand mechanisms (Realist) → CIMO
```

---

### 4. AI System Prompts

**Location:** `backend/app/core/prompts/define.py`

#### Core Principles

1. **"Architect, Don't Answer" Methodology**
   - AI formulates questions, **NEVER** answers them
   - Example: User asks "How many students have depression?"
     → AI formulates: "What is the prevalence of depression among medical students?" (NOT "25% have depression")

2. **Framework Detection Strategy (The "Triage")**
   - Do NOT assume the user wants PICO
   - Classify based on trigger words:
     - "does it work", "better than" → **PICO/PICOT** (Effectiveness)
     - "how many", "what percentage" → **CoCoPop** (Prevalence) ⚠️ NOT PICO!
     - "predicts", "course of illness" → **PFO** (Prognosis)
     - "causes", "risk factor" → **PEO/PECO** (Etiology)
     - "accuracy", "sensitivity" → **PIRD** (Diagnostic)
     - "experience", "perception" → **PICo/SPIDER** (Qualitative)
     - "map out", "what exists" → **PCC** (Scoping)
   - Always check for specialized frameworks (PerSPEcTiF for health equity, PICOT-D for digital health)

3. **Extract Everything First**
   - Before asking clarifying questions, thoroughly analyze user's text for ALL mentioned components
   - Recognize patterns: "compared to X" → X is Comparison, "in patients with..." → Population
   - Only ask clarifying questions when a component is truly missing or ambiguous
   - Maximum 2-3 clarifying questions if question is mostly complete

4. **Language Support (detailed in Section 6)**
   - Bilingual: Hebrew/English
   - Conducts conversation in user's language
   - ALWAYS provides English translation for formulated questions

#### Mandatory Disclaimer

Every new conversation starts with:
> 💡 **Important Note:** My role is to help you formulate a research question for a systematic review, not to answer the question myself. Let's focus on building a precise and answerable question.

#### Response Structure (6 sections)

Every AI response MUST include ALL of these:

1. **📋 Analysis of Your Question** - Question type identification with explanation
2. **🎯 Framework Selection** - Recommended framework with methodological rationale
3. **🔄 Alternative Frameworks Considered** - Why PICO (or others) don't fit; "The PICO Trap" concept
4. **📝 Three Proposed Formulations** - Broad, Focused (🌟 recommended), Alternative
5. **🔍 Practical Insights** - Study hierarchy, search strategy foundations, potential biases
6. **🤝 Questions for Refinement** - Maximum 2-3 specific questions (if needed)

#### Hybrid JSON Output Format

AI returns both conversational text AND structured data:

```json
{
  "chat_response": "Full markdown response with all 6 sections",
  "framework_data": {
    "P": "extracted value or empty string",
    "I": "...",
    "C": "...",
    "O": "..."
  },
  "formulated_questions": [
    {
      "type": "broad|focused|alternative",
      "hebrew": "Hebrew version (empty string if English mode)",
      "english": "English version (always provided)",
      "finer_assessment": {
        "F": { "score": "high|medium|low", "reason": "Brief explanation" },
        "I": { "score": "high|medium|low", "reason": "Brief explanation" },
        "N": { "score": "high|medium|low", "reason": "Brief explanation" },
        "E": { "score": "high|medium|low", "reason": "Brief explanation" },
        "R": { "score": "high|medium|low", "reason": "Brief explanation" },
        "overall_score": 85,
        "recommendation": "proceed|revise|reconsider"
      }
    }
  ]
}
```

---

### 5. FINER Assessment

**Purpose:** Evaluate research question quality across 5 dimensions.

#### FINER Criteria

| Criterion | Meaning | What It Evaluates |
|-----------|---------|------------------|
| **F** - Feasible | Can this study be conducted? | Adequate subjects, technical expertise, affordable, manageable scope |
| **I** - Interesting | Is this engaging? | Researcher curiosity, scientific community interest, clinical/policy influence |
| **N** - Novel | Does it add something new? | Confirms/refutes findings, new methodology, new population/setting |
| **E** - Ethical | Can it be done ethically? | Acceptable risks, benefits outweigh risks, informed consent, vulnerable populations |
| **R** - Relevant | Will results matter? | Advances knowledge, influences practice, guides policy |

#### Scoring System (v2.0)

- **Qualitative Levels:** high (100), medium (66), low (33)
- **Overall Score:** Average of 5 scores
- **Recommendation:**
  - `proceed` → overall_score ≥ 75 (all medium or high)
  - `revise` → overall_score ≥ 50 and < 75 (one score is low)
  - `reconsider` → overall_score < 50 (multiple scores are low)

#### Frontend Display

Each FINER card shows:
- Color bar at top (green ≥80, yellow <80)
- Overall numeric score (e.g., "90")
- Question type label (Broad/Focused/Alternative)
- Hebrew question (purple left border, RTL) - only in Hebrew mode
- English question (blue left border, LTR)
- Mini FINER breakdown bar at bottom (F-I-N-E-R color indicators)

---

### 6. Hebrew/English Bilingual Support

#### How It Works

1. **Language Selection**
   - Frontend: User selects language at conversation start via `LanguageSelector` component
   - Backend: `language` parameter ("en" or "he") passed with each chat request
   - Auto-detects Hebrew characters: `/[\u0590-\u05FF]/`

2. **RTL/LTR Layout**
   - Hebrew: `dir="rtl"`, right-aligned text, chat bubbles flip sides
   - English: `dir="ltr"`, left-aligned text, standard layout
   - Send button icon rotates 180° in Hebrew mode
   - Input placeholder: "ספר לי על המחקר שלך..." (Hebrew) / "Tell me about your research..." (English)

3. **Translation Requirements**
   - **Hebrew mode:** AI responds entirely in Hebrew
   - **CRITICAL EXCEPTION:** All formulated research questions MUST include English translation
   - Reason: PubMed/Scopus searches require English
   - Format:
     ```
     #### 1. ניסוח רחב (Broad Formulation)
     "מהי שכיחות הדיכאון בקרב סטודנטים לרפואה בישראל?"
     > **🔤 English Translation:** "What is the prevalence of depression among medical students in Israel?"
     ```

4. **English mode:**
   - Entire response in English ONLY
   - No Hebrew text whatsoever in `chat_response`
   - `hebrew` field in `formulated_questions` set to empty string `""`

5. **UI Components Localization**
   - Buttons: "שמור" / "Save", "ייצא" / "Export"
   - Toast messages: "הפרוטוקול עודכן!" / "Protocol updated!"
   - Protocol dialog title: "פרוטוקול מחקר" / "Research Protocol"
   - Clear history confirm: "האם אתה בטוח..." / "Are you sure..."
   - Extraction badges: "חולץ" / "Extracted", "ריק" / "Empty"
   - Greeting: "שלום! 👋" / "Hello! 👋"

#### Hebrew-Specific AI Instructions

When language is Hebrew, the AI prompt includes detailed Hebrew instructions:
- Full 6-section structure in Hebrew
- Methodological terms reference JBI guidelines in Hebrew
- "The PICO Trap" concept explained in Hebrew
- Mandatory English translation format with `🔤 English Translation:` marker
- Explicit warning: "אין להציע מונחי MeSH במקום התרגום!" (Don't suggest MeSH terms instead of translation!)

---

### 7. AI Service Integration

**Location:** `backend/app/services/ai_service.py`

#### Key Methods

```python
class AIService:
    def __init__(self):
        self._semaphore = asyncio.Semaphore(5)  # Max 5 concurrent calls
        self._gemini_flash = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash-latest",
            temperature=0.7,
            max_tokens=8192
        )

    async def chat_for_define(
        self, message, conversation_history, framework_type, language
    ) -> Dict[str, Any]:
        """Handle chat for Define tool with hybrid JSON output."""
        # 1. Build system prompt with language-specific instructions
        # 2. Add conversation history (extract chat_response only from JSON)
        # 3. Call Gemini Flash via LangChain
        # 4. Parse hybrid JSON response
        # 5. Return: {chat_response, framework_data, formulated_questions, finer_assessment}

    async def assess_finer(
        self, research_question, framework_type, framework_data, language
    ) -> Dict[str, Any]:
        """Standalone FINER assessment of a research question."""

    async def extract_framework_data(
        self, conversation, framework_type
    ) -> Dict[str, Any]:
        """Extract framework components from conversation history."""
```

#### Rate Limiting & Error Handling

- **Semaphore:** Max 5 concurrent API calls
- **Timeout:** 30 seconds per request
- **Retry:** 2 attempts on `ResourceExhausted` (API quota exceeded)
- **Exponential backoff:** 1s → 5s between retries
- **JSON extraction:** Robust parser that handles partial/malformed JSON from AI

#### Hebrew Translation Pipeline

When framework data contains Hebrew text (for PubMed query generation):
1. Batch translation: All Hebrew fields translated in one API call
2. Verification: Check if Hebrew characters remain after translation
3. Field-by-field fallback: If batch fails, translate each field individually
4. Force translate: Last resort with explicit "No Hebrew characters allowed" instruction
5. Placeholder: If all translation attempts fail, use `"[key - see original]"`

---

### 8. Database Schema

#### `projects` table
```sql
id UUID PRIMARY KEY
name VARCHAR(255)
description TEXT
framework_type VARCHAR(50)  -- "PICO", "CoCoPop", etc.
framework_data JSONB         -- Dynamic fields {P: "...", I: "...", ...}
user_id UUID
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

#### `chat_messages` table
```sql
id UUID PRIMARY KEY
project_id UUID (FK → projects ON DELETE CASCADE)
role VARCHAR(20)  -- "user" | "assistant" | "system"
content TEXT       -- Message content or JSON with chat_response
created_at TIMESTAMPTZ
```

**Note:** Deleting a project cascades to all chat messages.

---

## Common Workflows

### Workflow 1: Create New Research Question

1. User creates project in the Projects page
2. Navigates to `/define`
3. Selects language (Hebrew/English)
4. Describes research idea: "Does exercise help elderly depression?"
5. AI responds:
   - Analyzes: "This is an Effectiveness question"
   - Recommends: PICO framework
   - Extracts: P=Elderly with depression, I=Exercise, C=Standard care, O=Depression symptoms
   - Generates 3 formulated questions with FINER assessments
6. User reviews Protocol panel, edits if needed
7. User saves to project

### Workflow 2: Framework Auto-Detection & Switching

1. User: "How many medical students have depression?"
2. AI detects keywords: "how many" → prevalence question
3. AI recommends: CoCoPop (NOT PICO)
4. Frontend detects framework mention in response text
5. Framework selector auto-switches to CoCoPop
6. Toast notification: "Framework switched to CoCoPop" / "המסגרת שונתה ל-CoCoPop"
7. AI extracts: Condition=Depression, Context=Medical schools, Population=Students

### Workflow 3: Hebrew Conversation with English Output

1. User selects עברית (Hebrew)
2. User: "אני רוצה לחקור שכיחות דיכאון בקרב סטודנטים לרפואה"
3. AI responds entirely in Hebrew with analysis
4. For each formulated question, English translation is provided:
   ```
   "מהי שכיחות הדיכאון בקרב סטודנטים לרפואה בישראל?"
   > 🔤 English Translation: "What is the prevalence of depression among medical students in Israel?"
   ```
5. When user generates PubMed query, framework data is auto-translated to English

### Workflow 4: Export Protocol

1. User clicks "Protocol" button (top right header)
2. Dialog opens with framework fields (editable)
3. User can modify extracted values manually
4. Clicks "Export" → downloads `{project-name}-protocol.txt`:
   ```
   # Research Protocol: My Project
   ## Framework: PICO
   Generated: 2/12/2026, 10:30:00 AM

   ## Research Question Components

   ### Population (P)
   Elderly patients (≥65 years) with major depressive disorder

   ### Intervention (I)
   Structured aerobic exercise (30 min, 3x/week)
   ...

   ## Conversation History
   ...
   ```

---

## Future Implementation (v3.0 - Wizard)

**Status:** Under development (planned migration to SystematicOS architecture)
**Documentation:** `docs/define-tool-v3-implementation-plan.md`, `docs/DEFINE_TOOL_V3_AUTONOMOUS_SPEC.md`

### Key Changes from v2.0

| Aspect | v2.0 (Current) | v3.0 (Target) |
|--------|----------------|---------------|
| **Interface** | Chat (conversational) | Wizard (progressive disclosure) |
| **Layout** | Single panel | Split screen (Input 60% + Preview 40%) |
| **Flow** | Free-form back-and-forth | Guided 6 steps with validation |
| **Framework Detection** | AI auto-detects from keywords | Clarification-based (asks intent questions) |
| **Preview** | Only in protocol dialog | Live, real-time preview panel |
| **FINER Scoring** | Numeric (100/66/33 average) | Qualitative only (high/med/low + reasoning) |
| **Question Output** | Single version per type | 3 versions (narrow, broad, clinical) |
| **Navigation** | Linear chat | Step-based with back/next buttons |

### v3.0 Wizard Steps

1. **Welcome** - Language selection (EN/HE) and introduction
2. **Framework** - Clarification-based framework selection
3. **Components** - Extract framework components with real-time validation
4. **FINER** - Qualitative assessment with improvement suggestions
5. **Questions** - Generate three question formulations
6. **Review** - Final review and save to project

### v3.0 Framework Detection Philosophy

**NO keyword matching, NO defaulting to PICO.**

```
AI: "What do you want to know about this topic?"
Options:
- Does it work/help? (effectiveness) → PICO
- How common is it? (frequency) → CoCoPop
- Does it cause something? (causation) → PECO
- What do people experience? (qualitative) → SPIDER

User: "How common"
AI: → Recommends CoCoPop (NOT PICO!)
```

### v3.0 FINER - Qualitative Only

**Change:** Remove artificial numeric scores

- **v2.0:** high=100, medium=66, low=33 → average → recommendation
- **v3.0:** high/medium/low + reasoning → holistic judgment

**Why?**
- Removes false precision (100/66/33 points are arbitrary)
- Focuses on reasoning over scoring
- Aligns with actual research review processes

### v3.0 Split-Screen Layout

```
┌─────────────────────────────────┬──────────────────────┐
│ Input Panel (60%)               │ Preview Panel (40%)  │
├─────────────────────────────────┼──────────────────────┤
│ Step Progress Indicator         │ Framework Summary    │
│                                 │                      │
│ [Active Step Content]           │ Components Preview   │
│ - Framework selection           │ ✓ P: ...             │
│ - Component inputs              │ ✓ I: ...             │
│ - FINER review                  │ ○ C: (optional)      │
│                                 │ ✓ O: ...             │
│ [Navigation: Back | Next]       │                      │
│                                 │ FINER Assessment     │
│                                 │ F: High - ...        │
│                                 │                      │
│                                 │ Generated Questions  │
│                                 │ (shown in step 5)    │
└─────────────────────────────────┴──────────────────────┘
```

---

## What NOT to Do (AI Guardrails)

These rules are embedded in the AI system prompt:

1. **NEVER** answer the clinical question (e.g., "20% of students suffer from depression")
2. **NEVER** default to PICO if it doesn't fit the question type
3. **NEVER** invent new frameworks (no "PECOS" or "PICOCS")
4. **NEVER** ask for information already present in the user's question
5. **NEVER** ask more than 2-3 clarifying questions if the question is mostly complete
6. **NEVER** provide MeSH terms instead of English translations in Hebrew mode

---

## Troubleshooting

### Chat not responding
- **Cause 1:** Endpoint returns 501 (migration in progress)
- **Cause 2:** Gemini API quota exceeded
- **Cause 3:** Network timeout (>30s)
- **Solution:** Check backend logs, verify `GOOGLE_API_KEY` quota

### Hebrew not displaying correctly
- **Cause:** Missing `dir="rtl"` attribute or font issue
- **Solution:** Ensure `dir={isHebrew ? 'rtl' : 'ltr'}` on text containers

### FINER cards not showing
- **Cause:** `formulated_questions` is empty or message index mismatch
- **Solution:** Check `data.formulated_questions` in API response, verify `formulatedQuestionsMap` state

### Framework not auto-switching
- **Cause:** AI response doesn't contain recognized framework mention patterns
- **Solution:** Patterns checked include: `המסגרת המומלצת: {fw}`, `מסגרת **{fw}**`, `Framework: {fw}`, `**{fw}**`, `({fw})`

---

## Key File References

| Purpose | File |
|---------|------|
| Frontend Define Page | `frontend/app/define/page.tsx` |
| Language Selector | `frontend/app/define/components/LanguageSelector.tsx` |
| Chat Message Renderer | `frontend/app/define/components/ChatMessage.tsx` |
| FINER Cards | `frontend/app/define/components/FinerCardV2.tsx` |
| API Client | `frontend/lib/api.ts` |
| Backend Routes | `backend/app/api/routes/define.py` |
| AI System Prompts | `backend/app/core/prompts/define.py` |
| Framework Schemas | `backend/app/core/prompts/shared.py` |
| AI Service | `backend/app/services/ai_service.py` |
| Pydantic Models | `backend/app/api/models/schemas.py` |
| DB Schema | `docs/schema.sql` |
| v3.0 Wizard Spec | `docs/define-tool-v3-implementation-plan.md` |
| v3.0 Autonomous Spec | `docs/DEFINE_TOOL_V3_AUTONOMOUS_SPEC.md` |
| Framework Configs | `docs/FRAMEWORK_CONFIGS.md` |

---

**Document Version:** 1.0
**Last Updated:** 2026-02-12
**Based on:** Codebase state at commit `0d7f5f0` (pre-deletion) + current `restore/full-modules` branch
