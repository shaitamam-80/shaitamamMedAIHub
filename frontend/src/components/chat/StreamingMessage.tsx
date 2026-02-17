'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface StreamingMessageProps {
  content: string;
}

export default function StreamingMessage({ content }: StreamingMessageProps) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] bg-white border border-[#e2e8f0] rounded-2xl px-6 py-4 shadow-sm">
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="text-[#0f172a] mb-3 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="text-[#0f172a] list-disc list-inside mb-3 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="text-[#0f172a] list-decimal list-inside mb-3 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="text-[#0f172a]">{children}</li>,
              code: ({ inline, children }: any) =>
                inline ? (
                  <code className="bg-[#f1f5f9] px-1.5 py-0.5 rounded text-blue-600 text-sm">{children}</code>
                ) : (
                  <code className="block bg-[#f1f5f9] p-3 rounded-lg text-blue-600 text-sm overflow-x-auto">{children}</code>
                ),
              h1: ({ children }) => <h1 className="text-2xl font-bold text-[#0f172a] mb-3">{children}</h1>,
              h2: ({ children }) => <h2 className="text-xl font-bold text-[#0f172a] mb-3">{children}</h2>,
              h3: ({ children }) => <h3 className="text-lg font-semibold text-[#0f172a] mb-2">{children}</h3>,
              strong: ({ children }) => <strong className="font-semibold text-blue-600">{children}</strong>,
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
