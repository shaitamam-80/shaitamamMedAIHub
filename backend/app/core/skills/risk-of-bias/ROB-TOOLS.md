# Risk of Bias Tools - Complete Reference

## Tool Selection Matrix

| Study Design | Preferred Tool | Alternative | When to Use Alternative |
|--------------|----------------|-------------|------------------------|
| RCT (parallel) | RoB 2.0 | JBI RCT | JBI systematic reviews |
| RCT (crossover) | RoB 2.0 (crossover variant) | — | — |
| RCT (cluster) | RoB 2.0 (cluster variant) | — | — |
| Non-randomized intervention | ROBINS-I | NOS | Quick assessment |
| Cohort (etiology) | NOS | JBI Cohort | JBI reviews |
| Cohort (prognosis) | QUIPS | NOS | When QUIPS too detailed |
| Case-control | NOS | JBI Case-Control | JBI reviews |
| Cross-sectional (analytical) | JBI Cross-Sectional | AXIS | Alternative validation |
| Prevalence | JBI Prevalence | Hoy et al. | Meta-analysis of prevalence |
| Diagnostic accuracy | QUADAS-2 | JBI Diagnostic | JBI reviews |
| Qualitative | JBI-QARI | CASP Qualitative | Non-JBI reviews |

---

## RoB 2.0 Complete Signaling Questions

### Domain 1: Randomization Process

**1.1 Was the allocation sequence random?**
- Y = Computer-generated, random number table, coin toss
- N = Alternation, date of birth, hospital number
- NI = "Randomized" stated but method not described

**1.2 Was the allocation sequence concealed until participants were enrolled?**
- Y = Central allocation, sealed opaque envelopes, sequentially numbered
- N = Open allocation schedule, alternation
- NI = Concealment not described

**1.3 Did baseline differences suggest a problem with randomization?**
- N = Groups balanced on key prognostic factors
- Y = Imbalance in key prognostic factors suggests failed randomization
- NI = Baseline data not presented

### Domain 2: Deviations from Intended Interventions

#### Effect of Assignment (ITT)

**2.1 Were participants aware of their assigned intervention?**
- Y = Open-label, unblinded
- N = Double-blind with adequate placebo
- NI = Blinding not described

**2.2 Were carers and people delivering interventions aware?**
- Y = Open-label
- N = Double-blind
- NI = Not described

**2.3 [If Y/PY to 2.1 or 2.2] Were there deviations from intended intervention that arose because of the trial context?**
- Y = Differential crossover, co-intervention use
- N = Deviations balanced or minimal
- NA = Blinded trial

**2.4 [If Y/PY to 2.3] Were these deviations likely to affect the outcome?**
- Y = Substantial crossover to effective treatment
- N = Minor deviations unlikely to affect outcome
- NI = Cannot judge impact

**2.5 [If Y/PY to 2.4] Were these deviations balanced between groups?**
- Y = Similar deviations in both groups
- N = Differential deviations
- NI = Not reported

**2.6 Was an appropriate analysis used to estimate the effect of assignment?**
- Y = ITT or modified ITT with adequate justification
- N = Per-protocol only, excludes substantial proportion
- NI = Analysis method not clearly described

### Domain 3: Missing Outcome Data

**3.1 Were data available for all, or nearly all, participants randomized?**
- Y = <5% missing, or >95% data available
- N = Substantial missing data (>5-10%)
- NI = Not reported clearly

**3.2 [If N/PN/NI to 3.1] Is there evidence that result was not biased by missing outcome data?**
- Y = Sensitivity analyses show robust results
- N = No sensitivity analyses or results changed
- NI = Not tested

**3.3 [If N/PN to 3.1] Could missingness depend on true value?**
- Y = Sicker patients dropped out, related to outcome
- N = Missing completely at random
- NI = Reasons for missing not reported

**3.4 [If Y/PY/NI to 3.3] Is it likely that missingness depended on true value?**
- Y = Strong evidence missingness related to outcome
- N = Plausible reasons unrelated to outcome
- NI = Cannot determine

### Domain 4: Measurement of Outcome

**4.1 Was the method of measuring the outcome inappropriate?**
- N = Validated, reliable measurement
- Y = Unvalidated, unreliable
- NI = Method not described

**4.2 Could measurement/ascertainment have differed between groups?**
- N = Same procedures for all
- Y = Different measurement in different groups
- NI = Not described

**4.3 Were outcome assessors aware of intervention received?**
- N = Blinded outcome assessment
- Y = Unblinded assessment
- NI = Not described

**4.4 [If Y/PY/NI to 4.3] Could assessment have been influenced by knowledge of intervention?**
- Y = Subjective outcome, unblinded
- N = Objective outcome (mortality, lab values)
- NI = Cannot determine

**4.5 [If Y/PY/NI to 4.4] Is it likely that assessment was influenced by knowledge of intervention?**
- Y = Evidence of differential assessment
- N = No evidence of influence
- NI = Cannot determine

### Domain 5: Selection of Reported Result

**5.1 Were data analyzed according to pre-specified analysis plan?**
- Y = Registered protocol followed, all outcomes reported
- N = Post-hoc changes, selective reporting
- NI = No protocol/registration available

**5.2 Is numerical result likely selected from multiple outcome measurements?**
- Y = Multiple scales reported for same construct, only some significant
- N = Single measurement per outcome domain
- NI = Cannot determine

**5.3 Is numerical result likely selected from multiple analyses?**
- Y = Multiple adjustment sets, subgroup analyses, only some reported
- N = Single pre-specified analysis
- NI = Cannot determine

---

## ROBINS-I Complete Guidance

### Domain 1: Confounding

**Critical confounders to consider:**
- Age
- Sex
- Disease severity at baseline
- Comorbidities
- Socioeconomic status
- Prior treatment
- Healthcare access

**Questions:**
1. Is confounding expected for this comparison?
2. Were confounding domains measured validly and reliably?
3. Were confounding domains balanced at baseline?
4. Did authors control for confounding using appropriate methods?

**Methods for controlling confounding:**
- Restriction
- Matching
- Stratification
- Regression adjustment
- Propensity score methods
- Instrumental variables

### Domain 2: Selection of Participants

**Questions:**
1. Was selection into the study unrelated to intervention AND outcome?
2. Do start of follow-up and start of intervention coincide for most participants?
3. Were adjustments made for selection effects?

**Common selection bias scenarios:**
- Prevalent user bias (excluding early events)
- Immortal time bias
- Selection based on outcome status

### Domain 3: Classification of Interventions

**Questions:**
1. Were intervention groups clearly defined?
2. Was information used to define intervention groups recorded at baseline?
3. Could classification have been affected by knowledge of outcome?

### Domain 4: Deviations from Intended Interventions

**Questions:**
1. Were there deviations from intended intervention beyond what would occur in usual practice?
2. Were these deviations balanced between groups?
3. Did these deviations affect the outcome?
4. Was appropriate analysis used to account for deviations?

### Domain 5: Missing Data

**Questions:**
1. Were outcome data reasonably complete?
2. Was missingness related to true value of outcome?
3. Were there differences in missingness between groups?
4. Were appropriate methods used to handle missing data?

### Domain 6: Measurement of Outcomes

**Questions:**
1. Could outcome measure have been influenced by knowledge of intervention?
2. Were outcome assessors blinded to intervention status?
3. Were methods of outcome assessment comparable across groups?

### Domain 7: Selection of Reported Result

**Questions:**
1. Was there pre-specified analysis plan?
2. Were reported analyses consistent with pre-specification?
3. Were multiple measurements, time points, or analyses available?

---

## Newcastle-Ottawa Scale - Detailed

### Cohort Studies

**SELECTION**

*S1. Representativeness of exposed cohort*
- (a) Truly representative ⭐
- (b) Somewhat representative ⭐
- (c) Selected group (e.g., volunteers)
- (d) No description

*S2. Selection of non-exposed cohort*
- (a) Drawn from same community ⭐
- (b) Drawn from different source
- (c) No description

*S3. Ascertainment of exposure*
- (a) Secure record (surgical record, etc.) ⭐
- (b) Structured interview ⭐
- (c) Written self-report
- (d) No description

*S4. Demonstration that outcome not present at start*
- (a) Yes ⭐
- (b) No

**COMPARABILITY**

*C1. Comparability based on design/analysis*
- (a) Controls for most important factor ⭐
- (b) Controls for additional factor ⭐

**OUTCOME**

*O1. Assessment of outcome*
- (a) Independent blind assessment ⭐
- (b) Record linkage ⭐
- (c) Self-report
- (d) No description

*O2. Follow-up long enough for outcomes to occur*
- (a) Yes (specify adequate duration) ⭐
- (b) No

*O3. Adequacy of follow-up*
- (a) Complete follow-up, all accounted for ⭐
- (b) Subjects lost unlikely to introduce bias (≤20%) ⭐
- (c) Follow-up rate <80%, no description of lost
- (d) No statement

---

## QUADAS-2 Detailed

### Domain 1: Patient Selection

**Risk of Bias:**
1. Was a consecutive or random sample of patients enrolled? (Y/N/Unclear)
2. Was a case-control design avoided? (Y/N/Unclear)
3. Did the study avoid inappropriate exclusions? (Y/N/Unclear)

**Applicability:** Is there concern that included patients do not match review question?

### Domain 2: Index Test

**Risk of Bias:**
1. Were index test results interpreted without knowledge of reference standard results? (Y/N/Unclear)
2. If threshold was used, was it pre-specified? (Y/N/Unclear)

**Applicability:** Is there concern that index test, its conduct, or interpretation differ from review question?

### Domain 3: Reference Standard

**Risk of Bias:**
1. Is the reference standard likely to correctly classify the target condition? (Y/N/Unclear)
2. Were reference standard results interpreted without knowledge of index test results? (Y/N/Unclear)

**Applicability:** Is there concern that target condition as defined by reference standard does not match review question?

### Domain 4: Flow and Timing

**Risk of Bias:**
1. Was there appropriate interval between index test and reference standard? (Y/N/Unclear)
2. Did all patients receive the same reference standard? (Y/N/Unclear)
3. Were all patients included in analysis? (Y/N/Unclear)

---

## QUIPS (Quality In Prognosis Studies)

### 6 Domains

**1. Study Participation**
- Source population clearly defined?
- Inclusion/exclusion criteria described?
- Adequate participation rate?
- Baseline characteristics described?

**2. Study Attrition**
- Adequate follow-up?
- Reasons for loss described?
- Key characteristics of lost vs. completers compared?
- Appropriate methods for handling attrition?

**3. Prognostic Factor Measurement**
- Valid and reliable measurement?
- Consistent across participants?
- Appropriate handling of continuous variables?
- Minimal missing data?

**4. Outcome Measurement**
- Valid and reliable measurement?
- Consistent across participants?
- Assessors blinded?

**5. Study Confounding**
- Important confounders measured?
- Valid measurement of confounders?
- Appropriate accounting for confounders?

**6. Statistical Analysis and Reporting**
- Sufficient outcome events?
- Appropriate statistical model?
- All pre-specified analyses reported?

---

## JBI Checklist Algorithms

### Cross-Sectional: Interpretation Guide

| Yes Count | No/Unclear Count | Overall Quality |
|-----------|------------------|-----------------|
| 7-8 | 0-1 | Include |
| 5-6 | 2-3 | Include with caution |
| <5 | >3 | Consider excluding |

### Prevalence: Interpretation Guide

| Yes Count | Risk Category |
|-----------|---------------|
| 8-9 | Low risk |
| 6-7 | Moderate risk |
| <6 | High risk |

### Qualitative: Congruity Check

All items 1-5 must be "Yes" for methodological congruity.
Items 6-7 address reflexivity.
Items 8-10 address representation and ethics.

**Minimum for inclusion:** Y on items 1-5 and at least 2 of items 8-10.

---

## Quick Reference Cards

### RoB 2.0 at a Glance

```
┌─────────────────────────────────────────────────────────┐
│                    RoB 2.0 QUICK GUIDE                  │
├─────────────────────────────────────────────────────────┤
│ D1: Randomization    → Sequence + Concealment + Balance │
│ D2: Deviations       → Blinding + Adherence + Analysis  │
│ D3: Missing Data     → Complete? + Sensitive? + Reason? │
│ D4: Measurement      → Valid? + Same? + Blinded?        │
│ D5: Reporting        → Registered? + Pre-specified?     │
├─────────────────────────────────────────────────────────┤
│ Overall = Worst domain (usually)                        │
│ Multiple "Some concerns" → can be "High"                │
└─────────────────────────────────────────────────────────┘
```

### ROBINS-I at a Glance

```
┌─────────────────────────────────────────────────────────┐
│                   ROBINS-I QUICK GUIDE                  │
├─────────────────────────────────────────────────────────┤
│ D1: Confounding      → Identified + Measured + Adjusted │
│ D2: Selection        → Entry criteria + Timing          │
│ D3: Classification   → Defined + Time of assignment     │
│ D4: Deviations       → Protocol adherence               │
│ D5: Missing Data     → Complete + MCAR vs MNAR          │
│ D6: Measurement      → Valid + Blinded + Consistent     │
│ D7: Reporting        → Pre-specified + Selective        │
├─────────────────────────────────────────────────────────┤
│ Low = Equivalent to well-done RCT (rare!)               │
│ Most observational = Moderate at best                   │
└─────────────────────────────────────────────────────────┘
```

### NOS at a Glance

```
┌─────────────────────────────────────────────────────────┐
│                     NOS QUICK GUIDE                     │
├─────────────────────────────────────────────────────────┤
│ SELECTION (4⭐)                                         │
│   Representative + Same source + Valid exposure +       │
│   Outcome-free at start                                 │
│                                                         │
│ COMPARABILITY (2⭐)                                     │
│   Controlled for main confounder +                      │
│   Additional confounder                                 │
│                                                         │
│ OUTCOME (3⭐)                                           │
│   Blinded/record + Adequate duration + <20% lost        │
├─────────────────────────────────────────────────────────┤
│ 7-9⭐ = Low risk   4-6⭐ = Moderate   0-3⭐ = High      │
└─────────────────────────────────────────────────────────┘
```
