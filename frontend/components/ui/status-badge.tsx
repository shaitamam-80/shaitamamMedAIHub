import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, HelpCircle, Clock, Loader2 } from "lucide-react";

/**
 * StatusBadge - Atom component for displaying screening/review status
 *
 * Design System: Clinical Modern
 * Uses status colors from design tokens
 *
 * Usage:
 * <StatusBadge status="include" />
 * <StatusBadge status="exclude" showIcon={false} />
 */

export type StatusType = "include" | "exclude" | "maybe" | "pending" | "analyzing";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  /** Whether to show the status icon (default: true) */
  showIcon?: boolean;
  /** Size variant */
  size?: "sm" | "md";
}

const statusConfig: Record<
  StatusType,
  {
    label: string;
    icon: typeof CheckCircle;
    styles: string;
    iconAnimation?: string;
  }
> = {
  include: {
    label: "Included",
    icon: CheckCircle,
    styles: cn(
      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
      "border-emerald-200 dark:border-emerald-800"
    ),
  },
  exclude: {
    label: "Excluded",
    icon: XCircle,
    styles: cn(
      "bg-red-500/15 text-red-600 dark:text-red-400",
      "border-red-200 dark:border-red-800"
    ),
  },
  maybe: {
    label: "Maybe",
    icon: HelpCircle,
    styles: cn(
      "bg-amber-500/15 text-amber-600 dark:text-amber-400",
      "border-amber-200 dark:border-amber-800"
    ),
  },
  pending: {
    label: "Pending",
    icon: Clock,
    styles: cn(
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
      "border-slate-200 dark:border-slate-700"
    ),
  },
  analyzing: {
    label: "Analyzing",
    icon: Loader2,
    styles: cn(
      "bg-blue-500/15 text-blue-600 dark:text-blue-400",
      "border-blue-200 dark:border-blue-800"
    ),
    iconAnimation: "animate-spin",
  },
};

const sizeConfig = {
  sm: {
    wrapper: "px-2 py-0.5 text-xs gap-1",
    icon: "w-3 h-3",
  },
  md: {
    wrapper: "px-2.5 py-1 text-xs gap-1.5",
    icon: "w-3.5 h-3.5",
  },
};

export function StatusBadge({
  status,
  className,
  showIcon = true,
  size = "md",
}: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        // Base styles
        "inline-flex items-center rounded-full border font-medium",
        // Size
        sizes.wrapper,
        // Status-specific styles
        config.styles,
        // Custom classes
        className
      )}
    >
      {showIcon && (
        <Icon className={cn(sizes.icon, config.iconAnimation)} />
      )}
      <span>{config.label}</span>
    </div>
  );
}

/**
 * Helper function to get status color for use in other components
 */
export function getStatusColor(status: StatusType): string {
  const colorMap: Record<StatusType, string> = {
    include: "#10b981", // emerald-500
    exclude: "#ef4444", // red-500
    maybe: "#f59e0b",   // amber-500
    pending: "#94a3b8", // slate-400
    analyzing: "#3b82f6", // blue-500
  };
  return colorMap[status] || colorMap.pending;
}

/**
 * Helper function to get status border color for card borders
 */
export function getStatusBorderClass(status: StatusType): string {
  const borderMap: Record<StatusType, string> = {
    include: "border-l-emerald-500",
    exclude: "border-l-red-500",
    maybe: "border-l-amber-500",
    pending: "border-l-transparent",
    analyzing: "border-l-blue-500",
  };
  return borderMap[status] || borderMap.pending;
}
