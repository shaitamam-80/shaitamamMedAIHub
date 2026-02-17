'use client';

import { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import StreamingMessage from './StreamingMessage';
import { chatStream, type ChatRequestPayload } from '@/lib/api/backend-client';
import { CheckCircle2 } from 'lucide-react';

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

interface ChatInterfaceProps {
  skillName: string;
  projectContext?: {
    projectId: string;
    stage: string;
    stageName: string;
  };
  initialMessages?: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  onStageComplete?: () => void;
  stageStatus?: string;
}

export default function ChatInterface({
  skillName,
  projectContext,
  initialMessages,
  onStageComplete,
  stageStatus,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  // Check backend connectivity on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const { healthCheck } = await import('@/lib/api/backend-client');
        const health = await healthCheck();
        setBackendStatus(health.status === 'healthy' ? 'connected' : 'disconnected');
      } catch {
        setBackendStatus('disconnected');
      }
    };
    checkBackend();
  }, []);

  // Load initial messages (from DB history) or show greeting
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      // Use loaded history from DB
      setMessages(initialMessages.map(m => ({
        ...m,
        artifacts: undefined,
      })));
    } else {
      // Fresh conversation - show greeting
      const greetingMessage: Message = {
        id: 'greeting',
        role: 'assistant',
        content: projectContext
          ? `שלום! אני כאן לעזור לך עם השלב "${projectContext.stageName}". במה אוכל לסייע?`
          : `שלום! אני כאן לעזור לך עם ${skillName}. במה אוכל לסייע?`,
        timestamp: new Date(),
      };
      setMessages([greetingMessage]);
    }
  }, [skillName, projectContext?.projectId, projectContext?.stage]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingContent('');

    try {
      // Build payload - filter out greeting from history sent to backend
      const payload: ChatRequestPayload = {
        messages: [...messages, userMessage]
          .filter(m => m.id !== 'greeting')
          .map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        skillName,
        projectContext,
        language: 'he',
      };

      // Call the MedAI Hub backend (SSE streaming)
      const response = await chatStream(payload);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              continue;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.content) {
                accumulatedContent += parsed.content;
                setStreamingContent(accumulatedContent);
              }

              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              if (data.trim()) {
                console.warn('Failed to parse chunk:', data);
              }
            }
          }
        }
      }

      const artifacts = detectArtifacts(accumulatedContent);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: accumulatedContent,
        artifacts,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingContent('');
    } catch (error) {
      console.error('Chat error:', error);

      const errorContent = backendStatus === 'disconnected'
        ? 'לא ניתן להתחבר לשרת ה-Backend. ודא שה-Backend פועל ב-http://localhost:8000'
        : 'מצטער, אירעה שגיאה. אנא נסה שוב.';

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
      setStreamingContent('');
    } finally {
      setIsLoading(false);
    }
  };

  const detectArtifacts = (content: string): Message['artifacts'] => {
    const artifacts: Message['artifacts'] = [];

    // Match backend artifact format: ```artifact:filename.ext\ncontent```
    const artifactRegex = /```artifact:([\w\-.]+)\n([\s\S]*?)```/g;
    let match;

    while ((match = artifactRegex.exec(content)) !== null) {
      const filename = match[1];
      const fileContent = match[2].trim();
      const extension = filename.split('.').pop() || '';

      artifacts?.push({
        name: filename,
        type: extension,
        content: fileContent,
      });
    }

    return artifacts && artifacts.length > 0 ? artifacts : undefined;
  };

  // Check if user has sent at least one real message (beyond greeting)
  const hasUserMessages = messages.some(m => m.role === 'user');

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {/* Backend Status Indicator */}
      {backendStatus === 'disconnected' && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/30 flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          <span className="text-red-400">
            Backend לא מחובר - ודא שהשרת פועל ב-{process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}
          </span>
        </div>
      )}
      {backendStatus === 'checking' && (
        <div className="px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/30 flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          <span className="text-yellow-400">בודק חיבור ל-Backend...</span>
        </div>
      )}

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-6"
      >
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {isLoading && streamingContent && (
          <StreamingMessage content={streamingContent} />
        )}

        {isLoading && !streamingContent && (
          <div className="flex justify-start">
            <div className="bg-white border border-[#e2e8f0] rounded-2xl px-6 py-4 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Stage Completion Controls */}
      {projectContext && stageStatus === 'completed' && (
        <div className="px-4 py-3 border-t border-green-500/30 bg-green-500/10 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-400 font-medium">שלב זה הושלם</span>
        </div>
      )}

      {projectContext && stageStatus !== 'completed' && onStageComplete && (
        <div className="px-4 py-3 border-t border-[#e2e8f0] bg-white flex items-center justify-between">
          <span className="text-sm text-[#475569]">
            סיימת לעבוד על שלב זה?
          </span>
          <button
            onClick={onStageComplete}
            disabled={isLoading || !hasUserMessages}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            סיים שלב
          </button>
        </div>
      )}

      <div className="border-t border-[#e2e8f0] bg-white">
        <ChatInput onSend={sendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
