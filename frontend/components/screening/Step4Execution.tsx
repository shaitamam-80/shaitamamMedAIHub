"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Play,
  Download,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScreeningResult } from "@/types/screening";

interface Step4ExecutionProps {
  isRunning: boolean;
  progress: number;
  total: number;
  logs: LogEntry[];
  result?: ScreeningResult;
  onStart: () => void;
  onExport?: () => void;
  onViewResults?: () => void;
}

export interface LogEntry {
  timestamp: string;
  level: "info" | "success" | "warning" | "error";
  message: string;
}

export function Step4Execution({
  isRunning,
  progress,
  total,
  logs,
  result,
  onStart,
  onExport,
  onViewResults,
}: Step4ExecutionProps) {
  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;
  const isComplete = result !== undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Run Screening Pipeline
        </h2>
        <p className="text-muted-foreground">
          Process articles through rule engine and AI model
        </p>
      </div>

      {/* Progress Card */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isRunning && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
            {isComplete && !isRunning && (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            )}
            {!isRunning && !isComplete && (
              <Play className="h-5 w-5 text-gray-400" />
            )}
            Screening Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {isComplete
                  ? "Complete"
                  : isRunning
                  ? "Processing..."
                  : "Ready to start"}
              </span>
              <span className="font-medium">
                {progress} / {total} articles
              </span>
            </div>
            <Progress value={percentage} className="h-2" />
            <div className="text-right text-xs text-muted-foreground">
              {percentage}%
            </div>
          </div>

          {/* Start Button */}
          {!isRunning && !isComplete && (
            <Button
              onClick={onStart}
              size="lg"
              className="w-full"
              disabled={total === 0}
            >
              <Play className="mr-2 h-5 w-5" />
              Start Screening
            </Button>
          )}

          {/* Result Summary */}
          {isComplete && result && (
            <div className="grid gap-3 md:grid-cols-3">
              <StatCard
                icon={CheckCircle2}
                label="Included"
                value={result.included}
                color="emerald"
              />
              <StatCard
                icon={XCircle}
                label="Excluded"
                value={result.excluded}
                color="red"
              />
              <StatCard
                icon={AlertCircle}
                label="Unclear"
                value={result.details.filter((d) => d.status === "unclear").length}
                color="amber"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Console Log */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Screening Console</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-80 w-full rounded-md border bg-gray-950 p-4">
            <div className="space-y-2 font-mono text-sm">
              {logs.length === 0 ? (
                <p className="text-gray-500">
                  Waiting to start screening process...
                </p>
              ) : (
                logs.map((log, idx) => (
                  <LogLine key={idx} log={log} />
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {isComplete && (
        <div className="flex gap-3">
          {onViewResults && (
            <Button
              onClick={onViewResults}
              size="lg"
              className="flex-1"
            >
              <ExternalLink className="mr-2 h-5 w-5" />
              View Results
            </Button>
          )}
          {onExport && (
            <Button
              onClick={onExport}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              <Download className="mr-2 h-5 w-5" />
              Export Report
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Stat Card Component
// ============================================================================

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: "emerald" | "red" | "amber";
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-950/20",
      border: "border-emerald-200 dark:border-emerald-800",
      icon: "text-emerald-600",
      text: "text-emerald-900 dark:text-emerald-300",
    },
    red: {
      bg: "bg-red-50 dark:bg-red-950/20",
      border: "border-red-200 dark:border-red-800",
      icon: "text-red-600",
      text: "text-red-900 dark:text-red-300",
    },
    amber: {
      bg: "bg-amber-50 dark:bg-amber-950/20",
      border: "border-amber-200 dark:border-amber-800",
      icon: "text-amber-600",
      text: "text-amber-900 dark:text-amber-300",
    },
  };

  const classes = colorClasses[color];

  return (
    <Card className={cn("border-2", classes.border, classes.bg)}>
      <CardContent className="flex items-center gap-3 p-4">
        <Icon className={cn("h-8 w-8", classes.icon)} />
        <div>
          <p className={cn("text-2xl font-bold", classes.text)}>{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Log Line Component
// ============================================================================

function LogLine({ log }: { log: LogEntry }) {
  const levelColors = {
    info: "text-gray-400",
    success: "text-emerald-400",
    warning: "text-amber-400",
    error: "text-red-400",
  };

  const levelIcons = {
    info: "ℹ",
    success: "✓",
    warning: "⚠",
    error: "✗",
  };

  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-600 text-xs mt-0.5">
        {log.timestamp}
      </span>
      <span className={cn("font-bold", levelColors[log.level])}>
        {levelIcons[log.level]}
      </span>
      <span className={levelColors[log.level]}>{log.message}</span>
    </div>
  );
}
