'use client';

import { GitBranch } from 'lucide-react';

interface PrismaFlowData {
  identification: {
    databases: number;
    registers: number;
    other_sources?: number;
    duplicates_removed: number;
    automated_removed?: number;
  };
  screening: {
    title_abstract_screened: number;
    title_abstract_excluded: number;
    fulltext_sought: number;
    fulltext_not_retrieved?: number;
    fulltext_assessed: number;
    fulltext_excluded: number;
    exclusion_reasons?: Record<string, number>;
  };
  included: {
    new_studies: number;
    previous_studies?: number;
    total_studies: number;
    total_reports?: number;
  };
}

interface PrismaFlowDiagramProps {
  data: PrismaFlowData;
  title?: string;
}

function FlowBox({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`border border-[#e2e8f0] rounded-lg px-4 py-2.5 text-center text-xs bg-white ${className}`}
    >
      {children}
    </div>
  );
}

function Arrow({ direction = 'down' }: { direction?: 'down' | 'right' }) {
  if (direction === 'right') {
    return (
      <div className="flex items-center justify-center px-2">
        <div className="w-8 h-0.5 bg-[#e2e8f0]" />
        <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-[#e2e8f0]" />
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center py-1">
      <div className="w-0.5 h-4 bg-[#e2e8f0]" />
      <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-[#e2e8f0]" />
    </div>
  );
}

export default function PrismaFlowDiagram({ data, title }: PrismaFlowDiagramProps) {
  const { identification: id, screening: sc, included: inc } = data;

  return (
    <div className="bg-white border border-[#e2e8f0] shadow-sm rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#e2e8f0] flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-cyan-500" />
        <span className="text-sm font-medium text-[#0f172a]">
          {title || 'PRISMA 2020 Flow Diagram'}
        </span>
      </div>

      <div className="p-6 flex flex-col items-center gap-1">
        {/* Identification */}
        <div className="text-xs text-[#94a3b8] font-medium mb-1 self-start">
          IDENTIFICATION
        </div>
        <div className="flex items-center gap-4">
          <FlowBox>
            <div className="text-[#475569]">Records from databases</div>
            <div className="text-[#0f172a] font-bold text-base">{id.databases.toLocaleString()}</div>
          </FlowBox>
          {id.other_sources !== undefined && id.other_sources > 0 && (
            <FlowBox>
              <div className="text-[#475569]">Other sources</div>
              <div className="text-[#0f172a] font-bold text-base">{id.other_sources.toLocaleString()}</div>
            </FlowBox>
          )}
        </div>

        <Arrow />

        <div className="flex items-center gap-4">
          <FlowBox className="border-red-500/30">
            <div className="text-[#475569]">Duplicates removed</div>
            <div className="text-red-400 font-bold">{id.duplicates_removed.toLocaleString()}</div>
          </FlowBox>
          {id.automated_removed !== undefined && id.automated_removed > 0 && (
            <FlowBox className="border-red-500/30">
              <div className="text-[#475569]">Automated removal</div>
              <div className="text-red-400 font-bold">{id.automated_removed.toLocaleString()}</div>
            </FlowBox>
          )}
        </div>

        <Arrow />

        {/* Screening */}
        <div className="text-xs text-[#94a3b8] font-medium mb-1 self-start">
          SCREENING
        </div>

        <div className="flex items-center gap-2">
          <FlowBox>
            <div className="text-[#475569]">Title/Abstract screened</div>
            <div className="text-[#0f172a] font-bold text-base">{sc.title_abstract_screened.toLocaleString()}</div>
          </FlowBox>
          <Arrow direction="right" />
          <FlowBox className="border-red-500/30">
            <div className="text-[#475569]">Excluded</div>
            <div className="text-red-400 font-bold">{sc.title_abstract_excluded.toLocaleString()}</div>
          </FlowBox>
        </div>

        <Arrow />

        <div className="flex items-center gap-2">
          <FlowBox>
            <div className="text-[#475569]">Full-text assessed</div>
            <div className="text-[#0f172a] font-bold text-base">{sc.fulltext_assessed.toLocaleString()}</div>
          </FlowBox>
          <Arrow direction="right" />
          <FlowBox className="border-red-500/30">
            <div className="text-[#475569]">Full-text excluded</div>
            <div className="text-red-400 font-bold">{sc.fulltext_excluded.toLocaleString()}</div>
            {sc.exclusion_reasons && (
              <div className="mt-1 text-left">
                {Object.entries(sc.exclusion_reasons).map(([reason, count]) => (
                  <div key={reason} className="text-[#94a3b8]">
                    {reason}: {count}
                  </div>
                ))}
              </div>
            )}
          </FlowBox>
        </div>

        <Arrow />

        {/* Included */}
        <div className="text-xs text-[#94a3b8] font-medium mb-1 self-start">
          INCLUDED
        </div>
        <FlowBox className="border-green-500/30 bg-green-500/5">
          <div className="text-green-600">Studies included</div>
          <div className="text-green-600 font-bold text-lg">{inc.total_studies}</div>
          {inc.total_reports && inc.total_reports !== inc.total_studies && (
            <div className="text-[#475569]">({inc.total_reports} reports)</div>
          )}
        </FlowBox>
      </div>
    </div>
  );
}
