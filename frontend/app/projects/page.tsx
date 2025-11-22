"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { projectsApi, type Project } from "@/lib/api"
import { Plus, FolderOpen } from "lucide-react"

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    framework_type: "PICO",
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    const { data } = await projectsApi.list()
    if (data) {
      setProjects(data)
    }
  }

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) return

    setIsLoading(true)
    const { data, error } = await projectsApi.create(newProject)

    if (data) {
      setProjects([data, ...projects])
      setNewProject({ name: "", description: "", framework_type: "PICO" })
      setShowCreateForm(false)
    } else if (error) {
      alert(`Error: ${error}`)
    }

    setIsLoading(false)
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Manage your systematic review projects
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Create Project Form */}
      {showCreateForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
            <CardDescription>
              Start a new systematic literature review project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={newProject.name}
                onChange={(e) =>
                  setNewProject({ ...newProject, name: e.target.value })
                }
                placeholder="e.g., Diabetes Treatment Meta-Analysis"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newProject.description}
                onChange={(e) =>
                  setNewProject({ ...newProject, description: e.target.value })
                }
                placeholder="Brief description of your research project..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="framework">Research Framework</Label>
              <select
                id="framework"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                value={newProject.framework_type}
                onChange={(e) =>
                  setNewProject({ ...newProject, framework_type: e.target.value })
                }
              >
                <option value="PICO">PICO</option>
                <option value="CoCoPop">CoCoPop</option>
                <option value="PEO">PEO</option>
                <option value="SPIDER">SPIDER</option>
                <option value="SPICE">SPICE</option>
                <option value="ECLIPSE">ECLIPSE</option>
                <option value="FINER">FINER</option>
              </select>
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button onClick={handleCreateProject} disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Project"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">No projects yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first project to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <FolderOpen className="h-5 w-5" />
                  </div>
                  {project.framework_type && (
                    <span className="rounded-full bg-secondary px-2 py-1 text-xs font-medium">
                      {project.framework_type}
                    </span>
                  )}
                </div>
                <CardTitle className="mt-4">{project.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {project.description || "No description provided"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-xs text-muted-foreground">
                  Created: {new Date(project.created_at).toLocaleDateString()}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <a href={`/define?project=${project.id}`}>
                    Open Project
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
