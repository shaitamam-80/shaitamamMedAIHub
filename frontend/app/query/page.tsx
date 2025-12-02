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
  ChevronRight,
  Clock,
  Copy,
  FileText,
  FolderKanban,
  History,
  Import,
  Loader2,
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

// Step type for wizard - simplified to two-screen flow
type Step = "select" | "generate" | "builder" | "results";

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

    // Store query data for review tool
    sessionStorage.setItem(
      "queryToolData",
      JSON.stringify({
        projectId: selectedProject.id,
        query: currentQuery,
        articleCount: searchResults.count,
      })
    );

    router.push(`/review?project=${selectedProject.id}&fromQuery=true`);
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

  // Stepper component - updated for two-screen flow
  const steps = [
    { key: "select", label: "Select Project", icon: FileText },
    { key: "generate", label: "Generate Query", icon: Sparkles },
    { key: "builder", label: "Query Builder", icon: Play },
    { key: "results", label: "Search Results", icon: BookOpen },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

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
          <div className="mt-6 flex items-center justify-center">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.key === currentStep;
              const isCompleted = index < currentStepIndex;
              const isClickable = index <= currentStepIndex;

              return (
                <div key={step.key} className="flex items-center">
                  <button
                    onClick={() =>
                      isClickable && setCurrentStep(step.key as Step)
                    }
                    disabled={!isClickable}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : isCompleted
                          ? "bg-primary/20 text-primary hover:bg-primary/30"
                          : "bg-muted text-muted-foreground"
                    } ${isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline text-sm font-medium">
                      {step.label}
                    </span>
                  </button>
                  {index < steps.length - 1 && (
                    <ChevronRight
                      className={`h-4 w-4 mx-2 ${
                        index < currentStepIndex
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Step 1: Select Project - Redesigned based on mockup */}
        {currentStep === "select" && (
          <div className="max-w-5xl mx-auto">
            <Card className="shadow-sm border border-gray-200 overflow-hidden">
              {/* Section Header */}
              <CardHeader className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Select Your Project
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-500 mt-1">
                      Choose a project with completed research question formulation
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => router.push("/projects")}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    New Project
                  </Button>
                </div>

                {/* Search and Filter */}
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search projects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <Select value={filterFramework} onValueChange={setFilterFramework}>
                    <SelectTrigger className="w-[180px] bg-gray-50 border-gray-200">
                      <SelectValue placeholder="All Frameworks" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Frameworks</SelectItem>
                      <SelectItem value="PICO">PICO</SelectItem>
                      <SelectItem value="SPIDER">SPIDER</SelectItem>
                      <SelectItem value="PEO">PEO</SelectItem>
                      <SelectItem value="CoCoPop">CoCoPop</SelectItem>
                      <SelectItem value="ECLIPSE">ECLIPSE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>

              <CardContent className="p-5">
                {(() => {
                  // Filter projects
                  const filteredProjects = projects.filter(p => {
                    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesFramework = filterFramework === "all" || p.framework_type === filterFramework;
                    return matchesSearch && matchesFramework;
                  });

                  // Separate ready vs in-progress
                  const readyProjects = filteredProjects.filter(p =>
                    p.framework_data && Object.keys(p.framework_data).length >= 3
                  );
                  const inProgressProjects = filteredProjects.filter(p =>
                    !p.framework_data || Object.keys(p.framework_data).length < 3
                  );

                  // Framework color config - matching mockup
                  const frameworkColors: Record<string, { bg: string; badge: string }> = {
                    PICO: { bg: "bg-blue-50 border-blue-200", badge: "bg-blue-100 text-blue-700" },
                    SPIDER: { bg: "bg-purple-50 border-purple-200", badge: "bg-purple-100 text-purple-700" },
                    PEO: { bg: "bg-emerald-50 border-emerald-200", badge: "bg-emerald-100 text-emerald-700" },
                    CoCoPop: { bg: "bg-amber-50 border-amber-200", badge: "bg-amber-100 text-amber-700" },
                    ECLIPSE: { bg: "bg-rose-50 border-rose-200", badge: "bg-rose-100 text-rose-700" },
                  };

                  if (filteredProjects.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No projects found</p>
                        <button
                          onClick={() => router.push("/define")}
                          className="mt-3 text-blue-600 text-sm font-medium hover:underline"
                        >
                          Create your first project
                        </button>
                      </div>
                    );
                  }

                  return (
                    <>
                      {/* Ready Projects */}
                      {readyProjects.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            Ready for Query Generation ({readyProjects.length})
                          </h3>
                          <div className="grid sm:grid-cols-2 gap-4">
                            {readyProjects.map(project => {
                              const colors = frameworkColors[project.framework_type || "PICO"] || frameworkColors.PICO;
                              const isSelected = selectedProject?.id === project.id;

                              return (
                                <button
                                  key={project.id}
                                  onClick={() => handleProjectSelect(project.id)}
                                  className={`w-full text-left p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                                    isSelected
                                      ? "border-blue-500 bg-blue-50/50 shadow-md"
                                      : "border-gray-200 bg-white hover:border-blue-300"
                                  }`}
                                >
                                  {/* Header */}
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                                        {project.name}
                                      </h4>
                                      <div className="flex items-center gap-2 mt-1.5">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${colors.badge}`}>
                                          {project.framework_type || "PICO"}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                          <CheckCircle2 className="w-3 h-3" />
                                          Ready
                                        </span>
                                      </div>
                                    </div>
                                    <ArrowRight className={`w-5 h-5 transition-all ${isSelected ? "text-blue-600" : "text-gray-300"}`} />
                                  </div>

                                  {/* Framework Components Preview */}
                                  {project.framework_data && (
                                    <div className={`p-3 rounded-lg border ${colors.bg}`}>
                                      <div className="space-y-1.5">
                                        {Object.entries(project.framework_data).slice(0, 3).map(([key, value]) => (
                                          <div key={key} className="flex items-start gap-2">
                                            <span className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-xs font-bold ${colors.badge}`}>
                                              {key}
                                            </span>
                                            <span className="text-xs text-gray-600 line-clamp-1">
                                              {typeof value === 'string' ? value : JSON.stringify(value)}
                                            </span>
                                          </div>
                                        ))}
                                        {Object.keys(project.framework_data).length > 3 && (
                                          <span className="text-xs text-gray-400 pl-7">
                                            +{Object.keys(project.framework_data).length - 3} more...
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Footer */}
                                  <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
                                    <Clock className="w-3 h-3" />
                                    {project.updated_at
                                      ? `Updated ${new Date(project.updated_at).toLocaleDateString()}`
                                      : "Recently created"}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* In Progress Projects */}
                      {inProgressProjects.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                            In Progress ({inProgressProjects.length})
                          </h3>
                          <div className="grid sm:grid-cols-2 gap-4">
                            {inProgressProjects.map(project => {
                              const colors = frameworkColors[project.framework_type || "PICO"] || frameworkColors.PICO;

                              return (
                                <button
                                  key={project.id}
                                  onClick={() => router.push(`/define?project=${project.id}`)}
                                  className="w-full text-left p-4 rounded-xl border-2 border-gray-200 bg-white hover:border-amber-300 transition-all hover:shadow-md opacity-75"
                                >
                                  {/* Header */}
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                                        {project.name}
                                      </h4>
                                      <div className="flex items-center gap-2 mt-1.5">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${colors.badge}`}>
                                          {project.framework_type || "PICO"}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                                          <AlertCircle className="w-3 h-3" />
                                          In Progress
                                        </span>
                                      </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-gray-300" />
                                  </div>

                                  {/* Message */}
                                  <p className="text-xs text-amber-600 mt-2">
                                    Click to complete in Define Tool
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </CardContent>

              {/* Action Footer - shows when project is selected */}
              {selectedProject && (
                <div className="p-5 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        Selected: <span className="font-semibold text-gray-900">{selectedProject.name}</span>
                      </p>
                      <p className="text-xs text-gray-400">{selectedProject.framework_type || "PICO"} Framework</p>
                    </div>
                    <Button
                      onClick={() => setCurrentStep("generate")}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-sm"
                    >
                      Continue to Query Generation
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Step 2: Generate Query - Redesigned */}
        {currentStep === "generate" && selectedProject && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Framework Preview Card - Fixed PICO order and no duplicates */}
            <Card className="shadow-sm border border-gray-200">
              <CardHeader className="pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">
                      {selectedProject.name}
                    </CardTitle>
                    <CardDescription className="text-gray-500 mt-1">
                      Framework Components
                    </CardDescription>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-sm font-bold px-3 py-1.5">
                    {selectedProject.framework_type || "PICO"}
                  </Badge>
                </div>
              </CardHeader>
              {Object.keys(frameworkData).length > 0 && (
                <CardContent className="pt-5">
                  {(() => {
                    // Define component order (PICO standard order)
                    const componentOrder = ["P", "I", "C", "O", "E", "S", "T", "D", "R"];

                    // Mapping from full words to single letters
                    const wordToLetter: Record<string, string> = {
                      population: "P",
                      intervention: "I",
                      comparator: "C",
                      comparison: "C",
                      outcome: "O",
                      exposure: "E",
                      studydesign: "S",
                      timeframe: "T",
                      setting: "D",
                      designtype: "S"
                    };

                    // Component labels for display
                    const componentLabels: Record<string, string> = {
                      P: "Population",
                      I: "Intervention",
                      C: "Comparison",
                      O: "Outcome",
                      E: "Exposure",
                      S: "Study Design",
                      T: "Timeframe",
                      D: "Setting",
                      R: "Research Type"
                    };

                    // Normalize framework data: prefer single-letter keys, skip duplicates
                    const normalized: Record<string, { key: string; label: string; value: string }> = {};

                    // First pass: Collect single-letter keys
                    Object.entries(frameworkData).forEach(([key, value]) => {
                      if (key.length === 1 && value) {
                        const upperKey = key.toUpperCase();
                        normalized[upperKey] = {
                          key: upperKey,
                          label: componentLabels[upperKey] || upperKey,
                          value: String(value)
                        };
                      }
                    });

                    // Second pass: Add full-word keys only if letter equivalent doesn't exist
                    Object.entries(frameworkData).forEach(([key, value]) => {
                      if (key.length > 1 && value) {
                        const normalizedKey = key.toLowerCase().replace(/[^a-z]/g, '');
                        const letterKey = wordToLetter[normalizedKey];

                        // Only add if we found a mapping AND it doesn't already exist
                        if (letterKey && !normalized[letterKey]) {
                          normalized[letterKey] = {
                            key: letterKey,
                            label: componentLabels[letterKey] || key,
                            value: String(value)
                          };
                        }
                      }
                    });

                    // Sort by PICO order
                    const sortedComponents = Object.values(normalized).sort((a, b) => {
                      const aIdx = componentOrder.indexOf(a.key);
                      const bIdx = componentOrder.indexOf(b.key);
                      const aPos = aIdx === -1 ? 999 : aIdx;
                      const bPos = bIdx === -1 ? 999 : bIdx;
                      return aPos - bPos;
                    });

                    return (
                      <div className="space-y-3">
                        {sortedComponents.map(({ key, label, value }) => (
                          <div
                            key={key}
                            className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/50 border border-blue-100"
                          >
                            {/* Badge - Blue square with letter */}
                            <span className="w-8 h-8 rounded bg-blue-600 text-white font-bold flex items-center justify-center text-sm flex-shrink-0">
                              {key}
                            </span>

                            {/* Label + Value */}
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
                                {label}
                              </div>
                              <p className="text-sm text-gray-800 leading-relaxed" title={value}>
                                {value}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              )}
            </Card>

            {/* Research Question Selection - Card-based UI */}
            <Card className="shadow-sm border border-gray-200">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <Target className="h-5 w-5 text-blue-600" />
                  Select Research Question
                </CardTitle>
                <CardDescription className="text-gray-500">
                  Choose a question from Define Tool or enter your own
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-5">
                {isLoadingQuestions ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="ml-3 text-gray-600">Loading questions...</span>
                  </div>
                ) : (
                  <>
                    {/* Questions from Define Tool - Card-based selection */}
                    {researchQuestions.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Import className="h-4 w-4 text-gray-500" />
                          Questions from Define Tool ({researchQuestions.length})
                        </div>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                          {researchQuestions.map((question, idx) => {
                            const isSelected = selectedQuestion === question;

                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  setSelectedQuestion(question);
                                  setCustomQuestion("");
                                }}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                                  isSelected
                                    ? "border-blue-500 bg-blue-50 shadow-md"
                                    : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  {/* Custom radio indicator */}
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                                    isSelected
                                      ? "border-blue-600 bg-blue-600"
                                      : "border-gray-300 bg-white"
                                  }`}>
                                    {isSelected && (
                                      <Check className="w-3 h-3 text-white stroke-[3]" />
                                    )}
                                  </div>

                                  {/* Question text */}
                                  <span className={`text-sm leading-relaxed ${
                                    isSelected ? "text-gray-900 font-medium" : "text-gray-700"
                                  }`}>
                                    {question}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Divider - "or enter custom question" */}
                    {researchQuestions.length > 0 && (
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-4 bg-white text-gray-500 font-medium">
                            or enter custom question
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Custom Question Textarea */}
                    <div className="space-y-2">
                      {researchQuestions.length === 0 && (
                        <Label className="text-sm font-medium text-gray-700">
                          Enter your research question
                        </Label>
                      )}
                      <Textarea
                        value={customQuestion}
                        onChange={(e) => {
                          setCustomQuestion(e.target.value);
                          if (e.target.value) {
                            setSelectedQuestion("");
                          }
                        }}
                        placeholder="Type your research question here..."
                        className="min-h-[120px] bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
                      />
                    </div>

                    {/* Generate Button - Large and prominent */}
                    <Button
                      onClick={handleGenerateQuery}
                      disabled={
                        isGenerating ||
                        (!selectedQuestion && !customQuestion.trim())
                      }
                      className="w-full h-12 text-base font-semibold shadow-sm hover:shadow-md transition-shadow"
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Generating Query...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5 mr-2" />
                          Generate PubMed Query
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
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
