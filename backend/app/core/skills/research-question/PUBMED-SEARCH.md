# PubMed Search Strategy Reference

Advanced Methodological Architectures for Automated PubMed Query Generation

## Table of Contents

1. [PubMed Architecture & Logic](#1-pubmed-architecture)
2. [Boolean Logic & Construction](#2-boolean-logic)
3. [Framework-Specific Strategies](#3-framework-strategies)
4. [Validated Methodological Hedges](#4-hedges)
5. [Common Pitfalls](#5-pitfalls)

---

## 1. PubMed Architecture

### 1.1 The Duality of Controlled Vocabulary and Natural Language

A robust search strategy must account for both human indexing precision and author language variability.

**Medical Subject Headings (MeSH):**
- NLM's controlled thesaurus
- Hierarchical structure - searching "Heart Diseases" [mh] automatically includes subordinate concepts
- **Danger of relying solely on MeSH:** "indexing lag" between publication and manual indexing

**Text Word Searching (Title/Abstract):**
- Tag `[tiab]` is the gold standard for systematic reviews
- Restricts to Title and Abstract fields
- Avoids noise from `[All Fields]` which searches affiliations, references, etc.

### 1.2 Heuristic Hierarchy of Field Tags

| Priority | Tag | Description | Application |
|----------|-----|-------------|-------------|
| 1 | `[mh]` | MeSH Terms (Exploded) | Primary for established concepts |
| 2 | `[tiab]` | Title/Abstract | Primary for natural language, new terms |
| 3 | `[pt]` | Publication Type | For methodological filters (e.g., RCT) |
| 4 | `[nm]` | Substance Name | For specific drugs not in MeSH |
| 5 | `[sh]` | Subheadings | To refine MeSH terms (use with caution) |
| 6 | `[majr]` | MeSH Major Topic | When precision > sensitivity |

### 1.3 Automatic Term Mapping (ATM)

When a raw term is entered, PubMed attempts to map it to MeSH, journal, or author.

**For rigorous searches:**
- Explicitly tag terms: `"heart attack"[tiab]`
- Use quotation marks to disable ATM and force phrase searching

---

## 2. Boolean Logic

### 2.1 Logical Operators

| Operator | Function | Use Case |
|----------|----------|----------|
| **OR** | Combines synonyms | Within a single concept block (Sensitivity ↑) |
| **AND** | Intersects concepts | Between distinct blocks (Specificity ↑) |
| **NOT** | Excludes | Use with EXTREME caution |

### 2.2 Algebraic Construction

**Parentheses are CRITICAL** for defining processing order:

```
(Population_synonyms OR Population_terms)
AND
(Intervention_synonyms OR Intervention_terms)
AND
(Outcome_synonyms OR Outcome_terms)
```

### 2.3 NOT Operator Warning

`NOT` frequently eliminates relevant records that discuss excluded topics tangentially.

**Example Problem:** `NOT Animal` strategies may exclude human trials that mention animal models in the abstract.

**Safe Pattern:**
```
NOT (animals[mh] NOT humans[mh])
```
This excludes records indexed ONLY as animals, but preserves records indexed as BOTH.

---

## 3. Framework-Specific Strategies

### 3.1 PICO/PICOT (Therapy/Effectiveness)

**Boolean Structure:**
```
(Population_OR) AND (Intervention_OR) AND (Comparison_OR) AND (Outcome_OR)
```

**"Relaxed PICO" Strategy (Recommended for Systematic Reviews):**
- Search only **Population AND Intervention**
- Apply Comparison and Outcome as optional precision filters
- Reason: C and O are often poorly described in abstracts or inconsistently indexed

**Field Tag Recommendations:**
- **Population:** Use `[mh]` for diseases, `[tiab]` for demographics. Use PubMed age filters (e.g., Child: 0-18 years)
- **Intervention:** Use `[nm]` for pharmaceuticals to capture Supplementary Concept Records
- **Time (T):** Use `[dp]` (Date of Publication) or `[mh]` terms like "Follow-Up Studies"

---

### 3.2 CoCoPop (Prevalence/Incidence)

**Boolean Structure:**
```
(Condition_OR) AND (Context_OR) AND (Population_OR)
```

**Prevalence Filter (High-Sensitivity):**
```
(Prevalence[mh] OR Incidence[mh] OR "Cross-Sectional Studies"[mh]
OR "cross sectional"[tiab] OR prevalence[tiab] OR incidence[tiab]
OR frequency[tiab] OR occurrence[tiab]
OR epidemiology[sh] OR statistics and numerical data[sh])
```

**Field Tag Recommendations:**
- **Condition:** Use `[majr]` if volume is unmanageable
- **Context:** Geographic searching is challenging. Use `[ad]` cautiously; use Exploded MeSH for regions (e.g., `Africa[mh]`)

---

### 3.3 PEO/PECO (Etiology/Risk)

**Boolean Structure:**
```
(Population_OR) AND (Exposure_OR) AND (Outcome_OR)
```

**For Qualitative PEO:** Use terms like `Experiences[tiab]`, `Attitudes[tiab]`, `Perceptions[tiab]`

**Field Tag Recommendations:**
- **Exposure:** Extensive use of `[tiab]` required - exposures often lack precise MeSH terms

---

### 3.4 PFO (Prognosis)

**Boolean Structure:**
```
(Population_OR) AND (Prognostic Factor_OR) AND (Outcome_OR)
```

**Field Tag Recommendations:**
- **Prognostic Factor:** Search as `[mh]` AND `[tiab]`. Note: "Risk Factors" `[mh]` often retrieves etiology, not prognosis
- **Outcome:** `Mortality`, `Survival`, `Survival Analysis[mh]` are high-yield terms

---

### 3.5 PIRD (Diagnostic Test Accuracy)

**Boolean Structure:**
```
(Population_OR) AND (Index Test_OR) AND (Diagnosis_OR)
```

> **CRITICAL:** Do NOT search for Reference Test (R) unless comparing specific standards. Searching R reduces sensitivity by ~30%.

**Field Tag Recommendations:**
- **Index Test:** Use specific MeSH terms AND text words
- **Diagnosis:** Use `[di]` subheading (e.g., `Asthma/diagnosis[mh]`)

---

### 3.6 SPIDER/PICo (Qualitative)

**Boolean Structure (SPIDER):**
```
(Sample_OR) AND (Phenomenon of Interest_OR) AND (Design_OR OR Evaluation_OR OR Research Type_OR)
```

**Important:** SPIDER has lower sensitivity than PICO but higher specificity. For comprehensive reviews, consider "PICO + Qualitative Filter" approach.

---

### 3.7 PCC (Scoping Reviews)

**Boolean Structure:**
```
(Population_OR) AND (Concept_OR) AND (Context_OR)
```

**Generally AVOID methodological filters** - scoping reviews should be open to all study designs.

**Field Tag Recommendations:**
- **Concept:** Use `[majr]` to focus on articles where concept is primary

---

### 3.8 CMO/CIMO (Realist Reviews)

**Boolean Structure:**
```
(Intervention_OR) AND (Context_OR) AND (Outcome_OR)
```

> **CRITICAL:** "Mechanism" is rarely indexed. Do NOT include Mechanism keywords as mandatory block - this causes massive false negatives.

**Implementation Science Filter:**
```
(implementation[tiab] OR adoption[tiab] OR barriers[tiab]
OR facilitators[tiab] OR "Health Plan Implementation"[mh]
OR "Diffusion of Innovation"[mh])
```

---

## 4. Validated Methodological Hedges

### 4.1 Cochrane HSSS (RCTs - Sensitivity Maximizing)

```
((randomized controlled trial[pt] OR controlled clinical trial[pt]
OR randomized[tiab] OR placebo[tiab] OR drug therapy[sh]
OR randomly[tiab] OR trial[tiab] OR groups[tiab])
NOT (animals[mh] NOT humans[mh]))
```

**Source:** Cochrane Handbook, 2008 Revision

---

### 4.2 SIGN Observational Filter (Cohort/Case-Control)

```
("Epidemiologic Studies"[mh] OR "Case-Control Studies"[mh]
OR "Cohort Studies"[mh] OR "Cross-Sectional Studies"[mh]
OR "case control"[tiab] OR cohort[tiab]
OR "cross sectional"[tiab] OR longitudinal[tiab]
OR retrospective[tiab] OR prospective[tiab] OR "follow up"[tiab])
```

**Source:** SIGN (Scottish Intercollegiate Guidelines Network)

---

### 4.3 Haynes Prognosis Filter (Broad/Sensitive)

```
(incidence OR mortality OR follow up studies
OR prognos* OR predict* OR course*)
```

**Source:** McMaster Hedges Team

---

### 4.4 Haynes Diagnostic Filter (Sensitive)

```
("sensitivity and specificity"[mh] OR "diagnostic errors"[mh]
OR sensitivity[tiab] OR specificity[tiab]
OR "predictive value*"[tiab] OR "likelihood ratio*"[tiab]
OR "false negative*"[tiab] OR "false positive*"[tiab]
OR "diagnosis, differential"[mh] OR "reproducibility of results"[mh])
```

**Source:** McMaster Hedges Team

---

### 4.5 Wong Qualitative Filter (High Sensitivity)

```
("qualitative research"[mh] OR "nursing methodology research"[mh]
OR interview*[tiab] OR experience*[tiab] OR qualitative[tiab])
```

**Source:** Wong et al.

**Note:** "Qualitative Research" was only introduced as MeSH in 2003. For older papers, add: `"grounded theory"[tiab] OR "phenomenology"[tiab] OR "lived experience"[tiab]`

---

### 4.6 PubMed Systematic Review Filter (Built-in)

```
systematic[sb]
```

Covers systematic reviews, meta-analyses, and health technology assessments.

---

### 4.7 Health Services Research Filter

```
("Quality of Health Care"[mh] OR "Program Evaluation"[mh]
OR "Health Care Surveys"[mh] OR "Outcome Assessment, Health Care"[mh]
OR "Process Assessment, Health Care"[mh])
```

---

## 5. Common Pitfalls

### 5.1 General Pitfalls

| Pitfall | Description | Solution |
|---------|-------------|----------|
| Over-specification of Outcomes | Including 'O' often restricts excessively | Use O as optional filter, not mandatory |
| Comparison Leakage | Searching for "Placebo" misses head-to-head trials | Consider relaxing C block |
| Indexing Lag | Missing new drugs not yet in MeSH | Always include `[tiab]` synonyms |
| The "Prognosis" MeSH Trap | MeSH term Prognosis applied inconsistently | Text words (predict*, outcome*) are mandatory |
| Context Omission | Context rarely in titles | Accept broader screening burden |

### 5.2 Framework-Specific Pitfalls

**CoCoPop:**
- Confusing prevalence (existing cases) with incidence (new cases)
- Inconsistent terminology ("rate," "burden," "proportion")

**PEO:**
- Causality vs. Association - hard to distinguish via query
- Exposure vs. Intervention confusion (e.g., radiation)

**PIRD:**
- DTA searches are notoriously noisy
- Diagnostic studies often indexed as "Therapy" or "Etiology"

**SPIDER:**
- Full SPIDER structure often eliminates relevant papers
- Start with PICO + Qualitative Filter, switch to SPIDER only if volume unmanageable

**CMO/CIMO:**
- Searching for "mechanism" retrieves molecular biology, not social mechanisms
- Use iterative "clustering" approach rather than single Boolean string

### 5.3 Syntax Translation (Ovid to PubMed)

| Ovid | PubMed Equivalent |
|------|-------------------|
| `.mp.` | `[All Fields]` or `[tiab]` for precision |
| `.tw.` | `[tiab]` |
| `exp` | `[mh]` (PubMed auto-explodes; use `:noexp` to prevent) |
| `adjX` | Not natively supported; use phrase searching |

---

## Query Building Template

### Step 1: Identify Framework Components

Based on the research question framework, identify each component.

### Step 2: Expand Each Component

For each component, create a block with:
- MeSH terms `[mh]`
- Text word synonyms `[tiab]`
- Combine with OR

### Step 3: Combine Blocks

Connect blocks with AND.

### Step 4: Apply Methodological Filter

Add appropriate validated hedge.

### Step 5: Apply Limits (Optional)

- Date range: `2020:2025[dp]`
- Language: `english[la]`
- Human: `humans[mh]`

### Example: PICO Query for Heart Failure Telemedicine

**Question:** In elderly heart failure patients, does telemedicine monitoring reduce readmissions?

```
# Population Block
("Heart Failure"[mh] OR "heart failure"[tiab] OR "cardiac failure"[tiab])
AND
("Aged"[mh] OR elderly[tiab] OR "older adult*"[tiab])

# Intervention Block
AND
("Telemedicine"[mh] OR telemedicine[tiab] OR telehealth[tiab]
OR "remote monitoring"[tiab] OR "home monitoring"[tiab])

# Outcome Block (Optional - for precision)
AND
("Patient Readmission"[mh] OR readmission*[tiab] OR rehospitalization[tiab])

# Methodological Filter (RCTs)
AND
((randomized controlled trial[pt] OR controlled clinical trial[pt]
OR randomized[tiab] OR randomly[tiab] OR trial[tiab])
NOT (animals[mh] NOT humans[mh]))
```

---

## Important Limitations

For frameworks like **CIMO, ECLIPSE, and SPICE**, PubMed is often insufficient.

Supplementary databases to recommend:
- **Google Scholar** - Grey literature, dissertations
- **TRIP Database** - Clinical guidelines, evidence summaries
- **Organizational repositories** - WHO, CDC, NHS guidelines
- **CINAHL** - Nursing and allied health
- **PsycINFO** - Psychology and behavioral science
