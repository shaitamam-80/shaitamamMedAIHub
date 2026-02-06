# GEMS Knowledge Base - Methodological Criteria Library

## 📚 1. Path Matrix (v3.1)

| Review Type | Primary Goal | Key Study Types | Automated Exclusions |
|-------------|--------------|-----------------|---------------------|
| 1. Systematic Review | Answer specific PICO question | Primary Studies (RCTs, Cohort, Case-Control) | Reviews, Case Reports, Opinions, Animal |
| 2. Scoping Review | Map all existing literature | Everything (Incl. Reviews, Case Reports) | Duplicates, Retracted only |
| 3. Quick Answer | Rapid summary of strongest evidence | Strong Evidence (SR, MA, RCTs) | Weak evidence, Non-Peer Reviewed |

---

## 📊 2. Statistics from Experience

| Criterion | Avg. Use % | Effect on Reduction |
|-----------|-----------|---------------------|
| Human studies only | 95% | Reduces 15-25% |
| Animal/in-vitro exclusion | 92% | Reduces 10-20% |
| Letter/editorial exclusion | 88% | Reduces 5-15% |
| RCTs only | 45% | Reduces 50-70% |
| English only | 75% | Reduces 10-30% |
| Last 10 years | 60% | Reduces 30-50% |

---

## 🧩 3. PICOS Framework

### P - Population

| Code | Criterion | Definition | When to Use |
|------|-----------|------------|-------------|
| P1 | Adults (18+) | Main population is adults | Most clinical studies |
| P2 | Children (0-18) | Main population is children | Pediatric studies |
| P3 | Women only | Studies specific to women | Gynecology, breast cancer |
| P4 | Men only | Studies specific to men | Urology, prostate cancer |
| P5 | All ages | No age restrictions | Broad reviews |
| P-Ex1 | Exclude Pediatrics | Exclude pediatric studies | Adults-only questions |
| P-Ex2 | Exclude Geriatrics | Exclude 65+ studies | Younger adults questions |
| P-Ex3 | Exclude Pregnant | Exclude pregnancy studies | Contraindicated drugs |

### I - Intervention

| Code | Criterion | Definition | When to Use |
|------|-----------|------------|-------------|
| I1 | Mention Entity 1 | Drug/intervention must appear | Almost always |
| I2 | Mention Entity 2 | Outcome/population must appear | Almost always |
| I3 | Mention Both | Both entities must appear | Specific questions |
| I4 | One Sufficient | Either entity sufficient | Broad reviews |
| I-Ex1 | Exclude Surgical | Exclude surgical procedures | Drug therapy only |

### C - Comparator

| Code | Criterion | Definition | When to Use |
|------|-----------|------------|-------------|
| C1 | Requires Control | Must have comparison group | Systematic reviews |
| C2 | Requires Placebo | Comparison to placebo | Absolute efficacy |
| C3 | Requires Active | Comparison to another treatment | "What is better" questions |

### O - Outcome

| Code | Criterion | Definition | When to Use |
|------|-----------|------------|-------------|
| O1 | Quantitative | Requires p-values, effect sizes | Mandatory for MA |
| O2 | Accepts Qualitative | Accepts interviews, focus groups | Mixed-Methods |
| O3 | Min Follow-up | Requires minimum follow-up time | Long-term outcomes |
| O-Ex1 | Exclude Diagnostics | Exclude diagnostic studies | Treatment/prognosis only |

### S - Study Design

| Code | Criterion | Definition | When to Use |
|------|-----------|------------|-------------|
| S1 | Human Only | Excludes animal/in-vitro | Almost always |
| S2 | RCTs Only | Only RCTs | Gold standard efficacy |
| S3 | Clinical Studies | RCT, Cohort, Case-Control | Most systematic reviews |
| S4 | Include SR | Include systematic reviews | Scoping, Quick Answer |
| S5 | Include Case Reports | Include case reports | Scoping reviews |
| S-Ex1 | Exclude Animal | Exclude animal/in-vitro | Almost always |
| S-Ex2 | Exclude Letters | Exclude letters to editor | Basic Quality Pack |
| S-Ex3 | Exclude Editorials | Exclude opinion pieces | Basic Quality Pack |
| S-Ex4 | Exclude Conference | Exclude conference abstracts | Lack of detail |
| S-Ex5 | Exclude Narrative | Exclude non-systematic reviews | Want primary studies |
| S-Ex6a | Exclude Case Reports | Exclude n=1 reports | Weak evidence |
| S-Ex6b | Exclude Case Series | Exclude n<10 series | Weak evidence |
| S-Ex9 | Exclude Non-Peer | Exclude preprints | Basic Quality Pack |
| S-Ex10 | Exclude Retracted | Exclude withdrawn articles | **MANDATORY** |
| S-Ex11 | Exclude Duplicates | Exclude duplicate pubs | **MANDATORY** |

---

## 🔬 4. Path-Specific Strategies

### Path 1: Systematic Review

**Goal:** Select only high-quality Primary Studies

**Two-Stage Approach:**
1. **Stage 1 (Rule-based):** Auto-remove non-primary studies
2. **Stage 2 (AI):** Deep analysis of remaining

**Automated Stage 1 Exclusions:**
- Systematic Reviews and Meta-Analyses
- Narrative Reviews and Book Chapters
- Case Reports and Case Series
- Opinion pieces, Letters, Editorials
- Animal and In-vitro studies

**Common Inclusion:** RCTs only OR RCTs + Cohort

### Path 2: Scoping Review

**Goal:** Map ALL existing literature

**Single-Stage Approach:**
- Direct AI analysis of everything
- Classify by study type
- Identify gaps

**Automated Exclusions (minimal):**
- Retracted articles only
- Duplicates only

**Common Inclusion:** Everything relevant to topic

### Path 3: Quick Clinical Answer

**Goal:** Strongest, most current evidence

**AI + Synthesis Approach:**
1. **Stage 1:** AI analysis prioritizing strong evidence
2. **Stage 2:** Synthesize findings into summary

**Priority Order:**
1. Systematic Reviews / Meta-Analyses
2. RCTs
3. Observational studies
4. Other

**Automated Exclusions:**
- Non-peer reviewed
- Weak evidence (if strong exists)

---

## ⛔ 5. Basic Quality Pack

Default exclusions for most reviews:

| Item | Reason |
|------|--------|
| Letters to editor | Not full research |
| Editorials/Opinions | Opinion, not data |
| Non-peer reviewed | No quality control |
| Retracted articles | Invalid |
| Duplicates | Redundant |

---

## 📄 6. MEDLINE Parsing Reference

### Field Tags

| Tag | Field | Required |
|-----|-------|----------|
| PMID | PubMed ID | ✅ YES |
| TI | Title | ✅ YES |
| AB | Abstract | ✅ YES |
| SO | Source | ✅ YES |
| PT | Publication Type | For filtering |
| AU/FAU | Authors | Optional |
| DP | Date Published | For date filters |
| LA | Language | For language filters |
| MH | MeSH Terms | For entity matching |
| JT/TA | Journal | Optional |

### Publication Types (PT)

| Value | Category |
|-------|----------|
| Journal Article | Primary |
| Review | Secondary |
| Systematic Review | Secondary |
| Meta-Analysis | Secondary |
| Case Reports | Weak evidence |
| Editorial | Opinion |
| Letter | Opinion |
| Randomized Controlled Trial | Strong primary |

### Multi-line Handling

```
TI  - This is a title that spans
      multiple lines with 6-space indent
```

- Continuation lines start with exactly 6 spaces
- Concatenate with space between

### Parsing Pseudocode

```python
abstracts = []
current = []

for line in file:
    if line.strip() == "":
        continue
    elif line.startswith("PMID-"):
        if current:
            abstracts.append(current)
        current = [line]
    else:
        current.append(line)

if current:
    abstracts.append(current)
```

---

## ✅ 7. Quality Checklist

Before processing:
- [ ] User acknowledged limitations
- [ ] File ≤ 100 abstracts
- [ ] Research question (PICO) confirmed
- [ ] Review type selected (1/2/3)
- [ ] Inclusion criteria confirmed
- [ ] Exclusion criteria confirmed
- [ ] Processing method matches review type

For results:
- [ ] All YES decisions have evidence quotes
- [ ] Human review emphasized
- [ ] UNCLEAR cases flagged
- [ ] PubMed links included
- [ ] CSV export offered

---

## 🔗 8. PubMed Link Format

```
https://pubmed.ncbi.nlm.nih.gov/{PMID}/
```

Example: `https://pubmed.ncbi.nlm.nih.gov/32286648/`
