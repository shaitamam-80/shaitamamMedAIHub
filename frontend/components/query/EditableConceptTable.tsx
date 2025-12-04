"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Sparkles,
  Database,
  BookOpen,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConceptAnalysisItem, ConceptTerm } from "@/lib/api";

interface EditableConceptTableProps {
  concepts: ConceptAnalysisItem[];
  frameworkType: string;
  onConceptsChange: (concepts: ConceptAnalysisItem[]) => void;
  isLoading?: boolean;
}

const componentColors: Record<string, string> = {
  P: "bg-blue-100 text-blue-800 border-blue-200",
  I: "bg-green-100 text-green-800 border-green-200",
  C: "bg-purple-100 text-purple-800 border-purple-200",
  O: "bg-orange-100 text-orange-800 border-orange-200",
  E: "bg-cyan-100 text-cyan-800 border-cyan-200",
  S: "bg-pink-100 text-pink-800 border-pink-200",
  T: "bg-amber-100 text-amber-800 border-amber-200",
};

const sourceIcons: Record<string, React.ReactNode> = {
  mesh: <Database className="h-3 w-3" />,
  entry_term: <BookOpen className="h-3 w-3" />,
  ai_generated: <Sparkles className="h-3 w-3" />,
  mesh_derived: <Database className="h-3 w-3" />,
  user_added: <User className="h-3 w-3" />,
};

const sourceLabels: Record<string, string> = {
  mesh: "MeSH",
  entry_term: "Entry Term",
  ai_generated: "AI Generated",
  mesh_derived: "MeSH Derived",
  user_added: "User Added",
};

export function EditableConceptTable({
  concepts,
  frameworkType,
  onConceptsChange,
  isLoading = false,
}: EditableConceptTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(
    new Set(concepts.map((c) => c.key)) // Expand all by default
  );
  const [newTermInputs, setNewTermInputs] = useState<Record<string, string>>(
    {}
  );

  const toggleRow = (key: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedRows(newExpanded);
  };

  const toggleTermSelection = (
    conceptKey: string,
    termType: "mesh_terms" | "free_text_terms",
    termIndex: number
  ) => {
    const newConcepts = concepts.map((concept) => {
      if (concept.key === conceptKey) {
        const newTerms = [...concept[termType]];
        newTerms[termIndex] = {
          ...newTerms[termIndex],
          selected: !newTerms[termIndex].selected,
        };
        return { ...concept, [termType]: newTerms };
      }
      return concept;
    });
    onConceptsChange(newConcepts);
  };

  const addUserTerm = (
    conceptKey: string,
    termType: "mesh_terms" | "free_text_terms"
  ) => {
    const inputKey = `${conceptKey}-${termType}`;
    const newTerm = newTermInputs[inputKey]?.trim();
    if (!newTerm) return;

    const newConcepts = concepts.map((concept) => {
      if (concept.key === conceptKey) {
        const newTermObj: ConceptTerm = {
          term: newTerm,
          source: "user_added",
          selected: true,
        };
        return {
          ...concept,
          [termType]: [...concept[termType], newTermObj],
        };
      }
      return concept;
    });

    onConceptsChange(newConcepts);
    setNewTermInputs({ ...newTermInputs, [inputKey]: "" });
  };

  const removeTerm = (
    conceptKey: string,
    termType: "mesh_terms" | "free_text_terms",
    termIndex: number
  ) => {
    const newConcepts = concepts.map((concept) => {
      if (concept.key === conceptKey) {
        const newTerms = concept[termType].filter((_, i) => i !== termIndex);
        return { ...concept, [termType]: newTerms };
      }
      return concept;
    });
    onConceptsChange(newConcepts);
  };

  const getSelectedCount = (terms: ConceptTerm[]) => {
    return terms.filter((t) => t.selected).length;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Concept Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">
              Analyzing concepts...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!concepts || concepts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Concept Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No concepts available. Please complete the Define tool first.
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
          Select or add terms for each concept. Selected terms will be used in
          query generation.
        </p>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead className="w-[100px]">Component</TableHead>
              <TableHead>Original Value</TableHead>
              <TableHead>MeSH Terms</TableHead>
              <TableHead>Free-Text Terms</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {concepts.map((concept) => {
              const isExpanded = expandedRows.has(concept.key);

              return (
                <React.Fragment key={concept.key}>
                  {/* Summary Row */}
                  <TableRow
                    className={cn(
                      "cursor-pointer hover:bg-muted/50",
                      isExpanded && "bg-muted/30"
                    )}
                    onClick={() => toggleRow(concept.key)}
                  >
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
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
                          componentColors[concept.key] ||
                            "bg-gray-100 text-gray-800"
                        )}
                      >
                        {concept.key}
                      </Badge>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {concept.label}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="truncate block text-sm">
                              {concept.original_value}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent
                            side="bottom"
                            className="max-w-[300px]"
                          >
                            {concept.original_value}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {getSelectedCount(concept.mesh_terms)}/
                        {concept.mesh_terms.length} selected
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {getSelectedCount(concept.free_text_terms)}/
                        {concept.free_text_terms.length} selected
                      </span>
                    </TableCell>
                  </TableRow>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <TableRow className="bg-muted/10">
                      <TableCell colSpan={5} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* MeSH Terms */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                              <Database className="h-4 w-4" />
                              MeSH Terms
                            </h4>
                            <div className="space-y-2">
                              {concept.mesh_terms.map((term, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 group"
                                >
                                  <Checkbox
                                    checked={term.selected}
                                    onCheckedChange={() =>
                                      toggleTermSelection(
                                        concept.key,
                                        "mesh_terms",
                                        idx
                                      )
                                    }
                                  />
                                  <Badge
                                    variant={
                                      term.selected ? "default" : "outline"
                                    }
                                    className={cn(
                                      "text-xs font-normal flex items-center gap-1",
                                      !term.selected && "opacity-50"
                                    )}
                                  >
                                    {sourceIcons[term.source]}
                                    {term.term}
                                  </Badge>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="text-xs text-muted-foreground">
                                          ({sourceLabels[term.source]})
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        Source: {sourceLabels[term.source]}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  {term.source === "user_added" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                                      onClick={() =>
                                        removeTerm(
                                          concept.key,
                                          "mesh_terms",
                                          idx
                                        )
                                      }
                                    >
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                            {/* Add new MeSH term */}
                            <div className="flex gap-2 mt-2">
                              <Input
                                placeholder="Add MeSH term..."
                                className="h-8 text-sm"
                                value={
                                  newTermInputs[`${concept.key}-mesh_terms`] ||
                                  ""
                                }
                                onChange={(e) =>
                                  setNewTermInputs({
                                    ...newTermInputs,
                                    [`${concept.key}-mesh_terms`]:
                                      e.target.value,
                                  })
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    addUserTerm(concept.key, "mesh_terms");
                                  }
                                }}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8"
                                onClick={() =>
                                  addUserTerm(concept.key, "mesh_terms")
                                }
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Free-Text Terms */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                              <Sparkles className="h-4 w-4" />
                              Free-Text Terms
                            </h4>
                            <div className="space-y-2">
                              {concept.free_text_terms.map((term, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 group"
                                >
                                  <Checkbox
                                    checked={term.selected}
                                    onCheckedChange={() =>
                                      toggleTermSelection(
                                        concept.key,
                                        "free_text_terms",
                                        idx
                                      )
                                    }
                                  />
                                  <Badge
                                    variant={
                                      term.selected ? "secondary" : "outline"
                                    }
                                    className={cn(
                                      "text-xs font-normal flex items-center gap-1",
                                      !term.selected && "opacity-50"
                                    )}
                                  >
                                    {sourceIcons[term.source]}
                                    {term.term}
                                  </Badge>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="text-xs text-muted-foreground">
                                          ({sourceLabels[term.source]})
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        Source: {sourceLabels[term.source]}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  {term.source === "user_added" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                                      onClick={() =>
                                        removeTerm(
                                          concept.key,
                                          "free_text_terms",
                                          idx
                                        )
                                      }
                                    >
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                            {/* Add new free-text term */}
                            <div className="flex gap-2 mt-2">
                              <Input
                                placeholder="Add free-text term..."
                                className="h-8 text-sm"
                                value={
                                  newTermInputs[
                                    `${concept.key}-free_text_terms`
                                  ] || ""
                                }
                                onChange={(e) =>
                                  setNewTermInputs({
                                    ...newTermInputs,
                                    [`${concept.key}-free_text_terms`]:
                                      e.target.value,
                                  })
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    addUserTerm(concept.key, "free_text_terms");
                                  }
                                }}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8"
                                onClick={() =>
                                  addUserTerm(concept.key, "free_text_terms")
                                }
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
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

export default EditableConceptTable;
