# DEFINE Frontend - All Design Files (Unified)

> This document contains the complete source code of all frontend files related to the DEFINE tool design.
> Generated: 2026-02-12

---

## Table of Contents

1. [Define Page (Main)](#1-define-page) - `frontend/app/define/page.tsx`
2. [ChatMessage Component](#2-chatmessage) - `frontend/app/define/components/ChatMessage.tsx`
3. [FinerCardV2 Component](#3-finercardv2) - `frontend/app/define/components/FinerCardV2.tsx`
4. [FinerScoreCard Component](#4-finerscorecard) - `frontend/app/define/components/FinerScoreCard.tsx`
5. [LanguageSelector Component](#5-languageselector) - `frontend/app/define/components/LanguageSelector.tsx`
6. [Root Layout](#6-root-layout) - `frontend/app/layout.tsx`
7. [Global CSS](#7-global-css) - `frontend/app/globals.css`
8. [Tailwind Config](#8-tailwind-config) - `frontend/tailwind.config.ts`
9. [Utils (cn)](#9-utils) - `frontend/lib/utils.ts`
10. [App Sidebar](#10-app-sidebar) - `frontend/components/sidebar/app-sidebar.tsx`
11. [API Client + Types](#11-api-client) - `frontend/lib/api.ts`

---

## 1. Define Page

**File:** `frontend/app/define/page.tsx`

```tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiClient, ChatMessage, FrameworkSchema, Project } from "@/lib/api";
import {
  Download,
  FileText,
  Loader2,
  Save,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { LanguageSelector } from "./components/LanguageSelector";
import { ChatMessage as ChatMessageComponent, parseAssistantMessage } from "./components/ChatMessage";
import type { FormulatedQuestion } from "@/lib/api";

export default function DefinePage() {
  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [frameworks, setFrameworks] = useState<Record<string, FrameworkSchema>>(
    {}
  );
  const [selectedFramework, setSelectedFramework] = useState<string>("PICO");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [frameworkData, setFrameworkData] = useState<Record<string, string>>(
    {}
  );
  const [preferredLanguage, setPreferredLanguage] = useState<
    "he" | "en" | null
  >(null);
  const [showProtocol, setShowProtocol] = useState(false);
  // Store formulated questions with FINER assessments indexed by message position
  const [formulatedQuestionsMap, setFormulatedQuestionsMap] = useState<Record<number, FormulatedQuestion[]>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load projects and frameworks on mount
  useEffect(() => {
    loadProjects();
    loadFrameworks();
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadProjects = async () => {
    try {
      const data = await apiClient.getProjects();
      setProjects(data);
      if (data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data[0].id);
        if (data[0].framework_data) {
          setFrameworkData(data[0].framework_data);
        }
        if (data[0].framework_type) {
          setSelectedFramework(data[0].framework_type);
        }
        loadConversation(data[0].id);
      }
    } catch (error) {
      toast.error("Failed to load projects");
    }
  };

  const loadFrameworks = async () => {
    try {
      const data = await apiClient.getFrameworks();
      if (data?.frameworks) {
        setFrameworks(data.frameworks);
      }
    } catch (error) {
      // Use default PICO if API fails
      setFrameworks({
        PICO: {
          name: "PICO",
          description: "Population, Intervention, Comparison, Outcome",
          fields: [
            {
              key: "P",
              label: "Population",
              description: "Who is the patient or population?",
            },
            {
              key: "I",
              label: "Intervention",
              description: "What is the intervention?",
            },
            {
              key: "C",
              label: "Comparison",
              description: "What is the comparison?",
            },
            { key: "O", label: "Outcome", description: "What is the outcome?" },
          ],
        },
      });
    }
  };

  const loadConversation = async (projectId: string) => {
    try {
      const data = await apiClient.getConversation(projectId);
      if (data?.messages) {
        setMessages(data.messages);
      }
      if (data?.framework_data) {
        setFrameworkData(data.framework_data);
      }
    } catch (error) {
      // New project with no conversation yet
      setMessages([]);
    }
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      if (project.framework_data) setFrameworkData(project.framework_data);
      if (project.framework_type) setSelectedFramework(project.framework_type);
    }
    loadConversation(projectId);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedProjectId) return;

    setIsLoading(true);
    const userMessage = inputMessage.trim();
    setInputMessage("");

    // Add user message to chat
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      const data = await apiClient.chat(
        selectedProjectId,
        userMessage,
        selectedFramework,
        preferredLanguage || "en"
      );

      // Calculate the index for this assistant message (current messages + user message)
      const newMessageIndex = messages.length + 1;

      // Add AI response to chat
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);

      // Store formulated questions with FINER assessments if present
      if (data.formulated_questions && data.formulated_questions.length > 0) {
        setFormulatedQuestionsMap((prev) => ({
          ...prev,
          [newMessageIndex]: data.formulated_questions!,
        }));
      }

      // Update framework data if extracted
      if (data.extracted_fields) {
        setFrameworkData((prev) => ({ ...prev, ...data.extracted_fields }));
        toast.success(
          preferredLanguage === "he"
            ? "הפרוטוקול עודכן!"
            : "Protocol updated!",
          { icon: "✨" }
        );
      }

      // Auto-detect framework suggestion from AI response
      const frameworkNames = Object.keys(frameworks);
      for (const fw of frameworkNames) {
        if (fw !== selectedFramework) {
          const patterns = [
            `המסגרת המומלצת: ${fw}`,
            `מסגרת **${fw}**`,
            `מסגרת ${fw}`,
            `Framework: ${fw}`,
            `**${fw}**`,
            `(${fw})`,
          ];
          const messageText = data.message;
          const found = patterns.some((pattern) =>
            messageText.includes(pattern)
          );

          if (found) {
            setSelectedFramework(fw);
            toast.success(
              preferredLanguage === "he"
                ? `המסגרת שונתה ל-${fw}`
                : `Framework switched to ${fw}`,
              { duration: 4000, icon: "🔄" }
            );
            break;
          }
        }
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Something went wrong";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${errorMessage}`,
        },
      ]);
      toast.error("Failed to send message");
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleExportProtocol = () => {
    const project = projects.find((p) => p.id === selectedProjectId);
    const projectName = project?.name || "research-protocol";

    const lines = [
      `# Research Protocol: ${projectName}`,
      ``,
      `## Framework: ${selectedFramework}`,
      `Generated: ${new Date().toLocaleString()}`,
      ``,
      `## Research Question Components`,
      ``,
    ];

    const currentFramework = frameworks[selectedFramework];
    currentFramework?.fields.forEach((field) => {
      const value = frameworkData[field.key] || "(Not specified)";
      lines.push(`### ${field.label} (${field.key})`);
      lines.push(value);
      lines.push(``);
    });

    if (messages.length > 0) {
      lines.push(`## Conversation History`);
      lines.push(``);
      messages.forEach((msg) => {
        lines.push(`**${msg.role === "user" ? "User" : "Assistant"}:**`);
        lines.push(msg.content);
        lines.push(``);
      });
    }

    const content = lines.join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName
      .replace(/\s+/g, "-")
      .toLowerCase()}-protocol.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(
      preferredLanguage === "he"
        ? "הפרוטוקול יוצא בהצלחה!"
        : "Protocol exported successfully!"
    );
  };

  const handleClearHistory = async () => {
    if (!selectedProjectId) return;

    if (
      !confirm(
        preferredLanguage === "he"
          ? "האם אתה בטוח שברצונך למחוק את כל ההיסטוריה?"
          : "Are you sure you want to clear all chat history? This cannot be undone."
      )
    ) {
      return;
    }

    try {
      await apiClient.clearConversation(selectedProjectId);
      setMessages([]);
      setFormulatedQuestionsMap({});
      setPreferredLanguage(null);
      toast.success(
        preferredLanguage === "he" ? "ההיסטוריה נמחקה" : "Chat history cleared"
      );
    } catch (error) {
      toast.error("Failed to clear chat history");
    }
  };

  const handleSaveProject = async () => {
    if (!selectedProjectId) return;
    try {
      await apiClient.updateProject(selectedProjectId, {
        framework_type: selectedFramework,
        framework_data: frameworkData,
      });
      toast.success(
        preferredLanguage === "he" ? "הפרויקט נשמר" : "Project saved successfully"
      );
    } catch (error) {
      toast.error("Failed to save project");
    }
  };

  const currentFrameworkSchema = frameworks[selectedFramework];
  const extractedFieldsCount = Object.keys(frameworkData).filter(
    (k) => frameworkData[k]
  ).length;
  const totalFields = currentFrameworkSchema?.fields.length || 0;

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <Toaster position="top-right" />

      {/* Top Header Bar */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:px-6 z-10">
        <div className="flex items-center gap-4">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="font-display text-xl font-bold hidden sm:block">
            Define Research Question
          </h1>
          <h1 className="font-display text-lg font-bold sm:hidden">Define</h1>
        </div>

        {/* Project Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedProjectId}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="max-w-[180px] md:max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-primary"
          >
            <option value="">Select Project...</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          {/* View Protocol Button */}
          <Dialog open={showProtocol} onOpenChange={setShowProtocol}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={!selectedProjectId}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden md:inline">Protocol</span>
                {extractedFieldsCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 px-1.5 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  >
                    {extractedFieldsCount}/{totalFields}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>
                    {preferredLanguage === "he"
                      ? "פרוטוקול מחקר"
                      : "Research Protocol"}
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-primary/10 text-primary border-primary/20"
                  >
                    {selectedFramework}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto space-y-4 py-4">
                {/* Framework Selector in Dialog */}
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">
                    {preferredLanguage === "he" ? "מסגרת:" : "Framework:"}
                  </Label>
                  <select
                    value={selectedFramework}
                    onChange={(e) => setSelectedFramework(e.target.value)}
                    className="text-sm rounded-md border border-border bg-background px-2 py-1"
                  >
                    {Object.keys(frameworks).map((fw) => (
                      <option key={fw} value={fw}>
                        {fw}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Framework Fields */}
                {currentFrameworkSchema ? (
                  currentFrameworkSchema.fields.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          {field.label}{" "}
                          <span className="text-muted-foreground text-xs">
                            ({field.key})
                          </span>
                        </Label>
                        {frameworkData[field.key] ? (
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          >
                            {preferredLanguage === "he" ? "חולץ" : "Extracted"}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] h-5 text-muted-foreground border-dashed"
                          >
                            {preferredLanguage === "he" ? "ריק" : "Empty"}
                          </Badge>
                        )}
                      </div>
                      <Textarea
                        value={frameworkData[field.key] || ""}
                        onChange={(e) =>
                          setFrameworkData((prev) => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }))
                        }
                        placeholder={field.description}
                        className="min-h-[80px] resize-none text-sm"
                      />
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                )}
              </div>

              {/* Dialog Footer Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveProject}
                  disabled={!selectedProjectId}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {preferredLanguage === "he" ? "שמור" : "Save"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportProtocol}
                  disabled={!selectedProjectId}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {preferredLanguage === "he" ? "ייצא" : "Export"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>


          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearHistory}
            disabled={!selectedProjectId || messages.length === 0}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            title="Clear Chat History"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content - Centralized Chat */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          <div
            className={`flex flex-col gap-6 ${
              preferredLanguage === "he" ? "items-end" : "items-start"
            }`}
          >
            {/* Welcome / Language Selection */}
            {messages.length === 0 && !preferredLanguage && (
              <LanguageSelector onSelect={setPreferredLanguage} />
            )}

            {/* Initial Greeting after Language Selection */}
            {messages.length === 0 && preferredLanguage && (
              <div
                className={`flex items-start gap-3 max-w-xl w-full ${
                  preferredLanguage === "he" ? "flex-row-reverse" : ""
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>

                <div
                  className={`rounded-lg p-4 bg-muted border border-border ${
                    preferredLanguage === "he"
                      ? "rounded-tr-none"
                      : "rounded-tl-none"
                  }`}
                  dir={preferredLanguage === "he" ? "rtl" : "ltr"}
                >
                  {preferredLanguage === "he" ? (
                    <>
                      <p className="text-sm font-semibold mb-2">שלום! 👋</p>
                      <p className="text-sm mb-2">
                        אני אאפיין עבורך את שאלת המחקר ואזהה את המסגרת התיאורטית
                        המתאימה ביותר.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        פשוט ספר לי על הנושא או הרעיון למחקר שלך.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold mb-2">Hello! 👋</p>
                      <p className="text-sm mb-2">
                        I'll analyze your research topic and automatically
                        identify the most appropriate theoretical framework.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Just tell me about your research idea or topic.
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {messages.map((message, index) => (
              <ChatMessageComponent
                key={index}
                content={message.content}
                role={message.role}
                preferredLanguage={preferredLanguage}
                cards={message.role === "assistant" ? formulatedQuestionsMap[index] : undefined}
              />
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div
                className={`flex items-start gap-3 max-w-lg ${
                  preferredLanguage === "he"
                    ? "self-start"
                    : "self-end flex-row-reverse"
                }`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div
                  className={`rounded-lg bg-muted p-3 ${
                    preferredLanguage === "he"
                      ? "rounded-tl-none"
                      : "rounded-tr-none"
                  }`}
                >
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Input Area - Fixed at Bottom */}
      <div
        className="border-t border-border bg-card p-4"
        dir={preferredLanguage === "he" ? "rtl" : "ltr"}
      >
        <div className="max-w-6xl mx-auto">
          <div className="relative flex gap-2">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                preferredLanguage === "he"
                  ? "ספר לי על המחקר שלך..."
                  : "Tell me about your research..."
              }
              disabled={isLoading || !selectedProjectId || !preferredLanguage}
              className="min-h-[50px] max-h-[150px] resize-none bg-background border-border focus:ring-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              rows={1}
            />
            <Button
              onClick={handleSendMessage}
              disabled={
                isLoading || !inputMessage.trim() || !selectedProjectId
              }
              size="icon"
              className="h-[50px] w-[50px] shrink-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send
                  className={`h-5 w-5 ${
                    preferredLanguage === "he" ? "rotate-180" : ""
                  }`}
                />
              )}
            </Button>
          </div>
          {!selectedProjectId && (
            <p className="mt-2 text-xs text-muted-foreground text-center">
              {preferredLanguage === "he"
                ? "אנא בחר פרויקט כדי להתחיל"
                : "Please select a project to start"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 2. ChatMessage

**File:** `frontend/app/define/components/ChatMessage.tsx`

```tsx
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
      return content;
    } catch {
      // Invalid JSON, try regex extraction below
    }
  }

  // Case 3: Extract chat_response using regex (handles partial/malformed JSON)
  const regex = /"chat_response"\s*:\s*"((?:[^"\\]|\\[\s\S])*)"/;
  const match = trimmed.match(regex);

  if (match && match[1]) {
    try {
      return JSON.parse(`"${match[1]}"`);
    } catch {
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
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value.startsWith('"')) {
        value = value.slice(1);
      }
      return value
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    }
  }

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
```

---

## 3. FinerCardV2

**File:** `frontend/app/define/components/FinerCardV2.tsx`

```tsx
'use client';

import { Sparkles } from 'lucide-react';
import type { FormulatedQuestion } from '@/lib/api';

interface FinerCardV2Props {
  question: FormulatedQuestion;
  language: 'he' | 'en';
}

const TYPE_LABELS = {
  broad: { en: 'Broad', he: 'ניסוח רחב' },
  focused: { en: 'Focused', he: 'ניסוח ממוקד' },
  alternative: { en: 'Alternative', he: 'זווית חלופית' },
};

export function FinerCardV2({ question, language }: FinerCardV2Props) {
  const isHebrew = language === 'he';
  const assessment = question.finer_assessment;
  const score = assessment?.overall_score ?? 0;

  const showHebrew = isHebrew && question.hebrew;
  const questionHebrew = showHebrew ? question.hebrew : null;

  const isHighScore = score >= 80;
  const scoreColorClass = isHighScore ? 'bg-green-500' : 'bg-yellow-500';
  const scoreTextClass = isHighScore ? 'text-green-600' : 'text-yellow-600';
  const iconBgClass = isHighScore ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700';

  const title = isHebrew
    ? TYPE_LABELS[question.type]?.he || question.type
    : TYPE_LABELS[question.type]?.en || question.type;

  return (
    <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
      {/* Top colored bar based on score */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${scoreColorClass}`} />

      {/* Score header */}
      <div className="flex justify-between items-center mb-3 pt-1">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${iconBgClass}`}>
            <Sparkles size={16} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-muted-foreground">
            FINER Score
          </span>
        </div>
        <span className={`text-xl font-black ${scoreTextClass}`}>
          {score}
        </span>
      </div>

      {/* Title */}
      <h3
        className={`text-gray-900 dark:text-foreground font-bold text-base mb-3 leading-snug ${isHebrew ? 'text-right' : 'text-left'}`}
        dir={isHebrew ? 'rtl' : 'ltr'}
      >
        {title}
      </h3>

      {/* Question blocks */}
      <div className="space-y-2 mt-auto">
        {/* Hebrew question - purple border */}
        {questionHebrew && (
          <div className="bg-gray-50 dark:bg-muted/30 p-2.5 rounded-lg border-r-4 border-purple-500 text-right">
            <p className="text-sm text-gray-700 dark:text-foreground font-medium leading-relaxed" dir="rtl">
              {questionHebrew}
            </p>
          </div>
        )}

        {/* English question - blue border */}
        {question.english && (
          <div className={`p-2.5 rounded-lg border-l-4 border-blue-500 text-left ${
            questionHebrew
              ? 'bg-blue-50 dark:bg-blue-950/30'
              : 'bg-gray-50 dark:bg-muted/30'
          }`}>
            <p
              className={`text-blue-900 dark:text-blue-200 font-medium leading-relaxed ${
                questionHebrew
                  ? 'text-xs font-mono'
                  : 'text-sm'
              }`}
              dir="ltr"
            >
              {question.english}
            </p>
          </div>
        )}
      </div>

      {/* FINER breakdown on hover - mini indicators */}
      {assessment && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-border">
          <div className="flex gap-1">
            {(['F', 'I', 'N', 'E', 'R'] as const).map((key) => {
              const itemScore = assessment[key]?.score;
              const bgColor = itemScore === 'high'
                ? 'bg-green-500'
                : itemScore === 'medium'
                  ? 'bg-yellow-500'
                  : 'bg-red-500';
              return (
                <div
                  key={key}
                  className="flex-1 flex flex-col items-center gap-1"
                  title={assessment[key]?.reason}
                >
                  <span className="text-[9px] font-bold text-gray-400">{key}</span>
                  <div className={`w-full h-1 rounded-full ${bgColor}`} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Export the cards column component for side-by-side layout
interface FinerCardsColumnProps {
  questions: FormulatedQuestion[];
  language: 'he' | 'en';
}

export function FinerCardsColumn({ questions, language }: FinerCardsColumnProps) {
  const isHebrew = language === 'he';

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className={`flex items-center gap-2 px-1 opacity-70 ${isHebrew ? 'flex-row-reverse justify-start' : 'flex-row justify-start'}`}>
        <Sparkles size={14} className="text-purple-500" />
        <span className="text-xs font-semibold text-gray-500 dark:text-muted-foreground">
          {isHebrew ? 'הצעות FINER' : 'FINER Suggestions'}
        </span>
      </div>

      {/* Cards */}
      {questions.map((question, idx) => (
        <FinerCardV2 key={idx} question={question} language={language} />
      ))}
    </div>
  );
}
```

---

## 4. FinerScoreCard

**File:** `frontend/app/define/components/FinerScoreCard.tsx`

```tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Trophy,
  Target,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { FormulatedQuestion } from '@/lib/api';

interface FinerScoreCardProps {
  questions: FormulatedQuestion[];
  language: 'he' | 'en';
}

const getScoreIcon = (score: 'high' | 'medium' | 'low', size: string = 'h-3 w-3') => {
  switch (score) {
    case 'high':
      return <CheckCircle2 className={`${size} text-green-600`} />;
    case 'medium':
      return <AlertCircle className={`${size} text-amber-500`} />;
    case 'low':
      return <XCircle className={`${size} text-red-500`} />;
  }
};

const getScoreColor = (score: 'high' | 'medium' | 'low') => {
  switch (score) {
    case 'high':
      return 'bg-green-500';
    case 'medium':
      return 'bg-amber-500';
    case 'low':
      return 'bg-red-500';
  }
};

const getRecommendationBg = (rec?: 'proceed' | 'revise' | 'reconsider') => {
  switch (rec) {
    case 'proceed':
      return 'bg-green-500';
    case 'revise':
      return 'bg-amber-500';
    case 'reconsider':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
};

const TYPE_LABELS = {
  broad: { en: 'Broad', he: 'רחב' },
  focused: { en: 'Focused', he: 'ממוקד' },
  alternative: { en: 'Alternative', he: 'חלופי' },
};

const FINER_KEYS = ['F', 'I', 'N', 'E', 'R'] as const;

function CompactQuestionCard({
  question,
  language,
  isRecommended,
}: {
  question: FormulatedQuestion;
  language: 'he' | 'en';
  isRecommended: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isHebrew = language === 'he';
  const assessment = question.finer_assessment;

  if (!assessment) return null;

  return (
    <div
      className={cn(
        'border rounded-lg overflow-hidden transition-all',
        isRecommended ? 'ring-2 ring-primary border-primary' : 'border-border'
      )}
    >
      {/* Compact Header - Score bar */}
      <div className={cn('px-3 py-2 text-white flex items-center justify-between', getRecommendationBg(assessment.recommendation))}>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
            {isHebrew ? TYPE_LABELS[question.type].he : TYPE_LABELS[question.type].en}
          </Badge>
          {isRecommended && (
            <Trophy className="h-4 w-4 text-yellow-300" />
          )}
        </div>
        <span className="font-bold text-lg">
          {assessment.overall_score ?? '—'}
        </span>
      </div>

      {/* Question text */}
      <div className="px-3 py-2 bg-card space-y-2">
        {question.hebrew && (
          <div>
            <p className="text-[10px] text-muted-foreground mb-0.5" dir="rtl">🇮🇱 עברית</p>
            <p className="text-xs line-clamp-2" dir="rtl" title={question.hebrew}>
              {question.hebrew}
            </p>
          </div>
        )}
        {question.english && (
          <div>
            <p className="text-[10px] text-muted-foreground mb-0.5">🇺🇸 English</p>
            <p className="text-xs line-clamp-2" dir="ltr" title={question.english}>
              {question.english}
            </p>
          </div>
        )}
        {!question.hebrew && !question.english && (
          <p className="text-xs text-muted-foreground italic">
            {isHebrew ? 'אין שאלה זמינה' : 'No question available'}
          </p>
        )}
      </div>

      {/* FINER mini bar */}
      <div className="px-3 py-1.5 bg-muted/30 flex items-center gap-0.5">
        {FINER_KEYS.map((key) => (
          <div
            key={key}
            className={cn(
              'flex-1 h-1.5 rounded-full',
              getScoreColor(assessment[key].score)
            )}
            title={`${key}: ${assessment[key].reason}`}
          />
        ))}
      </div>

      {/* Expand button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-1 text-xs text-muted-foreground hover:bg-muted/50 flex items-center justify-center gap-1 border-t"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 py-2 bg-muted/20 border-t space-y-1.5 text-xs">
          {FINER_KEYS.map((key) => (
            <div key={key} className="flex items-start gap-2">
              <span className="font-medium w-4">{key}</span>
              {getScoreIcon(assessment[key].score)}
              <span className="text-muted-foreground flex-1 line-clamp-1">
                {assessment[key].reason}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function FinerScoreCard({ questions, language }: FinerScoreCardProps) {
  const isHebrew = language === 'he';

  const sortedQuestions = [...questions].sort((a, b) => {
    const scoreA = a.finer_assessment?.overall_score ?? 0;
    const scoreB = b.finer_assessment?.overall_score ?? 0;
    return scoreB - scoreA;
  });

  const recommendedIndex = questions.findIndex(
    (q) => q === sortedQuestions[0]
  );

  return (
    <div className="space-y-3">
      {/* Compact Header with comparison bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {isHebrew ? 'הערכת FINER' : 'FINER Assessment'}
          </span>
        </div>

        {/* Mini comparison bars */}
        {questions.length > 1 && (
          <div className="flex items-center gap-2">
            {sortedQuestions.map((q, idx) => (
              <div key={idx} className="flex items-center gap-1" title={`${TYPE_LABELS[q.type][isHebrew ? 'he' : 'en']}: ${q.finer_assessment?.overall_score ?? 0}`}>
                <span className="text-[10px] text-muted-foreground">
                  {TYPE_LABELS[q.type][isHebrew ? 'he' : 'en'].charAt(0)}
                </span>
                <Progress
                  value={q.finer_assessment?.overall_score ?? 0}
                  className="w-12 h-1.5"
                />
                <span className="text-[10px] font-medium">
                  {q.finer_assessment?.overall_score ?? 0}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Question cards in horizontal grid */}
      <div className={cn(
        'grid gap-2',
        questions.length === 1 ? 'grid-cols-1' :
        questions.length === 2 ? 'grid-cols-2' :
        'grid-cols-3'
      )}>
        {questions.map((question, idx) => (
          <CompactQuestionCard
            key={idx}
            question={question}
            language={language}
            isRecommended={idx === recommendedIndex && questions.length > 1}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## 5. LanguageSelector

**File:** `frontend/app/define/components/LanguageSelector.tsx`

```tsx
'use client';

import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface LanguageSelectorProps {
  onSelect: (language: 'en' | 'he') => void;
}

export function LanguageSelector({ onSelect }: LanguageSelectorProps) {
  return (
    <div className="w-full flex justify-center py-8 md:py-16">
      <div className="rounded-xl bg-card border border-border p-6 md:p-8 shadow-lg max-w-md w-full">
        <div className="flex justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>
        <h3 className="text-xl font-bold mb-2 text-center">
          Welcome to MedAI Hub
        </h3>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          I'll help you formulate your research question and extract
          the key components.
        </p>
        <p className="text-sm font-medium mb-4 text-center">
          Choose your preferred language:
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={() => onSelect('he')}
            className="h-auto py-4 flex flex-col gap-1 hover:border-primary hover:bg-primary/5"
          >
            <span className="text-2xl">🇮🇱</span>
            <span className="font-medium">עברית</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => onSelect('en')}
            className="h-auto py-4 flex flex-col gap-1 hover:border-primary hover:bg-primary/5"
          >
            <span className="text-2xl">🇺🇸</span>
            <span className="font-medium">English</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## 6. Root Layout

**File:** `frontend/app/layout.tsx`

```tsx
import { ErrorBoundary } from "@/components/error-boundary";
import { MobileNav } from "@/components/mobile-nav";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/auth-context";
import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans, Source_Serif_4 } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "MedAI Hub - AI-Powered Systematic Review Platform",
    template: "%s | MedAI Hub",
  },
  description:
    "Streamline your systematic literature review with AI. From research question to evidence synthesis - PICO frameworks, PubMed queries, and automated abstract screening.",
  keywords: [
    "systematic review",
    "literature review",
    "medical research",
    "PICO",
    "PubMed",
    "AI screening",
    "abstract screening",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0e1a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} ${jetbrainsMono.variable} ${sourceSerif.variable} font-sans antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg z-50 font-medium shadow-lg"
        >
          Skip to main content
        </a>
        <NuqsAdapter>
          <AuthProvider>
            <div className="flex h-screen overflow-hidden bg-background">
              {/* Desktop Sidebar */}
              <div className="hidden md:flex md:p-4">
                <AppSidebar />
              </div>

              {/* Main Content Area */}
              <main
                id="main-content"
                className="flex-1 overflow-y-auto md:p-4 md:pl-0"
              >
                <div className="min-h-full md:rounded-2xl md:bg-card/20 md:border md:border-border/30">
                  <ErrorBoundary>
                    {children}
                    <Toaster />
                  </ErrorBoundary>
                </div>
              </main>

              {/* Mobile Navigation */}
              <MobileNav />
            </div>
          </AuthProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
```

---

## 7. Global CSS

**File:** `frontend/app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ============================================
   MedAI Hub - Clinical Modern Design System
   ============================================

   Aesthetic: Clean, Professional, Medical Blue
   Philosophy: Less is more. Color only for action/status.

   Token Reference: lib/design-system/tokens.ts
   ============================================ */

@layer base {
  :root {
    /* === Core Palette (Light Mode) === */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    /* Primary: Medical Blue (Blue-600) */
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;

    /* Accent: Innovation Violet (for AI features) */
    --accent: 263 70% 58%;
    --accent-foreground: 210 40% 98%;

    /* Secondary: Teal (for complementary actions) */
    --secondary: 172 66% 40%;
    --secondary-foreground: 210 40% 98%;

    /* Muted: Slate-100 */
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    /* Destructive: Red */
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    /* === Status Colors === */
    --success: 160 84% 39%;
    --success-foreground: 210 40% 98%;

    --warning: 38 92% 50%;
    --warning-foreground: 0 0% 0%;

    --info: 217 91% 60%;
    --info-foreground: 210 40% 98%;

    /* === Borders & Inputs === */
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;

    /* === Radius Profiles === */
    --radius-card: 1rem;
    --radius-button: 0.5rem;
    --radius-badge: 0.375rem;
    --radius: 0.5rem;

    /* === Layout === */
    --sidebar-width: 280px;
    --sidebar-width-collapsed: 72px;
  }

  .dark {
    /* === Core Palette (Dark Mode) === */
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;

    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;

    /* Primary: Slightly lighter blue for dark mode */
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;

    /* Accent: Lighter violet */
    --accent: 263 70% 65%;
    --accent-foreground: 210 40% 98%;

    /* Secondary: Brighter teal */
    --secondary: 172 66% 50%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    /* Muted */
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    /* Destructive */
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    /* Status Colors (Dark) */
    --success: 160 84% 45%;
    --success-foreground: 222.2 47.4% 11.2%;

    --warning: 38 92% 55%;
    --warning-foreground: 0 0% 0%;

    --info: 217 91% 65%;
    --info-foreground: 222.2 47.4% 11.2%;

    /* Borders */
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

/* === Base Styles === */
@layer base {
  * {
    @apply border-border;
  }

  html {
    scroll-behavior: smooth;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    @apply bg-background text-foreground font-sans;
    font-feature-settings: "rlig" 1, "calt" 1;
  }

  /* Typography Scale */
  h1, h2, h3, h4, h5, h6 {
    @apply font-bold tracking-tight text-foreground;
  }

  h1 { @apply text-4xl md:text-5xl; }
  h2 { @apply text-2xl md:text-3xl; }
  h3 { @apply text-xl md:text-2xl; }
  h4 { @apply text-lg md:text-xl; }

  /* Selection */
  ::selection {
    @apply bg-primary/20 text-foreground;
  }

  /* Scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    @apply bg-transparent;
  }

  ::-webkit-scrollbar-thumb {
    @apply bg-border rounded-full;
    border: 2px solid transparent;
    background-clip: content-box;
  }

  ::-webkit-scrollbar-thumb:hover {
    @apply bg-muted-foreground/30;
  }

  /* Firefox scrollbar */
  * {
    scrollbar-width: thin;
    scrollbar-color: hsl(var(--border)) transparent;
  }
}

/* === Component Styles === */
@layer components {
  .article-content {
    @apply font-serif leading-relaxed text-lg;
  }

  .article-content p {
    @apply mb-4;
  }

  .status-include {
    @apply bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20;
  }

  .status-exclude {
    @apply bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20;
  }

  .status-maybe {
    @apply bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20;
  }

  .status-pending {
    @apply bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20;
  }

  .card-elevated {
    @apply bg-card border border-border shadow-md;
  }

  .card-interactive {
    @apply bg-card border border-border shadow-sm transition-all duration-200;
    @apply hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5;
  }

  .focus-ring {
    @apply outline-none ring-2 ring-primary/50 ring-offset-2 ring-offset-background;
  }
}

/* === Utility Classes === */
@layer utilities {
  .text-gradient-primary {
    @apply bg-clip-text text-transparent;
    background-image: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(221 83% 40%) 100%);
  }

  .density-comfortable {
    --spacing-unit: 1rem;
  }

  .density-compact {
    --spacing-unit: 0.5rem;
    --radius-card: 0.5rem;
    --radius-button: 0.25rem;
  }

  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }

  .line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

/* === Animations === */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out forwards;
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out forwards;
}
```

---

## 8. Tailwind Config

**File:** `frontend/tailwind.config.ts`

```ts
import type { Config } from "tailwindcss"
import { fontFamily } from "tailwindcss/defaultTheme"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", ...fontFamily.sans],
        serif: ["var(--font-source-serif)", ...fontFamily.serif],
        mono: ["var(--font-jetbrains-mono)", ...fontFamily.mono],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius-card)",
        md: "var(--radius-button)",
        sm: "var(--radius-badge)",
      },
      spacing: {
        "sidebar": "var(--sidebar-width)",
        "sidebar-collapsed": "var(--sidebar-width-collapsed)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
```

---

## 9. Utils

**File:** `frontend/lib/utils.ts`

```ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## 10. App Sidebar

**File:** `frontend/components/sidebar/app-sidebar.tsx`

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { apiClient as api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  FileText,
  Filter,
  FolderOpen,
  Home,
  Info,
  LogOut,
  MessageSquare,
  Sparkles,
  Search,
  User,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const navigation = [
  { name: "Home", href: "/", icon: Home, description: "Dashboard" },
  { name: "Projects", href: "/projects", icon: FolderOpen, description: "Manage Projects" },
  { name: "Define", href: "/define", icon: MessageSquare, description: "Step 1: Research Question", step: 1, color: "indigo" },
  { name: "Query", href: "/query", icon: Search, description: "Step 2: Search Builder", step: 2, color: "teal" },
  { name: "Screen", href: "/screening", icon: Filter, description: "Step 3: Smart Screener", step: 3, color: "emerald" },
  { name: "Review", href: "/review", icon: FileText, description: "Step 4: Full-Text Review", step: 4, color: "amber" },
  { name: "About", href: "/about", icon: Info, description: "About Creator" },
];

// ... (full component code - see source file for complete implementation)
// Key features:
// - Collapsible sidebar with animation (framer-motion)
// - Step numbers for workflow clarity (1-4)
// - Color-coded navigation items (indigo, teal, emerald, amber)
// - Quick Start Demo button
// - User section with sign in/out
// - Active route indicator with spring animation
// - Tooltip support when collapsed
```

---

## 11. API Client

**File:** `frontend/lib/api.ts`

```ts
// Key types relevant to DEFINE:

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface FrameworkField {
  key: string;
  label: string;
  description: string;
}

export interface FrameworkSchema {
  name: string;
  description: string;
  fields: FrameworkField[];
}

export interface FinerScore {
  score: "high" | "medium" | "low";
  reason: string;
}

export interface FinerAssessment {
  F: FinerScore;
  I: FinerScore;
  N: FinerScore;
  E: FinerScore;
  R: FinerScore;
  overall?: "proceed" | "revise" | "reconsider";
  overall_score?: number;
  recommendation?: "proceed" | "revise" | "reconsider";
  suggestions?: string[];
}

export interface FormulatedQuestion {
  type: "broad" | "focused" | "alternative";
  hebrew?: string;
  english: string;
  finer_assessment?: FinerAssessment;
}

export interface ChatResponse {
  message: string;
  framework_data?: Record<string, string>;
  extracted_fields?: Record<string, string>;
  finer_assessment?: FinerAssessment;
  formulated_questions?: FormulatedQuestion[];
}

// API methods relevant to DEFINE:
// apiClient.getFrameworks()         -> GET /api/v1/define/frameworks
// apiClient.chat(...)               -> POST /api/v1/define/chat
// apiClient.getConversation(...)    -> GET /api/v1/define/conversation/{id}
// apiClient.clearConversation(...)  -> DELETE /api/v1/define/conversation/{id}
// apiClient.assessFiner(...)        -> POST /api/v1/define/finer-assessment

// Full source: see frontend/lib/api.ts (732 lines with all project types)
```

---

**End of unified file.**
**Total files included: 11**
**Total lines of source code: ~2,800+**
