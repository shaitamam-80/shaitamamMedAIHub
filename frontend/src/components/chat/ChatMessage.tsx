'use client';

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot } from 'lucide-react';
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
  p: ({ children }: any) => <p className="text-foreground mb-3 last:mb-0">{children}</p>,
  ul: ({ children }: any) => (
    <ul className="text-foreground list-disc list-inside mb-3 space-y-1">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="text-foreground list-decimal list-inside mb-3 space-y-1">{children}</ol>
  ),
  li: ({ children }: any) => <li className="text-foreground">{children}</li>,
  code: ({ inline, children }: any) =>
    inline ? (
      <code className="bg-primary/8 px-1.5 py-0.5 rounded text-primary text-sm font-mono">{children}</code>
    ) : (
      <code className="block bg-muted p-3 rounded-lg text-primary text-sm overflow-x-auto font-mono">
        {children}
      </code>
    ),
  h1: ({ children }: any) => (
    <h1 className="text-2xl font-bold text-foreground mb-3">{children}</h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-xl font-bold text-foreground mb-3">{children}</h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-lg font-semibold text-foreground mb-2">{children}</h3>
  ),
  strong: ({ children }: any) => (
    <strong className="font-semibold text-primary">{children}</strong>
  ),
  a: ({ href, children }: any) => (
    <a
      href={href}
      className="text-primary hover:text-primary/80 underline underline-offset-2 decoration-primary/30 hover:decoration-primary/60 transition-colors"
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
        <div className="max-w-[80%] bg-gradient-to-br from-primary/12 to-blue-500/8 border border-primary/20 rounded-2xl px-6 py-4 shadow-sm">
          <p className="text-foreground whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start gap-3">
      {/* AI avatar */}
      <div className="flex-shrink-0 mt-1">
        <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 shadow-md shadow-primary/15">
          <Bot className="size-4 text-white" />
        </div>
      </div>

      <div className="max-w-[85%]">
        <div className="bg-card border border-border rounded-2xl px-6 py-4 shadow-sm">
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
