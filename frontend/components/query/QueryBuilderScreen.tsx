"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Resizable Panels
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

// Types
import type { QueryGenerateResponseV2 } from "@/lib/api";

// Hook
import { useQueryBuilder, QUICK_FILTERS } from "@/lib/hooks/useQueryBuilder";

// Panels
import { FrameworkInputPanel } from "./FrameworkInputPanel";
import { QueryOutputPanel } from "./QueryOutputPanel";

// ============================================================================
// Types
// ============================================================================

interface QueryBuilderScreenProps {
  queryResult: QueryGenerateResponseV2;
  onExecuteSearch: (query: string) => void;
  onOpenPubMed: (query: string) => void;
  onCopyQuery: (query: string, label: string) => void;
  isSearching: boolean;
  perPage: number;
  setPerPage: (value: number) => void;
  sortBy: "relevance" | "date";
  setSortBy: (value: "relevance" | "date") => void;
}

// ============================================================================
// Stepper Configuration
// ============================================================================

const steps = [
  { id: 1, label: "Define Question", status: "completed" as const },
  { id: 2, label: "Expand Terms", status: "completed" as const },
  { id: 3, label: "Build Query", status: "active" as const },
  { id: 4, label: "Execute & Screen", status: "pending" as const },
];

// ============================================================================
// Main Component
// ============================================================================

export function QueryBuilderScreen({
  queryResult,
  onExecuteSearch,
  onOpenPubMed,
  onCopyQuery,
  isSearching,
  perPage,
  setPerPage,
  sortBy,
  setSortBy,
}: QueryBuilderScreenProps) {
  // Use the hook for all state management
  const { state, actions, computed } = useQueryBuilder(queryResult);

  // Destructure for easier access
  const {
    currentStrategy,
    currentQuery,
    addedFilters,
    isEditMode,
    newTermInput,
    expandedEntryTerms,
    showMoreFilters,
  } = state;

  const { strategy, concepts, groupedToolbox, isQueryEmpty, queryLength } = computed;

  // Handle execute
  const handleExecute = () => {
    onExecuteSearch(currentQuery);
  };

  // Check if we're on mobile
  const [isMobileView] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768;
    }
    return false;
  });

  return (
    <div className="flex h-full flex-col">
      {/* Warnings Banner */}
      {queryResult.warnings && queryResult.warnings.length > 0 && (
        <Card className="mx-4 mt-4 border-yellow-200 bg-yellow-50/50 flex-shrink-0">
          <CardContent className="py-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                {queryResult.warnings.map((w, i) => (
                  <p key={i} className="text-sm text-yellow-800">
                    {w.message}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Page Header with Stepper */}
      <div className="mx-4 mt-4 bg-card rounded-xl p-4 shadow-sm border border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">PubMed Query Architect</h1>
            <p className="text-sm text-muted-foreground">
              Build and validate advanced search strategies
            </p>
          </div>

          {/* Mini Stepper */}
          <div className="hidden md:flex items-center gap-1">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
                    step.status === "active" && "bg-primary/10 text-primary",
                    step.status === "completed" && "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400",
                    step.status === "pending" && "bg-muted text-muted-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold",
                      step.status === "active" && "bg-primary text-primary-foreground",
                      step.status === "completed" && "bg-emerald-500 text-white",
                      step.status === "pending" && "bg-muted-foreground/30 text-muted-foreground"
                    )}
                  >
                    {step.status === "completed" ? (
                      <Check className="h-2.5 w-2.5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <span className="hidden lg:inline">{step.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-4 h-px bg-border mx-1" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Split Screen Workspace */}
      <div className="flex-1 overflow-hidden p-4">
        {isMobileView ? (
          // Mobile: Stacked view
          <div className="space-y-4 h-full overflow-y-auto">
            <FrameworkInputPanel
              concepts={concepts}
              isEditMode={isEditMode}
              expandedEntryTerms={expandedEntryTerms}
              newTermInput={newTermInput}
              onStartEdit={actions.startEdit}
              onCancelEdit={actions.cancelEdit}
              onSaveEdit={actions.saveEdit}
              onToggleEntryTerms={actions.toggleEntryTermsExpanded}
              onRemoveTerm={actions.removeTermFromConcept}
              onAddTerm={actions.addNewTerm}
              onNewTermInputChange={actions.setNewTermInput}
              className="min-h-[300px]"
            />
            <QueryOutputPanel
              currentStrategy={currentStrategy}
              currentQuery={currentQuery}
              strategy={strategy}
              addedFilters={addedFilters}
              showMoreFilters={showMoreFilters}
              groupedToolbox={groupedToolbox}
              quickFilters={QUICK_FILTERS}
              isSearching={isSearching}
              isQueryEmpty={isQueryEmpty}
              queryLength={queryLength}
              perPage={perPage}
              sortBy={sortBy}
              onStrategyChange={actions.setStrategy}
              onQueryChange={actions.setCurrentQuery}
              onAddFilter={actions.addFilter}
              onRemoveFilter={actions.removeFilter}
              onClearAllFilters={actions.clearAllFilters}
              onToggleMoreFilters={actions.toggleMoreFilters}
              onExecute={handleExecute}
              onOpenPubMed={() => onOpenPubMed(currentQuery)}
              onCopy={() => onCopyQuery(currentQuery, "Query")}
              onResetQuery={actions.resetToStrategyQuery}
              setPerPage={setPerPage}
              setSortBy={setSortBy}
              className="min-h-[400px]"
            />
          </div>
        ) : (
          // Desktop: Split view with resizable panels
          <ResizablePanelGroup
            direction="horizontal"
            className="h-full rounded-lg border bg-background"
          >
            {/* Left Panel: Concept Analysis */}
            <ResizablePanel defaultSize={40} minSize={25} maxSize={60}>
              <FrameworkInputPanel
                concepts={concepts}
                isEditMode={isEditMode}
                expandedEntryTerms={expandedEntryTerms}
                newTermInput={newTermInput}
                onStartEdit={actions.startEdit}
                onCancelEdit={actions.cancelEdit}
                onSaveEdit={actions.saveEdit}
                onToggleEntryTerms={actions.toggleEntryTermsExpanded}
                onRemoveTerm={actions.removeTermFromConcept}
                onAddTerm={actions.addNewTerm}
                onNewTermInputChange={actions.setNewTermInput}
              />
            </ResizablePanel>

            {/* Resize Handle */}
            <ResizableHandle withHandle />

            {/* Right Panel: Query Builder */}
            <ResizablePanel defaultSize={60} minSize={40} maxSize={75}>
              <QueryOutputPanel
                currentStrategy={currentStrategy}
                currentQuery={currentQuery}
                strategy={strategy}
                addedFilters={addedFilters}
                showMoreFilters={showMoreFilters}
                groupedToolbox={groupedToolbox}
                quickFilters={QUICK_FILTERS}
                isSearching={isSearching}
                isQueryEmpty={isQueryEmpty}
                queryLength={queryLength}
                perPage={perPage}
                sortBy={sortBy}
                onStrategyChange={actions.setStrategy}
                onQueryChange={actions.setCurrentQuery}
                onAddFilter={actions.addFilter}
                onRemoveFilter={actions.removeFilter}
                onClearAllFilters={actions.clearAllFilters}
                onToggleMoreFilters={actions.toggleMoreFilters}
                onExecute={handleExecute}
                onOpenPubMed={() => onOpenPubMed(currentQuery)}
                onCopy={() => onCopyQuery(currentQuery, "Query")}
                onResetQuery={actions.resetToStrategyQuery}
                setPerPage={setPerPage}
                setSortBy={setSortBy}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
}

export default QueryBuilderScreen;
