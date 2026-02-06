# Project Template - Systematic Review

## Folder Creation Script

When creating a new project, use this structure:

```
systematic-review-[topic]/
│
├── 00-overview/
│   ├── README.md
│   ├── progress.json
│   └── timeline.md
│
├── 01-question/
│   ├── idea.md
│   └── research-question.md
│
├── 02-protocol/
│   ├── protocol.md
│   ├── prisma-p-checklist.md
│   └── prospero-record.md
│
├── 03-search/
│   ├── search-strategy.md
│   ├── search-log.md
│   └── results/
│
├── 04-screening/
│   ├── screening-criteria.md
│   ├── title-abstract/
│   ├── full-text/
│   ├── excluded-studies.md
│   ├── included-studies.md
│   └── prisma-flow.md
│
├── 05-extraction/
│   ├── extraction-form.md
│   ├── forms/
│   └── data-summary.csv
│
├── 06-risk-of-bias/
│   ├── rob-tool-selection.md
│   ├── assessments/
│   ├── rob-summary-table.md
│   └── figures/
│
├── 07-synthesis/
│   ├── synthesis-plan.md
│   ├── meta-analysis/
│   ├── forest-plots/
│   ├── funnel-plots/
│   └── narrative-synthesis.md
│
├── 08-grade/
│   ├── evidence-profiles/
│   ├── sof-table.md
│   └── plain-language.md
│
└── 09-manuscript/
    ├── manuscript.md
    ├── figures/
    ├── tables/
    ├── supplementary/
    ├── prisma-checklist.md
    └── submission/
```

---

## Template Files

### 00-overview/README.md

```markdown
# Systematic Review: [TOPIC]

## Overview

**Title:** [Full descriptive title]
**Type:** [Intervention / Prevalence / Prognosis / Diagnostic / Scoping]
**Framework:** [PICO / CoCoPop / PFO / PCC / etc.]
**Registration:** [PROSPERO ID / OSF / Not yet]

## Research Question

[Structured question here]

## Team

| Role | Name | Email |
|------|------|-------|
| Lead reviewer | | |
| Second reviewer | | |
| Statistician | | |
| Information specialist | | |

## Timeline

| Milestone | Target Date | Status |
|-----------|-------------|--------|
| Protocol registration | | |
| Search completion | | |
| Screening completion | | |
| Data extraction | | |
| Analysis | | |
| Manuscript draft | | |
| Submission | | |

## Quick Links

- [Protocol](./02-protocol/protocol.md)
- [Included Studies](./04-screening/included-studies.md)
- [Summary of Findings](./08-grade/sof-table.md)

## Notes

[Any important notes about the project]
```

### 00-overview/progress.json

```json
{
  "project": {
    "name": "",
    "topic": "",
    "created": "",
    "type": "",
    "framework": ""
  },
  "registration": {
    "registry": "",
    "id": "",
    "date": ""
  },
  "stages": {
    "idea": {
      "status": "pending",
      "started": null,
      "completed": null,
      "notes": ""
    },
    "question": {
      "status": "pending",
      "started": null,
      "completed": null,
      "framework": "",
      "notes": ""
    },
    "protocol": {
      "status": "pending",
      "started": null,
      "completed": null,
      "registered": false,
      "registration_id": "",
      "notes": ""
    },
    "search": {
      "status": "pending",
      "started": null,
      "completed": null,
      "databases": [],
      "total_hits": 0,
      "notes": ""
    },
    "screening": {
      "status": "pending",
      "started": null,
      "completed": null,
      "title_abstract_total": 0,
      "title_abstract_included": 0,
      "full_text_total": 0,
      "full_text_included": 0,
      "notes": ""
    },
    "extraction": {
      "status": "pending",
      "started": null,
      "completed": null,
      "studies_extracted": 0,
      "notes": ""
    },
    "rob": {
      "status": "pending",
      "started": null,
      "completed": null,
      "tool": "",
      "studies_assessed": 0,
      "notes": ""
    },
    "synthesis": {
      "status": "pending",
      "started": null,
      "completed": null,
      "meta_analysis": false,
      "outcomes_analyzed": 0,
      "notes": ""
    },
    "grade": {
      "status": "pending",
      "started": null,
      "completed": null,
      "outcomes_graded": 0,
      "notes": ""
    },
    "manuscript": {
      "status": "pending",
      "started": null,
      "completed": null,
      "target_journal": "",
      "notes": ""
    }
  },
  "current_stage": "idea",
  "last_activity": "",
  "blockers": [],
  "decisions": []
}
```

### 01-question/idea.md

```markdown
# Initial Research Idea

## Date
[Date of initial discussion]

## Raw Idea
[User's original question/idea as stated]

## Clinical/Research Problem
[What problem is being addressed?]

## Why This Review is Needed
[Knowledge gap, conflicting evidence, new interventions, etc.]

## Similar Existing Reviews
| Review | Year | Finding | Gap |
|--------|------|---------|-----|
| | | | |

## Decision
- [ ] Proceed with systematic review
- [ ] Proceed with scoping review
- [ ] Revise question
- [ ] Abandon (review exists)

## Notes
[Any additional notes from initial consultation]
```

### 01-question/research-question.md

```markdown
# Structured Research Question

## Framework: [PICO / CoCoPop / PFO / etc.]

## Components

| Component | Definition | Specific |
|-----------|------------|----------|
| **P** - Population | | |
| **I** - Intervention/Interest | | |
| **C** - Comparator | | |
| **O** - Outcome | | |

## Full Question (User's Language)

[Question in Hebrew/original language]

## Full Question (English)

[Question in English for database searching]

## Review Type
- [ ] Intervention (effectiveness)
- [ ] Prevalence/Incidence
- [ ] Prognosis
- [ ] Diagnostic accuracy
- [ ] Etiology/Risk
- [ ] Qualitative
- [ ] Scoping

## Key Decisions
1. [Decision about scope]
2. [Decision about outcomes]
3. [Decision about study designs]
```

### 04-screening/prisma-flow.md

```markdown
# PRISMA 2020 Flow Diagram Data

## Identification

### From databases and registers
- Records identified from:
  - PubMed (n = )
  - Embase (n = )
  - CENTRAL (n = )
  - Other [specify] (n = )
- Records removed before screening:
  - Duplicate records (n = )
  - Records marked as ineligible by automation tools (n = )
  - Records removed for other reasons (n = )

### From other methods
- Records identified from:
  - Websites (n = )
  - Organizations (n = )
  - Citation searching (n = )
  - Other [specify] (n = )

## Screening

- Records screened (n = )
- Records excluded (n = )

- Reports sought for retrieval (n = )
- Reports not retrieved (n = )

- Reports assessed for eligibility (n = )
- Reports excluded (n = )
  - Reason 1 (n = )
  - Reason 2 (n = )
  - Reason 3 (n = )

## Included

- Studies included in review (n = )
- Reports of included studies (n = )

### Studies included in:
- Qualitative synthesis (n = )
- Meta-analysis (n = )
```

### 08-grade/sof-table.md

```markdown
# Summary of Findings Table

## Review Details

**Patient or population:** [Describe]
**Setting:** [Describe]
**Intervention:** [Describe]
**Comparison:** [Describe]

## Summary of Findings

| Outcomes | Anticipated absolute effects* | Relative effect (95% CI) | № of participants (studies) | Certainty of the evidence (GRADE) | Comments |
|----------|------------------------------|--------------------------|-----------------------------|------------------------------------|----------|
| | Risk with [comparator] | Risk with [intervention] | | | | |
| **[Outcome 1]** | X per 1,000 | Y per 1,000 (Z to W) | RR X.XX (X.XX to X.XX) | N (k RCTs) | ⊕⊕⊕⊕ HIGH | |
| **[Outcome 2]** | | | | | | |
| **[Outcome 3]** | | | | | | |

*The risk in the intervention group (and its 95% confidence interval) is based on the assumed risk in the comparison group and the relative effect of the intervention (and its 95% CI).

**Abbreviations:** CI: confidence interval; RR: risk ratio; MD: mean difference

## GRADE Working Group grades of evidence

- **High certainty:** We are very confident that the true effect lies close to that of the estimate of the effect.
- **Moderate certainty:** We are moderately confident in the effect estimate: the true effect is likely to be close to the estimate of the effect, but there is a possibility that it is substantially different.
- **Low certainty:** Our confidence in the effect estimate is limited: the true effect may be substantially different from the estimate of the effect.
- **Very low certainty:** We have very little confidence in the effect estimate: the true effect is likely to be substantially different from the estimate of effect.

## Explanatory Footnotes

a. [Explanation for downgrade/upgrade]
b. [Explanation for downgrade/upgrade]
```

---

## Bash Commands for Project Creation

```bash
# Create project folder structure
PROJECT_NAME="systematic-review-[topic]"

mkdir -p "$PROJECT_NAME"/{00-overview,01-question,02-protocol,03-search/results,04-screening/{title-abstract,full-text},05-extraction/forms,06-risk-of-bias/{assessments,figures},07-synthesis/{meta-analysis,forest-plots,funnel-plots},08-grade/evidence-profiles,09-manuscript/{figures,tables,supplementary,submission}}

# Create empty files
touch "$PROJECT_NAME/00-overview/"{README.md,progress.json,timeline.md}
touch "$PROJECT_NAME/01-question/"{idea.md,research-question.md}
touch "$PROJECT_NAME/02-protocol/"{protocol.md,prisma-p-checklist.md,prospero-record.md}
touch "$PROJECT_NAME/03-search/"{search-strategy.md,search-log.md}
touch "$PROJECT_NAME/04-screening/"{screening-criteria.md,excluded-studies.md,included-studies.md,prisma-flow.md}
touch "$PROJECT_NAME/05-extraction/"{extraction-form.md,data-summary.csv}
touch "$PROJECT_NAME/06-risk-of-bias/"{rob-tool-selection.md,rob-summary-table.md}
touch "$PROJECT_NAME/07-synthesis/"{synthesis-plan.md,narrative-synthesis.md}
touch "$PROJECT_NAME/08-grade/"{sof-table.md,plain-language.md}
touch "$PROJECT_NAME/09-manuscript/"{manuscript.md,prisma-checklist.md}

echo "Project structure created: $PROJECT_NAME"
```
