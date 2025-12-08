"use client";

import { useState, useEffect, useRef } from "react";
import {
  apiClient,
  type Project,
  type AbstractResponse,
} from "@/lib/api";
import {
  Upload,
  FileText,
  Loader2,
  ArrowLeft,
  Play,
  Download,
  Filter,
  CheckCircle,
  XCircle,
  HelpCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { AbstractCard } from "@/components/molecules/AbstractCard";
import { EmptyState } from "@/components/molecules/EmptyState";
import toast, { Toaster } from "react-hot-toast";
import { cn } from "@/lib/utils";

type ViewMode = "upload" | "screening";
type StatusFilter = "all" | "include" | "exclude" | "maybe" | "pending";

export default function ReviewPage() {
  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("upload");
  const [abstracts, setAbstracts] = useState<AbstractResponse[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Load abstracts when project changes
  useEffect(() => {
    if (selectedProjectId) {
      loadAbstracts();
    }
  }, [selectedProjectId]);

  const loadProjects = async () => {
    try {
      const data = await apiClient.getProjects();
      setProjects(data);
      if (data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data[0].id);
      }
    } catch (error) {
      toast.error("Failed to load projects");
    }
  };

  const loadAbstracts = async () => {
    if (!selectedProjectId) return;
    setIsLoading(true);
    try {
      const data = await apiClient.getAbstracts(selectedProjectId);
      setAbstracts(data);
      if (data.length > 0) {
        setViewMode("screening");
      }
    } catch (error) {
      setAbstracts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [".txt", ".medline"];
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
      if (!validTypes.includes(ext)) {
        toast.error("Invalid file type. Please upload a .txt or .medline file");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedProjectId) return;

    setIsUploading(true);
    try {
      const result = await apiClient.uploadMedlineFile(
        selectedProjectId,
        selectedFile
      );
      setUploadedFileId(result.id);
      toast.success(`File uploaded! Processing ${selectedFile.name}...`);
      pollFileStatus(result.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const pollFileStatus = async (fileId: string) => {
    const MAX_ATTEMPTS = 30;
    let attempts = 0;

    const checkStatus = async () => {
      attempts++;
      if (attempts > MAX_ATTEMPTS) {
        toast.error("File processing timeout. Please refresh to check status.");
        return;
      }

      try {
        const freshAbstracts = await apiClient.getAbstracts(selectedProjectId);
        if (freshAbstracts.length > 0) {
          setAbstracts(freshAbstracts);
          setViewMode("screening");
          toast.success("File parsed successfully!");
        } else {
          setTimeout(checkStatus, 2000);
        }
      } catch (error) {
        setTimeout(checkStatus, 2000);
      }
    };
    setTimeout(checkStatus, 2000);
  };

  const handleStartAnalysis = async () => {
    if (!selectedProjectId || !uploadedFileId) {
      toast.error("Please upload a file first");
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await apiClient.startBatchAnalysis(
        selectedProjectId,
        uploadedFileId
      );
      toast.success(
        `Analysis started! Processing ${result.total_abstracts} abstracts...`
      );

      const pollResults = async () => {
        await loadAbstracts();
        const analyzed = abstracts.filter((a) => a.status !== "pending").length;
        if (analyzed < result.total_abstracts) {
          setTimeout(pollResults, 3000);
        } else {
          setIsAnalyzing(false);
          toast.success("Analysis complete!");
        }
      };
      setTimeout(pollResults, 3000);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Analysis failed";
      toast.error(message);
      setIsAnalyzing(false);
    }
  };

  const handleDecision = async (
    abstractId: string,
    decision: "include" | "exclude" | "maybe"
  ) => {
    // Optimistic update
    setAbstracts((prev) =>
      prev.map((a) =>
        a.id === abstractId
          ? { ...a, status: decision, human_decision: decision }
          : a
      )
    );

    try {
      await apiClient.updateAbstractDecision(abstractId, decision);
      toast.success(`Marked as ${decision}`);
    } catch (error) {
      toast.error("Failed to update decision");
      loadAbstracts(); // Revert on error
    }
  };

  const toggleCardExpansion = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filter abstracts
  const filteredAbstracts =
    statusFilter === "all"
      ? abstracts
      : abstracts.filter((a) => a.status === statusFilter);

  // Stats
  const stats = {
    total: abstracts.length,
    include: abstracts.filter((a) => a.status === "include").length,
    exclude: abstracts.filter((a) => a.status === "exclude").length,
    maybe: abstracts.filter((a) => a.status === "maybe").length,
    pending: abstracts.filter((a) => a.status === "pending").length,
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  // =====================
  // UPLOAD VIEW
  // =====================
  if (viewMode === "upload") {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Toaster position="top-right" />

        {/* Header */}
        <header className="flex shrink-0 items-center px-4 py-4 border-b">
          <h1 className="text-lg font-bold flex-1 text-center">
            Upload for Review
          </h1>
        </header>

        <main className="flex flex-1 flex-col px-4 pt-6 pb-4 max-w-2xl mx-auto w-full">
          {/* Headline */}
          <div className="flex flex-col">
            <h2 className="text-3xl font-bold leading-tight tracking-tight">
              Import from PubMed
            </h2>
            <p className="mt-2 text-base text-muted-foreground">
              Select your MEDLINE format file to begin the screening process.
            </p>
          </div>

          {/* Project Selector */}
          <div className="mt-6">
            <label className="block text-sm font-medium mb-2">
              Select Project
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="">Select a project...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* File Upload Area */}
          <div className="flex flex-col pt-8">
            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex flex-col items-center gap-6 rounded-xl border-2 border-dashed px-6 py-14 cursor-pointer transition-all",
                selectedFile
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <div
                className={cn(
                  "flex size-16 items-center justify-center rounded-full",
                  selectedFile ? "bg-primary/20" : "bg-primary/10"
                )}
              >
                {selectedFile ? (
                  <FileText className="h-8 w-8 text-primary" />
                ) : (
                  <Upload className="h-8 w-8 text-primary" />
                )}
              </div>
              <div className="flex max-w-[480px] flex-col items-center gap-1">
                {selectedFile ? (
                  <>
                    <p className="text-lg font-bold leading-tight text-center">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-muted-foreground text-center">
                      {(selectedFile.size / 1024).toFixed(1)} KB • Click to
                      change file
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-bold leading-tight text-center">
                      Click to Select File
                    </p>
                    <p className="text-sm text-muted-foreground text-center">
                      Choose a .txt or .medline file from your device
                    </p>
                  </>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.medline"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <div className="flex-grow" />

          {/* Upload Button */}
          <div className="flex w-full py-3 mt-8">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !selectedProjectId || isUploading}
              className="w-full h-12 text-base font-bold"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Start Upload"
              )}
            </Button>
          </div>

          {/* View existing abstracts link */}
          {abstracts.length > 0 && (
            <button
              onClick={() => setViewMode("screening")}
              className="text-sm text-primary hover:underline mt-4 text-center"
            >
              View {abstracts.length} existing abstracts →
            </button>
          )}
        </main>
      </div>
    );
  }

  // =====================
  // SCREENING VIEW
  // =====================
  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
      <Toaster position="top-right" />

      {/* Top App Bar */}
      <div className="sticky top-0 z-20 flex flex-col bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm">
        <div className="flex items-center h-16 px-4 justify-between max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("upload")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-bold text-lg leading-none">
                {selectedProject?.name || "Review"}
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Systematic Review Screening
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAnalyzing && <StatusBadge status="analyzing" />}
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-4 py-2 bg-muted/30 border-t">
          <div className="max-w-5xl mx-auto w-full flex gap-2 overflow-x-auto hide-scrollbar">
            <FilterChip
              label="All"
              count={stats.total}
              isActive={statusFilter === "all"}
              onClick={() => setStatusFilter("all")}
            />
            <FilterChip
              label="Included"
              count={stats.include}
              isActive={statusFilter === "include"}
              onClick={() => setStatusFilter("include")}
              icon={CheckCircle}
              color="emerald"
            />
            <FilterChip
              label="Excluded"
              count={stats.exclude}
              isActive={statusFilter === "exclude"}
              onClick={() => setStatusFilter("exclude")}
              icon={XCircle}
              color="red"
            />
            <FilterChip
              label="Maybe"
              count={stats.maybe}
              isActive={statusFilter === "maybe"}
              onClick={() => setStatusFilter("maybe")}
              icon={HelpCircle}
              color="amber"
            />
            <FilterChip
              label="Pending"
              count={stats.pending}
              isActive={statusFilter === "pending"}
              onClick={() => setStatusFilter("pending")}
              icon={Clock}
              color="slate"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full p-4 pb-24">
        {/* Actions Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {statusFilter === "all" ? "All Abstracts" : `${statusFilter}`}
            <span className="ml-2 bg-muted px-2 py-0.5 rounded-full text-foreground">
              {filteredAbstracts.length}
            </span>
          </h2>

          {stats.pending > 0 && !isAnalyzing && (
            <Button
              onClick={handleStartAnalysis}
              size="sm"
              className="gap-2 shadow-sm"
            >
              <Play className="h-4 w-4" />
              Analyze Pending
            </Button>
          )}
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading abstracts...</p>
          </div>
        ) : filteredAbstracts.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No abstracts found"
            description={
              statusFilter !== "all"
                ? "Try changing the status filter to see more results."
                : "Upload a MEDLINE file to get started."
            }
            actionLabel={statusFilter !== "all" ? "Clear Filters" : undefined}
            onAction={
              statusFilter !== "all" ? () => setStatusFilter("all") : undefined
            }
          />
        ) : (
          <div className="flex flex-col gap-4">
            {filteredAbstracts.map((abstract) => (
              <AbstractCard
                key={abstract.id}
                abstract={abstract}
                isExpanded={expandedCards.has(abstract.id)}
                onToggle={() => toggleCardExpansion(abstract.id)}
                onDecision={handleDecision}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Export Button */}
      {abstracts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-30">
          <Button
            className="rounded-full h-12 px-6 shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
            onClick={() => toast.success("Export feature coming soon!")}
          >
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      )}
    </div>
  );
}

// =====================
// FILTER CHIP COMPONENT
// =====================
interface FilterChipProps {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  color?: "emerald" | "red" | "amber" | "slate" | "primary";
}

function FilterChip({
  label,
  count,
  isActive,
  onClick,
  icon: Icon,
  color = "primary",
}: FilterChipProps) {
  const activeStyles: Record<string, string> = {
    emerald:
      "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
    red: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    amber:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
    slate:
      "bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600",
    primary: "bg-primary text-primary-foreground border-primary shadow-sm",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap",
        isActive
          ? activeStyles[color]
          : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground"
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
      <span
        className={cn(
          "px-1.5 py-0.5 rounded-full text-[10px]",
          isActive ? "bg-background/20" : "bg-muted"
        )}
      >
        {count}
      </span>
    </button>
  );
}
