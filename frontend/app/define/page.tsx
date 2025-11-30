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
import { apiClient, ChatMessage, FrameworkSchema, Project, FinerAssessmentResponse } from "@/lib/api";
import {
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Save,
  Send,
  Sparkles,
  Trash2,
  ClipboardCheck,
  AlertTriangle,
  XCircle,
  RefreshCw,
} from "lucide-react";
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
  const [showProtocol, setShowProtocol] = useState(false);
  const [showFinerDialog, setShowFinerDialog] = useState(false);
  const [finerQuestion, setFinerQuestion] = useState("");
  const [finerResults, setFinerResults] = useState<Map<string, FinerAssessmentResponse>>(new Map());
  const [isFinerLoading, setIsFinerLoading] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState<string[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
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

    // Add FINER Assessment Results if available
    if (finerResults.size > 0) {
      lines.push(`## FINER Quality Assessment`);
      lines.push(``);

      let questionNum = 1;
      finerResults.forEach((result, question) => {
        lines.push(`### Assessment ${questionNum}: ${question}`);
        lines.push(``);
        lines.push(`**Overall Recommendation:** ${result.overall.toUpperCase()}`);
        lines.push(``);
        lines.push(`| Criterion | Score | Reason |`);
        lines.push(`|-----------|-------|--------|`);
        lines.push(`| Feasible | ${result.F.score} | ${result.F.reason} |`);
        lines.push(`| Interesting | ${result.I.score} | ${result.I.reason} |`);
        lines.push(`| Novel | ${result.N.score} | ${result.N.reason} |`);
        lines.push(`| Ethical | ${result.E.score} | ${result.E.reason} |`);
        lines.push(`| Relevant | ${result.R.score} | ${result.R.reason} |`);
        lines.push(``);

        if (result.suggestions && result.suggestions.length > 0) {
          lines.push(`**Suggestions for Improvement:**`);
          result.suggestions.forEach((suggestion, idx) => {
            lines.push(`${idx + 1}. ${suggestion}`);
          });
          lines.push(``);
        }
        questionNum++;
      });
    }

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

  // Extract research questions from chat messages
  // Focus on finding actual formulated questions, not explanatory text
  const extractQuestionsFromChat = (): string[] => {
    const questions: string[] = [];

    messages.forEach((msg) => {
      if (msg.role === "assistant") {
        const content = parseAssistantMessage(msg.content);

        // Hebrew: Look for questions in quotes after formulation labels
        // Pattern: "שאלה" or quoted text after ניסוח רחב/ממוקד
        const hebrewQuotedPatterns = [
          // Questions in Hebrew quotes after labels
          /"([^"]+\?[^"]*)"/g,
          /"([^"]+\?[^"]*)"/g,
        ];

        // English: Look for questions in quotes
        const englishQuotedPatterns = [
          /"([^"]+\?[^"]*)"/g,
        ];

        // Determine language based on content
        const isHebrew = /[\u0590-\u05FF]/.test(content);
        const patterns = isHebrew ? hebrewQuotedPatterns : englishQuotedPatterns;

        patterns.forEach((pattern) => {
          let match;
          const regex = new RegExp(pattern.source, pattern.flags);
          while ((match = regex.exec(content)) !== null) {
            let question = match[1].trim();

            // Clean up the question - remove leading/trailing punctuation
            question = question.replace(/^[\s\-–—:]+/, "").replace(/[\s\-–—:]+$/, "");

            // Validate: Must be a substantial question (30+ chars), end with ?, and not be English translation marker
            const isValidQuestion =
              question.length >= 30 &&
              question.endsWith("?") &&
              !question.toLowerCase().startsWith("what is the") && // Skip if it's English in Hebrew mode
              !question.includes("English Translation") &&
              !question.includes("🔤") &&
              !questions.some((q) => q === question || q.includes(question) || question.includes(q));

            if (isValidQuestion) {
              questions.push(question);
            }
          }
        });

        // Fallback: If no quoted questions found and content is Hebrew,
        // look for lines starting with common question words
        if (questions.length === 0 && isHebrew) {
          const lines = content.split("\n");
          lines.forEach((line: string) => {
            const trimmed = line.trim();
            // Hebrew questions often start with: מהי, מהו, האם, כיצד, מה, איך
            if (
              /^[""]?(מהי|מהו|האם|כיצד|מה|איך|בקרב)/.test(trimmed) &&
              trimmed.includes("?") &&
              trimmed.length >= 30 &&
              trimmed.length <= 500 // Not too long (avoid paragraphs)
            ) {
              const question = trimmed.replace(/^[""]/, "").replace(/[""]$/, "").trim();
              if (!questions.includes(question)) {
                questions.push(question);
              }
            }
          });
        }
      }
    });

    // Limit to max 5 questions to avoid overwhelming the user
    return questions.slice(0, 5);
  };

  // Handle opening FINER dialog - auto-extract questions
  const handleOpenFinerDialog = (open: boolean) => {
    setShowFinerDialog(open);
    if (open) {
      // Auto-extract questions when dialog opens
      const extracted = extractQuestionsFromChat();
      setExtractedQuestions(extracted);
      // Pre-select all extracted questions
      setSelectedQuestions(new Set(extracted));
      // Clear previous results when opening fresh
      setFinerResults(new Map());
      setFinerQuestion("");
    }
  };

  // Toggle question selection
  const toggleQuestionSelection = (question: string) => {
    setSelectedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(question)) {
        newSet.delete(question);
      } else {
        newSet.add(question);
      }
      return newSet;
    });
  };

  const handleFinerAssessment = async () => {
    if (!selectedProjectId) return;

    // Gather questions to assess (selected extracted + manual input)
    const questionsToAssess: string[] = [];

    // Add selected extracted questions
    selectedQuestions.forEach((q) => questionsToAssess.push(q));

    // Add manual question if provided and not already included
    if (finerQuestion.trim() && !questionsToAssess.includes(finerQuestion.trim())) {
      questionsToAssess.push(finerQuestion.trim());
    }

    if (questionsToAssess.length === 0) {
      toast.error(
        preferredLanguage === "he"
          ? "אנא בחר או הזן שאלת מחקר להערכה"
          : "Please select or enter a research question to assess"
      );
      return;
    }

    setIsFinerLoading(true);
    const newResults = new Map<string, FinerAssessmentResponse>();

    // Assess each question
    for (const question of questionsToAssess) {
      try {
        const result = await apiClient.assessFiner(
          selectedProjectId,
          question,
          selectedFramework,
          frameworkData,
          preferredLanguage || "en"
        );
        newResults.set(question, result);
      } catch (error) {
        console.error(`Failed to assess question: ${question}`, error);
      }
    }

    setFinerResults(newResults);
    setIsFinerLoading(false);

    if (newResults.size > 0) {
      toast.success(
        preferredLanguage === "he"
          ? `הושלמו ${newResults.size} הערכות FINER!`
          : `Completed ${newResults.size} FINER assessment(s)!`
      );
    } else {
      toast.error(
        preferredLanguage === "he"
          ? "שגיאה בביצוע הערכת FINER"
          : "Failed to assess research questions"
      );
    }
  };

  // Send question with FINER suggestions back to chat for revision
  const handleSendForRevision = (question: string, result: FinerAssessmentResponse) => {
    // Build a message with the question and suggestions
    const suggestionsText = result.suggestions.join("\n- ");
    const revisionMessage = preferredLanguage === "he"
      ? `אני רוצה לשפר את שאלת המחקר הבאה על סמך הערכת FINER:\n\nשאלה: "${question}"\n\nהמלצות לשיפור:\n- ${suggestionsText}\n\nאנא עזור לי לנסח מחדש את השאלה בהתאם להמלצות אלו.`
      : `I want to improve the following research question based on FINER assessment:\n\nQuestion: "${question}"\n\nSuggestions for improvement:\n- ${suggestionsText}\n\nPlease help me reformulate the question according to these suggestions.`;

    // Close FINER dialog
    setShowFinerDialog(false);

    // Set the message in the input and send it
    setInputMessage(revisionMessage);

    // Small delay to allow state update, then send
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const getScoreColor = (score: string) => {
    switch (score) {
      case "high":
        return "text-green-600 dark:text-green-400";
      case "medium":
        return "text-yellow-600 dark:text-yellow-400";
      case "low":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-muted-foreground";
    }
  };

  const getScoreIcon = (score: string) => {
    switch (score) {
      case "high":
        return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case "medium":
        return <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      case "low":
        return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      default:
        return null;
    }
  };

  const getOverallColor = (overall: string) => {
    switch (overall) {
      case "proceed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "revise":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "reconsider":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-muted text-muted-foreground";
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

          {/* FINER Assessment Button & Dialog */}
          <Dialog open={showFinerDialog} onOpenChange={handleOpenFinerDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={!selectedProjectId}
                className="gap-2"
                title="FINER Assessment"
              >
                <ClipboardCheck className="h-4 w-4" />
                <span className="hidden md:inline">FINER</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" dir={preferredLanguage === "he" ? "rtl" : "ltr"}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                  {preferredLanguage === "he" ? "הערכת FINER" : "FINER Assessment"}
                </DialogTitle>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto space-y-4 py-4">
                {/* Description */}
                <p className="text-sm text-muted-foreground">
                  {preferredLanguage === "he"
                    ? "הערך את איכות שאלות המחקר שלך לפי קריטריוני FINER: ישימות, עניין, חדשנות, אתיקה ורלוונטיות."
                    : "Evaluate your research question(s) quality using FINER criteria: Feasible, Interesting, Novel, Ethical, and Relevant."}
                </p>

                {/* Extracted Questions Section */}
                {extractedQuestions.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      {preferredLanguage === "he"
                        ? `שאלות שזוהו מהשיחה (${extractedQuestions.length}):`
                        : `Questions detected from chat (${extractedQuestions.length}):`}
                    </Label>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-2">
                      {extractedQuestions.map((question, idx) => (
                        <label
                          key={idx}
                          className={`flex items-start gap-2 p-2 rounded-md cursor-pointer hover:bg-muted/50 ${
                            selectedQuestions.has(question) ? "bg-primary/10" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedQuestions.has(question)}
                            onChange={() => toggleQuestionSelection(question)}
                            className="mt-1 h-4 w-4 rounded border-border"
                          />
                          <span className="text-sm flex-1">{question}</span>
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedQuestions(new Set(extractedQuestions))}
                        className="text-primary hover:underline"
                      >
                        {preferredLanguage === "he" ? "בחר הכל" : "Select All"}
                      </button>
                      <span className="text-muted-foreground">|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedQuestions(new Set())}
                        className="text-primary hover:underline"
                      >
                        {preferredLanguage === "he" ? "נקה בחירה" : "Clear Selection"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Manual Research Question Input */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {preferredLanguage === "he"
                      ? extractedQuestions.length > 0 ? "או הוסף שאלה ידנית:" : "שאלת המחקר"
                      : extractedQuestions.length > 0 ? "Or add a question manually:" : "Research Question"}
                  </Label>
                  <Textarea
                    value={finerQuestion}
                    onChange={(e) => setFinerQuestion(e.target.value)}
                    placeholder={
                      preferredLanguage === "he"
                        ? "הדבק או כתוב שאלת מחקר נוספת להערכה..."
                        : "Paste or type an additional research question to evaluate..."
                    }
                    className="min-h-[80px] resize-none text-sm"
                  />
                </div>

                {/* Assess Button */}
                <Button
                  onClick={handleFinerAssessment}
                  disabled={isFinerLoading || (selectedQuestions.size === 0 && !finerQuestion.trim())}
                  className="w-full"
                >
                  {isFinerLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {preferredLanguage === "he" ? "מעריך..." : "Assessing..."}
                    </>
                  ) : (
                    <>
                      <ClipboardCheck className="h-4 w-4 mr-2" />
                      {preferredLanguage === "he"
                        ? `בצע הערכת FINER (${selectedQuestions.size + (finerQuestion.trim() ? 1 : 0)} שאלות)`
                        : `Run FINER Assessment (${selectedQuestions.size + (finerQuestion.trim() ? 1 : 0)} question${selectedQuestions.size + (finerQuestion.trim() ? 1 : 0) !== 1 ? "s" : ""})`}
                    </>
                  )}
                </Button>

                {/* FINER Results - Multiple Questions */}
                {finerResults.size > 0 && (
                  <div className="space-y-6 pt-4 border-t">
                    {Array.from(finerResults.entries()).map(([question, result], questionIdx) => (
                      <div key={questionIdx} className="space-y-4">
                        {/* Question Header */}
                        <div className="flex items-start gap-2 bg-muted/50 rounded-lg p-3">
                          <Badge variant="outline" className="shrink-0 mt-0.5">
                            {preferredLanguage === "he" ? `שאלה ${questionIdx + 1}` : `Q${questionIdx + 1}`}
                          </Badge>
                          <p className="text-sm font-medium flex-1">{question}</p>
                        </div>

                        {/* Overall Score */}
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {preferredLanguage === "he" ? "המלצה כללית:" : "Overall:"}
                          </span>
                          <Badge className={`${getOverallColor(result.overall)} text-sm px-3 py-1`}>
                            {result.overall === "proceed"
                              ? preferredLanguage === "he" ? "✅ המשך" : "✅ Proceed"
                              : result.overall === "revise"
                              ? preferredLanguage === "he" ? "⚠️ תקן" : "⚠️ Revise"
                              : preferredLanguage === "he" ? "❌ שקול מחדש" : "❌ Reconsider"}
                          </Badge>
                        </div>

                        {/* Individual Scores */}
                        <div className="space-y-3">
                          {[
                            { key: "F", label: preferredLanguage === "he" ? "ישימות (Feasible)" : "Feasible", data: result.F },
                            { key: "I", label: preferredLanguage === "he" ? "עניין (Interesting)" : "Interesting", data: result.I },
                            { key: "N", label: preferredLanguage === "he" ? "חדשנות (Novel)" : "Novel", data: result.N },
                            { key: "E", label: preferredLanguage === "he" ? "אתיקה (Ethical)" : "Ethical", data: result.E },
                            { key: "R", label: preferredLanguage === "he" ? "רלוונטיות (Relevant)" : "Relevant", data: result.R },
                          ].map(({ key, label, data }) => (
                            <div key={key} className="rounded-lg border p-3 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{label}</span>
                                <div className="flex items-center gap-1.5">
                                  {getScoreIcon(data.score)}
                                  <span className={`text-sm font-medium ${getScoreColor(data.score)}`}>
                                    {data.score === "high"
                                      ? preferredLanguage === "he" ? "גבוה" : "High"
                                      : data.score === "medium"
                                      ? preferredLanguage === "he" ? "בינוני" : "Medium"
                                      : preferredLanguage === "he" ? "נמוך" : "Low"}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">{data.reason}</p>
                            </div>
                          ))}
                        </div>

                        {/* Suggestions */}
                        {result.suggestions && result.suggestions.length > 0 && (
                          <div className="space-y-2">
                            <span className="font-medium text-sm">
                              {preferredLanguage === "he" ? "הצעות לשיפור:" : "Suggestions:"}
                            </span>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                              {result.suggestions.map((suggestion, idx) => (
                                <li key={idx}>{suggestion}</li>
                              ))}
                            </ul>

                            {/* Send for Revision Button - only show if overall is revise or reconsider */}
                            {(result.overall === "revise" || result.overall === "reconsider") && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSendForRevision(question, result)}
                                className="mt-3 gap-2"
                              >
                                <RefreshCw className="h-4 w-4" />
                                {preferredLanguage === "he"
                                  ? "שלח לתיקון בצ'אט"
                                  : "Send for revision in chat"}
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Separator between questions */}
                        {questionIdx < finerResults.size - 1 && (
                          <hr className="border-border" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
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
        <div className="max-w-3xl mx-auto p-4 md:p-6">
          <div
            className={`flex flex-col gap-6 ${
              preferredLanguage === "he" ? "items-end" : "items-start"
            }`}
          >
            {/* Welcome / Language Selection */}
            {messages.length === 0 && !preferredLanguage && (
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
                      onClick={() => setPreferredLanguage("he")}
                      className="h-auto py-4 flex flex-col gap-1 hover:border-primary hover:bg-primary/5"
                    >
                      <span className="text-2xl">🇮🇱</span>
                      <span className="font-medium">עברית</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setPreferredLanguage("en")}
                      className="h-auto py-4 flex flex-col gap-1 hover:border-primary hover:bg-primary/5"
                    >
                      <span className="text-2xl">🇺🇸</span>
                      <span className="font-medium">English</span>
                    </Button>
                  </div>
                </div>
              </div>
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
            {messages.map((message, index) => {
              const isHebrew = preferredLanguage === "he";
              const isUser = message.role === "user";

              return (
                <div
                  key={index}
                  className={`flex items-start gap-3 max-w-2xl w-full ${
                    isHebrew
                      ? isUser
                        ? "self-end flex-row-reverse"
                        : "self-start"
                      : isUser
                      ? "self-start"
                      : "self-end flex-row-reverse"
                  }`}
                >
                  {/* Avatar */}
                  {isUser ? (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground mt-1">
                      <span className="text-xs font-bold">
                        {isHebrew ? "אני" : "Me"}
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
                            isHebrew ? "rounded-tr-none" : "rounded-tl-none"
                          }`
                        : `bg-muted/50 border border-border ${
                            isHebrew ? "rounded-tl-none" : "rounded-tr-none"
                          }`
                    }`}
                    dir={isHebrew ? "rtl" : "ltr"}
                  >
                    <FormattedMessage content={message.content} role={message.role} />
                  </div>
                </div>
              );
            })}

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
        <div className="max-w-3xl mx-auto">
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
              className="min-h-[50px] max-h-[150px] resize-none bg-background border-border focus:ring-primary"
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
  );
}
