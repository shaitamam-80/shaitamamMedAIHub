"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Zap,
  Play,
  ExternalLink,
  Filter,
  ChevronDown,
  ChevronRight,
  X,
  Loader2,
  Check,
} from "lucide-react";
// Note: Copy icon removed - now handled by QueryBlockEditor
import { QueryBlockEditor } from "./QueryBlockEditor";
import { cn } from "@/lib/utils";
import type { ToolboxFilter, QueryGenerateResponseV2 } from "@/lib/api";
import type { StrategyType, QuickFilter } from "@/lib/hooks/useQueryBuilder";

// ============================================================================
// Types
// ============================================================================

interface QueryOutputPanelProps {
  // Strategy & Query
  currentStrategy: StrategyType;
  currentQuery: string;
  strategy: QueryGenerateResponseV2["strategies"]["comprehensive"] | undefined;

  // Filters
  addedFilters: string[];
  showMoreFilters: boolean;
  groupedToolbox: Record<string, ToolboxFilter[]>;
  quickFilters: QuickFilter[];

  // UI State
  isSearching: boolean;
  isQueryEmpty: boolean;
  queryLength: number;
  perPage: number;
  sortBy: "relevance" | "date";

  // Actions
  onStrategyChange: (strategy: StrategyType) => void;
  onQueryChange: (query: string) => void;
  onAddFilter: (filter: QuickFilter | ToolboxFilter) => void;
  onRemoveFilter: (filterLabel: string) => void;
  onClearAllFilters: () => void;
  onToggleMoreFilters: () => void;
  onExecute: () => void;
  onOpenPubMed: () => void;
  onCopy: () => void;
  onResetQuery: () => void;
  setPerPage: (value: number) => void;
  setSortBy: (value: "relevance" | "date") => void;

  className?: string;
}

// ============================================================================
// Strategy Tabs
// ============================================================================

interface StrategyTabsProps {
  currentStrategy: StrategyType;
  onStrategyChange: (strategy: StrategyType) => void;
}

function StrategyTabs({ currentStrategy, onStrategyChange }: StrategyTabsProps) {
  const strategies: { key: StrategyType; label: string; description: string }[] = [
    {
      key: "comprehensive",
      label: "Comprehensive",
      description: "High sensitivity - captures most relevant studies",
    },
    {
      key: "direct",
      label: "Focused",
      description: "High precision - fewer but more relevant results",
    },
    {
      key: "clinical",
      label: "Clinical",
      description: "With validated methodological filter",
    },
  ];

  return (
    <div className="flex gap-1 rounded-lg bg-muted p-1">
      {strategies.map((s) => (
        <button
          key={s.key}
          onClick={() => onStrategyChange(s.key)}
          className={cn(
            "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all",
            currentStrategy === s.key
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          title={s.description}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// Quick Filters
// ============================================================================

interface QuickFiltersProps {
  quickFilters: QuickFilter[];
  addedFilters: string[];
  onAddFilter: (filter: QuickFilter) => void;
  onRemoveFilter: (filterLabel: string) => void;
}

function QuickFilters({
  quickFilters,
  addedFilters,
  onAddFilter,
  onRemoveFilter,
}: QuickFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {quickFilters.map((filter) => {
        const isAdded = addedFilters.includes(filter.label);
        return (
          <Badge
            key={filter.label}
            variant={isAdded ? "default" : "outline"}
            className={cn(
              "cursor-pointer transition-all",
              isAdded
                ? "bg-primary text-primary-foreground"
                : "hover:bg-primary/10"
            )}
            onClick={() =>
              isAdded ? onRemoveFilter(filter.label) : onAddFilter(filter)
            }
          >
            {isAdded && <Check className="mr-1 h-3 w-3" />}
            {filter.label}
            {isAdded && <X className="ml-1 h-3 w-3" />}
          </Badge>
        );
      })}
    </div>
  );
}

// ============================================================================
// Toolbox Filters
// ============================================================================

interface ToolboxFiltersProps {
  groupedToolbox: Record<string, ToolboxFilter[]>;
  addedFilters: string[];
  showMoreFilters: boolean;
  onAddFilter: (filter: ToolboxFilter) => void;
  onRemoveFilter: (filterLabel: string) => void;
  onToggleMore: () => void;
}

function ToolboxFilters({
  groupedToolbox,
  addedFilters,
  showMoreFilters,
  onAddFilter,
  onRemoveFilter,
  onToggleMore,
}: ToolboxFiltersProps) {
  const categories = Object.keys(groupedToolbox);

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <button
        onClick={onToggleMore}
        className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        {showMoreFilters ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <Filter className="h-4 w-4" />
        More Filters ({categories.length} categories)
      </button>

      {showMoreFilters && (
        <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
          {categories.map((category) => (
            <div key={category}>
              <div className="mb-1.5 text-xs font-semibold text-muted-foreground">
                {category}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {groupedToolbox[category].map((filter) => {
                  const isAdded = addedFilters.includes(filter.label);
                  return (
                    <Badge
                      key={filter.label}
                      variant={isAdded ? "secondary" : "outline"}
                      className={cn(
                        "cursor-pointer text-xs transition-all",
                        isAdded && "bg-secondary"
                      )}
                      onClick={() =>
                        isAdded
                          ? onRemoveFilter(filter.label)
                          : onAddFilter(filter)
                      }
                      title={filter.description}
                    >
                      {isAdded && <Check className="mr-1 h-2.5 w-2.5" />}
                      {filter.label}
                    </Badge>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function QueryOutputPanel({
  currentStrategy,
  currentQuery,
  strategy,
  addedFilters,
  showMoreFilters,
  groupedToolbox,
  quickFilters,
  isSearching,
  isQueryEmpty,
  queryLength,
  perPage,
  sortBy,
  onStrategyChange,
  onQueryChange,
  onAddFilter,
  onRemoveFilter,
  onClearAllFilters,
  onToggleMoreFilters,
  onExecute,
  onOpenPubMed,
  onCopy,
  onResetQuery,
  setPerPage,
  setSortBy,
  className,
}: QueryOutputPanelProps) {
  return (
    <div className={cn("flex h-full flex-col", className)}>
      <Card className="flex h-full flex-col border-0 shadow-none">
        <CardHeader className="flex-shrink-0 border-b pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-primary" />
              Query Builder
            </CardTitle>
            {strategy && (
              <div className="text-xs text-muted-foreground">
                Expected: {strategy.expected_yield}
              </div>
            )}
          </div>

          {/* Strategy Tabs */}
          <div className="mt-3">
            <StrategyTabs
              currentStrategy={currentStrategy}
              onStrategyChange={onStrategyChange}
            />
          </div>

          {/* Strategy Info */}
          {strategy && (
            <div className="mt-2 rounded-md bg-muted/50 p-2 text-xs">
              <div className="font-medium">{strategy.name}</div>
              <div className="text-muted-foreground">{strategy.purpose}</div>
              {strategy.formula && (
                <div className="mt-1 font-mono text-muted-foreground">
                  Formula: {strategy.formula}
                </div>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="flex flex-1 flex-col overflow-hidden p-4">
          {/* Query Editor */}
          <div className="flex-1 space-y-3">
            {/* Visual Query Block Editor */}
            <QueryBlockEditor
              query={currentQuery}
              onChange={onQueryChange}
              onCopy={onCopy}
              onReset={onResetQuery}
              minHeight="150px"
              placeholder="Type to add terms..."
            />

            {/* Quick Filters */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                Quick Filters
              </div>
              <QuickFilters
                quickFilters={quickFilters}
                addedFilters={addedFilters}
                onAddFilter={onAddFilter}
                onRemoveFilter={onRemoveFilter}
              />
            </div>

            {/* Toolbox Filters */}
            <ToolboxFilters
              groupedToolbox={groupedToolbox}
              addedFilters={addedFilters}
              showMoreFilters={showMoreFilters}
              onAddFilter={onAddFilter}
              onRemoveFilter={onRemoveFilter}
              onToggleMore={onToggleMoreFilters}
            />

            {/* Added Filters Summary */}
            {addedFilters.length > 0 && (
              <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                <span className="text-xs text-muted-foreground">
                  {addedFilters.length} filter(s) applied
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearAllFilters}
                  className="h-6 px-2 text-xs"
                >
                  Clear All
                </Button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-4 space-y-3 border-t pt-4">
            {/* Search Options */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Results:</label>
                <Select
                  value={perPage.toString()}
                  onValueChange={(v) => setPerPage(Number(v))}
                >
                  <SelectTrigger className="h-7 w-16 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Sort:</label>
                <Select value={sortBy} onValueChange={(v: "relevance" | "date") => setSortBy(v)}>
                  <SelectTrigger className="h-7 w-24 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Main Actions */}
            <div className="flex gap-2">
              <Button
                onClick={onExecute}
                disabled={isQueryEmpty || isSearching}
                className="flex-1"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Search PubMed
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={onOpenPubMed}
                disabled={isQueryEmpty}
                title="Open in PubMed"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default QueryOutputPanel;
