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
import { Label } from "@/components/ui/label";
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
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  Copy,
  FileText,
  History,
  Import,
  Loader2,
  Play,
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
        {/* Step 1: Select Project */}
        {currentStep === "select" && (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Select Your Project</CardTitle>
                <CardDescription>
                  Choose a project with completed research question formulation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {projects.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      No projects with research questions found.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => (window.location.href = "/define")}
                    >
                      Go to Define Tool
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => handleProjectSelect(project.id)}
                        className="w-full p-4 rounded-lg border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all text-left group"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium group-hover:text-primary">
                              {project.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {project.framework_type || "PICO"} Framework
                            </p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Generate Query */}
        {currentStep === "generate" && selectedProject && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Project Info */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {selectedProject.name}
                    </CardTitle>
                    <CardDescription>
                      {selectedProject.framework_type || "PICO"} Framework
                    </CardDescription>
                  </div>
                  <Badge variant="outline">
                    {selectedProject.framework_type}
                  </Badge>
                </div>
              </CardHeader>
              {Object.keys(frameworkData).length > 0 && (
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(frameworkData).map(([key, value]) => (
                      <div key={key} className="p-2 rounded bg-muted/50">
                        <span className="text-xs font-medium text-muted-foreground">
                          {key}
                        </span>
                        <p className="text-sm truncate" title={value}>
                          {value || "-"}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Research Question Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Select Research Question
                </CardTitle>
                <CardDescription>
                  Choose a question from Define Tool or enter your own
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingQuestions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">Loading questions...</span>
                  </div>
                ) : (
                  <>
                    {researchQuestions.length > 0 && (
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Import className="h-4 w-4" />
                          Questions from Define Tool ({researchQuestions.length}
                          )
                        </Label>
                        <div className="space-y-2 max-h-[250px] overflow-y-auto">
                          {researchQuestions.map((question, idx) => (
                            <label
                              key={idx}
                              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                selectedQuestion === question
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              <input
                                type="radio"
                                name="research-question"
                                checked={selectedQuestion === question}
                                onChange={() => {
                                  setSelectedQuestion(question);
                                  setCustomQuestion("");
                                }}
                                className="mt-1"
                              />
                              <span className="text-sm flex-1">{question}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>
                        {researchQuestions.length > 0
                          ? "Or enter a custom question:"
                          : "Enter your research question:"}
                      </Label>
                      <Textarea
                        value={customQuestion}
                        onChange={(e) => {
                          setCustomQuestion(e.target.value);
                          if (e.target.value) {
                            setSelectedQuestion("");
                          }
                        }}
                        placeholder="Type your research question here..."
                        className="min-h-[100px]"
                      />
                    </div>

                    <Button
                      onClick={handleGenerateQuery}
                      disabled={
                        isGenerating ||
                        (!selectedQuestion && !customQuestion.trim())
                      }
                      className="w-full gap-2"
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating Query...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
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
