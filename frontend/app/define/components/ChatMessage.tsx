'use client';

import { Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Helper function to parse markdown-like content into structured sections
const parseAssistantMessage = (content: string) => {
  // Check if it's raw JSON (error case)
  if (
    content.startsWith('{"chat_response"') ||
    content.startsWith('{"chat_response"')
  ) {
    try {
      const parsed = JSON.parse(content);
      return parsed.chat_response || content;
    } catch {
      return content;
    }
  }
  return content;
};

// Component to render formatted message with proper markdown and RTL support
const FormattedMessage = ({
  content,
  role,
}: {
  content: string;
  role: string;
}) => {
  const parsedContent =
    role === 'assistant' ? parseAssistantMessage(content) : content;

  return (
    <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-lg font-bold mt-4 mb-2 text-primary">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold mt-3 mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-medium mt-2 mb-1 text-muted-foreground">
              {children}
            </h4>
          ),
          p: ({ children }) => <p className="my-1">{children}</p>,
          strong: ({ children }) => <strong>{children}</strong>,
          em: ({ children }) => <em>{children}</em>,
          code: ({ children }) => (
            <code className="bg-muted px-1 rounded text-xs">{children}</code>
          ),
          ul: ({ children }) => (
            <ul className="my-2 list-disc list-inside space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 list-decimal list-inside space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="my-0.5">{children}</li>,
        }}
      >
        {parsedContent}
      </ReactMarkdown>
    </div>
  );
};

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
  preferredLanguage: 'he' | 'en' | null;
}

export function ChatMessage({ content, role, preferredLanguage }: ChatMessageProps) {
  const isHebrew = preferredLanguage === 'he';
  const isUser = role === 'user';

  return (
    <div
      className={`flex items-start gap-3 max-w-2xl w-full ${
        isHebrew
          ? isUser
            ? 'self-end flex-row-reverse'
            : 'self-start'
          : isUser
          ? 'self-start'
          : 'self-end flex-row-reverse'
      }`}
    >
      {/* Avatar */}
      {isUser ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground mt-1">
          <span className="text-xs font-bold">
            {isHebrew ? 'אני' : 'Me'}
          </span>
        </div>
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-1">
          <Sparkles className="h-4 w-4" />
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={`rounded-lg p-4 shadow-sm ${
          isUser
            ? `bg-primary text-primary-foreground ${
                isHebrew ? 'rounded-tr-none' : 'rounded-tl-none'
              }`
            : `bg-muted/50 border border-border ${
                isHebrew ? 'rounded-tl-none' : 'rounded-tr-none'
              }`
        }`}
        dir={isHebrew ? 'rtl' : 'ltr'}
      >
        <FormattedMessage content={content} role={role} />
      </div>
    </div>
  );
}
