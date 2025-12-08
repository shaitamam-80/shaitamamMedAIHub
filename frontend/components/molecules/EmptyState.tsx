"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

/**
 * EmptyState - A reusable component for empty/no-data states
 *
 * Design System: Clinical Modern
 * Used when: lists are empty, search returns no results, etc.
 */

interface EmptyStateProps {
  /** Icon to display */
  icon: LucideIcon;
  /** Main title text */
  title: string;
  /** Description text */
  description: string;
  /** Primary action button text */
  actionLabel?: string;
  /** Primary action callback */
  onAction?: () => void;
  /** Secondary action button text */
  secondaryActionLabel?: string;
  /** Secondary action callback */
  onSecondaryAction?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

const sizeConfig = {
  sm: {
    wrapper: "py-8",
    icon: "h-8 w-8",
    iconWrapper: "w-12 h-12",
    title: "text-base",
    description: "text-sm",
  },
  md: {
    wrapper: "py-12",
    icon: "h-10 w-10",
    iconWrapper: "w-16 h-16",
    title: "text-lg",
    description: "text-sm",
  },
  lg: {
    wrapper: "py-16",
    icon: "h-12 w-12",
    iconWrapper: "w-20 h-20",
    title: "text-xl",
    description: "text-base",
  },
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
  size = "md",
}: EmptyStateProps) {
  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        config.wrapper,
        className
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "rounded-full bg-muted flex items-center justify-center mb-4",
          config.iconWrapper
        )}
      >
        <Icon className={cn("text-muted-foreground", config.icon)} />
      </div>

      {/* Title */}
      <h3 className={cn("font-semibold text-foreground mb-1", config.title)}>
        {title}
      </h3>

      {/* Description */}
      <p className={cn("text-muted-foreground max-w-sm mb-6", config.description)}>
        {description}
      </p>

      {/* Actions */}
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex items-center gap-3">
          {actionLabel && onAction && (
            <Button onClick={onAction}>{actionLabel}</Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outline" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
