'use client';

import { BarChart3 } from 'lucide-react';
import GradeBadge from './GradeBadge';

interface OutcomeRow {
  outcome: string;
  studies?: number;
  participants?: number;
  effect?: string;
  certainty?: string;
  plain_language?: string;
}

interface SummaryOfFindingsProps {
  title?: string;
  population?: string;
  intervention?: string;
  comparison?: string;
  outcomes: OutcomeRow[];
}

export default function SummaryOfFindings({
  title,
  population,
  intervention,
  comparison,
  outcomes,
}: SummaryOfFindingsProps) {
  if (!outcomes || outcomes.length === 0) return null;

  return (
    <div className="bg-white border border-[#e2e8f0] shadow-sm rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#e2e8f0]">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium text-[#0f172a]">
            Summary of Findings
          </span>
        </div>
        {title && <div className="text-xs text-[#475569]">{title}</div>}
        {(population || intervention || comparison) && (
          <div className="text-xs text-[#94a3b8] mt-1 space-x-3">
            {population && <span>Population: {population}</span>}
            {intervention && <span>Intervention: {intervention}</span>}
            {comparison && <span>Comparison: {comparison}</span>}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
              <th className="px-4 py-2 text-left text-[#475569] font-medium">Outcome</th>
              <th className="px-3 py-2 text-center text-[#475569] font-medium">Studies</th>
              <th className="px-3 py-2 text-center text-[#475569] font-medium">N</th>
              <th className="px-3 py-2 text-left text-[#475569] font-medium">Effect</th>
              <th className="px-3 py-2 text-center text-[#475569] font-medium">Certainty</th>
              <th className="px-4 py-2 text-left text-[#475569] font-medium">Interpretation</th>
            </tr>
          </thead>
          <tbody>
            {outcomes.map((row, idx) => (
              <tr key={idx} className="border-b border-[#e2e8f0]">
                <td className="px-4 py-3 text-[#0f172a] font-medium">{row.outcome}</td>
                <td className="px-3 py-3 text-center text-[#475569]">{row.studies ?? '-'}</td>
                <td className="px-3 py-3 text-center text-[#475569]">{row.participants ?? '-'}</td>
                <td className="px-3 py-3 text-[#0f172a] text-xs font-mono">{row.effect || '-'}</td>
                <td className="px-3 py-3 text-center">
                  {row.certainty ? (
                    <GradeBadge certainty={row.certainty} size="sm" />
                  ) : (
                    <span className="text-[#94a3b8]">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-[#475569] text-xs max-w-[200px]">
                  {row.plain_language || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
