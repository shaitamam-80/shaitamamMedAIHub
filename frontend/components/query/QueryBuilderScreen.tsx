"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { CompactStepper } from "@/components/ui/process-stepper";

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
// Stepper Configuration (for CompactStepper)
// ============================================================================

const BUILDER_STEPS = [
  { id: 1, label: "Define Question" },
  { id: 2, label: "Expand Terms" },
  { id: 3, label: "Build Query" },
  { id: 4, label: "Execute" },
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

          {/* Mini Stepper - Step 3 is active in Builder view */}
          <CompactStepper
            steps={BUILDER_STEPS}
            currentStep={3}
            className="hidden md:flex"
          />
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
