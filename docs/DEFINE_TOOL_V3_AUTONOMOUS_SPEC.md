# Define Tool v3.0 - Autonomous Development Spec

**Purpose:** Enable Claude Code to build Phase 1-2 autonomously without human intervention.

**Rule:** If this document doesn't answer your question, make a reasonable decision and document it. Don't stop to ask.

---

## 1. Project Context

### 1.1 What Exists

```
medai-hub/
├── backend/
│   ├── main.py                          # FastAPI app
│   ├── app/
│   │   ├── api/
│   │   │   ├── models/
│   │   │   │   ├── schemas.py           # Pydantic models
│   │   │   │   └── frameworks.py        # Framework type models
│   │   │   └── routes/
│   │   │       ├── projects.py          # CRUD
│   │   │       └── define.py            # Current chat endpoints
│   │   ├── core/
│   │   │   ├── config.py                # Settings
│   │   │   ├── auth.py                  # JWT validation
│   │   │   └── prompts/
│   │   │       ├── shared.py            # FRAMEWORK_SCHEMAS dict
│   │   │       └── define.py            # Current AI prompts
│   │   └── services/
│   │       ├── ai_service.py            # Gemini singleton
│   │       └── database.py              # Supabase singleton
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── define/                      # Current v2.0 (DON'T TOUCH)
│   │   │   └── page.tsx
│   │   └── define-v3/                   # NEW - build here
│   ├── components/ui/                   # Shadcn components
│   └── lib/
│       ├── api.ts                       # API client
│       └── supabase.ts
└── docs/
    ├── schema.sql
    └── define-tool-v3-implementation-plan.md
```

### 1.2 Tech Stack

| Layer | Tech | Notes |
|-------|------|-------|
| Backend | FastAPI + Python 3.11 | Async endpoints |
| AI | Google Gemini Flash | Via LangChain |
| DB | Supabase PostgreSQL | Service role key |
| Auth | Supabase JWT | `Depends(get_current_user)` |
| Frontend | Next.js 15 + TypeScript | App Router |
| UI | Shadcn + Tailwind | `npx shadcn-ui@latest add X` |
| State | Zustand | For wizard state |

### 1.3 API Base URLs

- Local: `http://localhost:8000`
- Prod: `https://api.shaitamam.com`

---

## 2. What We're Building

### 2.1 Goal

Replace chat-based `/define` with wizard-based flow:
- 6 steps (progressive disclosure)
- Split screen (input left, preview right)
- AI detects framework from free input
- Live preview updates in real-time

### 2.2 MVP Scope (STRICT)

**Frameworks: ONLY 3**
```
PICO  - Intervention effectiveness (P, I, C, O)
PECO  - Exposure/etiology (P, E, C, O)  
SPIDER - Qualitative (S, PI, D, E, R)
```

**DO NOT** add other frameworks in Phase 1-2. They come in Phase 6.

### 2.3 Steps Overview

| Step | Name | Purpose |
|------|------|---------|
| 0 | Free Input | User describes research idea |
| 1 | Framework Confirm | AI detected framework, user confirms |
| 2 | Dynamic Fields | Fill in P, I, C, O etc. |
| 3 | Generate Questions | AI creates 3 versions |
| 4 | FINER Review | Quality assessment |
| 5 | Save & Export | Save to project |

---

## 3. Phase 1: Foundation & Design System

### 3.1 Tasks

#### 3.1.1 Create Directory Structure

```bash
mkdir -p frontend/app/define-v3/components/wizard
mkdir -p frontend/app/define-v3/components/preview
mkdir -p frontend/app/define-v3/components/shared
mkdir -p frontend/app/define-v3/hooks
mkdir -p frontend/app/define-v3/types
mkdir -p backend/app/core/prompts/v3
```

#### 3.1.2 TypeScript Types

**File:** `frontend/app/define-v3/types/wizard.types.ts`

```typescript
// ===== WIZARD STATE =====
export type WizardStep = 0 | 1 | 2 | 3 | 4 | 5;
export type QuestionScope = 'narrow' | 'broad' | 'clinical';
export type Language = 'en' | 'he';
export type FinerLevel = 'high' | 'medium' | 'low';
export type FinerRecommendation = 'proceed' | 'revise' | 'reconsider';

// MVP Frameworks only
export type MVPFramework = 'PICO' | 'PECO' | 'SPIDER';

export interface WizardState {
  // Navigation
  currentStep: WizardStep;
  canProceed: boolean;
  
  // Step 0
  freeInput: string;
  language: Language;
  
  // Step 1
  detectedFramework: MVPFramework | null;
  frameworkExplanation: string;
  needsClarification: boolean;
  clarificationQuestions: string[];
  
  // Step 2
  frameworkData: Record<string, string>;
  
  // Step 3-4
  generatedQuestions: GeneratedQuestion[];
  selectedQuestionIndex: number | null;
  
  // Step 5
  projectId: string | null;
  isSaved: boolean;
}

// ===== FRAMEWORK CONFIG =====
export interface FrameworkField {
  key: string;
  label_en: string;
  label_he: string;
  placeholder_en: string;
  placeholder_he: string;
  example_en: string;
  example_he: string;
  required: boolean;
}

export interface FrameworkConfig {
  name: MVPFramework;
  description_en: string;
  description_he: string;
  question_type: 'effectiveness' | 'etiology' | 'qualitative';
  fields: FrameworkField[];
}

// ===== FINER =====
export interface FinerScore {
  level: FinerLevel;
  reason: string;
}

export interface FinerAssessment {
  F: FinerScore;
  I: FinerScore;
  N: FinerScore;
  E: FinerScore;
  R: FinerScore;
  recommendation: FinerRecommendation;
  holistic_reasoning: string;
  suggestions: string[];
}

// ===== GENERATED QUESTIONS =====
export interface GeneratedQuestion {
  id: string;
  scope: QuestionScope;
  text_en: string;
  text_he: string;
  finer: FinerAssessment;
}

// ===== API TYPES =====
export interface DetectFrameworkRequest {
  free_text: string;
  language: Language;
}

export interface DetectFrameworkResponse {
  needs_clarification: boolean;
  clarification_questions?: string[];
  detected_framework?: MVPFramework;
  explanation?: string;
  preliminary_components?: Record<string, string>;
}

export interface GenerateQuestionsRequest {
  framework_type: MVPFramework;
  framework_data: Record<string, string>;
  language: Language;
}

export interface GenerateQuestionsResponse {
  questions: GeneratedQuestion[];
}
```

#### 3.1.3 Framework Configurations

**File:** `frontend/app/define-v3/hooks/useFrameworkConfig.ts`

```typescript
import { FrameworkConfig, MVPFramework } from '../types/wizard.types';

export const FRAMEWORK_CONFIGS: Record<MVPFramework, FrameworkConfig> = {
  PICO: {
    name: 'PICO',
    description_en: 'For intervention effectiveness questions: Does X work better than Y?',
    description_he: 'לשאלות יעילות התערבות: האם X עובד טוב יותר מ-Y?',
    question_type: 'effectiveness',
    fields: [
      {
        key: 'P',
        label_en: 'Population',
        label_he: 'אוכלוסייה',
        placeholder_en: 'Who are the patients/people?',
        placeholder_he: 'מי הם המטופלים/האנשים?',
        example_en: 'Adults over 65 with type 2 diabetes',
        example_he: 'מבוגרים מעל גיל 65 עם סוכרת סוג 2',
        required: true
      },
      {
        key: 'I',
        label_en: 'Intervention',
        label_he: 'התערבות',
        placeholder_en: 'What treatment/intervention?',
        placeholder_he: 'איזה טיפול/התערבות?',
        example_en: 'Aerobic exercise 3x/week',
        example_he: 'פעילות אירובית 3 פעמים בשבוע',
        required: true
      },
      {
        key: 'C',
        label_en: 'Comparison',
        label_he: 'השוואה',
        placeholder_en: 'Compared to what? (optional)',
        placeholder_he: 'בהשוואה למה? (אופציונלי)',
        example_en: 'Standard care or no exercise',
        example_he: 'טיפול רגיל או ללא פעילות',
        required: false
      },
      {
        key: 'O',
        label_en: 'Outcome',
        label_he: 'תוצאה',
        placeholder_en: 'What result are you measuring?',
        placeholder_he: 'מה התוצאה שאתה מודד?',
        example_en: 'HbA1c levels, quality of life',
        example_he: 'רמות HbA1c, איכות חיים',
        required: true
      }
    ]
  },
  
  PECO: {
    name: 'PECO',
    description_en: 'For exposure/risk questions: Does exposure to X increase risk of Y?',
    description_he: 'לשאלות חשיפה/סיכון: האם חשיפה ל-X מגבירה סיכון ל-Y?',
    question_type: 'etiology',
    fields: [
      {
        key: 'P',
        label_en: 'Population',
        label_he: 'אוכלוסייה',
        placeholder_en: 'Who is being studied?',
        placeholder_he: 'מי נחקר?',
        example_en: 'Healthcare workers',
        example_he: 'עובדי מערכת הבריאות',
        required: true
      },
      {
        key: 'E',
        label_en: 'Exposure',
        label_he: 'חשיפה',
        placeholder_en: 'What exposure/risk factor?',
        placeholder_he: 'לאיזו חשיפה/גורם סיכון?',
        example_en: 'Night shift work',
        example_he: 'עבודה במשמרות לילה',
        required: true
      },
      {
        key: 'C',
        label_en: 'Comparison',
        label_he: 'השוואה',
        placeholder_en: 'Compared to whom? (optional)',
        placeholder_he: 'בהשוואה למי? (אופציונלי)',
        example_en: 'Day shift workers',
        example_he: 'עובדי משמרות יום',
        required: false
      },
      {
        key: 'O',
        label_en: 'Outcome',
        label_he: 'תוצאה',
        placeholder_en: 'What outcome/disease?',
        placeholder_he: 'מה התוצאה/מחלה?',
        example_en: 'Cardiovascular disease incidence',
        example_he: 'היארעות מחלות לב',
        required: true
      }
    ]
  },
  
  SPIDER: {
    name: 'SPIDER',
    description_en: 'For qualitative questions: What is the experience of X?',
    description_he: 'לשאלות איכותניות: מהי החוויה של X?',
    question_type: 'qualitative',
    fields: [
      {
        key: 'S',
        label_en: 'Sample',
        label_he: 'מדגם',
        placeholder_en: 'Who will be interviewed/observed?',
        placeholder_he: 'מי יראיינו/יצפו?',
        example_en: 'Cancer survivors aged 30-50',
        example_he: 'שורדי סרטן בגילאי 30-50',
        required: true
      },
      {
        key: 'PI',
        label_en: 'Phenomenon of Interest',
        label_he: 'תופעת העניין',
        placeholder_en: 'What experience/phenomenon?',
        placeholder_he: 'איזו חוויה/תופעה?',
        example_en: 'Return to work after treatment',
        example_he: 'חזרה לעבודה לאחר טיפול',
        required: true
      },
      {
        key: 'D',
        label_en: 'Design',
        label_he: 'עיצוב מחקר',
        placeholder_en: 'What qualitative method?',
        placeholder_he: 'איזו שיטה איכותנית?',
        example_en: 'Phenomenology, Grounded theory',
        example_he: 'פנומנולוגיה, תיאוריה מעוגנת',
        required: true
      },
      {
        key: 'E',
        label_en: 'Evaluation',
        label_he: 'הערכה',
        placeholder_en: 'What are you evaluating?',
        placeholder_he: 'מה אתה מעריך?',
        example_en: 'Attitudes, perceptions, barriers',
        example_he: 'עמדות, תפיסות, חסמים',
        required: true
      },
      {
        key: 'R',
        label_en: 'Research Type',
        label_he: 'סוג המחקר',
        placeholder_en: 'Qualitative/Mixed-methods?',
        placeholder_he: 'איכותני/שיטות משולבות?',
        example_en: 'Qualitative',
        example_he: 'איכותני',
        required: true
      }
    ]
  }
};

export function useFrameworkConfig(framework: MVPFramework | null) {
  if (!framework) return null;
  return FRAMEWORK_CONFIGS[framework];
}

export function getFieldsForFramework(framework: MVPFramework): string[] {
  return FRAMEWORK_CONFIGS[framework].fields.map(f => f.key);
}

export function getRequiredFields(framework: MVPFramework): string[] {
  return FRAMEWORK_CONFIGS[framework].fields
    .filter(f => f.required)
    .map(f => f.key);
}
```

#### 3.1.4 Zustand Store

**File:** `frontend/app/define-v3/hooks/useWizardState.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  WizardState, 
  WizardStep, 
  MVPFramework, 
  GeneratedQuestion,
  Language 
} from '../types/wizard.types';
import { getRequiredFields } from './useFrameworkConfig';

interface WizardActions {
  // Navigation
  setStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  
  // Step 0
  setFreeInput: (text: string) => void;
  setLanguage: (lang: Language) => void;
  
  // Step 1
  setDetectedFramework: (framework: MVPFramework, explanation: string) => void;
  setClarification: (questions: string[]) => void;
  clearClarification: () => void;
  
  // Step 2
  setFrameworkField: (key: string, value: string) => void;
  setFrameworkData: (data: Record<string, string>) => void;
  
  // Step 3-4
  setGeneratedQuestions: (questions: GeneratedQuestion[]) => void;
  selectQuestion: (index: number) => void;
  
  // Step 5
  setProjectId: (id: string) => void;
  setSaved: (saved: boolean) => void;
  
  // Utils
  reset: () => void;
  canProceedToStep: (step: WizardStep) => boolean;
}

const initialState: WizardState = {
  currentStep: 0,
  canProceed: false,
  freeInput: '',
  language: 'he',
  detectedFramework: null,
  frameworkExplanation: '',
  needsClarification: false,
  clarificationQuestions: [],
  frameworkData: {},
  generatedQuestions: [],
  selectedQuestionIndex: null,
  projectId: null,
  isSaved: false,
};

export const useWizardStore = create<WizardState & WizardActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStep: (step) => set({ currentStep: step }),
      
      nextStep: () => {
        const { currentStep } = get();
        if (currentStep < 5) {
          set({ currentStep: (currentStep + 1) as WizardStep });
        }
      },
      
      prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 0) {
          set({ currentStep: (currentStep - 1) as WizardStep });
        }
      },

      setFreeInput: (text) => set({ freeInput: text }),
      
      setLanguage: (lang) => set({ language: lang }),

      setDetectedFramework: (framework, explanation) => set({
        detectedFramework: framework,
        frameworkExplanation: explanation,
        needsClarification: false,
        clarificationQuestions: [],
      }),

      setClarification: (questions) => set({
        needsClarification: true,
        clarificationQuestions: questions,
        detectedFramework: null,
      }),

      clearClarification: () => set({
        needsClarification: false,
        clarificationQuestions: [],
      }),

      setFrameworkField: (key, value) => set((state) => ({
        frameworkData: { ...state.frameworkData, [key]: value }
      })),

      setFrameworkData: (data) => set({ frameworkData: data }),

      setGeneratedQuestions: (questions) => set({ 
        generatedQuestions: questions,
        selectedQuestionIndex: null,
      }),

      selectQuestion: (index) => set({ selectedQuestionIndex: index }),

      setProjectId: (id) => set({ projectId: id }),
      
      setSaved: (saved) => set({ isSaved: saved }),

      reset: () => set(initialState),

      canProceedToStep: (step) => {
        const state = get();
        
        switch (step) {
          case 0:
            return true;
          case 1:
            return state.freeInput.trim().length >= 10;
          case 2:
            return state.detectedFramework !== null;
          case 3:
            if (!state.detectedFramework) return false;
            const required = getRequiredFields(state.detectedFramework);
            return required.every(key => 
              state.frameworkData[key]?.trim().length > 0
            );
          case 4:
            return state.generatedQuestions.length > 0;
          case 5:
            return state.selectedQuestionIndex !== null;
          default:
            return false;
        }
      },
    }),
    {
      name: 'define-wizard-v3',
      partialize: (state) => ({
        freeInput: state.freeInput,
        language: state.language,
        detectedFramework: state.detectedFramework,
        frameworkData: state.frameworkData,
        currentStep: state.currentStep,
      }),
    }
  )
);
```

#### 3.1.5 Design Tokens

**File:** `frontend/app/define-v3/styles/wizard-theme.css`

```css
/* ===== COLOR PALETTE ===== */
:root {
  /* Primary - Clinical Blue */
  --wizard-primary: #2563eb;
  --wizard-primary-hover: #1d4ed8;
  --wizard-primary-light: #dbeafe;
  
  /* Status Colors */
  --wizard-success: #16a34a;
  --wizard-success-light: #dcfce7;
  --wizard-warning: #ca8a04;
  --wizard-warning-light: #fef9c3;
  --wizard-error: #dc2626;
  --wizard-error-light: #fee2e2;
  
  /* Neutrals */
  --wizard-bg: #f8fafc;
  --wizard-surface: #ffffff;
  --wizard-border: #e2e8f0;
  --wizard-text: #1e293b;
  --wizard-text-muted: #64748b;
  
  /* FINER Colors */
  --finer-high: #16a34a;
  --finer-medium: #ca8a04;
  --finer-low: #dc2626;
}

/* ===== LAYOUT ===== */
.wizard-container {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 1.5rem;
  min-height: calc(100vh - 64px);
  padding: 1.5rem;
}

@media (max-width: 1024px) {
  .wizard-container {
    grid-template-columns: 1fr;
  }
}

/* ===== PROGRESS BAR ===== */
.wizard-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0;
}

.wizard-progress-step {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.wizard-progress-dot {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.wizard-progress-dot.active {
  background: var(--wizard-primary);
  color: white;
}

.wizard-progress-dot.completed {
  background: var(--wizard-success);
  color: white;
}

.wizard-progress-dot.inactive {
  background: var(--wizard-border);
  color: var(--wizard-text-muted);
}

.wizard-progress-line {
  flex: 1;
  height: 2px;
  background: var(--wizard-border);
}

.wizard-progress-line.completed {
  background: var(--wizard-success);
}

/* ===== CARDS ===== */
.wizard-card {
  background: var(--wizard-surface);
  border: 1px solid var(--wizard-border);
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.wizard-card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--wizard-text);
  margin-bottom: 1rem;
}

/* ===== PREVIEW PANEL ===== */
.preview-panel {
  position: sticky;
  top: 1.5rem;
  height: fit-content;
  max-height: calc(100vh - 3rem);
  overflow-y: auto;
}

/* ===== RTL SUPPORT ===== */
[dir="rtl"] .wizard-container {
  direction: rtl;
}

[dir="rtl"] .wizard-progress {
  flex-direction: row-reverse;
}

/* ===== FINER BARS ===== */
.finer-bar {
  height: 0.5rem;
  border-radius: 0.25rem;
  transition: width 0.3s ease;
}

.finer-bar.high {
  background: var(--finer-high);
}

.finer-bar.medium {
  background: var(--finer-medium);
}

.finer-bar.low {
  background: var(--finer-low);
}

/* ===== BUTTONS ===== */
.wizard-btn-primary {
  background: var(--wizard-primary);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: background 0.2s;
}

.wizard-btn-primary:hover:not(:disabled) {
  background: var(--wizard-primary-hover);
}

.wizard-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.wizard-btn-secondary {
  background: transparent;
  color: var(--wizard-text);
  border: 1px solid var(--wizard-border);
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
}
```

#### 3.1.6 Basic Layout Components

**File:** `frontend/app/define-v3/components/shared/ProgressBar.tsx`

```tsx
'use client';

import { WizardStep } from '../../types/wizard.types';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ProgressBarProps {
  currentStep: WizardStep;
  language: 'en' | 'he';
}

const STEPS = {
  en: ['Input', 'Framework', 'Details', 'Questions', 'Review', 'Save'],
  he: ['קלט', 'מסגרת', 'פרטים', 'שאלות', 'סקירה', 'שמירה'],
};

export function ProgressBar({ currentStep, language }: ProgressBarProps) {
  const labels = STEPS[language];
  
  return (
    <div className="wizard-progress" dir={language === 'he' ? 'rtl' : 'ltr'}>
      {labels.map((label, index) => (
        <div key={index} className="wizard-progress-step">
          <div
            className={cn(
              'wizard-progress-dot',
              index < currentStep && 'completed',
              index === currentStep && 'active',
              index > currentStep && 'inactive'
            )}
          >
            {index < currentStep ? (
              <Check className="w-4 h-4" />
            ) : (
              index + 1
            )}
          </div>
          <span className={cn(
            'text-sm hidden sm:inline',
            index === currentStep ? 'text-primary font-medium' : 'text-muted-foreground'
          )}>
            {label}
          </span>
          {index < labels.length - 1 && (
            <div className={cn(
              'wizard-progress-line flex-1 min-w-[2rem]',
              index < currentStep && 'completed'
            )} />
          )}
        </div>
      ))}
    </div>
  );
}
```

**File:** `frontend/app/define-v3/components/shared/WizardLayout.tsx`

```tsx
'use client';

import { ReactNode } from 'react';
import { ProgressBar } from './ProgressBar';
import { useWizardStore } from '../../hooks/useWizardState';
import '../../styles/wizard-theme.css';

interface WizardLayoutProps {
  children: ReactNode;
  previewPanel: ReactNode;
}

export function WizardLayout({ children, previewPanel }: WizardLayoutProps) {
  const { currentStep, language } = useWizardStore();
  
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <ProgressBar currentStep={currentStep} language={language} />
        
        <div className="wizard-container mt-6">
          {/* Main Content */}
          <div className="space-y-6">
            {children}
          </div>
          
          {/* Preview Panel */}
          <div className="preview-panel">
            {previewPanel}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 3.2 Acceptance Criteria (Phase 1)

- [ ] All TypeScript types compile without errors
- [ ] Zustand store works with persist middleware
- [ ] Framework configs have all 3 frameworks (PICO, PECO, SPIDER)
- [ ] CSS variables load correctly
- [ ] ProgressBar renders 6 steps
- [ ] WizardLayout has split-screen on desktop, stacked on mobile
- [ ] RTL direction works when language='he'

### 3.3 Test Commands

```bash
cd frontend
npx tsc --noEmit  # Should pass with 0 errors
npm run dev       # Should render at localhost:3000/define-v3
```

---

## 4. Phase 2: Backend Endpoints

### 4.1 Framework Detection Prompt

**File:** `backend/app/core/prompts/v3/detect_framework.py`

```python
"""
Framework Detection Prompts for Define Tool v3.0
MVP: PICO, PECO, SPIDER only
"""

MVP_FRAMEWORKS = ["PICO", "PECO", "SPIDER"]

DETECT_FRAMEWORK_PROMPT = """# TASK: Research Question Framework Detection

You are an expert in systematic review methodology. Analyze the user's research idea and determine the appropriate framework.

## User Input
"{user_input}"

## Language
{language_instruction}

## Available Frameworks (MVP)

### PICO - Intervention Effectiveness
- **Use when:** User wants to know if something WORKS or is EFFECTIVE
- **Keywords:** treatment, therapy, intervention, effective, works, better than, compared to
- **Question pattern:** "Does X work for Y?" or "Is X better than Y?"

### PECO - Exposure/Etiology
- **Use when:** User wants to know if something CAUSES or is a RISK FACTOR
- **Keywords:** risk, exposure, cause, etiology, association, leads to, increases
- **Question pattern:** "Does exposure to X cause Y?" or "Is X a risk factor for Y?"

### SPIDER - Qualitative/Experience
- **Use when:** User wants to understand EXPERIENCES, PERCEPTIONS, FEELINGS
- **Keywords:** experience, perception, feelings, attitudes, lived experience, qualitative
- **Question pattern:** "What is the experience of X?" or "How do people feel about Y?"

## Decision Process

### Step 1: Identify Intent
Ask yourself: What does the user fundamentally want to know?
- "Does it work?" → PICO
- "Does it cause?" → PECO  
- "What do they feel?" → SPIDER

### Step 2: Check for Ambiguity
If the input is ambiguous or could fit multiple frameworks, you MUST ask clarifying questions.
Do NOT default to PICO. Do NOT guess.

**Ambiguous signals:**
- No clear intervention OR exposure OR experience mentioned
- Could be interpreted multiple ways
- Missing key information about intent

### Step 3: Extract Preliminary Components
If you can determine the framework, extract what components you can identify.

## OUTPUT FORMAT

Return ONLY valid JSON (no markdown, no explanation outside JSON):

**If framework is clear:**
```json
{{
  "needs_clarification": false,
  "detected_framework": "PICO|PECO|SPIDER",
  "explanation": "Clear explanation in {output_language} (2-3 sentences) of WHY this framework fits",
  "preliminary_components": {{
    "P": "extracted value or empty string",
    "I": "extracted value or empty string",
    ...
  }},
  "confidence": "high|medium"
}}
```

**If clarification needed:**
```json
{{
  "needs_clarification": true,
  "clarification_questions": [
    "Question 1 in {output_language}",
    "Question 2 in {output_language}"
  ],
  "possible_frameworks": ["PICO", "SPIDER"],
  "reasoning": "Why clarification is needed"
}}
```

## Rules
1. ONLY recommend PICO, PECO, or SPIDER
2. If ambiguous, ask clarifying questions - NEVER guess
3. Match output language to input language
4. preliminary_components should use framework-specific keys (P,I,C,O for PICO, etc.)
5. Return ONLY JSON, nothing else
"""

def get_detect_framework_prompt(user_input: str, language: str = "en") -> str:
    """Build the framework detection prompt."""
    
    if language == "he":
        language_instruction = "המשתמש כתב בעברית. ענה בעברית."
        output_language = "Hebrew"
    else:
        language_instruction = "The user wrote in English. Respond in English."
        output_language = "English"
    
    return DETECT_FRAMEWORK_PROMPT.format(
        user_input=user_input,
        language_instruction=language_instruction,
        output_language=output_language
    )
```

### 4.2 Question Generation Prompt

**File:** `backend/app/core/prompts/v3/generate_questions.py`

```python
"""
Question Generation Prompts for Define Tool v3.0
Generates 3 question versions with FINER assessment
"""

GENERATE_QUESTIONS_PROMPT = """# TASK: Generate Research Questions

You are a systematic review methodology expert. Generate 3 versions of a research question based on the framework data provided.

## Framework: {framework_type}
## Components:
{components_text}

## Language: {language_instruction}

## Generate Exactly 3 Questions

### 1. Narrow (🎯 Focused)
- Very specific and measurable
- Includes all available details (age ranges, specific measures, timeframes)
- Ideal for systematic review with strict inclusion criteria

### 2. Broad (📊 Exploratory)  
- General and inclusive
- Captures core question without excessive detail
- Good for preliminary literature mapping

### 3. Clinical (🏥 Practical)
- Real-world applicability focus
- Considers implementation constraints
- What a clinician would actually ask

## FINER Assessment (REQUIRED for each question)

For EACH question, assess all 5 criteria:

### F - Feasible
Can this be studied realistically?
- Consider: sample access, resources, timeline, measurement tools
- Level: high (definitely doable) | medium (challenging but possible) | low (major barriers)

### I - Interesting
Is this genuinely engaging to researchers and the field?
- Consider: scientific curiosity, clinical impact, timeliness
- Level: high (compelling) | medium (relevant) | low (limited interest)

### N - Novel
Does this add new knowledge?
- Consider: gaps in literature, new angles, unexplored populations
- Level: high (fills clear gap) | medium (extends existing) | low (well-covered)

### E - Ethical
Can this be conducted ethically?
- Consider: risk/benefit, consent feasibility, vulnerable populations
- Level: high (minimal concerns) | medium (manageable issues) | low (significant barriers)

### R - Relevant
Will results matter?
- Consider: clinical practice change, policy impact, guideline potential
- Level: high (practice-changing) | medium (useful contribution) | low (limited application)

## OUTPUT FORMAT

Return ONLY valid JSON:

```json
{{
  "questions": [
    {{
      "scope": "narrow",
      "text_en": "English version (ALWAYS required)",
      "text_he": "Hebrew version (if language=he, otherwise empty string)",
      "finer": {{
        "F": {{"level": "high|medium|low", "reason": "1-2 sentence explanation"}},
        "I": {{"level": "high|medium|low", "reason": "1-2 sentence explanation"}},
        "N": {{"level": "high|medium|low", "reason": "1-2 sentence explanation"}},
        "E": {{"level": "high|medium|low", "reason": "1-2 sentence explanation"}},
        "R": {{"level": "high|medium|low", "reason": "1-2 sentence explanation"}},
        "recommendation": "proceed|revise|reconsider",
        "holistic_reasoning": "Overall assessment considering all factors",
        "suggestions": ["Specific improvement 1", "Specific improvement 2"]
      }}
    }},
    {{
      "scope": "broad",
      ...
    }},
    {{
      "scope": "clinical",
      ...
    }}
  ]
}}
```

## Rules
1. Generate EXACTLY 3 questions (narrow, broad, clinical)
2. English text_en is MANDATORY for all questions (needed for PubMed)
3. If language=he, provide BOTH Hebrew and English
4. FINER uses ONLY high/medium/low - NO numeric scores
5. Recommendation is based on holistic judgment, not formula
6. Suggestions must be specific and actionable
7. Return ONLY JSON, nothing else
"""

def get_generate_questions_prompt(
    framework_type: str,
    framework_data: dict,
    language: str = "en"
) -> str:
    """Build the question generation prompt."""
    
    components_text = "\n".join([
        f"- **{key}:** {value}"
        for key, value in framework_data.items()
        if value
    ])
    
    if language == "he":
        language_instruction = "Generate Hebrew AND English versions. Explanations in Hebrew."
    else:
        language_instruction = "Generate English versions only. Explanations in English."
    
    return GENERATE_QUESTIONS_PROMPT.format(
        framework_type=framework_type,
        components_text=components_text,
        language_instruction=language_instruction
    )
```

### 4.3 API Endpoints

**File:** `backend/app/api/routes/define_v3.py`

```python
"""
Define Tool v3.0 API Routes
Wizard-based research question formulation
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
from uuid import UUID
import json
import re

from app.core.auth import get_current_user
from app.services.ai_service import ai_service
from app.core.prompts.v3.detect_framework import get_detect_framework_prompt
from app.core.prompts.v3.generate_questions import get_generate_questions_prompt

router = APIRouter(prefix="/api/v1/define-v3", tags=["define-v3"])

# ===== REQUEST/RESPONSE MODELS =====

class DetectFrameworkRequest(BaseModel):
    free_text: str
    language: str = "en"  # "en" or "he"

class DetectFrameworkResponse(BaseModel):
    needs_clarification: bool
    clarification_questions: Optional[List[str]] = None
    detected_framework: Optional[str] = None
    explanation: Optional[str] = None
    preliminary_components: Optional[Dict[str, str]] = None
    confidence: Optional[str] = None
    possible_frameworks: Optional[List[str]] = None
    reasoning: Optional[str] = None

class GenerateQuestionsRequest(BaseModel):
    framework_type: str
    framework_data: Dict[str, str]
    language: str = "en"

class FinerScore(BaseModel):
    level: str  # "high", "medium", "low"
    reason: str

class FinerAssessment(BaseModel):
    F: FinerScore
    I: FinerScore
    N: FinerScore
    E: FinerScore
    R: FinerScore
    recommendation: str  # "proceed", "revise", "reconsider"
    holistic_reasoning: str
    suggestions: List[str]

class GeneratedQuestion(BaseModel):
    scope: str  # "narrow", "broad", "clinical"
    text_en: str
    text_he: Optional[str] = ""
    finer: FinerAssessment

class GenerateQuestionsResponse(BaseModel):
    questions: List[GeneratedQuestion]

# ===== HELPER FUNCTIONS =====

def extract_json_from_response(response: str) -> dict:
    """Extract JSON from AI response, handling markdown code blocks."""
    # Try to find JSON in code blocks first
    json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', response)
    if json_match:
        json_str = json_match.group(1)
    else:
        # Try to find raw JSON
        json_str = response.strip()
    
    # Clean up common issues
    json_str = json_str.strip()
    if json_str.startswith('```'):
        json_str = json_str.split('```')[1] if '```' in json_str else json_str
    
    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse JSON: {e}\nResponse was: {response[:500]}")

# ===== ENDPOINTS =====

@router.post("/detect-framework", response_model=DetectFrameworkResponse)
async def detect_framework(
    request: DetectFrameworkRequest,
    user: dict = Depends(get_current_user)
):
    """
    Detect appropriate framework from free-text input.
    May return clarification questions if input is ambiguous.
    """
    if len(request.free_text.strip()) < 10:
        raise HTTPException(
            status_code=400,
            detail="Input too short. Please provide more detail about your research question."
        )
    
    # Build prompt
    prompt = get_detect_framework_prompt(
        user_input=request.free_text,
        language=request.language
    )
    
    try:
        # Call AI service
        response = await ai_service.generate_response(
            prompt=prompt,
            system_prompt="You are a research methodology expert. Return only valid JSON."
        )
        
        # Parse response
        result = extract_json_from_response(response)
        
        return DetectFrameworkResponse(**result)
        
    except ValueError as e:
        raise HTTPException(status_code=500, detail=f"AI response parsing error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


@router.post("/generate-questions", response_model=GenerateQuestionsResponse)
async def generate_questions(
    request: GenerateQuestionsRequest,
    user: dict = Depends(get_current_user)
):
    """
    Generate 3 research question formulations with FINER assessment.
    """
    # Validate framework
    valid_frameworks = ["PICO", "PECO", "SPIDER"]
    if request.framework_type not in valid_frameworks:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid framework. Must be one of: {valid_frameworks}"
        )
    
    # Validate framework_data has required fields
    required_fields = {
        "PICO": ["P", "I", "O"],
        "PECO": ["P", "E", "O"],
        "SPIDER": ["S", "PI", "E", "R"]
    }
    
    missing = [f for f in required_fields[request.framework_type] 
               if not request.framework_data.get(f)]
    
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required fields: {missing}"
        )
    
    # Build prompt
    prompt = get_generate_questions_prompt(
        framework_type=request.framework_type,
        framework_data=request.framework_data,
        language=request.language
    )
    
    try:
        # Call AI service
        response = await ai_service.generate_response(
            prompt=prompt,
            system_prompt="You are a systematic review expert. Return only valid JSON."
        )
        
        # Parse response
        result = extract_json_from_response(response)
        
        # Validate we got 3 questions
        if len(result.get("questions", [])) != 3:
            raise ValueError("AI did not return exactly 3 questions")
        
        return GenerateQuestionsResponse(**result)
        
    except ValueError as e:
        raise HTTPException(status_code=500, detail=f"AI response parsing error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


@router.get("/health")
async def health_check():
    """Health check endpoint for v3 routes."""
    return {"status": "ok", "version": "3.0"}
```

### 4.4 Register Routes

**Update:** `backend/main.py`

Add this import and registration:

```python
from app.api.routes.define_v3 import router as define_v3_router

# After existing route registrations:
app.include_router(define_v3_router)
```

### 4.5 Acceptance Criteria (Phase 2)

- [ ] `POST /api/v1/define-v3/detect-framework` returns valid response
- [ ] Returns `needs_clarification: true` for ambiguous input
- [ ] Returns detected framework for clear input
- [ ] `POST /api/v1/define-v3/generate-questions` returns 3 questions
- [ ] Each question has FINER with high/medium/low (no numeric scores)
- [ ] Hebrew input returns Hebrew explanations
- [ ] Invalid framework returns 400 error
- [ ] Missing required fields returns 400 error

### 4.6 Test Commands

```bash
cd backend
pytest tests/test_define_v3.py -v  # After creating tests

# Manual testing with curl:
curl -X POST http://localhost:8000/api/v1/define-v3/detect-framework \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"free_text": "Does exercise help depression in elderly?", "language": "en"}'
```

### 4.7 Test File

**File:** `backend/tests/test_define_v3.py`

```python
"""Tests for Define Tool v3.0 endpoints."""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock

# Test cases for detect-framework
DETECT_TEST_CASES = [
    # Clear PICO
    {
        "input": "Does exercise help depression in elderly patients?",
        "language": "en",
        "expected_framework": "PICO",
        "should_clarify": False
    },
    # Clear PECO
    {
        "input": "Is night shift work associated with increased cardiovascular risk?",
        "language": "en", 
        "expected_framework": "PECO",
        "should_clarify": False
    },
    # Clear SPIDER
    {
        "input": "What are the experiences of cancer survivors returning to work?",
        "language": "en",
        "expected_framework": "SPIDER",
        "should_clarify": False
    },
    # Ambiguous - should ask for clarification
    {
        "input": "depression in elderly",
        "language": "en",
        "expected_framework": None,
        "should_clarify": True
    },
    # Hebrew PICO
    {
        "input": "האם פעילות גופנית עוזרת לדיכאון בקרב קשישים?",
        "language": "he",
        "expected_framework": "PICO",
        "should_clarify": False
    }
]

# Add actual test functions when implementing
```

---

## 5. Decision Rules

### 5.1 If Unclear About Implementation

| Situation | Decision |
|-----------|----------|
| Missing type definition | Create it in wizard.types.ts |
| Component structure unclear | Follow Shadcn patterns |
| API response format unclear | Match existing define.py patterns |
| CSS approach | Use Tailwind + CSS variables |
| State management | Always use Zustand store |
| Language not specified | Default to 'he' (Hebrew) |

### 5.2 If Error Occurs

| Error Type | Action |
|------------|--------|
| TypeScript error | Fix it, don't skip |
| API timeout | Add retry logic (2 attempts) |
| JSON parse error | Add fallback extraction |
| Missing dependency | Install it with npm/pip |
| Test failure | Fix the code, not the test |

### 5.3 Framework Detection Ambiguity

| Input Pattern | Decision |
|---------------|----------|
| "Does X work/help?" | PICO |
| "Is X associated with/causes Y?" | PECO |
| "What is the experience of?" | SPIDER |
| Just a topic (e.g., "diabetes") | Ask clarification |
| Mentions both intervention AND exposure | Ask clarification |
| No clear verb | Ask clarification |

---

## 6. What NOT to Do

### 6.1 Hard Rules

- ❌ DO NOT modify files in `/frontend/app/define/` (v2.0)
- ❌ DO NOT add frameworks beyond PICO, PECO, SPIDER in Phase 1-2
- ❌ DO NOT use numeric FINER scores (no 100, 66, 33)
- ❌ DO NOT default to PICO when ambiguous
- ❌ DO NOT skip TypeScript types
- ❌ DO NOT create tests that pass by ignoring failures
- ❌ DO NOT change database schema (use existing tables)
- ❌ DO NOT remove existing API endpoints

### 6.2 Avoid These Patterns

```typescript
// ❌ BAD: Hardcoded strings
const framework = "PICO";

// ✅ GOOD: Use types
const framework: MVPFramework = "PICO";
```

```typescript
// ❌ BAD: Any type
const data: any = response.json();

// ✅ GOOD: Proper typing
const data: DetectFrameworkResponse = response.json();
```

```python
# ❌ BAD: Default to PICO
if not clear:
    return {"detected_framework": "PICO", "confidence": "low"}

# ✅ GOOD: Ask for clarification
if not clear:
    return {"needs_clarification": True, "clarification_questions": [...]}
```

---

## 7. File Checklist

### Phase 1 Files (Create All)

- [ ] `frontend/app/define-v3/types/wizard.types.ts`
- [ ] `frontend/app/define-v3/hooks/useFrameworkConfig.ts`
- [ ] `frontend/app/define-v3/hooks/useWizardState.ts`
- [ ] `frontend/app/define-v3/styles/wizard-theme.css`
- [ ] `frontend/app/define-v3/components/shared/ProgressBar.tsx`
- [ ] `frontend/app/define-v3/components/shared/WizardLayout.tsx`
- [ ] `frontend/app/define-v3/page.tsx` (basic placeholder)

### Phase 2 Files (Create All)

- [ ] `backend/app/core/prompts/v3/__init__.py`
- [ ] `backend/app/core/prompts/v3/detect_framework.py`
- [ ] `backend/app/core/prompts/v3/generate_questions.py`
- [ ] `backend/app/api/routes/define_v3.py`
- [ ] `backend/tests/test_define_v3.py`
- [ ] Update `backend/main.py` (add router)

---

## 8. Success Verification

### Phase 1 Complete When:

```bash
# All pass:
cd frontend && npx tsc --noEmit
cd frontend && npm run dev
# Navigate to localhost:3000/define-v3
# See: Progress bar, split layout, RTL works
```

### Phase 2 Complete When:

```bash
# All pass:
cd backend && python -m pytest tests/test_define_v3.py -v
# Manual test via curl returns valid JSON
# Ambiguous input returns clarification questions
# Clear input returns framework + components
```

---

## END OF SPEC

**Remember:** If something isn't covered here, make a reasonable decision and continue. Don't stop to ask.
