'use client';

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ArtifactCard from './ArtifactCard';
import {
  ExtractionTable,
  RobTrafficLight,
  RobSummaryTable,
  SummaryOfFindings,
  GradeBadge,
  PrismaFlowDiagram,
  ManuscriptSection,
} from '@/components/stages';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  artifacts?: Array<{
    name: string;
    type: string;
    content: string;
  }>;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

interface DataBlock {
  type: string;
  data: Record<string, unknown>;
}

type ContentSegment =
  | { kind: 'text'; text: string }
  | { kind: 'data'; block: DataBlock };

/**
 * Parse structured data blocks from AI response content.
 * Format: ```data:<type>\n{JSON}```
 * Returns text segments interleaved with data blocks.
 */
function parseContentBlocks(content: string): ContentSegment[] {
  const blocks: ContentSegment[] = [];
  const regex = /```data:([\w-]+)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ kind: 'text', text: content.slice(lastIndex, match.index) });
    }
    try {
      const parsed = JSON.parse(match[2].trim());
      blocks.push({ kind: 'data', block: { type: match[1], data: parsed } });
    } catch {
      blocks.push({ kind: 'text', text: match[0] });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    blocks.push({ kind: 'text', text: content.slice(lastIndex) });
  }

  return blocks;
}

function DataBlockRenderer({ block }: { block: DataBlock }) {
  const d = block.data as Record<string, any>;

  switch (block.type) {
    case 'extraction':
      return (
        <div className="my-3">
          <ExtractionTable
            studies={d.extracted_studies || d.studies || []}
            templateId={d.extraction_template || d.template_id}
          />
        </div>
      );
    case 'rob-traffic':
      return (
        <div className="my-3">
          <RobTrafficLight
            assessments={d.assessments || []}
            toolId={d.tool_id || ''}
          />
        </div>
      );
    case 'rob-summary':
      return (
        <div className="my-3">
          <RobSummaryTable assessments={d.assessments || []} />
        </div>
      );
    case 'sof':
      return (
        <div className="my-3">
          <SummaryOfFindings
            title={d.title}
            population={d.population}
            intervention={d.intervention}
            comparison={d.comparison}
            outcomes={d.outcomes || []}
          />
        </div>
      );
    case 'grade':
      return (
        <div className="my-3 inline-block">
          <GradeBadge certainty={d.certainty || d.level || 'Very Low'} />
        </div>
      );
    case 'prisma-flow':
      return (
        <div className="my-3">
          <PrismaFlowDiagram data={d as any} title={d.title as string} />
        </div>
      );
    case 'manuscript-section':
      return (
        <div className="my-3">
          <ManuscriptSection
            sectionId={d.section_id as string || ''}
            sectionName={d.section_name as string || 'Section'}
            content={d.content as string || ''}
            prismaItems={d.prisma_items as string}
            wordCount={d.word_count as number}
          />
        </div>
      );
    default:
      return null;
  }
}

const markdownComponents = {
  p: ({ children }: any) => <p className="text-[#0f172a] mb-3 last:mb-0">{children}</p>,
  ul: ({ children }: any) => (
    <ul className="text-[#0f172a] list-disc list-inside mb-3 space-y-1">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="text-[#0f172a] list-decimal list-inside mb-3 space-y-1">{children}</ol>
  ),
  li: ({ children }: any) => <li className="text-[#0f172a]">{children}</li>,
  code: ({ inline, children }: any) =>
    inline ? (
      <code className="bg-[#f1f5f9] px-1.5 py-0.5 rounded text-blue-600 text-sm">{children}</code>
    ) : (
      <code className="block bg-[#f1f5f9] p-3 rounded-lg text-blue-600 text-sm overflow-x-auto">
        {children}
      </code>
    ),
  h1: ({ children }: any) => (
    <h1 className="text-2xl font-bold text-[#0f172a] mb-3">{children}</h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-xl font-bold text-[#0f172a] mb-3">{children}</h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-lg font-semibold text-[#0f172a] mb-2">{children}</h3>
  ),
  strong: ({ children }: any) => (
    <strong className="font-semibold text-blue-600">{children}</strong>
  ),
  a: ({ href, children }: any) => (
    <a
      href={href}
      className="text-blue-500 hover:text-blue-400 underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
};

export default function ChatMessage({ message }: ChatMessageProps) {
  const contentBlocks = useMemo(
    () => (message.role === 'assistant' ? parseContentBlocks(message.content) : []),
    [message.content, message.role]
  );
  const hasDataBlocks = contentBlocks.some(b => b.kind === 'data');

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl px-6 py-4">
          <p className="text-[#0f172a] whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        <div className="bg-white border border-[#e2e8f0] rounded-2xl px-6 py-4 shadow-sm">
          <div className="prose prose-sm max-w-none">
            {hasDataBlocks ? (
              contentBlocks.map((segment, idx) => {
                if (segment.kind === 'text') {
                  const text = segment.text.trim();
                  if (!text) return null;
                  return (
                    <ReactMarkdown
                      key={idx}
                      remarkPlugins={[remarkGfm]}
                      components={markdownComponents}
                    >
                      {text}
                    </ReactMarkdown>
                  );
                }
                return <DataBlockRenderer key={idx} block={segment.block} />;
              })
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        </div>

        {message.artifacts && message.artifacts.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.artifacts.map((artifact, index) => (
              <ArtifactCard key={index} artifact={artifact} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
