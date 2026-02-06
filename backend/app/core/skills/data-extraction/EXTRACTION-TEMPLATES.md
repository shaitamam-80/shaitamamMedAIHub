# Data Extraction Templates - Quick Reference

## Template Selection Guide

| Review Type | Study Design | Template | Key Fields |
|-------------|--------------|----------|------------|
| Intervention | RCT | Template A | N, Mean, SD, Events, Effect estimate |
| Intervention | Non-RCT | Template A (modified) | + Confounding control |
| Prevalence | Cross-sectional | Template B | N, Cases, Prevalence, 95% CI |
| Prognosis | Cohort | Template C | Exposure, Events, HR/RR, Adjustment |
| Etiology | Case-control | Template C (modified) | OR, Matching variables |
| Qualitative | Any | Template D | Findings, Illustrations, Credibility |

---

## Quick Extraction Checklist

### Before Starting
- [ ] Confirm study meets inclusion criteria
- [ ] Identify study design correctly
- [ ] Check for multiple publications of same study
- [ ] Locate supplementary materials

### During Extraction
- [ ] Use exact numbers from tables (not rounded from text)
- [ ] Record page/table/figure for each data point
- [ ] Flag any calculated values
- [ ] Note discrepancies between text and tables
- [ ] Extract ITT data preferentially

### After Extraction
- [ ] Verify N adds up correctly
- [ ] Check effect direction is consistent
- [ ] Confirm all primary outcomes extracted
- [ ] Document any contacted authors

---

## Minimal Data for Meta-Analysis

### Continuous Outcomes
**Required:** N, Mean, SD (per group)

**Can calculate SD from:**
- SE: `SD = SE × √N`
- 95% CI: `SD = √N × (Upper - Lower) / 3.92`
- IQR: `SD ≈ IQR / 1.35`
- Range: `SD ≈ Range / 4` (N<70) or `Range / 6` (N>70)
- t-statistic: `SD = |Mean₁ - Mean₂| / (t × √(1/n₁ + 1/n₂))`
- p-value: Convert to t, then to SD

### Binary Outcomes
**Required:** Events and Total N (per group)

**From percentages:**
- Events = Percentage × N / 100
- Round to nearest integer

### Time-to-Event Outcomes
**Required:** HR (or log HR) and SE (or 95% CI)

**SE from CI:**
- `SE = (ln(Upper) - ln(Lower)) / 3.92`

---

## Common Measurement Tools Reference

### Depression
| Tool | Range | MCID | Higher = |
|------|-------|------|----------|
| PHQ-9 | 0-27 | 5 points | Worse |
| BDI-II | 0-63 | 5-8 points | Worse |
| HDRS-17 | 0-52 | 3-4 points | Worse |
| MADRS | 0-60 | 2 points | Worse |

### Anxiety
| Tool | Range | MCID | Higher = |
|------|-------|------|----------|
| GAD-7 | 0-21 | 4 points | Worse |
| HARS | 0-56 | 4 points | Worse |
| STAI | 20-80 | 8-10 points | Worse |

### Pain
| Tool | Range | MCID | Higher = |
|------|-------|------|----------|
| VAS | 0-100 | 10-20 mm | Worse |
| NRS | 0-10 | 1-2 points | Worse |
| McGill | 0-78 | 5 points | Worse |

### Quality of Life
| Tool | Range | MCID | Higher = |
|------|-------|------|----------|
| SF-36 PCS/MCS | 0-100 | 3-5 points | Better |
| EQ-5D | -0.5 to 1 | 0.05-0.08 | Better |
| WHOQOL-BREF | 0-100 | 5 points | Better |

### Function/Disability
| Tool | Range | MCID | Higher = |
|------|-------|------|----------|
| ODI | 0-100 | 10 points | Worse |
| RMDQ | 0-24 | 3-5 points | Worse |
| WOMAC | 0-96 | 10% | Worse |

---

## Effect Direction Standardization

### Rule: Always code so NEGATIVE = Favors Intervention

**For outcomes where higher = worse (pain, depression):**
- Calculate: Intervention - Control
- Negative MD means intervention reduced symptoms ✓

**For outcomes where higher = better (QoL, function):**
- Calculate: Intervention - Control
- Positive MD means intervention improved outcomes
- **Multiply by -1** to standardize direction

### Example
```
Study A: Pain VAS (higher = worse)
  Intervention: 40, Control: 55
  MD = 40 - 55 = -15 (favors intervention) ✓

Study B: SF-36 (higher = better)
  Intervention: 70, Control: 60
  MD = 70 - 60 = +10 (favors intervention)
  Standardized: -10 (so negative still favors intervention) ✓
```

---

## Handling Specific Scenarios

### Multiple Arms
**3-arm trial (A vs B vs C) for A vs C comparison:**
- Extract A and C only
- Do NOT double-count shared control

**If need A vs B AND A vs C:**
- Split control group: N_A₁ = N_A/2
- Or use network meta-analysis

### Multiple Time Points
**Extract all, but note which is:**
- [ ] End of treatment
- [ ] Primary time point (per protocol)
- [ ] Longest follow-up

### Cluster RCTs
**Adjust N for clustering:**
```
N_adjusted = N / Design Effect
Design Effect = 1 + (m-1) × ICC
```
Where m = average cluster size, ICC = intraclass correlation

If ICC not reported, use typical values:
- Clinical outcomes: ICC ≈ 0.02-0.05
- Process outcomes: ICC ≈ 0.05-0.10

### Crossover Trials
**Preferred:** Extract paired analysis (MD with SE)

**If only per-period data:**
- Use first period only, OR
- Calculate correlation from crossover design

### Medians and IQRs
**For meta-analysis requiring means/SDs:**

If N > 25 and distribution likely normal:
```
Mean ≈ Median
SD ≈ IQR / 1.35
```

If skewed, consider:
- Reporting medians separately (narrative)
- Using transformation (log scale)
- Wan et al. (2014) formulas

---

## CSV Export Format

### For RevMan/metafor (Continuous)
```csv
study_id,year,n1,mean1,sd1,n2,mean2,sd2
Smith,2023,50,45.2,12.3,48,52.1,11.8
Chen,2022,120,3.2,1.1,118,4.1,1.3
```

### For RevMan/metafor (Binary)
```csv
study_id,year,events1,n1,events2,n2
Smith,2023,25,50,15,48
Chen,2022,40,120,55,118
```

### For Generic Inverse Variance
```csv
study_id,year,yi,sei
Smith,2023,-0.288,0.089
Chen,2022,-0.421,0.112
```

---

## Author Contact Template

```
Subject: Data request for systematic review - [Study citation]

Dear Dr. [Author],

We are conducting a systematic review on [topic] and your study
"[Title]" (published in [Journal], [Year]) meets our inclusion criteria.

We would be grateful if you could provide the following information
that was not reported in the published article:

1. [Specific data request - e.g., "Standard deviation for the
   primary outcome (PHQ-9 at 8 weeks)"]
2. [Additional request if needed]

This information will help us include your important study in our
quantitative synthesis.

If the data are not available, please let us know and we will note
this in our review.

Thank you for your time and contribution to evidence synthesis.

Best regards,
[Your name]
[Your affiliation]
[Contact information]

PROSPERO registration: [Number, if applicable]
```

---

## Quality Checks Before Export

### Numerical Consistency
- [ ] N (intervention) + N (control) = N (total)
- [ ] Events ≤ N in each group
- [ ] Percentages recalculated correctly
- [ ] CIs contain point estimate

### Logical Consistency
- [ ] Effect direction matches raw data
- [ ] p-value corresponds to CI (significant if CI excludes null)
- [ ] Larger N → narrower CI (generally)

### Completeness
- [ ] All included studies have primary outcome
- [ ] Missing data flagged, not left blank
- [ ] Source (page/table) documented for each value
