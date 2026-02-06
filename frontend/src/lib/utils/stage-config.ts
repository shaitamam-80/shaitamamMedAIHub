/**
 * Stage configuration for the systematic review pipeline.
 * Maps each of the 10 stages to its skill, AI model, and metadata.
 */

export type StageName =
  | 'idea'
  | 'question'
  | 'protocol'
  | 'search'
  | 'screening'
  | 'extraction'
  | 'rob'
  | 'synthesis'
  | 'grade'
  | 'manuscript';

export type ReviewType =
  | 'systematic_intervention'
  | 'systematic_prevalence'
  | 'systematic_prognosis'
  | 'systematic_diagnostic'
  | 'systematic_qualitative'
  | 'scoping';

export type GeminiModel = 'gemini-2.0-flash' | 'gemini-2.0-pro';

export interface StageConfig {
  name: { he: string; en: string };
  description: { he: string; en: string };
  icon: string; // lucide-react icon name
  skillName: string;
  knowledgeBases?: string[];
  geminiModel: GeminiModel;
  order: number;
  acceptsUploads?: string[];
  expectedArtifacts: string[];
  slug: StageName;
}

export const STAGES: Record<StageName, StageConfig> = {
  idea: {
    name: { he: 'רעיון', en: 'Idea' },
    description: {
      he: 'תיאור הרעיון הראשוני למחקר',
      en: 'Describe your initial research idea',
    },
    icon: 'Lightbulb',
    skillName: 'systematic-review',
    geminiModel: 'gemini-2.0-flash',
    order: 0,
    expectedArtifacts: ['idea.md'],
    slug: 'idea',
  },
  question: {
    name: { he: 'שאלת מחקר', en: 'Research Question' },
    description: {
      he: 'גיבוש שאלת מחקר מובנית לפי Framework מתאים',
      en: 'Formulate a structured research question using the appropriate framework',
    },
    icon: 'HelpCircle',
    skillName: 'research-question',
    knowledgeBases: ['KNOWLEDGE-BASE.md', 'PUBMED-SEARCH.md'],
    geminiModel: 'gemini-2.0-pro',
    order: 1,
    expectedArtifacts: ['research-question.md'],
    slug: 'question',
  },
  protocol: {
    name: { he: 'פרוטוקול', en: 'Protocol' },
    description: {
      he: 'בניית פרוטוקול מוכן לרישום ב-PROSPERO',
      en: 'Build a PROSPERO-ready protocol',
    },
    icon: 'FileText',
    skillName: 'protocol-builder',
    knowledgeBases: ['KNOWLEDGE-BASE.md'],
    geminiModel: 'gemini-2.0-pro',
    order: 2,
    expectedArtifacts: ['protocol.md', 'prisma-p-checklist.md', 'prospero-fields.txt'],
    slug: 'protocol',
  },
  search: {
    name: { he: 'חיפוש', en: 'Search' },
    description: {
      he: 'בניית שאילתת חיפוש מדויקת ל-PubMed',
      en: 'Build a precise PubMed search query',
    },
    icon: 'Search',
    skillName: 'pubmed-query',
    geminiModel: 'gemini-2.0-pro',
    order: 3,
    expectedArtifacts: ['search-strategy.md', 'pubmed-query.txt', 'search-blocks.md'],
    slug: 'search',
  },
  screening: {
    name: { he: 'סינון', en: 'Screening' },
    description: {
      he: 'סינון תקצירים לפי קריטריוני הכללה/הדרה',
      en: 'Screen abstracts against inclusion/exclusion criteria',
    },
    icon: 'Filter',
    skillName: 'pubmed-screening',
    geminiModel: 'gemini-2.0-pro',
    order: 4,
    acceptsUploads: ['.nbib', '.medline', '.txt'],
    expectedArtifacts: [
      'screening-results.csv',
      'screening-summary.md',
      'included-studies.md',
      'excluded-studies.md',
      'prisma-flow-data.md',
    ],
    slug: 'screening',
  },
  extraction: {
    name: { he: 'מיצוי נתונים', en: 'Data Extraction' },
    description: {
      he: 'מיצוי נתונים מובנה מהמחקרים שנכללו',
      en: 'Structured data extraction from included studies',
    },
    icon: 'Database',
    skillName: 'data-extraction',
    knowledgeBases: ['EXTRACTION-TEMPLATES.md'],
    geminiModel: 'gemini-2.0-pro',
    order: 5,
    acceptsUploads: ['.pdf'],
    expectedArtifacts: [
      'extraction-summary.csv',
      'meta-analysis-data.csv',
      'characteristics-table.md',
      'extraction-codebook.md',
    ],
    slug: 'extraction',
  },
  rob: {
    name: { he: 'סיכון להטיה', en: 'Risk of Bias' },
    description: {
      he: 'הערכת סיכון להטיה בכלי מתאים לסוג המחקר',
      en: 'Risk of bias assessment using the appropriate tool',
    },
    icon: 'Scale',
    skillName: 'risk-of-bias',
    knowledgeBases: ['ROB-TOOLS.md'],
    geminiModel: 'gemini-2.0-pro',
    order: 6,
    acceptsUploads: ['.pdf'],
    expectedArtifacts: [
      'rob-summary-table.md',
      'robvis-data.csv',
      'rob-justifications.md',
    ],
    slug: 'rob',
  },
  synthesis: {
    name: { he: 'סינתזה', en: 'Synthesis' },
    description: {
      he: 'מטה-אנליזה או סינתזה נרטיבית',
      en: 'Meta-analysis or narrative synthesis',
    },
    icon: 'BarChart3',
    skillName: 'meta-analysis',
    knowledgeBases: ['FORMULAS.md'],
    geminiModel: 'gemini-2.0-pro',
    order: 7,
    expectedArtifacts: [
      'meta-analysis-plan.md',
      'meta-analysis-code.R',
      'meta-analysis-results.md',
      'forest-plot-code.R',
    ],
    slug: 'synthesis',
  },
  grade: {
    name: { he: 'GRADE', en: 'GRADE' },
    description: {
      he: 'הערכת ודאות הראיות לפי מתודולוגיית GRADE',
      en: 'Certainty of evidence assessment using GRADE methodology',
    },
    icon: 'Star',
    skillName: 'grade-assessment',
    geminiModel: 'gemini-2.0-pro',
    order: 8,
    expectedArtifacts: [
      'sof-table.md',
      'sof-table.html',
      'plain-language-statements.md',
      'grade-summary.csv',
    ],
    slug: 'grade',
  },
  manuscript: {
    name: { he: 'מאמר', en: 'Manuscript' },
    description: {
      he: 'כתיבת מאמר מוכן לפרסום בהתאם ל-PRISMA 2020',
      en: 'Write a publication-ready PRISMA 2020 compliant manuscript',
    },
    icon: 'PenTool',
    skillName: 'manuscript-writer',
    geminiModel: 'gemini-2.0-pro',
    order: 9,
    expectedArtifacts: [
      'manuscript.md',
      'prisma-checklist.md',
      'cover-letter.md',
    ],
    slug: 'manuscript',
  },
};

/** Ordered array of stages for rendering pipelines */
export const STAGE_ORDER: StageName[] = [
  'idea',
  'question',
  'protocol',
  'search',
  'screening',
  'extraction',
  'rob',
  'synthesis',
  'grade',
  'manuscript',
];

/** Standalone tools (not project-bound) */
export const STANDALONE_TOOLS = {
  'article-appraisal': {
    name: { he: 'הערכת מאמר', en: 'Article Appraisal' },
    description: {
      he: 'הערכה ביקורתית מובנית של מאמר קליני',
      en: 'Structured critical appraisal of a clinical paper',
    },
    icon: 'FileSearch',
    skillName: 'article-appraisal',
    geminiModel: 'gemini-2.0-pro' as GeminiModel,
    acceptsUploads: ['.pdf', '.txt'],
  },
  'find-journal': {
    name: { he: 'חיפוש כתב-עת', en: 'Find Journal' },
    description: {
      he: 'זיהוי כתבי-עת מתאימים לפרסום',
      en: 'Identify suitable journals for publication',
    },
    icon: 'BookOpen',
    skillName: 'find-journal',
    geminiModel: 'gemini-2.0-flash' as GeminiModel,
  },
} as const;

/** Review type labels */
export const REVIEW_TYPES: Record<ReviewType, { he: string; en: string }> = {
  systematic_intervention: { he: 'סקירה שיטתית - התערבות', en: 'Systematic Review - Intervention' },
  systematic_prevalence: { he: 'סקירה שיטתית - שכיחות', en: 'Systematic Review - Prevalence' },
  systematic_prognosis: { he: 'סקירה שיטתית - פרוגנוזה', en: 'Systematic Review - Prognosis' },
  systematic_diagnostic: { he: 'סקירה שיטתית - אבחנה', en: 'Systematic Review - Diagnostic' },
  systematic_qualitative: { he: 'סקירה שיטתית - איכותנית', en: 'Systematic Review - Qualitative' },
  scoping: { he: 'סקירת Scoping', en: 'Scoping Review' },
};

/** Framework labels */
export const FRAMEWORKS: Record<string, { he: string; en: string; forTypes: ReviewType[] }> = {
  PICO: { he: 'PICO', en: 'PICO', forTypes: ['systematic_intervention'] },
  PICOT: { he: 'PICOT', en: 'PICOT', forTypes: ['systematic_intervention'] },
  PICOS: { he: 'PICOS', en: 'PICOS', forTypes: ['systematic_intervention'] },
  CoCoPop: { he: 'CoCoPop', en: 'CoCoPop', forTypes: ['systematic_prevalence'] },
  PFO: { he: 'PFO', en: 'PFO', forTypes: ['systematic_prognosis'] },
  PEO: { he: 'PEO', en: 'PEO', forTypes: ['systematic_prognosis'] },
  PECO: { he: 'PECO', en: 'PECO', forTypes: ['systematic_prognosis'] },
  PIRD: { he: 'PIRD', en: 'PIRD', forTypes: ['systematic_diagnostic'] },
  PICo: { he: 'PICo', en: 'PICo', forTypes: ['systematic_qualitative'] },
  SPIDER: { he: 'SPIDER', en: 'SPIDER', forTypes: ['systematic_qualitative'] },
  PCC: { he: 'PCC', en: 'PCC', forTypes: ['scoping'] },
  SPICE: { he: 'SPICE', en: 'SPICE', forTypes: ['scoping'] },
  ECLIPSE: { he: 'ECLIPSE', en: 'ECLIPSE', forTypes: ['scoping'] },
  CMO: { he: 'CMO', en: 'CMO', forTypes: ['scoping'] },
  PerSPEcTiF: { he: 'PerSPEcTiF', en: 'PerSPEcTiF', forTypes: ['systematic_intervention', 'systematic_qualitative'] },
  BeHEMoTh: { he: 'BeHEMoTh', en: 'BeHEMoTh', forTypes: ['scoping'] },
};
