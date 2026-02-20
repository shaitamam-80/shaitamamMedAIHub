# משימה: בניית Define Tool v3 - Research Question Formulation

## רקע
כלי לניסוח שאלות מחקר למחקרים בתחום הבריאות. מיועד לחוקרים וסטודנטים שמתקשים לתרגם רעיון מחקרי לשאלה מובנית.

## קבצי ידע לקריאה
1. `Healthcare_Research_Framework_Analysis_Guide.txt` - מדריך מתודולוגי
2. `PRD-Define-Tool.md` - אפיון קודם (לעיון בלבד)

---

## פרופיל משתמש: "החוקר המוצף"

- סטודנטים ומתמחים ברפואה, סיעוד, פיזיותרפיה, בריאות הציבור
- לחץ גבוה, עומס קוגניטיבי, פחד לפספס ספרות
- צריכים: ולידציה, הנחיה, פשטות

---

## עקרונות UX מנחים

### 1. "Don't Make Me Think"
- שפה פשוטה: "מי האוכלוסייה?" במקום "Population"
- דוגמאות בכל שלב

### 2. Wizard Pattern
- שלבים קטנים, אחד בכל פעם
- Progress indicator ברור

### 3. Immediate Feedback
- Live Preview של השאלה המתגבשת
- עדכון בזמן אמת

### 4. Constructive Errors
- Amber warnings, לא Red errors
- הצעות לשיפור, לא ביקורת

---

## Design System

```css
/* Clinical Blue Palette */
--color-primary: 215 100% 45%;
--color-background: 210 40% 98%;
--color-surface: 0 0% 100%;
--color-foreground: 222 47% 11%;
--color-success: 142 71% 45%;
--color-warning: 38 92% 50%;
--color-destructive: 0 84% 60%;
--color-border: 214 32% 91%;
--color-muted: 210 40% 96%;

/* Dark Mode */
.dark {
  --color-background: 222 47% 11%;
  --color-surface: 217 33% 17%;
  --color-foreground: 210 40% 98%;
}

/* Typography */
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

---

## Layout: Split Screen + Wizard

```
┌────────────────────────────────────────────────────────────────┐
│  Header: Logo + Project Selector + Language Toggle             │
├───────────────────────────────┬────────────────────────────────┤
│   INPUT PANEL (RTL)           │   PREVIEW PANEL (LTR)          │
│                               │                                │
│   [Progress: ●●○○○]           │   📋 מסגרת: PICO               │
│                               │                                │
│   שלב 1: קלט חופשי            │   🧩 רכיבים:                   │
│   ┌─────────────────────┐     │   P: Elderly with depression   │
│   │ ספר לי על מה אתה    │     │   I: Physical exercise         │
│   │ רוצה לחקור...       │     │   C: ___                       │
│   └─────────────────────┘     │   O: ___                       │
│                               │                                │
│   💡 דוגמאות               │   │   📝 שאלה מתגבשת:              │
│                               │   "In elderly patients..."     │
│   [הבא →]                     │                                │
│                               │   📊 FINER: --/25              │
├───────────────────────────────┴────────────────────────────────┤
│  Footer: Save | Export | Help                                  │
└────────────────────────────────────────────────────────────────┘

Mobile: Stack vertically, Preview as floating summary bar
```

---

## User Flow

```
שלב 0: קלט חופשי + זיהוי AI
    │   • משתמש כותב בעברית/אנגלית
    │   • AI מזהה סוג שאלה + מסגרת
    │   • הסבר למה המסגרת מתאימה
    ▼
שלבים 1-N: Wizard דינמי (לפי מסגרת)
    │   • שאלה בשפה פשוטה
    │   • דוגמאות רלוונטיות
    │   • Live Preview מתעדכן
    ▼
שלב N+1: יצירת גרסאות
    │   • Narrow (ממוקד)
    │   • Broad (רחב)
    │   • Clinical (קליני)
    ▼
שלב N+2: הערכת FINER
    │   • ציון 1-5 לכל קריטריון
    │   • המלצות לשיפור
    ▼
שלב אחרון: שמירה וייצוא
```

---

## Framework → Wizard Mapping

| סוג שאלה | מסגרת | שדות |
|----------|-------|------|
| Therapy | PICO | P, I, C, O |
| Diagnosis | PIRD | P, I (Index test), R (Reference), D |
| Etiology | PECO | P, E (Exposure), C, O |
| Prognosis | PFO | P, F (Prognostic factors), O |
| Prevalence | CoCoPop | Co (Condition), Co (Context), Pop |
| Experience | SPIDER | S, PI, D, E, R |
| Policy | ECLIPSE | E, C, L, I, P, S, E |

---

## Data Models

```typescript
interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
  research_questions: ResearchQuestion[];
}

interface ResearchQuestion {
  id: string;
  project_id: string;
  original_input: string;
  input_language: 'he' | 'en';
  detected_type: QuestionType;
  recommended_framework: Framework;
  framework_explanation: string;
  framework_components: Record<string, string>;
  generated_questions: GeneratedQuestion[];
  finer_assessment: FinerAssessment;
  created_at: Date;
}

type QuestionType = 
  'therapy' | 'diagnosis' | 'etiology' | 
  'prognosis' | 'prevalence' | 'experience' | 'policy';

type Framework = 
  'PICO' | 'PICOT' | 'PICOS' | 'PIRD' | 
  'PECO' | 'PEO' | 'PFO' | 'CoCoPop' | 
  'SPIDER' | 'PICo' | 'ECLIPSE' | 'CIMO';

interface GeneratedQuestion {
  scope: 'narrow' | 'broad' | 'clinical';
  text_en: string;
  text_he: string;
}

interface FinerAssessment {
  feasible: { score: number; rationale: string };
  interesting: { score: number; rationale: string };
  novel: { score: number; rationale: string };
  ethical: { score: number; rationale: string };
  relevant: { score: number; rationale: string };
  total_score: number;
  total_percentage: number;
  recommendations: string[];
}

interface FrameworkConfig {
  id: Framework;
  name: string;
  name_he: string;
  components: {
    key: string;
    label_he: string;
    question_he: string;
    examples_he: string[];
    required: boolean;
  }[];
}
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 + TypeScript (App Router) |
| UI | Shadcn UI + Tailwind CSS v4 |
| State | Zustand (client-side form) |
| Backend | FastAPI (Python 3.11) |
| AI | Google Gemini Flash |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (optional) |
| Export | python-docx, reportlab |

---

## Components Structure

```
src/
├── components/
│   ├── ui/                    # shadcn primitives
│   └── features/
│       ├── project-manager/
│       ├── question-wizard/
│       │   ├── WizardContainer.tsx
│       │   ├── FreeInputStep.tsx
│       │   ├── FrameworkDetected.tsx
│       │   ├── DynamicFieldStep.tsx
│       │   ├── QuestionsStep.tsx
│       │   ├── FinerStep.tsx
│       │   └── LivePreview.tsx
│       ├── finer-display/
│       └── export-manager/
```

---

## Development Phases

### Phase 1: MVP
1. [ ] Scaffold: Next.js + Tailwind theme
2. [ ] WizardContainer + FreeInputStep + LivePreview
3. [ ] Gemini integration: זיהוי סוג שאלה
4. [ ] DynamicFieldStep (PICO only)
5. [ ] AI: יצירת 3 גרסאות שאלה
6. [ ] FinerStep + display
7. [ ] RTL/LTR support

### Phase 2: Projects
8. [ ] Supabase schema
9. [ ] API: CRUD endpoints
10. [ ] ProjectManager UI

### Phase 3: All Frameworks
11. [ ] Framework configurations
12. [ ] Framework selector UI
13. [ ] AI prompts per framework

### Phase 4: Export
14. [ ] PDF generation
15. [ ] DOCX generation
16. [ ] JSON export

---

## Interactions

| Component | Trigger | Animation |
|-----------|---------|-----------|
| WizardStep | Mount | fade-in-right |
| LivePreview | Update | pulse (subtle) |
| FinerBar | Score | grow-width |
| CopyBtn | Click | scale → checkmark |
| SkipBtn | Click | amber toast |

---

## Example Flow

**Input:** "אני רוצה לחקור האם פעילות גופנית עוזרת לקשישים עם דיכאון"

**Step 0 Output:**
```
🔍 זיהוי: שאלת יעילות טיפול (Therapy)
📋 מסגרת: PICO

הסבר: יש התערבות ברורה (פעילות גופנית), 
תוצאה למדוד (דיכאון), וניתן להשוות לחלופה.

[המשך עם PICO] [בחר אחרת ▾]
```

**Final Output:**
```
📝 Narrow:
"In adults aged 65+ with major depressive disorder, 
does structured aerobic exercise (≥3x/week) compared 
to antidepressants alone reduce PHQ-9 scores at 12 weeks?"

📝 Broad:
"Does physical activity improve depression outcomes 
in older adults compared to usual care?"

📝 Clinical:
"What is the effectiveness of exercise interventions 
for depression in elderly primary care patients?"

📊 FINER Score: 21/25 (84%)
F: 4/5  I: 5/5  N: 3/5  E: 5/5  R: 4/5

💡 Recommendations:
• Check existing meta-analyses
• Consider narrowing population definition
• Define exercise type specifically
```

---

## Execution Instructions

1. **קרא** את קבצי הידע
2. **הצג** הצעת מבנה + סכמת DB + endpoints
3. **חכה** לאישור
4. **בנה** שלב אחד בכל פעם
5. **בדוק** שעובד לפני להמשיך

**עקרונות:** פשטות, קוד נקי, RTL מההתחלה, responsive design.
