"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { apiClient, Project, AbstractResponse, FileUploadResponse } from "@/lib/api"
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Filter,
  Download,
  Loader2,
  ArrowLeft,
  Play
} from "lucide-react"
import { Button } from "@/components/ui/button"
import toast, { Toaster } from "react-hot-toast"

type ViewMode = 'upload' | 'screening'
type StatusFilter = 'all' | 'include' | 'exclude' | 'maybe' | 'pending'

export default function ReviewPage() {
  // State
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [viewMode, setViewMode] = useState<ViewMode>('upload')
  const [abstracts, setAbstracts] = useState<AbstractResponse[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load projects on mount
  useEffect(() => {
    loadProjects()
  }, [])

  // Load abstracts when project changes
  useEffect(() => {
    if (selectedProjectId) {
      loadAbstracts()
    }
  }, [selectedProjectId])

  const loadProjects = async () => {
    try {
      const data = await apiClient.getProjects()
      setProjects(data)
      if (data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data[0].id)
      }
    } catch (error) {
      toast.error("Failed to load projects")
    }
  }

  const loadAbstracts = async () => {
    if (!selectedProjectId) return
    setIsLoading(true)
    try {
      const data = await apiClient.getAbstracts(selectedProjectId)
      setAbstracts(data)
      if (data.length > 0) {
        setViewMode('screening')
      }
    } catch (error) {
      // No abstracts yet - stay on upload view
      setAbstracts([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ['.txt', '.medline']
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
      if (!validTypes.includes(ext)) {
        toast.error("Invalid file type. Please upload a .txt or .medline file")
        return
      }
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !selectedProjectId) return

    setIsUploading(true)
    try {
      const result = await apiClient.uploadMedlineFile(selectedProjectId, selectedFile)
      setUploadedFileId(result.id)
      toast.success(`File uploaded! Processing ${selectedFile.name}...`)

      // Poll for completion
      pollFileStatus(result.id)
    } catch (error: any) {
      toast.error(error.message || "Upload failed")
    } finally {
      setIsUploading(false)
    }
  }

  const pollFileStatus = async (fileId: string) => {
    // Simple polling - in production use WebSockets
    const checkStatus = async () => {
      try {
        await loadAbstracts()
        if (abstracts.length > 0) {
          setViewMode('screening')
          toast.success("File parsed successfully!")
        } else {
          // Keep polling
          setTimeout(checkStatus, 2000)
        }
      } catch (error) {
        setTimeout(checkStatus, 2000)
      }
    }
    setTimeout(checkStatus, 2000)
  }

  const handleStartAnalysis = async () => {
    if (!selectedProjectId || !uploadedFileId) {
      toast.error("Please upload a file first")
      return
    }

    setIsAnalyzing(true)
    try {
      const result = await apiClient.startBatchAnalysis(selectedProjectId, uploadedFileId)
      toast.success(`Analysis started! Processing ${result.total_abstracts} abstracts...`)

      // Poll for results
      const pollResults = async () => {
        await loadAbstracts()
        const analyzed = abstracts.filter(a => a.status !== 'pending').length
        if (analyzed < result.total_abstracts) {
          setTimeout(pollResults, 3000)
        } else {
          setIsAnalyzing(false)
          toast.success("Analysis complete!")
        }
      }
      setTimeout(pollResults, 3000)
    } catch (error: any) {
      toast.error(error.message || "Analysis failed")
      setIsAnalyzing(false)
    }
  }

  const handleDecision = async (abstractId: string, decision: 'include' | 'exclude' | 'maybe') => {
    try {
      await apiClient.updateAbstractDecision(abstractId, decision)
      setAbstracts(prev =>
        prev.map(a => a.id === abstractId ? { ...a, status: decision, human_decision: decision } : a)
      )
      toast.success(`Marked as ${decision}`)
    } catch (error) {
      toast.error("Failed to update decision")
    }
  }

  const toggleCardExpansion = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Filter abstracts
  const filteredAbstracts = statusFilter === 'all'
    ? abstracts
    : abstracts.filter(a => a.status === statusFilter)

  // Stats
  const stats = {
    total: abstracts.length,
    include: abstracts.filter(a => a.status === 'include').length,
    exclude: abstracts.filter(a => a.status === 'exclude').length,
    maybe: abstracts.filter(a => a.status === 'maybe').length,
    pending: abstracts.filter(a => a.status === 'pending').length,
  }

  const selectedProject = projects.find(p => p.id === selectedProjectId)

  // Render Upload View
  if (viewMode === 'upload') {
    return (
      <div className="flex flex-col min-h-screen">
        <Toaster position="top-right" />

        {/* Header */}
        <header className="flex shrink-0 items-center px-4 py-3 border-b border-border">
          <h1 className="font-display text-lg font-bold flex-1 text-center">Upload for Review</h1>
        </header>

        <main className="flex flex-1 flex-col px-4 pt-6 pb-4 max-w-2xl mx-auto w-full">
          {/* Headline */}
          <div className="flex flex-col">
            <h2 className="font-display text-3xl font-bold leading-tight tracking-tight">Import from PubMed</h2>
            <p className="mt-2 text-base text-muted-foreground">Select your MEDLINE format file to begin the screening process.</p>
          </div>

          {/* Project Selector */}
          <div className="mt-6">
            <label className="block text-sm font-medium mb-2">Select Project</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm focus:border-primary focus:ring-primary"
            >
              <option value="">Select a project...</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>

          {/* File Upload Area */}
          <div className="flex flex-col pt-8">
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center gap-6 rounded-xl border-2 border-dashed px-6 py-14 cursor-pointer transition-all ${
                selectedFile
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-card/50'
              }`}
            >
              <div className={`flex size-16 items-center justify-center rounded-full ${
                selectedFile ? 'bg-primary/20' : 'bg-primary/10'
              }`}>
                {selectedFile ? (
                  <FileText className="h-8 w-8 text-primary" />
                ) : (
                  <Upload className="h-8 w-8 text-primary" />
                )}
              </div>
              <div className="flex max-w-[480px] flex-col items-center gap-1">
                {selectedFile ? (
                  <>
                    <p className="font-display text-lg font-bold leading-tight text-center">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground text-center">
                      {(selectedFile.size / 1024).toFixed(1)} KB • Click to change file
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-display text-lg font-bold leading-tight text-center">Tap to Select File</p>
                    <p className="text-sm text-muted-foreground text-center">Choose a .txt or .medline file from your device</p>
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
                'Start Upload'
              )}
            </Button>
          </div>

          {/* View existing abstracts link */}
          {abstracts.length > 0 && (
            <button
              onClick={() => setViewMode('screening')}
              className="text-sm text-primary hover:underline mt-4 text-center"
            >
              View {abstracts.length} existing abstracts →
            </button>
          )}
        </main>
      </div>
    )
  }

  // Render Screening Results View
  return (
    <div className="flex flex-col min-h-screen">
      <Toaster position="top-right" />

      {/* Top App Bar */}
      <div className="sticky top-0 z-10 flex flex-col gap-2 bg-background/80 backdrop-blur-sm p-4 pb-2">
        <div className="flex items-center h-12 justify-between">
          <button
            onClick={() => setViewMode('upload')}
            className="flex size-12 shrink-0 items-center justify-center text-foreground hover:bg-card rounded-full transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            {isAnalyzing && (
              <span className="flex items-center gap-2 text-sm text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </span>
            )}
            <button className="flex size-12 shrink-0 items-center justify-center text-foreground hover:bg-card rounded-full transition-colors">
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </div>
        <p className="font-display text-3xl font-bold leading-tight tracking-tight">
          {selectedProject?.name || 'Review'}
        </p>
      </div>

      {/* Status Chips */}
      <div className="sticky top-[120px] z-10 bg-background/80 backdrop-blur-sm px-4 pt-2 pb-3">
        <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-4 px-4">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg px-4 transition-colors ${
              statusFilter === 'all' ? 'bg-slate-200/50 dark:bg-slate-800' : 'bg-slate-200/30 dark:bg-slate-800/50'
            }`}
          >
            <p className="text-sm font-medium">Total: {stats.total}</p>
          </button>
          <button
            onClick={() => setStatusFilter('include')}
            className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg px-4 transition-colors status-include ${
              statusFilter === 'include' ? 'ring-2 ring-emerald-500/50' : ''
            }`}
          >
            <CheckCircle className="h-4 w-4" />
            <p className="text-sm font-medium">Included: {stats.include}</p>
          </button>
          <button
            onClick={() => setStatusFilter('exclude')}
            className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg px-4 transition-colors status-exclude ${
              statusFilter === 'exclude' ? 'ring-2 ring-red-500/50' : ''
            }`}
          >
            <XCircle className="h-4 w-4" />
            <p className="text-sm font-medium">Excluded: {stats.exclude}</p>
          </button>
          <button
            onClick={() => setStatusFilter('maybe')}
            className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg px-4 transition-colors status-maybe ${
              statusFilter === 'maybe' ? 'ring-2 ring-amber-500/50' : ''
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            <p className="text-sm font-medium">Maybe: {stats.maybe}</p>
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg px-4 transition-colors status-pending ${
              statusFilter === 'pending' ? 'ring-2 ring-slate-500/50' : ''
            }`}
          >
            <p className="text-sm font-medium">Pending: {stats.pending}</p>
          </button>
        </div>
      </div>

      {/* Section Header */}
      <div className="flex justify-between items-center px-4 pb-2 pt-4">
        <h3 className="font-display text-xl font-bold">Screening Results</h3>
        {stats.pending > 0 && !isAnalyzing && (
          <Button
            onClick={handleStartAnalysis}
            size="sm"
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            Analyze {stats.pending} Pending
          </Button>
        )}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredAbstracts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <p className="text-lg font-medium text-center">No abstracts found</p>
          <p className="text-sm text-muted-foreground text-center mt-1">
            {statusFilter !== 'all' ? 'Try changing the filter' : 'Upload a MEDLINE file to get started'}
          </p>
        </div>
      ) : (
        /* Card List */
        <div className="flex flex-col gap-4 p-4 pb-24">
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

      {/* Floating Export Button */}
      {abstracts.length > 0 && (
        <div className="sticky bottom-0 mt-auto p-4 bg-gradient-to-t from-background to-transparent">
          <Button
            className="w-full h-14 text-base font-bold gap-2 shadow-lg shadow-primary/30"
            onClick={() => toast.success("Export feature coming soon!")}
          >
            <Download className="h-5 w-5" />
            Export Results
          </Button>
        </div>
      )}
    </div>
  )
}

// Abstract Card Component
interface AbstractCardProps {
  abstract: AbstractResponse
  isExpanded: boolean
  onToggle: () => void
  onDecision: (id: string, decision: 'include' | 'exclude' | 'maybe') => void
}

function AbstractCard({ abstract, isExpanded, onToggle, onDecision }: AbstractCardProps) {
  const statusConfig = {
    include: {
      icon: CheckCircle,
      label: 'INCLUDE',
      className: 'status-include',
      buttonClassName: 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
    },
    exclude: {
      icon: XCircle,
      label: 'EXCLUDE',
      className: 'status-exclude',
      buttonClassName: 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
    },
    maybe: {
      icon: HelpCircle,
      label: 'MAYBE',
      className: 'status-maybe',
      buttonClassName: 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
    },
    pending: {
      icon: HelpCircle,
      label: 'PENDING',
      className: 'status-pending',
      buttonClassName: 'bg-slate-500/10 text-slate-400 hover:bg-slate-500/20'
    },
  }

  const config = statusConfig[abstract.status] || statusConfig.pending
  const StatusIcon = config.icon

  return (
    <div className="flex flex-col rounded-xl glassmorphism shadow-lg">
      <div className="flex w-full grow flex-col gap-3 p-4">
        {/* Status Badge & Expand Button */}
        <div className="flex items-center justify-between">
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${config.className}`}>
            <StatusIcon className="h-4 w-4" />
            <span>{config.label}</span>
          </div>
          <button
            onClick={onToggle}
            className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>

        {/* Title */}
        <p className="font-display text-lg font-bold leading-tight">
          {abstract.title || 'Untitled'}
        </p>

        {/* Meta Info */}
        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground text-sm">
            {abstract.authors || 'Unknown authors'} • {abstract.journal || 'Unknown journal'}, {abstract.publication_date || 'N/A'}
          </p>
          {!isExpanded && abstract.ai_reasoning && (
            <p className="text-muted-foreground text-sm line-clamp-2">
              Reason: {abstract.ai_reasoning}
            </p>
          )}
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="flex flex-col gap-4 pt-2 border-t border-border/50 mt-2">
            {/* Abstract Text */}
            {abstract.abstract_text && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Abstract</p>
                <p className="text-sm leading-relaxed">{abstract.abstract_text}</p>
              </div>
            )}

            {/* AI Reasoning */}
            {abstract.ai_reasoning && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">AI Reasoning</p>
                <p className="text-sm">{abstract.ai_reasoning}</p>
              </div>
            )}

            {/* Keywords */}
            {abstract.keywords && abstract.keywords.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Keywords</p>
                <div className="flex flex-wrap gap-2">
                  {abstract.keywords.map((keyword, i) => (
                    <span key={i} className="px-2 py-1 rounded-md bg-card text-xs">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* PMID */}
            <div className="bg-card rounded-lg p-3">
              <code className="font-mono text-sm text-muted-foreground">PMID: {abstract.pmid}</code>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          {abstract.status !== 'include' && (
            <button
              onClick={() => onDecision(abstract.id, 'include')}
              className={`flex w-full items-center justify-center rounded-lg h-10 px-4 text-sm font-medium transition-colors ${statusConfig.include.buttonClassName}`}
            >
              Include
            </button>
          )}
          {abstract.status !== 'exclude' && (
            <button
              onClick={() => onDecision(abstract.id, 'exclude')}
              className={`flex w-full items-center justify-center rounded-lg h-10 px-4 text-sm font-medium transition-colors ${statusConfig.exclude.buttonClassName}`}
            >
              Exclude
            </button>
          )}
          {abstract.status !== 'maybe' && abstract.status !== 'pending' && (
            <button
              onClick={() => onDecision(abstract.id, 'maybe')}
              className={`flex w-full items-center justify-center rounded-lg h-10 px-4 text-sm font-medium transition-colors ${statusConfig.maybe.buttonClassName}`}
            >
              Maybe
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
