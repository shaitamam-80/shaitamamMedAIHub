"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ScreeningWizard } from "@/components/screening/ScreeningWizard";
import { Loader2 } from "lucide-react";
import apiClient from "@/lib/api";
import type { Project } from "@/lib/api";
import type { ScreeningResult } from "@/types/screening";

function ScreeningContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  const [project, setProject] = useState<Project | null>(null);
  const [pmids, setPmids] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setError("No project ID provided");
      setLoading(false);
      return;
    }

    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const projectData = await apiClient.getProject(projectId);
      setProject(projectData);

      // Load PMIDs from abstracts table (uploaded MEDLINE files or search results)
      try {
        const abstractsData = await apiClient.getAbstracts(projectId);
        const validPmids = abstractsData
          .map((a) => a.pmid)
          .filter((pmid): pmid is string => Boolean(pmid));
        setPmids(validPmids);
      } catch {
        // If no abstracts found, continue with empty PMIDs
        // User can still configure criteria
        setPmids([]);
      }

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project");
      setLoading(false);
    }
  };

  const handleComplete = (result: ScreeningResult) => {
    // Navigate to results page or review screen
    router.push(`/review?projectId=${projectId}`);
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">Error</h2>
          <p className="text-muted-foreground">{error || "Project not found"}</p>
          <button
            onClick={() => router.push("/projects")}
            className="mt-4 text-blue-600 hover:underline"
          >
            Return to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden">
      <ScreeningWizard
        projectId={project.id}
        projectName={project.name}
        frameworkType={project.framework_type || "PICO"}
        frameworkData={project.framework_data || {}}
        pmids={pmids}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </div>
  );
}

export default function ScreeningPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading screening wizard...</p>
          </div>
        </div>
      }
    >
      <ScreeningContent />
    </Suspense>
  );
}
