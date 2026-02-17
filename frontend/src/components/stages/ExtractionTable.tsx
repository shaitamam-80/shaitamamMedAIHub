'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, FileSpreadsheet } from 'lucide-react';
import type { ExtractedStudy } from '@/lib/api/backend-client';

interface ExtractionTableProps {
  studies: ExtractedStudy[];
  templateId?: string;
}

const CORE_FIELDS = ['title', 'authors', 'year', '_study_design'] as const;
const META_FIELDS = ['_study_design', '_design_confidence', '_template_id'] as const;

function formatFieldName(key: string): string {
  return key
    .replace(/^_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export default function ExtractionTable({ studies, templateId }: ExtractionTableProps) {
  const [expandedStudy, setExpandedStudy] = useState<number | null>(null);

  if (!studies || studies.length === 0) {
    return null;
  }

  const dataFields = studies.length > 0
    ? Object.keys(studies[0]).filter(
        k => !META_FIELDS.includes(k as any) && !CORE_FIELDS.includes(k as any)
      )
    : [];

  return (
    <div className="bg-white border border-[#e2e8f0] shadow-sm rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#e2e8f0] flex items-center gap-2">
        <FileSpreadsheet className="w-4 h-4 text-blue-500" />
        <span className="text-sm font-medium text-[#0f172a]">
          Extracted Studies ({studies.length})
        </span>
        {templateId && (
          <span className="text-xs text-[#94a3b8] ml-auto">
            Template: {templateId.replace('template_', '').toUpperCase()}
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
              <th className="px-4 py-2 text-left text-[#475569] font-medium">#</th>
              <th className="px-4 py-2 text-left text-[#475569] font-medium">Study</th>
              <th className="px-4 py-2 text-left text-[#475569] font-medium">Design</th>
              <th className="px-4 py-2 text-left text-[#475569] font-medium">Year</th>
              <th className="px-4 py-2 text-left text-[#475569] font-medium w-8" />
            </tr>
          </thead>
          <tbody>
            {studies.map((study, idx) => {
              const isExpanded = expandedStudy === idx;
              const studyLabel = study.authors
                ? `${study.authors}${study.year ? ` (${study.year})` : ''}`
                : study.title || `Study ${idx + 1}`;

              return (
                <tr key={idx} className="group">
                  <td colSpan={5} className="p-0">
                    <div
                      className="flex items-center px-4 py-3 cursor-pointer hover:bg-[#f8fafc] transition-colors border-b border-[#e2e8f0]"
                      onClick={() => setExpandedStudy(isExpanded ? null : idx)}
                    >
                      <span className="w-8 text-[#94a3b8]">{idx + 1}</span>
                      <span className="flex-1 text-[#0f172a] truncate">{studyLabel}</span>
                      <span className="w-32 text-[#475569] text-xs">
                        {study._study_design || '-'}
                      </span>
                      <span className="w-16 text-[#475569]">{study.year || '-'}</span>
                      <span className="w-8 text-[#94a3b8]">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </span>
                    </div>

                    {isExpanded && (
                      <div className="px-4 py-3 bg-[#f8fafc] border-b border-[#e2e8f0]">
                        <div className="grid grid-cols-2 gap-3">
                          {dataFields.map(key => {
                            const value = study[key];
                            if (value === undefined || value === null || value === '') return null;
                            return (
                              <div key={key} className="text-xs">
                                <span className="text-[#94a3b8]">{formatFieldName(key)}: </span>
                                <span className="text-[#0f172a]">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
