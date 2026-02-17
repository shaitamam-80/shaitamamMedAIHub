'use client';

import { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ManuscriptSectionProps {
  sectionId: string;
  sectionName: string;
  content: string;
  prismaItems?: string;
  wordCount?: number;
}

export default function ManuscriptSection({
  sectionId,
  sectionName,
  content,
  prismaItems,
  wordCount,
}: ManuscriptSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const computedWordCount = wordCount || content.split(/\s+/).filter(Boolean).length;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="bg-white border border-[#e2e8f0] shadow-sm rounded-xl overflow-hidden">
      <div
        className="px-4 py-3 flex items-center gap-2 cursor-pointer hover:bg-[#f8fafc] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <FileText className="w-4 h-4 text-purple-500 shrink-0" />
        <span className="text-sm font-medium text-[#0f172a] flex-1">{sectionName}</span>
        <div className="flex items-center gap-3">
          {prismaItems && (
            <span className="text-xs text-[#94a3b8]">PRISMA: {prismaItems}</span>
          )}
          <span className="text-xs text-[#94a3b8]">{computedWordCount} words</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-[#94a3b8]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#94a3b8]" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-[#e2e8f0]">
          <div className="px-4 py-1 flex justify-end">
            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-[#f8fafc] rounded transition-colors flex items-center gap-1 text-xs text-[#475569]"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-green-500" />
                  <span className="text-green-500">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="px-4 pb-4 prose prose-slate prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
