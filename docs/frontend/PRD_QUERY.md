# PRD: מסך יצירת שאילתות חיפוש (Query)

## מידע כללי
| פרט | ערך |
|-----|-----|
| **שם המסך** | PubMed Query Generator |
| **נתיב** | `/query` |
| **קובץ** | `frontend/app/query/page.tsx` |
| **עדיפות** | P0 - קריטי |
| **סטטוס** | מיושם (v1.0), נדרש עדכון ל-v2.0 |
| **גרסה** | 2.0 |

---

## 1. סקירה כללית

### 1.1 מטרת המסך
מסך Query ממיר את נתוני המסגרת המחקרית לשאילתות חיפוש מותאמות ל-PubMed. הכלי מייצר שלוש אסטרטגיות חיפוש ברמות שונות של רגישות וספציפיות, עם תמיכה ב-Proximity Search ו-Methodological Hedges.

### 1.2 ערך ייחודי
- **יצירה אוטומטית**: AI מתרגם מסגרת מחקרית לשאילתות בוליאניות
- **שלוש אסטרטגיות**: Broad, Focused, Methodological Filtered
- **Proximity Search**: תחביר PubMed מתקדם לקרבה בין מונחים
- **Methodological Hedges**: פילטרים מתוקפים מ-Cochrane, SIGN, Wong
- **ניתוח מושגים**: פירוט מונחי Free-text ו-MeSH לכל רכיב
- **לוגיקה תלוית-מסגרת**: בחירת Hedge אוטומטית לפי סוג המסגרת

### 1.3 קהל יעד
- חוקרים שמחפשים מאמרים ב-PubMed
- ספרנים רפואיים
- מחברי סקירות שיטתיות

---

## 2. דרישות פונקציונליות

### 2.1 יכולות ליבה

#### FR-QRY-001: יצירת שאילתות
| פרט | תיאור |
|-----|-------|
| **תיאור** | לחיצה על "Generate Query" מייצרת שאילתות מנתוני המסגרת |
| **תנאי קדם** | פרויקט עם framework_data מוגדר |
| **תוצאה** | 3 שאילתות + ניתוח מושגים + Hedges Toolbox |
| **API** | `POST /api/v1/query/generate` |

#### FR-QRY-002: ניתוח מושגים (Concept Analysis)
| פרט | תיאור |
|-----|-------|
| **תיאור** | פירוט כל רכיב מסגרת למונחי חיפוש |
| **תוכן** | Free-text terms + MeSH terms (regular + exploded) |
| **תצוגה** | Badges צבעוניות לפי סוג מונח |
| **חדש v2.0** | שליטה ב-Proximity לכל Concept |

#### FR-QRY-003: שלוש אסטרטגיות חיפוש (v2.0)
| אסטרטגיה | רגישות | ספציפיות | שימוש | בניה |
|----------|---------|----------|-------|------|
| **Broad** | מקסימלית | נמוכה | סקירה מקיפה, לא מפספסים | MeSH Exploded + Text Words [tw] |
| **Focused** | בינונית | מקסימלית | דיוק מקסימלי | Major MeSH [Majr] + Title [ti] + Proximity |
| **Methodological** | לפי Hedge | לפי Hedge | לפי סוג מחקר | Broad + Validated Hedge Filter |

#### FR-QRY-004: Proximity Search (חדש v2.0)
| פרט | תיאור |
|-----|-------|
| **תיאור** | חיפוש מונחים בקרבה זה לזה |
| **תחביר PubMed** | `"term1 term2"[tiab:~N]` כאשר N = מרחק מילים |
| **ברירת מחדל** | N=3 (ניתן לשינוי) |
| **שימוש** | אסטרטגיית Focused בלבד |
| **ממשק** | Slider/Input לשליטה במרחק לכל Concept |

#### FR-QRY-005: העתקה ללוח
| פרט | תיאור |
|-----|-------|
| **תיאור** | כפתור Copy לכל שאילתה |
| **פעולה** | העתקה ללוח + Toast אישור |
| **שימוש** | הדבקה ישירה ב-PubMed |

#### FR-QRY-006: Methodological Hedges Toolbox (v2.0)
| פרט | תיאור |
|-----|-------|
| **תיאור** | פילטרים מתודולוגיים מתוקפים |
| **סוגים** | Therapy (RCT), Qualitative, Etiology, Prognosis, Diagnosis |
| **מקור** | Cochrane, Wong, SIGN, Haynes |
| **בחירה אוטומטית** | לפי סוג המסגרת (ראה BR-QRY-005) |

#### FR-QRY-007: המלצות AI
| פרט | תיאור |
|-----|-------|
| **תיאור** | ניתוח וטיפים מ-AI על השאילתות שנוצרו |
| **תצוגה** | Markdown formatted |
| **תוכן** | נקודות לתשומת לב, הצעות לשיפור, המלצת Hedge |

---

## 3. ממשק משתמש

### 3.1 מבנה המסך (v2.0)

```
┌────────────────────────────────────────────────────────────────────┐
│  Header                                                             │
│  ┌────────────────────────────────────┐  ┌───────────────────────┐ │
│  │ PubMed Query Generator v2.0        │  │ ✨ Generate Query     │ │
│  │ Advanced search with Proximity     │  └───────────────────────┘ │
│  └────────────────────────────────────┘                            │
├────────────────────────────────────────────────────────────────────┤
│  Project Selector                                                   │
│  [Select Project ▼]  Framework: [PICO] ← Auto Hedge: Therapy       │
├───────────────────────┬────────────────────────────────────────────┤
│  LEFT (30%)           │  RIGHT (70%)                                │
│  Concept Analysis     │                                             │
│                       │  Analysis & Recommendations                 │
│  ┌─────────────────┐  │  ┌────────────────────────────────────────┐ │
│  │ Concept 1: P    │  │  │ ## AI Analysis                         │ │
│  │ ┌─────────────┐ │  │  │ - Recommended Hedge: Cochrane RCT      │ │
│  │ │ diabetes   │ │  │  │ - Consider Proximity for Population    │ │
│  │ └─────────────┘ │  │  └────────────────────────────────────────┘ │
│  │ MeSH:           │  │                                             │
│  │ ┌─────────────┐ │  │  Query Strategies                          │
│  │ │ Diabetes   │ │  │  ┌────────────────────────────────────────┐ │
│  │ │ Mellitus   │ │  │  │ [Broad] [Focused] [Methodological]     │ │
│  │ └─────────────┘ │  │  ├────────────────────────────────────────┤ │
│  │                 │  │  │                                        │ │
│  │ Proximity: [3▼] │  │  │ "elderly diabetes"[tiab:~3] OR        │ │
│  └─────────────────┘  │  │ aged[ti] OR geriatric[ti]              │ │
│                       │  │ AND "metformin treatment"[tiab:~3]      │ │
│  ┌─────────────────┐  │  │ AND mortality[ti]                      │ │
│  │ Concept 2: I    │  │  │                             [📋 Copy]  │ │
│  │ ...             │  │  └────────────────────────────────────────┘ │
│  │ Proximity: [3▼] │  │                                             │
│  └─────────────────┘  │  Methodological Hedges                      │
│                       │  ┌────────────────────────────────────────┐ │
│  ┌─────────────────┐  │  │ [✓ Cochrane RCT] [SIGN Etiology]       │ │
│  │ Concept 3: C    │  │  │ [Wong Qualitative] [Haynes Diagnosis]  │ │
│  │ ...             │  │  │ [Haynes Prognosis]                     │ │
│  │ Proximity: [3▼] │  │  │                                        │ │
│  └─────────────────┘  │  │ Basic Filters:                         │ │
│                       │  │ [Humans] [English] [Last 5 Years]      │ │
│                       │  └────────────────────────────────────────┘ │
└───────────────────────┴────────────────────────────────────────────┘
```

### 3.2 מצבי ממשק

| מצב | תיאור | תצוגה |
|-----|-------|-------|
| **Empty State** | לא נוצרה שאילתה | הסבר + CTA |
| **Loading** | מייצר שאילתות | Spinner + "Generating..." |
| **Results** | תוצאות מוכנות | Layout מלא |
| **Error** | שגיאה ביצירה | Toast עם הודעה |

### 3.3 Concept Card (v2.0)

```
┌───────────────────────────────────────┐
│ Concept 1: Population                 │
├───────────────────────────────────────┤
│ Free-text terms:                      │
│ [elderly] [aged] [geriatric] [older]  │
│                                       │
│ MeSH terms:                           │
│ [Aged] [Frail Elderly] [Aged, 80+]    │
│                                       │
│ Major MeSH (for Focused):             │
│ [Aged[Majr]]                          │
├───────────────────────────────────────┤
│ Proximity Distance:  [◀ 3 ▶]          │
│ Preview: "elderly diabetes"[tiab:~3]  │
└───────────────────────────────────────┘
```

### 3.4 Query Tabs (v2.0)

```
┌───────────────────────────────────────────────────────┐
│ [Broad] [Focused•] [Methodological]                   │
├───────────────────────────────────────────────────────┤
│ FOCUSED: Maximum precision using Title fields,        │
│ Major MeSH, and Proximity search.                     │
├───────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐   │
│ │ ("elderly diabetes"[tiab:~3] OR Aged[Majr])     │   │
│ │ AND ("metformin treatment"[tiab:~3] OR          │   │
│ │      Metformin[Majr])                           │   │
│ │ AND (mortality[ti] OR Mortality[Majr])          │ 📋│
│ └─────────────────────────────────────────────────┘   │
│                                                       │
│ Estimated results: ~1,250 (via PubMed API)           │
└───────────────────────────────────────────────────────┘
```

---

## 4. זרימת משתמש

### 4.1 זרימה ראשית

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ בחירת פרויקט     │ ──▶ │ לחיצה Generate   │ ──▶ │ המתנה לעיבוד    │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                                                        │
                                                        ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ הדבקה ב-PubMed  │ ◀── │ העתקת שאילתה    │ ◀── │ כיוונון Proximity│
└──────────────────┘     └──────────────────┘     │ ובחירת Hedge     │
                                                  └──────────────────┘
```

### 4.2 תרחישים

#### תרחיש 1: יצירת שאילתה עם Proximity
1. משתמש נכנס לעמוד Query
2. בוחר פרויקט (PICO - Therapy)
3. לוחץ "Generate Query"
4. מקבל 3 אסטרטגיות + Cochrane RCT מסומן אוטומטית
5. בוחר "Focused"
6. מכוונן Proximity ל-5 עבור Population
7. לוחץ Copy
8. עובר ל-PubMed ומדביק

#### תרחיש 2: שימוש ב-Methodological Hedge
1. אחרי יצירת שאילתה
2. בוחר אסטרטגיית "Methodological"
3. רואה Cochrane RCT Hedge מופעל אוטומטית
4. מחליף ל-Wong Qualitative (אם מתאים)
5. העתקה והדבקה ב-PubMed

#### תרחיש 3: מחקר איכותני (SPIDER)
1. משתמש בפרויקט עם מסגרת SPIDER
2. לוחץ Generate
3. מערכת מזהה ומציעה Wong Qualitative Filter
4. אסטרטגיית Methodological כוללת אותו אוטומטית

---

## 5. ממשקי API

### 5.1 קריאות נדרשות

| פעולה | Method | Endpoint | תיאור |
|-------|--------|----------|-------|
| יצירת שאילתה | POST | `/api/v1/query/generate` | מייצר שאילתות מ-framework_data |
| היסטוריה | GET | `/api/v1/query/history/{project_id}` | שאילתות קודמות |
| אומדן תוצאות | GET | `/api/v1/query/estimate` | בדיקת כמות תוצאות צפויה |

### 5.2 מבנה בקשה (v2.0)

```typescript
interface QueryGenerateRequest {
  project_id: string;
  framework_data?: Record<string, any>;
  proximity_settings?: Record<string, number>;  // חדש: מרחק Proximity לכל concept
  selected_hedge?: string;  // חדש: override ל-Hedge אוטומטי
}
```

### 5.3 מבנה תגובה (v2.0)

```typescript
interface QueryGenerateResponse {
  message: string;  // AI analysis in Markdown
  concepts: ConceptAnalysis[];
  queries: {
    broad: string;
    focused: string;
    methodological: string;  // שונה מ-clinical_filtered
  };
  hedges: {
    recommended: string;  // Hedge מומלץ לפי המסגרת
    available: HedgeInfo[];
  };
  toolbox: {
    label: string;
    query: string;
    type: 'hedge' | 'filter';  // חדש: סוג הפילטר
  }[];
  framework_type: string;
  framework_data: Record<string, any>;
}

interface ConceptAnalysis {
  concept_number: number;
  component: string;
  free_text_terms: string[];
  mesh_terms: string[];
  major_mesh_terms: string[];  // חדש: MeSH עם [Majr]
  proximity_default: number;  // חדש: ברירת מחדל ל-Proximity
}

interface HedgeInfo {
  id: string;
  name: string;
  source: string;  // Cochrane, SIGN, Wong, Haynes
  type: string;  // therapy, qualitative, etiology, prognosis, diagnosis
  query: string;  // מחרוזת הפילטר המלאה
}
```

---

## 6. לוגיקה עסקית

### BR-QRY-001: דרישות מינימום
- פרויקט חייב להכיל לפחות 2 שדות מלאים ב-framework_data
- אם אין מספיק נתונים, מוצגת הודעת שגיאה

### BR-QRY-002: בניית שאילתות (v2.0)
- כל concept מחובר ב-AND
- מונחים בתוך concept מחוברים ב-OR
- **Broad**: MeSH[MeSH Terms] + text[tw]
- **Focused**: MeSH[Majr] + title[ti] + Proximity[tiab:~N]
- **Methodological**: Broad + Selected Hedge

### BR-QRY-003: Proximity Syntax
- תחביר PubMed: `"term1 term2"[tiab:~N]`
- N = מספר מילים מקסימלי בין המונחים
- ברירת מחדל: N=3
- טווח: 1-10
- לא תומך ב-wildcards בתוך proximity

### BR-QRY-004: Hedge Selection Logic
- הפילטרים נקבעים לפי סוג המסגרת
- תמיד כוללים פילטרים בסיסיים (Humans, English)

### BR-QRY-005: Framework-to-Hedge Mapping (חדש)
| Framework | Recommended Hedge | Rationale |
|-----------|-------------------|-----------|
| PICO | Cochrane Therapy (RCT) | Interventional studies |
| PEO | SIGN Etiology | Exposure-outcome studies |
| SPIDER | Wong Qualitative | Qualitative research |
| CoCoPop | Cochrane Therapy | Prevalence/intervention |
| SPICE | Wong Qualitative | Service evaluation |
| ECLIPSE | Wong Qualitative | Expectation studies |
| FINER | Haynes Prognosis | Feasibility research |

### BR-QRY-006: Strategy Definitions (v2.0)

#### Broad Strategy
```
Purpose: Maximum sensitivity, capture everything relevant
Build:
  - MeSH terms with explosion (default)
  - Text Word [tw] field (searches all text fields)
  - Truncation with * for variants
  - No Proximity
Result: High recall, lower precision
```

#### Focused Strategy
```
Purpose: Maximum precision, highly relevant results
Build:
  - Major MeSH [Majr] only
  - Title field [ti] only
  - Proximity search [tiab:~N]
  - No explosion
Result: High precision, moderate recall
```

#### Methodological Strategy
```
Purpose: Evidence-based filtering by study type
Build:
  - Broad strategy base
  - + Validated methodological hedge
  - Hedge selected by framework type
Result: Balanced based on hedge type
```

---

## 7. נספח A: ספריית Methodological Hedges

### 7.1 Cochrane Highly Sensitive Search Strategy for RCTs (Therapy)

```
((randomized controlled trial[pt]) OR (controlled clinical trial[pt])
OR (randomized[tiab]) OR (placebo[tiab]) OR (drug therapy[sh])
OR (randomly[tiab]) OR (trial[tiab]) OR (groups[tiab]))
NOT (animals[mh] NOT humans[mh])
```

**מקור**: Cochrane Handbook, Chapter 6
**שימוש**: PICO, CoCoPop (interventional)

### 7.2 Wong Qualitative Research Filter

```
((qualitative[tiab]) OR (interview*[tiab]) OR (focus group*[tiab])
OR (ethnograph*[tiab]) OR (phenomenolog*[tiab]) OR (grounded theory[tiab])
OR (narrative*[tiab]) OR (thematic analysis[tiab]) OR (content analysis[tiab])
OR (Qualitative Research[mh]))
```

**מקור**: Wong SS et al., 2004 (BMC Medical Research Methodology)
**שימוש**: SPIDER, SPICE, ECLIPSE

### 7.3 SIGN Etiology/Harm Filter

```
((cohort studies[mh]) OR (cohort[tiab]) OR (case-control studies[mh])
OR (case-control[tiab]) OR (cross-sectional studies[mh])
OR (risk[tiab]) OR (odds ratio[tiab]) OR (relative risk[tiab])
OR (hazard ratio[tiab]) OR (exposure[tiab]))
```

**מקור**: Scottish Intercollegiate Guidelines Network (SIGN)
**שימוש**: PEO (exposure studies)

### 7.4 Haynes Clinical Prediction/Prognosis Filter

```
((prognos*[tiab]) OR (predict*[tiab]) OR (course[tiab]) OR (survival analysis[mh])
OR (disease progression[mh]) OR (cohort studies[mh]) OR (follow-up studies[mh])
OR (longitudinal studies[mh]) OR (prospective studies[mh]))
```

**מקור**: Haynes RB et al., ACP Journal Club
**שימוש**: FINER, prognostic studies

### 7.5 Haynes Diagnosis Filter

```
((sensitivity and specificity[mh]) OR (sensitivity[tiab]) OR (specificity[tiab])
OR (predictive value*[tiab]) OR (accuracy[tiab]) OR (diagnostic test*[tiab])
OR (ROC curve[mh]) OR (likelihood ratio*[tiab]))
```

**מקור**: Haynes RB et al., ACP Journal Club
**שימוש**: Diagnostic accuracy studies

---

## 8. משימות פיתוח

### 8.1 משימות קיימות (מיושמות)
- [x] Project selector
- [x] Generate Query button
- [x] Concept Analysis display
- [x] Three strategy tabs
- [x] Copy to clipboard
- [x] Toolbox filters
- [x] AI recommendations display
- [x] Markdown rendering
- [x] Loading state
- [x] Toast notifications

### 8.2 משימות v2.0 (עדיפות גבוהה)
- [ ] **QRY-T010**: עדכון לוגיקת שאילתות לתחביר Proximity `[tiab:~N]`
- [ ] **QRY-T011**: הוספת Proximity slider/input לכל Concept Card
- [ ] **QRY-T012**: הטמעת Hedge Library (5 סוגי פילטרים)
- [ ] **QRY-T013**: מיפוי Framework-to-Hedge אוטומטי
- [ ] **QRY-T014**: עדכון API לתמוך ב-proximity_settings ו-selected_hedge
- [ ] **QRY-T015**: עדכון אסטרטגיית Focused עם Major MeSH + Title + Proximity
- [ ] **QRY-T016**: עדכון אסטרטגיית Methodological (במקום Clinical Filtered)
- [ ] **QRY-T017**: הצגת Hedge מומלץ בהתאם למסגרת
- [ ] **QRY-T018**: יכולת override ל-Hedge ידנית

### 8.3 משימות נוספות
- [ ] **QRY-T001**: הוספת היסטוריית שאילתות בעמוד
- [ ] **QRY-T002**: הוספת Edit Query ידני
- [ ] **QRY-T003**: הוספת Export לקובץ (TXT, CSV)
- [ ] **QRY-T004**: הוספת "Test in PubMed" - פתיחה ישירה
- [ ] **QRY-T005**: הוספת Compare Strategies side-by-side
- [ ] **QRY-T006**: הוספת Syntax highlighting לשאילתות
- [ ] **QRY-T007**: הוספת שמירת Favorites ב-Toolbox
- [ ] **QRY-T008**: הוספת תמיכה ב-OVID ו-Cochrane syntax
- [ ] **QRY-T009**: הוספת אומדן תוצאות (via PubMed API)

---

## 9. מדדי הצלחה

| מדד | יעד | אופן מדידה |
|-----|-----|-----------|
| זמן יצירת שאילתה | < 5 שניות | מ-Generate עד תוצאות |
| שיעור שימוש ב-Copy | > 90% | Analytics על כפתור Copy |
| שביעות רצון מהשאילתות | > 4/5 | סקר משתמשים |
| שימוש ב-Proximity | > 50% | Analytics |
| שימוש ב-Hedge המומלץ | > 70% | Analytics |

---

## 10. טיפול בשגיאות

| שגיאה | סיבה | טיפול |
|-------|------|-------|
| "No framework data" | פרויקט ריק | הפניה למסך Define |
| "Generation failed" | שגיאת AI | Toast + אפשרות Retry |
| "Rate limit exceeded" | יותר מדי בקשות | Cooldown 60 שניות |
| "Invalid proximity value" | N מחוץ לטווח | Reset לברירת מחדל (3) |
| "Hedge not found" | Hedge לא קיים | השתמש ב-Cochrane כברירת מחדל |

---

## 11. היסטוריית גרסאות

| גרסה | תאריך | שינויים |
|------|-------|---------|
| 1.0 | 2024-12 | גרסה ראשונית עם 3 אסטרטגיות |
| 2.0 | 2024-12 | Proximity Search, Methodological Hedges, Framework-to-Hedge mapping |

