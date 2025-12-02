"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  Filter,
  Loader2,
  Play,
  Plus,
  Table,
  Zap,
  FileText,
  Beaker,
  Calendar,
  Globe,
  AlertTriangle,
  Clock,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
import type {
  QueryGenerateResponseV2,
  ToolboxFilter,
  ConceptAnalysisV2,
} from "@/lib/api";

type StrategyType = "comprehensive" | "direct" | "clinical";

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

// Stepper configuration
const steps = [
  { id: 1, label: "Define Question", status: "completed" as const },
  { id: 2, label: "Expand Terms", status: "completed" as const },
  { id: 3, label: "Build Query", status: "active" as const },
  { id: 4, label: "Execute & Screen", status: "pending" as const },
];

// Quick filters - most commonly used
const QUICK_FILTERS = [
  { label: "Humans Only", query: "AND humans[Mesh]", category: "Population" },
  { label: "English", query: "AND English[lang]", category: "Language" },
  { label: "Last 5 Years", query: 'AND ("last 5 years"[dp])', category: "Date" },
  { label: "Adults (19+)", query: 'AND ("adult"[Mesh] OR adult*[tiab])', category: "Age" },
  { label: "RCTs Only", query: 'AND (randomized controlled trial[pt])', category: "Study Design" },
];

// Category icons
const categoryIcons: Record<string, React.ElementType> = {
  "Article Type": FileText,
  "Study Design": Beaker,
  "Date": Calendar,
  "Publication Date": Calendar,
  "Language": Globe,
  "Age": Clock,
  "Population": Users,
};

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
  // Local state
  const [currentStrategy, setCurrentStrategy] = useState<StrategyType>("comprehensive");
  const [currentQuery, setCurrentQuery] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [addedFilters, setAddedFilters] = useState<string[]>([]);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Initialize query from strategy
  useEffect(() => {
    const strategyQuery = queryResult.strategies?.[currentStrategy]?.query || "";
    setCurrentQuery(strategyQuery);
    setAddedFilters([]);
  }, [queryResult, currentStrategy]);

  const strategy = queryResult.strategies?.[currentStrategy];

  // Handle copy
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(currentQuery);
    setCopied(true);
    onCopyQuery(currentQuery, "Query");
    setTimeout(() => setCopied(false), 2000);
  }, [currentQuery, onCopyQuery]);

  // Handle add filter - don't wrap in parentheses, just append
  const handleAddFilter = useCallback((filter: { label: string; query: string }) => {
    if (!addedFilters.includes(filter.label)) {
      // Don't wrap in parentheses - just append the filter
      const newQuery = currentQuery.trim()
        ? `${currentQuery} ${filter.query}`
        : filter.query.replace(/^AND\s+/, '');  // Remove leading AND if first filter
      setCurrentQuery(newQuery);
      setAddedFilters(prev => [...prev, filter.label]);
    }
  }, [currentQuery, addedFilters]);

  // Handle remove filter
  const handleRemoveFilter = useCallback((filterLabel: string) => {
    // Find the filter
    const allFilters = [...QUICK_FILTERS, ...(queryResult.toolbox || [])];
    const filter = allFilters.find(f => f.label === filterLabel);

    if (filter) {
      // Remove the filter from the query
      let newQuery = currentQuery.replace(`${filter.query}`, "");
      // Clean up extra parentheses
      newQuery = newQuery.replace(/\(\(([^)]+)\)\)\s*$/, "($1)");
      newQuery = newQuery.trim();
      setCurrentQuery(newQuery);
      setAddedFilters(prev => prev.filter(f => f !== filterLabel));
    }
  }, [currentQuery, queryResult.toolbox]);

  // Handle strategy change
  const handleStrategyChange = useCallback((key: StrategyType) => {
    setCurrentStrategy(key);
    setCurrentQuery(queryResult.strategies?.[key]?.query || "");
    setAddedFilters([]);
  }, [queryResult.strategies]);

  // Handle execute
  const handleExecute = useCallback(() => {
    onExecuteSearch(currentQuery);
  }, [currentQuery, onExecuteSearch]);

  // Add term to query (from concept table)
  const handleAddTerm = useCallback((term: string, type: "mesh" | "text") => {
    const formattedTerm = type === "mesh"
      ? `"${term}"[Mesh]`
      : `"${term}"[tiab]`;

    // Add to query with OR
    if (currentQuery.trim()) {
      setCurrentQuery(prev => `${prev} OR ${formattedTerm}`);
    } else {
      setCurrentQuery(formattedTerm);
    }
  }, [currentQuery]);

  // Get concepts array (with fallback)
  const concepts = queryResult.concepts || [];
  const toolbox = queryResult.toolbox || [];

  // Group toolbox by category
  const groupedToolbox = toolbox.reduce((acc, item) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, ToolboxFilter[]>);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Warnings Banner */}
      {queryResult.warnings && queryResult.warnings.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/50">
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
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">PubMed Query Architect</h1>
        <p className="text-gray-500 mt-1">
          Build and validate advanced search strategies for systematic literature reviews.
        </p>

        {/* Stepper */}
        <div className="mt-5 flex items-center overflow-x-auto pb-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-shrink-0">
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all",
                  step.status === "active" && "bg-blue-50 text-blue-700",
                  step.status === "completed" && "bg-emerald-50 text-emerald-700",
                  step.status === "pending" && "bg-gray-50 text-gray-400"
                )}
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                    step.status === "active" && "bg-blue-600 text-white",
                    step.status === "completed" && "bg-emerald-500 text-white",
                    step.status === "pending" && "bg-gray-200 text-gray-500"
                  )}
                >
                  {step.status === "completed" ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    step.id
                  )}
                </div>
                <span className="text-xs font-medium whitespace-nowrap">
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-300 mx-2 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Report Summary */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          Search Strategy Report
        </h2>
        <p className="mt-2 text-gray-600 text-sm leading-relaxed">
          {queryResult.report_intro || queryResult.message || (
            <>
              Query strategy generated for{" "}
              <span className="font-semibold text-blue-600">
                {queryResult.framework_type || "PICO"}
              </span>{" "}
              framework using MeSH expansion.
            </>
          )}
        </p>
      </div>

      {/* Concept Analysis Table - Interactive */}
      {concepts.length > 0 && (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-base font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <Table className="w-5 h-5 text-gray-500" />
            Concept Analysis & MeSH Expansion
            <span className="text-xs font-normal text-gray-400 ml-2">
              Click on terms to add them to your query
            </span>
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold text-xs">
                    Concept
                  </th>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold text-xs">
                    Original Term
                  </th>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold text-xs">
                    MeSH Descriptors
                  </th>
                  <th className="px-4 py-3 text-left text-gray-600 font-semibold text-xs">
                    Free-Text Terms / Synonyms
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {concepts.map((c: ConceptAnalysisV2, idx: number) => {
                  const key = c.key || c.component_key || String(idx + 1);
                  const label = c.label || c.component || "";
                  const originalValue = c.original_value || c.concept || "";
                  const meshTerms = c.mesh_terms || [];
                  const freeTextTerms = c.free_text_terms || [];
                  const entryTerms = c.entry_terms || [];

                  // Combine free text and entry terms
                  const allTextTerms = [...new Set([...freeTextTerms, ...entryTerms])];

                  return (
                    <tr key={key} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                            {key}
                          </span>
                          <span className="text-gray-500 text-xs">{label}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-xs max-w-xs">
                        <button
                          onClick={() => handleAddTerm(originalValue, "text")}
                          className="hover:bg-blue-100 hover:text-blue-700 px-2 py-1 rounded transition-colors cursor-pointer text-left"
                          title="Click to add to query"
                        >
                          {originalValue}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {meshTerms.length > 0 ? (
                            meshTerms.map((term, i) => (
                              <button
                                key={i}
                                onClick={() => handleAddTerm(term, "mesh")}
                                className="text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded text-xs font-mono cursor-pointer transition-colors border border-blue-200"
                                title={`Click to add "${term}"[Mesh] to query`}
                              >
                                {term}
                              </button>
                            ))
                          ) : (
                            <span className="text-gray-400 text-xs italic">
                              No MeSH match found
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {allTextTerms.length > 0 ? (
                            allTextTerms.slice(0, 5).map((term, i) => (
                              <button
                                key={i}
                                onClick={() => handleAddTerm(term, "text")}
                                className="text-gray-600 bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded text-xs cursor-pointer transition-colors"
                                title={`Click to add "${term}"[tiab] to query`}
                              >
                                {term}
                              </button>
                            ))
                          ) : (
                            <span className="text-gray-400 text-xs italic">—</span>
                          )}
                          {allTextTerms.length > 5 && (
                            <span className="text-gray-400 text-xs">
                              +{allTextTerms.length - 5} more
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Strategy Tabs */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-gray-800">
          Proposed Search Strategies
        </h3>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { key: "comprehensive" as const, label: "Comprehensive (Split/OR)" },
            { key: "direct" as const, label: "Direct Comparison (AND)" },
            { key: "clinical" as const, label: "Clinical Filtered" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleStrategyChange(tab.key)}
              className={cn(
                "py-2 px-3 rounded-md text-sm font-medium transition-all whitespace-nowrap",
                currentStrategy === tab.key
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Strategy Content */}
        {strategy && (
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <h4 className="text-base font-bold text-gray-800">{strategy.name}</h4>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                Expected: {strategy.expected_yield}
              </span>
            </div>
            <p className="text-gray-600 text-sm">
              <strong>Purpose:</strong> {strategy.purpose}
            </p>

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <strong className="block mb-1 text-blue-700 text-xs">
                Logical Formula:
              </strong>
              <code className="text-gray-700 text-sm font-mono">{strategy.formula}</code>
            </div>

            {strategy.hedge_applied && (
              <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg text-sm text-indigo-800 flex items-start gap-2">
                <Zap className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-600" />
                <div>
                  <strong>Applied Hedge:</strong> {strategy.hedge_applied}
                  {strategy.hedge_citation && (
                    <p className="text-xs mt-0.5 opacity-75">{strategy.hedge_citation}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Execute Search Section - Full Width */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Play className="w-4 h-4 text-blue-600" />
          Execute Search
        </h3>

        {/* Quick Filters - Horizontal Toolbar */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-500">Quick Filters:</span>
            {QUICK_FILTERS.map((filter, idx) => {
              const isAdded = addedFilters.includes(filter.label);
              return (
                <button
                  key={idx}
                  onClick={() => isAdded ? handleRemoveFilter(filter.label) : handleAddFilter(filter)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5",
                    isAdded
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {isAdded && <Check className="w-3 h-3" />}
                  {filter.label}
                  {isAdded && <X className="w-3 h-3 hover:text-red-200" />}
                </button>
              );
            })}

            {/* More Filters Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowMoreFilters(!showMoreFilters)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5",
                  showMoreFilters
                    ? "bg-gray-700 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                <Filter className="w-3 h-3" />
                More Filters
                <ChevronDown className={cn("w-3 h-3 transition-transform", showMoreFilters && "rotate-180")} />
              </button>

              {/* Dropdown Panel */}
              {showMoreFilters && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 p-4 max-h-80 overflow-y-auto">
                  {Object.entries(groupedToolbox).map(([category, filters]) => {
                    const IconComponent = categoryIcons[category] || Filter;
                    return (
                      <div key={category} className="mb-4 last:mb-0">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-2">
                          <IconComponent className="w-3.5 h-3.5" />
                          {category}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {filters.map((filter, idx) => {
                            const isAdded = addedFilters.includes(filter.label);
                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  if (isAdded) {
                                    handleRemoveFilter(filter.label);
                                  } else {
                                    handleAddFilter(filter);
                                  }
                                }}
                                className={cn(
                                  "px-2 py-1 rounded text-xs transition-all flex items-center gap-1",
                                  isAdded
                                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                    : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                                )}
                              >
                                {isAdded && <Check className="w-3 h-3" />}
                                {filter.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          {addedFilters.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500">Active:</span>
              {addedFilters.map((f, i) => (
                <span
                  key={i}
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1"
                >
                  {f}
                  <button
                    onClick={() => handleRemoveFilter(f)}
                    className="hover:text-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button
                onClick={() => {
                  setCurrentQuery(queryResult.strategies?.[currentStrategy]?.query || "");
                  setAddedFilters([]);
                }}
                className="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Query Textarea - Live and Editable */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Current Query
            <span className="text-xs font-normal text-gray-400 ml-2">
              (editable - modify directly or use filters above)
            </span>
          </Label>
          <div className="relative">
            <textarea
              value={currentQuery}
              onChange={(e) => setCurrentQuery(e.target.value)}
              placeholder="Your PubMed query will appear here. Select filters or type directly..."
              className="w-full p-4 rounded-lg bg-gray-900 text-gray-100 font-mono text-sm h-36 resize-y border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
              spellCheck={false}
            />
            <button
              onClick={handleCopy}
              className={cn(
                "absolute top-3 right-3 p-2 rounded-md transition-all",
                copied
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
              )}
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
            {copied && (
              <span className="absolute top-3 right-14 bg-emerald-500 text-white text-xs px-2 py-1 rounded">
                Copied!
              </span>
            )}
          </div>
        </div>

        {/* Search Options */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <Label className="text-sm font-medium text-gray-700">Results per Page</Label>
            <select
              value={perPage}
              onChange={(e) => setPerPage(parseInt(e.target.value))}
              className="w-full mt-1 p-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 text-sm"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Sort By</Label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "relevance" | "date")}
              className="w-full mt-1 p-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 text-sm"
            >
              <option value="relevance">Relevance</option>
              <option value="date">Publication Date</option>
            </select>
          </div>
          <div className="col-span-2 flex items-end gap-3">
            <button
              onClick={handleExecute}
              disabled={isSearching || !currentQuery.trim()}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Execute Search
                </>
              )}
            </button>
            <button
              onClick={() => onOpenPubMed(currentQuery)}
              disabled={!currentQuery.trim()}
              className="bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-all flex items-center gap-2 border border-gray-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ExternalLink className="w-4 h-4" />
              PubMed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QueryBuilderScreen;
