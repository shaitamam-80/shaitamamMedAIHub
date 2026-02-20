/**
 * Assembles a PROSPERO-ready protocol Markdown document
 * from structured ProtocolArtifact + upstream artifacts (Idea, RQ).
 *
 * Based on the OUTPUT-TEMPLATES.md template from sr-skills/protocol-builder.
 */

interface EligibilityCriteria {
  population_inclusion?: string[];
  population_exclusion?: string[];
  intervention_inclusion?: string[];
  intervention_exclusion?: string[];
  comparator_inclusion?: string[];
  comparator_exclusion?: string[];
  outcomes_primary?: string[];
  outcomes_secondary?: string[];
  study_designs_included?: string[];
  time_frame?: string;
  language_restrictions?: string;
  setting?: string;
}

interface ProtocolArtifact {
  protocol_text?: string;
  review_type?: string;
  registration_platform?: string;
  eligibility_criteria?: EligibilityCriteria;
  information_sources?: string[];
  search_strategy_draft?: string;
  rob_tool?: string;
  rob_domains?: string[];
  synthesis_method?: string;
  effect_measure?: string;
  completed_sections?: string[];
  approved_tools?: string[];
  tool_declarations?: Record<string, string>;
}

interface IdeaArtifact {
  clinical_problem?: string;
  review_type?: string;
  population_sketch?: string;
  intervention_sketch?: string;
  outcome_sketch?: string;
}

interface RQArtifact {
  framework_type?: string;
  framework_data?: Record<string, string>;
  question_narrow?: string;
  question_broad?: string;
}

interface AllArtifacts {
  protocol?: ProtocolArtifact;
  idea?: IdeaArtifact;
  research_question?: RQArtifact;
}

function bulletList(items: string[] | undefined, fallback = '[To be determined]'): string {
  if (!items || items.length === 0) return `- ${fallback}`;
  return items.map(i => `- ${i}`).join('\n');
}

function field(value: string | undefined, fallback = '[To be determined]'): string {
  return value || fallback;
}

export function assembleProtocolMarkdown(artifacts: AllArtifacts): string {
  const p = artifacts.protocol || {};
  const idea = artifacts.idea || {};
  const rq = artifacts.research_question || {};
  const elig = p.eligibility_criteria || {};

  const today = new Date().toISOString().slice(0, 10);
  const registry = field(p.registration_platform, 'PROSPERO');
  const reviewType = field(
    p.review_type || idea.review_type,
    'Systematic Review'
  ).replace(/_/g, ' ');

  // Build research question from RQ artifact
  const researchQuestion = rq.question_narrow || rq.question_broad || field(idea.clinical_problem);

  // Framework components summary
  let frameworkSummary = '';
  if (rq.framework_type && rq.framework_data) {
    frameworkSummary = Object.entries(rq.framework_data)
      .map(([k, v]) => `**${k}:** ${v}`)
      .join(' | ');
  }

  // Information sources table
  let sourcesTable = '| Database | Platform | Date |\n|----------|----------|------|\n';
  if (p.information_sources && p.information_sources.length > 0) {
    sourcesTable += p.information_sources
      .map(src => `| ${src} | — | [TBD] |`)
      .join('\n');
  } else {
    sourcesTable += '| [TBD] | — | [TBD] |';
  }

  // Study selection section — inject screening tool declaration if approved
  let studySelectionText = '- **Screening:** Dual independent screening of titles/abstracts, followed by full-text review\n- **Conflicts:** Resolved by discussion or third reviewer';
  const screeningDecl = p.tool_declarations?.screening_engine;
  if (screeningDecl) {
    studySelectionText += `\n\n> **AI-Assisted Screening:** ${screeningDecl}`;
  }

  // Data extraction section — inject extraction tool declaration if approved
  let dataExtractionText = '- **Method:** Dual independent extraction using a standardized form';
  const extractionDecl = p.tool_declarations?.extraction_engine;
  if (extractionDecl) {
    dataExtractionText += `\n\n> **AI-Assisted Extraction:** ${extractionDecl}`;
  }

  // Risk of bias section — inject RoB tool declaration if approved
  let robText = `- **Tool:** ${field(p.rob_tool, '[To be determined]')}\n- **Method:** Dual independent assessment`;
  if (p.rob_domains && p.rob_domains.length > 0) {
    robText += `\n- **Domains:** ${p.rob_domains.join(', ')}`;
  }
  const robDecl = p.tool_declarations?.rob_assessor;
  if (robDecl) {
    robText += `\n\n> **AI-Assisted RoB:** ${robDecl}`;
  }

  // Data synthesis section — inject GRADE tool declaration if approved
  let synthesisText = `- **Approach:** ${field(p.synthesis_method, '[To be determined]')}`;
  if (p.effect_measure) {
    synthesisText += `\n- **Effect Measure:** ${p.effect_measure}`;
  }

  // Certainty assessment
  let certaintyText = 'GRADE methodology will be applied to assess the certainty of evidence for all critical outcomes.';
  const gradeDecl = p.tool_declarations?.grade_evaluator;
  if (gradeDecl) {
    certaintyText += `\n\n> **AI-Assisted GRADE:** ${gradeDecl}`;
  }

  // Search assistant declaration (inject into search strategy)
  let searchStrategyText = field(p.search_strategy_draft, '[To be developed after protocol registration]');
  const searchDecl = p.tool_declarations?.search_assistant;
  if (searchDecl) {
    searchStrategyText += `\n\n> **AI-Assisted Search:** ${searchDecl}`;
  }

  // Approved tools summary (for the appendix)
  let toolsSummary = '';
  if (p.approved_tools && p.approved_tools.length > 0) {
    toolsSummary = `\n\n---\n\n## APPENDIX: AI-Assisted Tools\n\nThe following MedAI Hub tools were approved for use in this review:\n\n`;
    toolsSummary += p.approved_tools
      .map(tool => {
        const label = tool.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const decl = p.tool_declarations?.[tool];
        return `### ${label}\n${decl || '[Declaration pending]'}`;
      })
      .join('\n\n');
  }

  return `# SYSTEMATIC REVIEW PROTOCOL

## Registration
- **Registry:** ${registry}
- **ID:** [To be assigned]
- **Date:** ${today}
- **Review Type:** ${reviewType}

---

## 1. ADMINISTRATIVE INFORMATION

### Title
${researchQuestion}

### Registration
${registry} ID: [Pending]

### Authors
| Name | Affiliation | Role | ORCID |
|------|-------------|------|-------|
| [Name] | [Institution] | Lead reviewer | [ORCID] |

### Amendments
Protocol amendments will be documented here with date and rationale.

---

## 2. INTRODUCTION

### Rationale
${field(idea.clinical_problem, '[To be completed — describe the knowledge gap that justifies this review]')}

### Objectives
${researchQuestion}

${frameworkSummary ? `**Framework (${rq.framework_type}):** ${frameworkSummary}` : ''}

---

## 3. METHODS

### Eligibility Criteria

#### Population
- **Inclusion:**
${bulletList(elig.population_inclusion)}
- **Exclusion:**
${bulletList(elig.population_exclusion, 'None specified')}

#### Intervention/Exposure
- **Inclusion:**
${bulletList(elig.intervention_inclusion)}
- **Exclusion:**
${bulletList(elig.intervention_exclusion, 'None specified')}

#### Comparators
- **Inclusion:**
${bulletList(elig.comparator_inclusion, 'Standard care / No intervention')}
- **Exclusion:**
${bulletList(elig.comparator_exclusion, 'None specified')}

#### Outcomes
- **Primary:**
${bulletList(elig.outcomes_primary)}
- **Secondary:**
${bulletList(elig.outcomes_secondary, 'None specified')}

#### Study Designs
${bulletList(elig.study_designs_included)}

${elig.time_frame ? `**Time Frame:** ${elig.time_frame}` : ''}
${elig.language_restrictions ? `**Language:** ${elig.language_restrictions}` : ''}
${elig.setting ? `**Setting:** ${elig.setting}` : ''}

### Information Sources
${sourcesTable}

### Search Strategy
${searchStrategyText}

### Study Selection
${studySelectionText}

### Data Extraction
${dataExtractionText}

### Risk of Bias
${robText}

### Data Synthesis
${synthesisText}

### Certainty Assessment
${certaintyText}

---

## 4. FUNDING & COI

### Funding
[To be completed]

### Conflicts of Interest
[To be completed]

---

## PRISMA-P Checklist
See attached PRISMA-P checklist for compliance verification.
${toolsSummary}
`.trim();
}
