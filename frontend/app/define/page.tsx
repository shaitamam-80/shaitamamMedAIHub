"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient, ChatMessage, FrameworkSchema, Project } from "@/lib/api";
import { Download, Loader2, Save, Send, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import ReactMarkdown from "react-markdown";

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
    role === "assistant" ? parseAssistantMessage(content) : content;

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

      // Add AI response to chat
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);

      // Update framework data if extracted
      if (data.extracted_fields) {
        setFrameworkData((prev) => ({ ...prev, ...data.extracted_fields }));
        toast.success("Form updated with extracted data", { icon: "✨" });
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
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${error.message || "Something went wrong"}`,
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

    toast.success("Protocol exported successfully!");
  };

  const handleClearHistory = async () => {
    if (!selectedProjectId) return;

    if (
      !confirm(
        "Are you sure you want to clear all chat history? This cannot be undone."
      )
    ) {
      return;
    }

    try {
      await apiClient.clearConversation(selectedProjectId);
      setMessages([]);
      setPreferredLanguage(null);
      toast.success("Chat history cleared");
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
      toast.success("Project saved successfully");
    } catch (error) {
      toast.error("Failed to save project");
    }
  };

  const currentFrameworkSchema = frameworks[selectedFramework];

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      <Toaster position="top-right" />

      {/* Top Header Bar */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-4 md:px-6 z-10">
        <div className="flex items-center gap-4">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="font-display text-xl font-bold">
            Define Research Question
          </h1>
        </div>

        {/* Project Selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground whitespace-nowrap hidden md:block">
            Project:
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-primary"
          >
            <option value="">Select Project...</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveProject}
            disabled={!selectedProjectId}
            className="hidden md:flex gap-2"
          >
            <Save className="h-4 w-4" />
            Save
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExportProtocol}
            disabled={!selectedProjectId}
            title="Export Protocol"
          >
            <Download className="h-5 w-5" />
          </Button>
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

      {/* Main Content - Split Screen */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Framework Form (50%) */}
        <div className="w-1/2 border-r border-border bg-card/30 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center bg-card/50">
            <h2 className="font-semibold flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/20"
              >
                {selectedFramework}
              </Badge>
              Framework
            </h2>
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

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {currentFrameworkSchema ? (
              currentFrameworkSchema.fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor={field.key}
                      className="text-base font-medium text-foreground"
                    >
                      {field.label}{" "}
                      <span className="text-muted-foreground text-xs ml-1">
                        ({field.key})
                      </span>
                    </Label>
                    {frameworkData[field.key] ? (
                      <Badge
                        variant="secondary"
                        className="text-[10px] h-5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      >
                        Extracted
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[10px] h-5 text-muted-foreground border-dashed"
                      >
                        Empty
                      </Badge>
                    )}
                  </div>
                  <div className="relative">
                    <Textarea
                      id={field.key}
                      placeholder={field.description}
                      value={frameworkData[field.key] || ""}
                      onChange={(e) =>
                        setFrameworkData((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                      className={`min-h-[100px] resize-none transition-colors ${
                        !frameworkData[field.key]
                          ? "border-dashed border-muted-foreground/30 bg-muted/20 focus:bg-background focus:border-solid"
                          : "bg-background/50 focus:bg-background"
                      }`}
                    />
                    {preferredLanguage === "he" && (
                      <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground/50 pointer-events-none">
                        English Only
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p>Loading framework schema...</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: AI Chat (50%) */}
        <div className="w-1/2 flex flex-col bg-background">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div
              className={`flex flex-col gap-6 max-w-3xl ${
                preferredLanguage === "he"
                  ? "mr-0 ml-auto items-end"
                  : "ml-0 mr-auto items-start"
              }`}
            >
              {/* Welcome / Language Selection */}
              {messages.length === 0 && (
                <div
                  className={`flex items-start gap-3 max-w-xl w-full ${
                    preferredLanguage === "he" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>

                  <div className="flex flex-col gap-4 flex-1">
                    {!preferredLanguage && (
                      <div className="rounded-lg rounded-tl-none bg-muted p-6 border border-border">
                        <h3 className="text-lg font-semibold mb-2 text-center">
                          Welcome to MedAI Hub
                        </h3>
                        <p className="text-sm text-muted-foreground mb-6 text-center">
                          I'll help you formulate your research question and
                          extract the key components.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <Button
                            variant="outline"
                            onClick={() => setPreferredLanguage("he")}
                            className="h-auto py-4 flex flex-col gap-1 hover:border-primary hover:bg-primary/5"
                          >
                            <span className="text-lg">🇮🇱</span>
                            <span className="font-medium">עברית</span>
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setPreferredLanguage("en")}
                            className="h-auto py-4 flex flex-col gap-1 hover:border-primary hover:bg-primary/5"
                          >
                            <span className="text-lg">🇺🇸</span>
                            <span className="font-medium">English</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {preferredLanguage === "he" && (
                      <div
                        className="rounded-lg rounded-tr-none bg-muted p-4"
                        dir="rtl"
                      >
                        <p className="text-sm font-semibold mb-2">שלום! 👋</p>
                        <p className="text-sm mb-2">
                          אני אאפיין עבורך את שאלת המחקר ואזהה את המסגרת
                          התיאורטית המתאימה ביותר.
                        </p>
                        <p className="text-sm text-muted-foreground">
                          פשוט ספר לי על הנושא או הרעיון למחקר שלך.
                        </p>
                      </div>
                    )}

                    {preferredLanguage === "en" && (
                      <div className="rounded-lg rounded-tl-none bg-muted p-4">
                        <p className="text-sm font-semibold mb-2">Hello! 👋</p>
                        <p className="text-sm mb-2">
                          I'll analyze your research topic and automatically
                          identify the most appropriate theoretical framework.
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Just tell me about your research idea or topic.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              {messages.map((message, index) => {
                const isHebrew = preferredLanguage === "he";
                const isUser = message.role === "user";
                const isAssistant = message.role === "assistant";
                const messageAlignment = isHebrew
                  ? isUser
                    ? "self-end"
                    : "self-start"
                  : isUser
                  ? "self-start"
                  : "self-end";
                const flexDirection = isHebrew
                  ? isUser
                    ? "flex-row-reverse"
                    : ""
                  : isUser
                  ? ""
                  : "flex-row-reverse";
                const bubbleCorner = isHebrew
                  ? isUser
                    ? "rounded-tr-none"
                    : "rounded-tl-none"
                  : isUser
                  ? "rounded-tl-none"
                  : "rounded-tr-none";

                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3 max-w-2xl w-full ${messageAlignment} ${flexDirection}`}
                  >
                    {isAssistant && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-1">
                        <Sparkles className="h-4 w-4" />
                      </div>
                    )}
                    {isUser && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground mt-1">
                        <span className="text-xs font-bold">
                          {isHebrew ? "אני" : "Me"}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                      <div
                        className={`rounded-lg p-4 shadow-sm ${
                          isUser
                            ? `bg-primary text-primary-foreground ${bubbleCorner}`
                            : `bg-muted/50 border border-border ${bubbleCorner}`
                        }`}
                        dir={isHebrew ? "rtl" : "ltr"}
                      >
                        <FormattedMessage
                          content={message.content}
                          role={message.role}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

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

          {/* Input Area */}
          <div
            className="p-4 border-t border-border bg-background/50 backdrop-blur-sm"
            dir={preferredLanguage === "he" ? "rtl" : "ltr"}
          >
            <div
              className={`max-w-3xl ${
                preferredLanguage === "he" ? "mr-0 ml-auto" : "ml-0 mr-auto"
              }`}
            >
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
                  disabled={
                    isLoading || !selectedProjectId || !preferredLanguage
                  }
                  className={`min-h-[50px] max-h-[150px] resize-none bg-background border-border focus:ring-primary ${
                    preferredLanguage === "he" ? "pl-4 pr-4" : "pr-4"
                  }`}
                  rows={1}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={
                    isLoading || !inputMessage.trim() || !selectedProjectId
                  }
                  size="icon"
                  className="h-[50px] w-[50px] shrink-0"
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
      </div>
    </div>
  );
}
