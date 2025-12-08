"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { apiClient, type Project } from "@/lib/api";
import { ProjectCard } from "@/components/molecules/ProjectCard";
import { EmptyState } from "@/components/molecules/EmptyState";
import { AlertTriangle, FolderOpen, Plus } from "lucide-react";
import { useEffect, useState } from "react";

export default function ProjectsPage() {
  const { loading: authLoading, user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    framework_type: "PICO",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Delete State
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      loadProjects();
    }
  }, [authLoading, user]);

  const loadProjects = async () => {
    try {
      const data = await apiClient.getProjects();
      setProjects(data);
    } catch (error) {
      console.error("Failed to load projects:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load projects",
      });
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) return;

    setIsLoading(true);
    try {
      const data = (await apiClient.createProject(newProject)) as Project;
      setProjects([data, ...projects]);
      setNewProject({ name: "", description: "", framework_type: "PICO" });
      setShowCreateForm(false);
      toast({
        title: "Success",
        description: "Project created successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create project",
      });
    }
    setIsLoading(false);
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    if (deleteConfirmation !== "DELETE") return;

    setIsDeleting(true);
    try {
      await apiClient.deleteProject(projectToDelete.id);
      setProjects(projects.filter((p) => p.id !== projectToDelete.id));
      setProjectToDelete(null);
      setDeleteConfirmation("");
      toast({
        title: "Project Deleted",
        description:
          "The project and all its data have been permanently removed.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Could not delete the project. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12">
      {/* Page Header */}
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
        <Card className="mb-8 border-primary/20 bg-primary/5">
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
                className="bg-background"
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
                className="bg-background"
              />
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button onClick={handleCreateProject} disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Project"}
            </Button>
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Projects Grid - Using ProjectCard molecule */}
      {projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent>
            <EmptyState
              icon={FolderOpen}
              title="No projects yet"
              description="Create your first project to start your systematic review journey"
              actionLabel="Create Project"
              onAction={() => setShowCreateForm(true)}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={(p) => {
                setProjectToDelete(p);
                setDeleteConfirmation("");
              }}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!projectToDelete}
        onOpenChange={(open) => !open && setProjectToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Project?
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              project
              <span className="font-bold text-foreground">
                {" "}
                &ldquo;{projectToDelete?.name}&rdquo;{" "}
              </span>
              and all associated data, including:
              <ul className="list-disc list-inside mt-2 mb-2">
                <li>Chat history and extracted frameworks</li>
                <li>Generated search queries</li>
                <li>Uploaded files and screened abstracts</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label
              htmlFor="confirm-delete"
              className="mb-2 block text-sm font-medium"
            >
              Type{" "}
              <span className="font-mono font-bold text-destructive">
                DELETE
              </span>{" "}
              to confirm:
            </Label>
            <Input
              id="confirm-delete"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="DELETE"
              className="border-destructive/50 focus-visible:ring-destructive"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setProjectToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProject}
              disabled={deleteConfirmation !== "DELETE" || isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
