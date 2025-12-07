"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Code,
  Blocks,
  X,
  Copy,
  Check,
  AlertTriangle,
  GripVertical,
  Undo2,
  AlignLeft,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  parseQuery,
  serializeTerms,
  addTerm,
  removeTerm,
  getTermColorClass,
  validateQuery,
  type QueryTerm,
} from "@/lib/query-parser";

// ============================================================================
// Formatted Query Display Component
// ============================================================================

interface FormattedQueryDisplayProps {
  query: string;
  className?: string;
}

function FormattedQueryDisplay({ query, className }: FormattedQueryDisplayProps) {
  // Format the query with indentation and syntax highlighting
  const formattedParts = useMemo(() => {
    if (!query.trim()) return [];

    const parts: { text: string; type: "operator" | "mesh" | "text" | "field" | "paren" | "normal" }[] = [];

    // Split by AND/OR operators while preserving them
    const tokens = query.split(/(\bAND\b|\bOR\b|\bNOT\b|\[Mesh\]|\[Majr\]|\[tiab\]|\[Title\/Abstract\]|\[Title\]|\[tw\]|\[pt\]|\[mh\]|\(|\))/gi);

    let indentLevel = 0;
    let currentLine: typeof parts = [];
    const lines: (typeof parts)[] = [];

    tokens.forEach((token) => {
      if (!token) return;

      const trimmed = token.trim();
      if (!trimmed) return;

      const upperToken = trimmed.toUpperCase();

      if (trimmed === "(") {
        if (currentLine.length > 0) {
          lines.push([...currentLine]);
          currentLine = [];
        }
        currentLine.push({ text: "(", type: "paren" });
        lines.push([...currentLine]);
        currentLine = [];
        indentLevel++;
      } else if (trimmed === ")") {
        if (currentLine.length > 0) {
          lines.push([...currentLine]);
          currentLine = [];
        }
        indentLevel = Math.max(0, indentLevel - 1);
        currentLine.push({ text: ")", type: "paren" });
        lines.push([...currentLine]);
        currentLine = [];
      } else if (upperToken === "AND" || upperToken === "OR" || upperToken === "NOT") {
        if (currentLine.length > 0) {
          lines.push([...currentLine]);
          currentLine = [];
        }
        currentLine.push({ text: upperToken, type: "operator" });
      } else if (trimmed.match(/^\[.+\]$/)) {
        currentLine.push({ text: trimmed, type: "field" });
      } else {
        // Check if it's a MeSH term (in quotes or with [Mesh] nearby)
        const isMesh = query.toLowerCase().includes(`${trimmed.toLowerCase()}[mesh]`) ||
                       query.toLowerCase().includes(`${trimmed.toLowerCase()}[majr]`) ||
                       query.toLowerCase().includes(`${trimmed.toLowerCase()}[mh]`);
        currentLine.push({ text: trimmed, type: isMesh ? "mesh" : "normal" });
      }
    });

    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    return lines;
  }, [query]);

  // Simple tokenization for display
  const highlightedQuery = useMemo(() => {
    if (!query.trim()) return null;

    // Regex patterns for different token types
    const patterns = [
      { regex: /\b(AND|OR|NOT)\b/gi, type: "operator" },
      { regex: /\[Mesh\]|\[Majr\]|\[mh\]/gi, type: "mesh-tag" },
      { regex: /\[tiab\]|\[Title\/Abstract\]|\[Title\]|\[tw\]/gi, type: "text-tag" },
      { regex: /\[pt\]|\[la\]|\[dp\]|\[sb\]/gi, type: "filter-tag" },
    ];

    // Split by parentheses and operators for line breaks
    const formatted = query
      .replace(/\(\s*/g, "(\n  ")
      .replace(/\s*\)/g, "\n)")
      .replace(/\s+(AND|OR)\s+/gi, "\n$1 ")
      .split("\n");

    return formatted.map((line, lineIdx) => {
      let result = line;
      const elements: React.ReactNode[] = [];
      let lastIndex = 0;

      // Find all matches
      const matches: { start: number; end: number; text: string; type: string }[] = [];

      patterns.forEach(({ regex, type }) => {
        let match;
        const re = new RegExp(regex.source, regex.flags);
        while ((match = re.exec(line)) !== null) {
          matches.push({
            start: match.index,
            end: match.index + match[0].length,
            text: match[0],
            type,
          });
        }
      });

      // Sort by position
      matches.sort((a, b) => a.start - b.start);

      // Build elements
      matches.forEach((match, i) => {
        // Add text before match
        if (match.start > lastIndex) {
          elements.push(
            <span key={`${lineIdx}-text-${i}`} className="text-gray-800 dark:text-gray-200">
              {line.slice(lastIndex, match.start)}
            </span>
          );
        }

        // Add matched element with styling
        const colorClass = {
          "operator": "font-bold text-purple-600 dark:text-purple-400",
          "mesh-tag": "text-blue-600 dark:text-blue-400 font-medium",
          "text-tag": "text-emerald-600 dark:text-emerald-400 font-medium",
          "filter-tag": "text-amber-600 dark:text-amber-400 font-medium",
        }[match.type] || "";

        elements.push(
          <span key={`${lineIdx}-match-${i}`} className={colorClass}>
            {match.text}
          </span>
        );

        lastIndex = match.end;
      });

      // Add remaining text
      if (lastIndex < line.length) {
        elements.push(
          <span key={`${lineIdx}-end`} className="text-gray-800 dark:text-gray-200">
            {line.slice(lastIndex)}
          </span>
        );
      }

      return (
        <div key={lineIdx} className="whitespace-pre">
          {elements.length > 0 ? elements : line}
        </div>
      );
    });
  }, [query]);

  return (
    <div className={cn("font-mono text-sm leading-relaxed", className)}>
      {highlightedQuery}
    </div>
  );
}

interface QueryBlockEditorProps {
  query: string;
  onChange: (query: string) => void;
  onCopy?: () => void;
  onReset?: () => void;
  className?: string;
  placeholder?: string;
  minHeight?: string;
}

type ViewMode = "formatted" | "raw" | "visual";

export function QueryBlockEditor({
  query,
  onChange,
  onCopy,
  onReset,
  className,
  placeholder = "Type to add terms...",
  minHeight = "200px",
}: QueryBlockEditorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("formatted"); // Default to formatted mode
  const [inputValue, setInputValue] = useState("");
  const [copied, setCopied] = useState(false);

  // Parse query into terms
  const parsedTerms = useMemo(() => parseQuery(query), [query]);

  // Validate query
  const validation = useMemo(() => validateQuery(query), [query]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end - reorder terms
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = parsedTerms.findIndex((t) => t.id === active.id);
        const newIndex = parsedTerms.findIndex((t) => t.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newTerms = arrayMove(parsedTerms, oldIndex, newIndex);
          onChange(serializeTerms(newTerms));
        }
      }
    },
    [parsedTerms, onChange]
  );

  // Handle removing a term
  const handleRemoveTerm = useCallback(
    (index: number) => {
      const newTerms = removeTerm(parsedTerms, index);
      onChange(serializeTerms(newTerms));
    },
    [parsedTerms, onChange]
  );

  // Handle adding a term from input
  const handleAddTerm = useCallback(
    (value: string, type: "mesh" | "text" = "text") => {
      if (!value.trim()) return;

      const newTerms = addTerm(parsedTerms, value.trim(), type);
      onChange(serializeTerms(newTerms));
      setInputValue("");
    },
    [parsedTerms, onChange]
  );

  // Handle key press in input
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && inputValue.trim()) {
        e.preventDefault();
        handleAddTerm(inputValue, "text");
      }
    },
    [inputValue, handleAddTerm]
  );

  // Handle copy
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(query);
    setCopied(true);
    onCopy?.();
    setTimeout(() => setCopied(false), 2000);
  }, [query, onCopy]);

  return (
    <div
      className={cn(
        "rounded-2xl border-2 border-gray-100 bg-white overflow-hidden shadow-md dark:bg-gray-900 dark:border-gray-800",
        className
      )}
    >
      {/* Header with mode toggle */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-900 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Query Editor</span>
          {!validation.isValid && (
            <div className="flex items-center gap-1 text-amber-600">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="text-xs">{validation.warnings.length} warnings</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onReset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-8 px-2"
              title="Reset to original query"
            >
              <Undo2 className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 px-2"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span className="ml-1.5 hidden sm:inline">{copied ? "Copied!" : "Copy"}</span>
          </Button>

          {/* View Mode Segmented Control */}
          <div className="flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800">
            <button
              onClick={() => setViewMode("formatted")}
              className={cn(
                "flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-all",
                viewMode === "formatted"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              )}
              title="Formatted view with syntax highlighting"
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Formatted</span>
            </button>
            <button
              onClick={() => setViewMode("raw")}
              className={cn(
                "flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-all",
                viewMode === "raw"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              )}
              title="Raw text editor"
            >
              <Code className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Raw</span>
            </button>
            <button
              onClick={() => setViewMode("visual")}
              className={cn(
                "flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-all",
                viewMode === "visual"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              )}
              title="Visual block editor"
            >
              <Blocks className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Visual</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === "formatted" ? (
        <div
          className="p-4 overflow-y-auto bg-gray-50/50 dark:bg-gray-800/30"
          style={{ minHeight }}
        >
          {query.trim() ? (
            <FormattedQueryDisplay query={query} />
          ) : (
            <div className="text-muted-foreground text-sm italic">
              No query to display. Switch to Raw mode to start editing.
            </div>
          )}
        </div>
      ) : viewMode === "raw" ? (
        <Textarea
          value={query}
          onChange={(e) => onChange(e.target.value)}
          className="border-0 rounded-none focus-visible:ring-0 resize-y font-mono text-sm"
          style={{ minHeight }}
          placeholder="Enter PubMed query..."
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={parsedTerms.map((t) => t.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div
              className="flex flex-wrap gap-2 p-4 items-start content-start overflow-y-auto"
              style={{ minHeight }}
            >
              {parsedTerms.length === 0 ? (
                <div className="text-muted-foreground text-sm italic">
                  No query terms. Add terms below or switch to Raw mode.
                </div>
              ) : (
                parsedTerms.map((term, index) => (
                  <SortableTermBlock
                    key={term.id}
                    term={term}
                    index={index}
                    onRemove={() => handleRemoveTerm(index)}
                  />
                ))
              )}

              {/* Add term input */}
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 min-w-[150px] bg-transparent outline-none text-sm placeholder:text-muted-foreground py-1.5"
                placeholder={placeholder}
              />
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Footer with char count and warnings */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-gray-50/50 text-xs font-medium text-gray-500 dark:bg-gray-800/50 dark:border-gray-800 dark:text-gray-400">
        <span>{query.length} characters</span>
        {viewMode === "visual" && parsedTerms.length > 0 && (
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">{parsedTerms.filter((t) => t.type !== "operator" && t.type !== "group").length} terms</span>
        )}
        {viewMode === "formatted" && (
          <span className="text-gray-400 dark:text-gray-500">Read-only • Switch to Raw to edit</span>
        )}
      </div>

      {/* Warnings */}
      {!validation.isValid && (
        <div className="px-4 py-2.5 border-t border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900">
          {validation.warnings.map((warning, i) => (
            <p key={i} className="text-xs font-medium text-amber-700 dark:text-amber-400">
              {warning}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Sortable Term Block
// ============================================================================

interface SortableTermBlockProps {
  term: QueryTerm;
  index: number;
  onRemove: () => void;
}

function SortableTermBlock({ term, index, onRemove }: SortableTermBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: term.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : "auto",
  };

  // Render operators and groups differently (not draggable)
  if (term.type === "operator") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
        {term.value}
      </span>
    );
  }

  if (term.type === "group") {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 text-lg font-mono text-slate-400 dark:text-slate-500">
        {term.value}
      </span>
    );
  }

  // Draggable term blocks
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium border-2 shadow-sm cursor-grab active:cursor-grabbing",
        "hover:shadow-md hover:-translate-y-0.5 transition-all duration-200",
        getTermColorClass(term.type),
        isDragging && "ring-2 ring-primary ring-offset-2 shadow-lg"
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-0.5 -ml-1 opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-3 h-3" />
      </button>

      {/* Term value */}
      <span className="max-w-[180px] truncate">{term.value}</span>

      {/* Tag */}
      {term.tag && (
        <span className="text-xs opacity-60 font-mono">{term.tag}</span>
      )}

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="p-0.5 -mr-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        aria-label={`Remove ${term.value}`}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

export default QueryBlockEditor;
