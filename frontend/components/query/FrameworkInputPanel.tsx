"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Save, X, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { InteractiveConceptChips } from "./InteractiveConceptChips";
import type { ConceptAnalysisV2 } from "@/lib/api";

// ============================================================================
// Types
// ============================================================================

interface FrameworkInputPanelProps {
  concepts: ConceptAnalysisV2[];
  isEditMode: boolean;
  expandedEntryTerms: Record<string, boolean>;
  newTermInput: Record<string, string>;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onToggleEntryTerms: (conceptKey: string) => void;
  onRemoveTerm: (conceptKey: string, termType: "mesh" | "text", termValue: string) => void;
  onAddTerm: (conceptKey: string, termType: "mesh" | "text") => void;
  onNewTermInputChange: (key: string, value: string) => void;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function FrameworkInputPanel({
  concepts,
  isEditMode,
  expandedEntryTerms,
  newTermInput,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onToggleEntryTerms,
  onRemoveTerm,
  onAddTerm,
  onNewTermInputChange,
  className,
}: FrameworkInputPanelProps) {
  return (
    <div className={cn("flex h-full flex-col", className)}>
      <Card className="flex h-full flex-col border-0 shadow-none">
        <CardHeader className="flex-shrink-0 border-b pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-primary" />
              Concept Analysis
            </CardTitle>
            <div className="flex items-center gap-2">
              {isEditMode ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCancelEdit}
                    className="h-8"
                  >
                    <X className="mr-1 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onSaveEdit}
                    className="h-8"
                  >
                    <Save className="mr-1 h-4 w-4" />
                    Save
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onStartEdit}
                  className="h-8"
                >
                  <Pencil className="mr-1 h-4 w-4" />
                  Edit Terms
                </Button>
              )}
            </div>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {isEditMode
              ? "Click on chips to remove them, or add new terms below each concept."
              : "Your research concepts with MeSH terms and free-text variations."}
          </p>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4">
          <InteractiveConceptChips
            concepts={concepts}
            isEditMode={isEditMode}
            expandedEntryTerms={expandedEntryTerms}
            newTermInput={newTermInput}
            onToggleEntryTerms={onToggleEntryTerms}
            onRemoveTerm={onRemoveTerm}
            onAddTerm={onAddTerm}
            onNewTermInputChange={onNewTermInputChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default FrameworkInputPanel;
