'use client';

import { ShieldAlert } from 'lucide-react';
import type { RobAssessment } from '@/lib/api/backend-client';

interface RobSummaryTableProps {
  assessments: RobAssessment[];
}

function countJudgments(assessments: RobAssessment[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const a of assessments) {
    const j = a.overall_judgment.toLowerCase();
    counts[j] = (counts[j] || 0) + 1;
  }
  return counts;
}

const SEVERITY_ORDER = ['low', 'some concerns', 'moderate', 'serious', 'high', 'critical'];

const BAR_COLORS: Record<string, string> = {
  low: 'bg-green-500',
  'some concerns': 'bg-yellow-500',
  moderate: 'bg-yellow-500',
  serious: 'bg-orange-500',
  high: 'bg-red-500',
  critical: 'bg-red-700',
};

export default function RobSummaryTable({ assessments }: RobSummaryTableProps) {
  if (!assessments || assessments.length === 0) return null;

  const counts = countJudgments(assessments);
  const total = assessments.length;

  // Domain-level summary
  const domains = assessments[0]?.domain_judgments
    ? Object.keys(assessments[0].domain_judgments)
    : [];

  const domainCounts: Record<string, Record<string, number>> = {};
  for (const domain of domains) {
    domainCounts[domain] = {};
    for (const a of assessments) {
      const j = a.domain_judgments[domain]?.judgment?.toLowerCase() || 'unclear';
      domainCounts[domain][j] = (domainCounts[domain][j] || 0) + 1;
    }
  }

  return (
    <div className="bg-white border border-[#e2e8f0] shadow-sm rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#e2e8f0] flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-medium text-[#0f172a]">
          Risk of Bias Summary
        </span>
      </div>

      {/* Overall bar */}
      <div className="px-4 py-3 border-b border-[#e2e8f0]">
        <div className="text-xs text-[#475569] mb-2">Overall Judgments</div>
        <div className="flex rounded-lg overflow-hidden h-6">
          {SEVERITY_ORDER.filter(j => counts[j]).map(j => {
            const pct = (counts[j] / total) * 100;
            return (
              <div
                key={j}
                className={`${BAR_COLORS[j] || 'bg-gray-500'} flex items-center justify-center text-xs text-white font-medium`}
                style={{ width: `${pct}%` }}
                title={`${j}: ${counts[j]} (${Math.round(pct)}%)`}
              >
                {pct >= 15 ? counts[j] : ''}
              </div>
            );
          })}
        </div>
        <div className="flex gap-3 mt-2">
          {SEVERITY_ORDER.filter(j => counts[j]).map(j => (
            <span key={j} className="text-xs text-[#475569]">
              {j}: {counts[j]}
            </span>
          ))}
        </div>
      </div>

      {/* Per-domain bars */}
      {domains.length > 0 && (
        <div className="px-4 py-3 space-y-3">
          <div className="text-xs text-[#475569]">By Domain</div>
          {domains.map(domain => {
            const dc = domainCounts[domain];
            return (
              <div key={domain}>
                <div className="text-xs text-[#94a3b8] mb-1">
                  {domain.replace(/_/g, ' ')}
                </div>
                <div className="flex rounded overflow-hidden h-4">
                  {SEVERITY_ORDER.filter(j => dc[j]).map(j => {
                    const pct = (dc[j] / total) * 100;
                    return (
                      <div
                        key={j}
                        className={`${BAR_COLORS[j] || 'bg-gray-500'}`}
                        style={{ width: `${pct}%` }}
                        title={`${j}: ${dc[j]}`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
