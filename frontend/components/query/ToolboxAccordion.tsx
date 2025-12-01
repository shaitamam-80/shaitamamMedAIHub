"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Users,
  FileText,
  Calendar,
  Globe,
  Beaker,
  Settings,
  Copy,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolboxFilter {
  category: string;  // "Age Filters", "Article Type", etc.
  label: string;  // "Adults (19+ years)"
  query: string;  // "AND (adult[mh] OR ...)"
  description?: string;
}

interface ToolboxAccordionProps {
  filters: ToolboxFilter[];
  onAddFilter: (filter: ToolboxFilter) => void;
  onCopyFilter: (query: string) => void;
  activeFilters?: string[];  // Labels of currently active filters
}

const categoryIcons: Record<string, React.ReactNode> = {
  "Age Filters": <Users className="h-4 w-4" />,
  "Age": <Users className="h-4 w-4" />,
  "Article Type": <FileText className="h-4 w-4" />,
  "Article Type Filters": <FileText className="h-4 w-4" />,
  "Publication Date": <Calendar className="h-4 w-4" />,
  "Publication Date Filters": <Calendar className="h-4 w-4" />,
  "Language & Availability": <Globe className="h-4 w-4" />,
  "Language": <Globe className="h-4 w-4" />,
  "Study Design": <Beaker className="h-4 w-4" />,
  "Study Design Filters": <Beaker className="h-4 w-4" />,
  "Advanced Search Techniques": <Settings className="h-4 w-4" />,
  "Advanced": <Settings className="h-4 w-4" />,
};

const categoryColors: Record<string, string> = {
  "Age Filters": "border-l-blue-500",
  "Age": "border-l-blue-500",
  "Article Type": "border-l-green-500",
  "Article Type Filters": "border-l-green-500",
  "Publication Date": "border-l-purple-500",
  "Publication Date Filters": "border-l-purple-500",
  "Language & Availability": "border-l-orange-500",
  "Language": "border-l-orange-500",
  "Study Design": "border-l-cyan-500",
  "Study Design Filters": "border-l-cyan-500",
  "Advanced Search Techniques": "border-l-pink-500",
  "Advanced": "border-l-pink-500",
};

export function ToolboxAccordion({
  filters,
  onAddFilter,
  onCopyFilter,
  activeFilters = [],
}: ToolboxAccordionProps) {
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  // Group filters by category
  const groupedFilters = filters.reduce((acc, filter) => {
    const category = filter.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(filter);
    return acc;
  }, {} as Record<string, ToolboxFilter[]>);

  const categories = Object.keys(groupedFilters);

  const handleCopy = async (filter: ToolboxFilter) => {
    await navigator.clipboard.writeText(filter.query);
    setCopiedLabel(filter.label);
    onCopyFilter(filter.query);
    setTimeout(() => setCopiedLabel(null), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Optional Filters Toolbox</CardTitle>
          <Badge variant="outline" className="text-xs">
            {filters.length} filters available
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Click &quot;Add&quot; to append a filter to your current query, or &quot;Copy&quot; to copy the filter syntax.
        </p>
      </CardHeader>

      <CardContent>
        <Accordion type="multiple" className="w-full" defaultValue={[categories[0]]}>
          {categories.map((category) => (
            <AccordionItem
              key={category}
              value={category}
              className={cn("border-l-4", categoryColors[category] || "border-l-gray-300")}
            >
              <AccordionTrigger className="hover:no-underline px-4">
                <div className="flex items-center gap-2">
                  {categoryIcons[category] || <Settings className="h-4 w-4" />}
                  <span>{category}</span>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {groupedFilters[category].length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid gap-2">
                  {groupedFilters[category].map((filter, index) => {
                    const isActive = activeFilters.includes(filter.label);
                    const isCopied = copiedLabel === filter.label;

                    return (
                      <div
                        key={index}
                        className={cn(
                          "flex items-start justify-between p-3 rounded-lg border",
                          isActive
                            ? "bg-primary/5 border-primary/20"
                            : "bg-muted/50 hover:bg-muted"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {filter.label}
                            </span>
                            {isActive && (
                              <Badge variant="default" className="text-xs">
                                Active
                              </Badge>
                            )}
                          </div>
                          {filter.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {filter.description}
                            </p>
                          )}
                          <code className="text-xs font-mono text-muted-foreground block mt-2 truncate max-w-full">
                            {filter.query}
                          </code>
                        </div>
                        <div className="flex gap-1 ml-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => handleCopy(filter)}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            {isCopied ? "Copied!" : "Copy"}
                          </Button>
                          <Button
                            variant={isActive ? "secondary" : "default"}
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => onAddFilter(filter)}
                            disabled={isActive}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {isActive ? "Added" : "Add"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}

export default ToolboxAccordion;
