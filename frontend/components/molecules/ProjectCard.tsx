"use client";

import { type Project } from "@/lib/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FolderOpen,
  Trash2,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * ProjectCard - A reusable molecule for displaying project information
 *
 * Design System: Clinical Modern
 * Uses semantic colors from design tokens
 *
 * Features:
 * - Hover lift animation
 * - Framework type badge with color coding
 * - Status indicator (ready/in_progress/draft)
 * - Optional delete action
 * - Accessible keyboard navigation
 */

interface ProjectCardProps {
  project: Project;
  /** Callback when delete button is clicked. If undefined, delete button is hidden */
  onDelete?: (project: Project) => void;
  /** Additional CSS classes */
  className?: string;
  /** Show progress/status indicator */
  showStatus?: boolean;
  /** Custom link destination (defaults to /define?project=id) */
  href?: string;
}

/**
 * Get project status based on framework_data completeness
 */
function getProjectStatus(project: Project): "ready" | "in_progress" | "draft" {
  if (!project.framework_data || Object.keys(project.framework_data).length === 0) {
    return "draft";
  }
  if (Object.keys(project.framework_data).length >= 3) {
    return "ready";
  }
  return "in_progress";
}

/**
 * Framework color configuration
 * Maps framework types to their visual styles
 */
const frameworkStyles: Record<string, { bg: string; text: string; border: string }> = {
  PICO: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  SPIDER: {
    bg: "bg-purple-50 dark:bg-purple-950/30",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
  },
  PEO: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  CoCoPop: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
  },
  ECLIPSE: {
    bg: "bg-rose-50 dark:bg-rose-950/30",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
  },
  PICOT: {
    bg: "bg-cyan-50 dark:bg-cyan-950/30",
    text: "text-cyan-700 dark:text-cyan-300",
    border: "border-cyan-200 dark:border-cyan-800",
  },
  DEFAULT: {
    bg: "bg-slate-50 dark:bg-slate-950/30",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-800",
  },
};

/**
 * Status configuration for visual indicators
 */
const statusConfig = {
  ready: {
    icon: CheckCircle2,
    label: "Ready",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  },
  in_progress: {
    icon: Clock,
    label: "In Progress",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  },
  draft: {
    icon: FileText,
    label: "Draft",
    className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  },
};

export function ProjectCard({
  project,
  onDelete,
  className,
  showStatus = true,
  href,
}: ProjectCardProps) {
  const status = getProjectStatus(project);
  const StatusIcon = statusConfig[status].icon;
  const frameworkType = project.framework_type || "PICO";
  const styles = frameworkStyles[frameworkType] || frameworkStyles.DEFAULT;
  const linkHref = href || `/define?project=${project.id}`;

  return (
    <Card
      className={cn(
        // Base styles
        "group relative flex flex-col overflow-hidden",
        // Transition
        "transition-all duration-200 ease-out",
        // Hover effects - Clinical Modern style
        "hover:border-primary/40 hover:shadow-lg hover:-translate-y-1",
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          {/* Icon Container */}
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg border",
              "transition-colors duration-200",
              styles.bg,
              styles.border,
              "group-hover:bg-primary group-hover:border-primary group-hover:text-primary-foreground"
            )}
          >
            <FolderOpen className={cn("h-5 w-5", styles.text, "group-hover:text-inherit")} />
          </div>

          {/* Framework Badge */}
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-semibold",
              styles.bg,
              styles.text,
              styles.border
            )}
          >
            {frameworkType}
          </Badge>
        </div>

        {/* Title */}
        <CardTitle
          className={cn(
            "mt-4 text-lg font-bold leading-tight",
            "line-clamp-1 group-hover:text-primary transition-colors"
          )}
          title={project.name}
        >
          {project.name}
        </CardTitle>

        {/* Description */}
        <CardDescription className="line-clamp-2 min-h-[2.5rem] mt-1 text-sm">
          {project.description || "No description provided"}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pb-2">
        {/* Meta Data Row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {/* Created Date */}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {new Date(project.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          {/* Status Badge */}
          {showStatus && (
            <div
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                statusConfig[status].className
              )}
            >
              <StatusIcon className="h-3 w-3" />
              {statusConfig[status].label}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="gap-2 border-t bg-muted/30 p-4">
        {/* Open Button */}
        <Button
          variant="outline"
          className={cn(
            "flex-1 h-9",
            "bg-background hover:bg-primary hover:text-primary-foreground",
            "transition-colors duration-200"
          )}
          asChild
        >
          <Link href={linkHref} className="group/btn flex items-center justify-center gap-2">
            Open Project
            <ArrowRight
              className={cn(
                "h-3.5 w-3.5",
                "opacity-0 -translate-x-2",
                "group-hover/btn:opacity-100 group-hover/btn:translate-x-0",
                "transition-all duration-200"
              )}
            />
          </Link>
        </Button>

        {/* Delete Button (optional) */}
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-9 w-9",
              "text-muted-foreground",
              "hover:text-destructive hover:bg-destructive/10",
              "transition-colors duration-200"
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(project);
            }}
            aria-label={`Delete project ${project.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
