"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  apiClient,
  type Project,
  type QueryGenerateResponseV2,
  type PubMedArticle,
  type PubMedSearchResponseV2,
  type QueryHistoryItem,
  type PubMedAbstractResponse,
} from "@/lib/api";
import { useBidiLayout } from "@/lib/hooks/useBidiLayout";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  FileText,
  FolderKanban,
  History,
  Import,
  Loader2,
  MessageSquareQuote,
  PenLine,
  Play,
  Plus,
  Search,
  Sparkles,
  Target,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

// Import new screen components
import { QueryBuilderScreen } from "@/components/query/QueryBuilderScreen";
import { SearchResultsScreen } from "@/components/query/SearchResultsScreen";
import { ProcessStepper, type Step as StepperStep } from "@/components/ui/process-stepper";

// Step type for wizard - simplified to two-screen flow
type Step = "select" | "generate" | "builder" | "results";

// Step configuration for ProcessStepper
const QUERY_STEPS: StepperStep[] = [
  { id: 1, label: "Select", icon: FileText },
  { id: 2, label: "Generate", icon: Sparkles },
  { id: 3, label: "Builder", icon: Play },
  { id: 4, label: "Results", icon: BookOpen },
];

// Map string step keys to numeric indices
const stepKeyToIndex: Record<Step, number> = {
  select: 1,
  generate: 2,
  builder: 3,
  results: 4,
};

const stepIndexToKey: Step[] = ["select", "generate", "builder", "results"];

export default function QueryPage() {
  const router = useRouter();

  // Core State
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>("select");

  // Language detection for RTL support
  const [detectedLanguage, setDetectedLanguage] = useState<"en" | "he" | null>(
    null
  );

  // Research Questions State
  const [researchQuestions, setResearchQuestions] = useState<string[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<string>("");
  const [customQuestion, setCustomQuestion] = useState<string>("");
  const [frameworkData, setFrameworkData] = useState<Record<string, string>>(
    {}
  );

  // Query Generation State (V2)
  const [queryResult, setQueryResult] =
    useState<QueryGenerateResponseV2 | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentQuery, setCurrentQuery] = useState<string>("");

  // PubMed Search State (V2 with pagination)
  const [searchResults, setSearchResults] =
    useState<PubMedSearchResponseV2 | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [perPage, setPerPage] = useState(20);
  const [sortBy, setSortBy] = useState<"relevance" | "date">("relevance");

  // Export State
  const [isExporting, setIsExporting] = useState(false);

  // History State
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Loading state for questions
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  // Project Selection filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterFramework, setFilterFramework] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "ready" | "in_progress" | "draft">("all");
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);

  // Question carousel state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Use the RTL hook
  const layout = useBidiLayout(detectedLanguage);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const data = await apiClient.getProjects();
      const projectsWithData = (data || []).filter(
        (p) => p.framework_data && Object.keys(p.framework_data).length > 0
      );
      setProjects(projectsWithData);
    } catch (error) {
      console.error("Failed to load projects:", error);
      toast.error("Failed to load projects");
    }
  }

  async function handleProjectSelect(projectId: string) {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    setSelectedProject(project);
    setIsLoadingQuestions(true);
    setResearchQuestions([]);
    setSelectedQuestion("");
    setCustomQuestion("");
    setQueryResult(null);
    setSearchResults(null);

    try {
      const questionsData = await apiClient.getResearchQuestions(projectId);
      setResearchQuestions(questionsData.research_questions || []);
      setFrameworkData(questionsData.framework_data || {});

      if (questionsData.framework_data) {
        const dataText = Object.values(questionsData.framework_data).join(" ");
        const hasHebrew = /[\u0590-\u05FF]/.test(dataText);
        setDetectedLanguage(hasHebrew ? "he" : "en");
      }

      const historyData = await apiClient.getQueryHistory(projectId);
      setQueryHistory(historyData.queries || []);

      if (questionsData.research_questions.length > 0) {
        setSelectedQuestion(questionsData.research_questions[0]);
      }

      setCurrentStep("generate");
    } catch (error) {
      console.error("Failed to load project data:", error);
      toast.error("Failed to load project data");
    } finally {
      setIsLoadingQuestions(false);
    }
  }

  async function handleGenerateQuery() {
    if (!selectedProject) return;

    const questionToUse = selectedQuestion || customQuestion;
    if (!questionToUse.trim()) {
      toast.error("Please select or enter a research question");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await apiClient.generateQueryV2(
        selectedProject.id,
        questionToUse,
        selectedProject.framework_type
      );
      setQueryResult(result);

      // Set initial query from comprehensive strategy
      if (result.strategies?.comprehensive) {
        setCurrentQuery(result.strategies.comprehensive.query);
      }

      setCurrentStep("builder");
      toast.success("Query generated successfully!");

      // Show warnings if any
      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach((w) => {
          if (w.severity === "error") {
            toast.error(w.message);
          } else if (w.severity === "warning") {
            toast(w.message, { icon: "⚠️" });
          }
        });
      }

      const historyData = await apiClient.getQueryHistory(selectedProject.id);
      setQueryHistory(historyData.queries || []);
    } catch (error: unknown) {
      console.error("Failed to generate query:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate query";
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleExecuteSearch(query: string) {
    if (!query) {
      toast.error("No query to execute");
      return;
    }

    setCurrentQuery(query);
    setIsSearching(true);
    try {
      const results = await apiClient.executePubMedSearchPaginated(
        query,
        1,
        perPage,
        sortBy
      );
      setSearchResults(results);
      setCurrentStep("results");
      toast.success(`Found ${results.count.toLocaleString()} articles!`);
    } catch (error: unknown) {
      console.error("Failed to execute search:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to search PubMed";
      toast.error(errorMessage);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSearchWithPagination(page: number = 1) {
    if (!currentQuery) {
      toast.error("No query to execute");
      return;
    }

    setIsSearching(true);
    try {
      const results = await apiClient.executePubMedSearchPaginated(
        currentQuery,
        page,
        perPage,
        sortBy
      );
      setSearchResults(results);
    } catch (error: unknown) {
      console.error("Failed to execute search:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to search PubMed";
      toast.error(errorMessage);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleExport(format: "medline" | "csv") {
    if (!currentQuery) return;

    setIsExporting(true);
    try {
      const blob = await apiClient.exportResults(
        currentQuery,
        undefined,
        100,
        format
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pubmed_results.${format === "medline" ? "nbib" : "csv"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(`Exported ${format.toUpperCase()} file`);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export results");
    } finally {
      setIsExporting(false);
    }
  }

  function handleContinueToReview() {
    if (!selectedProject || !searchResults) return;

    // Store query data for screening tool
    sessionStorage.setItem(
      "queryToolData",
      JSON.stringify({
        projectId: selectedProject.id,
        query: currentQuery,
        articleCount: searchResults.count,
        pmids: searchResults.articles.map(a => a.pmid),
      })
    );

    router.push(`/screening?projectId=${selectedProject.id}`);
  }

  async function handleViewAbstract(
    article: PubMedArticle
  ): Promise<PubMedAbstractResponse> {
    return await apiClient.getPubMedAbstract(article.pmid);
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  }

  function handleOpenPubMed(query: string) {
    window.open(
      `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(query)}`,
      "_blank"
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-background to-muted/20"
      dir={layout.dir}
    >
      <Toaster position="top-right" />

      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Search className="h-6 w-6 text-primary" />
                PubMed Query Builder
              </h1>
              <p className="text-muted-foreground mt-1">
                Generate and execute optimized search strategies
              </p>
            </div>

            {selectedProject && queryHistory.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowHistory(true)}
                className="gap-2"
              >
                <History className="h-4 w-4" />
                History ({queryHistory.length})
              </Button>
            )}
          </div>

          {/* Progress Stepper */}
          <div className="mt-6">
            <ProcessStepper
              steps={QUERY_STEPS}
              currentStep={stepKeyToIndex[currentStep]}
              onStepClick={(stepId) => setCurrentStep(stepIndexToKey[stepId - 1])}
              restrictNavigation={true}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Step 1: Select Project - SCOUT/GEMS Design */}
        {currentStep === "select" && (
          <div className="min-h-[calc(100vh-250px)]">
            {(() => {
              // Calculate stats
              const readyProjects = projects.filter(p =>
                p.framework_data && Object.keys(p.framework_data).length >= 3
              );
              const inProgressProjects = projects.filter(p =>
                p.framework_data && Object.keys(p.framework_data).length > 0 && Object.keys(p.framework_data).length < 3
              );
              const draftProjects = projects.filter(p =>
                !p.framework_data || Object.keys(p.framework_data).length === 0
              );

              const stats = {
                total: projects.length,
                ready: readyProjects.length,
                inProgress: inProgressProjects.length,
                drafts: draftProjects.length,
              };

              // Apply filters
              const getProjectStatus = (p: Project) => {
                if (!p.framework_data || Object.keys(p.framework_data).length === 0) return "draft";
                if (Object.keys(p.framework_data).length >= 3) return "ready";
                return "in_progress";
              };

              const filteredProjects = projects.filter(p => {
                const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesFramework = filterFramework === "all" || p.framework_type === filterFramework;
                const status = getProjectStatus(p);
                const matchesStatus = filterStatus === "all" || status === filterStatus;
                return matchesSearch && matchesFramework && matchesStatus;
              });

              // Framework color config
              const frameworkColors: Record<string, { bg: string; badge: string; border: string }> = {
                PICO: { bg: "bg-blue-50", badge: "bg-blue-100 text-blue-700", border: "border-blue-200" },
                SPIDER: { bg: "bg-purple-50", badge: "bg-purple-100 text-purple-700", border: "border-purple-200" },
                PEO: { bg: "bg-emerald-50", badge: "bg-emerald-100 text-emerald-700", border: "border-emerald-200" },
                CoCoPop: { bg: "bg-amber-50", badge: "bg-amber-100 text-amber-700", border: "border-amber-200" },
                ECLIPSE: { bg: "bg-rose-50", badge: "bg-rose-100 text-rose-700", border: "border-rose-200" },
              };

              return (
                <>
                  {/* Hero Section */}
                  <div className="pt-12 pb-8 px-4">
                    <div className="text-center max-w-2xl mx-auto space-y-4">
                      {/* Icon with gradient shadow */}
                      <div className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 p-4 rounded-2xl w-fit mx-auto mb-6 shadow-lg shadow-blue-100 dark:shadow-blue-900/20">
                        <Sparkles className="h-10 w-10" />
                      </div>

                      {/* Title */}
                      <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Welcome to Query Builder
                      </h1>
                      <p className="text-lg text-gray-500 dark:text-gray-400">
                        Select a project to generate optimized PubMed search strategies
                      </p>

                      {/* Quick Stats */}
                      <div className="flex justify-center gap-6 pt-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Total Projects</div>
                        </div>
                        <div className="w-px bg-gray-200 dark:bg-gray-700" />
                        <div className="text-center">
                          <div className="text-2xl font-bold text-emerald-600">{stats.ready}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Ready</div>
                        </div>
                        <div className="w-px bg-gray-200 dark:bg-gray-700" />
                        <div className="text-center">
                          <div className="text-2xl font-bold text-amber-600">{stats.inProgress}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">In Progress</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="max-w-5xl mx-auto px-4 mb-8">
                    <div className="flex gap-4">
                      {/* Large Search Input */}
                      <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search projects by name..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full h-14 pl-12 pr-4 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-base focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 shadow-sm"
                        />
                      </div>

                      {/* New Project Button */}
                      <button
                        onClick={() => router.push("/define")}
                        className="h-14 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-blue-200 dark:shadow-blue-900/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                      >
                        <Plus className="h-5 w-5" />
                        New Project
                      </button>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => setFilterStatus("all")}
                        className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                          filterStatus === "all"
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
                      >
                        All ({stats.total})
                      </button>
                      <button
                        onClick={() => setFilterStatus("ready")}
                        className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                          filterStatus === "ready"
                            ? "bg-emerald-600 text-white shadow-md"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
                      >
                        Ready ({stats.ready})
                      </button>
                      <button
                        onClick={() => setFilterStatus("in_progress")}
                        className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                          filterStatus === "in_progress"
                            ? "bg-amber-600 text-white shadow-md"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
                      >
                        In Progress ({stats.inProgress})
                      </button>
                      <button
                        onClick={() => setFilterStatus("draft")}
                        className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                          filterStatus === "draft"
                            ? "bg-gray-600 text-white shadow-md"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
                      >
                        Drafts ({stats.drafts})
                      </button>
                    </div>
                  </div>

                  {/* Projects Grid */}
                  <div className="max-w-5xl mx-auto px-4 pb-12">
                    {filteredProjects.length === 0 ? (
                      /* Empty State */
                      <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FolderKanban className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {searchTerm || filterStatus !== "all" ? "No matching projects" : "No projects yet"}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                          {searchTerm || filterStatus !== "all"
                            ? "Try adjusting your search or filters"
                            : "Create your first project to get started with query generation"}
                        </p>
                        {!searchTerm && filterStatus === "all" && (
                          <button
                            onClick={() => router.push("/define")}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-200 dark:shadow-blue-900/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                          >
                            <Plus className="h-5 w-5" />
                            Create Your First Project
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-6">
                        {filteredProjects.map((project) => {
                          const status = getProjectStatus(project);
                          const colors = frameworkColors[project.framework_type || "PICO"] || frameworkColors.PICO;
                          const isHovered = hoveredProjectId === project.id;

                          return (
                            <div
                              key={project.id}
                              onMouseEnter={() => setHoveredProjectId(project.id)}
                              onMouseLeave={() => setHoveredProjectId(null)}
                              onClick={() => {
                                if (status === "ready") {
                                  handleProjectSelect(project.id);
                                } else {
                                  router.push(`/define?project=${project.id}`);
                                }
                              }}
                              className={`
                                relative bg-white dark:bg-gray-900 rounded-2xl border-2 p-5 cursor-pointer
                                transition-all duration-300 ease-out
                                ${isHovered
                                  ? "border-blue-400 shadow-xl shadow-blue-100 dark:shadow-blue-900/20 -translate-y-1"
                                  : "border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                                }
                              `}
                            >
                              {/* Card Header */}
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-gray-900 dark:text-white text-base truncate mb-2">
                                    {project.name}
                                  </h3>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {/* Status Badge */}
                                    {status === "ready" && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-full">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Ready
                                      </span>
                                    )}
                                    {status === "in_progress" && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full">
                                        <Clock className="w-3.5 h-3.5" />
                                        In Progress
                                      </span>
                                    )}
                                    {status === "draft" && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-semibold rounded-full">
                                        <FileText className="w-3.5 h-3.5" />
                                        Draft
                                      </span>
                                    )}

                                    {/* Framework Badge */}
                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${colors.badge}`}>
                                      {project.framework_type || "PICO"}
                                    </span>
                                  </div>
                                </div>

                                {/* Arrow indicator */}
                                <div className={`
                                  w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200
                                  ${isHovered
                                    ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                                  }
                                `}>
                                  <ArrowRight className={`w-5 h-5 transition-transform duration-200 ${isHovered ? "translate-x-0.5" : ""}`} />
                                </div>
                              </div>

                              {/* Framework Components Preview */}
                              {project.framework_data && Object.keys(project.framework_data).length > 0 && (
                                <div className={`p-3 rounded-xl ${colors.bg} border ${colors.border} mb-4`}>
                                  <div className="space-y-2">
                                    {Object.entries(project.framework_data).slice(0, 3).map(([key, value]) => (
                                      <div key={key} className="flex items-start gap-2">
                                        <span className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold ${colors.badge}`}>
                                          {key.length === 1 ? key : key.charAt(0).toUpperCase()}
                                        </span>
                                        <span className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                                          {typeof value === "string" ? value : JSON.stringify(value)}
                                        </span>
                                      </div>
                                    ))}
                                    {Object.keys(project.framework_data).length > 3 && (
                                      <span className="text-xs text-gray-400 dark:text-gray-500 pl-8">
                                        +{Object.keys(project.framework_data).length - 3} more components...
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Card Footer */}
                              <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {project.updated_at
                                    ? `Updated ${new Date(project.updated_at).toLocaleDateString()}`
                                    : "Recently created"
                                  }
                                </div>
                                {status !== "ready" && (
                                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                                    Click to complete setup
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Step 2: Generate Query - Question Carousel Design */}
        {currentStep === "generate" && selectedProject && (
          <div className="min-h-[calc(100vh-250px)] flex flex-col">
            {(() => {
              // Combine AI questions with custom question option
              const allOptions = [
                ...researchQuestions.map((q, idx) => ({ type: 'ai' as const, question: q, index: idx })),
                { type: 'custom' as const, question: '', index: researchQuestions.length }
              ];

              const totalCards = allOptions.length;
              const currentOption = allOptions[currentQuestionIndex] || allOptions[0];
              const isCustomSelected = currentOption?.type === 'custom';

              // Navigation functions
              const goToPrevious = () => {
                setCurrentQuestionIndex(prev => (prev > 0 ? prev - 1 : totalCards - 1));
                setSelectedQuestion('');
                setCustomQuestion('');
              };

              const goToNext = () => {
                setCurrentQuestionIndex(prev => (prev < totalCards - 1 ? prev + 1 : 0));
                setSelectedQuestion('');
                setCustomQuestion('');
              };

              const selectCurrentQuestion = () => {
                if (currentOption?.type === 'ai' && currentOption.question) {
                  setSelectedQuestion(currentOption.question);
                  setCustomQuestion('');
                }
              };

              return (
                <>
                  {/* Hero Header - Compact */}
                  <div className="pt-6 pb-4 px-4 flex-shrink-0">
                    <div className="text-center max-w-2xl mx-auto">
                      <div className="flex items-center justify-center gap-3 mb-2">
                        <div className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-600 dark:text-blue-400 p-2.5 rounded-xl shadow-md">
                          <MessageSquareQuote className="h-6 w-6" />
                        </div>
                        <div className="text-left">
                          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                            Choose Your Research Question
                          </h1>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {selectedProject.name}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Carousel Area */}
                  <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
                    {isLoadingQuestions ? (
                      <div className="flex flex-col items-center justify-center py-20">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-xl border-2 border-gray-100 dark:border-gray-800">
                          <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400 text-center">Loading research questions...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full max-w-4xl">
                        {/* Carousel Container */}
                        <div className="relative">
                          {/* Navigation Buttons - Outside the card */}
                          <button
                            onClick={goToPrevious}
                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-16 z-10 w-12 h-12 lg:w-14 lg:h-14 bg-white dark:bg-gray-800 rounded-full shadow-xl border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:scale-110 transition-all duration-200"
                            aria-label="Previous question"
                          >
                            <ChevronLeft className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                          </button>

                          <button
                            onClick={goToNext}
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-16 z-10 w-12 h-12 lg:w-14 lg:h-14 bg-white dark:bg-gray-800 rounded-full shadow-xl border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:scale-110 transition-all duration-200"
                            aria-label="Next question"
                          >
                            <ChevronRight className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                          </button>

                          {/* Question Card */}
                          <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden mx-8 lg:mx-0">
                            {/* Card Header */}
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {isCustomSelected ? (
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                      <PenLine className="h-5 w-5 text-white" />
                                    </div>
                                  ) : (
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                      <Sparkles className="h-5 w-5 text-white" />
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                      {isCustomSelected ? 'Write Your Own' : 'AI-Generated Question'}
                                    </span>
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      {currentQuestionIndex + 1} of {totalCards}
                                    </div>
                                  </div>
                                </div>

                                {/* Framework Badge */}
                                <span className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md">
                                  {selectedProject.framework_type || "PICO"}
                                </span>
                              </div>
                            </div>

                            {/* Card Content */}
                            <div className="p-8 lg:p-10">
                              {isCustomSelected ? (
                                /* Custom Question Input */
                                <div className="space-y-4">
                                  <div className="text-center mb-6">
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                      Write Your Custom Question
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400">
                                      Enter your own research question for query generation
                                    </p>
                                  </div>
                                  <Textarea
                                    value={customQuestion}
                                    onChange={(e) => {
                                      setCustomQuestion(e.target.value);
                                      setSelectedQuestion('');
                                    }}
                                    placeholder="Type your research question here..."
                                    className="min-h-[160px] text-lg bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-5 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 resize-none transition-all placeholder:text-gray-400"
                                  />
                                </div>
                              ) : (
                                /* AI Question Display */
                                <div className="text-center">
                                  <div className="mb-6">
                                    <MessageSquareQuote className="h-10 w-10 text-blue-500/30 dark:text-blue-400/20 mx-auto mb-4" />
                                  </div>
                                  <p className="text-xl lg:text-2xl font-medium text-gray-900 dark:text-white leading-relaxed px-4">
                                    {currentOption?.question || 'No question available'}
                                  </p>

                                  {/* Select Button for AI Questions */}
                                  <div className="mt-8">
                                    <button
                                      onClick={() => {
                                        selectCurrentQuestion();
                                      }}
                                      className={`
                                        px-8 py-3 rounded-xl font-semibold transition-all duration-200
                                        ${selectedQuestion === currentOption?.question
                                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30"
                                          : "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-300 dark:hover:border-blue-600"
                                        }
                                      `}
                                    >
                                      {selectedQuestion === currentOption?.question ? (
                                        <span className="flex items-center gap-2">
                                          <Check className="h-5 w-5" />
                                          Selected
                                        </span>
                                      ) : (
                                        <span className="flex items-center gap-2">
                                          <Check className="h-5 w-5" />
                                          Select This Question
                                        </span>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Dot Navigation */}
                        <div className="flex justify-center items-center gap-2 mt-6">
                          {allOptions.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setCurrentQuestionIndex(idx);
                                setSelectedQuestion('');
                                setCustomQuestion('');
                              }}
                              className={`
                                transition-all duration-200 rounded-full
                                ${idx === currentQuestionIndex
                                  ? "w-8 h-3 bg-gradient-to-r from-blue-600 to-indigo-600"
                                  : "w-3 h-3 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
                                }
                              `}
                              aria-label={`Go to question ${idx + 1}`}
                            />
                          ))}
                        </div>

                        {/* Generate Button */}
                        <div className="mt-8 max-w-md mx-auto">
                          <button
                            onClick={handleGenerateQuery}
                            disabled={isGenerating || (!selectedQuestion && !customQuestion.trim())}
                            className={`
                              w-full h-14 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-all duration-300
                              ${isGenerating || (!selectedQuestion && !customQuestion.trim())
                                ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed border-2 border-gray-200 dark:border-gray-700"
                                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl shadow-blue-200 dark:shadow-blue-900/30 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02]"
                              }
                            `}
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Generating Query...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-5 w-5" />
                                Generate PubMed Query
                              </>
                            )}
                          </button>

                          {/* Status indicator */}
                          <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-3">
                            {selectedQuestion
                              ? <span className="text-emerald-600 dark:text-emerald-400 font-medium">Question selected - Ready to generate</span>
                              : customQuestion.trim()
                                ? <span className="text-purple-600 dark:text-purple-400 font-medium">Custom question ready</span>
                                : "Select a question or write your own"
                            }
                          </p>
                        </div>

                        {/* Back button */}
                        <div className="text-center mt-6">
                          <button
                            onClick={() => setCurrentStep("select")}
                            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Back to Project Selection
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Step 3: Query Builder Screen - Using New Component */}
        {currentStep === "builder" && queryResult && (
          <QueryBuilderScreen
            queryResult={queryResult}
            onExecuteSearch={handleExecuteSearch}
            onOpenPubMed={handleOpenPubMed}
            onCopyQuery={copyToClipboard}
            isSearching={isSearching}
            perPage={perPage}
            setPerPage={setPerPage}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />
        )}

        {/* Step 4: Search Results Screen - Using New Component */}
        {currentStep === "results" && searchResults && (
          <SearchResultsScreen
            searchResults={searchResults}
            currentQuery={currentQuery}
            onQueryChange={setCurrentQuery}
            onSearch={handleSearchWithPagination}
            onBackToBuilder={() => setCurrentStep("builder")}
            onExport={handleExport}
            onContinueToReview={handleContinueToReview}
            onViewAbstract={handleViewAbstract}
            onCopy={copyToClipboard}
            isSearching={isSearching}
            isExporting={isExporting}
            perPage={perPage}
            setPerPage={setPerPage}
          />
        )}
      </div>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Query History
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {queryHistory.map((query) => (
              <div
                key={query.id}
                className="p-3 rounded-lg border bg-muted/50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{query.query_type}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(query.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs font-mono bg-background p-2 rounded overflow-x-auto">
                  {query.query_text.substring(0, 200)}
                  {query.query_text.length > 200 && "..."}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(query.query_text, "Query")}
                  className="gap-1"
                >
                  <Copy className="h-3 w-3" />
                  Copy
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
