"use client"

import { useState, useEffect, useRef } from "react"
import {
  apiClient,
  Project,
  ChatMessage,
  FrameworkSchema,
} from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Send,
  Loader2,
  ChevronDown,
  Sparkles,
  History,
  Settings,
  Search,
  Plus
} from "lucide-react"
import toast, { Toaster } from "react-hot-toast"

export default function DefinePage() {
  // State
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [frameworks, setFrameworks] = useState<Record<string, FrameworkSchema>>({})
  const [selectedFramework, setSelectedFramework] = useState<string>("PICO")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [frameworkData, setFrameworkData] = useState<Record<string, string>>({})
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set(['P']))
  const [frameworkSearch, setFrameworkSearch] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load projects and frameworks on mount
  useEffect(() => {
    loadProjects()
    loadFrameworks()
  }, [])

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadProjects = async () => {
    try {
      const data = await apiClient.getProjects()
      setProjects(data)
      if (data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data[0].id)
        if (data[0].framework_data) {
          setFrameworkData(data[0].framework_data)
        }
        if (data[0].framework_type) {
          setSelectedFramework(data[0].framework_type)
        }
        loadConversation(data[0].id)
      }
    } catch (error) {
      toast.error("Failed to load projects")
    }
  }

  const loadFrameworks = async () => {
    try {
      const data = await apiClient.getFrameworks()
      if (data?.frameworks) {
        setFrameworks(data.frameworks)
      }
    } catch (error) {
      // Use default PICO if API fails
      setFrameworks({
        PICO: {
          name: "PICO",
          description: "Population, Intervention, Comparison, Outcome",
          fields: [
            { key: "P", label: "Population", description: "Who is the patient or population?" },
            { key: "I", label: "Intervention", description: "What is the intervention?" },
            { key: "C", label: "Comparison", description: "What is the comparison?" },
            { key: "O", label: "Outcome", description: "What is the outcome?" },
          ],
        },
      })
    }
  }

  const loadConversation = async (projectId: string) => {
    try {
      const data = await apiClient.getConversation(projectId)
      if (data?.messages) {
        setMessages(data.messages)
      }
      if (data?.framework_data) {
        setFrameworkData(data.framework_data)
      }
    } catch (error) {
      // New project with no conversation yet
      setMessages([])
    }
  }

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId)
    const project = projects.find(p => p.id === projectId)
    if (project) {
      if (project.framework_data) setFrameworkData(project.framework_data)
      if (project.framework_type) setSelectedFramework(project.framework_type)
    }
    loadConversation(projectId)
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedProjectId) return

    setIsLoading(true)
    const userMessage = inputMessage.trim()
    setInputMessage("")

    // Add user message to chat
    setMessages(prev => [...prev, { role: "user", content: userMessage }])

    try {
      const data = await apiClient.chat(selectedProjectId, userMessage, selectedFramework)

      // Add AI response to chat
      setMessages(prev => [...prev, { role: "assistant", content: data.message }])

      // Update framework data if extracted
      if (data.extracted_fields) {
        setFrameworkData(prev => ({ ...prev, ...data.extracted_fields }))
        toast.success("Framework fields updated from chat!")
      }
    } catch (error: any) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: `Error: ${error.message || "Something went wrong"}` },
      ])
      toast.error("Failed to send message")
    }

    setIsLoading(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleAccordion = (key: string) => {
    setOpenAccordions(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const currentFramework = frameworks[selectedFramework]

  // Calculate progress
  const filledFields = currentFramework?.fields.filter(f => frameworkData[f.key]?.trim()).length || 0
  const totalFields = currentFramework?.fields.length || 1
  const progressPercent = Math.round((filledFields / totalFields) * 100)

  // Filter frameworks by search
  const filteredFrameworks = Object.entries(frameworks).filter(([key, schema]) =>
    schema.name.toLowerCase().includes(frameworkSearch.toLowerCase()) ||
    schema.description.toLowerCase().includes(frameworkSearch.toLowerCase())
  )

  // Build formulated research question
  const formulatedQuestion = currentFramework?.fields
    .map(f => frameworkData[f.key])
    .filter(Boolean)
    .join(" → ") || "Your question will appear here as you fill the form..."

  const suggestedPrompts = [
    "Suggest an outcome",
    "Refine my intervention",
    "Find a framework"
  ]

  return (
    <div className="flex h-screen w-full flex-col">
      <Toaster position="top-right" />

      {/* Top App Bar */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-4 md:px-6 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="font-display text-xl font-bold">Define</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center justify-center rounded-full h-10 w-10 hover:bg-card transition-colors">
            <History className="h-5 w-5" />
          </button>
          <button className="flex items-center justify-center rounded-full h-10 w-10 hover:bg-card transition-colors">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left Pane - Dynamic Form */}
        <div className="w-full lg:w-1/2 flex flex-col overflow-y-auto p-6 md:p-8">
          <div className="flex flex-col gap-8">
            {/* Header */}
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight">Define Your Research Question</h1>
              <p className="mt-2 text-muted-foreground">Fill in the details below or use the AI assistant to help formulate your question.</p>
            </div>

            {/* Project Selector */}
            <div>
              <label className="block text-sm font-medium mb-2">Select Project</label>
              <select
                value={selectedProjectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm focus:border-primary focus:ring-primary"
              >
                <option value="">Select a project...</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>

            {/* Progress Bar */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium">Progress</p>
                <p className="text-sm font-medium text-primary">{filledFields}/{totalFields} Complete</p>
              </div>
              <div className="w-full rounded-full bg-card h-2">
                <div
                  className="h-2 rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Accordions for Framework Fields */}
            <div className="flex flex-col gap-4">
              {currentFramework?.fields.map((field) => (
                <details
                  key={field.key}
                  className="flex flex-col rounded-xl border border-border bg-card group transition-all duration-300"
                  open={openAccordions.has(field.key)}
                  onClick={(e) => {
                    e.preventDefault()
                    toggleAccordion(field.key)
                  }}
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 p-4 list-none">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        frameworkData[field.key]?.trim()
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {field.key}
                      </span>
                      <p className="font-display text-lg font-bold">{field.label}</p>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${
                      openAccordions.has(field.key) ? 'rotate-180' : ''
                    }`} />
                  </summary>
                  <div
                    className="px-4 pb-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="text-muted-foreground mb-3 text-sm">{field.description}</p>
                    <Input
                      value={frameworkData[field.key] || ""}
                      onChange={(e) => setFrameworkData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={`e.g., ${field.label === 'Population' ? 'Adults over 65 with type 2 diabetes' : `Enter ${field.label.toLowerCase()}...`}`}
                      className="w-full"
                    />
                  </div>
                </details>
              ))}
            </div>

            {/* Framework Selector */}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="font-display text-lg font-bold">Select Theoretical Framework</p>
              <p className="text-muted-foreground mt-1 mb-3 text-sm">Choose a framework to structure your research.</p>
              <div className="relative">
                <Input
                  value={frameworkSearch}
                  onChange={(e) => setFrameworkSearch(e.target.value)}
                  placeholder="Search for a framework..."
                  className="pr-10"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              {frameworkSearch && filteredFrameworks.length > 0 && (
                <div className="mt-2 rounded-lg border border-border bg-background max-h-40 overflow-y-auto">
                  {filteredFrameworks.map(([key, schema]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedFramework(key)
                        setFrameworkSearch("")
                        setOpenAccordions(new Set([schema.fields[0]?.key]))
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-card transition-colors ${
                        selectedFramework === key ? 'bg-primary/10 text-primary' : ''
                      }`}
                    >
                      <span className="font-medium">{schema.name}</span>
                      <span className="text-muted-foreground ml-2">- {schema.description}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                {Object.entries(frameworks).slice(0, 5).map(([key, schema]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedFramework(key)
                      setOpenAccordions(new Set([schema.fields[0]?.key]))
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedFramework === key
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border hover:border-primary/50'
                    }`}
                  >
                    {schema.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Real-time Summary */}
            <div className="rounded-xl bg-card p-4 mt-4 sticky bottom-4">
              <p className="font-display text-md font-bold mb-2">Formulated Research Question</p>
              <p className={`text-sm ${formulatedQuestion.includes('→') ? '' : 'italic text-muted-foreground'}`}>
                {formulatedQuestion}
              </p>
            </div>
          </div>
        </div>

        {/* Right Pane - AI Chat */}
        <div className="hidden lg:flex w-1/2 flex-col border-l border-border bg-card">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col gap-6">
              {/* AI Welcome Message (if no messages) */}
              {messages.length === 0 && (
                <div className="flex items-start gap-3 max-w-lg">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="rounded-lg rounded-tl-none bg-muted p-3">
                      <p className="text-sm">
                        Hello! I'm here to help you refine your research question using the {currentFramework?.name || 'PICO'} framework.
                        Tell me about your research topic, and I'll help you identify the key components.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 max-w-lg ${
                    message.role === 'user' ? 'self-end' : ''
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Sparkles className="h-5 w-5" />
                    </div>
                  )}
                  <div className={`flex flex-col gap-2 ${message.role === 'user' ? 'items-end' : ''}`}>
                    <div className={`rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'rounded-tr-none bg-primary text-primary-foreground'
                        : 'rounded-tl-none bg-muted'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                  {message.role === 'user' && (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <span className="text-sm font-medium">You</span>
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-start gap-3 max-w-lg">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="rounded-lg rounded-tl-none bg-muted p-3">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Chat Input */}
          <div className="border-t border-border p-4">
            {/* Suggested Prompts */}
            <div className="flex gap-2 mb-3 flex-wrap">
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setInputMessage(prompt)}
                  className="text-xs text-muted-foreground border border-border rounded-full px-3 py-1 hover:bg-muted transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <div className="relative glassmorphism rounded-lg">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask for suggestions or refinements..."
                disabled={isLoading || !selectedProjectId}
                className="pr-12 bg-transparent border-border"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim() || !selectedProjectId}
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            {!selectedProjectId && (
              <p className="mt-2 text-xs text-muted-foreground">
                Please select a project to start chatting
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
