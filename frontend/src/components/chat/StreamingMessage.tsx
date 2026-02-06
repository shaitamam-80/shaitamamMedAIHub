'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface StreamingMessageProps {
  content: string;
}

export default function StreamingMessage({ content }: StreamingMessageProps) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] bg-[#111827] border border-[#1e293b] rounded-2xl px-6 py-4">
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="text-[#f1f5f9] mb-3 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="text-[#f1f5f9] list-disc list-inside mb-3 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="text-[#f1f5f9] list-decimal list-inside mb-3 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="text-[#f1f5f9]">{children}</li>,
              code: ({ inline, children }: any) => 
                inline ? (
                  <code className="bg-[#0a0e1a] px-1.5 py-0.5 rounded text-blue-400 text-sm">{children}</code>
                ) : (
                  <code className="block bg-[#0a0e1a] p-3 rounded-lg text-blue-400 text-sm overflow-x-auto">{children}</code>
                ),
              h1: ({ children }) => <h1 className="text-2xl font-bold text-[#f1f5f9] mb-3">{children}</h1>,
              h2: ({ children }) => <h2 className="text-xl font-bold text-[#f1f5f9] mb-3">{children}</h2>,
              h3: ({ children }) => <h3 className="text-lg font-semibold text-[#f1f5f9] mb-2">{children}</h3>,
              strong: ({ children }) => <strong className="font-semibold text-blue-400">{children}</strong>,
              a: ({ href, children }) => (
                <a href={href} className="text-blue-500 hover:text-blue-400 underline" target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
        {/* Cursor */}
        <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1" />
      </div>
    </div>
  );
}
