"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Search, Copy, Sparkles, Loader2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import toast, { Toaster } from "react-hot-toast"
import { apiClient, type QueryGenerateResponse } from "@/lib/api"

export default function QueryPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [queryResult, setQueryResult] = useState<QueryGenerateResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedStrategy, setSelectedStrategy] = useState<"broad" | "focused" | "clinical_filtered">("focused")

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    try {
      const data = await apiClient.getProjects()
      setProjects(data.projects || [])
      if (data.projects && data.projects.length > 0) {
        setSelectedProject(data.projects[0])
      }
    } catch (error) {
      console.error("Failed to load projects:", error)
      toast.error("Failed to load projects")
    }
  }

  async function handleGenerate() {
    if (!selectedProject) {
      toast.error("Please select a project first")
      return
    }

    setLoading(true)
    try {
      const result = await apiClient.generateQuery(selectedProject.id)
      setQueryResult(result)
      toast.success("Query generated successfully!")
    } catch (error: any) {
      console.error("Failed to generate query:", error)
      toast.error(error.message || "Failed to generate query")
    } finally {
      setLoading(false)
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`)
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">PubMed Query Generator</h1>
          <p className="text-muted-foreground">
            Generate optimized search strategies from your research framework
          </p>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={loading || !selectedProject}
          size="lg"
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Query
            </>
          )}
        </Button>
      </div>

      {/* Project Selection */}
      {projects.length > 0 && (
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium">Select Project</label>
          <select
            value={selectedProject?.id || ""}
            onChange={(e) => {
              const project = projects.find((p) => p.id === e.target.value)
              setSelectedProject(project)
            }}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} ({project.framework_type})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Empty State */}
      {!queryResult && (
        <Card className="glass-panel">
          <CardHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Search className="h-6 w-6" />
            </div>
            <CardTitle>Ready to Generate Your Query</CardTitle>
            <CardDescription>
              {selectedProject
                ? `Selected: ${selectedProject.name} (${selectedProject.framework_type})`
                : "Select a project and click Generate to create your PubMed search strategy"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This tool will generate:
            </p>
            <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-muted-foreground">
              <li>Concept analysis with MeSH terms</li>
              <li>Three query strategies (Broad, Focused, Clinical Filtered)</li>
              <li>Toolbox filters for refinement</li>
              <li>AI analysis and recommendations</li>
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Results Layout */}
      {queryResult && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column: Concept Analysis (30%) */}
          <div className="lg:col-span-1">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Concept Analysis</CardTitle>
                <CardDescription>
                  {queryResult.framework_type} Components Breakdown
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {queryResult.concepts.map((concept) => (
                  <div key={concept.concept_number} className="rounded-lg border border-border/50 p-4">
                    <h4 className="mb-2 font-semibold text-primary">
                      Concept {concept.concept_number}: {concept.component}
                    </h4>

                    {concept.free_text_terms.length > 0 && (
                      <div className="mb-3">
                        <p className="mb-1 text-xs text-muted-foreground">Free-text terms:</p>
                        <div className="flex flex-wrap gap-1">
                          {concept.free_text_terms.map((term, idx) => (
                            <Badge key={idx} variant="emerald">
                              {term}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {concept.mesh_terms.length > 0 && (
                      <div>
                        <p className="mb-1 text-xs text-muted-foreground">MeSH terms:</p>
                        <div className="flex flex-wrap gap-1">
                          {concept.mesh_terms.map((term, idx) => (
                            <Badge key={idx} variant="slate">
                              {term}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Strategies & Toolbox (70%) */}
          <div className="space-y-6 lg:col-span-2">
            {/* AI Analysis */}
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Analysis & Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm prose-invert max-w-none">
                <ReactMarkdown>{queryResult.message}</ReactMarkdown>
              </CardContent>
            </Card>

            {/* Query Strategies */}
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Query Strategies</CardTitle>
                <CardDescription>
                  Three levels of sensitivity and specificity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedStrategy} onValueChange={(v) => setSelectedStrategy(v as any)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="broad">Broad</TabsTrigger>
                    <TabsTrigger value="focused">Focused</TabsTrigger>
                    <TabsTrigger value="clinical_filtered">Clinical Filtered</TabsTrigger>
                  </TabsList>

                  <TabsContent value="broad" className="space-y-4">
                    <div>
                      <p className="mb-2 text-sm text-muted-foreground">
                        High sensitivity, lower specificity. Casts a wide net.
                      </p>
                      <div className="relative">
                        <pre className="overflow-x-auto rounded-md bg-slate-900 p-4 font-mono text-xs">
                          {queryResult.queries.broad}
                        </pre>
                        <Button
                          onClick={() => copyToClipboard(queryResult.queries.broad, "Broad query")}
                          size="sm"
                          variant="outline"
                          className="absolute right-2 top-2"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="focused" className="space-y-4">
                    <div>
                      <p className="mb-2 text-sm text-muted-foreground">
                        Balanced sensitivity and specificity. Recommended starting point.
                      </p>
                      <div className="relative">
                        <pre className="overflow-x-auto rounded-md bg-slate-900 p-4 font-mono text-xs">
                          {queryResult.queries.focused}
                        </pre>
                        <Button
                          onClick={() => copyToClipboard(queryResult.queries.focused, "Focused query")}
                          size="sm"
                          variant="outline"
                          className="absolute right-2 top-2"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="clinical_filtered" className="space-y-4">
                    <div>
                      <p className="mb-2 text-sm text-muted-foreground">
                        Lower sensitivity, high specificity. Uses validated methodological filters.
                      </p>
                      <div className="relative">
                        <pre className="overflow-x-auto rounded-md bg-slate-900 p-4 font-mono text-xs">
                          {queryResult.queries.clinical_filtered}
                        </pre>
                        <Button
                          onClick={() => copyToClipboard(queryResult.queries.clinical_filtered, "Clinical query")}
                          size="sm"
                          variant="outline"
                          className="absolute right-2 top-2"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Toolbox */}
            {queryResult.toolbox && queryResult.toolbox.length > 0 && (
              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle>Toolbox Filters</CardTitle>
                  <CardDescription>
                    Click to copy additional filters and modifiers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {queryResult.toolbox.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => copyToClipboard(item.query, item.label)}
                        className="rounded-full border border-primary/50 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-clinical hover:bg-primary/20"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
