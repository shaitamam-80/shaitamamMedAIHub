'use client';

import { ShieldCheck } from 'lucide-react';
import type { RobAssessment } from '@/lib/api/backend-client';

interface RobTrafficLightProps {
  assessments: RobAssessment[];
  toolId: string;
}

const JUDGMENT_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  low: { bg: 'bg-green-500', text: 'text-green-500', label: 'Low' },
  'some concerns': { bg: 'bg-yellow-500', text: 'text-yellow-500', label: 'Some Concerns' },
  high: { bg: 'bg-red-500', text: 'text-red-500', label: 'High' },
  moderate: { bg: 'bg-yellow-500', text: 'text-yellow-500', label: 'Moderate' },
  serious: { bg: 'bg-orange-500', text: 'text-orange-500', label: 'Serious' },
  critical: { bg: 'bg-red-700', text: 'text-red-700', label: 'Critical' },
  'no information': { bg: 'bg-gray-500', text: 'text-gray-500', label: 'NI' },
  unclear: { bg: 'bg-gray-500', text: 'text-gray-500', label: 'Unclear' },
};

function getJudgmentStyle(judgment: string) {
  const normalized = judgment.toLowerCase().trim();
  return JUDGMENT_COLORS[normalized] || { bg: 'bg-gray-500', text: 'text-gray-500', label: judgment };
}

export default function RobTrafficLight({ assessments, toolId }: RobTrafficLightProps) {
  if (!assessments || assessments.length === 0) return null;

  // Get all domain names from first assessment
  const domains = assessments[0]?.domain_judgments
    ? Object.keys(assessments[0].domain_judgments)
    : [];

  return (
    <div className="bg-white border border-[#e2e8f0] shadow-sm rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#e2e8f0] flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-medium text-[#0f172a]">
          Risk of Bias — Traffic Light ({assessments.length} studies)
        </span>
        <span className="text-xs text-[#94a3b8] ml-auto">{toolId}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
              <th className="px-3 py-2 text-left text-[#475569] font-medium sticky left-0 bg-[#f8fafc]">
                Study
              </th>
              {domains.map(d => (
                <th key={d} className="px-2 py-2 text-center text-[#475569] font-medium whitespace-nowrap">
                  {d.replace(/_/g, ' ')}
                </th>
              ))}
              <th className="px-3 py-2 text-center text-[#475569] font-medium">Overall</th>
            </tr>
          </thead>
          <tbody>
            {assessments.map((assessment, idx) => (
              <tr key={idx} className="border-b border-[#e2e8f0]">
                <td className="px-3 py-2 text-[#0f172a] sticky left-0 bg-white whitespace-nowrap">
                  {assessment.study_id}
                </td>
                {domains.map(d => {
                  const dj = assessment.domain_judgments[d];
                  const style = getJudgmentStyle(dj?.judgment || 'unclear');
                  return (
                    <td key={d} className="px-2 py-2 text-center">
                      <div
                        className={`inline-block w-5 h-5 rounded-full ${style.bg} opacity-80`}
                        title={`${d}: ${dj?.judgment || 'N/A'}${dj?.justification ? ` — ${dj.justification}` : ''}`}
                      />
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-center">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getJudgmentStyle(assessment.overall_judgment).text} bg-[#f8fafc]`}
                  >
                    {assessment.overall_judgment}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-t border-[#e2e8f0] flex gap-4 flex-wrap">
        {Object.entries(JUDGMENT_COLORS).slice(0, 4).map(([key, style]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${style.bg} opacity-80`} />
            <span className="text-xs text-[#475569]">{style.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
