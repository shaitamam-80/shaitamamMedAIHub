# Framework Configurations - Define Tool v3.0 MVP

**Scope:** 3 frameworks only (PICO, PECO, SPIDER)
**Coverage:** ~80% of health research questions

---

## 1. PICO - Therapy/Intervention Questions

### Meta
- **Full Name:** Population, Intervention, Comparison, Outcome
- **Use Case:** Assessing effectiveness of therapies, treatments, interventions
- **Question Type:** `therapy`
- **Prevalence:** ~60% of clinical research questions

### Components

| Key | Label (HE) | Label (EN) | Question (HE) | Required | Example |
|-----|------------|------------|---------------|----------|---------|
| P | אוכלוסייה | Population | מי האוכלוסייה שלך? | ✅ | קשישים מעל גיל 65 עם דיכאון |
| I | התערבות | Intervention | מה הטיפול או ההתערבות? | ✅ | פעילות גופנית אירובית 3 פעמים בשבוע |
| C | השוואה | Comparison | למה אתה משווה? | ❌ | טיפול סטנדרטי / ללא התערבות |
| O | תוצאה | Outcome | מה התוצאה שאתה מודד? | ✅ | חומרת הדיכאון (PHQ-9) |

### Detection Triggers

**Keywords (EN):**
- therapy, treatment, intervention, effectiveness, efficacy
- does X work, does X help, is X effective
- better than, compared to, versus

**Keywords (HE):**
- טיפול, התערבות, יעילות, השפעה
- האם עוזר, האם עובד, האם יעיל
- בהשוואה ל, לעומת, מול

### Template for Question Composition

```typescript
// Narrow version
`In ${P}, does ${I} compared to ${C || 'no intervention'} affect ${O}?`

// Broad version
`What is the effect of ${I} on ${O} in ${P}?`

// Clinical version
`Is ${I} effective for improving ${O} in ${P} in clinical practice?`
```

### Example Flow

**Input:** "אני רוצה לחקור האם פעילות גופנית עוזרת לקשישים עם דיכאון"

**Detected:** PICO (therapy question)

**Extracted:**
- P: קשישים עם דיכאון
- I: פעילות גופנית
- C: (empty - will prompt)
- O: דיכאון

**Generated Questions:**
1. **Narrow:** In elderly patients (≥65 years) with major depressive disorder, does structured aerobic exercise (≥3x/week) compared to standard care reduce depression severity as measured by PHQ-9 scores at 12 weeks?
2. **Broad:** Does physical activity improve depression outcomes in older adults?
3. **Clinical:** Is exercise effective for reducing depression symptoms in elderly primary care patients?

---

## 2. PECO - Etiology/Risk/Exposure Questions

### Meta
- **Full Name:** Population, Exposure, Comparison, Outcome
- **Use Case:** Investigating risk factors, causes, associations
- **Question Type:** `etiology`
- **Prevalence:** ~20% of research questions

### Components

| Key | Label (HE) | Label (EN) | Question (HE) | Required | Example |
|-----|------------|------------|---------------|----------|---------|
| P | אוכלוסייה | Population | מי האוכלוסייה? | ✅ | מבוגרים מעל גיל 18 הגרים ליד שדות תעופה |
| E | חשיפה | Exposure | מה גורם הסיכון או החשיפה? | ✅ | זיהום רעש ממטוסים |
| C | השוואה | Comparison | מה קבוצת ההשוואה? | ❌ | תושבים שאינם חשופים לרעש |
| O | תוצאה | Outcome | מה התוצאה הבריאותית? | ✅ | בריאות נפשית (חרדה, דיכאון) |

### Detection Triggers

**Keywords (EN):**
- etiology, risk factor, exposure, cause, association
- does X cause, is X associated with, is X linked to
- environmental, occupational exposure

**Keywords (HE):**
- גורם סיכון, חשיפה, קשר, אטיולוגיה
- האם גורם ל, האם קשור ל, האם משפיע על
- סביבתי, תעסוקתי

### Template for Question Composition

```typescript
// Narrow version
`In ${P}, is exposure to ${E} compared to ${C || 'no exposure'} associated with increased risk of ${O}?`

// Broad version
`Is ${E} associated with ${O} in ${P}?`

// Clinical version
`Does ${E} affect ${O} in ${P}?`
```

### Example Flow

**Input:** "האם גרים ליד שדות תעופה משפיע על בריאות נפשית"

**Detected:** PECO (etiology/exposure question)

**Extracted:**
- P: תושבים
- E: גרים ליד שדות תעופה
- C: (empty)
- O: בריאות נפשית

**Generated Questions:**
1. **Narrow:** In adults (≥18 years) living within 25 miles of major airports in the US, is chronic exposure to aircraft noise (≥60 dB) compared to those living in low-noise areas associated with increased prevalence of anxiety and depression?
2. **Broad:** Is living near airports associated with mental health problems?
3. **Clinical:** Does airport noise exposure affect mental wellbeing in nearby residents?

---

## 3. SPIDER - Qualitative/Experience Questions

### Meta
- **Full Name:** Sample, Phenomenon of Interest, Design, Evaluation, Research type
- **Use Case:** Understanding experiences, perceptions, lived reality
- **Question Type:** `experience`
- **Prevalence:** ~15% of research questions

### Components

| Key | Label (HE) | Label (EN) | Question (HE) | Required | Example |
|-----|------------|------------|---------------|----------|---------|
| S | מדגם | Sample | מי המדגם שלך? | ✅ | נשים שעברו הפריה חוץ גופית |
| PI | תופעה | Phenomenon | מה החוויה או התופעה? | ✅ | החוויה הרגשית של IVF |
| D | עיצוב | Design | איזה שיטת מחקר? | ❌ | ראיונות, קבוצות מיקוד |
| E | הערכה | Evaluation | מה נבדק/נמדד? | ✅ | רגשות, עמדות, חוויות |
| R | סוג מחקר | Research type | איזה סוג מחקר? | ✅ | איכותני / מעורב |

### Detection Triggers

**Keywords (EN):**
- experience, perception, feelings, attitudes, views
- lived experience, patient perspective, understanding
- qualitative, phenomenology, ethnography

**Keywords (HE):**
- חוויה, תפיסה, רגשות, עמדות
- חוויה חיה, נקודת מבט, הבנה
- איכותני, פנומנולוגיה

### Template for Question Composition

```typescript
// Narrow version
`What are the lived experiences (${E}) of ${S} regarding ${PI} as explored through ${D || 'qualitative methods'}?`

// Broad version
`What are the experiences of ${S} with ${PI}?`

// Clinical version
`How do ${S} experience ${PI}?`
```

### Example Flow

**Input:** "אני רוצה להבין את החוויה של נשים שעוברות הפריה חוץ גופית"

**Detected:** SPIDER (qualitative/experience question)

**Extracted:**
- S: נשים שעוברות IVF
- PI: החוויה של הפריה חוץ גופית
- D: (empty - will suggest)
- E: רגשות, עמדות, חוויות
- R: איכותני

**Generated Questions:**
1. **Narrow:** What are the emotional and psychological experiences of women undergoing in vitro fertilization (IVF) treatment, as explored through semi-structured interviews using interpretive phenomenological analysis?
2. **Broad:** What do women experience during IVF treatment?
3. **Clinical:** How do women cope with the emotional challenges of IVF?

---

## Framework Decision Tree (for AI Detection)

```
User Input Analysis
    │
    ├─> Keywords: therapy, treatment, effectiveness
    │   └─> PICO ✓
    │
    ├─> Keywords: risk, exposure, cause, association
    │   └─> PECO ✓
    │
    └─> Keywords: experience, perception, feelings, qualitative
        └─> SPIDER ✓
```

---

## Field Validation Rules

### PICO
- **P:** Min 5 words, must define population characteristics
- **I:** Min 3 words, must be a specific intervention
- **C:** Optional, but recommended for comparative effectiveness
- **O:** Min 3 words, must be measurable

### PECO
- **P:** Min 5 words, must define population characteristics
- **E:** Min 3 words, must describe exposure/risk factor
- **C:** Optional, but improves study quality
- **O:** Min 3 words, must be health-related outcome

### SPIDER
- **S:** Min 5 words, describe sampling approach
- **PI:** Min 5 words, describe phenomenon/experience
- **D:** Optional, but helps focus search (e.g., "interviews", "focus groups")
- **E:** Min 3 words, what aspects are being explored
- **R:** Required - "qualitative", "mixed-methods", etc.

---

## Common Pitfalls & AI Guidance

### Pitfall 1: PICO for Non-Intervention Questions
**Wrong:** "What is the prevalence of diabetes?" → PICO
**Right:** "What is the prevalence of diabetes?" → CoCoPop (future framework)

### Pitfall 2: PECO when it's actually Prognosis
**Wrong:** "Does high BMI predict heart disease?" → PECO
**Right:** "Does high BMI predict heart disease?" → PFO (future framework)

### Pitfall 3: Forcing Quantitative Framework on Qualitative Question
**Wrong:** "What do patients feel about chemotherapy?" → PICO
**Right:** "What do patients feel about chemotherapy?" → SPIDER

---

## Integration with AI Prompts

### For `detect_framework_prompt`
```python
FRAMEWORK_CONFIGS = {
    "PICO": {
        "triggers": ["therapy", "treatment", "intervention", "effectiveness", ...],
        "explanation_template": "זוהי שאלת יעילות טיפול (Therapy). יש התערבות ברורה ({I}), אוכלוסייה ({P}), ותוצאה למדוד ({O}). מסגרת PICO מתאימה במיוחד לסוג זה של שאלות."
    },
    "PECO": {...},
    "SPIDER": {...}
}
```

### For `generate_questions_prompt`
```python
QUESTION_TEMPLATES = {
    "PICO": {
        "narrow": "In {P}, does {I} compared to {C} affect {O}?",
        "broad": "What is the effect of {I} on {O} in {P}?",
        "clinical": "Is {I} effective for {O} in {P} in clinical practice?"
    },
    # ...
}
```

---

## Testing Data

### Test Case 1: PICO Detection
```json
{
  "input": "אני רוצה לחקור האם פעילות גופנית עוזרת לקשישים עם דיכאון",
  "expected_framework": "PICO",
  "expected_type": "therapy",
  "expected_components": {
    "P": "קשישים עם דיכאון",
    "I": "פעילות גופנית",
    "C": null,
    "O": "דיכאון"
  }
}
```

### Test Case 2: PECO Detection
```json
{
  "input": "האם זיהום אוויר גורם למחלות לב",
  "expected_framework": "PECO",
  "expected_type": "etiology",
  "expected_components": {
    "P": "אוכלוסייה כללית",
    "E": "זיהום אוויר",
    "C": null,
    "O": "מחלות לב"
  }
}
```

### Test Case 3: SPIDER Detection
```json
{
  "input": "מה החוויה של אנשים עם סרטן במהלך כימותרפיה",
  "expected_framework": "SPIDER",
  "expected_type": "experience",
  "expected_components": {
    "S": "אנשים עם סרטן",
    "PI": "חוויה במהלך כימותרפיה",
    "D": null,
    "E": "רגשות וחוויות",
    "R": "איכותני"
  }
}
```

---

**Last Updated:** 2026-01-28
**Version:** 1.0 (MVP)
**Next Addition:** CoCoPop, PIRD, PFO (Phase 6)
