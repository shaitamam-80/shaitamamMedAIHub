'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot } from 'lucide-react';

interface StreamingMessageProps {
  content: string;
}

export default function StreamingMessage({ content }: StreamingMessageProps) {
  return (
    <div className="flex justify-start gap-3">
      {/* AI avatar */}
      <div className="flex-shrink-0 mt-1">
        <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 shadow-md shadow-primary/15 animate-pulse">
          <Bot className="size-4 text-white" />
        </div>
      </div>

      <div className="max-w-[85%] bg-card border border-border rounded-2xl px-6 py-4 shadow-sm">
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="text-foreground mb-3 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="text-foreground list-disc list-inside mb-3 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="text-foreground list-decimal list-inside mb-3 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="text-foreground">{children}</li>,
              code: ({ inline, children }: any) =>
                inline ? (
                  <code className="bg-primary/8 px-1.5 py-0.5 rounded text-primary text-sm font-mono">{children}</code>
                ) : (
                  <code className="block bg-muted p-3 rounded-lg text-primary text-sm overflow-x-auto font-mono">{children}</code>
                ),
              h1: ({ children }) => <h1 className="text-2xl font-bold text-foreground mb-3">{children}</h1>,
              h2: ({ children }) => <h2 className="text-xl font-bold text-foreground mb-3">{children}</h2>,
              h3: ({ children }) => <h3 className="text-lg font-semibold text-foreground mb-2">{children}</h3>,
              strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
              a: ({ href, children }) => (
                <a href={href} className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors" target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
        {/* Typing cursor */}
        <span className="inline-block w-2 h-4 bg-primary rounded-sm animate-pulse ml-1" />
      </div>
    </div>
  );
}
