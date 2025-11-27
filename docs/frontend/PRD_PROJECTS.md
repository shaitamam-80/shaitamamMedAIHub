# PRD: מסך ניהול פרויקטים (Projects)

## מידע כללי
| פרט | ערך |
|-----|-----|
| **שם המסך** | Projects Management |
| **נתיב** | `/projects` |
| **קובץ** | `frontend/app/projects/page.tsx` |
| **עדיפות** | P0 - קריטי |
| **סטטוס** | מיושם (v1.0), נדרש עדכון ל-v2.0 |
| **גרסה** | 2.0 |

---

## 1. סקירה כללית

### 1.1 מטרת המסך
מסך ניהול הפרויקטים משמש כנקודת הכניסה המרכזית למערכת. כאן המשתמש יכול ליצור, לצפות ולנהל את כל פרויקטי הסקירה הספרותית שלו.

### 1.2 קהל יעד
- חוקרים רפואיים
- סטודנטים לתארים מתקדמים
- ספרנים רפואיים

### 1.3 ערך עסקי
- נקודת כניסה אחידה לכל הפרויקטים
- ארגון וניהול מחקרים מרובים
- מעקב אחר התקדמות

---

## 2. דרישות פונקציונליות

### 2.1 יכולות ליבה

#### FR-PRJ-001: צפייה ברשימת פרויקטים
| פרט | תיאור |
|-----|-------|
| **תיאור** | הצגת כל הפרויקטים של המשתמש בפריסת Grid |
| **תנאי קדם** | משתמש מחובר למערכת |
| **זרימה** | עמוד נטען → קריאת API → הצגת כרטיסיות |
| **תוצאה** | Grid של כרטיסיות פרויקטים עם מידע בסיסי |

#### FR-PRJ-002: יצירת פרויקט חדש
| פרט | תיאור |
|-----|-------|
| **תיאור** | טופס ליצירת פרויקט חדש עם שם, תיאור ומסגרת מחקרית |
| **שדות** | שם (חובה), תיאור (אופציונלי), סוג מסגרת (ברירת מחדל: PICO) |
| **ולידציה** | שם לא ריק |
| **API** | `POST /api/v1/projects/` |

#### FR-PRJ-003: מעבר לפרויקט
| פרט | תיאור |
|-----|-------|
| **תיאור** | לחיצה על "Open Project" מעבירה למסך Define |
| **ניווט** | `/define?project={project_id}` |

### 2.2 מסגרות מחקר נתמכות

| מסגרת | תיאור |
|-------|-------|
| PICO | Population, Intervention, Comparison, Outcome |
| CoCoPop | Context, Condition, Population |
| PEO | Population, Exposure, Outcome |
| SPIDER | Sample, Phenomenon, Design, Evaluation, Research type |
| SPICE | Setting, Perspective, Intervention, Comparison, Evaluation |
| ECLIPSE | Expectation, Client group, Location, Impact, Professionals, Service |
| FINER | Feasible, Interesting, Novel, Ethical, Relevant |

---

## 3. ממשק משתמש

### 3.1 מבנה המסך

```
┌─────────────────────────────────────────────────────┐
│  Header                                              │
│  ┌─────────────────────────────────┐  ┌───────────┐ │
│  │ Projects                         │  │ + New    │ │
│  │ Manage your systematic reviews   │  │ Project  │ │
│  └─────────────────────────────────┘  └───────────┘ │
├─────────────────────────────────────────────────────┤
│  Create Form (כשפתוח)                               │
│  ┌─────────────────────────────────────────────────┐│
│  │ Project Name *                                   ││
│  │ [________________________]                       ││
│  │                                                  ││
│  │ Description                                      ││
│  │ [________________________]                       ││
│  │                                                  ││
│  │ Research Framework                               ││
│  │ [PICO ▼]                                         ││
│  │                                                  ││
│  │ [Create Project] [Cancel]                        ││
│  └─────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────┤
│  Projects Grid (3 columns on desktop)               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ 📁 PICO  │  │ 📁 CoCo  │  │ 📁 PEO   │          │
│  │ Study A  │  │ Study B  │  │ Study C  │          │
│  │ Desc...  │  │ Desc...  │  │ Desc...  │          │
│  │ Created  │  │ Created  │  │ Created  │          │
│  │[Open]    │  │[Open]    │  │[Open]    │          │
│  └──────────┘  └──────────┘  └──────────┘          │
└─────────────────────────────────────────────────────┘
```

### 3.2 מצבי ממשק

| מצב | תיאור | עיצוב |
|-----|-------|-------|
| **Empty State** | אין פרויקטים | אייקון תיקייה + הודעה מזמינה |
| **Loading** | טוען פרויקטים | - |
| **Grid View** | יש פרויקטים | Grid רספונסיבי 1-3 עמודות |
| **Create Form Open** | טופס יצירה | Card מעל ה-Grid |

### 3.3 כרטיסיית פרויקט

```
┌─────────────────────────────────────┐
│  📁  [PICO badge]                   │
│                                     │
│  Project Name                       │
│  Description text that may be       │
│  truncated after two lines...       │
│                                     │
│  Created: Dec 15, 2024              │
│                                     │
│  [────────Open Project────────]     │
└─────────────────────────────────────┘
```

---

## 4. ממשקי API

### 4.1 קריאות נדרשות

| פעולה | Method | Endpoint | Payload |
|-------|--------|----------|---------|
| רשימת פרויקטים | GET | `/api/v1/projects/` | - |
| יצירת פרויקט | POST | `/api/v1/projects/` | `{name, description?, framework_type?}` |

### 4.2 מבנה תגובה - פרויקט

```typescript
interface Project {
  id: string;
  name: string;
  description?: string;
  framework_type?: string;
  framework_data?: Record<string, string>;
  created_at: string;
  updated_at: string;
  user_id?: string;
}
```

---

## 5. חוקי עסקים

### BR-PRJ-001: שיוך פרויקטים למשתמש
- כל פרויקט משויך למשתמש שיצר אותו
- משתמש רואה רק את הפרויקטים שלו
- Row Level Security מוודא הפרדה בין משתמשים

### BR-PRJ-002: ברירת מחדל למסגרת
- אם לא נבחרה מסגרת, ברירת המחדל היא PICO
- ניתן לשנות את המסגרת לאחר יצירה (במסך Define)

### BR-PRJ-003: מחיקת פרויקט (Cascade Delete) - עודכן v2.0
מחיקת פרויקט מפעילה מחיקת עומק (Cascade Delete) של כל הנתונים המשויכים לפרויקט.

#### 5.3.1 רשימת ישויות הנמחקות אוטומטית

| טבלה | תיאור | Foreign Key |
|------|-------|-------------|
| `chat_messages` | כל הודעות הצ'אט מכלי Define | `project_id` |
| `files` | קבצי MEDLINE שהועלו | `project_id` |
| `abstracts` | אבסטרקטים שנותחו מהקבצים | `project_id` |
| `query_strings` | שאילתות PubMed שנוצרו | `project_id` |
| `analysis_runs` | ריצות ניתוח AI (Batch Screening) | `project_id` |

#### 5.3.2 זרימת מחיקה

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DELETE PROJECT (project_id)                       │
└─────────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│ chat_messages │      │    files      │      │ query_strings │
│   (Define)    │      │   (Review)    │      │    (Query)    │
└───────────────┘      └───────┬───────┘      └───────────────┘
                               │
                               ▼
                      ┌───────────────┐
                      │   abstracts   │
                      │   (Review)    │
                      └───────┬───────┘
                               │
                               ▼
                      ┌───────────────┐
                      │ analysis_runs │
                      │   (Review)    │
                      └───────────────┘
```

#### 5.3.3 חוקי Data Integrity

| כלל | תיאור |
|-----|-------|
| **DI-001** | מחיקת פרויקט מוחקת את **כל** השאילתות שנשמרו תחתיו |
| **DI-002** | מחיקת פרויקט מוחקת את **כל** הסינונים (screenings) שבוצעו |
| **DI-003** | מחיקת קובץ מוחקת את כל האבסטרקטים שנותחו ממנו |
| **DI-004** | לא ניתן למחוק פרויקט עם analysis_run פעיל (status='running') |
| **DI-005** | מחיקה היא **בלתי הפיכה** - יש להציג אזהרה למשתמש |

#### 5.3.4 דיאלוג אישור מחיקה (UX)

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️  Delete Project                                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Are you sure you want to delete "Project Name"?            │
│                                                              │
│  This action will permanently delete:                       │
│  • All chat messages (12 messages)                          │
│  • All uploaded files (3 files)                             │
│  • All abstracts (245 abstracts)                            │
│  • All saved queries (5 queries)                            │
│  • All screening decisions                                  │
│                                                              │
│  This action cannot be undone.                              │
│                                                              │
│  Type "DELETE" to confirm:                                  │
│  [________________________]                                  │
│                                                              │
│           [Cancel]  [Delete Project]                        │
│                     (disabled until "DELETE" typed)         │
└─────────────────────────────────────────────────────────────┘
```

#### 5.3.5 API למחיקה

```typescript
// DELETE /api/v1/projects/{project_id}
interface DeleteProjectResponse {
  success: boolean;
  deleted_counts: {
    chat_messages: number;
    files: number;
    abstracts: number;
    query_strings: number;
    analysis_runs: number;
  };
}
```

### BR-PRJ-004: בדיקת תקינות לפני מחיקה (v2.0)

| בדיקה | תנאי | פעולה |
|-------|------|-------|
| Analysis Running | `analysis_runs.status = 'running'` | חסום מחיקה + הודעה |
| File Processing | `files.status = 'processing'` | חסום מחיקה + הודעה |

---

## 6. משימות פיתוח

### 6.1 משימות קיימות (מיושמות)
- [x] קומפוננטת עמוד Projects
- [x] טופס יצירת פרויקט
- [x] Grid להצגת פרויקטים
- [x] כרטיסיית פרויקט בודד
- [x] Empty State
- [x] קריאות API בסיסיות

### 6.2 משימות v2.0 (עדיפות גבוהה - Cascade Delete)

- [ ] **PRJ-T001**: מימוש מחיקת פרויקט עם Cascade Delete
- [ ] **PRJ-T008**: יצירת דיאלוג אישור מחיקה עם הקלדת "DELETE"
- [ ] **PRJ-T009**: הצגת ספירת ישויות שיימחקו בדיאלוג
- [ ] **PRJ-T010**: מימוש API endpoint למחיקה עם החזרת deleted_counts
- [ ] **PRJ-T011**: חסימת מחיקה כשיש analysis_run פעיל
- [ ] **PRJ-T012**: חסימת מחיקה כשיש file בסטטוס processing

### 6.3 משימות להשלמה

- [ ] **PRJ-T002**: הוספת אפשרות עריכת שם ותיאור
- [ ] **PRJ-T003**: הוספת חיפוש ופילטור
- [ ] **PRJ-T004**: הוספת מיון (לפי תאריך, שם, מסגרת)
- [ ] **PRJ-T005**: הוספת Pagination לרשימות גדולות
- [ ] **PRJ-T006**: הוספת מצב טעינה (Skeleton)
- [ ] **PRJ-T007**: הוספת אינדיקטור התקדמות בכרטיסייה

---

## 7. מדדי הצלחה

| מדד | יעד | אופן מדידה |
|-----|-----|-----------|
| זמן יצירת פרויקט | < 3 שניות | מרגע Submit עד הופעת הפרויקט |
| זמן טעינת עמוד | < 1 שנייה | עם 20 פרויקטים |
| שיעור שגיאות | < 1% | שגיאות API |

---

## 8. תלויות

### 8.1 תלויות טכניות
- Supabase Auth לאימות משתמש
- Backend API פעיל
- חיבור לבסיס נתונים

### 8.2 תלויות עסקיות
- הגדרת מסגרות מחקר (FRAMEWORK_SCHEMAS בבקאנד)

---

## 9. היסטוריית גרסאות

| גרסה | תאריך | שינויים |
|------|-------|---------|
| 1.0 | 2024-12 | גרסה ראשונית |
| 2.0 | 2024-12 | הוספת תיעוד Cascade Delete מפורט, חוקי Data Integrity, דיאלוג אישור מחיקה |

