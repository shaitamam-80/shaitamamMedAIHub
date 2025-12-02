"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Copy,
  ExternalLink,
  Play,
  Loader2,
  Zap,
  AlertTriangle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

// Import sub-components
import { ConceptTable } from "./ConceptTable";
import { StrategyCard } from "./StrategyCard";
import { ToolboxAccordion } from "./ToolboxAccordion";

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

// Strategy badge configuration
const strategyBadges: Record<
  StrategyType,
  { label: string; variant: "emerald" | "blue" | "amber" }
> = {
  comprehensive: { label: "HIGH RECALL", variant: "emerald" },
  direct: { label: "HIGH PRECISION", variant: "blue" },
  clinical: { label: "RCT FOCUSED", variant: "amber" },
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
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyType>("comprehensive");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [currentQuery, setCurrentQuery] = useState<string>(
    queryResult.strategies?.comprehensive?.query || ""
  );

  // Update current query when strategy changes
  const handleStrategyChange = (strategy: StrategyType) => {
    setSelectedStrategy(strategy);
    const strategyQuery = queryResult.strategies?.[strategy]?.query;
    if (strategyQuery) {
      // Reset filters and set base query
      setCurrentQuery(strategyQuery);
      setActiveFilters([]);
    }
  };

  // Handle adding filters from toolbox
  const handleAddFilter = (filter: ToolboxFilter) => {
    if (activeFilters.includes(filter.label)) return;
    setActiveFilters([...activeFilters, filter.label]);
    setCurrentQuery((prev) => `${prev} ${filter.query}`);
  };

  // Handle copy
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    onCopyQuery(text, label);
  };

  // Handle execute
  const handleExecute = () => {
    onExecuteSearch(currentQuery);
  };

  return (
    <div className="space-y-6">
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

      {/* Report Introduction */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-yellow-500" />
            {queryResult.report_title || "Search Strategy Report"}
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>
            {queryResult.report_intro || queryResult.message}
          </ReactMarkdown>
        </CardContent>
      </Card>

      {/* Concept Analysis Table */}
      {queryResult.concepts && queryResult.concepts.length > 0 && (
        <ConceptTable
          concepts={queryResult.concepts as ConceptAnalysisV2[]}
          frameworkType={queryResult.framework_type}
          onCopyTerms={(terms) => handleCopy(terms, "Terms")}
        />
      )}

      {/* Three Strategy Cards with Tabs */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Search Strategies</h2>
        <Tabs
          value={selectedStrategy}
          onValueChange={(v) => handleStrategyChange(v as StrategyType)}
        >
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="comprehensive">Comprehensive</TabsTrigger>
            <TabsTrigger value="direct">Direct Comparison</TabsTrigger>
            <TabsTrigger value="clinical">Clinical Filtered</TabsTrigger>
          </TabsList>

          {(["comprehensive", "direct", "clinical"] as StrategyType[]).map(
            (stratKey) => {
              const strategy = queryResult.strategies?.[stratKey];
              if (!strategy) return null;

              return (
                <TabsContent key={stratKey} value={stratKey}>
                  <StrategyCard
                    name={strategy.name}
                    purpose={strategy.purpose}
                    formula={strategy.formula}
                    query={strategy.query}
                    queryNarrow={strategy.query_narrow}
                    expectedYield={strategy.expected_yield}
                    useCases={strategy.use_cases || []}
                    badge={strategyBadges[stratKey]}
                    hedgeApplied={strategy.hedge_applied}
                    hedgeCitation={strategy.hedge_citation}
                    onCopy={(q) => handleCopy(q, "Query")}
                    onExecute={() => handleExecute()}
                    onOpenPubMed={(q) => onOpenPubMed(q)}
                    isExpanded={true}
                  />
                </TabsContent>
              );
            }
          )}
        </Tabs>
      </div>

      {/* Toolbox Accordion */}
      {queryResult.toolbox && queryResult.toolbox.length > 0 && (
        <ToolboxAccordion
          filters={queryResult.toolbox}
          onAddFilter={handleAddFilter}
          onCopyFilter={(q) => handleCopy(q, "Filter")}
          activeFilters={activeFilters}
        />
      )}

      {/* Execute Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Execute Search</CardTitle>
          <CardDescription>
            Review the current query and execute the search
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Query Preview */}
          <div className="space-y-2">
            <Label>Current Query</Label>
            <div className="relative">
              <Textarea
                value={currentQuery}
                onChange={(e) => setCurrentQuery(e.target.value)}
                className="font-mono text-xs min-h-[120px] bg-slate-900 text-slate-100 resize-y"
              />
              <Button
                onClick={() => handleCopy(currentQuery, "Query")}
                size="sm"
                variant="secondary"
                className="absolute right-2 top-2 gap-1"
              >
                <Copy className="h-3 w-3" />
                Copy
              </Button>
            </div>
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-xs text-muted-foreground">Active filters:</span>
                {activeFilters.map((filter, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {filter}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Search Options */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label className="text-xs">Results Per Page</Label>
              <Select
                value={perPage.toString()}
                onValueChange={(v) => setPerPage(parseInt(v))}
              >
                <SelectTrigger className="h-9">
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
            <div className="flex-1">
              <Label className="text-xs">Sort By</Label>
              <Select
                value={sortBy}
                onValueChange={(v) => setSortBy(v as "relevance" | "date")}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleExecute}
              disabled={isSearching || !currentQuery}
              className="flex-1 gap-2"
              size="lg"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Execute Search
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenPubMed(currentQuery)}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open in PubMed
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default QueryBuilderScreen;
