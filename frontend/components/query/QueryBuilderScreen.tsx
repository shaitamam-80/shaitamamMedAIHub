"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

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

  return (
    <div className="flex flex-col min-h-full">
      {/* Warnings Banner */}
      {queryResult.warnings && queryResult.warnings.length > 0 && (
        <Card className="mx-4 mt-4 rounded-2xl border-2 border-amber-200 bg-amber-50/50 shadow-md dark:bg-amber-950/20 dark:border-amber-800 flex-shrink-0">
          <CardContent className="py-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                {queryResult.warnings.map((w, i) => (
                  <p key={i} className="text-sm text-amber-800 dark:text-amber-300">
                    {w.message}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Page Header with Stepper */}
      <div className="mx-4 mt-4 bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-md border-2 border-gray-100 dark:border-gray-800 flex-shrink-0">
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
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                    step.status === "active" && "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 dark:from-blue-900/40 dark:to-indigo-900/40 dark:text-blue-300",
                    step.status === "completed" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                    step.status === "pending" && "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                  )}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-200",
                      step.status === "active" && "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm",
                      step.status === "completed" && "bg-emerald-500 text-white",
                      step.status === "pending" && "bg-gray-300 text-gray-500 dark:bg-gray-600 dark:text-gray-400"
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

      {/* Split Screen Workspace - Scrollable */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Left Panel: Concept Analysis (2/5) */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border-2 border-gray-100 bg-white shadow-md dark:bg-gray-900 dark:border-gray-800 overflow-hidden">
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
            </div>
          </div>

          {/* Right Panel: Query Builder (3/5) */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border-2 border-gray-100 bg-white shadow-md dark:bg-gray-900 dark:border-gray-800 overflow-hidden">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QueryBuilderScreen;
