---
name: article-appraisal
description: Clinical Article Appraisal - Structured critical appraisal of clinical-pharmacology papers. Produces Highlights section + 8-section narrative appraisal (Abstract, Introduction, Methods, Results, Discussion, Limitations, Funding/COI, Critical Appraisal). Includes validity/bias assessment. Output formatted for Google Docs. Always responds in English regardless of article language.
argument-hint: <PDF file path of clinical article>
---

# Clinical Article Appraisal

## 🎯 TASK OVERVIEW

Perform a structured critical appraisal of the provided clinical-pharmacology paper PDF. Produce:

1. A brief **'Highlights'** section summarizing the key takeaways with internal references
2. **Narrative appraisal** (target ≈ 600–800 words) organised under Sections 1-8
3. Final output formatted suitable for export to **Google Docs**

---

## ⚠️ CRITICAL RULES

### Language Rule
**Respond ONLY in English**, even if the user or the article is in another language.

### Source Limitation
Base every statement **strictly and solely** on the content within the provided article PDF. Do NOT access external websites, databases, or sources to supplement or verify information.

### Missing Information
If required information is not present in the article, explicitly write **"Not reported"** and continue the appraisal.

### Numerical Results
Quote numerical results **exactly as printed** in the article (e.g., effect estimate ± 95% CI, p-value). Use **LaTeX formatting** for all mathematical/scientific notation:
- Enclose in `$...$` or `$$...$$`
- Example: `$HR = 0.75; 95\% CI, 0.60-0.90$`
- Example: `$p < 0.001$`

### Objectivity
Keep personal opinion or external knowledge **out of** the Highlights section and Sections 1–7. Objective critique belongs **only in Section 8** (Critical Appraisal).

### Clarity & Brevity
Use concise sentences and standard abbreviations (e.g., RCT, CI, HR, OR).

---

## 📋 OUTPUT STRUCTURE

### Highlights

**Purpose:** Provide a very concise (3-5 key bullet points) overview of the most critical findings.

**Content (based strictly on the article):**
- The core objective or primary research question (concisely stated)
- The key population studied and main intervention tested
- The most important quantitative result for primary outcome (effect estimate ± 95% CI, p-value)
- (Optional) One or two other critical findings (e.g., major safety signal, key secondary outcome)

**Format:** Bullet points with internal references:
```
• [Finding] (Results, Table 2)
• [Finding] (Abstract)
• [Finding] (Discussion, p. 5)
```

---

## 📑 SECTION HEADINGS (Narrative Appraisal)

### 1. Abstract
- Primary objective / research question as stated
- Key result for primary endpoint (effect ± CI or p-value)
- One-sentence author conclusion

### 2. Introduction
- Clinical background and knowledge gap described
- Explicit research question or hypothesis stated

### 3. Methods
- **Study design** (e.g., RCT, cohort, PK crossover)
- **Setting & enrolment dates** (country/region, single- vs multi-centre, dates)
- **Population:** Key inclusion/exclusion criteria, final N analysed
- **Intervention or exposure:** Drug(s), dose(s), route(s), duration(s)
- **Comparator / control group** (if any)
- **Outcome definitions:** Primary & key secondary outcomes, time-points
- **Study registration:** Reported? (Yes/No/Not Reported; ID if stated)
- **Ethics:** Committee approval reported? Participant consent reported?
- **Statistical approach:**
  - Effect measures (RR, OR, HR, IRR, ARR, NNT/NNH, means, medians)
  - Statistical tests for primary endpoint & covariate adjustments
  - Power calculation inputs ($\alpha$, $\beta$, expected effect, planned N)
  - Missing data handling method (LOCF, MI, complete case, none reported)

### 4. Results
- **Participant flow:** Screened → Eligible → Randomised → Allocated → Analysed
- **Primary outcome result(s):** Effect estimate ± 95% CI, p-value
- **Key secondary outcomes:** As for primary
- **Safety results:** SAEs, AEs leading to withdrawal (counts & percentages)
- **Subgroup / sensitivity analyses:** Pre-specified or post-hoc?
- **Unexpected findings** highlighted by authors
- **Data presentation quality:** Clarity of tables/figures

### 5. Discussion & Conclusions
- Authors' main interpretation
- Clinical/scientific implications claimed
- Authors' discussion of consistency with previous literature
- Future research directions proposed

### 6. Limitations
- Limitations explicitly acknowledged by authors
- Additional limitations identified by appraiser (based only on article content)

### 7. Funding & Conflicts of Interest
- Funding source(s) disclosed
- Author COI disclosures
- Assessment of whether funding/COI could have influenced study

### 8. Critical Appraisal (Validity & Bias)
- **Internal validity:** Randomisation, allocation concealment, blinding, outcome measurement accuracy, missing data handling
- **Risk of bias:** Selection, performance, detection, attrition, reporting bias
- **External validity (Generalisability):** Population, intervention, setting applicability
- **Overall evidence strength:** Rate as **High / Moderate / Low** with one-sentence justification

---

## 📊 STATISTICAL & TABLE GUIDANCE

### Effect Measures
Extract and report: RR, OR, HR, IRR, ARR, NNT/NNH, PAR, SMR, mean differences, etc.

### Effect Estimates
Always give point estimate and 95% CI if provided:
```
$HR = 0.75; 95\% CI, 0.60-0.90$
```

### p-values
Report exact value if given:
- `$p = 0.03$`
- `$p < 0.001$`
- Avoid "NS" without actual p-value or CI

### Tables/Figures
- Cite clearly: "Results are shown in Table 2"
- May recreate small summary table if needed

### Graph-only Data
If results only in graphs without numbers:
```
"Numeric values for [outcome] were only presented graphically, limiting precise interpretation. Estimated effect $\approx X$ from Figure 1."
```

### Multiple Testing
Note if authors mention adjustments (Bonferroni, FDR). If many outcomes tested without adjustment, note potential for inflated Type I error.

### Power
State planned sample size, assumptions ($\alpha$, $\beta$, expected effect), achieved N. Comment if study appears underpowered.

---

## 🔬 OPTIONAL ADD-ON MODULES

Include **only when clearly relevant** based on paper's content:

### Pharmacological Relevance (PK/PD)
If major focus: Discuss PK parameters ($AUC$, $C_{max}$, $t_{1/2}$), dose rationale, clinical implications

### Cost-Effectiveness
If reported: Summarise ICER, economic results, budget impact

### Population Applicability/Subgroups
If discussed in detail: Expand on specific subgroup effects (paediatrics, CKD, etc.)

### Ethical Considerations
If discussed beyond basic approval/consent: Elaborate on ethical issues

**Placement:** Integrate into most appropriate section (Methods, Results, Discussion)

---

## 📄 OUTPUT FORMAT

1. Begin with **Highlights** section (with internal references)
2. Follow with structured **Sections 1-8**
3. Use clear headings (bold or Markdown)
4. Use paragraph breaks for readability
5. Use **LaTeX formatting** for all math/scientific notation
6. Format suitable for direct paste into **Google Docs**

---

## 📦 OUTPUT ARTIFACTS

At the end of each appraisal, offer to create exportable files:

| Artifact | Format | Purpose |
|----------|--------|---------|
| `appraisal-[AuthorYear].md` | Markdown | Complete structured appraisal |
| `appraisal-[AuthorYear].txt` | Plain text | Google Docs compatible |
| `appraisal-[AuthorYear].html` | HTML | Formatted with LaTeX rendering |
| `appraisal-summary.csv` | CSV | Key data for comparison across articles |

### Template: appraisal-[AuthorYear].md

```markdown
# Clinical Article Appraisal

**Article:** [Full citation]
**Appraiser:** [User name if provided]
**Date:** [Today's date]

---

## Highlights

• [Key finding 1] (Section reference)
• [Key finding 2] (Section reference)
• [Key finding 3] (Section reference)
• [Key finding 4] (Section reference)

---

## 1. Abstract

**Primary Objective:** [Objective as stated]

**Key Result:** $[Effect estimate ± CI, p-value]$

**Author Conclusion:** [One sentence]

---

## 2. Introduction

**Clinical Background:** [Knowledge gap described]

**Research Question:** [Explicit hypothesis/question]

---

## 3. Methods

| Element | Details |
|---------|---------|
| **Design** | [e.g., Double-blind RCT] |
| **Setting** | [Country, centers, dates] |
| **Population** | [N, key criteria] |
| **Intervention** | [Drug, dose, duration] |
| **Comparator** | [Control description] |
| **Primary Outcome** | [Definition, timepoint] |
| **Registration** | [ID or Not Reported] |
| **Ethics** | [Approval + consent status] |

**Statistical Approach:**
- Effect measures: [RR, OR, HR, etc.]
- Primary analysis: [Test used]
- Power: $\alpha = [X], \beta = [Y]$, planned N = [Z]
- Missing data: [Method]

---

## 4. Results

**Participant Flow:** Screened (N) → Eligible (N) → Randomised (N) → Analysed (N)

**Primary Outcome:** $[Effect = X; 95\% CI, Y-Z; p = W]$

**Key Secondary Outcomes:**
- [Outcome 1]: $[Result]$
- [Outcome 2]: $[Result]$

**Safety:** [SAEs, discontinuations]

---

## 5. Discussion & Conclusions

**Main Interpretation:** [Authors' interpretation]

**Clinical Implications:** [Claimed implications]

**Future Research:** [Proposed directions]

---

## 6. Limitations

**Author-Acknowledged:**
- [Limitation 1]
- [Limitation 2]

**Additional (Appraiser-Identified):**
- [Limitation 3]

---

## 7. Funding & Conflicts of Interest

**Funding:** [Source(s)]

**Author COI:** [Summary]

**Assessment:** [Potential influence evaluation]

---

## 8. Critical Appraisal

### Internal Validity
| Domain | Assessment | Notes |
|--------|------------|-------|
| Randomisation | Adequate/Unclear/Inadequate | [Notes] |
| Allocation Concealment | Adequate/Unclear/Inadequate | [Notes] |
| Blinding | Adequate/Unclear/Inadequate | [Notes] |
| Outcome Measurement | Adequate/Unclear/Inadequate | [Notes] |
| Missing Data | Adequate/Unclear/Inadequate | [Notes] |

### Risk of Bias
| Bias Type | Risk Level | Justification |
|-----------|------------|---------------|
| Selection | Low/High/Unclear | [Justification] |
| Performance | Low/High/Unclear | [Justification] |
| Detection | Low/High/Unclear | [Justification] |
| Attrition | Low/High/Unclear | [Justification] |
| Reporting | Low/High/Unclear | [Justification] |

### External Validity
[Assessment of generalisability]

### Overall Evidence Strength
**Rating:** High / Moderate / Low

**Justification:** [One sentence]

---

*Appraisal generated using Clinical Article Appraisal Skill*
```

### Template: appraisal-summary.csv

```csv
Article,Design,Population N,Intervention,Comparator,Primary Outcome,Effect Estimate,95% CI,p-value,Overall RoB,Evidence Strength,Key Limitation
"[Author Year]","[RCT/Cohort/etc]",[N],"[Intervention]","[Control]","[Outcome]","[Effect]","[CI]","[p]","[Low/High/Unclear]","[High/Moderate/Low]","[Main limitation]"
```

### Template: appraisal-[AuthorYear].html

```html
<!DOCTYPE html>
<html>
<head>
    <title>Article Appraisal - [Author Year]</title>
    <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; border-left: 4px solid #3498db; padding-left: 10px; }
        .highlights { background: #f8f9fa; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0; }
        .highlights ul { margin: 0; }
        table { border-collapse: collapse; width: 100%; margin: 15px 0; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background-color: #3498db; color: white; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .rating-high { color: #27ae60; font-weight: bold; }
        .rating-moderate { color: #f39c12; font-weight: bold; }
        .rating-low { color: #e74c3c; font-weight: bold; }
        .metadata { color: #7f8c8d; font-size: 0.9em; margin-bottom: 20px; }
    </style>
</head>
<body>
    <h1>Clinical Article Appraisal</h1>
    <div class="metadata">
        <strong>Article:</strong> [Full citation]<br>
        <strong>Date:</strong> [Today's date]
    </div>

    <div class="highlights">
        <h3>📌 Highlights</h3>
        <ul>
            <li>[Key finding 1]</li>
            <li>[Key finding 2]</li>
            <li>[Key finding 3]</li>
        </ul>
    </div>

    <!-- Continue with all sections... -->

</body>
</html>
```

### User Prompt

After completing the appraisal:

```
📄 I can create exportable files for you:

1. **appraisal-[AuthorYear].md** - Full Markdown appraisal
2. **appraisal-[AuthorYear].txt** - Plain text for Google Docs
3. **appraisal-[AuthorYear].html** - Formatted HTML with LaTeX rendering
4. **appraisal-summary.csv** - Key data row for spreadsheet comparison

Which files would you like me to create?
```

---

## User Input

$ARGUMENTS
