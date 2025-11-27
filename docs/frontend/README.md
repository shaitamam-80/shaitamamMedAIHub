# MedAI Hub - תיעוד Frontend

## סקירה כללית

תיקייה זו מכילה את מסמכי ה-PRD (Product Requirements Document) לכל מסכי הפרונטנד של מערכת MedAI Hub.

---

## מפת המסכים

```
┌────────────────────────────────────────────────────────────────────┐
│                         MedAI Hub                                   │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Authentication Flow                                                │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                      │
│  │  Login   │───▶│ Register │───▶│ Callback │                      │
│  └──────────┘    └──────────┘    └──────────┘                      │
│       │                                │                            │
│       ▼                                ▼                            │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                         Home (/)                            │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │    │
│  │  │ Define  │  │  Query  │  │ Review  │  │Projects │        │    │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │    │
│  └────────────────────────────────────────────────────────────┘    │
│       │              │              │              │                │
│       ▼              ▼              ▼              ▼                │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐          │
│  │ Define  │    │  Query  │    │ Review  │    │Projects │          │
│  │ Screen  │    │ Screen  │    │ Screen  │    │ Screen  │          │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘          │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

---

## מסמכי PRD

| מסך | קובץ | עדיפות | סטטוס |
|-----|------|--------|-------|
| [דף הבית](PRD_HOME.md) | `/` | P1 | מיושם |
| [אימות](PRD_AUTH.md) | `/auth/*` | P0 | מיושם |
| [פרויקטים](PRD_PROJECTS.md) | `/projects` | P0 | מיושם |
| [הגדרת מחקר](PRD_DEFINE.md) | `/define` | P0 | מיושם |
| [יצירת שאילתות](PRD_QUERY.md) | `/query` | P0 | מיושם |
| [סקירת אבסטרקטים](PRD_REVIEW.md) | `/review` | P0 | מיושם |

---

## סיכום משימות לפיתוח

### עדיפות גבוהה (P0)

| ID | משימה | מסך |
|----|-------|-----|
| AUTH-T001 | Forgot Password flow | Auth |
| PRJ-T001 | מחיקת פרויקט | Projects |
| REV-T001 | Export ל-CSV | Review |
| QRY-T004 | Test in PubMed (פתיחה ישירה) | Query |

### עדיפות בינונית (P1)

| ID | משימה | מסך |
|----|-------|-----|
| DEF-T003 | Suggested Prompts | Define |
| DEF-T009 | Keyboard shortcuts | Define |
| REV-T005 | Keyboard navigation | Review |
| REV-T009 | PubMed link לכל PMID | Review |
| HOME-T001 | Desktop header/navbar | Home |

### עדיפות נמוכה (P2)

| ID | משימה | מסך |
|----|-------|-----|
| AUTH-T007 | 2FA | Auth |
| DEF-T004 | Voice Input | Define |
| DEF-T006 | Real-time collaboration | Define |
| QRY-T008 | OVID/Cochrane syntax | Query |
| REV-T007 | Conflict resolution | Review |
| REV-T008 | PRISMA flow diagram | Review |

---

## ארכיטקטורת Frontend

### טכנולוגיות

| טכנולוגיה | שימוש |
|-----------|-------|
| Next.js 15 | Framework (App Router) |
| TypeScript | שפה |
| Tailwind CSS | Styling |
| Shadcn/ui | Component Library |
| React | UI Library |
| Supabase SSR | Authentication |

### מבנה תיקיות

```
frontend/
├── app/                    # Next.js App Router
│   ├── auth/
│   │   ├── login/
│   │   ├── register/
│   │   └── callback/
│   ├── define/
│   ├── query/
│   ├── review/
│   ├── projects/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                 # Shadcn components
│   └── sidebar/
├── contexts/
│   └── auth-context.tsx
├── lib/
│   ├── api.ts              # API Client
│   └── utils.ts            # Utilities
└── public/
```

### State Management

| סוג | פתרון |
|-----|-------|
| Auth State | React Context (AuthContext) |
| Local State | React useState/useEffect |
| API State | Direct fetch (no caching library) |
| Form State | React controlled components |

### API Communication

| Service | Method |
|---------|--------|
| Backend API | REST via `lib/api.ts` |
| Authentication | Supabase Client |
| Real-time | Polling (planned: WebSocket) |

---

## Design System

### צבעים

| שם | CSS Variable | שימוש |
|----|--------------|-------|
| Primary | `--primary` | Actions, links, focus |
| Background | `--background` | Page background |
| Card | `--card` | Card surfaces |
| Muted | `--muted` | Secondary text |
| Border | `--border` | Separators |

### Typography

| Element | Class |
|---------|-------|
| H1 | `font-display text-3xl font-bold` |
| H2 | `font-display text-xl font-bold` |
| Body | `text-base font-normal` |
| Small | `text-sm text-muted-foreground` |

### Spacing

| Size | Value | Usage |
|------|-------|-------|
| xs | 4px | Inline elements |
| sm | 8px | Compact spacing |
| md | 16px | Standard spacing |
| lg | 24px | Section spacing |
| xl | 32px | Large sections |

---

## QA Checklist

### כל מסך חדש

- [ ] רספונסיבי (Mobile, Tablet, Desktop)
- [ ] Loading states
- [ ] Error handling עם Toast
- [ ] Empty states
- [ ] RTL support (אם רלוונטי)
- [ ] Keyboard navigation
- [ ] Authentication check
- [ ] API error handling

### לפני Production

- [ ] בדיקות ידניות על כל המסכים
- [ ] בדיקת ביצועים (Lighthouse)
- [ ] בדיקת נגישות
- [ ] בדיקת Security headers
- [ ] בדיקת SEO (meta tags)

---

## קשרים בין מסכים

```
┌─────────────┐          ┌─────────────┐
│   Login     │────────▶│  Projects   │
└─────────────┘          └─────────────┘
                              │
                              ▼
                        ┌─────────────┐
                        │   Define    │──────┐
                        └─────────────┘      │
                              │              │
                              ▼              │ framework_data
                        ┌─────────────┐      │
                        │    Query    │◀─────┘
                        └─────────────┘
                              │
                              │ search results
                              ▼
                        ┌─────────────┐
                        │   Review    │
                        └─────────────┘
```

---

## היסטוריית עדכונים

| תאריך | עדכון |
|-------|-------|
| 2024-12 | יצירת מסמכי PRD ראשוניים |

