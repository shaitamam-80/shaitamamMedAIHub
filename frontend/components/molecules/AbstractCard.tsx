"use client";

import { type AbstractResponse } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  StatusBadge,
  type StatusType,
  getStatusBorderClass,
} from "@/components/ui/status-badge";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * AbstractCard - A molecule for displaying research article abstracts
 *
 * Design System: Clinical Modern
 * Uses Serif typography for scientific content (article-content class)
 *
 * Features:
 * - Collapsible abstract text
 * - Status badge with color-coded left border
 * - AI reasoning preview
 * - Decision action buttons
 * - PubMed link
 */

interface AbstractCardProps {
  /** The abstract data */
  abstract: AbstractResponse;
  /** Whether the full abstract is expanded */
  isExpanded: boolean;
  /** Callback to toggle expanded state */
  onToggle: () => void;
  /** Callback when user makes a screening decision */
  onDecision: (id: string, decision: "include" | "exclude" | "maybe") => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show the decision buttons */
  showActions?: boolean;
  /** Whether the card is in a loading/processing state */
  isProcessing?: boolean;
}

export function AbstractCard({
  abstract,
  isExpanded,
  onToggle,
  onDecision,
  className,
  showActions = true,
  isProcessing = false,
}: AbstractCardProps) {
  const status = abstract.status as StatusType;
  const borderClass = getStatusBorderClass(status);

  return (
    <Card
      className={cn(
        // Base styles
        "transition-all duration-300",
        // Left border for status indication
        "border-l-4",
        borderClass,
        // Hover state
        status === "pending" && "hover:border-l-primary/50",
        // Processing state
        isProcessing && "opacity-70 pointer-events-none",
        className
      )}
    >
      <div className="p-5 flex flex-col gap-3">
        {/* Header Row */}
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1 flex-1 min-w-0">
            {/* Status and PMID Row */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <StatusBadge status={status} />
              <span className="text-xs text-muted-foreground font-mono">
                PMID: {abstract.pmid}
              </span>
              {/* PubMed Link */}
              <a
                href={`https://pubmed.ncbi.nlm.nih.gov/${abstract.pmid}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:text-primary/80 inline-flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3" />
                PubMed
              </a>
            </div>

            {/* Title - Serif font for scientific content */}
            <h3 className="font-serif text-lg font-bold leading-tight text-foreground">
              {abstract.title || "No title available"}
            </h3>

            {/* Authors and Journal */}
            <p className="text-sm text-muted-foreground line-clamp-1">
              {abstract.authors && (
                <span>{abstract.authors}</span>
              )}
              {abstract.authors && abstract.journal && " • "}
              {abstract.journal && (
                <span className="italic">{abstract.journal}</span>
              )}
              {abstract.publication_date && (
                <span> ({abstract.publication_date})</span>
              )}
            </p>
          </div>

          {/* Expand/Collapse Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="flex-shrink-0"
            aria-label={isExpanded ? "Collapse abstract" : "Expand abstract"}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* AI Reasoning Preview (when collapsed) */}
        {!isExpanded && abstract.ai_reasoning && (
          <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground mt-2 border border-border/50">
            <span className="font-semibold text-primary/80 text-xs uppercase tracking-wider block mb-1">
              AI Analysis
            </span>
            <p className="line-clamp-2">{abstract.ai_reasoning}</p>
          </div>
        )}

        {/* Expanded Content */}
        {isExpanded && (
          <div className="animate-fade-in space-y-4 mt-2 pt-4 border-t border-dashed">
            {/* Abstract Text - Serif font for readability */}
            {abstract.abstract_text ? (
              <div className="article-content">
                <p className="text-foreground/90">{abstract.abstract_text}</p>
              </div>
            ) : (
              <p className="text-muted-foreground italic">
                No abstract text available
              </p>
            )}

            {/* AI Reasoning (Full) */}
            {abstract.ai_reasoning && (
              <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
                <span className="font-semibold text-primary text-xs uppercase tracking-wider block mb-2">
                  AI Analysis
                </span>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {abstract.ai_reasoning}
                </p>
              </div>
            )}

            {/* Keywords */}
            {abstract.keywords && abstract.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {abstract.keywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}

            {/* User Notes */}
            {abstract.user_notes && (
              <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md border border-amber-200 dark:border-amber-800">
                <span className="font-semibold text-amber-700 dark:text-amber-400 text-xs uppercase tracking-wider block mb-1">
                  Your Notes
                </span>
                <p className="text-sm text-amber-900 dark:text-amber-200">
                  {abstract.user_notes}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            {showActions && (
              <div className="flex gap-2 justify-end pt-2">
                <Button
                  size="sm"
                  variant={status === "exclude" ? "destructive" : "outline"}
                  onClick={() => onDecision(abstract.id, "exclude")}
                  disabled={isProcessing}
                >
                  Exclude
                </Button>
                <Button
                  size="sm"
                  variant={status === "maybe" ? "secondary" : "outline"}
                  className={cn(
                    status !== "maybe" &&
                      "border-amber-200 hover:bg-amber-50 hover:text-amber-700 dark:border-amber-800 dark:hover:bg-amber-950/30"
                  )}
                  onClick={() => onDecision(abstract.id, "maybe")}
                  disabled={isProcessing}
                >
                  Maybe
                </Button>
                <Button
                  size="sm"
                  variant={status === "include" ? "default" : "outline"}
                  className={cn(
                    status === "include"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-800 dark:hover:bg-emerald-950/30"
                  )}
                  onClick={() => onDecision(abstract.id, "include")}
                  disabled={isProcessing}
                >
                  Include
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
