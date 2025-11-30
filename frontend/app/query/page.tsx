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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  apiClient,
  type Project,
  type QueryGenerateResponse,
  type PubMedArticle,
  type PubMedSearchResponse,
  type QueryHistoryItem,
} from "@/lib/api";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  ClipboardCopy,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  History,
  Import,
  Loader2,
  Play,
  Search,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import ReactMarkdown from "react-markdown";

// Step type for wizard
type Step = "select" | "generate" | "execute" | "results";

export default function QueryPage() {
  // Core State
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>("select");

  // Research Questions State
  const [researchQuestions, setResearchQuestions] = useState<string[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<string>("");
  const [customQuestion, setCustomQuestion] = useState<string>("");
  const [frameworkData, setFrameworkData] = useState<Record<string, string>>(
    {}
  );

  // Query Generation State
  const [queryResult, setQueryResult] = useState<QueryGenerateResponse | null>(
    null
  );
  const [selectedStrategy, setSelectedStrategy] = useState<
    "broad" | "focused" | "clinical_filtered"
  >("focused");
  const [isGenerating, setIsGenerating] = useState(false);

  // PubMed Search State
  const [searchResults, setSearchResults] = useState<PubMedSearchResponse | null>(
    null
  );
  const [isSearching, setIsSearching] = useState(false);
  const [maxResults, setMaxResults] = useState(20);
  const [sortBy, setSortBy] = useState<"relevance" | "date">("relevance");

  // History State
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Abstract Preview State
  const [selectedArticle, setSelectedArticle] = useState<PubMedArticle | null>(
    null
  );
  const [abstractContent, setAbstractContent] = useState<string>("");
  const [isLoadingAbstract, setIsLoadingAbstract] = useState(false);

  // Loading state for questions
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const data = await apiClient.getProjects();
      // Filter to only show projects with framework data
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
      // Load research questions from project
      const questionsData = await apiClient.getResearchQuestions(projectId);
      setResearchQuestions(questionsData.research_questions || []);
      setFrameworkData(questionsData.framework_data || {});

      // Load query history
      const historyData = await apiClient.getQueryHistory(projectId);
      setQueryHistory(historyData.queries || []);

      // If questions found, auto-select first one
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
      const result = await apiClient.generateQueryFromQuestion(
        selectedProject.id,
        questionToUse,
        selectedProject.framework_type
      );
      setQueryResult(result);
      setCurrentStep("execute");
      toast.success("Query generated successfully!");

      // Refresh history
      const historyData = await apiClient.getQueryHistory(selectedProject.id);
      setQueryHistory(historyData.queries || []);
    } catch (error: unknown) {
      console.error("Failed to generate query:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate query";
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleExecuteSearch() {
    if (!queryResult) return;

    const queryText =
      queryResult.queries[selectedStrategy as keyof typeof queryResult.queries];
    if (!queryText) {
      toast.error("No query to execute");
      return;
    }

    setIsSearching(true);
    try {
      const results = await apiClient.executePubMedSearch(
        queryText,
        maxResults,
        sortBy
      );
      setSearchResults(results);
      setCurrentStep("results");
      toast.success(`Found ${results.count.toLocaleString()} articles!`);
    } catch (error: unknown) {
      console.error("Failed to execute search:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to search PubMed";
      toast.error(errorMessage);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleViewAbstract(article: PubMedArticle) {
    setSelectedArticle(article);
    setIsLoadingAbstract(true);
    setAbstractContent("");

    try {
      const abstractData = await apiClient.getPubMedAbstract(article.pmid);
      setAbstractContent(abstractData.abstract || "No abstract available");
    } catch (error) {
      console.error("Failed to load abstract:", error);
      setAbstractContent("Failed to load abstract");
    } finally {
      setIsLoadingAbstract(false);
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  }

  function getStrategyDescription(strategy: string): string {
    switch (strategy) {
      case "broad":
        return "High sensitivity - casts a wide net to capture all relevant studies";
      case "focused":
        return "Balanced - recommended starting point for most reviews";
      case "clinical_filtered":
        return "High specificity - uses validated methodological filters";
      default:
        return "";
    }
  }

  // Stepper component
  const steps = [
    { key: "select", label: "Select Project", icon: FileText },
    { key: "generate", label: "Generate Query", icon: Sparkles },
    { key: "execute", label: "Execute Search", icon: Play },
    { key: "results", label: "View Results", icon: BookOpen },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
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

            {/* History Button */}
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
                    onClick={() => isClickable && setCurrentStep(step.key as Step)}
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
                    <Button variant="outline" onClick={() => window.location.href = "/define"}>
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
                    <CardTitle className="text-lg">{selectedProject.name}</CardTitle>
                    <CardDescription>
                      {selectedProject.framework_type || "PICO"} Framework
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{selectedProject.framework_type}</Badge>
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
                    {/* Questions from Define Tool */}
                    {researchQuestions.length > 0 && (
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Import className="h-4 w-4" />
                          Questions from Define Tool ({researchQuestions.length})
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

                    {/* Custom Question Input */}
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

                    {/* Generate Button */}
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

        {/* Step 3: Execute Search */}
        {currentStep === "execute" && queryResult && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Concepts */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="text-lg">Search Concepts</CardTitle>
                  <CardDescription>
                    {queryResult.framework_type} breakdown
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {queryResult.concepts.map((concept) => (
                    <div
                      key={concept.concept_number}
                      className="p-3 rounded-lg border bg-card/50"
                    >
                      <h4 className="font-medium text-sm text-primary mb-2">
                        {concept.component}
                      </h4>

                      {concept.free_text_terms.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs text-muted-foreground mb-1">
                            Free-text:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {concept.free_text_terms.slice(0, 5).map((term, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {term}
                              </Badge>
                            ))}
                            {concept.free_text_terms.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{concept.free_text_terms.length - 5}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {concept.mesh_terms.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            MeSH:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {concept.mesh_terms.slice(0, 3).map((term, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {term}
                              </Badge>
                            ))}
                            {concept.mesh_terms.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{concept.mesh_terms.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Toolbox */}
                  {queryResult.toolbox && queryResult.toolbox.length > 0 && (
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium mb-2">Quick Filters</p>
                      <div className="flex flex-wrap gap-2">
                        {queryResult.toolbox.map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => copyToClipboard(item.query, item.label)}
                            className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Query Strategies */}
            <div className="lg:col-span-2 space-y-6">
              {/* AI Analysis */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    AI Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{queryResult.message}</ReactMarkdown>
                </CardContent>
              </Card>

              {/* Query Strategies */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Query Strategies</CardTitle>
                  <CardDescription>
                    Select a strategy and execute the search
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs
                    value={selectedStrategy}
                    onValueChange={(v) =>
                      setSelectedStrategy(v as typeof selectedStrategy)
                    }
                  >
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                      <TabsTrigger value="broad">Broad</TabsTrigger>
                      <TabsTrigger value="focused">Focused</TabsTrigger>
                      <TabsTrigger value="clinical_filtered">Clinical</TabsTrigger>
                    </TabsList>

                    {["broad", "focused", "clinical_filtered"].map((strategy) => (
                      <TabsContent key={strategy} value={strategy} className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          {getStrategyDescription(strategy)}
                        </p>

                        <div className="relative">
                          <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100 whitespace-pre-wrap max-h-[300px]">
                            {queryResult.queries[
                              strategy as keyof typeof queryResult.queries
                            ] || "No query generated for this strategy"}
                          </pre>
                          <Button
                            onClick={() =>
                              copyToClipboard(
                                queryResult.queries[
                                  strategy as keyof typeof queryResult.queries
                                ],
                                `${strategy} query`
                              )
                            }
                            size="sm"
                            variant="secondary"
                            className="absolute right-2 top-2 gap-1"
                          >
                            <Copy className="h-3 w-3" />
                            Copy
                          </Button>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>

                  {/* Search Options */}
                  <div className="mt-6 pt-4 border-t space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label className="text-xs">Max Results</Label>
                        <Select
                          value={maxResults.toString()}
                          onValueChange={(v: string) => setMaxResults(parseInt(v))}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">Sort By</Label>
                        <Select
                          value={sortBy}
                          onValueChange={(v: string) => setSortBy(v as "relevance" | "date")}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="relevance">Relevance</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleExecuteSearch}
                        disabled={isSearching}
                        className="flex-1 gap-2"
                        size="lg"
                      >
                        {isSearching ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Searching...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            Execute Search in PubMed
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          window.open(
                            `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(
                              queryResult.queries[selectedStrategy]
                            )}`,
                            "_blank"
                          )
                        }
                        className="gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open in PubMed
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step 4: Results */}
        {currentStep === "results" && searchResults && (
          <div className="space-y-6">
            {/* Results Summary */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                      <Check className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {searchResults.count.toLocaleString()} Articles Found
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Showing {searchResults.returned} results
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep("execute")}
                      className="gap-2"
                    >
                      <Search className="h-4 w-4" />
                      Modify Search
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        window.open(
                          `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(
                            searchResults.query
                          )}`,
                          "_blank"
                        )
                      }
                      className="gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View All in PubMed
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Articles List */}
            <div className="grid gap-4">
              {searchResults.articles.map((article) => (
                <Card
                  key={article.pmid}
                  className="hover:border-primary/50 transition-colors"
                >
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm leading-tight mb-2">
                          {article.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span>{article.authors}</span>
                          <span>•</span>
                          <span>{article.journal}</span>
                          <span>•</span>
                          <span>{article.pubdate}</span>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            PMID: {article.pmid}
                          </Badge>
                          {article.pubtype?.slice(0, 2).map((type, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewAbstract(article)}
                          className="gap-1"
                        >
                          <FileText className="h-4 w-4" />
                          Abstract
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            window.open(
                              `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`,
                              "_blank"
                            )
                          }
                          className="gap-1"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Abstract Preview Dialog */}
      <Dialog
        open={!!selectedArticle}
        onOpenChange={() => setSelectedArticle(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg pr-8">
              {selectedArticle?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>{selectedArticle?.authors}</p>
              <p>
                {selectedArticle?.journal} • {selectedArticle?.pubdate}
              </p>
            </div>

            <div className="pt-2 border-t">
              <h4 className="font-medium mb-2">Abstract</h4>
              {isLoadingAbstract ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading abstract...
                </div>
              ) : (
                <p className="text-sm leading-relaxed">{abstractContent}</p>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() =>
                  selectedArticle &&
                  window.open(
                    `https://pubmed.ncbi.nlm.nih.gov/${selectedArticle.pmid}/`,
                    "_blank"
                  )
                }
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                View in PubMed
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  selectedArticle &&
                  copyToClipboard(
                    `${selectedArticle.title}\n${selectedArticle.authors}\n${selectedArticle.journal}, ${selectedArticle.pubdate}\nPMID: ${selectedArticle.pmid}`,
                    "Citation"
                  )
                }
                className="gap-2"
              >
                <ClipboardCopy className="h-4 w-4" />
                Copy Citation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
