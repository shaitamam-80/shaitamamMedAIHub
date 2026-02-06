'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ArtifactCard from './ArtifactCard';

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

export default function ChatMessage({ message }: ChatMessageProps) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl px-6 py-4">
          <p className="text-[#f1f5f9] whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        <div className="bg-[#111827] border border-[#1e293b] rounded-2xl px-6 py-4">
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
              {message.content}
            </ReactMarkdown>
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
