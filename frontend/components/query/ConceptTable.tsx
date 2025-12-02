"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Copy, ChevronDown, ChevronUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";

// Interface matching backend ConceptBlock.to_dict() output
interface ConceptAnalysis {
  // Backend field names
  key: string;                    // "P", "I", "C", "O"
  label: string;                  // "Population", "Intervention"
  original_value: string;         // User's input value
  concept_number: number;         // 1, 2, 3, 4
  component: string;              // Same as label
  mesh_terms: string[];
  free_text_terms: string[];
  entry_terms?: string[];

  // Legacy support for V2 frontend types
  concept?: string;               // Alias for original_value
  component_key?: string;         // Alias for key
  mesh_queries?: {
    broad?: string;
    focused?: string;
    no_explosion?: string;
  };
}

interface ConceptTableProps {
  concepts: ConceptAnalysis[];
  frameworkType: string;
  onCopyTerms: (terms: string) => void;
}

const componentColors: Record<string, string> = {
  P: "bg-blue-100 text-blue-800 border-blue-200",
  I: "bg-green-100 text-green-800 border-green-200",
  C: "bg-purple-100 text-purple-800 border-purple-200",
  O: "bg-orange-100 text-orange-800 border-orange-200",
  E: "bg-cyan-100 text-cyan-800 border-cyan-200",
  S: "bg-pink-100 text-pink-800 border-pink-200",
  T: "bg-amber-100 text-amber-800 border-amber-200",
  Co: "bg-violet-100 text-violet-800 border-violet-200",
};

const componentLabels: Record<string, string> = {
  P: "Population",
  I: "Intervention",
  C: "Comparator",
  O: "Outcome",
  E: "Exposure",
  S: "Study Design",
  T: "Time",
  Co: "Context",
  Ph: "Phenomenon",
  F: "Factor",
};

export function ConceptTable({
  concepts,
  frameworkType,
  onCopyTerms,
}: ConceptTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [copiedCell, setCopiedCell] = useState<string | null>(null);

  const toggleRow = (key: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedRows(newExpanded);
  };

  const handleCopy = async (text: string, cellId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedCell(cellId);
    onCopyTerms(text);
    setTimeout(() => setCopiedCell(null), 2000);
  };

  const formatTermsForDisplay = (terms: string[], limit: number = 3) => {
    if (terms.length <= limit) {
      return terms.join(", ");
    }
    return `${terms.slice(0, limit).join(", ")} +${terms.length - limit} more`;
  };

  const formatTermsForCopy = (terms: string[]) => {
    return terms.join(" OR ");
  };

  // Helper function to get the component key (supports both backend and legacy field names)
  const getComponentKey = (c: ConceptAnalysis): string => {
    return c.key || c.component_key || "?";
  };

  // Helper function to get the concept description
  const getConceptDescription = (c: ConceptAnalysis): string => {
    return c.original_value || c.concept || c.component || "";
  };

  if (!concepts || concepts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Concept Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No concept analysis available. Generate a query to see the breakdown.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Concept Analysis Table</CardTitle>
          <Badge variant="outline">{frameworkType} Framework</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Breakdown of search concepts with free-text and MeSH terms
        </p>
      </CardHeader>

      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead className="w-[100px]">Component</TableHead>
              <TableHead>Concept Description</TableHead>
              <TableHead>Free-Text Terms</TableHead>
              <TableHead>MeSH Terms</TableHead>
              <TableHead className="w-[60px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {concepts.map((concept, index) => {
              const componentKey = getComponentKey(concept);
              const conceptDescription = getConceptDescription(concept);
              const isExpanded = expandedRows.has(componentKey);
              const rowKey = `${componentKey}-${index}`;

              return (
                <React.Fragment key={rowKey}>
                  <TableRow
                    className={cn(
                      "cursor-pointer hover:bg-muted/50",
                      isExpanded && "bg-muted/30"
                    )}
                  >
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => toggleRow(componentKey)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "font-semibold",
                          componentColors[componentKey] ||
                            "bg-gray-100 text-gray-800"
                        )}
                      >
                        {componentKey}
                      </Badge>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {componentLabels[componentKey] || concept.label || ""}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="truncate block">{conceptDescription}</span>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-[300px]">
                            {conceptDescription}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {formatTermsForDisplay(concept.free_text_terms)}
                      </code>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {formatTermsForDisplay(concept.mesh_terms)}
                      </code>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                const allTerms = [
                                  ...concept.free_text_terms,
                                  ...concept.mesh_terms,
                                ];
                                handleCopy(
                                  formatTermsForCopy(allTerms),
                                  `copy-${rowKey}`
                                );
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {copiedCell === `copy-${rowKey}`
                              ? "Copied!"
                              : "Copy all terms"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>

                  {/* Expanded Row */}
                  {isExpanded && (
                    <TableRow className="bg-muted/20">
                      <TableCell colSpan={6} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Free-Text Terms */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold flex items-center gap-1">
                                Free-Text Terms
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Info className="h-3 w-3 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Terms searched in title/abstract fields
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() =>
                                  handleCopy(
                                    formatTermsForCopy(concept.free_text_terms),
                                    `free-${rowKey}`
                                  )
                                }
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                {copiedCell === `free-${rowKey}` ? "Copied!" : "Copy"}
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {concept.free_text_terms.map((term, i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="text-xs font-mono"
                                >
                                  {term}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* MeSH Terms */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold flex items-center gap-1">
                                MeSH Terms
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Info className="h-3 w-3 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Controlled vocabulary (Medical Subject Headings)
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() =>
                                  handleCopy(
                                    formatTermsForCopy(concept.mesh_terms),
                                    `mesh-${rowKey}`
                                  )
                                }
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                {copiedCell === `mesh-${rowKey}` ? "Copied!" : "Copy"}
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {concept.mesh_terms.map((term, i) => (
                                <Badge
                                  key={i}
                                  variant="secondary"
                                  className="text-xs font-mono"
                                >
                                  {term}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* MeSH Query Variations */}
                          {concept.mesh_queries && (
                            <div className="md:col-span-2 space-y-2 pt-2 border-t">
                              <h4 className="text-sm font-semibold">MeSH Query Variations</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                {concept.mesh_queries.broad && (
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Broad (with explosion)</p>
                                    <code className="text-xs bg-muted p-2 rounded block overflow-x-auto">
                                      {concept.mesh_queries.broad}
                                    </code>
                                  </div>
                                )}
                                {concept.mesh_queries.focused && (
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Focused (majr)</p>
                                    <code className="text-xs bg-muted p-2 rounded block overflow-x-auto">
                                      {concept.mesh_queries.focused}
                                    </code>
                                  </div>
                                )}
                                {concept.mesh_queries.no_explosion && (
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">No Explosion</p>
                                    <code className="text-xs bg-muted p-2 rounded block overflow-x-auto">
                                      {concept.mesh_queries.no_explosion}
                                    </code>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default ConceptTable;
