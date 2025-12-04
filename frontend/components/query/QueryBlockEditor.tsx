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

interface QueryBlockEditorProps {
  query: string;
  onChange: (query: string) => void;
  onCopy?: () => void;
  onReset?: () => void;
  className?: string;
  placeholder?: string;
  minHeight?: string;
}

export function QueryBlockEditor({
  query,
  onChange,
  onCopy,
  onReset,
  className,
  placeholder = "Type to add terms...",
  minHeight = "200px",
}: QueryBlockEditorProps) {
  const [isRawMode, setIsRawMode] = useState(false); // Default to visual mode
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
        "rounded-xl border border-border bg-card overflow-hidden shadow-sm",
        className
      )}
    >
      {/* Header with mode toggle */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsRawMode(!isRawMode)}
            className="h-8 px-2"
          >
            {isRawMode ? (
              <Blocks className="w-4 h-4 mr-1.5" />
            ) : (
              <Code className="w-4 h-4 mr-1.5" />
            )}
            <span className="hidden sm:inline">{isRawMode ? "Visual" : "Raw"}</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      {isRawMode ? (
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
      <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/20 text-xs text-muted-foreground">
        <span>{query.length} characters</span>
        {!isRawMode && parsedTerms.length > 0 && (
          <span>{parsedTerms.filter((t) => t.type !== "operator" && t.type !== "group").length} terms</span>
        )}
      </div>

      {/* Warnings */}
      {!validation.isValid && (
        <div className="px-4 py-2 border-t bg-amber-50/50 dark:bg-amber-950/20">
          {validation.warnings.map((warning, i) => (
            <p key={i} className="text-xs text-amber-700 dark:text-amber-400">
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
        "inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm font-medium border shadow-sm cursor-grab active:cursor-grabbing",
        getTermColorClass(term.type),
        isDragging && "ring-2 ring-primary ring-offset-2"
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
