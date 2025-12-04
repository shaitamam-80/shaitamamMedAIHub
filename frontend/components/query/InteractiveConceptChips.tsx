"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, ChevronDown, ChevronRight, Tag, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConceptAnalysisV2 } from "@/lib/api";

// ============================================================================
// Types
// ============================================================================

export interface ConceptChip {
  id: string;
  term: string;
  type: "mesh" | "freetext" | "entry";
  included: boolean;
  conceptKey: string;
}

interface InteractiveConceptChipsProps {
  concepts: ConceptAnalysisV2[];
  isEditMode: boolean;
  expandedEntryTerms: Record<string, boolean>;
  newTermInput: Record<string, string>;
  onToggleEntryTerms: (conceptKey: string) => void;
  onRemoveTerm: (conceptKey: string, termType: "mesh" | "text", termValue: string) => void;
  onAddTerm: (conceptKey: string, termType: "mesh" | "text") => void;
  onNewTermInputChange: (key: string, value: string) => void;
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getConceptKey(concept: ConceptAnalysisV2): string {
  return concept.key || concept.component_key || "unknown";
}

function getChipVariant(type: "mesh" | "freetext" | "entry"): "default" | "secondary" | "outline" {
  switch (type) {
    case "mesh":
      return "default";
    case "freetext":
      return "secondary";
    case "entry":
      return "outline";
    default:
      return "outline";
  }
}

function getChipIcon(type: "mesh" | "freetext" | "entry") {
  switch (type) {
    case "mesh":
      return <Tag className="h-3 w-3" />;
    case "freetext":
    case "entry":
      return <FileText className="h-3 w-3" />;
    default:
      return null;
  }
}

// ============================================================================
// Sub-Components
// ============================================================================

interface TermChipProps {
  term: string;
  type: "mesh" | "freetext" | "entry";
  isEditMode: boolean;
  onRemove?: () => void;
}

function TermChip({ term, type, isEditMode, onRemove }: TermChipProps) {
  return (
    <Badge
      variant={getChipVariant(type)}
      className={cn(
        "flex items-center gap-1 px-2 py-1 text-xs font-normal transition-all",
        type === "mesh" && "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
        type === "freetext" && "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300",
        type === "entry" && "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300",
        isEditMode && "pr-1"
      )}
    >
      {getChipIcon(type)}
      <span className="max-w-[200px] truncate">{term}</span>
      {isEditMode && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
          aria-label={`Remove ${term}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
}

interface AddTermInputProps {
  inputKey: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onAdd: () => void;
}

function AddTermInput({ inputKey, value, placeholder, onChange, onAdd }: AddTermInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && value.trim()) {
      e.preventDefault();
      onAdd();
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="h-7 w-32 text-xs"
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={onAdd}
        disabled={!value.trim()}
        className="h-7 w-7 p-0"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function InteractiveConceptChips({
  concepts,
  isEditMode,
  expandedEntryTerms,
  newTermInput,
  onToggleEntryTerms,
  onRemoveTerm,
  onAddTerm,
  onNewTermInputChange,
  className,
}: InteractiveConceptChipsProps) {
  if (!concepts || concepts.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No concepts available
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {concepts.map((concept) => {
        const conceptKey = getConceptKey(concept);
        const meshTerms = concept.mesh_terms || [];
        const freeTextTerms = concept.free_text_terms || [];
        const entryTerms = concept.entry_terms || [];
        const isEntryExpanded = expandedEntryTerms[conceptKey] || false;

        return (
          <div
            key={conceptKey}
            className="rounded-lg border bg-card p-3 shadow-sm"
          >
            {/* Concept Header */}
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded bg-primary/10 px-2 py-0.5 text-sm font-semibold text-primary">
                  {conceptKey}
                </span>
                <span className="text-sm text-muted-foreground">
                  {concept.label || concept.original_value || ""}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{meshTerms.length} MeSH</span>
                <span>|</span>
                <span>{freeTextTerms.length} Free-text</span>
                {entryTerms.length > 0 && (
                  <>
                    <span>|</span>
                    <span>{entryTerms.length} Entry</span>
                  </>
                )}
              </div>
            </div>

            {/* MeSH Terms */}
            {(meshTerms.length > 0 || isEditMode) && (
              <div className="mb-2">
                <div className="mb-1 text-xs font-medium text-muted-foreground">
                  MeSH Terms
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {meshTerms.map((term, idx) => (
                    <TermChip
                      key={`mesh-${idx}`}
                      term={term}
                      type="mesh"
                      isEditMode={isEditMode}
                      onRemove={
                        isEditMode
                          ? () => onRemoveTerm(conceptKey, "mesh", term)
                          : undefined
                      }
                    />
                  ))}
                  {isEditMode && (
                    <AddTermInput
                      inputKey={`${conceptKey}_mesh`}
                      value={newTermInput[`${conceptKey}_mesh`] || ""}
                      placeholder="Add MeSH..."
                      onChange={(v) => onNewTermInputChange(`${conceptKey}_mesh`, v)}
                      onAdd={() => onAddTerm(conceptKey, "mesh")}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Free-Text Terms */}
            {(freeTextTerms.length > 0 || isEditMode) && (
              <div className="mb-2">
                <div className="mb-1 text-xs font-medium text-muted-foreground">
                  Free-Text Terms
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {freeTextTerms.map((term, idx) => (
                    <TermChip
                      key={`text-${idx}`}
                      term={term}
                      type="freetext"
                      isEditMode={isEditMode}
                      onRemove={
                        isEditMode
                          ? () => onRemoveTerm(conceptKey, "text", term)
                          : undefined
                      }
                    />
                  ))}
                  {isEditMode && (
                    <AddTermInput
                      inputKey={`${conceptKey}_text`}
                      value={newTermInput[`${conceptKey}_text`] || ""}
                      placeholder="Add term..."
                      onChange={(v) => onNewTermInputChange(`${conceptKey}_text`, v)}
                      onAdd={() => onAddTerm(conceptKey, "text")}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Entry Terms (Collapsible) */}
            {entryTerms.length > 0 && (
              <div>
                <button
                  onClick={() => onToggleEntryTerms(conceptKey)}
                  className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  {isEntryExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  Entry Terms ({entryTerms.length})
                </button>
                {isEntryExpanded && (
                  <div className="flex flex-wrap gap-1.5">
                    {entryTerms.map((term, idx) => (
                      <TermChip
                        key={`entry-${idx}`}
                        term={term}
                        type="entry"
                        isEditMode={isEditMode}
                        onRemove={
                          isEditMode
                            ? () => onRemoveTerm(conceptKey, "text", term)
                            : undefined
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            <Tag className="mr-1 h-3 w-3" />
            MeSH
          </Badge>
          <span>Controlled vocabulary</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            <FileText className="mr-1 h-3 w-3" />
            Free-text
          </Badge>
          <span>Title/Abstract search</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            <FileText className="mr-1 h-3 w-3" />
            Entry
          </Badge>
          <span>MeSH synonyms</span>
        </div>
      </div>
    </div>
  );
}

export default InteractiveConceptChips;
