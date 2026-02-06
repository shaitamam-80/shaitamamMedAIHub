# תכנית עבודה: Define Tool v3.0
## Research Question Formulation - Wizard Implementation

**תאריך:** 2026-01-28
**גרסה:** 3.0
**בסיס:** PRD v2.0 + define-tool-v3-prompt + Healthcare Research Framework Analysis Guide

---

## מצב קיים (v2.0) - מה כבר עובד

### Backend Infrastructure ✅
- FastAPI עם Google Gemini Flash
- 17+ frameworks supported
- FINER assessment logic
- Database: projects, chat_messages tables
- Auth: Supabase JWT
- API endpoints: `/chat`, `/frameworks`, `/conversation`, `/finer-assessment`

### Frontend (v2.0) ✅
- Chat interface (free-flowing conversation)
- RTL/LTR support
- FinerCardV2 components
- Protocol dialog & export
- Project management

### Gaps & Issues 🚧
- Chat interface מציף משתמשים (cognitive overload)
- אין Live Preview של השאלה המתגבשת
- Framework selection לא אינטואיטיבי
- אין Progress indicator ברור
- אין Step-by-step guidance

---

## חזון v3.0 - מה נבנה

### Core Changes

| Aspect | v2.0 (Current) | v3.0 (Target) |
|--------|----------------|---------------|
| **Pattern** | Chat (conversational) | Wizard (progressive disclosure) |
| **Layout** | Single panel | Split screen (Input + Preview) |
| **Flow** | Free-form back-and-forth | Guided steps with validation |
| **Framework** | User selects upfront | AI detects from free input |
| **Preview** | Only in protocol dialog | Live, real-time updates |
| **FINER** | End of conversation | Integrated per question version |

### User Experience Principles

1. **Don't Make Me Think** - שפה פשוטה, דוגמאות בכל שלב
2. **Wizard Pattern** - שלבים קטנים, Progress indicator ברור
3. **Immediate Feedback** - Live Preview מתעדכן בזמן אמת
4. **Constructive Guidance** - Amber warnings, לא Red errors

---

## ארכיטקטורה טכנית

### Backend (Minimal Changes)

**קיים ונשאר:**
- AI Service (Gemini)
- Database Service
- Auth middleware
- FRAMEWORK_SCHEMAS

**שינויים נדרשים:**
1. **New endpoint:** `POST /api/v1/define/detect-framework`
   - Input: `{free_text: string, language: string}`
   - Output: `{detected_type: QuestionType, recommended_framework: Framework, explanation: string}`

2. **New endpoint:** `POST /api/v1/define/generate-questions`
   - Input: `{framework_data: dict, framework_type: string, language: string}`
   - Output: `{questions: [narrow, broad, clinical], each with finer_assessment}`

3. **Update prompts:**
   - `detect_framework_prompt` - לזיהוי framework מתוך קלט חופשי
   - `generate_questions_prompt` - יצירת 3 גרסאות (narrow/broad/clinical)

### Frontend (Major Refactor)

**Structure:**
```
frontend/app/define-v3/
├── page.tsx                    # Container
├── components/
│   ├── wizard/
│   │   ├── WizardContainer.tsx          # State machine + progress
│   │   ├── Step0_FreeInput.tsx          # קלט חופשי + AI detection
│   │   ├── Step1_FrameworkConfirm.tsx   # הסבר + אישור framework
│   │   ├── Step2_DynamicFields.tsx      # שדות דינמיים לפי framework
│   │   ├── Step3_GenerateQuestions.tsx  # יצירת 3 גרסאות
│   │   ├── Step4_FinerReview.tsx        # סקירת FINER לכל גרסה
│   │   └── Step5_SaveExport.tsx         # שמירה + ייצוא
│   ├── preview/
│   │   ├── LivePreviewPanel.tsx         # Panel ימני עם preview
│   │   ├── FrameworkCard.tsx            # תצוגת framework + components
│   │   ├── QuestionPreview.tsx          # השאלה המתגבשת
│   │   └── FinerMiniIndicator.tsx       # FINER mini-bars
│   └── shared/
│       ├── ProgressBar.tsx
│       ├── ExampleTooltip.tsx
│       └── LanguageToggle.tsx
├── hooks/
│   ├── useWizardState.ts                # Zustand store
│   └── useFrameworkConfig.ts            # Framework definitions
└── types/
    └── wizard.types.ts
```

---

## תכנית עבודה - 6 Phases (בלי תאריכים)

> **עקרון מנחה:** כל phase מסתיים רק כשהוא עובד. אין לוח זמנים קבוע.

### Phase 1: Foundation & Design System

#### 1.1 Design System Setup
- [ ] Color palette (Clinical Blue) ב-Tailwind config
- [ ] Typography (Inter + JetBrains Mono)
- [ ] Component primitives:
  - [ ] Progress bar component
  - [ ] Wizard step wrapper
  - [ ] Split panel layout
  - [ ] Tooltip system

**Output:** `frontend/styles/wizard-theme.css`, basic layout components

#### 1.2 Data Models & Types
- [ ] `wizard.types.ts`:
  ```typescript
  type WizardStep = 0 | 1 | 2 | 3 | 4 | 5;
  type QuestionScope = 'narrow' | 'broad' | 'clinical';

  interface WizardState {
    currentStep: WizardStep;
    freeInput: string;
    detectedFramework: Framework | null;
    frameworkExplanation: string;
    frameworkData: Record<string, string>;
    generatedQuestions: GeneratedQuestion[];
    selectedQuestionId?: string;
  }

  interface GeneratedQuestion {
    id: string;
    scope: QuestionScope;
    text_en: string;
    text_he: string;
    finer: FinerAssessment;
  }
  ```

**Output:** Type definitions file

---

### Phase 2: Backend Enhancements

**Full Framework Support:** All 17+ frameworks from Day 1
- PICO family (PICO, PICOT, PICOS, PICOC, PICOTS)
- JBI standards (CoCoPop, PEO, PECO, PFO, PIRD, PCC, PICo)
- Qualitative (SPIDER, SPICE)
- Policy/Complex (ECLIPSE, CIMO)
- Specialized (BeHEMoTh, PerSPEcTiF, PICOT-D, PICOTS-ComTeC)

**Why all 17 now:**
- Users will encounter ALL question types
- Better to have complete system from start than to retrofit later
- Framework detection REQUIRES knowing all options

#### 2.1 Framework Detection Endpoint (Clarification-Based)

**Approach:** Interactive clarification instead of keyword matching

- [ ] Create `detect_framework_prompt` with clarification questions:
  ```python
  # Detection Strategy:
  # 1. Ask user INTENT questions (not keyword matching)
  # 2. Present framework options based on answers
  # 3. If ambiguous - ASK, don't guess
  # 4. No default to PICO - if unclear, request more info
  ```

**Clarification Questions:**
1. "What do you want to know?" →
   - Does X work/help? (effectiveness) → PICO family
   - How common is X? (frequency) → CoCoPop
   - Does X cause Y? (causation) → PEO/PECO
   - What predicts Y? (prognosis) → PFO
   - How accurate is test? (diagnosis) → PIRD
   - What do people experience? (qualitative) → PICo/SPIDER

2. "Is there a comparison involved?"
   - Yes → PICO/PECO
   - No → PIO/PEO

3. "Is this about a service/program?"
   - Yes → SPICE/ECLIPSE

- [ ] Implement `POST /api/v1/define/detect-framework`
- [ ] Add `POST /api/v1/define/clarify-framework` for follow-up questions
- [ ] Unit tests for ambiguous cases

**Test case (ambiguous input):**
```json
Input: "אני רוצה לחקור דיכאון בקרב קשישים"
Expected: {
  "needs_clarification": true,
  "questions": [
    "האם אתה רוצה לדעת כמה קשישים סובלים מדיכאון? (שכיחות)",
    "או שאתה רוצה לבדוק אם משהו עוזר לטפל בדיכאון? (יעילות)",
    "או שאתה רוצה להבין מה הם חווים? (איכותני)"
  ]
}
```

#### 2.2 Question Generation Endpoint (with Qualitative FINER)

- [ ] Create `generate_questions_prompt`:
  ```python
  # For each scope (narrow, broad, clinical):
  # - Narrow: Very specific, measurable (PICOT with all details)
  # - Broad: General, exploratory
  # - Clinical: Practical, implementable in real-world
  ```
- [ ] Implement `POST /api/v1/define/generate-questions`
- [ ] Generate FINER for each question in single AI call
- [ ] **FINER Assessment: Qualitative only (high/medium/low)**
  - NO numeric scores (no 100, 66, 33)
  - NO overall_score calculation
  - NO artificial thresholds (75, 50)
  - ONLY: high/medium/low + detailed reasoning
  - Recommendation based on holistic judgment, not formula
- [ ] Add caching (same framework_data → cached results)

**Test case:**
```python
Input: {
  "framework_type": "PICO",
  "framework_data": {
    "P": "Elderly with depression",
    "I": "Physical exercise",
    "C": "Standard care",
    "O": "Depression severity"
  }
}
Expected: {
  "questions": [3 questions],
  "finer_assessments": {
    "F": {"level": "high", "reason": "Large accessible population..."},
    "I": {"level": "high", "reason": "Major health concern..."},
    "N": {"level": "medium", "reason": "Existing evidence, but..."},
    "E": {"level": "high", "reason": "Minimal risk..."},
    "R": {"level": "high", "reason": "Could inform guidelines..."},
    "recommendation": "proceed|revise|reconsider",
    "holistic_reasoning": "This question scores high on most..."
  }
}
```

**Output:** 2 new endpoints tested & working

---

### Phase 3: Core UI (Wizard + Preview in Parallel)

#### 3.1 State Management
- [ ] Setup Zustand store (`useWizardState.ts`)
- [ ] Implement persistence to localStorage
- [ ] Add undo/redo capability (nice-to-have, not MVP)

#### 3.2 WizardContainer Component
- [ ] Progress bar (6 steps)
- [ ] Navigation: Next, Back, Skip buttons
- [ ] Validation before step transition
- [ ] Error boundaries
- [ ] Keyboard navigation (Tab, Enter)

#### 3.3 LivePreviewPanel Component ⚡ (MOVED FROM PHASE 5)

**Why here:** Preview הוא הליבה של ה-UX החדש. צריך אותו מוקדם כדי לבדוק את ה-flow.

- [ ] Fixed right panel (40% width, sticky)
- [ ] Sections:
  1. Framework Badge (current framework)
  2. Components Card (P, I, C, O with values)
  3. Question Preview ("השאלה המתגבשת")
  4. FINER Mini (small bars when available)

**Logic for auto-composition:**
```typescript
function composeQuestion(framework: Framework, data: Record<string, string>): string {
  if (framework === 'PICO') {
    const {P, I, C, O} = data;
    if (P && I && O) {
      return `In ${P}, does ${I} compared to ${C || 'no intervention'} affect ${O}?`;
    }
  }
  // PECO, SPIDER templates...
}
```

**Output:** Core UI with split-screen layout working

---

### Phase 4: Step Components (MVP - 6 Steps)

#### 4.1 Step 0: Free Input
**Component:** `Step0_FreeInput.tsx`
- [ ] Large textarea (RTL/LTR auto-detect)
- [ ] Character counter
- [ ] Examples dropdown:
  ```tsx
  examples = [
    {he: "האם פעילות גופנית...", en: "Does exercise..."},
    {he: "מהי השכיחות של...", en: "What is the prevalence..."}
  ]
  ```
- [ ] "זהה מסגרת" button → calls `detect-framework` API
- [ ] Loading state with skeleton

**Output:** `freeInput`, `detectedFramework`, `explanation`

#### 4.2 Step 1: Framework Confirmation
**Component:** `Step1_FrameworkConfirm.tsx`
- [ ] Display detected framework + explanation
- [ ] Framework card with icon
- [ ] "שינוי מסגרת" dropdown (all 17+ frameworks)
- [ ] Educational tooltip per framework
- [ ] Continue button

#### 4.3 Step 2: Dynamic Fields
**Component:** `Step2_DynamicFields.tsx`
- [ ] Render fields based on selected framework (PICO, PECO, SPIDER only)
- [ ] Each field:
  - [ ] Label (Hebrew simple question)
  - [ ] Input (textarea with auto-grow)
  - [ ] Example tooltip
  - [ ] Optional/Required indicator
- [ ] Live Preview updates as user types
- [ ] "דלג על השדה" for optional fields (amber toast)

**Framework Configs (MVP):**
```tsx
PICO: P (required), I (required), C (optional), O (required)
PECO: P (required), E (required), C (optional), O (required)
SPIDER: S (required), PI (required), D (optional), E (required), R (required)
```

#### 4.4 Step 3: Generate Questions
**Component:** `Step3_GenerateQuestions.tsx`
- [ ] "צור שאלות מחקר" button
- [ ] Loading animation (30-45 sec)
- [ ] Display 3 cards (Narrow, Broad, Clinical)
- [ ] Each card:
  - [ ] Icon (🎯, 📊, 🏥)
  - [ ] Question text (EN + HE)
  - [ ] Mini FINER bars (F, I, N, E, R)
  - [ ] "בחר שאלה זו" radio
- [ ] "ערוך ידנית" option

#### 4.5 Step 4: FINER Review
**Component:** `Step4_FinerReview.tsx`
- [ ] Selected question displayed
- [ ] Full FINER card (like v2.0):
  - [ ] Overall score bar
  - [ ] 5 criteria with scores + explanations
  - [ ] Recommendations list
- [ ] "חזור לשלב קודם" if not satisfied
- [ ] "המשך לשמירה" if approved

#### 4.6 Step 5: Save & Export
**Component:** `Step5_SaveExport.tsx`
- [ ] Project name input
- [ ] Save to database
- [ ] Export options:
  - [ ] Copy to clipboard
  - [ ] Download .txt
  - [ ] Download .docx (future)
  - [ ] Download .pdf (future)
- [ ] "התחל שאלה חדשה" button
- [ ] "עבור לכלי Query" button

---

### Phase 5: Integration & Polish

**Focus:** Make it production-ready

#### 5.1 RTL/LTR Handling
- [ ] Auto-detect Hebrew in all inputs
- [ ] Apply `dir="rtl"` dynamically
- [ ] Test mixed content (Hebrew + English)

#### 5.2 Responsive Design
- [ ] Mobile: Stack panels vertically
- [ ] Preview becomes floating summary bar (bottom)
- [ ] Touch-friendly buttons

#### 5.3 Accessibility
- [ ] Keyboard navigation (Tab order)
- [ ] ARIA labels
- [ ] Screen reader announcements for step changes
- [ ] Focus management

#### 5.4 Error Handling
- [ ] API timeout (30s) → retry with backoff
- [ ] Gemini quota exceeded → amber message
- [ ] Network error → offline indicator
- [ ] Validation errors → inline, constructive

#### 5.5 Testing
- [ ] Unit tests: State management, utils
- [ ] Integration tests: Step navigation, API calls
- [ ] E2E tests (Playwright):
  - [ ] Full wizard flow (Hebrew input)
  - [ ] Framework detection accuracy (3 frameworks)
  - [ ] Question generation
  - [ ] Save & export

**Output:** Production-ready v3.0 MVP

---

### Phase 6: Advanced Features (Post-Launch)

**Note:** All 17 frameworks are in Phase 1-5. Phase 6 is for enhancements only.

#### 6.1 Export Enhancements
- [ ] .docx generation (python-docx)
- [ ] .pdf generation (reportlab)
- [ ] PRISMA-P template export
- [ ] Protocol registration (PROSPERO format)

#### 6.2 Collaboration Features
- [ ] Version history for questions
- [ ] Collaborative editing (real-time)
- [ ] Commenting on framework components
- [ ] Share draft questions for feedback

#### 6.3 AI Enhancements
- [ ] AI suggestions while typing in Step 2
- [ ] Framework auto-switch mid-flow (if user intent changes)
- [ ] Literature preview (fetch similar PubMed articles)
- [ ] MeSH term suggestions integrated in preview

---

## Migration Strategy

### Deployment Approach: In-Place Upgrade

**Decision:** Build v3 on separate branch, replace `/define` when ready

**Why NOT parallel routes:**
- Confuses users ("which one do I use?")
- Doubles maintenance burden
- Splits analytics/feedback
- Delays full adoption

**How:**
1. Develop on `feature/define-v3` branch
2. Test thoroughly in staging
3. Deploy to production, replacing `/define`
4. Monitor for 48h, rollback if critical issues
5. Collect feedback, iterate

### Data Model Compatibility

**Zero DB migration needed! ✅**
- `projects` table already has `framework_type` + `framework_data`
- Wizard saves identical structure to chat
- v2.0 data readable by v3.0
- No user data lost

---

## Success Metrics

### Quantitative
- [ ] Time to formulate question: < 5 min (vs. 10-15 min in v2.0)
- [ ] Completion rate: > 80% (users who start → finish)
- [ ] Framework accuracy: > 90% (AI detection)
- [ ] FINER score average: > 75/100

### Qualitative
- [ ] User feedback: "clearer", "less overwhelming"
- [ ] Reduced support requests about framework selection
- [ ] Higher satisfaction scores (NPS)

---

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Gemini API rate limit | High | Medium | Implement caching, queue system |
| Framework detection inaccuracy | High | Medium | Allow manual override, collect training data |
| Mobile UX poor | Medium | Low | Test early on mobile, adjust layout |
| Backend breaking change | High | Low | Versioned APIs, backward compatibility |
| User adoption low | Medium | Medium | Parallel deployment, gradual rollout |

---

## Execution Plan (No Dates - Phase by Phase)

### Phase Progression

```text
Phase 1 (Foundation)
   └─> When complete: Design system, types, layouts ready
       └─> Phase 2 (Backend)
           └─> When complete: 2 endpoints tested & working
               └─> Phase 3 (Core UI)
                   └─> When complete: Wizard + Preview functional
                       └─> Phase 4 (Steps)
                           └─> When complete: 6 steps working end-to-end
                               └─> Phase 5 (Polish)
                                   └─> When complete: Production-ready MVP
                                       └─> Phase 6 (Expand) - Future
```

**Completion Criteria per Phase:**
- **Phase 1:** Can navigate between empty wizard steps
- **Phase 2:** Can call detect-framework & generate-questions via Postman
- **Phase 3:** Split-screen layout with live preview updates
- **Phase 4:** Can complete full flow from input to save
- **Phase 5:** Passes E2E tests, mobile responsive, RTL working
- **Phase 6:** Additional frameworks added as needed

---

## Next Steps (Immediate)

1. ✅ **תכנית מאושרת** - אתה קורא אותה עכשיו
2. [ ] **Setup branch:** `git checkout -b feature/define-v3`
3. [ ] **Start Phase 1:** Design system setup
4. [ ] **Backend first:** Build detect-framework endpoint
5. [ ] **Iterate:** One phase at a time, no rush

---

## Decisions Made

| Question | Decision | Rationale |
|----------|----------|-----------|
| Scope | **3 frameworks in MVP** (PICO, PECO, SPIDER) | Covers 80%, faster to market |
| Deployment | **In-place upgrade** at `/define` | No confusion, single codebase |
| Timeline | **No fixed dates** - phase by phase | Side project, realistic approach |
| Preview timing | **Phase 3** (with Wizard Core) | Core UX, need early feedback |
| Export | **.txt only in MVP**, .docx/.pdf later | Focus on core flow first |
| AI Model | **Gemini Flash** (current) | Working well, don't change what works |

---

**Document Owner:** Development Team
**Last Updated:** 2026-01-28
**Status:** 🟡 Pending Approval
