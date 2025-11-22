"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { defineApi, projectsApi, type ChatMessage, type FrameworkSchema } from "@/lib/api"
import { Send, Loader2 } from "lucide-react"

export default function DefinePage() {
  // State
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [projects, setProjects] = useState<any[]>([])
  const [frameworks, setFrameworks] = useState<Record<string, FrameworkSchema>>({})
  const [selectedFramework, setSelectedFramework] = useState<string>("PICO")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [frameworkData, setFrameworkData] = useState<Record<string, string>>({})
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
    const { data } = await projectsApi.list()
    if (data) {
      setProjects(data)
      if (data.length > 0) {
        setSelectedProject(data[0].id)
        loadConversation(data[0].id)
        if (data[0].framework_data) {
          setFrameworkData(data[0].framework_data)
        }
        if (data[0].framework_type) {
          setSelectedFramework(data[0].framework_type)
        }
      }
    }
  }

  const loadFrameworks = async () => {
    const { data } = await defineApi.getFrameworks()
    if (data?.frameworks) {
      setFrameworks(data.frameworks)
    }
  }

  const loadConversation = async (projectId: string) => {
    const { data } = await defineApi.getConversation(projectId)
    if (data?.messages) {
      setMessages(data.messages)
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedProject) return

    setIsLoading(true)
    const userMessage = inputMessage.trim()
    setInputMessage("")

    // Add user message to chat
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])

    // Send to API
    const { data, error } = await defineApi.chat(selectedProject, userMessage, selectedFramework)

    if (data) {
      // Add AI response to chat
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }])

      // Update framework data if extracted
      if (data.extracted_fields) {
        setFrameworkData(data.extracted_fields)
      }
    } else if (error) {
      // Show error message
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${error}` },
      ])
    }

    setIsLoading(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const currentFramework = frameworks[selectedFramework]

  return (
    <div className="flex h-screen">
      {/* Left Side - Dynamic Form */}
      <div className="w-1/2 border-r p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Define Tool</h1>
          <p className="text-muted-foreground">
            Research Question Formulator
          </p>
        </div>

        {/* Project & Framework Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="project">Project</Label>
              <select
                id="project"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                value={selectedProject}
                onChange={(e) => {
                  setSelectedProject(e.target.value)
                  loadConversation(e.target.value)
                }}
              >
                <option value="">Select a project...</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="framework">Research Framework</Label>
              <select
                id="framework"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                value={selectedFramework}
                onChange={(e) => setSelectedFramework(e.target.value)}
              >
                {Object.keys(frameworks).map((key) => (
                  <option key={key} value={key}>
                    {frameworks[key].name} - {frameworks[key].description}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Framework Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {currentFramework?.name || selectedFramework} Framework
            </CardTitle>
            <CardDescription>
              {currentFramework?.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {currentFramework?.fields.map((field) => (
                  <div key={field.key}>
                    <Label htmlFor={field.key}>
                      {field.label}
                    </Label>
                    <p className="mb-2 text-xs text-muted-foreground">
                      {field.description}
                    </p>
                    <Input
                      id={field.key}
                      value={frameworkData[field.key] || ""}
                      onChange={(e) =>
                        setFrameworkData({
                          ...frameworkData,
                          [field.key]: e.target.value,
                        })
                      }
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>

            {Object.keys(frameworkData).length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">
                  Fields are automatically populated as you chat with the AI.
                  You can also edit them manually.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Side - Chat Interface */}
      <div className="flex w-1/2 flex-col">
        <div className="border-b p-6">
          <h2 className="text-2xl font-bold">AI Assistant</h2>
          <p className="text-sm text-muted-foreground">
            Chat with the AI to formulate your research question
          </p>
        </div>

        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {messages.length === 0 && (
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">
                    Start chatting with the AI to formulate your research question.
                    The AI will help you define each component of the {selectedFramework} framework.
                  </p>
                </CardContent>
              </Card>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <Card
                  className={`max-w-[80%] ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <CardContent className="p-4">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </CardContent>
                </Card>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <Card className="bg-muted">
                  <CardContent className="p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </CardContent>
                </Card>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <Separator />

        {/* Chat Input */}
        <div className="p-6">
          <div className="flex space-x-2">
            <Input
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading || !selectedProject}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim() || !selectedProject}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          {!selectedProject && (
            <p className="mt-2 text-xs text-muted-foreground">
              Please select a project to start chatting
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
