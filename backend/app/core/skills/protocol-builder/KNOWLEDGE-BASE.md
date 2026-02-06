# Protocol Builder Knowledge Base

## PROSPERO Registration Fields - Complete Reference

### Section 1: Review Title and Timescale

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| **Review title** | Yes | Should state intervention, population, and outcome | "Cognitive behavioral therapy for anxiety disorders in adults: A systematic review and meta-analysis" |
| **Original language title** | If applicable | Title in original language if not English | — |
| **Anticipated or actual start date** | Yes | When data extraction begins | 2025-03-01 |
| **Anticipated completion date** | Yes | When review will be submitted | 2025-12-31 |
| **Stage of review** | Yes | Current status | Preliminary searches / Piloting / Data extraction / Risk of bias / Data analysis / Completed |

### Section 2: Review Team

| Field | Required | Description |
|-------|----------|-------------|
| **Named contact** | Yes | Person responsible for correspondence |
| **Named contact email** | Yes | Contact email |
| **Named contact address** | Yes | Institutional address |
| **Named contact phone** | No | Phone number |
| **Organisational affiliation** | Yes | Institution of named contact |
| **Review team members** | Yes | All team members with affiliations |
| **Roles and responsibilities** | Recommended | Who does what (screening, extraction, analysis) |

### Section 3: Review Methods

#### 3.1 Review Question
| Field | Required | Description |
|-------|----------|-------------|
| **Review question** | Yes | Structured question (PICO, CoCoPop, etc.) |
| **Objective** | Yes | What the review aims to achieve |
| **Rationale** | Recommended | Why this review is needed |

#### 3.2 Searches
| Field | Required | Description |
|-------|----------|-------------|
| **Databases** | Yes | List of databases to search |
| **Search strategy** | Yes | Full strategy for at least one database |
| **Additional searches** | Recommended | Trial registries, reference checking, experts |

#### 3.3 Condition/Domain
| Field | Required | Description |
|-------|----------|-------------|
| **Condition being studied** | Yes | Disease, health state, or topic area |

#### 3.4 Population
| Field | Required | Description |
|-------|----------|-------------|
| **Participants/population** | Yes | Who is included |
| **Exclusion criteria** | Yes | Who is excluded |

#### 3.5 Intervention/Exposure
| Field | Required | Description |
|-------|----------|-------------|
| **Intervention(s)** | Yes | What intervention/exposure is studied |
| **Comparator(s)** | Yes | What is the comparison (can be "none") |

#### 3.6 Outcomes
| Field | Required | Description |
|-------|----------|-------------|
| **Main outcome(s)** | Yes | Primary outcome with measurement method |
| **Additional outcome(s)** | If applicable | Secondary outcomes |
| **Timing of outcome** | Recommended | When outcomes are measured |

#### 3.7 Study Designs
| Field | Required | Description |
|-------|----------|-------------|
| **Types of study** | Yes | RCTs, cohort, case-control, etc. |

### Section 4: Data Collection and Analysis

#### 4.1 Data Extraction
| Field | Required | Description |
|-------|----------|-------------|
| **Data extraction** | Yes | Who extracts, how (single/dual), tool used |

#### 4.2 Risk of Bias
| Field | Required | Description |
|-------|----------|-------------|
| **Risk of bias assessment** | Yes | Tool(s) to be used, who assesses |

#### 4.3 Data Synthesis
| Field | Required | Description |
|-------|----------|-------------|
| **Strategy for data synthesis** | Yes | Narrative + quantitative methods |

### Section 5: Additional Information

| Field | Required | Description |
|-------|----------|-------------|
| **Language** | Recommended | Language restrictions |
| **Country** | No | Geographic focus |
| **Other registration details** | If applicable | Other registrations (Cochrane, OSF) |
| **Reference to protocol** | If applicable | Published protocol citation |
| **Dissemination plans** | No | Publication plans |
| **Keywords** | No | MeSH or free text |
| **Details of existing reviews** | Recommended | Why new review is needed |
| **Current review status** | Yes | Stage of review |
| **Any additional information** | No | Anything else relevant |
| **Funding sources** | Yes | All funding sources |
| **Conflicts of interest** | Yes | All COI declarations |

---

## Risk of Bias Tools - Quick Reference

### RoB 2.0 (RCTs)

**5 Domains:**

| Domain | Focus | Signaling Questions |
|--------|-------|---------------------|
| **D1: Randomization** | Was allocation sequence random? Was it concealed? | Random sequence generation, allocation concealment, baseline differences |
| **D2: Deviations** | Were there deviations from intended interventions? | Participant/personnel awareness, deviations occurred, appropriate analysis |
| **D3: Missing data** | Were outcome data complete? | Data availability, evidence of impact, could missingness depend on outcome? |
| **D4: Measurement** | Was outcome measurement appropriate? | Method appropriate, measurement different between groups, assessor awareness |
| **D5: Selection** | Was there selective reporting? | Pre-specified analysis plan, multiple measurements, multiple analyses |

**Judgments:** Low risk / Some concerns / High risk

### ROBINS-I (Non-randomized Studies)

**7 Domains:**

| Domain | Focus |
|--------|-------|
| **D1: Confounding** | Baseline confounding |
| **D2: Selection** | Selection of participants |
| **D3: Classification** | Classification of interventions |
| **D4: Deviations** | Deviations from intended interventions |
| **D5: Missing data** | Missing outcome data |
| **D6: Measurement** | Measurement of outcomes |
| **D7: Selection** | Selection of reported result |

**Judgments:** Low / Moderate / Serious / Critical / No information

### Newcastle-Ottawa Scale (Cohort Studies)

**3 Categories, 8 Items:**

| Category | Items | Max Stars |
|----------|-------|-----------|
| **Selection** | Representativeness, Selection of non-exposed, Ascertainment of exposure, Outcome not present at start | 4 |
| **Comparability** | Comparability based on design/analysis | 2 |
| **Outcome** | Assessment of outcome, Follow-up length, Adequacy of follow-up | 3 |

**Total: 9 stars maximum**

### JBI Critical Appraisal Tools

| Study Type | Tool | Questions |
|------------|------|-----------|
| RCTs | JBI RCT Checklist (2023) | 13 items |
| Quasi-experimental | JBI Quasi-experimental (2024) | 9 items |
| Cohort | JBI Cohort (2025) | 11 items |
| Case-control | JBI Case-control | 10 items |
| Cross-sectional (analytical) | JBI Analytical Cross-sectional | 8 items |
| Prevalence | JBI Prevalence | 9 items |
| Qualitative | JBI-QARI | 10 items |
| Case series | JBI Case series | 10 items |

**Judgments:** Yes / No / Unclear / Not applicable

---

## GRADE Domains - Quick Reference

### 5 Domains for Downgrading

| Domain | Question | Downgrade When |
|--------|----------|----------------|
| **Risk of Bias** | Are there methodological limitations? | Serious limitations in studies contributing most weight |
| **Inconsistency** | Are results consistent across studies? | I² > 50%, non-overlapping CIs, conflicting directions |
| **Indirectness** | Do studies directly address the question? | Different population, intervention, comparator, or outcome |
| **Imprecision** | Is the effect estimate precise? | Wide CI, small sample, few events, crosses clinical threshold |
| **Publication Bias** | Are studies missing? | Asymmetric funnel plot, small-study effects, industry funding |

### 3 Domains for Upgrading (Observational Only)

| Domain | Upgrade When |
|--------|--------------|
| **Large Effect** | RR > 2 or < 0.5 (upgrade 1); RR > 5 or < 0.2 (upgrade 2) |
| **Dose-Response** | Clear gradient between dose/exposure and effect |
| **Residual Confounding** | All plausible confounders would reduce the effect |

### Certainty Levels

| Level | Symbol | Interpretation |
|-------|--------|----------------|
| **High** | ⊕⊕⊕⊕ | Very confident the true effect is close to estimate |
| **Moderate** | ⊕⊕⊕◯ | Moderately confident; further research may change estimate |
| **Low** | ⊕⊕◯◯ | Limited confidence; true effect may be substantially different |
| **Very Low** | ⊕◯◯◯ | Very little confidence in the effect estimate |

---

## Data Extraction Template

### Standard Fields for Intervention Reviews

```
STUDY IDENTIFICATION
- Study ID (FirstAuthor_Year)
- Full citation
- Country/Countries
- Funding source
- Conflicts of interest

METHODS
- Study design (RCT, quasi-experimental, cohort, etc.)
- Setting (hospital, community, primary care)
- Duration of study
- Duration of follow-up

PARTICIPANTS
- Total N randomized/enrolled
- N per group
- Age (mean, SD or range)
- Sex (% female)
- Key inclusion criteria
- Key exclusion criteria
- Baseline disease severity

INTERVENTION
- Name of intervention
- Dose/intensity
- Frequency
- Duration
- Delivery method
- Provider

COMPARATOR
- Type (placebo, active control, usual care, waitlist)
- Details (if active comparator)

OUTCOMES
For each outcome:
- Definition
- Measurement tool
- Time point(s)
- N analyzed per group
- Result (mean±SD, events/total, etc.)
- Effect estimate (MD, RR, OR, HR)
- 95% CI
- p-value

NOTES
- Contacted authors? (Y/N)
- Response received?
- Additional comments
```

### Standard Fields for Prevalence Reviews (CoCoPop)

```
STUDY IDENTIFICATION
- Study ID
- Full citation
- Country

METHODS
- Study design (cross-sectional, cohort baseline)
- Sampling method
- Data collection period

POPULATION
- Target population
- Sample size (N)
- Response rate
- Age distribution
- Sex distribution
- Other demographics

CONDITION
- Case definition
- Diagnostic criteria/tool
- Who diagnosed (self-report, clinician, registry)

CONTEXT
- Setting (urban/rural, primary/secondary care)
- Geographic region
- Time period

PREVALENCE DATA
- Numerator (cases)
- Denominator (total)
- Prevalence (%)
- 95% CI
- Subgroup data (if available)
```

---

## Search Strategy Templates

### Cochrane RCT Filter (Sensitivity Maximizing)

```
((randomized controlled trial[pt] OR controlled clinical trial[pt]
OR randomized[tiab] OR placebo[tiab] OR drug therapy[sh]
OR randomly[tiab] OR trial[tiab] OR groups[tiab])
NOT (animals[mh] NOT humans[mh]))
```

### Prevalence Filter

```
(Prevalence[mh] OR Incidence[mh] OR "Cross-Sectional Studies"[mh]
OR "cross sectional"[tiab] OR prevalence[tiab] OR incidence[tiab]
OR frequency[tiab] OR occurrence[tiab]
OR epidemiology[sh] OR "statistics and numerical data"[sh])
```

### Prognosis Filter (Haynes)

```
(incidence[mh] OR mortality[mh] OR "follow up studies"[mh]
OR prognos*[tiab] OR predict*[tiab] OR course*[tiab]
OR "disease progression"[mh] OR survival[tiab])
```

### Qualitative Filter (Wong)

```
("qualitative research"[mh] OR "nursing methodology research"[mh]
OR interview*[tiab] OR experience*[tiab] OR qualitative[tiab]
OR "grounded theory"[tiab] OR phenomenolog*[tiab] OR "lived experience"[tiab]
OR "focus group*"[tiab] OR thematic[tiab] OR ethnograph*[tiab])
```

### Diagnostic Filter (Haynes)

```
("sensitivity and specificity"[mh] OR "diagnostic errors"[mh]
OR sensitivity[tiab] OR specificity[tiab]
OR "predictive value*"[tiab] OR "likelihood ratio*"[tiab]
OR "false negative*"[tiab] OR "false positive*"[tiab])
```

---

## PRISMA-P Checklist (17 Items)

| # | Section | Item |
|---|---------|------|
| 1 | Title | Identify as systematic review protocol |
| 2 | Registration | Provide registration number and registry name |
| 3 | Authors | Contact info for corresponding author |
| 4 | Amendments | Describe amendments if any |
| 5 | Support | Sources of financial/non-financial support |
| 6 | Rationale | Describe rationale in context of existing knowledge |
| 7 | Objectives | Provide explicit statement of question (PICO) |
| 8 | Eligibility | Specify inclusion/exclusion criteria |
| 9 | Information sources | Describe all information sources |
| 10 | Search strategy | Present full search for at least one database |
| 11 | Study records | Describe selection process |
| 12 | Data items | List variables to be extracted |
| 13 | Outcomes | List primary and secondary outcomes |
| 14 | Risk of bias | Describe method for assessing RoB |
| 15 | Data synthesis | Describe synthesis methods |
| 16 | Meta-bias | Describe methods for assessing meta-bias |
| 17 | Confidence | Describe methods for assessing strength (GRADE) |

---

## PRISMA-ScR Checklist (Key Differences)

| Item | PRISMA-P (SR) | PRISMA-ScR (Scoping) |
|------|---------------|----------------------|
| Framework | PICO | PCC |
| Outcomes | Pre-specified | Not required (emergent) |
| RoB Assessment | Required | Optional |
| Data extraction | "Data extraction" | "Data charting" (iterative) |
| Synthesis | Meta-analysis possible | Narrative/visual only |
| GRADE | Required | Not applicable |
| Registration | PROSPERO | OSF / INPLASY |

---

## Sample Protocol Excerpt

### Title
Exercise interventions for major depressive disorder in adults: A systematic review and meta-analysis

### Review Question (PICO)
In adults diagnosed with major depressive disorder (P), do structured exercise interventions (I), compared to usual care, waitlist control, or active comparators (C), reduce depressive symptoms and improve remission rates (O)?

### Eligibility Criteria

**Inclusion:**
- Population: Adults (≥18 years) with diagnosed MDD (DSM/ICD criteria)
- Intervention: Structured exercise (aerobic, resistance, or combined; ≥3 sessions/week; ≥4 weeks)
- Comparator: Usual care, waitlist, attention control, active treatment
- Outcomes: Depressive symptoms (validated scale), remission (defined by scale cutoff)
- Designs: RCTs only

**Exclusion:**
- Bipolar disorder, schizophrenia, or primary anxiety disorder
- Exercise as adjunct to ECT
- Conference abstracts without full data
- Non-English publications (no translation resources)

### Search Strategy (MEDLINE)

```
#1 "Depressive Disorder, Major"[mh]
#2 "major depression"[tiab] OR "major depressive"[tiab] OR MDD[tiab]
#3 #1 OR #2
#4 "Exercise"[mh] OR "Exercise Therapy"[mh]
#5 exercis*[tiab] OR "physical activity"[tiab] OR aerobic[tiab] OR "resistance training"[tiab]
#6 #4 OR #5
#7 #3 AND #6
#8 Cochrane RCT Filter
#9 #7 AND #8
```

### Risk of Bias
- Tool: Cochrane RoB 2.0
- Assessment: Dual independent
- Domains: All 5 domains assessed per outcome

### Data Synthesis
- Narrative synthesis of study characteristics
- Meta-analysis if ≥3 studies with comparable outcomes
- Model: Random-effects (REML)
- Effect measure: SMD for depressive symptoms, RR for remission
- Heterogeneity: I², τ², prediction intervals
- Subgroups: Exercise type, intensity, supervision level
- Sensitivity: Low RoB studies only

### GRADE Assessment
- Summary of Findings table for primary outcomes
- GRADEpro GDT software
