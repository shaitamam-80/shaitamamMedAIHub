/**
 * Tool & Stage configuration for MedAI Hub.
 * Defines all 13 tools: 9 pipeline stages + 4 standalone tools.
 * Each tool has bilingual metadata, category, slug, and long descriptions.
 */

// ── Types ──────────────────────────────────────────────────────────

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

export type StandaloneToolName =
  | 'article-appraisal'
  | 'find-journal'
  | 'retrospective-audit'
  | 'systematic-review';

export type ToolSlug = StageName | StandaloneToolName;

export type ToolCategory = 'pipeline' | 'standalone';

export type ReviewType =
  | 'systematic_intervention'
  | 'systematic_prevalence'
  | 'systematic_prognosis'
  | 'systematic_diagnostic'
  | 'systematic_qualitative'
  | 'scoping';

export type GeminiModel = 'gemini-2.0-flash' | 'gemini-2.0-pro';

export interface ToolConfig {
  name: { he: string; en: string };
  description: { he: string; en: string };
  longDescription: { he: string; en: string };
  icon: string; // lucide-react icon name
  skillName: string;
  geminiModel: GeminiModel;
  slug: ToolSlug;
  category: ToolCategory;
  order: number;
  /** Only for pipeline stages */
  knowledgeBases?: string[];
  acceptsUploads?: string[];
  expectedArtifacts?: string[];
}

/** Backward-compatible type alias */
export type StageConfig = ToolConfig;

// ── Pipeline Stages (9 tools) ──────────────────────────────────────

export const STAGES: Record<StageName, ToolConfig> = {
  idea: {
    name: { he: 'רעיון מחקרי', en: 'Research Idea' },
    description: {
      he: 'תיאור הרעיון הראשוני למחקר',
      en: 'Describe your initial research idea',
    },
    longDescription: {
      he: 'נקודת ההתחלה של כל סקירה שיטתית. תאר את הרעיון המחקרי שלך בשפה חופשית, והמערכת תסייע לך לזהות את סוג הסקירה המתאים, Framework מתאים, ופערים בידע הקיים.',
      en: 'The starting point for every systematic review. Describe your research idea in free text, and the system will help you identify the appropriate review type, framework, and gaps in existing knowledge.',
    },
    icon: 'Lightbulb',
    skillName: 'systematic-review',
    geminiModel: 'gemini-2.0-flash',
    order: 0,
    category: 'pipeline',
    expectedArtifacts: ['idea.md'],
    slug: 'idea',
  },
  question: {
    name: { he: 'שאלת מחקר', en: 'Research Question' },
    description: {
      he: 'גיבוש שאלת מחקר מובנית',
      en: 'Formulate a structured research question',
    },
    longDescription: {
      he: 'גיבוש שאלת מחקר מובנית באמצעות Framework מותאם (PICO, CoCoPop, PFO, SPIDER ועוד). המערכת מנתחת את סוג המחקר ומציעה את המסגרת האופטימלית.',
      en: 'Formulate a structured research question using an appropriate framework (PICO, CoCoPop, PFO, SPIDER, etc.). The system analyzes your research type and suggests the optimal framework.',
    },
    icon: 'HelpCircle',
    skillName: 'research-question',
    knowledgeBases: ['KNOWLEDGE-BASE.md', 'PUBMED-SEARCH.md'],
    geminiModel: 'gemini-2.0-pro',
    order: 1,
    category: 'pipeline',
    expectedArtifacts: ['research-question.md'],
    slug: 'question',
  },
  protocol: {
    name: { he: 'פרוטוקול', en: 'Protocol' },
    description: {
      he: 'בניית פרוטוקול מוכן לרישום',
      en: 'Build a registration-ready protocol',
    },
    longDescription: {
      he: 'בניית פרוטוקול מלא מוכן לרישום ב-PROSPERO. כולל את כל השדות הנדרשים, PRISMA-P Checklist, ותאימות למדריכי Cochrane.',
      en: 'Build a complete PROSPERO-ready protocol. Includes all required fields, PRISMA-P Checklist, and Cochrane guideline compliance.',
    },
    icon: 'FileText',
    skillName: 'protocol-builder',
    knowledgeBases: ['KNOWLEDGE-BASE.md'],
    geminiModel: 'gemini-2.0-pro',
    order: 2,
    category: 'pipeline',
    expectedArtifacts: ['protocol.md', 'prisma-p-checklist.md', 'prospero-fields.txt'],
    slug: 'protocol',
  },
  search: {
    name: { he: 'חיפוש PubMed', en: 'PubMed Search' },
    description: {
      he: 'בניית שאילתת חיפוש מדויקת',
      en: 'Build a precise search query',
    },
    longDescription: {
      he: 'בניית שאילתת חיפוש מדויקת ל-PubMed עם MeSH Terms, Field Tags, ואסטרטגיות רגישות/ספציפיות. כולל בדיקת תקינות אוטומטית וחיפוש MeSH.',
      en: 'Build a precise PubMed search query with MeSH Terms, Field Tags, and sensitivity/specificity strategies. Includes automatic validation and MeSH lookup.',
    },
    icon: 'Search',
    skillName: 'pubmed-query',
    geminiModel: 'gemini-2.0-pro',
    order: 3,
    category: 'pipeline',
    expectedArtifacts: ['search-strategy.md', 'pubmed-query.txt', 'search-blocks.md'],
    slug: 'search',
  },
  screening: {
    name: { he: 'סינון תקצירים', en: 'Abstract Screening' },
    description: {
      he: 'סינון לפי קריטריוני הכללה/הדרה',
      en: 'Screen against inclusion/exclusion criteria',
    },
    longDescription: {
      he: 'סינון תקצירים אוטומטי לפי קריטריוני הכללה והדרה. העלה קובץ MEDLINE מ-PubMed, והמערכת תסנן את המאמרים עם נימוקים ודוח PRISMA Flow.',
      en: 'Automated abstract screening against inclusion/exclusion criteria. Upload a MEDLINE file from PubMed, and the system screens articles with justifications and a PRISMA Flow report.',
    },
    icon: 'Filter',
    skillName: 'pubmed-screening',
    geminiModel: 'gemini-2.0-pro',
    order: 4,
    category: 'pipeline',
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
      he: 'מיצוי נתונים מובנה מהמחקרים',
      en: 'Structured data extraction from studies',
    },
    longDescription: {
      he: 'מיצוי נתונים מובנה מהמחקרים שנכללו בסקירה. זיהוי אוטומטי של סוג המחקר, בחירת Template מותאם, ומילוי שדות עם חישובי סטטיסטיקה חסרה.',
      en: 'Structured data extraction from included studies. Automatic study design detection, adaptive template selection, and field population with missing statistics calculation.',
    },
    icon: 'Database',
    skillName: 'data-extraction',
    knowledgeBases: ['EXTRACTION-TEMPLATES.md'],
    geminiModel: 'gemini-2.0-pro',
    order: 5,
    category: 'pipeline',
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
      he: 'הערכת סיכון להטיה בכלי מתאים',
      en: 'Risk of bias assessment',
    },
    longDescription: {
      he: 'הערכת סיכון להטיה בכלי מותאם לסוג המחקר (RoB 2.0, ROBINS-I, NOS, JBI, QUADAS-2, QUIPS). כולל Traffic Light Plot, טבלת סיכום, ונימוקים.',
      en: 'Risk of bias assessment using the appropriate tool (RoB 2.0, ROBINS-I, NOS, JBI, QUADAS-2, QUIPS). Includes Traffic Light Plot, summary table, and justifications.',
    },
    icon: 'Scale',
    skillName: 'risk-of-bias',
    knowledgeBases: ['ROB-TOOLS.md'],
    geminiModel: 'gemini-2.0-pro',
    order: 6,
    category: 'pipeline',
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
    longDescription: {
      he: 'ביצוע מטה-אנליזה כמותית או סינתזה נרטיבית. כולל חישוב אפקטים, בחירת מודל, Forest Plots, ניתוח תת-קבוצות, ובדיקת Publication Bias עם קוד R.',
      en: 'Perform quantitative meta-analysis or narrative synthesis. Includes effect size calculation, model selection, Forest Plots, subgroup analysis, and Publication Bias testing with R code.',
    },
    icon: 'BarChart3',
    skillName: 'meta-analysis',
    knowledgeBases: ['FORMULAS.md'],
    geminiModel: 'gemini-2.0-pro',
    order: 7,
    category: 'pipeline',
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
      he: 'הערכת ודאות הראיות',
      en: 'Certainty of evidence assessment',
    },
    longDescription: {
      he: 'הערכת ודאות הראיות לפי מתודולוגיית GRADE. כולל 5 תחומי הורדה, 3 תחומי העלאה, Summary of Findings Table, והצהרות בשפה פשוטה.',
      en: 'Certainty of evidence assessment using GRADE methodology. Includes 5 downgrade domains, 3 upgrade domains, Summary of Findings Table, and plain-language statements.',
    },
    icon: 'Star',
    skillName: 'grade-assessment',
    geminiModel: 'gemini-2.0-pro',
    order: 8,
    category: 'pipeline',
    expectedArtifacts: [
      'sof-table.md',
      'sof-table.html',
      'plain-language-statements.md',
      'grade-summary.csv',
    ],
    slug: 'grade',
  },
  manuscript: {
    name: { he: 'כתיבת מאמר', en: 'Manuscript Writer' },
    description: {
      he: 'כתיבת מאמר מוכן לפרסום',
      en: 'Write a publication-ready manuscript',
    },
    longDescription: {
      he: 'כתיבת מאמר מוכן לפרסום בהתאם ל-PRISMA 2020. כולל כל חלקי המאמר, PRISMA Checklist, מכתב מלווה, ודיאגרמת PRISMA Flow.',
      en: 'Write a publication-ready PRISMA 2020 compliant manuscript. Includes all sections, PRISMA Checklist, cover letter, and PRISMA Flow diagram.',
    },
    icon: 'PenTool',
    skillName: 'manuscript-writer',
    geminiModel: 'gemini-2.0-pro',
    order: 9,
    category: 'pipeline',
    expectedArtifacts: [
      'manuscript.md',
      'prisma-checklist.md',
      'cover-letter.md',
    ],
    slug: 'manuscript',
  },
};

// ── Standalone Tools (4 tools) ─────────────────────────────────────

export const STANDALONE_TOOLS: Record<StandaloneToolName, ToolConfig> = {
  'article-appraisal': {
    name: { he: 'הערכת מאמר', en: 'Article Appraisal' },
    description: {
      he: 'הערכה ביקורתית מובנית של מאמר קליני',
      en: 'Structured critical appraisal of a clinical paper',
    },
    longDescription: {
      he: 'הערכה ביקורתית מובנית של מאמרים קליניים-פרמקולוגיים. כוללת 8 חלקים: תקציר, מבוא, שיטות, תוצאות, דיון, מגבלות, ניגודי עניינים, והערכה ביקורתית כוללת.',
      en: 'Structured critical appraisal of clinical-pharmacology papers. Includes 8 sections: Abstract, Introduction, Methods, Results, Discussion, Limitations, COI, and overall Critical Appraisal.',
    },
    icon: 'FileSearch',
    skillName: 'article-appraisal',
    geminiModel: 'gemini-2.0-pro',
    order: 10,
    category: 'standalone',
    acceptsUploads: ['.pdf', '.txt'],
    slug: 'article-appraisal',
  },
  'find-journal': {
    name: { he: 'חיפוש כתב-עת', en: 'Find Journal' },
    description: {
      he: 'זיהוי כתבי-עת מתאימים לפרסום',
      en: 'Identify suitable journals for publication',
    },
    longDescription: {
      he: 'זיהוי כתבי-עת אקדמיים מתאימים לפרסום המאמר שלך. בדיקת איכות (אנטי-טורפני), Impact Factor, וסיכויי קבלה. תומך בכל הדיסציפלינות.',
      en: 'Identify suitable academic journals for your manuscript. Includes quality checks (anti-predatory), Impact Factor, and acceptance likelihood. Supports all disciplines.',
    },
    icon: 'BookOpen',
    skillName: 'find-journal',
    geminiModel: 'gemini-2.0-flash',
    order: 11,
    category: 'standalone',
    slug: 'find-journal',
  },
  'retrospective-audit': {
    name: { he: 'ביקורת רטרוספקטיבית', en: 'Retrospective Audit' },
    description: {
      he: 'ביקורת תהליך הסקירה השיטתית',
      en: 'Audit the systematic review process',
    },
    longDescription: {
      he: 'ביקורת תהליך רטרוספקטיבית לצנרת הסקירה השיטתית. מזהה צווארי בקבוק, כשלי העברת נתונים, שגיאות שקטות, וסטיות מהפרוטוקול. 3 מצבים: ביקורת נקודתית, ביקורת מלאה.',
      en: 'Retrospective process audit for the systematic review pipeline. Identifies bottlenecks, data handover failures, silent errors, and protocol deviations. Supports checkpoint and full audit modes.',
    },
    icon: 'ClipboardCheck',
    skillName: 'retrospective-audit',
    geminiModel: 'gemini-2.0-pro',
    order: 12,
    category: 'standalone',
    slug: 'retrospective-audit',
  },
  'systematic-review': {
    name: { he: 'תזמורן סקירה', en: 'Review Orchestrator' },
    description: {
      he: 'ניהול מלא של סקירה שיטתית',
      en: 'Full systematic review orchestration',
    },
    longDescription: {
      he: 'תזמורן הסקירה השיטתית המלא. מנחה אותך משלב הרעיון ועד כתיבת המאמר, מתאם בין כל הכלים, עוקב אחר התקדמות, ומבטיח עקביות מתודולוגית לאורך כל התהליך.',
      en: 'The complete systematic review orchestrator. Guides you from initial idea to manuscript writing, coordinates all tools, tracks progress, and ensures methodological consistency throughout the process.',
    },
    icon: 'Workflow',
    skillName: 'systematic-review',
    geminiModel: 'gemini-2.0-pro',
    order: 13,
    category: 'standalone',
    slug: 'systematic-review',
  },
};

// ── Derived helpers ────────────────────────────────────────────────

/** All 13 tools combined */
export const ALL_TOOLS: Record<ToolSlug, ToolConfig> = {
  ...STAGES,
  ...STANDALONE_TOOLS,
};

/** Ordered array of pipeline stage slugs */
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

/** Ordered array of standalone tool slugs */
export const STANDALONE_ORDER: StandaloneToolName[] = [
  'article-appraisal',
  'find-journal',
  'retrospective-audit',
  'systematic-review',
];

/** Get a tool config by slug (pipeline or standalone) */
export function getToolBySlug(slug: string): ToolConfig | undefined {
  return ALL_TOOLS[slug as ToolSlug];
}

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
