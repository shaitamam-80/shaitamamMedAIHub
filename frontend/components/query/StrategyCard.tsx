"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Play, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StrategyCardProps {
  name: string;  // "Strategy A: Comprehensive Query (High Sensitivity)"
  purpose: string;  // Description of what this strategy achieves
  formula: string;  // Boolean logic formula shown to user
  query: string;  // The actual PubMed query
  queryNarrow?: string;  // For clinical filtered - narrow variant
  expectedYield: string;  // "1000-5000+ results"
  useCases: string[];  // Array of use cases
  badge: {
    label: string;  // "HIGH RECALL", "HIGH PRECISION", "RCT FOCUSED"
    variant: "emerald" | "blue" | "amber";
  };
  hedgeApplied?: string;  // For clinical filtered
  hedgeCitation?: string;  // Citation for the hedge
  onCopy: (query: string) => void;
  onExecute: (query: string) => void;
  onOpenPubMed: (query: string) => void;
  isExpanded?: boolean;
}

export function StrategyCard({
  name,
  purpose,
  formula,
  query,
  queryNarrow,
  expectedYield,
  useCases,
  badge,
  hedgeApplied,
  hedgeCitation,
  onCopy,
  onExecute,
  onOpenPubMed,
  isExpanded: defaultExpanded = false,
}: StrategyCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);

  const badgeColors = {
    emerald: "bg-emerald-100 text-emerald-800 border-emerald-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    amber: "bg-amber-100 text-amber-800 border-amber-200",
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(query);
    setCopied(true);
    onCopy(query);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenPubMed = () => {
    const encodedQuery = encodeURIComponent(query);
    window.open(`https://pubmed.ncbi.nlm.nih.gov/?term=${encodedQuery}`, "_blank");
    onOpenPubMed(query);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">{name}</CardTitle>
            <CardDescription>{purpose}</CardDescription>
          </div>
          <Badge className={cn("border", badgeColors[badge.variant])}>
            {badge.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Logic Formula */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Logic Formula</p>
          <code className="block bg-muted px-3 py-2 rounded-md text-sm font-mono">
            {formula}
          </code>
        </div>

        {/* Expected Yield */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Expected yield:</span>
          <span className="font-medium">{expectedYield}</span>
        </div>

        {/* Query Preview / Full Query */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Query</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 px-2"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Expand
                </>
              )}
            </Button>
          </div>
          <div
            className={cn(
              "bg-muted rounded-md p-3 font-mono text-xs overflow-auto transition-all",
              isExpanded ? "max-h-96" : "max-h-24"
            )}
          >
            <pre className="whitespace-pre-wrap break-words">{query}</pre>
          </div>
        </div>

        {/* Narrow variant for clinical filter */}
        {queryNarrow && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Narrow Variant (English + Last 10 years)
            </p>
            <div className="bg-muted rounded-md p-3 font-mono text-xs overflow-auto max-h-24">
              <pre className="whitespace-pre-wrap break-words">{queryNarrow}</pre>
            </div>
          </div>
        )}

        {/* Hedge info */}
        {hedgeApplied && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Hedge applied:</span> {hedgeApplied}
            {hedgeCitation && <span> • {hedgeCitation}</span>}
          </div>
        )}

        {/* Use Cases */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Use Cases</p>
          <div className="flex flex-wrap gap-2">
            {useCases.map((useCase, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {useCase}
              </Badge>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex-1 min-w-[100px]"
          >
            <Copy className="h-4 w-4 mr-2" />
            {copied ? "Copied!" : "Copy Query"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenPubMed}
            className="flex-1 min-w-[100px]"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in PubMed
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => onExecute(query)}
            className="flex-1 min-w-[100px]"
          >
            <Play className="h-4 w-4 mr-2" />
            Execute Search
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default StrategyCard;
