'use client';

import { Sparkles, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { FormulatedQuestion } from '@/lib/api';
import { FinerCardsColumn } from './FinerCardV2';

/**
 * Extract the actual message content from potentially malformed AI responses.
 *
 * The backend should save only chat_response text, but older messages
 * may have raw JSON or partial JSON stored.
 */
export const parseAssistantMessage = (content: string): string => {
  if (!content || typeof content !== 'string') {
    return '';
  }

  const trimmed = content.trim();

  // Case 1: Already clean text (most common case after fix)
  // If it doesn't look like JSON, return as-is
  if (!trimmed.includes('"chat_response"') && !trimmed.startsWith('{')) {
    return content;
  }

  // Case 2: Full valid JSON object
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.chat_response) {
        return parsed.chat_response;
      }
      // JSON but no chat_response field - return original
      return content;
    } catch {
      // Invalid JSON, try regex extraction below
    }
  }

  // Case 3: Extract chat_response using regex (handles partial/malformed JSON)
  // This regex captures everything between "chat_response": " and the closing "
  // It handles escaped characters inside the string
  const regex = /"chat_response"\s*:\s*"((?:[^"\\]|\\[\s\S])*)"/;
  const match = trimmed.match(regex);

  if (match && match[1]) {
    // Properly unescape the JSON string value
    try {
      // Use JSON.parse to properly unescape
      return JSON.parse(`"${match[1]}"`);
    } catch {
      // Manual unescape as fallback
      return match[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    }
  }

  // Case 4: String starts with "chat_response" without opening brace
  if (trimmed.startsWith('"chat_response"')) {
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx > 0) {
      let value = trimmed.slice(colonIdx + 1).trim();
      // Remove surrounding quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value.startsWith('"')) {
        value = value.slice(1);
      }
      // Unescape
      return value
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    }
  }

  // Fallback: return original content
  return content;
};

// Helper: Detect if text contains Hebrew
const isHebrewText = (text: string): boolean => {
  const hebrewPattern = /[\u0590-\u05FF]/;
  return hebrewPattern.test(text);
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
  cards?: FormulatedQuestion[];
}

export function ChatMessage({ content, role, preferredLanguage, cards }: ChatMessageProps) {
  const isHebrew = preferredLanguage === 'he';
  const isUser = role === 'user';
  const hasCards = cards && cards.length > 0 && !isUser;

  // If message has cards, use the "Side-by-Side" Layout
  if (hasCards) {
    return (
      <div className={`flex w-full mb-8 gap-6 items-start ${isHebrew ? 'flex-row' : 'flex-row-reverse'}`}>

        {/* SIDE COLUMN: Cards (Left for Hebrew, Right for English) */}
        <div className="w-1/3 min-w-[320px] flex flex-col gap-4 order-1 shrink-0">
          <FinerCardsColumn questions={cards} language={preferredLanguage || 'en'} />
        </div>

        {/* MAIN COLUMN: Text Bubble (Right for Hebrew, Left for English) */}
        <div className="flex-1 order-2">
          <div className={`flex ${isHebrew ? 'justify-end' : 'justify-start'}`}>
            {/* Avatar (English side - left) */}
            {!isHebrew && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-700 dark:text-purple-300 flex items-center justify-center mr-3 mt-1">
                <Sparkles size={14} />
              </div>
            )}

            <div
              className={`relative max-w-full rounded-2xl p-6 shadow-sm bg-white dark:bg-card border border-gray-100 dark:border-border text-gray-800 dark:text-foreground ${
                isHebrew ? 'text-right rounded-bl-none' : 'text-left rounded-br-none'
              }`}
            >
              {/* Content Header */}
              <div className={`text-sm font-bold text-purple-700 dark:text-purple-400 mb-2 ${isHebrew ? 'text-right' : 'text-left'}`}>
                {isHebrew ? 'ניתוח AI' : 'AI Analysis'}
              </div>

              {/* Content Body */}
              <div dir={isHebrew ? 'rtl' : 'ltr'}>
                <FormattedMessage content={content} role={role} />
              </div>

              {/* Meta */}
              <div className={`mt-3 flex items-center gap-1 text-[10px] opacity-60 ${isHebrew ? 'flex-row-reverse' : 'flex-row'}`}>
                <span>MedAI Bot</span>
                <span>•</span>
                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* Avatar (Hebrew side - right) */}
            {isHebrew && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-700 dark:text-purple-300 flex items-center justify-center ml-3 mt-1">
                <Sparkles size={14} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Standard Chat Message Layout (no cards)
  // Layout logic:
  // Hebrew (RTL): User messages on RIGHT, AI on LEFT
  // English (LTR): User messages on LEFT, AI on RIGHT
  const alignRight = isHebrew ? isUser : !isUser;
  const flexReverse = alignRight;

  return (
    <div className={`flex w-full mb-6 ${isHebrew ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar Left (English) */}
      {!isHebrew && (
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-auto mr-2 ${
            isUser
              ? 'bg-blue-200 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
              : 'bg-purple-200 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
          }`}
        >
          {isUser ? <User size={14} /> : <Sparkles size={14} />}
        </div>
      )}

      <div
        className={`relative max-w-[70%] rounded-2xl p-5 shadow-sm ${
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-none'
            : 'bg-white dark:bg-card border border-gray-100 dark:border-border text-gray-800 dark:text-foreground rounded-bl-none'
        }`}
      >
        <div
          className={`text-base leading-relaxed ${isHebrew ? 'text-right' : 'text-left'}`}
          dir={isHebrew ? 'rtl' : 'ltr'}
        >
          {isUser ? content : <FormattedMessage content={content} role={role} />}
        </div>

        <div className={`mt-2 flex items-center gap-1 text-[10px] opacity-60 ${isHebrew ? 'flex-row-reverse' : 'flex-row'}`}>
          <span>{isUser ? (isHebrew ? 'את/ה' : 'You') : 'MedAI Bot'}</span>
          <span>•</span>
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Avatar Right (Hebrew) */}
      {isHebrew && (
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-auto ml-2 ${
            isUser
              ? 'bg-blue-200 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
              : 'bg-purple-200 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
          }`}
        >
          {isUser ? <User size={14} /> : <Sparkles size={14} />}
        </div>
      )}
    </div>
  );
}
