# Systematic Review Master Checklist

## Quick Reference: Stage Completion Criteria

Use this checklist to verify each stage is complete before advancing.

---

## Stage 1: IDEA ✅

### Required
- [ ] Clinical/research problem clearly stated
- [ ] Review type determined (SR vs. Scoping)
- [ ] Existing reviews checked:
  - [ ] PROSPERO searched
  - [ ] Cochrane Library searched
  - [ ] JBI EBP Database searched
- [ ] Decision documented: proceed / revise / abandon

### Deliverables
- [ ] `01-question/idea.md` created

---

## Stage 2: QUESTION ✅

### Required
- [ ] Framework selected and justified
- [ ] All framework components defined:
  - [ ] Population (specific, with in/exclusion)
  - [ ] Intervention/Exposure/Interest
  - [ ] Comparator (if applicable)
  - [ ] Outcome(s) with measurement
- [ ] Question answerable and searchable
- [ ] English translation provided

### Deliverables
- [ ] `01-question/research-question.md` completed
- [ ] Skill used: `/research-question`

---

## Stage 3: PROTOCOL ✅

### Required
- [ ] Title (descriptive, PICO-based)
- [ ] Background/Rationale
- [ ] Objectives
- [ ] Eligibility criteria:
  - [ ] Population criteria
  - [ ] Intervention/Exposure criteria
  - [ ] Comparator criteria (if applicable)
  - [ ] Outcome criteria
  - [ ] Study design criteria
  - [ ] Language restrictions
  - [ ] Date restrictions
- [ ] Information sources (≥2 databases)
- [ ] Search strategy (full for at least one database)
- [ ] Study selection process
- [ ] Data extraction plan
- [ ] Risk of bias tool selected
- [ ] Synthesis plan (narrative + quantitative if appropriate)
- [ ] GRADE plan (for systematic reviews)
- [ ] Team and timeline
- [ ] Funding and COI

### Registration
- [ ] **PROSPERO submitted** (systematic reviews with health outcomes)
- [ ] OR **OSF/INPLASY registered** (scoping reviews)
- [ ] Registration ID recorded

### Deliverables
- [ ] `02-protocol/protocol.md` completed
- [ ] `02-protocol/prisma-p-checklist.md` completed
- [ ] `02-protocol/prospero-record.md` with registration details
- [ ] Skill used: `/protocol-builder`

---

## Stage 4: SEARCH ✅

### Required
- [ ] Searches run in all specified databases:
  - [ ] PubMed/MEDLINE
  - [ ] Embase
  - [ ] CENTRAL
  - [ ] Other: _______
- [ ] Grey literature searched:
  - [ ] Trial registries (ClinicalTrials.gov, ICTRP)
  - [ ] Dissertations
  - [ ] Conference abstracts
- [ ] Supplementary methods:
  - [ ] Reference list checking
  - [ ] Citation tracking
  - [ ] Expert contact
- [ ] All searches documented with:
  - [ ] Full strategy
  - [ ] Date of search
  - [ ] Number of hits

### Results Export
- [ ] Results exported in importable format (MEDLINE, RIS, BibTeX)
- [ ] Total hits recorded

### Deliverables
- [ ] `03-search/search-strategy.md` completed
- [ ] `03-search/search-log.md` completed
- [ ] `03-search/results/` contains exported files
- [ ] Skill used: `/pubmed-query`

---

## Stage 5: SCREENING ✅

### Title/Abstract Screening
- [ ] Screening criteria operationalized
- [ ] Dual independent screening (or justified single)
- [ ] All records screened
- [ ] Conflicts resolved
- [ ] Reasons documented

### Full-Text Screening
- [ ] All potentially eligible full-texts obtained
- [ ] Dual independent screening
- [ ] All records screened
- [ ] Conflicts resolved
- [ ] Reasons for exclusion documented (specific)

### Final List
- [ ] Final included studies list created
- [ ] Multiple reports of same study linked
- [ ] Exclusion reasons tabulated

### PRISMA Flow
- [ ] Identification numbers
- [ ] Screening numbers
- [ ] Eligibility numbers
- [ ] Included numbers
- [ ] Exclusion reasons with counts

### Deliverables
- [ ] `04-screening/screening-criteria.md` completed
- [ ] `04-screening/excluded-studies.md` with reasons
- [ ] `04-screening/included-studies.md` final list
- [ ] `04-screening/prisma-flow.md` data ready
- [ ] Skill used: `/pubmed-screening`

---

## Stage 6: EXTRACTION ✅

### Preparation
- [ ] Extraction form developed
- [ ] Form piloted on 2-3 studies
- [ ] Form revised based on pilot

### Extraction Process
- [ ] Dual independent extraction (recommended)
- [ ] All included studies extracted
- [ ] Discrepancies resolved and documented
- [ ] Authors contacted for missing data (if needed)

### Data Items
- [ ] Study identification (author, year, country)
- [ ] Methods (design, duration, setting)
- [ ] Participants (N, demographics, criteria)
- [ ] Intervention/Exposure details
- [ ] Comparator details
- [ ] Outcomes (definitions, tools, time points)
- [ ] Results (effect estimates, CI, p-values)
- [ ] Funding and COI

### Deliverables
- [ ] `05-extraction/extraction-form.md` template
- [ ] `05-extraction/forms/` individual study forms
- [ ] `05-extraction/data-summary.csv` compiled data
- [ ] Skill used: `/data-extraction`

---

## Stage 7: RISK OF BIAS ✅

### Tool Selection
- [ ] Appropriate tool selected per study design:
  - [ ] RCTs → RoB 2.0
  - [ ] Non-randomized interventions → ROBINS-I
  - [ ] Cohort/Case-control → NOS or JBI
  - [ ] Cross-sectional → JBI
  - [ ] Diagnostic → QUADAS-2
  - [ ] Qualitative → JBI-QARI

### Assessment Process
- [ ] Dual independent assessment
- [ ] Discrepancies resolved
- [ ] Supporting evidence documented

### For Each Study
- [ ] All relevant domains assessed
- [ ] Judgment with justification
- [ ] Overall judgment

### Summary
- [ ] Summary table created
- [ ] Traffic light plot generated
- [ ] Summary bar plot generated (if many studies)

### Deliverables
- [ ] `06-risk-of-bias/rob-tool-selection.md` documented
- [ ] `06-risk-of-bias/assessments/` per-study files
- [ ] `06-risk-of-bias/rob-summary-table.md` completed
- [ ] `06-risk-of-bias/figures/` plots
- [ ] Skill used: `/risk-of-bias`

---

## Stage 8: SYNTHESIS ✅

### Decision to Pool
- [ ] Clinical homogeneity assessed
- [ ] Methodological homogeneity assessed
- [ ] Decision documented: pool / don't pool

### If Meta-Analysis
- [ ] Effect measure selected (RR, OR, MD, SMD)
- [ ] Model selected (fixed/random) with justification
- [ ] Heterogeneity assessed:
  - [ ] I² calculated
  - [ ] τ² calculated
  - [ ] Prediction interval
- [ ] Forest plot generated
- [ ] Subgroup analyses (pre-specified)
- [ ] Sensitivity analyses:
  - [ ] Leave-one-out
  - [ ] Low RoB only
  - [ ] Fixed vs. random comparison
- [ ] Publication bias (if ≥10 studies):
  - [ ] Funnel plot
  - [ ] Egger's test

### If No Meta-Analysis
- [ ] Narrative synthesis completed (SWiM)
- [ ] Tables/figures summarize findings
- [ ] Reasons for not pooling documented

### Deliverables
- [ ] `07-synthesis/synthesis-plan.md` completed
- [ ] `07-synthesis/meta-analysis/` R code and output
- [ ] `07-synthesis/forest-plots/` figures
- [ ] `07-synthesis/funnel-plots/` if applicable
- [ ] `07-synthesis/narrative-synthesis.md` if applicable
- [ ] Skill used: `/meta-analysis`

---

## Stage 9: GRADE ✅

### For Each Critical Outcome
- [ ] Starting certainty assigned (High for RCTs, Low for observational)
- [ ] 5 domains assessed:
  - [ ] Risk of bias
  - [ ] Inconsistency
  - [ ] Indirectness
  - [ ] Imprecision
  - [ ] Publication bias
- [ ] Upgrading factors (observational only):
  - [ ] Large effect
  - [ ] Dose-response
  - [ ] Plausible confounding
- [ ] Final certainty determined
- [ ] Justification documented

### Outputs
- [ ] Evidence profile per outcome
- [ ] Summary of Findings table
- [ ] Plain-language statements

### Deliverables
- [ ] `08-grade/evidence-profiles/` per-outcome files
- [ ] `08-grade/sof-table.md` completed
- [ ] `08-grade/plain-language.md` statements
- [ ] Skill used: `/grade-assessment`

---

## Stage 10: MANUSCRIPT ✅

### Structure (PRISMA 2020)
- [ ] Title (descriptive, indicates SR/MA)
- [ ] Abstract (structured)
- [ ] Introduction:
  - [ ] Background
  - [ ] Rationale
  - [ ] Objectives
- [ ] Methods:
  - [ ] Protocol and registration
  - [ ] Eligibility criteria
  - [ ] Information sources
  - [ ] Search strategy
  - [ ] Study selection
  - [ ] Data extraction
  - [ ] Study risk of bias
  - [ ] Effect measures
  - [ ] Synthesis methods
  - [ ] Certainty assessment
- [ ] Results:
  - [ ] Study selection (PRISMA flow)
  - [ ] Study characteristics
  - [ ] Risk of bias
  - [ ] Results of syntheses
  - [ ] Certainty of evidence
- [ ] Discussion:
  - [ ] Summary of findings
  - [ ] Limitations
  - [ ] Implications
- [ ] Other:
  - [ ] Funding
  - [ ] COI
  - [ ] Data availability

### Figures and Tables
- [ ] PRISMA flow diagram
- [ ] Characteristics of included studies
- [ ] Risk of bias summary
- [ ] Forest plots
- [ ] Summary of Findings table

### Supplementary Materials
- [ ] Full search strategies
- [ ] List of excluded studies with reasons
- [ ] Data extraction forms
- [ ] Additional analyses

### Compliance
- [ ] PRISMA 2020 checklist completed
- [ ] Journal selected
- [ ] Formatted per journal guidelines

### Deliverables
- [ ] `09-manuscript/manuscript.md` completed
- [ ] `09-manuscript/figures/` all figures
- [ ] `09-manuscript/tables/` all tables
- [ ] `09-manuscript/supplementary/` appendices
- [ ] `09-manuscript/prisma-checklist.md` completed
- [ ] `09-manuscript/submission/` journal-ready files
- [ ] Skill used: `/find-journal`

---

## PRISMA 2020 Quick Checklist

### Title
- [ ] Identify as systematic review, meta-analysis, or both

### Abstract
- [ ] Structured summary

### Introduction
- [ ] Rationale
- [ ] Objectives with PICO

### Methods
- [ ] Protocol and registration
- [ ] Eligibility criteria
- [ ] Information sources
- [ ] Search strategy (full for at least one database)
- [ ] Selection process
- [ ] Data collection process
- [ ] Data items
- [ ] Study risk of bias assessment
- [ ] Effect measures
- [ ] Synthesis methods
- [ ] Reporting bias assessment
- [ ] Certainty assessment

### Results
- [ ] Study selection (flow diagram)
- [ ] Study characteristics
- [ ] Risk of bias in studies
- [ ] Results of individual studies
- [ ] Results of syntheses
- [ ] Reporting biases
- [ ] Certainty of evidence

### Discussion
- [ ] Discussion of results
- [ ] Limitations
- [ ] Conclusions

### Other
- [ ] Registration and protocol
- [ ] Support and funding
- [ ] Competing interests
- [ ] Availability of data

---

## Common Issues Checklist

### Protocol Deviations
- [ ] All deviations documented
- [ ] Justification provided
- [ ] Impact on results discussed

### Missing Data
- [ ] Documented which studies had missing data
- [ ] Authors contacted
- [ ] Impact on analysis discussed

### Heterogeneity
- [ ] Sources investigated
- [ ] Subgroup analyses performed
- [ ] Clinical implications discussed

### Publication Bias
- [ ] Assessed (if ≥10 studies)
- [ ] Impact discussed
- [ ] Mitigation strategies (comprehensive search)
