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
                        I&apos;ll analyze your research topic and automatically
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
