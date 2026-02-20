'use client';

import { useMemo, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Lightbulb,
  Target,
  Users,
  Pill,
  Activity,
  BookOpen,
  Clock,
  ChevronRight,
  FileText,
  Database,
  Shield,
  BarChart3,
  Wrench,
  ListChecks,
  Eye,
  Download,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { assembleProtocolMarkdown } from '@/lib/utils/assemble-protocol-markdown';

// ── Types ──────────────────────────────────────────────────────────

interface FINERScore {
  score: 'high' | 'medium' | 'low';
  reason: string;
}

interface FINERAssessment {
  F: FINERScore;
  I: FINERScore;
  N: FINERScore;
  E: FINERScore;
  R: FINERScore;
  overall: 'proceed' | 'revise' | 'reconsider';
  suggestions?: string[];
}

interface IdeaArtifact {
  clinical_problem?: string;
  review_type?: string;
  population_sketch?: string;
  intervention_sketch?: string;
  outcome_sketch?: string;
  study_designs?: string[];
  existing_reviews_checked?: boolean;
  existing_reviews_notes?: string;
  timeline?: string;
  feasibility_notes?: string;
  recommendation?: string;
}

interface RQArtifact {
  framework_type?: string;
  framework_data?: Record<string, string>;
  question_narrow?: string;
  question_broad?: string;
  question_clinical?: string;
  finer_assessment?: FINERAssessment;
}

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
  review_type?: string;
  registration_platform?: string;
  eligibility_criteria?: EligibilityCriteria;
  information_sources?: string[];
  rob_tool?: string;
  rob_domains?: string[];
  synthesis_method?: string;
  effect_measure?: string;
  completed_sections?: string[];
  approved_tools?: string[];
  tool_declarations?: Record<string, string>;
}

interface ArtifactPanelProps {
  stageSlug: string;
  artifacts: Record<string, unknown>;
}

// ── Score badge ────────────────────────────────────────────────────

const scoreColors: Record<string, string> = {
  high: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  medium: 'bg-amber-100 text-amber-800 border-amber-300',
  low: 'bg-red-100 text-red-800 border-red-300',
};

const scoreDots: Record<string, string> = {
  high: 'bg-emerald-500',
  medium: 'bg-amber-500',
  low: 'bg-red-500',
};

function ScoreBadge({ score, label, reason }: { score: string; label: string; reason: string }) {
  return (
    <div className={`flex items-center justify-between rounded-lg border px-3 py-2 ${scoreColors[score] || 'bg-muted'}`}>
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${scoreDots[score] || 'bg-muted-foreground'}`} />
        <span className="font-semibold text-sm">{label}</span>
      </div>
      <span className="text-xs capitalize">{score}</span>
    </div>
  );
}

// ── Overall recommendation badge ──────────────────────────────────

function OverallBadge({ overall }: { overall: string }) {
  const config: Record<string, { bg: string; icon: typeof CheckCircle2; label: string }> = {
    proceed: { bg: 'bg-emerald-50 border-emerald-200 text-emerald-800', icon: CheckCircle2, label: 'Proceed' },
    revise: { bg: 'bg-amber-50 border-amber-200 text-amber-800', icon: AlertCircle, label: 'Revise' },
    reconsider: { bg: 'bg-red-50 border-red-200 text-red-800', icon: AlertCircle, label: 'Reconsider' },
  };
  const c = config[overall] || config.revise;
  const Icon = c.icon;
  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${c.bg}`}>
      <Icon className="w-4 h-4" />
      <span className="text-sm font-semibold">{c.label}</span>
    </div>
  );
}

// ── Idea stage panel ──────────────────────────────────────────────

function IdeaPanel({ artifact }: { artifact: IdeaArtifact }) {
  const fields = useMemo(() => {
    const items: Array<{ icon: typeof Lightbulb; label: string; value: string }> = [];
    if (artifact.clinical_problem)
      items.push({ icon: Lightbulb, label: 'Clinical Problem', value: artifact.clinical_problem });
    if (artifact.review_type)
      items.push({ icon: BookOpen, label: 'Review Type', value: artifact.review_type.replace(/_/g, ' ') });
    if (artifact.population_sketch)
      items.push({ icon: Users, label: 'Population', value: artifact.population_sketch });
    if (artifact.intervention_sketch)
      items.push({ icon: Pill, label: 'Intervention / Exposure', value: artifact.intervention_sketch });
    if (artifact.outcome_sketch)
      items.push({ icon: Activity, label: 'Outcomes', value: artifact.outcome_sketch });
    if (artifact.timeline)
      items.push({ icon: Clock, label: 'Timeline', value: artifact.timeline });
    return items;
  }, [artifact]);

  if (fields.length === 0) return null;

  const recommendation = artifact.recommendation;
  const recColors: Record<string, string> = {
    proceed: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    refine: 'text-amber-700 bg-amber-50 border-amber-200',
    pivot: 'text-red-700 bg-red-50 border-red-200',
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-[#0f172a] flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        Research Idea Components
      </h3>

      <div className="space-y-2">
        {fields.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-lg border border-[#e2e8f0] bg-white p-3">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-3.5 h-3.5 text-[#475569]" />
              <span className="text-xs font-medium text-[#475569] uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-sm text-[#0f172a] leading-relaxed">{value}</p>
          </div>
        ))}
      </div>

      {artifact.existing_reviews_checked && (
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Existing reviews checked
        </div>
      )}

      {artifact.study_designs && artifact.study_designs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {artifact.study_designs.map((d) => (
            <span key={d} className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {d}
            </span>
          ))}
        </div>
      )}

      {recommendation && (
        <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium capitalize ${recColors[recommendation] || ''}`}>
          <ChevronRight className="w-4 h-4" />
          {recommendation}
        </div>
      )}
    </div>
  );
}

// ── Research Question stage panel ─────────────────────────────────

function ResearchQuestionPanel({ artifact }: { artifact: RQArtifact }) {
  const hasFramework = !!(artifact.framework_type && artifact.framework_data);
  const hasFiner = !!artifact.finer_assessment;
  const hasQuestions = !!(artifact.question_narrow || artifact.question_broad || artifact.question_clinical);

  if (!hasFramework && !hasFiner && !hasQuestions) return null;

  return (
    <div className="space-y-4">
      {/* Framework Components */}
      {hasFramework && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[#0f172a] flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-500" />
            {artifact.framework_type} Framework
          </h3>
          <div className="space-y-1.5">
            {Object.entries(artifact.framework_data!).map(([key, value]) => (
              <div key={key} className="flex gap-2 rounded-lg border border-[#e2e8f0] bg-white p-2.5">
                <span className="flex-shrink-0 w-7 h-7 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                  {key}
                </span>
                <p className="text-sm text-[#0f172a] leading-relaxed pt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Question Formulations */}
      {hasQuestions && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[#0f172a] flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-purple-500" />
            Question Formulations
          </h3>
          <div className="space-y-1.5">
            {artifact.question_narrow && (
              <div className="rounded-lg border border-[#e2e8f0] bg-white p-2.5">
                <span className="text-xs font-medium text-[#475569] uppercase tracking-wide">Narrow (PubMed)</span>
                <p className="text-sm text-[#0f172a] mt-1 leading-relaxed">{artifact.question_narrow}</p>
              </div>
            )}
            {artifact.question_broad && (
              <div className="rounded-lg border border-[#e2e8f0] bg-white p-2.5">
                <span className="text-xs font-medium text-[#475569] uppercase tracking-wide">Broad</span>
                <p className="text-sm text-[#0f172a] mt-1 leading-relaxed">{artifact.question_broad}</p>
              </div>
            )}
            {artifact.question_clinical && (
              <div className="rounded-lg border border-[#e2e8f0] bg-white p-2.5">
                <span className="text-xs font-medium text-[#475569] uppercase tracking-wide">Clinical</span>
                <p className="text-sm text-[#0f172a] mt-1 leading-relaxed">{artifact.question_clinical}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FINER Assessment */}
      {hasFiner && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[#0f172a] flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            FINER Assessment
          </h3>
          <div className="space-y-1.5">
            <ScoreBadge score={artifact.finer_assessment!.F.score} label="F — Feasible" reason={artifact.finer_assessment!.F.reason} />
            <ScoreBadge score={artifact.finer_assessment!.I.score} label="I — Interesting" reason={artifact.finer_assessment!.I.reason} />
            <ScoreBadge score={artifact.finer_assessment!.N.score} label="N — Novel" reason={artifact.finer_assessment!.N.reason} />
            <ScoreBadge score={artifact.finer_assessment!.E.score} label="E — Ethical" reason={artifact.finer_assessment!.E.reason} />
            <ScoreBadge score={artifact.finer_assessment!.R.score} label="R — Relevant" reason={artifact.finer_assessment!.R.reason} />
          </div>
          <OverallBadge overall={artifact.finer_assessment!.overall} />

          {artifact.finer_assessment!.suggestions && artifact.finer_assessment!.suggestions.length > 0 && (
            <div className="rounded-lg border border-[#e2e8f0] bg-slate-50 p-3 space-y-1">
              <span className="text-xs font-medium text-[#475569] uppercase tracking-wide">Suggestions</span>
              <ul className="text-sm text-[#0f172a] space-y-1 list-disc list-inside">
                {artifact.finer_assessment!.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Protocol stage panel ──────────────────────────────────────────

const TOOL_LABELS: Record<string, string> = {
  search_assistant: 'Search Assistant',
  screening_engine: 'Screening Engine',
  extraction_engine: 'Extraction Engine',
  rob_assessor: 'RoB Assessor',
  grade_evaluator: 'GRADE Evaluator',
  audit_assistant: 'Audit Assistant',
};

function ProtocolPanel({ artifact, allArtifacts }: { artifact: ProtocolArtifact; allArtifacts: Record<string, unknown> }) {
  const [previewOpen, setPreviewOpen] = useState(false);

  const elig = artifact.eligibility_criteria;
  const hasElig = !!(elig && (elig.population_inclusion?.length || elig.intervention_inclusion?.length || elig.outcomes_primary?.length));
  const hasSources = !!(artifact.information_sources && artifact.information_sources.length > 0);
  const hasRob = !!artifact.rob_tool;
  const hasSynthesis = !!artifact.synthesis_method;
  const hasTools = !!(artifact.approved_tools && artifact.approved_tools.length > 0);
  const hasDeclarations = !!(artifact.tool_declarations && Object.keys(artifact.tool_declarations).length > 0);
  const hasCompleted = !!(artifact.completed_sections && artifact.completed_sections.length > 0);

  const protocolMarkdown = useMemo(() => {
    return assembleProtocolMarkdown({
      protocol: artifact,
      idea: allArtifacts.idea as Record<string, unknown> | undefined,
      research_question: allArtifacts.research_question as Record<string, unknown> | undefined,
    });
  }, [artifact, allArtifacts]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([protocolMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'protocol.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [protocolMarkdown]);

  if (!hasElig && !hasSources && !hasRob && !hasSynthesis && !hasTools) return null;

  return (
    <div className="space-y-4">
      {/* Preview Full Protocol Button */}
      <button
        onClick={() => setPreviewOpen(true)}
        className="w-full flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:from-blue-100 hover:to-indigo-100 transition-all shadow-sm"
      >
        <Eye className="w-4 h-4" />
        Preview Full Protocol
      </button>

      {/* Protocol Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              PROSPERO Protocol Preview
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1 py-4 prose prose-sm prose-slate max-w-none
            prose-h1:text-xl prose-h1:font-bold prose-h1:border-b prose-h1:pb-2 prose-h1:mb-4
            prose-h2:text-lg prose-h2:font-semibold prose-h2:mt-6 prose-h2:mb-3
            prose-h3:text-base prose-h3:font-semibold prose-h3:mt-4 prose-h3:mb-2
            prose-h4:text-sm prose-h4:font-semibold
            prose-table:text-sm prose-th:bg-slate-100 prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2
            prose-blockquote:border-blue-300 prose-blockquote:bg-blue-50 prose-blockquote:rounded-lg prose-blockquote:py-2 prose-blockquote:px-4
            prose-hr:my-4
            prose-li:my-0.5
            prose-strong:text-slate-900">
            <ReactMarkdown>{protocolMarkdown}</ReactMarkdown>
          </div>
          <DialogFooter>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Download as .md
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Type & Registration */}
      {(artifact.review_type || artifact.registration_platform) && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[#0f172a] flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            Protocol Overview
          </h3>
          <div className="space-y-1.5">
            {artifact.review_type && (
              <div className="rounded-lg border border-[#e2e8f0] bg-white p-2.5">
                <span className="text-xs font-medium text-[#475569] uppercase tracking-wide">Review Type</span>
                <p className="text-sm text-[#0f172a] mt-0.5 capitalize">{artifact.review_type.replace(/_/g, ' ')}</p>
              </div>
            )}
            {artifact.registration_platform && (
              <div className="rounded-lg border border-[#e2e8f0] bg-white p-2.5">
                <span className="text-xs font-medium text-[#475569] uppercase tracking-wide">Registration</span>
                <p className="text-sm text-[#0f172a] mt-0.5">{artifact.registration_platform}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Eligibility Criteria */}
      {hasElig && elig && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[#0f172a] flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-purple-500" />
            Eligibility Criteria
          </h3>
          <div className="space-y-1.5">
            {elig.population_inclusion && elig.population_inclusion.length > 0 && (
              <CriteriaBlock label="Population (Include)" items={elig.population_inclusion} color="emerald" />
            )}
            {elig.population_exclusion && elig.population_exclusion.length > 0 && (
              <CriteriaBlock label="Population (Exclude)" items={elig.population_exclusion} color="red" />
            )}
            {elig.intervention_inclusion && elig.intervention_inclusion.length > 0 && (
              <CriteriaBlock label="Intervention (Include)" items={elig.intervention_inclusion} color="emerald" />
            )}
            {elig.outcomes_primary && elig.outcomes_primary.length > 0 && (
              <CriteriaBlock label="Primary Outcomes" items={elig.outcomes_primary} color="blue" />
            )}
            {elig.outcomes_secondary && elig.outcomes_secondary.length > 0 && (
              <CriteriaBlock label="Secondary Outcomes" items={elig.outcomes_secondary} color="slate" />
            )}
            {elig.study_designs_included && elig.study_designs_included.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {elig.study_designs_included.map((d) => (
                  <span key={d} className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {d}
                  </span>
                ))}
              </div>
            )}
            {elig.time_frame && (
              <div className="text-xs text-[#475569] flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> {elig.time_frame}
              </div>
            )}
            {elig.language_restrictions && (
              <div className="text-xs text-[#475569]">{elig.language_restrictions}</div>
            )}
          </div>
        </div>
      )}

      {/* Information Sources */}
      {hasSources && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[#0f172a] flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-500" />
            Information Sources
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {artifact.information_sources!.map((src) => (
              <span key={src} className="text-xs px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 font-medium">
                {src}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Risk of Bias */}
      {hasRob && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[#0f172a] flex items-center gap-2">
            <Shield className="w-4 h-4 text-orange-500" />
            Risk of Bias
          </h3>
          <div className="rounded-lg border border-[#e2e8f0] bg-white p-2.5">
            <span className="text-xs font-medium text-[#475569] uppercase tracking-wide">Assessment Tool</span>
            <p className="text-sm text-[#0f172a] mt-0.5">{artifact.rob_tool}</p>
          </div>
          {artifact.rob_domains && artifact.rob_domains.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {artifact.rob_domains.map((d) => (
                <span key={d} className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                  {d}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Data Synthesis */}
      {hasSynthesis && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[#0f172a] flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            Data Synthesis
          </h3>
          <div className="rounded-lg border border-[#e2e8f0] bg-white p-2.5">
            <span className="text-xs font-medium text-[#475569] uppercase tracking-wide">Method</span>
            <p className="text-sm text-[#0f172a] mt-0.5 capitalize">{artifact.synthesis_method}</p>
          </div>
          {artifact.effect_measure && (
            <div className="rounded-lg border border-[#e2e8f0] bg-white p-2.5">
              <span className="text-xs font-medium text-[#475569] uppercase tracking-wide">Effect Measure</span>
              <p className="text-sm text-[#0f172a] mt-0.5">{artifact.effect_measure}</p>
            </div>
          )}
        </div>
      )}

      {/* Approved MedAI Tools */}
      {hasTools && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[#0f172a] flex items-center gap-2">
            <Wrench className="w-4 h-4 text-emerald-500" />
            Approved AI Tools
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {artifact.approved_tools!.map((tool) => (
              <span key={tool} className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3" />
                {TOOL_LABELS[tool] || tool.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tool Academic Declarations */}
      {hasDeclarations && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[#0f172a] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-500" />
            Academic Declarations
          </h3>
          <div className="space-y-1.5">
            {Object.entries(artifact.tool_declarations!).map(([key, text]) => (
              <div key={key} className="rounded-lg border border-[#e2e8f0] bg-white p-2.5">
                <span className="text-xs font-medium text-[#475569] uppercase tracking-wide">
                  {TOOL_LABELS[key] || key.replace(/_/g, ' ')}
                </span>
                <p className="text-xs text-[#334155] mt-1 leading-relaxed italic">{text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Sections Progress */}
      {hasCompleted && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[#0f172a] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Sections Addressed ({artifact.completed_sections!.length})
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {artifact.completed_sections!.map((sec) => (
              <span key={sec} className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {sec.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CriteriaBlock({ label, items, color }: { label: string; items: string[]; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'border-emerald-200 bg-emerald-50',
    red: 'border-red-200 bg-red-50',
    blue: 'border-blue-200 bg-blue-50',
    slate: 'border-slate-200 bg-slate-50',
  };
  return (
    <div className={`rounded-lg border p-2.5 ${colorMap[color] || 'border-[#e2e8f0] bg-white'}`}>
      <span className="text-xs font-medium text-[#475569] uppercase tracking-wide">{label}</span>
      <ul className="text-sm text-[#0f172a] mt-1 space-y-0.5 list-disc list-inside">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

// ── Main ArtifactPanel ────────────────────────────────────────────

export default function ArtifactPanel({ stageSlug, artifacts }: ArtifactPanelProps) {
  if (!artifacts || Object.keys(artifacts).length === 0) return null;

  if (stageSlug === 'idea') {
    const idea = artifacts.idea as IdeaArtifact | undefined;
    if (!idea) return null;
    return (
      <div className="p-4 overflow-y-auto h-full">
        <IdeaPanel artifact={idea} />
      </div>
    );
  }

  if (stageSlug === 'question') {
    const rq = artifacts.research_question as RQArtifact | undefined;
    if (!rq) return null;
    return (
      <div className="p-4 overflow-y-auto h-full">
        <ResearchQuestionPanel artifact={rq} />
      </div>
    );
  }

  if (stageSlug === 'protocol') {
    const protocol = artifacts.protocol as ProtocolArtifact | undefined;
    if (!protocol) return null;
    return (
      <div className="p-4 overflow-y-auto h-full">
        <ProtocolPanel artifact={protocol} allArtifacts={artifacts} />
      </div>
    );
  }

  // For stages without a custom panel, return null
  return null;
}
